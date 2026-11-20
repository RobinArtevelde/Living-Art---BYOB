# Het Lam Gods "netjes" maken, zodat er NIETS extra meebeweegt:
#
# 1. Windmasker: alleen echt gebladerte (struiken en bomen) ritselt, niet het gras eronder en
#    niet de lucht erboven. We houden het oude windmasker, maar enkel waar het schilderij
#    "bladerig" is: donker-groen en met veel fijne structuur.
# 2. Onder alles wat beweegt (lam, kop, engelen, vleugels, de engelen vooraan, de duif) wordt het
#    schilderij zelf bijgeschilderd (inpainting). Anders blijft er een stilstaande kopie onder het
#    bewegende stuk staan ("geestbeeld") die je ziet als het een beetje opzij gaat.
# 3. Waar een stuk apart beweegt (de kop van het lam, de vleugels), wordt het uit de grotere laag
#    (het lam, de engelen) gehaald en daar bijgeschilderd: anders beweegt de kop twee keer.
#
# Werkt op public/lamgods/ en bewaart de originelen éénmalig in tools/bronnen/lamgods-origineel/.
# Gebruik (in de projectmap):  python3 tools/lamgods_netjes.py
import os, shutil
import numpy as np, cv2

MAP = 'public/lamgods/'
BRON = 'tools/bronnen/lamgods-origineel/'
BEWEGEND = ['voorgrond-lam', 'voorgrond-lamkop', 'voorgrond-engelen-links', 'voorgrond-engelen-rechts',
            'voorgrond-vleugel-links', 'voorgrond-vleugel-rechts', 'voorgrond-engel-voor-links',
            'voorgrond-engel-voor-rechts', 'duif']

# Originelen bewaren (zo kan je dit script altijd opnieuw draaien)
os.makedirs(BRON, exist_ok=True)
for naam in ['schilderij.jpg', 'wind-masker.png'] + [n + '.png' for n in BEWEGEND]:
    if not os.path.exists(BRON + naam):
        shutil.copy(MAP + naam, BRON + naam)

beeld = cv2.imread(BRON + 'schilderij.jpg')
laag = {n: cv2.imread(BRON + n + '.png', cv2.IMREAD_UNCHANGED) for n in BEWEGEND}


def alfa(n):
    return laag[n][..., 3]


