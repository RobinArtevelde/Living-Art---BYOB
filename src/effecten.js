// =====================================================================
// EFFECTEN: een bewegende sfeer voor elk schilderij (behalve het Lam Gods,
// dat heeft zijn eigen sfeer.js met zon, wolken, vogels en wind).
//
// Per schilderij staat in schilderijen.js een lijstje "effecten", bv.
//   { soort: 'rook', gebied: [x, y, breedte, hoogte], aantal: 12 }
//
// Soorten:
//   golf         een deel van het schilderij golft (een vlag): WebGL, zie wind.js
//   rook         langzaam drijvende rookwolken (kruitdamp, brand)
//   vonken       gloeiende vonkjes die opstijgen
//   stofjes      stofjes die zweven en oplichten in het licht
//   lichtstralen schuine lichtbundels die zacht ademen
//   gloed        flakkerend warm licht (kaarsen, vuur)
//   glinsters    kleine sterretjes op goud en edelstenen
//   flitsen      af en toe een geweerschot in de verte: flits + rookpluimpje
//   sneeuw       zachte sneeuwvlokjes die dwarrelend vallen
//   vogels       af en toe een groepje vogels (kraaien) dat over de lucht vliegt
//
// Elk effect tekent op een doorzichtig canvas van 1920 x 1080:
//   laag 'achter' (standaard) = achter de mannetjes, 'voor' = ervoor.
// Licht (vonken, stofjes, stralen, gloed, glinsters, flitsen) komt op een aparte
// laag met mix-blend-mode: screen: het maakt het schilderij lichter, zoals echt licht.
// =====================================================================

import { maakWindLaag } from './wind.js';

const BREEDTE = 1920;
const HOOGTE = 1080;
// De effecten worden op halve resolutie getekend (4x minder pixels, dus veel sneller).
// Rook en licht zijn toch wazig: het verschil zie je niet. CSS rekt het canvas weer uit.
const RESOLUTIE = 0.5;

function tussen(min, max) {
  return min + Math.random() * (max - min);
}

// --- Sprites: kleine afbeeldingen die we één keer tekenen en dan veel hergebruiken ---

// Een zachte rookwolk: een paar wazige bollen door elkaar, met wat "verfstructuur"
function maakRookSprite(kleur) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.filter = 'blur(14px)';
  ctx.fillStyle = kleur;
  for (let i = 0; i < 9; i++) {
    const hoek = Math.random() * Math.PI * 2;
    const afstand = Math.random() * 35;
    ctx.globalAlpha = tussen(0.25, 0.55);
    ctx.beginPath();
    // klein genoeg zodat de vervaging nooit tegen de rand van het canvas komt (anders harde randen)
    ctx.arc(128 + Math.cos(hoek) * afstand, 128 + Math.sin(hoek) * afstand * 0.7, tussen(28, 50), 0, Math.PI * 2);
    ctx.fill();
  }
  return c;
}

// Een zacht lichtpuntje (wit in het midden, kleur aan de rand)
function maakGloedSprite(kleur) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const verloop = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  verloop.addColorStop(0, 'rgba(255,255,255,1)');
  verloop.addColorStop(0.25, kleur);
  verloop.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = verloop;
  ctx.fillRect(0, 0, 64, 64);
  return c;
}

// Een sterretje met vier punten (een glinstering op goud)
function maakSterSprite() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  ctx.translate(32, 32);
  ctx.fillStyle = 'rgba(255, 246, 214, 1)';
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.quadraticCurveTo(2, -4, 0, 0);
    ctx.quadraticCurveTo(-2, -4, 0, -30);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(maakGloedSprite('rgba(255, 220, 140, 0.6)'), -16, -16, 32, 32);
  return c;
}

// =====================================================================
// De effecten zelf. Elk effect heeft update(dt, tijd) en teken(ctx, tijd).
// =====================================================================

// --- ROOK ---
class Rook {
  constructor(o) {
    this.o = o;
    this.gebied = o.gebied ?? [0, 0, BREEDTE, HOOGTE];
    this.dekking = o.dekking ?? 0.25;
    this.richting = o.richting ?? 1; // 1 = drijft naar rechts, -1 = naar links
    this.snelheid = o.snelheid ?? [6, 18];
    this.grootte = o.grootte ?? [220, 420];
    this.vernieuwen = o.vernieuwen ?? true; // false = opgebruikte wolken verdwijnen gewoon (pluimpjes)
    this.sprites = Array.from({ length: 4 }, () => maakRookSprite(o.kleur ?? '#ddd3bd'));
    // Meteen gevuld, zodat er bij het begin al rook hangt
    this.wolken = Array.from({ length: o.aantal ?? 10 }, () => this.nieuweWolk(Math.random()));
  }

