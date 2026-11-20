# Loopzone en uitgeknipte kinderen voor De kinderspelen (Bruegel, 1560).
#
# Het schilderij zit vol kinderen; de vrije zandgrond ertussen is de loopzone.
#   1. Vloer = zandkleurig én rustig (weinig randen: een kind heeft veel lijnen en details).
#   2. Alleen binnen het plein (PLEIN), zonder vaste dingen (UIT: het vat, de boomstam, ...).
#   3. Bruggetjes (VERBINDINGEN) en daarna alleen het grootste aaneengesloten stuk.
#   4. Elk kind/groepje op het plein (wat géén vloer is) wordt een eigen laag met per strook van
#      16 px de onderkant (voetY): zo loop je achter een kind dat vóór je staat.
#      Die lagen zijn bijgesneden (kader) zodat ze weinig geheugen kosten.
#
# Gebruik (in de projectmap):  python3 tools/kinderspelen_zones.py
import json, os, glob
import numpy as np, cv2

MAP = 'public/kinderspelen/'
STROOK = 16
PLEIN = [[330, 1078], [330, 560], [560, 600], [700, 520], [830, 340], [990, 330], [1320, 230], [1700, 250],
         [1920, 330], [1920, 1078]]
UIT = [
    ('ellips', (1050, 850, 70, 85)),  # het grote vat
    ('ellips', (1310, 810, 80, 75)),  # het rollende vat
    ('veelhoek', [[1740, 400], [1920, 380], [1920, 480], [1740, 480]]),  # de boomstam
    ('veelhoek', [[1690, 650], [1920, 640], [1920, 820], [1690, 800]]),  # de stenen
    ('veelhoek', [[560, 980], [660, 980], [660, 1060], [560, 1060]]),  # het putje
]
VERBINDINGEN = []

beeld = cv2.imread(MAP + 'schilderij.jpg')
h, w = beeld.shape[:2]

# 1. Vloer
lab = cv2.cvtColor(cv2.GaussianBlur(beeld, (0, 0), 1.5), cv2.COLOR_BGR2LAB).astype(np.float32)
L, A, B = lab[..., 0], lab[..., 1], lab[..., 2]
afstand = np.sqrt((0.4 * (L - 132)) ** 2 + (1.4 * (A - 136)) ** 2 + (1.2 * (B - 166)) ** 2)
randen = cv2.Canny(cv2.cvtColor(cv2.GaussianBlur(beeld, (0, 0), 1.6), cv2.COLOR_BGR2GRAY), 30, 70)
drukte = cv2.blur((randen > 0).astype(np.float32), (31, 31))
vloer = ((drukte < 0.05) & (afstand < 28)).astype(np.uint8) * 255

# 2. Alleen het plein
plein = np.zeros((h, w), np.uint8)
cv2.fillPoly(plein, [np.array(PLEIN, np.int32)], 255)
for soort, a in UIT:
    if soort == 'ellips':
        cv2.ellipse(plein, (a[0], a[1]), (a[2], a[3]), 0, 0, 360, 0, -1)
    else:
        cv2.fillPoly(plein, [np.array(a, np.int32)], 0)
