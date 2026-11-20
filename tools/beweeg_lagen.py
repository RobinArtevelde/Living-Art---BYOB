# Maakt per schilderij de lagen voor rustige beweging (vlaggen, gordijnen, vaandels, takken),
# zó dat ALLEEN het voorwerp zelf beweegt en niets eromheen:
#
#   public/<id>/voorwerpen.png    : de bewegende voorwerpen, precies uitgeknipt (rest doorzichtig)
#   public/<id>/achtergrond.jpg   : het schilderij met de achtergrond ONDER die voorwerpen
#                                   bijgeschilderd (inpainting). Gaat een gordijn een beetje opzij,
#                                   dan zie je daar muur, geen stilstaande kopie van het gordijn.
#   public/<id>/beweeg-masker.png : hoeveel elke plek beweegt. ROOD = wapperen (vlag),
#                                   GROEN = rustig deinen (gordijn, vaandel, takken).
#                                   Bovenaan vastgemaakt (gordijn) of aan een stok (vlag).
#
# De shader in src/wind.js verschuift alleen voorwerpen.png en legt het over achtergrond.jpg.
#
# Per voorwerp: naam, veelhoek rond het voorwerp, kanaal ('wapper'/'dein'), sterkte (0..1),
# vast ('boven' = bovenaan vast, of [[x1, y1], [x2, y2]] = een stok, of None),
# en hoe het uitgeknipt wordt: 'grabcut', of een kleurregel (functie van b, g, r, licht).
#
# Gebruik (in de projectmap):  python3 tools/beweeg_lagen.py           (alle schilderijen)
#                              python3 tools/beweeg_lagen.py kroning
# Draai daarna tools/uitknippen.py <id> opnieuw (bewegende stukken gaan uit de uitgeknipte figuren).
# Nodig: pip install opencv-python-headless numpy
import os, sys
import numpy as np, cv2

ROOD = lambda b, g, r, l: (r > 90) & (r > g * 1.5) & (r > b * 1.4)
DONKER_OP_LUCHT = lambda b, g, r, l: l < cv2.GaussianBlur(l, (0, 0), 9) - 12  # takken: donkerder dan de lucht eromheen
WIT = lambda b, g, r, l: (l > 150) & (np.abs(r - b) < 60)
GROEN_DONKER = lambda b, g, r, l: (g > r * 1.02) & (l < 125)  # de groene gordijnen (niet het publiek)

# Stukken die NOOIT mogen bewegen, ook al liggen ze in de veelhoek (een hand, een hoofd)
NOOIT = {
    'vrijheid': [('ellips', (965, 25, 45, 40)), ('ellips', (1105, 150, 55, 80)),
                 ('lijn', (965, 25, 1070, 235, 32))],  # de hand, het hoofd en de arm van de Vrijheid
}


def vlag(b, g, r, l):
    rood = (r > 110) & (r > g * 1.7) & (r > b * 1.6)
    wit = (r > 175) & (g > 165) & (b > 150) & (np.abs(r - b) < 70)
    blauw = (b > g * 1.05) & (b > r * 1.05) & (r < 120)
    return rood | wit | blauw


