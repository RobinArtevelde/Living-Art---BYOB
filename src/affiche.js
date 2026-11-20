// =====================================================================
// AFFICHE (affiche.html): de QR-code voor op papier.
// De QR-code wijst naar join.html op hetzelfde adres als deze pagina,
// of naar joinUrl uit instellingen.js als die ingevuld is.
// =====================================================================

import QRCode from 'qrcode';
import { INSTELLINGEN } from './instellingen.js';

const adres = INSTELLINGEN.joinUrl ?? new URL('join.html', window.location.href).href;
// Hoge foutcorrectie ('H'): de code blijft leesbaar, ook als het papier wat gekreukt is
QRCode.toCanvas(document.querySelector('#qr'), adres, { width: 900, margin: 1, errorCorrectionLevel: 'H' });
document.querySelector('#adres').textContent = adres;

// Waarschuwing als je de affiche van je eigen computer afdrukt: dat adres werkt niet op een gsm
if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
  document.querySelector('.uitleg').textContent =
    '⚠️ Dit is een adres op je eigen computer (localhost): dat werkt niet op een gsm. ' +
    'Open deze pagina op het echte adres (na firebase deploy) en druk dan af.';
}