vloer[plein == 0] = 0
vloer = cv2.morphologyEx(vloer, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
vloer = cv2.morphologyEx(vloer, cv2.MORPH_OPEN, np.ones((21, 21), np.uint8))

# 3. De losse stukken verbinden: telkens de "goedkoopste" weg naar het grootste stuk, over een
#    grof raster (8 px): lopen over vrije grond kost weinig, tussen drukke kinderen door veel.
import heapq
K = 8
kw, kh = w // K, h // K
kost = 1 + 60 * cv2.resize(drukte, (kw, kh), interpolation=cv2.INTER_AREA) + 25 * cv2.resize((afstand > 28).astype(np.float32), (kw, kh), interpolation=cv2.INTER_AREA)
kost[cv2.resize(plein, (kw, kh), interpolation=cv2.INTER_NEAREST) == 0] = 1e6


def verbind(van_masker, naar_masker):
    """Dijkstra van alle cellen van 'van' naar de dichtste cel van 'naar'. Geeft de route (cellen)."""
    van = cv2.resize(van_masker, (kw, kh), interpolation=cv2.INTER_NEAREST) > 0
    naar = cv2.resize(naar_masker, (kw, kh), interpolation=cv2.INTER_NEAREST) > 0
    afst = np.full((kh, kw), np.inf)
    vorige = {}
    rij = []
    for y, x in zip(*np.where(van)):
        afst[y, x] = 0
        heapq.heappush(rij, (0.0, y, x))
    while rij:
        d, y, x = heapq.heappop(rij)
        if d > afst[y, x]:
            continue
        if naar[y, x]:
            weg = [(y, x)]
            while weg[-1] in vorige:
                weg.append(vorige[weg[-1]])
            return weg
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < kh and 0 <= nx < kw:
                nd = d + kost[ny, nx] * (1.414 if dx and dy else 1)
                if nd < afst[ny, nx]:
                    afst[ny, nx] = nd
                    vorige[(ny, nx)] = (y, x)
                    heapq.heappush(rij, (nd, ny, nx))
    return None


while True:
    n, lab_, stats, _ = cv2.connectedComponentsWithStats((vloer > 0).astype(np.uint8), 8)
    grootte = stats[1:, cv2.CC_STAT_AREA]
    hoofd = 1 + int(np.argmax(grootte))
    andere = [i for i in range(1, n) if i != hoofd and stats[i, cv2.CC_STAT_AREA] >= 2500]
    if not andere:
        break
    i = max(andere, key=lambda j: stats[j, cv2.CC_STAT_AREA])
    weg = verbind((lab_ == i).astype(np.uint8) * 255, (lab_ == hoofd).astype(np.uint8) * 255)
    if weg is None:
        vloer[lab_ == i] = 0
        continue
    punten = np.array([[x * K + K // 2, y * K + K // 2] for y, x in weg], np.int32)
    cv2.polylines(vloer, [punten], False, 255, 24)

for lijn, dikte in VERBINDINGEN:
    cv2.polylines(vloer, [np.array(lijn, np.int32)], False, 255, dikte)
n, lab_, stats, _ = cv2.connectedComponentsWithStats((vloer > 0).astype(np.uint8), 8)
grootste = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
print(f'{n - 1} stukken vloer; het grootste: {stats[grootste, cv2.CC_STAT_AREA]} van {int((vloer > 0).sum())} pixels')
loopzone = np.where(lab_ == grootste, 255, 0).astype(np.uint8)
cv2.imwrite(MAP + 'masker.png', loopzone)

# 4. De kinderen: alles op het plein wat geen loopzone is. Per strook van 16 px zoeken we de
#    aparte "stukken" (een kind boven een ander kind) en geven elk zijn eigen voetY (de onderkant).
#    Alles zit in één afbeelding; groepen.json zegt per stuk: [x, boven, hoogte, voetY].
for oud in glob.glob(MAP + 'groep-*.png'):
    os.remove(oud)
figuren = ((loopzone == 0) & (plein > 0)).astype(np.uint8) * 255
figuren[:250] = 0  # de gebouwen bovenaan: daar loopt toch niemand achter
alfa = cv2.GaussianBlur(figuren, (3, 3), 0)
laag = np.dstack([beeld, alfa])
laag[alfa == 0] = 0
cv2.imwrite(MAP + 'groep-kinderen.png', laag)
stukken = []
for sx in range(0, w, STROOK):
    kolom = figuren[:, sx:sx + STROOK].max(1) > 0
    y = 0
    while y < h:
        if not kolom[y]:
            y += 1
            continue
        y0 = y
        while y < h and kolom[y]:
            y += 1
        if y - y0 >= 12:
            stukken.append([sx, y0, y - y0, y - 1])
json.dump({'kinderen': {'afbeelding': 'groep-kinderen.png', 'strook': STROOK, 'stukken': stukken}}, open(MAP + 'groepen.json', 'w'))
print(f'{len(stukken)} stukjes kinderen om achter te lopen')
