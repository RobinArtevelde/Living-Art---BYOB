# Zet het Lam Gods over van de foto van het WANDTAPIJT (oud, public/vol/) naar een scherpe foto
# van het ECHTE paneel van Van Eyck (tools/bronnen/lamgods-echt.jpg, Wikimedia Commons, publiek domein).
#
# Hoe? De twee foto's worden automatisch op elkaar gelegd (SIFT-kenmerken + homografie).
# Daarna wordt elke laag (fontein, altaar, engelen, lam, groepen, zon, duif, horizon) overgezet:
# de VORM (doorzichtigheid) komt van de oude laag, de KLEUREN van het echte schilderij.
# Ook de maskers (loopzone, wind) en alle voetY-getallen gaan mee.
#
# Gebruik (in de projectmap):  python3 tools/lamgods_echt.py
# Nodig: pip install opencv-python-headless numpy
# Resultaat: public/lamgods/ + de getallen voor src/instellingen.js (worden afgedrukt)
import json, os
import numpy as np, cv2

OUD = 'public/vol/'
NIEUW = 'public/lamgods/'
B, H = 1920, 1080
os.makedirs(NIEUW, exist_ok=True)

# 1. Het echte schilderij: 1920 breed, en boven en onder evenveel weg tot 1080 hoog
echt = cv2.imread('tools/bronnen/lamgods-echt.jpg')
hoogte = round(B * echt.shape[0] / echt.shape[1])
echt = cv2.resize(echt, (B, hoogte), interpolation=cv2.INTER_AREA)
boven = (hoogte - H) // 2
schilderij = echt[boven:boven + H]
cv2.imwrite(NIEUW + 'schilderij.jpg', schilderij, [cv2.IMWRITE_JPEG_QUALITY, 90])

# 2. Uitlijnen: welke punten van het wandtapijt horen bij welke punten van het echte paneel?
oud = cv2.imread(OUD + 'schilderij.jpg')
sift = cv2.SIFT_create(8000)
k1, d1 = sift.detectAndCompute(cv2.cvtColor(oud, cv2.COLOR_BGR2GRAY), None)
k2, d2 = sift.detectAndCompute(cv2.cvtColor(schilderij, cv2.COLOR_BGR2GRAY), None)
paren = [a for a, b in cv2.BFMatcher().knnMatch(d1, d2, k=2) if a.distance < 0.75 * b.distance]
p1 = np.float32([k1[a.queryIdx].pt for a in paren])
p2 = np.float32([k2[a.trainIdx].pt for a in paren])
G, goed = cv2.findHomography(p1, p2, cv2.RANSAC, 6.0)  # G: oud → nieuw
print(f'uitgelijnd met {int(goed.sum())} punten')

def punt(x, y):
    """Een punt (x, y) van het oude beeld in het nieuwe beeld."""
    p = G @ np.array([x, y, 1.0])
    return round(p[0] / p[2]), round(p[1] / p[2])

def verplaats(beeld, rand=0):
    return cv2.warpPerspective(beeld, G, (B, H), flags=cv2.INTER_LINEAR, borderValue=rand)

# 3. Maskers: gewoon mee vervormen
for naam in ['masker.png', 'wind-masker.png']:
    m = cv2.imread(OUD + naam, cv2.IMREAD_GRAYSCALE)
    cv2.imwrite(NIEUW + naam, verplaats(m))

# 4. Lagen met doorzichtigheid: vorm van de oude laag, kleur van het echte schilderij
def laag(naam, hoogte_uit=H):
    oud_laag = cv2.imread(OUD + naam, cv2.IMREAD_UNCHANGED)
    alfa = np.zeros((H, B), np.uint8)
    alfa[:oud_laag.shape[0]] = oud_laag[..., 3]
    alfa = verplaats(alfa)
    alfa = cv2.GaussianBlur(alfa, (3, 3), 0)  # zachte rand
    uit = np.dstack([schilderij, alfa])
    uit[alfa == 0] = 0  # waar niets te zien is ook geen kleur bewaren: veel kleiner bestand
    if hoogte_uit < H:
        rijen = np.where(alfa.max(1) > 0)[0]
        hoogte_uit = max(hoogte_uit, int(rijen.max()) + 1)
        uit = uit[:hoogte_uit]
    cv2.imwrite(NIEUW + naam, uit)

for naam in sorted(os.listdir(OUD)):
    if naam.startswith(('voorgrond-', 'groep-')) or naam in ('zon.png', 'duif.png'):
        laag(naam)
laag('horizon.png', hoogte_uit=320)

# 5. De groepen: elke strook van 16 px krijgt zijn nieuwe voetY
groepen = json.load(open(OUD + 'groepen.json'))
for g in groepen.values():
    g['stroken'] = [[x, punt(x + g['strook'] / 2, voetY)[1]] for x, voetY in g['stroken']]
json.dump(groepen, open(NIEUW + 'groepen.json', 'w'))

# 6. De getallen voor instellingen.js (voetY en draaipunten van de voorgrond)
OUDE_GETALLEN = {
    'fontein voetY': (960, 901), 'engel-voor-links voetY': (782, 622), 'engel-voor-links oorsprong': (782, 647),
    'engel-voor-rechts voetY': (1091, 620), 'engel-voor-rechts oorsprong': (1091, 648),
    'engelen-rechts voetY': (1158, 518), 'engelen-rechts oorsprong': (1158, 546),
    'vleugel-rechts oorsprong': (1116, 325), 'engelen-links voetY': (722, 496),
    'engelen-links oorsprong': (722, 523), 'vleugel-links oorsprong': (731, 374),
    'altaar voetY': (930, 459), 'lam voetY': (931, 460), 'lam oorsprong': (931, 381),
    'lamkop oorsprong': (906, 310), 'zon midden': (950, 12), 'duif midden': (953, 7),
}
for naam, (x, y) in OUDE_GETALLEN.items():
    print(f'{naam:28s} oud {x:5d},{y:5d}  →  nieuw {punt(x, y)}')
