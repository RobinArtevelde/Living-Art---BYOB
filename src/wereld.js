// =====================================================================
// DE WERELD: waar mag je lopen, en hoe groot ben je op welke hoogte?
// Leest het masker (wit = loopbaar, zwart = niet loopbaar).
// =====================================================================

import { INSTELLINGEN } from './instellingen.js';

export class Wereld {
  constructor() {
    this.breedte = INSTELLINGEN.breedte;
    this.hoogte = INSTELLINGEN.hoogte;
    this.pixels = null; // de pixels van het masker (RGBA)
  }

  // Laadt het masker en leest alle pixels één keer in
  async laad(url) {
    const afbeelding = new Image();
    afbeelding.src = url;
    await afbeelding.decode();

    const canvas = document.createElement('canvas');
    canvas.width = this.breedte;
    canvas.height = this.hoogte;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(afbeelding, 0, 0, this.breedte, this.hoogte);
    this.pixels = ctx.getImageData(0, 0, this.breedte, this.hoogte).data;
  }

  // Mag je op dit punt staan? (wit in het masker)
  isLoopbaar(x, y) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.breedte || y >= this.hoogte) return false;
    const i = (y * this.breedte + x) * 4;
    return this.pixels[i] > 128; // rood-kanaal > 128 = licht = loopbaar
  }

  // Een willekeurig punt waar je mag staan (of null als er geen is)
  willekeurigPunt() {
    for (let poging = 0; poging < 2000; poging++) {
      const x = Math.random() * this.breedte;
      const y = Math.random() * this.hoogte;
      if (this.isLoopbaar(x, y)) return { x, y };
    }
    return null;
  }

  // Kan je in een rechte lijn van (x1,y1) naar (x2,y2) wandelen zonder door een verboden zone?
  // We controleren elke 4 pixels.
  isVrijPad(x1, y1, x2, y2) {
    const afstand = Math.hypot(x2 - x1, y2 - y1);
    const stappen = Math.ceil(afstand / 4);
    for (let i = 0; i <= stappen; i++) {
      const t = stappen === 0 ? 0 : i / stappen;
      if (!this.isLoopbaar(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t)) return false;
    }
    return true;
  }

  // Hoe groot is een figuur op hoogte y? (perspectief: verder weg = kleiner)
  schaalOp(y) {
    const { horizonY, onderkantY, schaalHorizon, schaalOnderaan } = INSTELLINGEN;
    let t = (y - horizonY) / (onderkantY - horizonY); // 0 op de horizon, 1 onderaan
    t = Math.min(1, Math.max(0, t));
    return schaalHorizon + (schaalOnderaan - schaalHorizon) * t;
  }
}
