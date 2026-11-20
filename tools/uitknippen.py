# Knipt de voorste geschilderde figuren uit, zodat de mannetjes ACHTER hen kunnen lopen
# (zoals de groepen bij het Lam Gods), en past de loopzone aan zodat niemand nog
# door een geschilderde figuur wandelt.
#
# Per schilderij staat hieronder een lijst figuren: een kader [x1, y1, x2, y2] rond de figuur
# (in wereld-pixels, 1920 x 1080). GrabCut (OpenCV) zoekt binnen dat kader wat figuur is en wat
# achtergrond. Daarna:
#   - public/<id>/groep-<naam>.png : de figuur, met doorzichtige achtergrond
#   - public/<id>/groepen.json     : per strook van 16 px de y van de voeten (voetY)
#   - public/<id>/masker.png       : de loopzone ("vloer" hieronder) min de plek van de figuren
#
# Twee soorten figuren:
#   'staand'  : iemand die rechtop staat. Overal dezelfde voetY (de onderkant van de figuur),
#               want een uitgestoken arm staat even ver als de voeten.
#   'liggend' : iemand die ligt (of een kussen, een sleep). Per strook de eigen onderkant.
# Een vierde (optioneel) element is een zelf getekende omtrek [[x, y], ...]: die komt er altijd bij
# (handig voor donkere figuren die GrabCut niet goed vindt, zoals de kapitein van de Nachtwacht).
# Bij een staande figuur hoort de onderkant van het kader bij de voeten: daar komt de voetY.
#
# Gebruik (in de projectmap):  python3 tools/uitknippen.py kroning nachtwacht vrijheid
# Nodig: pip install opencv-python-headless numpy
import json, os, sys
import numpy as np, cv2

STROOK = 16

