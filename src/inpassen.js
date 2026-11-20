// =====================================================================
// INPASSEN: de personages laten passen bij het schilderij dat er hangt.
//
// Een personage is altijd in dezelfde kleuren getekend. Op een donker,
// warm schilderij (Waterloo) of een grijzig, rokerig doek (de Vrijheid)
// springen ze dan los van het beeld, als poppetjes die erover zweven.
// Daarom kijken we eerst naar het schilderij zelf:
//
//   1. KLEURGREEP (één keer per personage, op de muur)
//      De gemiddelde kleur, helderheid en verzadiging van het schilderij
//      op de plek waar de figuren lopen. Elk personage krijgt die "toon"
//      mee, zoals een schilder zijn hele doek in dezelfde vernis zet.
//
//   2. LICHTKAART (elke frame, per mannetje)
//      Een sterk vervaagde kaart van licht en donker. Wandelt een mannetje
//      in een donkere hoek, dan wordt het donkerder; in het licht lichter.
//
//   3. VERTE (elke frame, per mannetje)
//      Wie ver weg staat, wordt een beetje fletser (minder kleur en contrast),
//      zoals in het echt door de lucht ertussen.
//
// Hoe sterk dit alles is, staat per schilderij in schilderijen.js ("inpassen").
// Op de gsm gebeurt dit niet: daar zie je je personage in zijn echte kleuren.
// =====================================================================

// Hoe ziet een "gemiddeld" personage eruit? Hier zijn ze op gemaakt (het Lam Gods).
const PERSONAGE_HELDERHEID = 118;
const PERSONAGE_VERZADIGING = 0.38;

let greep = null; // { tint: [r, g, b], verzadiging, helderheid }
let palet = null; // Map: gekozen kleur (#hex) → dezelfde kleur in de tint van dit schilderij
let paletPixels = null; // de pixels van het (kleine) schilderij, om het palet uit te halen
let lichtkaart = null; // { data, breedte, hoogte, gemiddeld, sterkte }
let verteSterkte = 0;

const helderheidVan = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

function verzadigingVan(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

const begrens = (waarde, min, max) => Math.min(max, Math.max(min, waarde));

// ---------------------------------------------------------------------
// Het schilderij bekijken. Roep dit op de muur één keer op, vóór er
// personages verschijnen.
//   schilderijUrl = het schilderij
//   wereld        = de Wereld (voor het loopmasker)
//   instelling    = { sterkte, licht, verte } uit schilderijen.js (alles 0 … 1)
// ---------------------------------------------------------------------
export async function bekijkSchilderij(schilderijUrl, wereld, instelling = {}) {
  const sterkte = instelling.sterkte ?? 0.5; // hoe sterk de kleurgreep
  const lichtSterkte = instelling.licht ?? 0.6; // hoe sterk licht en donker per plek
  verteSterkte = instelling.verte ?? 0.3;

  const img = new Image();
  img.src = schilderijUrl;
  await img.decode();

  // Klein maken is genoeg (en snel): 192 x 108
  const B = 192;
  const H = 108;
  const canvas = document.createElement('canvas');
  canvas.width = B;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, B, H);
  const pixels = ctx.getImageData(0, 0, B, H).data;

  // 1. Gemiddelde kleur waar de figuren staan: de loopzone, en een stuk erboven
  //    (een figuur is hoger dan de plek waar zijn voeten staan).
  let som = [0, 0, 0];
  let somHelderheid = 0;
  let somVerzadiging = 0;
  let aantal = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < B; x++) {
      const wx = ((x + 0.5) / B) * wereld.breedte;
      const wy = ((y + 0.5) / H) * wereld.hoogte;
      // in de loopzone, of tot 200 px erboven
      const telt = [0, 70, 140, 200].some((d) => wereld.isLoopbaar(wx, wy + d));
      if (!telt) continue;
      const i = (y * B + x) * 4;
      const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]];
      som = [som[0] + r, som[1] + g, som[2] + b];
      somHelderheid += helderheidVan(r, g, b);
      somVerzadiging += verzadigingVan(r, g, b);
      aantal++;
    }
  }
  if (aantal === 0) return; // geen loopzone? dan niets aanpassen

  const gemiddeld = som.map((s) => s / aantal);
  const grijs = (gemiddeld[0] + gemiddeld[1] + gemiddeld[2]) / 3;
  const helderheid = somHelderheid / aantal;
  const verzadiging = somVerzadiging / aantal;

  paletPixels = pixels;
  palet = new Map();

  greep = {
    // Elk kanaal een beetje richting de kleur van het schilderij (warm, koel, groen ...)
    // (begrensd: anders wordt blauw op een heel warm schilderij groenig)
    tint: gemiddeld.map((k) => begrens((k / grijs) ** (sterkte * 0.6), 0.85, 1.2)),
    // Even helder als het schilderij
    helderheid: begrens((helderheid / PERSONAGE_HELDERHEID) ** sterkte, 0.55, 1.15),
    // Even kleurrijk (of even flets) als het schilderij
    verzadiging: begrens((verzadiging / PERSONAGE_VERZADIGING) ** sterkte, 0.55, 1.15),
  };

  // 2. Lichtkaart: het schilderij heel wazig, alleen de helderheid
  const LB = 64;
  const LH = 36;
  const klein = document.createElement('canvas');
  klein.width = LB;
  klein.height = LH;
  const kctx = klein.getContext('2d', { willReadFrequently: true });
  kctx.filter = 'blur(3px)';
  kctx.drawImage(img, 0, 0, LB, LH);
  const kaartPixels = kctx.getImageData(0, 0, LB, LH).data;
  const data = new Float32Array(LB * LH);
  for (let i = 0; i < data.length; i++) {
    data[i] = helderheidVan(kaartPixels[i * 4], kaartPixels[i * 4 + 1], kaartPixels[i * 4 + 2]);
  }
  lichtkaart = { data, breedte: LB, hoogte: LH, gemiddeld: helderheid, sterkte: lichtSterkte };
}

