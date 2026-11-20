# Maakt public/<id>/beweeg-masker.png: welke delen van een schilderij rustig bewegen.
#   ROOD  = wapperen (een vlag, een sjaal in de wind)
#   GROEN = rustig deinen (gordijnen, vaandels, de zoom van een jurk)
# Hoe lichter, hoe meer het beweegt. Gebruikt door de effect-soort 'golf' (src/effecten.js + wind.js).
#
# Per gebied: een veelhoek, het kanaal ('wapper' of 'dein'), hoe sterk (0..1), en of de beweging
# naar onder toe sterker wordt ('onder': het bovenste stuk hangt vast, zoals bij een gordijn).
# Gebruik (in de projectmap):  python3 tools/beweeg_maskers.py
import os
import numpy as np, cv2

GEBIEDEN = {
    'kroning': [
        # groene gordijnen rond het venster in het midden
        ([[690, 0], [840, 0], [835, 470], [700, 470]], 'dein', 1.0, True),
        ([[950, 0], [1065, 0], [1060, 480], [965, 440]], 'dein', 1.0, True),
        # het groene gordijn rechts, achter de kandelaars
        ([[1330, 0], [1465, 0], [1455, 340], [1340, 320]], 'dein', 0.9, True),
        # de rode baldakijn linksboven
        ([[0, 0], [450, 0], [450, 115], [0, 115]], 'dein', 0.5, True),
    ],
    'nachtwacht': [
        # het grote vaandel links (hangt aan de stok, onderaan beweegt het meest)
        ([[495, 15], [615, 60], [612, 570], [500, 560]], 'dein', 1.0, True),
        # de witte pluim op de hoed van de luitenant
        ([[1115, 520], [1190, 515], [1195, 565], [1120, 570]], 'wapper', 0.5, False),
    ],
    'volkstelling': [
        # de kale takken van de grote boom wiegen een beetje in de wind
        ([[300, 0], [820, 0], [820, 175], [300, 175]], 'dein', 0.35, False),
        # het uithangbord van de herberg wappert
        ([[1195, 200], [1250, 200], [1250, 255], [1195, 255]], 'wapper', 0.6, False),
    ],
    'vrijheid': [
        # de rode sjaal die van de Vrijheid wegwaait
        ([[875, 240], [1000, 255], [1005, 340], [880, 320]], 'wapper', 0.7, False),
        # de zoom van haar jurk
        ([[930, 470], [1170, 470], [1190, 700], [915, 700]], 'dein', 0.55, True),
    ],
}


def maak(id_):
    pad = f'public/{id_}/'
    h, w = 1080, 1920
    wapper = np.zeros((h, w), np.float32)
    dein = np.zeros((h, w), np.float32)
    # De vlag van de Vrijheid heeft al een eigen masker (tools/vlag_masker.py)
    if os.path.exists(pad + 'vlag-masker.png'):
        vlag = cv2.imread(pad + 'vlag-masker.png', cv2.IMREAD_GRAYSCALE)
        wapper = np.maximum(wapper, vlag / 255.0)
    for veelhoek, kanaal, sterkte, onder in GEBIEDEN.get(id_, []):
        vh = np.array(veelhoek, np.int32)
        m = np.zeros((h, w), np.float32)
        cv2.fillPoly(m, [vh], 1.0)
        if onder:  # bovenaan vast, onderaan het meest
            y1, y2 = vh[:, 1].min(), vh[:, 1].max()
            verloop = np.clip((np.arange(h) - y1) / max(1, y2 - y1), 0, 1) ** 0.8
            m *= verloop[:, None]
        m = cv2.GaussianBlur(m, (0, 0), 10) * sterkte
        doel = wapper if kanaal == 'wapper' else dein
        np.maximum(doel, m, out=doel)
    beeld = np.zeros((h, w, 3), np.uint8)
    beeld[..., 2] = np.clip(wapper * 255, 0, 255)  # rood (OpenCV werkt in BGR)
    beeld[..., 1] = np.clip(dein * 255, 0, 255)  # groen
    cv2.imwrite(pad + 'beweeg-masker.png', beeld)
    print(f'klaar: {pad}beweeg-masker.png')


for id_ in GEBIEDEN:
    maak(id_)