  nieuweWolk(leeftijd = 0) {
    const [x, y, b, h] = this.gebied;
    return {
      x: tussen(x, x + b),
      y: tussen(y, y + h),
      grootte: tussen(...this.grootte),
      vx: tussen(...this.snelheid) * this.richting,
      vy: tussen(-6, 2), // rook stijgt een beetje
      groei: tussen(4, 12),
      draai: Math.random() * Math.PI * 2,
      draaiSnelheid: tussen(-0.05, 0.05),
      sprite: this.sprites[Math.floor(Math.random() * this.sprites.length)],
      leeftijd, // 0 … 1
      levensduur: tussen(14, 26), // seconden
    };
  }

  update(dt) {
    for (let i = 0; i < this.wolken.length; i++) {
      const w = this.wolken[i];
      w.leeftijd += dt / w.levensduur;
      w.x += w.vx * dt;
      w.y += w.vy * dt;
      w.grootte += w.groei * dt;
      w.draai += w.draaiSnelheid * dt;
      if (w.leeftijd >= 1 && this.vernieuwen) this.wolken[i] = this.nieuweWolk();
    }
    if (!this.vernieuwen) this.wolken = this.wolken.filter((w) => w.leeftijd < 1);
  }

  teken(ctx) {
    for (const w of this.wolken) {
      // langzaam opkomen en weer verdwijnen
      const zichtbaar = Math.sin(Math.PI * w.leeftijd);
      ctx.globalAlpha = this.dekking * zichtbaar;
      ctx.save();
      ctx.translate(w.x, w.y);
      ctx.rotate(w.draai);
      ctx.drawImage(w.sprite, -w.grootte / 2, -w.grootte / 2, w.grootte, w.grootte * 0.75);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
}

// --- VONKEN ---
class Vonken {
  constructor(o) {
    this.licht = true;
    this.gebied = o.gebied ?? [0, 500, BREEDTE, 500];
    this.sprite = maakGloedSprite(o.kleur ?? 'rgba(255, 140, 40, 0.9)');
    this.vonken = Array.from({ length: o.aantal ?? 25 }, () => this.nieuweVonk(Math.random()));
  }

  nieuweVonk(leeftijd = 0) {
    const [x, y, b, h] = this.gebied;
    return {
      x: tussen(x, x + b),
      y: tussen(y + h * 0.4, y + h),
      vx: tussen(-12, 25),
      vy: tussen(-70, -30),
      grootte: tussen(5, 12),
      fase: Math.random() * 10,
      leeftijd,
      levensduur: tussen(2.5, 5),
    };
  }

  update(dt) {
    for (let i = 0; i < this.vonken.length; i++) {
      const v = this.vonken[i];
      v.leeftijd += dt / v.levensduur;
      v.x += (v.vx + Math.sin(v.fase + v.leeftijd * 12) * 18) * dt; // zigzaggen in de warme lucht
      v.y += v.vy * dt;
      if (v.leeftijd >= 1) this.vonken[i] = this.nieuweVonk();
    }
  }

  teken(ctx, tijd) {
    for (const v of this.vonken) {
      const flakker = 0.6 + 0.4 * Math.sin(tijd * 20 + v.fase * 7);
      ctx.globalAlpha = (1 - v.leeftijd) * flakker;
      ctx.drawImage(this.sprite, v.x - v.grootte / 2, v.y - v.grootte / 2, v.grootte, v.grootte);
    }
    ctx.globalAlpha = 1;
  }
}

// --- STOFJES ---
class Stofjes {
  constructor(o) {
    this.licht = true;
    this.gebied = o.gebied ?? [0, 0, BREEDTE, HOOGTE];
    this.sprite = maakGloedSprite(o.kleur ?? 'rgba(255, 236, 190, 0.7)');
    this.helderheid = o.helderheid ?? 0.55;
    const [x, y, b, h] = this.gebied;
    this.stofjes = Array.from({ length: o.aantal ?? 40 }, () => ({
      x: tussen(x, x + b),
      y: tussen(y, y + h),
      grootte: tussen(3, 8),
      fase: Math.random() * 100,
      snelheid: tussen(0.15, 0.4),
    }));
  }

  update(dt, tijd) {
    const [x, y, b, h] = this.gebied;
    for (const s of this.stofjes) {
      // traag dwarrelen
      s.x += Math.sin(tijd * s.snelheid + s.fase) * 9 * dt + 3 * dt;
      s.y += Math.cos(tijd * s.snelheid * 0.8 + s.fase) * 7 * dt - 1.5 * dt;
      if (s.x > x + b) s.x = x;
      if (s.y < y) s.y = y + h;
    }
  }

  teken(ctx, tijd) {
    for (const s of this.stofjes) {
      // af en toe vangt een stofje het licht
      ctx.globalAlpha = this.helderheid * Math.max(0, Math.sin(tijd * s.snelheid * 2 + s.fase)) ** 2;
      ctx.drawImage(this.sprite, s.x - s.grootte / 2, s.y - s.grootte / 2, s.grootte, s.grootte);
    }
    ctx.globalAlpha = 1;
  }
}

// --- LICHTSTRALEN ---
class Lichtstralen {
  constructor(o) {
    this.licht = true;
    this.sterkte = o.sterkte ?? 0.22;
    // De stralen één keer tekenen (wazig), daarna alleen nog laten ademen.
    // Elke straal krijgt een eigen, zo klein mogelijk canvas (snel, ook op een trage laptop).
    this.stralen = (o.stralen ?? []).map(([x1, y1, x2, y2, breedte], i) => {
      const hoek = Math.atan2(y2 - y1, x2 - x1);
      const nx = -Math.sin(hoek);
      const ny = Math.cos(hoek);
      const hoeken = [
        [x1 + nx * breedte * 0.3, y1 + ny * breedte * 0.3],
        [x1 - nx * breedte * 0.3, y1 - ny * breedte * 0.3],
        [x2 - nx * breedte, y2 - ny * breedte],
        [x2 + nx * breedte, y2 + ny * breedte],
      ];
      const rand = breedte * 0.6; // ruimte voor de vervaging
      const links = Math.min(...hoeken.map((h) => h[0])) - rand;
      const boven = Math.min(...hoeken.map((h) => h[1])) - rand;
      const c = document.createElement('canvas');
      c.width = Math.ceil(Math.max(...hoeken.map((h) => h[0])) + rand - links);
      c.height = Math.ceil(Math.max(...hoeken.map((h) => h[1])) + rand - boven);
      const ctx = c.getContext('2d');
      ctx.translate(-links, -boven);
      const verloop = ctx.createLinearGradient(x1, y1, x2, y2);
      verloop.addColorStop(0, o.kleur ?? 'rgba(255, 238, 200, 1)');
      verloop.addColorStop(1, 'rgba(255, 238, 200, 0)');
      ctx.filter = `blur(${breedte * 0.25}px)`;
      ctx.fillStyle = verloop;
      ctx.beginPath(); // smal bij de bron, breder onderaan
      ctx.moveTo(...hoeken[0]);
      for (const h of hoeken.slice(1)) ctx.lineTo(...h);
      ctx.closePath();
      ctx.fill();
      return { beeld: c, x: links, y: boven, fase: i * 1.7 };
    });
  }

  update() {}

  teken(ctx, tijd) {
    for (const s of this.stralen) {
      ctx.globalAlpha = this.sterkte * (0.65 + 0.35 * Math.sin(tijd * 0.35 + s.fase));
      ctx.drawImage(s.beeld, s.x, s.y);
    }
    ctx.globalAlpha = 1;
  }
}

// --- GLOED (kaarsen, vuur) ---
class Gloed {
  constructor(o) {
    this.licht = true;
    this.sterkte = o.sterkte ?? 0.35;
    this.sprite = maakGloedSprite(o.kleur ?? 'rgba(255, 190, 90, 0.8)');
    this.punten = (o.punten ?? []).map(([x, y, straal]) => ({ x, y, straal, fase: Math.random() * 10 }));
  }

  update() {}

  teken(ctx, tijd) {
    for (const p of this.punten) {
      // flakkeren: een paar golven door elkaar, zodat het nooit regelmatig wordt
      const f = 0.75 + 0.12 * Math.sin(tijd * 7.3 + p.fase) + 0.08 * Math.sin(tijd * 13.1 + p.fase * 2) + 0.05 * Math.sin(tijd * 2.1);
      const r = p.straal * (0.95 + 0.05 * f);
      ctx.globalAlpha = this.sterkte * f;
      ctx.drawImage(this.sprite, p.x - r, p.y - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;
  }
}

// --- GLINSTERS ---
class Glinsters {
  constructor(o) {
    this.licht = true;
    this.sprite = maakSterSprite();
    this.punten = o.punten ?? [];
    this.elke = o.elke ?? [0.4, 1.6]; // seconden tussen twee glinsteringen
    this.grootte = o.grootte ?? 26;
    this.actief = [];
    this.wacht = tussen(...this.elke);
  }

  update(dt) {
    this.wacht -= dt;
    if (this.wacht <= 0 && this.punten.length) {
      this.wacht = tussen(...this.elke);
      const [x, y] = this.punten[Math.floor(Math.random() * this.punten.length)];
      this.actief.push({ x: x + tussen(-6, 6), y: y + tussen(-6, 6), leeftijd: 0, draai: Math.random() });
    }
    for (const g of this.actief) g.leeftijd += dt / 0.7;
    this.actief = this.actief.filter((g) => g.leeftijd < 1);
  }

  teken(ctx) {
    for (const g of this.actief) {
      const s = Math.sin(Math.PI * g.leeftijd) * this.grootte;
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate(g.draai + g.leeftijd * 0.8);
      ctx.globalAlpha = 0.9;
      ctx.drawImage(this.sprite, -s / 2, -s / 2, s, s);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
}

// --- SNEEUW ---
// Vlokjes in drie "dieptes": ver weg klein en traag, dichtbij groter, sneller en wat waziger.
class Sneeuw {
  constructor(o) {
    this.sprite = maakGloedSprite(o.kleur ?? 'rgba(250, 248, 240, 0.9)');
    this.gebied = o.gebied ?? [0, 0, BREEDTE, HOOGTE];
    this.dekking = o.dekking ?? 0.8;
    this.wind = o.wind ?? 12; // drijft naar rechts (negatief = naar links)
    this.vlokken = Array.from({ length: o.aantal ?? 140 }, () => this.nieuweVlok(true));
  }

  nieuweVlok(overal = false) {
    const [x, y, b, h] = this.gebied;
    const diepte = Math.random(); // 0 = ver, 1 = dichtbij
    return {
      x: tussen(x - 50, x + b),
      y: overal ? tussen(y, y + h) : y - 20,
      diepte,
      grootte: 3 + diepte * 9,
      valsnelheid: 18 + diepte * 45,
      fase: Math.random() * 10,
      zwaai: tussen(8, 22),
    };
  }

  update(dt, tijd) {
    const [, y, , h] = this.gebied;
    for (let i = 0; i < this.vlokken.length; i++) {
      const v = this.vlokken[i];
      v.y += v.valsnelheid * dt;
      v.x += (this.wind * (0.4 + v.diepte) + Math.cos(tijd * 0.9 + v.fase) * v.zwaai) * dt;
      if (v.y > y + h + 20) this.vlokken[i] = this.nieuweVlok();
    }
  }

  teken(ctx, tijd) {
    for (const v of this.vlokken) {
      ctx.globalAlpha = this.dekking * (0.45 + v.diepte * 0.55) * (0.85 + 0.15 * Math.sin(tijd * 2 + v.fase));
      ctx.drawImage(this.sprite, v.x - v.grootte / 2, v.y - v.grootte / 2, v.grootte, v.grootte);
    }
    ctx.globalAlpha = 1;
  }
}

// --- VOGELS ---
// Een vogel = twee gebogen vleugels die op en neer slaan, in de kleur van het schilderij.
class Vogels {
  constructor(o) {
    this.gebied = o.gebied ?? [0, 0, BREEDTE, 200]; // waar in de lucht ze vliegen
    this.kleur = o.kleur ?? 'rgba(35, 28, 24, 0.85)';
    this.elke = o.elke ?? [7, 16]; // seconden tussen twee zwermen
    this.grootte = o.grootte ?? [7, 13];
    this.wacht = tussen(1, 4);
    this.vogels = [];
  }

  update(dt) {
    this.wacht -= dt;
    if (this.wacht <= 0) {
      this.wacht = tussen(...this.elke);
      const [x, y, b, h] = this.gebied;
      const naarRechts = Math.random() < 0.5;
      const aantal = 1 + Math.floor(Math.random() * 5);
      const hoogte = tussen(y, y + h);
      const snelheid = tussen(60, 110) * (naarRechts ? 1 : -1);
      for (let i = 0; i < aantal; i++) {
        this.vogels.push({
          x: (naarRechts ? x - 40 : x + b + 40) - Math.sign(snelheid) * i * tussen(25, 45),
          y: hoogte + tussen(-25, 25),
          vx: snelheid * tussen(0.9, 1.1),
          grootte: tussen(...this.grootte),
          fase: Math.random() * 6,
          klap: tussen(7, 10),
          maxX: x + b + 80,
          minX: x - 80,
        });
      }
    }
    for (const v of this.vogels) {
      v.x += v.vx * dt;
      v.y += Math.sin(v.fase + v.x * 0.01) * 6 * dt;
    }
    this.vogels = this.vogels.filter((v) => v.x > v.minX - 300 && v.x < v.maxX + 300);
  }

  teken(ctx, tijd) {
    ctx.strokeStyle = this.kleur;
    ctx.lineCap = 'round';
    for (const v of this.vogels) {
      const s = v.grootte;
      const vleugel = Math.sin(tijd * v.klap + v.fase) * 0.8; // -0.8 … 0.8: vleugels op en neer
      ctx.lineWidth = Math.max(1, s * 0.22);
      ctx.beginPath();
      ctx.moveTo(v.x - s, v.y - vleugel * s * 0.6);
      ctx.quadraticCurveTo(v.x - s * 0.4, v.y - s * 0.35 - vleugel * s * 0.3, v.x, v.y);
      ctx.quadraticCurveTo(v.x + s * 0.4, v.y - s * 0.35 - vleugel * s * 0.3, v.x + s, v.y - vleugel * s * 0.6);
      ctx.stroke();
    }
  }
}

// --- FLITSEN (geweerschoten in de verte) ---
class Flitsen {
  constructor(o, rookLaag) {
    this.licht = true;
    this.gebied = o.gebied;
    this.elke = o.elke ?? [3, 9];
    this.wacht = tussen(1, this.elke[1]);
    this.sprite = maakGloedSprite('rgba(255, 190, 90, 0.95)');
    this.flitsen = [];
    // Elk schot laat een pluimpje rook achter
    this.rook = new Rook({ aantal: 0, vernieuwen: false, kleur: '#e2dccb', dekking: 0.35, grootte: [50, 90], snelheid: [4, 10] });
    rookLaag.push(this.rook);
  }

  update(dt) {
    this.wacht -= dt;
    if (this.wacht <= 0) {
      this.wacht = tussen(...this.elke);
      const [x, y, b, h] = this.gebied;
      const px = tussen(x, x + b);
      const py = tussen(y, y + h);
      // soms een salvo: een paar schoten vlak na elkaar
      const aantal = Math.random() < 0.3 ? 3 : 1;
      for (let i = 0; i < aantal; i++) {
        this.flitsen.push({ x: px + i * tussen(14, 30), y: py + tussen(-4, 4), leeftijd: -i * 0.12 });
      }
    }
    for (const f of this.flitsen) {
      f.leeftijd += dt / 0.18;
      if (f.leeftijd >= 0 && !f.rook) {
        f.rook = true;
        const wolk = this.rook.nieuweWolk();
        Object.assign(wolk, { x: f.x, y: f.y, levensduur: tussen(3, 5) });
        this.rook.wolken.push(wolk);
      }
    }
    this.flitsen = this.flitsen.filter((f) => f.leeftijd < 1);
  }

  teken(ctx) {
    for (const f of this.flitsen) {
      if (f.leeftijd < 0) continue;
      const r = 26 * (1 - f.leeftijd * 0.5);
      ctx.globalAlpha = 1 - f.leeftijd;
      ctx.drawImage(this.sprite, f.x - r, f.y - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;
  }
}

// =====================================================================
// Alles samen
// =====================================================================
export class Effecten {
  // wereld = #wereld, voor = de mannetjes-laag, lijst = effecten uit schilderijen.js
  // grens = [x, y, breedte, hoogte]: buiten dit kader niets tekenen (bv. naast een smal schilderij)
  constructor(wereld, voor, lijst, grens = null, map = '') {
    this.tijd = 0;
    this.grens = grens;
    this.lagen = {}; // canvassen, alleen gemaakt als ze nodig zijn
    this.effecten = [];
    this.windLagen = [];
    this.wereld = wereld;
    this.voor = voor;

    for (const o of lijst) {
      const laag = o.laag === 'voor' ? 'voor' : 'achter';
      if (o.soort === 'golf') {
        // Een deel van het schilderij zelf golft (WebGL, zie wind.js)
        const schilderij = wereld.querySelector('#schilderij');
        maakWindLaag(schilderij, map + o.masker, 0, {
          soort: 'golf',
          kracht: o.kracht ?? 7,
          achtergrond: o.achtergrond && map + o.achtergrond, // alleen de voorwerpen bewegen
          voorwerpen: o.voorwerpen && map + o.voorwerpen,
          stroom: o.stroom, // stromend water: [vx, vy] in px/s
        }).then((l) => {
          if (l) this.windLagen.push(l);
        });
        continue;
      }
      const extraRook = [];
      const effect =
        o.soort === 'rook' ? new Rook(o)
        : o.soort === 'vonken' ? new Vonken(o)
        : o.soort === 'stofjes' ? new Stofjes(o)
        : o.soort === 'lichtstralen' ? new Lichtstralen(o)
        : o.soort === 'gloed' ? new Gloed(o)
        : o.soort === 'glinsters' ? new Glinsters(o)
        : o.soort === 'flitsen' ? new Flitsen(o, extraRook)
        : o.soort === 'sneeuw' ? new Sneeuw(o)
        : o.soort === 'vogels' ? new Vogels(o)
        : null;
      if (!effect) {
        console.warn('Onbekend effect:', o.soort);
        continue;
      }
      for (const rook of extraRook) this.effecten.push({ effect: rook, laag: this.canvas(laag, false) });
      this.effecten.push({ effect, laag: this.canvas(laag, effect.licht) });
    }
  }

  // Een canvas voor een laag (achter/voor) en een soort (gewoon/licht)
  canvas(laag, licht) {
    const sleutel = laag + (licht ? '-licht' : '');
    if (!this.lagen[sleutel]) {
      const c = document.createElement('canvas');
      c.width = BREEDTE * RESOLUTIE;
      c.height = HOOGTE * RESOLUTIE;
      c.className = 'effect-laag effect-' + laag + (licht ? ' effect-licht' : '');
      if (laag === 'voor') this.wereld.appendChild(c);
      else this.wereld.insertBefore(c, this.voor);
      this.lagen[sleutel] = c.getContext('2d');
    }
    return this.lagen[sleutel];
  }

  update(dt) {
    this.tijd += dt;
    const wind = 1 + Math.sin(this.tijd * 0.13) * 0.3; // de vlag waait niet altijd even hard
    for (const l of this.windLagen) l.teken(this.tijd, wind);

    for (const ctx of Object.values(this.lagen)) {
      ctx.setTransform(RESOLUTIE, 0, 0, RESOLUTIE, 0, 0); // tekenen in wereld-pixels (1920 x 1080)
      ctx.clearRect(0, 0, BREEDTE, HOOGTE);
    }
    for (const { effect, laag } of this.effecten) {
      effect.update(dt, this.tijd);
      effect.teken(laag, this.tijd);
    }
    // Buiten het doek niets, maar met een zachte overgang (een harde rand zag je als een streep)
    if (this.grens) for (const ctx of Object.values(this.lagen)) this.vervaagRand(ctx);
  }

  vervaagRand(ctx) {
    if (!this.randVerloop) {
      const [x, , b] = this.grens;
      const zacht = 70; // pixels
      const v = ctx.createLinearGradient(x, 0, x + b, 0);
      v.addColorStop(0, 'rgba(0,0,0,0)');
      v.addColorStop(zacht / b, 'rgba(0,0,0,1)');
      v.addColorStop(1 - zacht / b, 'rgba(0,0,0,1)');
      v.addColorStop(1, 'rgba(0,0,0,0)');
      this.randVerloop = v;
    }
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = this.randVerloop;
    ctx.fillRect(0, 0, BREEDTE, HOOGTE);
    ctx.restore();
  }
}
