// =====================================================================
// SFEER: de bewegende achtergrond.
//   - draaiende zonnestralen, gloeiende zon en de duif (Heilige Geest)
//   - wolken die achter de horizon voorbij drijven
//   - zwermen vogels
//   - wind: struiken die ritselen (wind.js), windvlagen en blaadjes
// Instellingen: INSTELLINGEN.sfeer in instellingen.js
// =====================================================================

import { INSTELLINGEN } from './instellingen.js';
import { maakWindLaag } from './wind.js';

const BREEDTE = 1920;

function tussen(min, max) {
  return min + Math.random() * (max - min);
}

function maakElement(tag, klasse, ouder) {
  const el = document.createElement(tag);
  el.className = klasse;
  ouder.appendChild(el);
  return el;
}

// Een zachte wolk: een paar wazige ellipsen (SVG)
let wolkTeller = 0;
function wolkSVG(breedte) {
  const hoogte = breedte * 0.4;
  const filterId = 'wolkvaag' + ++wolkTeller;
  let bollen = '';
  const aantal = 5 + Math.floor(Math.random() * 4);
  for (let i = 0; i < aantal; i++) {
    const cx = breedte * tussen(0.2, 0.8);
    const rx = breedte * tussen(0.12, 0.24);
    const ry = rx * tussen(0.35, 0.6);
    bollen += `<ellipse cx="${cx}" cy="${hoogte * tussen(0.4, 0.65)}" rx="${rx}" ry="${ry}"/>`;
  }
  return `<svg viewBox="0 0 ${breedte} ${hoogte}" width="${breedte}" height="${hoogte}" overflow="visible">
    <filter id="${filterId}" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="${breedte / 28}"/></filter>
    <g filter="url(#${filterId})">
      <g fill="#c9cfcf" transform="translate(0 4)">${bollen}</g>
      <g fill="#f7f2e4">${bollen}</g>
    </g>
  </svg>`;
}

const VOGEL_SVG = `<svg viewBox="0 0 40 16"><path d="M2 12 Q11 1 20 10 Q29 1 38 12" fill="none" stroke="#2b2b33" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const WINDSTREEP_SVG = `<svg viewBox="0 0 260 40"><path d="M4 24 Q60 4 120 22 T236 18 q14 -2 14 -12 q0 -8 -9 -6" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round"/></svg>`;
const BLAADJE_KLEUREN = ['#ece4cf', '#ece4cf', '#e3c9c6', '#d8b25a', '#7d9448', '#a8483a']; // bloesem en blaadjes

export class Sfeer {
  // wereld = #wereld, voor = het element waarvoor de sfeerlagen komen (de mannetjes-laag)
  constructor(wereld, voor) {
    this.instellingen = INSTELLINGEN.sfeer;
    this.tijd = 0;
    this.wind = 1;
    this.vlaag = 0;
    this.volgendeVlaag = tussen(4, 10);
    this.volgendeZwerm = tussen(2, 6);
    this.blaadjesTeller = 0;

    const lagen = document.createDocumentFragment();

    // 1. Lucht: zonnestralen en wolken (achter de horizon)
    const lucht = maakElement('div', 'sfeer-laag', lagen);
    const [zonX, zonY] = this.instellingen.zon.midden;
    this.stralen = maakElement('img', 'zon', lucht);
    this.stralen.src = 'stralen.png';
    this.stralen.alt = '';
    this.stralen.style.left = zonX - 340 + 'px';
    this.stralen.style.top = zonY - 340 + 'px';
    this.stralen.style.opacity = this.instellingen.stralenSterkte;

    this.wolken = [];
    for (let i = 0; i < this.instellingen.aantalWolken; i++) {
      const breedte = tussen(...this.instellingen.wolkGrootte);
      const el = maakElement('div', 'wolk', lucht);
      el.innerHTML = wolkSVG(breedte);
      this.wolken.push({
        el,
        breedte,
        x: tussen(-breedte, BREEDTE),
        y: tussen(...this.instellingen.wolkHoogte),
        snelheid: tussen(6, 16) * (breedte / 300),
      });
    }

    // 2. De horizon (bomen, steden) over de wolken
    const horizon = maakElement('img', 'horizon', lagen);
    horizon.src = this.instellingen.horizon;
    horizon.alt = '';

    // 3. De zon en de duif, die zacht bewegen (CSS-animatie)
    for (const [sleutel, klasse] of [
      ['zon', 'zon-gloed'],
      ['duif', 'duif'],
    ]) {
      const instelling = this.instellingen[sleutel];
      if (!instelling) continue;
      const img = maakElement('img', 'boom ' + klasse, lagen);
      img.src = instelling.afbeelding;
      img.alt = '';
      img.style.transformOrigin = `${instelling.midden[0]}px ${instelling.midden[1]}px`;
    }

    // 4. Optionele losse bomen die buigen in de wind
    this.bomen = this.instellingen.bomen.map((boom) => {
      const img = maakElement('img', 'boom', lagen);
      img.src = boom.afbeelding;
      img.alt = '';
      img.style.transformOrigin = `0 ${boom.voetY}px`;
      return { el: img, buig: boom.buig, fase: Math.random() * 6 };
    });

    // 5. Vogels
    this.vogelLaag = maakElement('div', 'sfeer-laag', lagen);
    this.vogels = [];

    wereld.insertBefore(lagen, voor);

    // 6. Wind in de struiken: schilderij en horizon worden WebGL-canvassen
    this.windLagen = [];
    if (this.instellingen.windMasker) {
      const schilderij = wereld.querySelector('#schilderij');
      for (const img of [schilderij, horizon]) {
        maakWindLaag(img, this.instellingen.windMasker, 0).then((laag) => {
          if (laag) this.windLagen.push(laag);
        });
      }
    }

    // 7. Windstrepen en blaadjes vóór alles
    this.windLaag = maakElement('div', 'sfeer-laag wind-laag', wereld);
    this.blaadjes = [];
  }

