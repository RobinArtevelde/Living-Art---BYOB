# Maakt public/vernis.png: een grijze laag met de structuur van oud schilderslinnen en
# craquelé (de fijne barstjes in oude verf). Die laag ligt met mix-blend-mode: overlay over
# het schilderij én over de mannetjes, zodat alles lijkt alsof het samen geschilderd is.
# 128 (middengrijs) = geen verschil; lichter = lichter, donkerder = donkerder.
# Gebruik (in de projectmap):  python3 tools/vernis.py
import numpy as np, cv2

B, H = 1920, 1080
rng = np.random.default_rng(1432)  # het jaar van het Lam Gods: altijd hetzelfde resultaat
laag = np.full((H, B), 128.0)

# 1. Linnen: horizontale en verticale draden met kleine onregelmatigheden
yy, xx = np.mgrid[0:H, 0:B].astype(np.float32)
draad_x = np.sin(xx * 2.1 + rng.normal(0, 1, (1, B)).cumsum(1) * 0.05)
draad_y = np.sin(yy * 2.3 + rng.normal(0, 1, (H, 1)).cumsum(0) * 0.05)
laag += (draad_x * draad_y) * 5

# 2. Korrel
laag += cv2.GaussianBlur(rng.normal(0, 7, (H, B)).astype(np.float32), (0, 0), 0.8)

# 3. Craquelé: de randen van onregelmatige "eilandjes" (Voronoi-cellen) worden fijne donkere barstjes
punten = rng.uniform([0, 0], [B, H], (2600, 2)).astype(np.float32)
subdiv = cv2.Subdiv2D((0, 0, B, H))
for p in punten:
    subdiv.insert((float(p[0]), float(p[1])))
facetten, _ = subdiv.getVoronoiFacetList([])
barst = np.zeros((H, B), np.uint8)
for f in facetten:
    vh = f.astype(np.int32)
    # licht gebogen randen: elk hoekpunt een beetje verschuiven
    vh = vh + rng.integers(-3, 4, vh.shape).astype(np.int32)
    cv2.polylines(barst, [vh], True, 255, 1, cv2.LINE_AA)
barst = cv2.GaussianBlur(barst.astype(np.float32), (0, 0), 0.6)
laag -= barst / 255 * 18
# een heel klein lichtrandje naast elke barst (de opgekrulde verf vangt licht)
laag += np.roll(barst, 1, axis=0) / 255 * 8

cv2.imwrite('public/vernis.png', np.clip(laag, 0, 255).astype(np.uint8), [cv2.IMWRITE_PNG_COMPRESSION, 9])
print('klaar: public/vernis.png')