// ---------------------------------------------------------------------
// PALET PER SCHILDERIJ: dezelfde kleur, maar in de tint van dit schilderij.
// Rood blijft rood, maar wordt het rood dat déze schilder gebruikte: het warme vermiljoen
// van Van Eyck, het gedempte steenrood van Bruegel, het diepe karmijn van David...
//
// Hoe? We zoeken in het schilderij alle pixels met ongeveer dezelfde kleurtoon (±20°) en nemen
// daarvan de mediaan: welke toon, hoe verzadigd, hoe licht. De gekozen kleur schuift daar een
// eind naartoe (sterkte = PALET_STERKTE). Grijze, witte en zwarte kleuren nemen de "neutrale"
// tint van het schilderij over (warm wit bij Bruegel, koel grijs ...), maar blijven even licht.
// ---------------------------------------------------------------------
const PALET_STERKTE = 0.65;

function naarHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

function naarHex(h, s, l) {
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return '#' + [f(0), f(8), f(4)].map((x) => Math.round(begrens(x, 0, 1) * 255).toString(16).padStart(2, '0')).join('');
}

const percentiel = (lijst, p) => {
  const s = [...lijst].sort((a, b) => a - b);
  return s[Math.floor(s.length * p)];
};
const mediaan = (lijst) => percentiel(lijst, 0.5);

// Het kortste verschil tussen twee kleurtonen (in graden, -180 … 180)
const toonVerschil = (a, b) => ((b - a + 540) % 360) - 180;

