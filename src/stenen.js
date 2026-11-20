// =====================================================================
// STENEN GOOIEN (klik op de muur) + rook- en stofwolkjes
// =====================================================================

const VLIEGTIJD = 0.55; // seconden
const BOOGHOOGTE = 260; // hoe hoog de steen boogt

// Een steen die van onderaan het scherm in een boog naar (doelX, doelY) vliegt
export class Steen {
  constructor(doelX, doelY, eindSchaal, laag) {
    this.startX = doelX + (Math.random() - 0.5) * 400;
    this.startY = 1160; // net onder het scherm: "de bezoeker gooit"
    this.doelX = doelX;
    this.doelY = doelY;
    this.eindSchaal = eindSchaal;
    this.tijd = 0;
    this.element = document.createElement('div');
    this.element.className = 'steen';
    laag.appendChild(this.element);
  }

  // Geeft true terug als de steen geland is
  update(dt) {
    this.tijd += dt;
    const t = Math.min(this.tijd / VLIEGTIJD, 1);
    const x = this.startX + (this.doelX - this.startX) * t;
    let y = this.startY + (this.doelY - this.startY) * t;
    y -= Math.sin(t * Math.PI) * BOOGHOOGTE;
    const schaal = 1.8 + (this.eindSchaal - 1.8) * t; // dichtbij groot, ver weg klein
    const draai = t * 720;
    this.element.style.transform = `translate(${x}px, ${y}px) scale(${schaal}) rotate(${draai}deg)`;
    if (t >= 1) {
      this.element.remove();
      return true;
    }
    return false;
  }
}

// Een wolkje van blokjes: soort = 'rook' (wit, Minecraft-stijl) of 'stof' (bruin, steen mist)
export function maakWolkje(laag, x, y, schaal, soort) {
  const wolk = document.createElement('div');
  wolk.className = 'wolkje ' + soort;
  wolk.style.transform = `translate(${x}px, ${y}px) scale(${schaal})`;
  wolk.style.zIndex = Math.round(y) + 1;
  const aantal = soort === 'rook' ? 14 : 6;
  for (let i = 0; i < aantal; i++) {
    const deeltje = document.createElement('div');
    deeltje.className = 'deeltje';
    deeltje.style.setProperty('--dx', (Math.random() - 0.5) * 120 + 'px');
    deeltje.style.setProperty('--dy', -(30 + Math.random() * 90) + 'px');
    deeltje.style.setProperty('--grootte', 14 + Math.random() * 18 + 'px');
    deeltje.style.animationDelay = Math.random() * 0.12 + 's';
    wolk.appendChild(deeltje);
  }
  laag.appendChild(wolk);
  setTimeout(() => wolk.remove(), 1200);
}
