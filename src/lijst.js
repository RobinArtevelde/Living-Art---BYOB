// =====================================================================
// DE LIJST: een echte museumlijst rond het schilderij, op een witte museummuur,
// met een schilderijlampje erboven en een koperen naambordje eronder.
//
// Alles wordt getekend op één canvas over het hele scherm, met een gat in het midden
// waar het schilderij (#wereld) door te zien is. Het schilderij wordt daarvoor kleiner
// gemaakt, zodat de lijst er netjes rond past (zie plaatsing() en display.js).
//
// Een lijst bestaat uit "banden" van buiten naar binnen, net als een echte houten lijst:
//   bol    = een bolle rand (licht op de bovenkant van de ronding)
//   hol    = een holle goot
//   vlak   = een vlakke strook
//   parels = een rij kraaltjes
//   blad   = een rij eieren en pijlpunten (het klassieke "eierlijst"-ornament)
//   ribbel = fijne dwarse ribbeltjes (typisch voor zwarte Hollandse en Vlaamse lijsten)
// De stijl per schilderij staat in schilderijen.js ("lijst").
// =====================================================================

const GOUD = { licht: '#f6dc96', midden: '#c99a3a', donker: '#6b4a14', diep: '#2e1e08' };
const EBBEN = { licht: '#5a4636', midden: '#2a1f18', donker: '#120c08', diep: '#050302' };
const ZWART = { licht: '#4a4440', midden: '#1c1a19', donker: '#0b0a0a', diep: '#030303' };

// Banden: [aandeel van de breedte, soort, materiaal]
export const LIJSTEN = {
  // Gotisch verguld (Van Eyck): eenvoudiger profiel, met kraaltjes en een diepe goot
  gotisch: {
    dikte: 0.065,
    banden: [
      [0.12, 'bol', GOUD],
      [0.1, 'parels', GOUD],
      [0.3, 'hol', GOUD],
      [0.16, 'bol', GOUD],
      [0.12, 'parels', GOUD],
      [0.2, 'hol', GOUD],
    ],
    hoeken: false,
  },
  // Rijk verguld met ornamenten en hoekrozetten (Empire, David)
  barok: {
    dikte: 0.075,
    banden: [
      [0.1, 'bol', GOUD],
      [0.1, 'parels', GOUD],
      [0.22, 'blad', GOUD],
      [0.18, 'hol', GOUD],
      [0.12, 'bol', GOUD],
      [0.1, 'parels', GOUD],
      [0.18, 'hol', GOUD],
    ],
    hoeken: true,
  },
  // Donker ebbenhout met ribbels en een gouden binnenrand (Vlaams, 16e eeuw: Bruegel)
  ebben: {
    dikte: 0.058,
    banden: [
      [0.14, 'bol', EBBEN],
      [0.3, 'ribbel', EBBEN],
      [0.2, 'hol', EBBEN],
      [0.16, 'bol', EBBEN],
      [0.1, 'bol', GOUD],
      [0.1, 'vlak', EBBEN],
    ],
    hoeken: false,
  },
  // Zwart met een gouden binnenrand (Hollandse Gouden Eeuw: de Nachtwacht in het Rijksmuseum)
  zwart: {
    dikte: 0.055,
    banden: [
      [0.16, 'bol', ZWART],
      [0.34, 'hol', ZWART],
      [0.22, 'ribbel', ZWART],
      [0.12, 'bol', GOUD],
      [0.16, 'vlak', ZWART],
    ],
    hoeken: false,
  },
};