  // Elke frame (dt = seconden)
  update(dt) {
    this.tijd += dt;
    const t = this.tijd;
    this.updateWind(dt);

    const puls = 1 + Math.sin(t * 0.8) * 0.04;
    this.stralen.style.transform = `rotate(${t * 3}deg) scale(${puls})`;

    for (const laag of this.windLagen) laag.teken(t, this.wind);

    for (const wolk of this.wolken) {
      wolk.x += wolk.snelheid * this.wind * dt;
      if (wolk.x > BREEDTE + 20) {
        // rechts uit beeld: links opnieuw beginnen
        wolk.x = -wolk.breedte - tussen(0, 300);
        wolk.y = tussen(...this.instellingen.wolkHoogte);
      }
      wolk.el.style.transform = `translate(${wolk.x}px, ${wolk.y}px)`;
    }

    for (const boom of this.bomen) {
      const buiging = boom.buig * (this.wind * 0.8 + Math.sin(t * 2.2 + boom.fase) * 0.35);
      boom.el.style.transform = `skewX(${-buiging}deg)`;
    }

    this.updateVogels(dt);
    this.updateBlaadjes(dt);
  }

  // De wind is nooit constant: een trage golf + af en toe een vlaag
  updateWind(dt) {
    this.volgendeVlaag -= dt;
    if (this.volgendeVlaag <= 0) {
      this.volgendeVlaag = tussen(6, 14);
      this.vlaag = tussen(0.8, 1.5);
      for (let i = 0; i < 3; i++) this.maakWindstreep();
    }
    this.vlaag = Math.max(0, this.vlaag - dt * 0.35);
    this.wind = this.instellingen.windKracht * (0.7 + Math.sin(this.tijd * 0.13) * 0.3) + this.vlaag;
  }

  updateVogels(dt) {
    this.volgendeZwerm -= dt;
    if (this.volgendeZwerm <= 0) {
      const [min, max] = this.instellingen.vogelsElke;
      this.volgendeZwerm = tussen(min, max);
      this.maakZwerm();
    }
    for (let i = this.vogels.length - 1; i >= 0; i--) {
      const v = this.vogels[i];
      v.x += v.vx * dt;
      const y = v.y + Math.sin(this.tijd * 2.5 + v.fase) * 6;
      const richting = v.vx < 0 ? -1 : 1;
      v.el.style.transform = `translate(${v.x}px, ${y}px) scale(${v.grootte * richting}, ${v.grootte})`;
      if (v.x < -200 || v.x > BREEDTE + 200) {
        v.el.remove();
        this.vogels.splice(i, 1);
      }
    }
  }

  // Een V-vormige zwerm, van links of van rechts
  maakZwerm() {
    const vanLinks = Math.random() < 0.5;
    const aantal = 3 + Math.floor(Math.random() * 4);
    const hoogte = tussen(50, 240);
    const snelheid = tussen(110, 170) * (vanLinks ? 1 : -1);
    for (let i = 0; i < aantal; i++) {
      const achterstand = i * 45 + tussen(0, 20);
      const opzij = (i % 2 === 0 ? 1 : -1) * Math.ceil(i / 2) * 22;
      const el = maakElement('div', 'vogel', this.vogelLaag);
      el.innerHTML = VOGEL_SVG;
      el.firstChild.style.animationDelay = tussen(0, 0.3) + 's';
      this.vogels.push({
        el,
        x: vanLinks ? -60 - achterstand : BREEDTE + 60 + achterstand,
        y: hoogte + opzij,
        vx: snelheid,
        grootte: tussen(0.7, 1.1),
        fase: Math.random() * 6,
      });
    }
  }

  // Blaadjes en bloesems die door de wind over het beeld waaien
  updateBlaadjes(dt) {
    this.blaadjesTeller += dt * this.instellingen.blaadjesPerSeconde * this.wind;
    while (this.blaadjesTeller >= 1 && this.blaadjes.length < 70) {
      this.blaadjesTeller--;
      this.maakBlaadje();
    }
    for (let i = this.blaadjes.length - 1; i >= 0; i--) {
      const b = this.blaadjes[i];
      b.x += (b.vx * this.wind + 30) * dt;
      b.y += (b.vy + Math.sin(this.tijd * 3 + b.fase) * 25) * dt;
      b.draai += b.draaiSnelheid * this.wind * dt;
      b.el.style.transform = `translate(${b.x}px, ${b.y}px) rotate(${b.draai}deg) scale(${b.grootte})`;
      if (b.x > BREEDTE + 40 || b.y > 1120) {
        b.el.remove();
        this.blaadjes.splice(i, 1);
      }
    }
  }

  maakBlaadje() {
    const y = tussen(280, 1060);
    const el = maakElement('div', 'blaadje', this.windLaag);
    el.style.background = BLAADJE_KLEUREN[Math.floor(Math.random() * BLAADJE_KLEUREN.length)];
    this.blaadjes.push({
      el,
      x: -30,
      y,
      vx: tussen(110, 200),
      vy: tussen(-8, 18),
      draai: Math.random() * 360,
      draaiSnelheid: tussen(-260, 260),
      grootte: 0.4 + (y / 1080) * 1.1, // lager = dichterbij = groter
      fase: Math.random() * 6,
    });
  }

  maakWindstreep() {
    const el = maakElement('div', 'windstreep', this.windLaag);
    el.innerHTML = WINDSTREEP_SVG;
    el.style.top = tussen(320, 900) + 'px';
    el.style.animationDelay = tussen(0, 0.6) + 's';
    setTimeout(() => el.remove(), 2400);
  }
}