VOORWERPEN = {
    'vrijheid': [
        ('vlag', [[718, 82], [760, 40], [830, 15], [905, 0], [1110, 0], [1105, 95], [1060, 135], [1000, 170],
                  [960, 175], [935, 200], [880, 205], [835, 180], [800, 190], [760, 160], [730, 150]], 'wapper', 1.0,
         [[893, 205], [978, 0]], 'grabcut'),
        ('sjaal', [[875, 240], [1000, 255], [1005, 340], [880, 320]], 'wapper', 0.55, None, ROOD),
        # het rode vlaggetje linksboven, boven de strijders
        ('vlaggetje', [[395, 185], [490, 185], [490, 280], [395, 280]], 'wapper', 0.6, None, ROOD),
    ],
    'kroning': [
        ('gordijn-links', [[690, 0], [845, 0], [835, 330], [700, 330]], 'dein', 1.0, 'boven', GROEN_DONKER),
        ('gordijn-midden', [[945, 0], [1065, 0], [1060, 470], [960, 430]], 'dein', 1.0, 'boven', GROEN_DONKER),
        ('gordijn-rechts', [[1325, 0], [1470, 0], [1460, 340], [1335, 330]], 'dein', 0.9, 'boven', GROEN_DONKER),
    ],
    'nachtwacht': [
        ('vaandel', [[495, 15], [615, 60], [612, 470], [500, 480]], 'dein', 1.0, 'boven', 'grabcut'),
        ('pluim', [[1115, 520], [1190, 515], [1195, 565], [1120, 570]], 'wapper', 0.5, None, WIT),
    ],
    'volkstelling': [
        # vast aan de stam (x ±545): hoe verder ervan, hoe meer de takken wiegen
        ('takken', [[300, 0], [820, 0], [820, 100], [300, 100]], 'dein', 0.4, [[545, 300], [545, 0]], DONKER_OP_LUCHT),
        # het rode uithangbord van de herberg: zwaait zachtjes aan zijn haak (bovenaan vast)
        ('uithangbord', [[1196, 183], [1220, 183], [1220, 213], [1196, 213]], 'dein', 0.5, 'boven',
         lambda b, g, r, l: (r > g * 1.15) & (r > b * 1.2)),
        # de andere kale bomen tegen de lucht: vast aan hun stam, de buitenste takjes wiegen het meest
        ('bomen-links', [[0, 0], [140, 0], [140, 90], [0, 90]], 'dein', 0.35, [[60, 250], [60, 0]], DONKER_OP_LUCHT),
        ('boom-midden', [[840, 0], [960, 0], [960, 60], [840, 60]], 'dein', 0.35, [[905, 300], [905, 0]], DONKER_OP_LUCHT),
        ('boom-rechts-1', [[1180, 0], [1290, 0], [1290, 70], [1180, 70]], 'dein', 0.35, [[1230, 250], [1230, 0]], DONKER_OP_LUCHT),
        ('bomen-rechts', [[1700, 0], [1920, 0], [1920, 120], [1700, 120]], 'dein', 0.4, [[1870, 400], [1870, 0]], DONKER_OP_LUCHT),
    ],
}


def knip(beeld, veelhoek, regel, nooit=()):
    h, w = beeld.shape[:2]
    binnen = np.zeros((h, w), np.uint8)
    cv2.fillPoly(binnen, [np.array(veelhoek, np.int32)], 255)
    for soort, a in nooit:
        if soort == 'ellips':
            cv2.ellipse(binnen, (a[0], a[1]), (a[2], a[3]), 0, 0, 360, 0, -1)
        else:
            cv2.line(binnen, (a[0], a[1]), (a[2], a[3]), 0, a[4])
    if regel == 'grabcut':
        m = np.full((h, w), cv2.GC_BGD, np.uint8)
        m[cv2.dilate(binnen, np.ones((41, 41), np.uint8)) > 0] = cv2.GC_PR_BGD
        m[binnen > 0] = cv2.GC_PR_FGD
        m[cv2.erode(binnen, np.ones((31, 31), np.uint8)) > 0] = cv2.GC_FGD
        bgd, fgd = np.zeros((1, 65)), np.zeros((1, 65))
        cv2.grabCut(beeld, m, None, bgd, fgd, 5, cv2.GC_INIT_WITH_MASK)
        uit = np.isin(m, [cv2.GC_FGD, cv2.GC_PR_FGD])
    else:
        b, g, r = [beeld[..., i].astype(np.float32) for i in range(3)]
        l = cv2.cvtColor(beeld, cv2.COLOR_BGR2GRAY).astype(np.float32)
        uit = regel(b, g, r, l)
    uit = (uit & (binnen > 0)).astype(np.uint8) * 255
    uit = cv2.morphologyEx(uit, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    # kleine gaatjes in het voorwerp dicht (anders zie je stipjes stilstaande achtergrond)
    gaten = 255 - uit
    n, lab, stats, _ = cv2.connectedComponentsWithStats(gaten)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] < 250:
            uit[lab == i] = 255
    n, lab, stats, _ = cv2.connectedComponentsWithStats(uit)  # snippers weg
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] < 60:
            uit[lab == i] = 0
    return uit


def gewicht_vast(vast, veelhoek, h, w):
    """1 = beweegt helemaal, 0 = vast."""
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    if vast == 'boven':
        vh = np.array(veelhoek)
        y1, y2 = vh[:, 1].min(), vh[:, 1].max()
        return np.clip((yy - y1) / max(1, y2 - y1), 0, 1) ** 0.8
    if vast:  # een stok: hoe verder ervan, hoe meer
        p1, p2 = np.array(vast[0], np.float32), np.array(vast[1], np.float32)
        d = p2 - p1
        n = np.array([-d[1], d[0]]) / np.hypot(*d)
        afstand = np.abs((xx - p1[0]) * n[0] + (yy - p1[1]) * n[1])
        return np.clip((afstand - 8) / 140, 0, 1) ** 0.8
    return np.ones((h, w), np.float32)


