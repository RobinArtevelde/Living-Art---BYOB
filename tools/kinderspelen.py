# Maakt public/kinderspelen/schilderij.jpg uit tools/bronnen/kinderspelen.jpg
# (Pieter Bruegel de Oude, De kinderspelen te Bethlehem, 1566, KMSKB Brussel;
#  Google Art Project via Wikimedia Commons, publiek domein).
# 1920 breed; boven gaat een stuk lucht weg, zodat het 16:9 wordt (onderaan blijft alles).
# Gebruik (in de projectmap):  python3 tools/kinderspelen.py
import cv2

im = cv2.imread('tools/bronnen/kinderspelen.jpg')
h, w = im.shape[:2]
hoogte = round(h * 1920 / w)
im = cv2.resize(im, (1920, hoogte), interpolation=cv2.INTER_AREA)
cv2.imwrite('public/kinderspelen/schilderij.jpg', im[hoogte - 1080:], [cv2.IMWRITE_JPEG_QUALITY, 90])
print(f'klaar (bovenaan {hoogte - 1080} px lucht weggesneden)')
