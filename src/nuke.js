// =====================================================================
// DE NUKE (toets N): een "echte" atoomexplosie, getekend met deeltjes op een canvas.
//
// Tijdlijn (t = seconden na de ontploffing; de bom valt 1,2 s vooraf):
//   0.0  verblindende flits, het hele schilderij wordt wit en daarna oranje verlicht
//   0.0  schokgolf: een ring die over de grond raast (in perspectief: plat), plus een
//        doorzichtige "condensatiekoepel" (de witte bol die je op oude filmbeelden ziet)
//   0.0  vuurbal: honderden gloeiende deeltjes, wit-geel in het hart, oranje-rood aan de rand
//   0.6  de vuurbal stijgt op en wordt de hoed van de paddenstoel: een ring die naar buiten
//        en over zichzelf heen rolt (een "torus"), van onderen nog gloeiend
//   0.6  de steel: rook die van de grond naar de hoed wordt gezogen
//   0.2  stofring over de grond, puin dat wegvliegt, vonken die opstijgen
//   ...  de krater blijft na-gloeien en smeulen; het licht dooft, de lucht wordt donker
//   ±16  alles verdwijnt rustig
// De mannetjes worden weggeblazen op het moment dat de schokgolf hen bereikt.
// =====================================================================

const B = 1920;
const H = 1080;
const RES = 0.5; // halve resolutie: rook en vuur zijn toch zacht, en het is 4x sneller
const VALTIJD = 1.2; // s
const DUUR = 16; // s na de ontploffing
const PLAT = 0.28; // perspectief: een cirkel op de grond is 0,28 keer zo hoog als breed