def maak(id_):
    pad = f'public/{id_}/'
    beeld = cv2.imread(pad + 'schilderij.jpg')
    h, w = beeld.shape[:2]
    alle = np.zeros((h, w), np.uint8)
    wapper = np.zeros((h, w), np.float32)
    dein = np.zeros((h, w), np.float32)
    for naam, veelhoek, kanaal, sterkte, vast, regel in VOORWERPEN[id_]:
        m = knip(beeld, veelhoek, regel, NOOIT.get(id_, []))
        alle = np.maximum(alle, m)
        # gewicht: rond het voorwerp (iets ruimer, zodat het ook naar buiten kan bewegen), zacht verlopend
        veld = cv2.GaussianBlur(cv2.dilate(m, np.ones((31, 31), np.uint8)).astype(np.float32) / 255, (0, 0), 8)
        veld *= gewicht_vast(vast, veelhoek, h, w) * sterkte
        doel = wapper if kanaal == 'wapper' else dein
        np.maximum(doel, veld, out=doel)
        print(f'  {naam:16s} {int((m > 0).sum()):7d} pixels')

    # voorwerpen.png: precies uitgeknipt, met een zachte rand van 1 px
    a = cv2.GaussianBlur(alle, (3, 3), 0)
    laag = np.dstack([beeld, a])
    laag[a == 0] = 0
    cv2.imwrite(pad + 'voorwerpen.png', laag)

    # achtergrond.jpg: onder de voorwerpen bijschilderen (enkel de rand is ooit zichtbaar)
    gat = cv2.dilate(alle, np.ones((7, 7), np.uint8))
    bij = cv2.inpaint(beeld, gat, 9, cv2.INPAINT_TELEA)
    binnen = cv2.GaussianBlur(cv2.erode(gat, np.ones((61, 61), np.uint8)).astype(np.float32) / 255, (0, 0), 6)[..., None]
    cv2.imwrite(pad + 'achtergrond.jpg', (bij * (1 - binnen) + beeld * binnen).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 90])

    masker = np.zeros((h, w, 3), np.uint8)
    masker[..., 2] = np.clip(wapper * 255, 0, 255)
    masker[..., 1] = np.clip(dein * 255, 0, 255)
    cv2.imwrite(pad + 'beweeg-masker.png', masker)
    print(f'klaar: {pad}voorwerpen.png, achtergrond.jpg, beweeg-masker.png')


# STROMEND WATER: geen voorwerp dat opzij gaat, maar water dat langzaam voorbij schuift.
# Het blauwe kanaal van beweeg-masker.png = hoeveel er stroomt (de shader in wind.js schuift het
# water in de stroomrichting, met twee fasen door elkaar zodat je nooit een "naad" ziet).
# Per schilderij: veelhoek van het water, en stukken die NIET mogen stromen (een zwemmer, een stam).
WATER = {
    'kinderspelen': {
        # boven: langs de donkere oeverlijn; onder: langs het gras
        'water': [[176, 64], [215, 62], [260, 55], [300, 48], [340, 42], [375, 36], [420, 32], [452, 30],
                  [472, 52], [440, 68], [380, 80], [330, 92], [280, 102], [230, 118], [176, 136]],
        'niet': [('ellips', (268, 78, 26, 14)), ('ellips', (300, 28, 22, 20)), ('ellips', (347, 36, 15, 13)),
                 ('veelhoek', [[196, 0], [226, 0], [226, 120], [196, 120]]),
                 ('veelhoek', [[440, 0], [462, 0], [462, 80], [440, 80]])],
    },
}


def maak_water(id_):
    pad = f'public/{id_}/'
    instelling = WATER[id_]
    m = np.zeros((1080, 1920), np.uint8)
    cv2.fillPoly(m, [np.array(instelling['water'], np.int32)], 255)
    for soort, a in instelling['niet']:
        if soort == 'ellips':
            cv2.ellipse(m, (a[0], a[1]), (a[2], a[3]), 0, 0, 360, 0, -1)
        else:
            cv2.fillPoly(m, [np.array(a, np.int32)], 0)
    m = cv2.GaussianBlur(m, (0, 0), 3)
    bestand = pad + 'beweeg-masker.png'
    masker = cv2.imread(bestand) if os.path.exists(bestand) else np.zeros((1080, 1920, 3), np.uint8)
    masker[..., 0] = m  # blauw (OpenCV werkt in BGR)
    cv2.imwrite(bestand, masker)
    print(f'klaar: stromend water in {bestand}')


for id_ in sys.argv[1:] or list(VOORWERPEN) + list(WATER):
    if id_ in WATER and id_ not in VOORWERPEN:
        maak_water(id_)
        continue
    print(id_)
    maak(id_)