// Hoe groot en waar komt het schilderij, zodat lijst en bordje er rond passen?
// Geeft { x, y, b, h, T } in schermpixels (T = dikte van de lijst).
// verhouding = breedte / hoogte van het zichtbare doek (16/9, of smaller bij een "uitsnede")
export function plaatsing(W, H, stijl, metBordje = true, verhouding = 16 / 9) {
  const f = (LIJSTEN[stijl] ?? LIJSTEN.gotisch).dikte;
  const marge = Math.round(Math.min(W, H) * 0.025);
  const bordje = metBordje ? Math.round(H * 0.045) : 0;
  const b = Math.floor(Math.min((W - 2 * marge) / (1 + 2 * f), (H - 2 * marge - bordje) / (1 / verhouding + 2 * f)));
  const h = Math.round(b / verhouding);
  const T = Math.round(b * f);
  return { x: Math.round((W - b) / 2), y: Math.round((H - bordje - h) / 2), b, h, T };
}

// --- kleine hulpjes ---
const helder = (kleur, factor) => {
  const n = parseInt(kleur.slice(1), 16);
  const k = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(Math.min(255, c * factor)));
  return `rgb(${k[0]},${k[1]},${k[2]})`;
};

// Een band tekenen in "lokale" coördinaten: x langs de zijde, y van buiten (0) naar binnen
function tekenBand(ctx, soort, m, L, y0, d, licht) {
  const g = ctx.createLinearGradient(0, y0, 0, y0 + d);
  const k = (c, f = 1) => helder(c, f * licht);
  if (soort === 'bol') {
    g.addColorStop(0, k(m.donker));
    g.addColorStop(0.3, k(m.licht));
    g.addColorStop(0.55, k(m.midden));
    g.addColorStop(1, k(m.diep));
  } else if (soort === 'hol') {
    g.addColorStop(0, k(m.midden));
    g.addColorStop(0.35, k(m.diep));
    g.addColorStop(0.75, k(m.midden));
    g.addColorStop(1, k(m.licht));
  } else {
    g.addColorStop(0, k(m.midden, 1.05));
    g.addColorStop(1, k(m.midden, 0.85));
  }
  ctx.fillStyle = g;
  ctx.fillRect(-d, y0, L + 2 * d, d);

  if (soort === 'parels') {
    const r = d * 0.42;
    for (let x = r; x < L; x += r * 2.3) {
      const rg = ctx.createRadialGradient(x - r * 0.35, y0 + d / 2 - r * 0.35, r * 0.1, x, y0 + d / 2, r);
      rg.addColorStop(0, k(m.licht, 1.15));
      rg.addColorStop(0.5, k(m.midden));
      rg.addColorStop(1, k(m.diep));
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(x, y0 + d / 2, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (soort === 'blad') {
    // eieren en pijlpunten
    const stap = d * 0.9;
    for (let x = stap / 2; x < L; x += stap) {
      const rg = ctx.createRadialGradient(x - stap * 0.12, y0 + d * 0.4, 1, x, y0 + d * 0.5, d * 0.45);
      rg.addColorStop(0, k(m.licht, 1.1));
      rg.addColorStop(0.6, k(m.midden));
      rg.addColorStop(1, k(m.donker));
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.ellipse(x, y0 + d * 0.52, stap * 0.32, d * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = k(m.diep);
      ctx.lineWidth = Math.max(1, d * 0.05);
      ctx.stroke();
      ctx.fillStyle = k(m.donker);
      ctx.beginPath(); // pijlpunt
      ctx.moveTo(x + stap / 2, y0 + d * 0.12);
      ctx.lineTo(x + stap / 2 + stap * 0.08, y0 + d * 0.6);
      ctx.lineTo(x + stap / 2, y0 + d * 0.9);
      ctx.lineTo(x + stap / 2 - stap * 0.08, y0 + d * 0.6);
      ctx.fill();
    }
  } else if (soort === 'ribbel') {
    const stap = Math.max(3, d * 0.12);
    for (let x = 0; x < L; x += stap) {
      ctx.fillStyle = k(m.licht, 0.9);
      ctx.globalAlpha = 0.55;
      ctx.fillRect(x, y0 + d * 0.08, stap * 0.35, d * 0.84);
      ctx.fillStyle = k(m.diep);
      ctx.globalAlpha = 0.6;
      ctx.fillRect(x + stap * 0.5, y0 + d * 0.08, stap * 0.3, d * 0.84);
    }
    ctx.globalAlpha = 1;
  }
  // een fijne donkere lijn tussen twee banden
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(-d, y0 + d - 1, L + 2 * d, 1);
}

// Een hoekrozet (barok)
function tekenRozet(ctx, x, y, r) {
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  g.addColorStop(0, GOUD.licht);
  g.addColorStop(0.5, GOUD.midden);
  g.addColorStop(1, GOUD.diep);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.42, r * 0.2, a, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = GOUD.diep;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.38, 0, Math.PI * 2);
  ctx.fill();
}

// Ruis als een herbruikbaar patroon (bladgoud en hout zijn nooit egaal)
let ruisPatroon = null;
function ruis(ctx) {
  if (!ruisPatroon) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    const beeld = g.createImageData(256, 256);
    for (let i = 0; i < beeld.data.length; i += 4) {
      const v = 128 + (Math.random() - 0.5) * 70;
      beeld.data[i] = beeld.data[i + 1] = beeld.data[i + 2] = v;
      beeld.data[i + 3] = 255;
    }
    g.putImageData(beeld, 0, 0);
    ruisPatroon = c;
  }
  return ctx.createPattern(ruisPatroon, 'repeat');
}

// =====================================================================
// Alles tekenen: muur, lampje, lijst, schaduw op het doek en het bordje
// =====================================================================
export function tekenLijst(canvas, stijl, bordje = null, verhouding = 16 / 9, muurKleur = '#f2f0eb') {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const lijst = LIJSTEN[stijl] ?? LIJSTEN.gotisch;
  const p = plaatsing(W, H, stijl, Boolean(bordje), verhouding);
  const { x, y, b, h, T } = p;

  // 1. De muur: wit gepleisterd (zoals de muur op BYOB), met heel lichte structuur,
  //    een warme lichtvlek van het lampje en iets schemerigere hoeken
  ctx.fillStyle = muurKleur;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.035;
  ctx.fillStyle = ruis(ctx);
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;
  const spot = ctx.createRadialGradient(W / 2, y - T * 0.6, 10, W / 2, y + h * 0.2, Math.max(W, H) * 0.75);
  spot.addColorStop(0, 'rgba(255,236,200,0.18)');
  spot.addColorStop(0.5, 'rgba(255,230,190,0.04)');
  spot.addColorStop(1, 'rgba(60,45,30,0.10)');
  ctx.fillStyle = spot;
  ctx.fillRect(0, 0, W, H);

  // 2. Slagschaduw van de lijst op de muur (licht van boven)
  ctx.save();
  ctx.shadowColor = 'rgba(40,30,20,0.45)'; // op een witte muur: een zachte, bruingrijze schaduw
  ctx.shadowBlur = T * 0.9;
  ctx.shadowOffsetY = T * 0.35;
  ctx.fillStyle = '#000';
  ctx.fillRect(x - T, y - T, b + 2 * T, h + 2 * T);
  ctx.restore();

  // 3. De vier zijden, elk schuin afgesneden in de hoeken (verstek)
  const zijden = [
    { L: b + 2 * T, tx: x - T, ty: y - T, rot: 0, licht: 1.12 }, // boven: het meeste licht
    { L: h + 2 * T, tx: x + b + T, ty: y - T, rot: Math.PI / 2, licht: 0.82 }, // rechts
    { L: b + 2 * T, tx: x + b + T, ty: y + h + T, rot: Math.PI, licht: 0.62 }, // onder
    { L: h + 2 * T, tx: x - T, ty: y + h + T, rot: -Math.PI / 2, licht: 0.95 }, // links
  ];
  for (const z of zijden) {
    ctx.save();
    ctx.translate(z.tx, z.ty);
    ctx.rotate(z.rot);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(z.L, 0);
    ctx.lineTo(z.L - T, T);
    ctx.lineTo(T, T);
    ctx.closePath();
    ctx.clip();
    let y0 = 0;
    for (const [aandeel, soort, materiaal] of lijst.banden) {
      const d = aandeel * T;
      tekenBand(ctx, soort, materiaal, z.L, y0, d, z.licht);
      y0 += d;
    }
    // structuur: bladgoud / houtnerf
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = ruis(ctx);
    ctx.fillRect(0, 0, z.L, T);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.restore();
    // de verstekvoeg in de hoek
    ctx.save();
    ctx.translate(z.tx, z.ty);
    ctx.rotate(z.rot);
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(T, T);
    ctx.stroke();
    ctx.restore();
  }
  if (lijst.hoeken) {
    for (const [hx, hy] of [[x - T / 2, y - T / 2], [x + b + T / 2, y - T / 2], [x + b + T / 2, y + h + T / 2], [x - T / 2, y + h + T / 2]]) {
      tekenRozet(ctx, hx, hy, T * 0.42);
    }
  }

  // 4. Het gat voor het schilderij, met de schaduw die de lijst op het doek werpt
  ctx.clearRect(x, y, b, h);
  const s = Math.max(6, T * 0.35);
  const randen = [
    [x, y, b, s * 1.4, 0, 1, 0.55], // boven: de diepste schaduw (licht komt van boven)
    [x, y + h - s * 0.6, b, s * 0.6, 0, -1, 0.25],
    [x, y, s, h, 1, 0, 0.35],
    [x + b - s, y, s, h, -1, 0, 0.4],
  ];
  for (const [rx, ry, rb, rh, dx, dy, a] of randen) {
    const g = dx
      ? ctx.createLinearGradient(dx > 0 ? rx : rx + rb, 0, dx > 0 ? rx + rb : rx, 0)
      : ctx.createLinearGradient(0, dy > 0 ? ry : ry + rh, 0, dy > 0 ? ry + rh : ry);
    g.addColorStop(0, `rgba(0,0,0,${a})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(rx, ry, rb, rh);
  }

  // 5. Het schilderijlampje: een koperen buis boven de lijst
  const lb = b * 0.32;
  const lx = W / 2 - lb / 2;
  const ly = y - T - Math.max(10, T * 0.55);
  if (ly > 4) {
    const lg = ctx.createLinearGradient(0, ly, 0, ly + T * 0.32);
    lg.addColorStop(0, '#e9cf8e');
    lg.addColorStop(0.5, '#a07a33');
    lg.addColorStop(1, '#3c2a0e');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.roundRect(lx, ly, lb, T * 0.3, T * 0.15);
    ctx.fill();
    ctx.fillStyle = '#4a3512';
    ctx.fillRect(W / 2 - 3, ly + T * 0.3, 6, y - T - ly - T * 0.3); // de arm naar de lijst
  }

  // 6. Het koperen naambordje
  if (bordje) {
    const bh = Math.round(H * 0.03);
    ctx.font = `600 ${Math.round(bh * 0.42)}px 'Cormorant Garamond', Georgia, serif`;
    const tekst = bordje;
    const bb = ctx.measureText(tekst).width + bh * 1.6;
    const bx = W / 2 - bb / 2;
    const by = y + h + T + Math.round(H * 0.012);
    const bg = ctx.createLinearGradient(0, by, 0, by + bh);
    bg.addColorStop(0, '#e6c983');
    bg.addColorStop(0.5, '#b8913f');
    bg.addColorStop(1, '#7a5a1e');
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = bg;
    ctx.fillRect(bx, by, bb, bh);
    ctx.restore();
    ctx.strokeStyle = 'rgba(60,40,10,0.8)';
    ctx.strokeRect(bx + 2.5, by + 2.5, bb - 5, bh - 5);
    ctx.fillStyle = '#2e2008';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tekst, W / 2, by + bh / 2 + 1);
  }
  return p;
}