SCHILDERIJEN = {
    'volkstelling': {
        # sneeuw en ijs: de vijver links, het plein, en het ijs rechts vooraan
        # Per stuk vloer: 'lokaal' = de geschilderde mensjes zijn donkere vlekken t.o.v. hun omgeving
        # (op de sneeuw én op het donkerdere ijs), die vallen zo vanzelf uit de loopzone.
        # (Het donkere ijs onderaan: geen drempel, daar zorgen de uitgeknipte figuren ervoor.)
        'vloer': [
            ([[250, 215], [700, 200], [700, 330], [640, 420], [590, 505], [460, 505], [410, 410], [320, 330], [250, 250]], 75),
            ([[690, 318], [1700, 322], [1700, 395], [1880, 470], [1880, 585], [1600, 605], [1400, 612], [1215, 600], [1200, 520], [690, 505]], 100),
            ([[1400, 590], [1920, 560], [1920, 930], [1430, 890], [1460, 700]], 'lokaal'),
            ([[1430, 890], [1920, 930], [1920, 1078], [1150, 1078], [1240, 985]], None),
        ],
        # Bruggetjes door open sneeuw/ijs die de losse stukken verbinden (lijn van punten, dikte in px):
        # vijver ↔ plein, plein ↔ ijs rechts (links langs het jongetje), ijs rechts ↔ ijs vooraan
        'verbindingen': [
            ([[630, 365], [700, 380], [760, 420], [800, 450]], 26),
            ([[470, 300], [600, 330], [650, 365]], 24),  # achter de grote boom door
            ([[640, 260], [625, 300], [620, 330]], 22),
            ([[1395, 560], [1412, 600], [1414, 655], [1445, 690], [1455, 750], [1480, 790]], 22),
            ([[1760, 550], [1790, 600]], 22),
        ],
        'alleen_grootste': True,  # alleen het grootste aaneengesloten stuk: zo kan iedereen overal komen
        'uitsluiten': [
            [[1400, 395], [1640, 395], [1640, 590], [1400, 590]],  # het hutje met het besneeuwde dak
            [[360, 345], [650, 345], [650, 415], [360, 415]],  # de boot op het ijs
        ],
        'figuren': [
            ('karren', [690, 505, 1215, 965], 'liggend'),
            ('kar-hout', [600, 480, 890, 965], 'liggend', [[610, 560], [700, 500], [880, 520], [885, 960], [700, 960], [620, 760]]),
            ('ezel-en-maria', [985, 600, 1425, 965], 'liggend'),
            ('boom', [495, 0, 585, 610], 'staand', [[522, 0], [570, 0], [575, 600], [515, 600]]),
            ('hutje', [1400, 395, 1640, 590], 'staand'),
            ('menigte', [0, 560, 700, 1080], 'liggend'),
            ('man-rechts', [1595, 815, 1730, 1068], 'staand'),
            ('vrouw-rechts', [1715, 835, 1850, 1075], 'staand'),
            ('vrouw-kind', [1820, 860, 1920, 990], 'staand'),
            ('gebogen-man', [1480, 690, 1580, 805], 'staand'),
        ],
    },
    'kroning': {
        # het groene tapijt vooraan
        'vloer': [[[0, 1075], [1920, 1075], [1920, 945], [1300, 950], [1000, 942], [600, 960], [0, 1000]]],
        'figuren': [
            ('links-1', [0, 640, 135, 1040], 'staand'),
            ('links-2', [95, 640, 270, 1045], 'staand'),
            ('kussen', [820, 915, 1000, 1020], 'liggend', [[832, 935], [985, 925], [998, 1008], [845, 1018]]),
            ('sleep', [575, 690, 1070, 1000], 'liggend'),
            ('rechts-1', [1285, 615, 1505, 1078], 'staand'),
            ('rechts-2', [1470, 620, 1640, 1065], 'staand'),
            ('rechts-3', [1590, 630, 1760, 1045], 'staand'),
            ('rechts-4', [1700, 620, 1870, 1045], 'staand'),
            ('rechts-5', [1820, 560, 1920, 1010], 'staand'),
        ],
    },
    'nachtwacht': {
        # Een heel donker doek: GrabCut haalt de zwarte kleren niet goed van de donkere achtergrond.
        # Daarom 'precies': de omtrek is met de hand getekend (punten in wereld-pixels), zonder GrabCut.
        # Onderaan in het kader (y2) = waar de voeten staan (voetY).
        'vloer': [[[340, 1078], [1580, 1078], [1580, 975], [1460, 960], [1220, 955], [1000, 945], [700, 925], [460, 935], [340, 960]]],
        # (Geen verbinding vóór de kapitein en de luitenant: dan zou er telkens iemand voor hen staan.
        #  De twee stukken vloer, links en rechts, blijven dus apart.)
        'figuren': [
            ('kapitein', [795, 470, 1065, 1068], 'precies',
             [[862, 478], [965, 478], [1000, 590], [1060, 650], [1060, 715], [1015, 760], [1035, 900],
              [1030, 1068], [828, 1068], [830, 1030], [836, 1000], [836, 925], [805, 915], [800, 860],
              [798, 700], [808, 650], [835, 575]]),
            # de zwarte schutter die links van de kapitein naar voren stapt (zijn voet staat op y 982)
            ('zwarte-schutter', [650, 610, 865, 984], 'precies',
             [[770, 615], [815, 612], [812, 660], [805, 690], [800, 920], [820, 925], [845, 885], [862, 930],
              [850, 962], [828, 960], [800, 932], [768, 934], [738, 932], [738, 918], [762, 905], [772, 870],
              [745, 895], [722, 930], [724, 965], [708, 984], [655, 982], [652, 960], [675, 935], [700, 900],
              [735, 860], [738, 835], [730, 790], [728, 730], [745, 705], [770, 690]]),
            ('luitenant', [1025, 520, 1292, 1052], 'precies',
             [[1045, 575], [1060, 540], [1100, 522], [1150, 525], [1185, 535], [1180, 565], [1160, 590],
              [1170, 615], [1195, 640], [1205, 700], [1205, 768], [1285, 763], [1290, 785], [1222, 795],
              [1225, 850], [1200, 872], [1195, 920], [1205, 1000], [1205, 1045], [1150, 1052], [1030, 1052],
              [1025, 1000], [1040, 940], [1050, 900], [1040, 830], [1030, 780], [1035, 700], [1050, 640],
              [1070, 600]]),
            ('meisje', [630, 622, 788, 922], 'precies',
             [[690, 628], [730, 625], [745, 660], [770, 680], [780, 760], [775, 830], [785, 900], [770, 922],
              [700, 925], [632, 915], [640, 860], [655, 800], [665, 720], [670, 680]]),
            ('rode-schutter', [480, 510, 722, 988], 'precies',
             [[530, 515], [600, 512], [615, 545], [612, 600], [640, 620], [655, 660], [660, 740], [665, 790],
              [700, 830], [722, 862], [700, 872], [660, 845], [640, 862], [632, 900], [630, 960], [640, 985],
              [600, 990], [588, 960], [585, 880], [560, 868], [552, 900], [550, 960], [555, 978], [512, 980],
              [512, 940], [508, 870], [503, 860], [503, 700], [500, 640], [485, 615], [482, 580], [495, 560],
              [520, 560]]),
            ('trommelaar', [1450, 550, 1612, 1006], 'precies',
             [[1500, 560], [1612, 550], [1612, 1005], [1545, 1008], [1540, 960], [1555, 900], [1500, 905],
              [1460, 880], [1450, 820], [1452, 740], [1480, 700], [1485, 660], [1500, 640]]),
            ('links-gebogen', [316, 686, 512, 986], 'precies',
             [[345, 700], [380, 688], [410, 700], [420, 730], [450, 760], [465, 800], [470, 840], [500, 870],
              [512, 900], [500, 920], [470, 915], [440, 905], [420, 915], [418, 950], [420, 975], [395, 985],
              [368, 980], [365, 950], [345, 930], [325, 900], [316, 850], [316, 760], [330, 720]]),
        ],
    },
    'vrijheid': {
        # bovenop de barricade (rechts), en vooraan: daar loop je ACHTER de gesneuvelden
        'vloer': [
            [[1300, 690], [1600, 690], [1600, 790], [1300, 790]],
            [[300, 925], [800, 905], [1620, 960], [1620, 1075], [300, 1075]],
        ],
        'liggend_vrij': True,  # over (achter) liggende figuren mag je lopen
        'figuren': [
            ('vrijheid', [870, 0, 1210, 735], 'staand'),
            ('jongen', [1175, 320, 1425, 700], 'staand',
             [[1205, 285], [1245, 280], [1262, 335], [1360, 335], [1370, 420], [1400, 520], [1420, 640],
              [1390, 700], [1185, 700], [1185, 560], [1200, 440], [1210, 380]]),
            ('hoge-hoed', [495, 250, 770, 810], 'staand'),
            ('sabel', [285, 270, 525, 720], 'staand'),
            ('knielend', [735, 480, 965, 790], 'staand'),
            ('dode-links', [285, 740, 1010, 1080], 'liggend'),
            ('dode-rechts', [790, 770, 1640, 1080], 'liggend'),
        ],
    },
}