export function schilderijKleur(hex) {
  if (!palet || !/^#[0-9a-f]{6}$/i.test(hex ?? '')) return hex;
  if (palet.has(hex)) return palet.get(hex);

  const [h0, s0, l0] = naarHsl(...[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)));
  const grijs = s0 < 0.08; // alleen echt grijs, wit en zwart (lila blijft lila)
  const tonen = [], verzadigingen = [], lichten = [];
  for (let i = 0; i < paletPixels.length; i += 4) {
    const [h, s, l] = naarHsl(paletPixels[i], paletPixels[i + 1], paletPixels[i + 2]);
    if (l < 0.06 || l > 0.96) continue;
    const past = grijs ? s > 0.04 && s < 0.3 && Math.abs(l - l0) < 0.25 : s > 0.25 && Math.abs(toonVerschil(h0, h)) < 20;
    if (!past) continue;
    tonen.push(toonVerschil(h0, h));
    verzadigingen.push(s);
    lichten.push(l);
  }

  let uit = hex;
  const genoeg = 0.004 * (paletPixels.length / 4); // minstens 0,4 % van het schilderij
  if (tonen.length >= 25) {
    // weinig van die kleur in het schilderij? dan ook maar een beetje aanpassen
    const t = PALET_STERKTE * Math.min(1, tonen.length / genoeg);
    if (grijs) {
      // de kleurtoon van de neutrale vlakken (bv. warm, gelig wit), heel licht verzadigd, even licht
      const h = (h0 + mediaan(tonen) + 360) % 360;
      uit = naarHex(h, begrens(s0 + (mediaan(verzadigingen) - s0) * 0.4 * t, 0, 0.14), l0);
    } else {
      // De kleur blijft herkenbaar: toon hooguit 12° verschuiven, verzadiging en licht binnen grenzen
      const h = (h0 + begrens(mediaan(tonen), -12, 12) * t + 360) % 360;
      const sat = begrens(s0 + (percentiel(verzadigingen, 0.7) - s0) * t, s0 * 0.85, Math.min(1, s0 * 1.15));
      const l = l0 + begrens((mediaan(lichten) - l0) * t * 0.5, -0.05, 0.05);
      uit = naarHex(h, sat, l);
    }
  }
  palet.set(hex, uit);
  return uit;
}

// ---------------------------------------------------------------------
// Voor personage.js: een sleutel, zodat een personage opnieuw getekend wordt
// als de kleurgreep verandert (en anders uit het geheugen komt).
// ---------------------------------------------------------------------
export function greepSleutel() {
  return greep ? JSON.stringify(greep) : '';
}

// Past de kleurgreep toe op een canvas (in personage.js, net voor het opslaan).
// Zonder kleurgreep (op de gsm) gebeurt er niets.
export function kleurNaarSchilderij(canvas) {
  if (!greep) return;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const beeld = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = beeld.data;
  const { tint, helderheid, verzadiging } = greep;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue; // doorzichtig: overslaan
    const licht = helderheidVan(d[i], d[i + 1], d[i + 2]);
    for (let k = 0; k < 3; k++) {
      const waarde = licht + (d[i + k] - licht) * verzadiging; // meer of minder kleur
      d[i + k] = waarde * tint[k] * helderheid; // de toon van het schilderij
    }
  }
  ctx.putImageData(beeld, 0, 0);
}

// Een getekend mannetje (van "Zelf tekenen") ook inkleuren. Geeft een nieuwe data-URL.
export async function kleurTekening(bron) {
  if (!greep) return bron;
  const img = new Image();
  img.src = bron;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext('2d').drawImage(img, 0, 0);
  kleurNaarSchilderij(canvas);
  return canvas.toDataURL('image/png');
}

// ---------------------------------------------------------------------
// Hoe licht is het op plek (x, y)? Geeft een factor voor CSS brightness():
// 1 = gewoon, < 1 = in de schaduw, > 1 = in het licht.
// ---------------------------------------------------------------------
export function lichtOp(x, y) {
  if (!lichtkaart) return 1;
  const { data, breedte, hoogte, gemiddeld, sterkte } = lichtkaart;
  const kx = begrens(Math.floor((x / 1920) * breedte), 0, breedte - 1);
  const ky = begrens(Math.floor((y / 1080) * hoogte), 0, hoogte - 1);
  const verhouding = data[ky * breedte + kx] / gemiddeld;
  return begrens(verhouding ** (0.5 * sterkte), 0.68, 1.2);
}

// Hoe sterk de verte het personage flets maakt (0 = niet)
export function verteFactor() {
  return verteSterkte;
}
