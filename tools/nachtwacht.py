# Maakt public/nachtwacht/schilderij.jpg uit tools/bronnen/nachtwacht.jpg
# (Rembrandt, De Nachtwacht, Wikimedia Commons, publiek domein).
# De zwarte rand en de lijst gaan weg. Het hele schilderij komt in het midden
# (1080 hoog), met links en rechts een wazige, donkere kopie (zoals bij de Vrijheid).
# Gebruik (in de projectmap):  python3 tools/nachtwacht.py
import cv2

im = cv2.imread('tools/bronnen/nachtwacht.jpg')
h, w = im.shape[:2]
doek = im[110:h - 70, 110:w - 95]  # zonder de zwarte rand en de bruine lijst
dh, dw = doek.shape[:2]
breedte = round(dw * 1080 / dh)
midden = cv2.resize(doek, (breedte, 1080), interpolation=cv2.INTER_AREA)

achter = cv2.resize(doek, (1920, round(dh * 1920 / dw)), interpolation=cv2.INTER_AREA)
y = (achter.shape[0] - 1080) // 2
achter = cv2.GaussianBlur(achter[y:y + 1080], (0, 0), 40) * 0.45  # wazig en donker

uit = achter.astype('uint8')
links = (1920 - breedte) // 2
uit[:, links:links + breedte] = midden
cv2.imwrite('public/nachtwacht/schilderij.jpg', uit, [cv2.IMWRITE_JPEG_QUALITY, 90])
print(f'klaar: public/nachtwacht/schilderij.jpg (het doek staat van x={links} tot x={links + breedte})')