def knip(beeld, kader):
    """GrabCut binnen een kader: geeft een masker (0/255) van de figuur terug."""
    x1, y1, x2, y2 = kader
    h, w = beeld.shape[:2]
    # GrabCut heeft een rand achtergrond nodig: kader iets kleiner dan het beeld
    x1, y1 = max(x1, 1), max(y1, 1)
    x2, y2 = min(x2, w - 2), min(y2, h - 2)
    masker = np.zeros((h, w), np.uint8)
    bgd = np.zeros((1, 65), np.float64)
    fgd = np.zeros((1, 65), np.float64)
    cv2.grabCut(beeld, masker, (x1, y1, x2 - x1, y2 - y1), bgd, fgd, 6, cv2.GC_INIT_WITH_RECT)
    uit = np.where((masker == cv2.GC_FGD) | (masker == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    # gaatjes dicht, losse snippers weg, enkel het grootste stuk
    uit = cv2.morphologyEx(uit, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    uit = cv2.morphologyEx(uit, cv2.MORPH_CLOSE, np.ones((41, 3), np.uint8))  # benen aan het lijf
    uit = cv2.morphologyEx(uit, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    # kleine snippers weg (maar losse benen of armen houden)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(uit)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] < 400:
            uit[lab == i] = 0
    return uit


def maak(id_):
    instelling = SCHILDERIJEN[id_]
    map_ = f'public/{id_}/'
    beeld = cv2.imread(map_ + 'schilderij.jpg')
    h, w = beeld.shape[:2]
    groepen = {}
    alle = np.zeros((h, w), np.uint8)
    # Wat beweegt (vlag, gordijn: zie tools/beweeg_maskers.py) mag niet in een uitgeknipte laag
    # zitten, anders ligt er een stilstaand stuk over de beweging. Dus eerst beweeg_maskers.py draaien.
    beweegt = np.zeros((h, w), bool)
    if os.path.exists(map_ + 'beweeg-masker.png'):
        beweegt = cv2.imread(map_ + 'beweeg-masker.png').max(2) > 10

    for naam, kader, soort, *extra in instelling['figuren']:
        if soort == 'precies':  # alleen de getekende omtrek (geen GrabCut, geen ovaal aan de voeten)
            m = np.zeros((h, w), np.uint8)
        else:
            m = knip(beeld, kader)
        telt_mee = not (soort == 'liggend' and instelling.get('liggend_vrij'))
        x1, y1, x2, y2 = kader
        if extra:  # zelf getekende omtrek erbij
            cv2.fillPoly(m, [np.array(extra[0], np.int32)], 255)
        if soort == 'staand':  # de voeten: het onderste stuk van het kader, in het midden
            b = x2 - x1
            cv2.ellipse(m, ((x1 + x2) // 2, y2 - 45), (int(b * 0.3), 50), 0, 0, 360, 255, -1)
            m[y2:] = 0
        if telt_mee:
            alle = np.maximum(alle, m)
        ys, xs = np.where(m > 0)
        if len(xs) == 0:
            print(f'  {naam}: niets gevonden')
            continue
        # De laag: dezelfde pixels als het schilderij, met een zachte rand
        alfa = cv2.GaussianBlur(cv2.dilate(m, np.ones((3, 3), np.uint8)), (5, 5), 0)
        alfa[beweegt] = 0
        laag = np.dstack([beeld, alfa])
        laag[alfa == 0] = 0
        cv2.imwrite(map_ + f'groep-{naam}.png', laag)

        # voetY per strook van 16 px
        x0 = (xs.min() // STROOK) * STROOK
        stroken = []
        voet = int(y2) if soort in ('staand', 'precies') else int(ys.max())
        for x in range(x0, xs.max() + 1, STROOK):
            kolom = m[:, x:x + STROOK]
            rijen = np.where(kolom.max(1) > 0)[0]
            if len(rijen) == 0:
                continue
            stroken.append([int(x), voet if soort in ('staand', 'precies') else int(rijen.max())])
        groepen[naam] = {'afbeelding': f'groep-{naam}.png', 'strook': STROOK, 'stroken': stroken}
        print(f'  {naam:14s} {soort:8s} voetY {voet}  ({len(stroken)} stroken)')

    json.dump(groepen, open(map_ + 'groepen.json', 'w'))

    # Loopzone: de vloer, min de plek waar een geschilderde figuur staat (met wat ruimte)
    vloer = np.zeros((h, w), np.uint8)
    licht = cv2.GaussianBlur(cv2.cvtColor(beeld, cv2.COLOR_BGR2GRAY), (0, 0), 1.5)
    for stuk in instelling['vloer']:
        veelhoek, licht_min = stuk if isinstance(stuk, tuple) else (stuk, None)
        deel = np.zeros((h, w), np.uint8)
        cv2.fillPoly(deel, [np.array(veelhoek, np.int32)], 255)
        if licht_min == 'lokaal':  # donkerder dan de omgeving = een geschilderd mensje (+ een randje)
            omgeving = cv2.GaussianBlur(licht.astype(np.float32), (0, 0), 18)
            donker = cv2.dilate(((licht < omgeving - 24) | (licht < 45)).astype(np.uint8) * 255, np.ones((15, 15), np.uint8))
            deel[donker > 0] = 0
        elif licht_min is not None:  # donkere vlekken (geschilderde mensjes) + een randje eruit
            donker = cv2.dilate((licht < licht_min).astype(np.uint8) * 255, np.ones((15, 15), np.uint8))
            deel[donker > 0] = 0
        vloer = np.maximum(vloer, deel)
    for veelhoek in instelling.get('uitsluiten', []):
        cv2.fillPoly(vloer, [np.array(veelhoek, np.int32)], 0)
    bezet = cv2.dilate(alle, np.ones((25, 25), np.uint8))
    loopzone = np.where((vloer > 0) & (bezet == 0), 255, 0).astype(np.uint8)
    loopzone = cv2.morphologyEx(loopzone, cv2.MORPH_OPEN, np.ones((15, 15), np.uint8))  # geen smalle randjes
    # De bruggetjes komen er ná het opschonen bij
    for lijn, dikte in instelling.get('verbindingen', []):
        brug = np.zeros((h, w), np.uint8)
        cv2.polylines(brug, [np.array(lijn, np.int32)], False, 255, dikte)
        # (ook achter een uitgeknipte figuur, zoals de grote boom: die staat er dan gewoon voor)
        loopzone = np.maximum(loopzone, brug)
    if instelling.get('alleen_grootste'):
        n, lab, stats, _ = cv2.connectedComponentsWithStats((loopzone > 0).astype(np.uint8), 8)
        if n > 1:
            grootste = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
            print(f'  {n - 1} losse stukken; het grootste houdt {stats[grootste, cv2.CC_STAT_AREA]} van {int((loopzone > 0).sum())} pixels')
            loopzone = np.where(lab == grootste, 255, 0).astype(np.uint8)
    cv2.imwrite(map_ + 'masker.png', loopzone)
    print(f'  loopzone: {int((loopzone > 0).sum())} pixels')
    return alle, loopzone


if __name__ == '__main__':
    for id_ in sys.argv[1:] or SCHILDERIJEN:
        print(id_)
        maak(id_)
