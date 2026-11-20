# Maakt public/vrijheid/vlag-masker.png: wit = deze pixels golven mee (de vlag van de Vrijheid).
# Hoe verder van de vlaggenstok, hoe witter (de doek beweegt meer aan het uiteinde).
# Gebruik (in de projectmap):  python3 tools/vlag_masker.py
# Nodig: pip install opencv-python-headless numpy
import numpy as np, cv2

im = cv2.imread('public/vrijheid/schilderij.jpg').astype(np.float32)
b, g, r = im[..., 0], im[..., 1], im[..., 2]
H, W = r.shape
yy, xx = np.mgrid[0:H, 0:W]

# Alleen zoeken rond de vlag (in wereld-pixels)
gebied = (xx >= 700) & (xx <= 1120) & (yy <= 215)
rood = (r > 110) & (r > g * 1.7) & (r > b * 1.6)
wit = (r > 175) & (g > 165) & (b > 150) & (np.abs(r - b) < 70)
blauw = (b > g * 1.05) & (b > r * 1.05) & (r < 120)
m = (gebied & (rood | wit | blauw)).astype(np.uint8) * 255
m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))

# Alleen de grote stukken houden (geen losse wolkjes)
n, lab, stats, _ = cv2.connectedComponentsWithStats(m)
vlag = np.zeros_like(m)
for i in range(1, n):
    if stats[i, cv2.CC_STAT_AREA] > 800:
        vlag[lab == i] = 255
vlag = cv2.dilate(vlag, np.ones((11, 11), np.uint8))  # iets ruimer, zodat de rand ook mee golft

# De stok loopt van (893, 205) naar (978, 0). Vlak bij de stok beweegt niets.
p1, p2 = np.array([893, 205.0]), np.array([978, 0.0])
d = p2 - p1
normaal = np.array([-d[1], d[0]]) / np.hypot(*d)
afstand = np.abs((xx - p1[0]) * normaal[0] + (yy - p1[1]) * normaal[1])
gewicht = np.clip((afstand - 10) / 140, 0, 1) ** 0.8

# De hand, de arm en het hoofd van de Vrijheid blijven stil
hand = ((xx - 965) ** 2 / 45 ** 2 + (yy - 25) ** 2 / 40 ** 2) < 1
hoofd = ((xx - 1105) ** 2 / 55 ** 2 + (yy - 150) ** 2 / 80 ** 2) < 1
a1, a2 = np.array([965, 25.0]), np.array([1070, 235.0])  # van de hand naar de schouder
ad = a2 - a1
t = np.clip(((xx - a1[0]) * ad[0] + (yy - a1[1]) * ad[1]) / (ad @ ad), 0, 1)
arm = np.hypot(xx - (a1[0] + t * ad[0]), yy - (a1[1] + t * ad[1])) < 32
hand = hand | hoofd | arm

masker = (vlag / 255.0) * gewicht
masker[hand] = 0
masker = cv2.GaussianBlur(masker, (0, 0), 6)
cv2.imwrite('public/vrijheid/vlag-masker.png', np.clip(masker * 255, 0, 255).astype(np.uint8))
print('klaar: public/vrijheid/vlag-masker.png')