# --- 1. Windmasker: alleen gebladerte ---
wind = cv2.imread(BRON + 'wind-masker.png', cv2.IMREAD_GRAYSCALE).astype(np.float32) / 255
grijs = cv2.cvtColor(beeld, cv2.COLOR_BGR2GRAY).astype(np.float32)
gem = cv2.blur(grijs, (9, 9))
structuur = np.sqrt(np.maximum(cv2.blur(grijs * grijs, (9, 9)) - gem * gem, 0))
b, g, r = [beeld[..., i].astype(np.float32) for i in range(3)]
lucht = (b > r + 10) & (b > g - 5) & (grijs > 120)  # blauwig en licht
blad = (structuur > 14) & (grijs < 150) & ~lucht
blad = cv2.morphologyEx(blad.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
blad = cv2.morphologyEx(blad, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
# geen figuren (de groepen staan erop)
for n in ['groep-belijders-achter', 'groep-maagden-achter']:
    a = cv2.imread(MAP + n + '.png', cv2.IMREAD_UNCHANGED)[..., 3]
    blad[cv2.dilate(a, np.ones((9, 9), np.uint8)) > 0] = 0
wind = np.clip((wind - 0.15) / 0.85, 0, 1)  # de zwakke uitlopers weg (die lieten het gras trillen)
wind[460:] = 0  # onder de struiken: alleen nog gras en mensen, die ritselen niet
nieuw = wind * cv2.GaussianBlur(blad.astype(np.float32), (0, 0), 2.5)
nieuw[nieuw < 0.06] = 0
cv2.imwrite(MAP + 'wind-masker.png', np.clip(nieuw * 255, 0, 255).astype(np.uint8))

# --- 1b. De bewegende lagen opnieuw en strakker uitknippen ---
# De oude lagen kwamen van het wandtapijt en bevatten nog stukken gras. Met GrabCut knippen we ze
# opnieuw uit het echte paneel: gras (groen, verzadigd) is "waarschijnlijk achtergrond".
lab = cv2.cvtColor(cv2.GaussianBlur(beeld, (0, 0), 1.2), cv2.COLOR_BGR2LAB).astype(np.int16)
# het gras is donker olijfgroen: niet licht, een beetje groen (a* < 128) en geelachtig (b* > 128)
L, A, B = lab[..., 0], lab[..., 1], lab[..., 2]
gras = (L < 150) & (A < 127) & (B > 136)
gras_zeker = (L < 125) & (A < 125) & (B > 138)
for n in BEWEGEND:
    if n == 'duif':
        continue
    oud = alfa(n) > 0
    m = np.full(oud.shape, cv2.GC_BGD, np.uint8)
    m[cv2.dilate(oud.astype(np.uint8), np.ones((25, 25), np.uint8)) > 0] = cv2.GC_PR_BGD
    m[oud & ~gras] = cv2.GC_PR_FGD
    m[oud & gras_zeker] = cv2.GC_BGD
    m[cv2.erode((oud & ~gras).astype(np.uint8), np.ones((9, 9), np.uint8)) > 0] = cv2.GC_FGD
    ys, xs = np.where(m != cv2.GC_BGD)
    y1, y2, x1, x2 = max(ys.min() - 5, 0), ys.max() + 5, max(xs.min() - 5, 0), xs.max() + 5
    stuk = m[y1:y2, x1:x2].copy()
    bgd, fgd = np.zeros((1, 65)), np.zeros((1, 65))
    cv2.grabCut(np.ascontiguousarray(beeld[y1:y2, x1:x2]), stuk, None, bgd, fgd, 5, cv2.GC_INIT_WITH_MASK)
    nieuw = np.zeros(oud.shape, np.uint8)
    nieuw[y1:y2, x1:x2] = np.isin(stuk, [cv2.GC_FGD, cv2.GC_PR_FGD]) * 255
    nieuw = cv2.morphologyEx(nieuw, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    nieuw = cv2.morphologyEx(nieuw, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    l = laag[n].copy()
    l[..., :3] = beeld  # kleuren van het echte paneel
    l[..., 3] = nieuw
    if n == 'voorgrond-lam':
        l[390:] = 0  # het altaar en de kelk onder de hoeven bewegen niet mee
    l[l[..., 3] == 0] = 0
    laag[n] = l
    print(f'  {n:28s} oud {int(oud.sum()):6d}  nieuw {int((nieuw > 0).sum()):6d} pixels')

# --- 3. Kop uit het lam, vleugels uit de engelen ---
def haal_uit(groot, klein):
    """Haalt 'klein' uit de laag 'groot': daar bijgeschilderd met de kleuren van 'groot' zelf."""
    g = laag[groot].copy()
    gat = cv2.dilate((alfa(klein) > 0).astype(np.uint8) * 255, np.ones((5, 5), np.uint8))
    gat[alfa(groot) == 0] = 0
    g[..., :3] = cv2.inpaint(g[..., :3], gat, 7, cv2.INPAINT_TELEA)
    # Wat buiten het lichaam van de grote laag uitsteekt (een vleugelpunt) mag weg:
    # de vleugel zelf tekent het nu. Alleen een smalle aanzet aan het lichaam blijft staan.
    lichaam = cv2.erode((alfa(groot) > 0).astype(np.uint8), np.ones((15, 15), np.uint8))
    g[..., 3] = np.where((gat > 0) & (lichaam == 0), 0, g[..., 3])
    laag[groot] = g


haal_uit('voorgrond-lam', 'voorgrond-lamkop')
haal_uit('voorgrond-engelen-links', 'voorgrond-vleugel-links')
haal_uit('voorgrond-engelen-rechts', 'voorgrond-vleugel-rechts')

# Randen 1 px strakker en zacht: zo beweegt er geen randje gras mee
for n in BEWEGEND:
    a = alfa(n)
    a = cv2.GaussianBlur(cv2.erode(a, np.ones((3, 3), np.uint8)), (3, 3), 0)
    laag[n][..., 3] = a
    laag[n][a == 0] = 0
    cv2.imwrite(MAP + n + '.png', laag[n])

# --- 2. Het schilderij bijschilderen onder alles wat beweegt ---
onder = np.zeros(beeld.shape[:2], np.uint8)
for n in BEWEGEND:
    onder = np.maximum(onder, (cv2.imread(BRON + n + '.png', cv2.IMREAD_UNCHANGED)[..., 3] > 0).astype(np.uint8) * 255)
onder = cv2.dilate(onder, np.ones((7, 7), np.uint8))
# Niet onder vaste dingen bijschilderen die erover liggen (altaar, fontein): die laag dekt het toch af
geheel = cv2.inpaint(beeld, onder, 9, cv2.INPAINT_TELEA)
# Alleen een rand van ±25 px binnen de vorm is ooit zichtbaar (zo ver beweegt niets); daar komt het
# bijgeschilderde stuk. Dieper binnenin blijft het origineel staan (dat is toch altijd bedekt).
binnen = cv2.erode(onder, np.ones((51, 51), np.uint8))
zacht = cv2.GaussianBlur(binnen.astype(np.float32) / 255, (0, 0), 6)[..., None]
geheel = (geheel * (1 - zacht) + beeld * zacht).astype(np.uint8)
cv2.imwrite(MAP + 'schilderij.jpg', geheel, [cv2.IMWRITE_JPEG_QUALITY, 90])
print('klaar: windmasker, lagen en bijgeschilderd schilderij in', MAP)