const tussen = (a, b) => a + Math.random() * (b - a);
const klem = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const vloeiend = (a, b, x) => {
  const t = klem((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// --- Sprites: één keer tekenen, daarna honderden keren hergebruiken ---
function puf(kleur, grootte = 128, dicht = 1) {
  const c = document.createElement('canvas');
  c.width = c.height = grootte;
  const ctx = c.getContext('2d');
  const m = grootte / 2;
  ctx.filter = `blur(${grootte / 14}px)`;
  // een wolkje = een paar bollen door elkaar, zodat het niet perfect rond is
  for (let i = 0; i < 9; i++) {
    const hoek = Math.random() * Math.PI * 2;
    const af = Math.random() * m * 0.28;
    const r = m * tussen(0.28, 0.42);
    const g = ctx.createRadialGradient(m + Math.cos(hoek) * af, m + Math.sin(hoek) * af, 0, m + Math.cos(hoek) * af, m + Math.sin(hoek) * af, r);
    g.addColorStop(0, kleur);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = tussen(0.45, 0.8) * dicht;
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, grootte, grootte);
  }
  return c;
}

function gloed(binnen, midden, buiten, grootte = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = grootte;
  const ctx = c.getContext('2d');
  const m = grootte / 2;
  const g = ctx.createRadialGradient(m, m, 0, m, m, m);
  g.addColorStop(0, binnen);
  g.addColorStop(0.35, midden);
  g.addColorStop(0.75, buiten);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, grootte, grootte);
  return c;
}

let SPRITES = null;
function sprites() {
  if (!SPRITES) {
    SPRITES = {
      rookDonker: [0, 1, 2].map(() => puf('rgb(52, 42, 36)')),
      rookMidden: [0, 1, 2].map(() => puf('rgb(104, 90, 78)')),
      rookLicht: [0, 1, 2].map(() => puf('rgb(176, 160, 142)')),
      stof: [0, 1, 2].map(() => puf('rgb(150, 126, 92)', 128, 0.8)),
      vuurHeet: gloed('rgba(255,255,240,1)', 'rgba(255,230,140,0.9)', 'rgba(255,140,40,0.35)'),
      vuur: gloed('rgba(255,200,90,1)', 'rgba(255,120,30,0.8)', 'rgba(170,30,10,0.3)'),
      vuurKoel: gloed('rgba(230,90,30,0.9)', 'rgba(150,40,15,0.6)', 'rgba(70,15,5,0.25)'),
      vonk: gloed('rgba(255,250,210,1)', 'rgba(255,170,60,0.9)', 'rgba(255,80,10,0.3)', 32),
    };
  }
  return SPRITES;
}

// Een puf rook tekenen, eventueel van binnenuit gloeiend (hitte 0..1)
function tekenPuf(ctx, x, y, r, dekking, rook, hitte = 0) {
  if (r <= 0 || dekking <= 0.01) return;
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = klem(dekking);
  ctx.drawImage(rook, x - r, y - r, r * 2, r * 2);
  if (hitte > 0.02) {
    const s = sprites();
    const vuur = hitte > 0.75 ? s.vuurHeet : hitte > 0.4 ? s.vuur : s.vuurKoel;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = klem(hitte * dekking);
    const rv = r * (0.65 + hitte * 0.3);
    ctx.drawImage(vuur, x - rv, y - rv, rv * 2, rv * 2);
  }
}

// =====================================================================
export class Nuke {
  // wereld = #wereld, mannetjes = lijst (wordt leeggemaakt), grond = { x, y } waar de bom valt,
  // schaal = hoe groot de explosie is (1 = zoals op een 1920 x 1080 schilderij)
  constructor(wereld, mannetjes, grond, schaal = 1, klaar = () => {}) {
    this.wereld = wereld;
    this.gx = grond.x;
    this.gy = grond.y;
    this.S = schaal;
    this.klaar = klaar;
    this.s = sprites();
    this.begin = performance.now();
    this.slachtoffers = mannetjes.splice(0).map((m) => ({ m, geraakt: false }));

    // Canvas voor alles (boven de mannetjes)
    this.canvas = document.createElement('canvas');
    this.canvas.width = B * RES;
    this.canvas.height = H * RES;
    this.canvas.className = 'nuke-laag';
    wereld.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    // Licht over het schilderij: wit (flits), oranje gloed, en daarna donkerder
    this.flits = this.div('nuke-flits');
    this.licht = this.div('nuke-licht');
    this.donker = this.div('nuke-donker');

    this.maakDeeltjes();
    this.lus = this.lus.bind(this);
    requestAnimationFrame(this.lus);
  }

  div(klasse) {
    const d = document.createElement('div');
    d.className = klasse;
    this.wereld.appendChild(d);
    return d;
  }

  maakDeeltjes() {
    const S = this.S;
    // Vuurbal: punten in een bol (later de hoed)
    this.vuurbal = Array.from({ length: 70 }, () => {
      const u = Math.random() * 2 - 1;
      const a = Math.random() * Math.PI * 2;
      const r = Math.cbrt(Math.random());
      return { x: Math.sqrt(1 - u * u) * Math.cos(a) * r, y: u * r, z: Math.sqrt(1 - u * u) * Math.sin(a) * r, g: tussen(0.7, 1.2), f: Math.random() * 6, rook: Math.floor(Math.random() * 3) };
    });
    // De hoed: een rollende ring (torus)
    this.hoed = Array.from({ length: 230 }, () => ({
      phi: Math.random() * Math.PI * 2, // rond de verticale as
      theta: Math.random() * Math.PI * 2, // rond de buis van de ring
      rol: tussen(0.9, 1.4), // hoe snel hij over zichzelf rolt
      g: tussen(0.75, 1.25),
      ruis: tussen(-0.15, 0.15),
      rook: Math.floor(Math.random() * 3),
    }));
    // De steel
    this.steel = Array.from({ length: 110 }, () => ({ h: Math.random(), x: tussen(-1, 1), v: tussen(0.12, 0.22), g: tussen(0.7, 1.3), rook: Math.floor(Math.random() * 3) }));
    // Stofring over de grond
    this.stof = Array.from({ length: 90 }, () => ({ a: Math.random() * Math.PI * 2, v: tussen(0.75, 1.15), g: tussen(0.8, 1.4), op: tussen(0, 1), rook: Math.floor(Math.random() * 3) }));
    // Puin
    this.puin = Array.from({ length: 70 }, () => {
      const a = tussen(-Math.PI * 0.95, -Math.PI * 0.05);
      const v = tussen(250, 900) * S;
      return { x: this.gx, y: this.gy - 10, vx: Math.cos(a) * v * 1.3, vy: Math.sin(a) * v, r: tussen(2, 7) * S, draai: Math.random() * 6, vd: tussen(-12, 12), geland: false, vuur: Math.random() < 0.6 };
    });
    // Vonken
    this.vonken = Array.from({ length: 110 }, () => this.nieuweVonk(true));
  }

  nieuweVonk(begin = false) {
    return { x: this.gx + tussen(-120, 120) * this.S, y: this.gy - tussen(0, begin ? 300 : 60) * this.S, vx: tussen(-60, 60), vy: tussen(-260, -90), leven: tussen(1, 3), t: begin ? Math.random() : 0, f: Math.random() * 9 };
  }

  lus(nu) {
    const T = (nu - this.begin) / 1000 - VALTIJD; // < 0: de bom valt nog
    const dt = Math.min(0.05, (nu - (this.vorige ?? nu)) / 1000);
    this.vorige = nu;
    const ctx = this.ctx;
    ctx.setTransform(RES, 0, 0, RES, 0, 0);
    ctx.clearRect(0, 0, B, H);

    if (T < 0) {
      this.tekenBom(ctx, T);
      this.flits.style.opacity = '0';
    } else {
      this.tekenKrater(ctx, T);
      this.tekenStof(ctx, T, dt);
      this.tekenSchokgolf(ctx, T);
      this.tekenSteel(ctx, T, dt);
      this.tekenHoed(ctx, T);
      this.tekenPuin(ctx, T, dt);
      this.tekenVonken(ctx, T, dt);
      this.zetLicht(T);
      this.schud(T);
      this.blaasWeg(T, dt);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    if (T < DUUR) requestAnimationFrame(this.lus);
    else this.opruimen();
  }

  // --- de bom die valt, met een schaduw die groeit en een fluitend spoor ---
  tekenBom(ctx, T) {
    const t = 1 + T / VALTIJD; // 0 → 1
    const y = -120 + (this.gy - 40 + 120) * t * t;
    const S = this.S;
    ctx.globalAlpha = 0.25 + t * 0.4;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.ellipse(this.gx, this.gy, (10 + t * 40) * S, (3 + t * 11) * S, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.35;
    const spoor = ctx.createLinearGradient(this.gx, y - 260, this.gx, y);
    spoor.addColorStop(0, 'rgba(255,255,255,0)');
    spoor.addColorStop(1, 'rgba(255,255,255,0.7)');
    ctx.fillStyle = spoor;
    ctx.fillRect(this.gx - 2 * S, y - 260, 4 * S, 260);
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.translate(this.gx, y);
    ctx.scale(S, S);
    ctx.rotate(Math.sin(T * 30) * 0.03);
    const g = ctx.createLinearGradient(-14, 0, 14, 0);
    g.addColorStop(0, '#6b7177');
    g.addColorStop(0.4, '#3a3f44');
    g.addColorStop(1, '#16191c');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#26292c';
    ctx.beginPath();
    ctx.moveTo(-14, -34);
    ctx.lineTo(14, -34);
    ctx.lineTo(8, -14);
    ctx.lineTo(-8, -14);
    ctx.fill();
    ctx.restore();
  }

  // --- de krater: verschroeide grond die na-gloeit en smeult ---
  tekenKrater(ctx, T) {
    const S = this.S;
    const groei = vloeiend(0, 0.6, T);
    const weg = 1 - vloeiend(DUUR - 3, DUUR, T);
    const rx = 260 * S * groei;
    if (rx < 1) return;
    ctx.save();
    ctx.translate(this.gx, this.gy);
    ctx.scale(1, PLAT);
    let g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, 'rgba(18,10,6,0.95)');
    g.addColorStop(0.55, 'rgba(40,24,14,0.8)');
    g.addColorStop(1, 'rgba(60,40,24,0)');
    ctx.globalAlpha = weg;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    // nagloeien
    const gloei = (1 - vloeiend(1, 9, T)) * weg;
    if (gloei > 0) {
      ctx.globalCompositeOperation = 'lighter';
      g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx * 0.6);
      g.addColorStop(0, `rgba(255,140,40,${0.8 * gloei})`);
      g.addColorStop(0.6, `rgba(200,50,10,${0.35 * gloei})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, rx * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    // smeulende rookpluimpjes
    if (T > 4) {
      for (let i = 0; i < 6; i++) {
        const f = ((T * 0.25 + i / 6) % 1);
        const x = this.gx + Math.sin(i * 2.3 + T * 0.4) * 140 * S + f * 30;
        const y = this.gy - f * 260 * S;
        tekenPuf(ctx, x, y, (30 + f * 70) * S, 0.35 * Math.sin(Math.PI * f) * weg, this.s.rookMidden[i % 3]);
      }
    }
  }

  // --- de schokgolf en de condensatiekoepel ---
  tekenSchokgolf(ctx, T) {
    const S = this.S;
    if (T < 2) {
      const r = 2600 * S * Math.pow(T / 2, 0.65);
      const a = (1 - T / 2) * 0.9;
      ctx.save();
      ctx.translate(this.gx, this.gy);
      ctx.scale(1, PLAT);
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = 40 * S;
      ctx.strokeStyle = `rgba(255,240,215,${a * 0.55})`;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 9 * S;
      ctx.strokeStyle = `rgba(255,255,255,${a})`;
      ctx.stroke();
      ctx.restore();
    }
    // de witte koepel van condens die even zichtbaar is
    if (T < 0.9) {
      const r = 520 * S * vloeiend(0, 0.5, T);
      const a = 0.35 * (1 - vloeiend(0.25, 0.9, T));
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(this.gx, this.gy, r * 0.6, this.gx, this.gy, r);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.85, `rgba(255,255,255,${a})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(this.gx, this.gy, r, r * 0.75, 0, Math.PI, 0);
      ctx.fill();
      ctx.restore();
    }
  }

  // --- stofring: rolt over de grond naar buiten en stijgt een beetje op ---
  tekenStof(ctx, T, dt) {
    const S = this.S;
    if (T < 0.15) return;
    const t = T - 0.15;
    const straal = 620 * S * (1 - Math.exp(-t / 1.4));
    const weg = 1 - vloeiend(3, 8, T);
    const lijst = this.stof
      .map((d) => {
        const r = straal * d.v;
        return { d, x: this.gx + Math.cos(d.a) * r, y: this.gy + Math.sin(d.a) * r * PLAT - d.op * 60 * S * vloeiend(0, 6, t), z: Math.sin(d.a) };
      })
      .sort((a, b) => a.z - b.z);
    // platgedrukt (het stof rolt over de grond)
    for (const { d, x, y } of lijst) {
      const r = (50 + 70 * vloeiend(0, 4, t)) * S * d.g;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1.6, 0.6);
      tekenPuf(ctx, 0, 0, r, 0.45 * weg * vloeiend(0, 0.4, t), this.s.stof[d.rook], (1 - vloeiend(0, 1.2, t)) * 0.6);
      ctx.restore();
    }
  }

  // positie en grootte van de hoed op tijd T
  hoedOp(T) {
    const S = this.S;
    const op = 1 - Math.exp(-T / 2.6);
    return {
      cx: this.gx + Math.sin(T * 0.12) * 12 * S,
      cy: Math.max(150, this.gy - (90 + 470 * op) * S), // nooit uit beeld
      R: (100 + 240 * (1 - Math.exp(-T / 2.4))) * S, // straal van de ring
    };
  }

  // --- de steel: rook die van de grond in de hoed wordt gezogen ---
  tekenSteel(ctx, T, dt) {
    if (T < 0.5) return;
    const S = this.S;
    const { cx, cy, R } = this.hoedOp(T);
    const weg = 1 - vloeiend(DUUR - 5, DUUR, T);
    const groei = vloeiend(0.5, 2, T);
    for (const p of this.steel) {
      p.h += p.v * dt * 1.6;
      if (p.h > 1) p.h -= 1;
      const h = p.h * groei;
      const y = this.gy - 10 * S + (cy + R * 0.25 - this.gy) * h;
      // breder onderaan (stofvoet) én bovenaan (waar hij in de hoed overgaat), smal in het midden
      const breed = (60 + 45 * (1 - h) ** 3 + 110 * h ** 4 + 25 * Math.min(T, 8) / 8) * S;
      const x = cx + p.x * breed * 0.6 + Math.sin(p.h * 9 + T) * 8 * S;
      const hitte = klem(1.1 - T / 3) * (1 - h) * 0.9;
      tekenPuf(ctx, x, y, breed * 0.8 * p.g, 0.65 * weg, h > 0.6 ? this.s.rookMidden[p.rook] : this.s.rookDonker[p.rook], hitte);
    }
    // De condensatiering: een dunne, lichte schijf rond het midden van de steel (zoals op echte foto's)
    const ring = vloeiend(1.8, 3, T) * (1 - vloeiend(6, 10, T)) * weg;
    if (ring > 0) {
      const ry = this.gy + (cy - this.gy) * 0.5;
      const rr = (150 + 60 * vloeiend(2, 8, T)) * S;
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 + T * 0.15;
        ctx.save();
        ctx.translate(cx + Math.cos(a) * rr, ry + Math.sin(a) * rr * 0.18);
        ctx.scale(1.8, 0.45);
        tekenPuf(ctx, 0, 0, 34 * S, 0.45 * ring, this.s.rookLicht[i % 3]);
        ctx.restore();
      }
    }
  }

  // --- vuurbal en hoed van de paddenstoel ---
  tekenHoed(ctx, T) {
    const S = this.S;
    const { cx, cy, R } = this.hoedOp(T);
    const weg = 1 - vloeiend(DUUR - 5, DUUR, T);
    // De vuurbal (eerste seconden): een gloeiende bol die opzwelt
    if (T < 2.2) {
      const rb = 200 * S * (1 - Math.exp(-T * 4));
      const by = this.gy - rb * 0.7 - (this.gy - cy) * vloeiend(0, 2.2, T) * 0.8;
      const hitte = klem(1 - T / 2.2);
      for (const p of this.vuurbal) {
        const w = Math.sin(T * 6 + p.f) * 0.08;
        tekenPuf(ctx, cx + (p.x + w) * rb, by + p.y * rb * 0.9, rb * 0.42 * p.g, (1 - vloeiend(1.4, 2.2, T)), this.s.rookDonker[p.rook], hitte * (0.75 + 0.25 * Math.sin(T * 20 + p.f)));
      }
    }
    if (T < 0.6) return;
    // De hoed: een ring die over zichzelf rolt (naar buiten-boven, onderaan naar binnen)
    const ringR = R * 0.62;
    const buis = R * 0.36;
    const verschijn = vloeiend(0.6, 1.6, T) * (1 - 0.45 * vloeiend(6, 12, T));
    const deeltjes = this.hoed
      .map((p) => {
        const th = p.theta + T * p.rol;
        const phi = p.phi + T * 0.05;
        const rr = ringR + buis * Math.cos(th) * (1 + p.ruis);
        const z = Math.sin(phi) * rr;
        return {
          p,
          th,
          x: cx + Math.cos(phi) * rr,
          y: cy - buis * Math.sin(th) * 0.85 + z * 0.18,
          z,
        };
      })
      .sort((a, b) => a.z - b.z);
    const hitteBasis = klem(1.25 - T / 4.5);
    for (const { p, th, x, y, z } of deeltjes) {
      const onder = klem(-Math.sin(th)); // de onderkant wordt nog verlicht door het vuur
      const hitte = hitteBasis * (0.35 + 0.65 * onder) * (0.85 + 0.15 * Math.sin(T * 9 + p.phi * 5));
      const rook = z > 0 ? this.s.rookLicht[p.rook] : this.s.rookMidden[p.rook];
      tekenPuf(ctx, x, y, buis * 1.0 * p.g, 0.6 * verschijn * weg, rook, hitte);
    }
    // De koepel bovenop: een bolle kap die van bovenaf door de lucht verlicht wordt (licht van kleur)
    if (!this.koepel) {
      this.koepel = Array.from({ length: 60 }, () => {
        const a = Math.random() * Math.PI * 2;
        const h = Math.sqrt(Math.random()); // meer puffs aan de rand dan in het midden
        return { a, h, g: tussen(0.8, 1.2), rook: Math.floor(Math.random() * 3) };
      });
    }
    const koepelR = ringR + buis * 0.6;
    for (const k of this.koepel) {
      const rr = koepelR * k.h;
      const x = cx + Math.cos(k.a + T * 0.04) * rr;
      const y = cy - buis * 0.6 - Math.sqrt(Math.max(0, 1 - k.h * k.h)) * buis * 1.3 + Math.sin(k.a) * rr * 0.15;
      const boven = 1 - k.h; // het midden van de koepel ligt het hoogst en vangt het meeste licht
      tekenPuf(ctx, x, y, buis * 0.9 * k.g, 0.55 * verschijn * weg, boven > 0.4 ? this.s.rookLicht[k.rook] : this.s.rookMidden[k.rook], hitteBasis * 0.25 * (1 - boven));
    }
  }

  // --- puin dat wegvliegt (met een vuurspoor), en neerkomt ---
  tekenPuin(ctx, T, dt) {
    const weg = 1 - vloeiend(5, 9, T);
    if (weg <= 0) return;
    for (const p of this.puin) {
      if (!p.geland) {
        p.vy += 900 * this.S * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.draai += p.vd * dt;
        if (p.vy > 0 && p.y > this.gy + Math.abs(p.x - this.gx) * 0.12) p.geland = true;
      }
      if (p.vuur && T < 1.6 && !p.geland) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = (1 - T / 1.6) * 0.8;
        ctx.drawImage(this.s.vonk, p.x - p.r * 3, p.y - p.r * 3, p.r * 6, p.r * 6);
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = weg;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.draai);
      ctx.fillStyle = '#231a14';
      ctx.fillRect(-p.r, -p.r * 0.6, p.r * 2, p.r * 1.2);
      ctx.restore();
    }
  }

  // --- gloeiende vonken die uit het vuur opstijgen ---
  tekenVonken(ctx, T, dt) {
    const veel = 1 - vloeiend(3, 10, T);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < this.vonken.length; i++) {
      const v = this.vonken[i];
      v.t += dt / v.leven;
      if (v.t >= 1) {
        this.vonken[i] = this.nieuweVonk();
        continue;
      }
      v.vy += 20 * dt;
      v.x += (v.vx + Math.sin(v.f + T * 3) * 30) * dt;
      v.y += v.vy * dt;
      const r = 6 * this.S * (1 - v.t * 0.6);
      ctx.globalAlpha = veel * (1 - v.t) * (0.6 + 0.4 * Math.sin(T * 25 + v.f * 7));
      ctx.drawImage(this.s.vonk, v.x - r, v.y - r, r * 2, r * 2);
    }
  }

  // --- licht over het hele schilderij ---
  zetLicht(T) {
    const { cx, cy } = this.hoedOp(T);
    this.flits.style.opacity = Math.exp(-T * 5).toFixed(3);
    const gloed = klem(1 - T / 6) ** 1.5;
    this.licht.style.opacity = gloed.toFixed(3);
    this.licht.style.background = `radial-gradient(circle at ${cx}px ${Math.max(cy, this.gy - 300)}px, rgba(255,190,90,0.95), rgba(255,110,30,0.5) 30%, rgba(120,40,10,0.15) 70%)`;
    this.donker.style.opacity = (vloeiend(0.8, 4, T) * (1 - vloeiend(7, DUUR, T)) * 0.38).toFixed(3);
  }

  // --- de "camera" schudt: hard bij de ontploffing, en nog eens als de schokgolf voorbijkomt ---
  schud(T) {
    const a = 26 * Math.exp(-T * 1.7) + 6 * Math.exp(-((T - 1) ** 2) * 6);
    const x = (Math.sin(T * 71) + Math.sin(T * 43)) * a * 0.5;
    const y = (Math.cos(T * 59) + Math.sin(T * 37)) * a * 0.5;
    this.wereld.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
  }

  // --- mannetjes: verkoold en weggeblazen zodra de schokgolf er is ---
  blaasWeg(T, dt) {
    const golf = 2600 * this.S * Math.pow(Math.min(T, 2) / 2, 0.65); // straal van de schokgolf
    for (const s of this.slachtoffers) {
      const m = s.m;
      const dx = m.x - this.gx;
      const dy = (m.y - this.gy) / PLAT;
      const af = Math.hypot(dx, dy);
      if (!s.geraakt && af <= golf) {
        s.geraakt = true;
        s.t0 = T;
        s.vx = (dx / (af || 1)) * tussen(500, 900) * Math.max(0.3, 1 - af / 2600);
        s.vy = -tussen(200, 420) * Math.max(0.3, 1 - af / 2600);
        s.draai = (dx >= 0 ? 1 : -1) * tussen(200, 520);
        m.element.classList.add('verkoold');
        m.element.classList.remove('loopt');
      }
      if (s.geraakt && !s.klaar) {
        const t = T - s.t0;
        m.x += s.vx * dt * Math.max(0, 1 - t);
        m.y += (s.vy + 700 * t) * dt * PLAT;
        const binnen = m.element.firstElementChild;
        if (binnen) binnen.style.rotate = `${(s.draai * Math.min(t, 0.7)).toFixed(0)}deg`;
        m.teken();
        if (t > 0.75) {
          s.klaar = true;
          if (binnen) binnen.style.rotate = '';
          m.sterf();
        }
      }
    }
  }

  opruimen() {
    this.canvas.remove();
    this.flits.remove();
    this.licht.remove();
    this.donker.remove();
    this.wereld.style.translate = '';
    this.klaar();
  }
}
