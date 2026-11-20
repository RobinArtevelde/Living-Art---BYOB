// =====================================================================
// HET PERSONAGE
//
// Een bezoeker stelt op de gsm een middeleeuws personage samen: man of vrouw,
// gezicht, haar, baard, hoofddeksel, kleed, mantel, broek, schoenen, iets in
// de handen (de pose past zich aan), en kleuren.
//
// Op de gsm en op de muur wordt het personage op een canvas getekend.
// De vormen zijn getekende paden, maar ze worden gevuld met ECHT MATERIAAL
// uit het Lam Gods (public/materiaal/): plooien, stoffen, haar, hoeden en
// gezichten. Zo ziet het er geschilderd uit.
//
// Over de database gaan alleen korte woorden (bv. hoofddeksel: 'kroon'),
// geen afbeeldingen. De muur tekent het personage zelf opnieuw.
//
// Coördinaten: een personage is 60 eenheden breed en 100 hoog (voeten op y=100).
// Er is 20 eenheden extra ruimte boven het hoofd (voor mijters, lansen, ...),
// dus het canvas is 60 x 120 eenheden = 360 x 720 pixels (K = 6 pixels per eenheid).
// =====================================================================

import { kleurNaarSchilderij, greepSleutel, schilderijKleur } from './inpassen.js';

const K = 6; // pixels per eenheid
const BOVENMARGE = 20; // extra eenheden boven het hoofd
const CANVAS_BREEDTE = 60 * K;
const CANVAS_HOOGTE = (100 + BOVENMARGE) * K;
const MAP = 'materiaal/';

// ---------------------------------------------------------------------
// KLEUREN (gedempte kleuren zoals bij Van Eyck)
// ---------------------------------------------------------------------
export const STOFKLEUREN = [
  '#a3241a', // rood
  '#6e1410', // donkerrood
  '#1c3f6e', // ultramarijn
  '#3f6a96', // lichtblauw
  '#d9cdb8', // ongebleekt linnen
  '#a99aa6', // lila-grijs
  '#5c6a2a', // olijfgroen
  '#c0592e', // oranje
  '#b58a3a', // oker
  '#2b2622', // bijna zwart
];
export const HAARKLEUREN = ['#2a1c14', '#5a3a22', '#8a4a22', '#b8904a', '#a49c90'];
export const HUIDSKLEUREN = ['#e8c0a2', '#d4a07e', '#a87457', '#7a4e36', '#4e3222'];
const GRIJS_HAAR = HAARKLEUREN[4];

// ---------------------------------------------------------------------
// ALLE KEUZES die de gsm toont.
// Elke rij: label + opties [id, tekst op de gsm].
// "alleen" = een voorwaarde: de rij wordt enkel getoond als die waar is.
// Een id mag max. 20 tekens zijn (database.rules.json controleert dat).
// ---------------------------------------------------------------------
export const KEUZES = {
  geslacht: {
    label: 'Ik ben',
    opties: [
      ['man', 'Man'],
      ['vrouw', 'Vrouw'],
    ],
  },
  // Vier gezichtsvormen; "-s" = gespiegeld.
  // De gsm toont deze rij NIET meer (zie STAPPEN in join.js): de vorm wordt willekeurig gekozen,
  // de bezoeker kiest alleen de uitdrukking (blij, boos, ...).
  gezicht: {
    label: 'Gezicht',
    opties: [
      ['jong', 'Gezicht 1'],
      ['edel', 'Gezicht 2'],
      ['krul', 'Gezicht 3'],
      ['kloosterling', 'Gezicht 4'],
      ['jong-s', 'Gezicht 5'],
      ['edel-s', 'Gezicht 6'],
      ['krul-s', 'Gezicht 7'],
      ['kloosterling-s', 'Gezicht 8'],
    ],
  },
  uitdrukking: {
    label: 'Gezicht', // op de gsm heet deze rij gewoon "Gezicht": blij, boos, ...
    opties: [
      ['rustig', 'Rustig'],
      ['blij', 'Blij'],
      ['lachend', 'Lachend'],
      ['verbaasd', 'Verbaasd'],
      ['boos', 'Boos'],
      ['verdrietig', 'Verdrietig'],
    ],
  },
  leeftijd: {
    label: 'Leeftijd',
    opties: [
      ['jong', 'Jong'],
      ['volwassen', 'Volwassen'],
      ['oud', 'Oud'],
    ],
  },
  haar: {
    label: 'Haar',
    opties: [
      ['kort', 'Kort'],
      ['pagekop', 'Pagekop'],
      ['lang', 'Lang'],
      ['krullen', 'Krullen'],
      ['vlechten', 'Vlechten'],
      ['knot', 'Knot'],
      ['kaal', 'Kaal'],
    ],
  },
  baard: {
    label: 'Baard',
    alleen: (p) => p.geslacht === 'man',
    opties: [
      ['geen', 'Geen'],
      ['stoppels', 'Stoppels'],
      ['kort', 'Korte baard'],
      ['lang', 'Lange baard'],
      ['punt', 'Puntbaard'],
      ['gevorkt', 'Gevorkte baard'],
    ],
  },
  snor: {
    label: 'Snor',
    alleen: (p) => p.geslacht === 'man',
    opties: [
      ['geen', 'Geen'],
      ['dun', 'Dun'],
      ['krul', 'Krulsnor'],
      ['hang', 'Hangsnor'],
    ],
  },
  hoofddeksel: {
    label: 'Hoofddeksel',
    opties: [
      ['geen', 'Niets'],
      ['tulband', 'Tulband'],
      ['hoed', 'Hoed'],
      ['kap', 'Kap'],
      ['sluier', 'Sluier'],
      ['hennin', 'Puntmuts met sluier'],
      ['kroon', 'Kroon'],
      ['mijter', 'Mijter'],
      ['helm', 'Ridderhelm'],
      ['bontmuts', 'Bontmuts'],
      ['aureool', 'Aureool'],
      // Bij de andere schilderijen (zie garderobe in schilderijen.js):
      ['shako', 'Soldatenmuts'],
      ['steek', 'Steek (Napoleonhoed)'],
      ['lauwerkrans', 'Gouden lauwerkrans'],
      ['breedhoed', 'Hoed met veer'],
      ['hogehoed', 'Hoge hoed'],
      ['vrijheidsmuts', 'Vrijheidsmuts'],
      ['hoofddoek', 'Hoofddoek'],
    ],
  },
  kleed: {
    label: 'Kleed',
    opties: [
      ['tuniek', 'Korte tuniek'],
      ['lang', 'Lange tuniek'],
      ['jurk', 'Jurk'],
      ['pij', 'Monnikspij'],
      ['malien', 'Maliënkolder'],
      ['harnas', 'Harnas'],
      ['uniform', 'Soldatenjas'],
      ['wambuis', 'Wambuis met kraag'],
      ['hemd', 'Gescheurd hemd'],
    ],
  },
  bovenkleed: {
    label: 'Mantel',
    opties: [
      ['geen', 'Geen'],
      ['mantel', 'Open mantel'],
      ['houppelande', 'Lange bontmantel'],
      ['cape', 'Schoudercape'],
      ['koorkap', 'Bisschopsmantel'],
      ['wapenrok', 'Wapenrok'],
      ['hermelijn', 'Keizersmantel'],
      ['sjerp', 'Sjerp'],
    ],
  },
  riem: {
    label: 'Riem',
    opties: [
      ['leer', 'Leren riem'],
      ['goud', 'Gouden gordel'],
      ['geen', 'Geen'],
    ],
  },
  broek: {
    label: 'Broek',
    opties: [
      ['kousen', 'Kousen'],
      ['miparti', 'Tweekleurig'],
      ['pofbroek', 'Pofbroek'],
      ['malien', 'Maliën'],
    ],
  },
  schoenen: {
    label: 'Schoenen',
    opties: [
      ['puntschoenen', 'Puntschoenen'],
      ['laarzen', 'Laarzen'],
      ['sandalen', 'Sandalen'],
      ['ijzer', 'IJzeren schoenen'],
      ['blootsvoets', 'Blootsvoets'],
    ],
  },
  voorwerp: {
    label: 'In je handen',
    opties: [
      ['geen', 'Niets'],
      ['boek', 'Boek'],
      ['kelk', 'Gouden kelk'],
      ['rozenkrans', 'Rozenkrans'],
      ['luit', 'Luit'],
      ['staf', 'Staf'],
      ['lans', 'Lans met vaandel'],
      ['zwaard', 'Zwaard'],
      ['schild', 'Schild'],
      ['lantaarn', 'Lantaarn'],
      ['sabel', 'Sabel in de lucht'],
      ['musket', 'Musket'],
      ['vlag', 'Vlag'],
      ['trommel', 'Trommel'],
      ['scepter', 'Scepter'],
      ['doek', 'Zwaaidoek'],
      ['kip', 'Kip'],
    ],
  },
  // Alleen met lege handen kies je zelf de houding
  houding: {
    label: 'Houding',
    alleen: (p) => p.voorwerp === 'geen',
    opties: [
      ['langs', 'Armen naast je'],
      ['bidden', 'Biddend'],
      ['zwaaien', 'Arm in de lucht'],
    ],
  },
};

// De kleuren die je kan kiezen (rijen met bolletjes op de gsm)
export const KLEURKEUZES = {
  huid: { label: 'Huidskleur', kleuren: HUIDSKLEUREN },
  haarkleur: { label: 'Haarkleur', kleuren: HAARKLEUREN },
  kleedkleur: { label: 'Kleur van je kleed', kleuren: STOFKLEUREN },
  bovenkleur: { label: 'Kleur van je mantel en hoofddeksel', kleuren: STOFKLEUREN },
  broekkleur: { label: 'Kleur van je broek', kleuren: STOFKLEUREN },
};

// Welke armhouding hoort bij welk voorwerp?
const HOUDING_VAN = {
  boek: 'borst',
  kelk: 'borst',
  rozenkrans: 'borst',
  luit: 'borst',
  staf: 'staf',
  lans: 'staf',
  zwaard: 'zwaard',
  schild: 'schild',
  lantaarn: 'langs',
  sabel: 'omhoog',
  musket: 'staf',
  vlag: 'staf',
  trommel: 'borst',
  scepter: 'staf',
  doek: 'omhoog',
  kip: 'borst',
};

// Bij deze lange kleren zie je de benen niet stappen: dan schrijdt het hele lijf
const LANGE_KLEDEN = ['lang', 'jurk', 'pij'];
const LANGE_BOVENKLEDEN = ['houppelande', 'koorkap'];

const GOUD = '#c99a36';
const LINNEN = '#d3c8b2'; // gebroken wit voor sluiers en mijters (fel wit springt te hard uit op de muur)
const OMTREK = 'rgba(40, 24, 16, 0.7)'; // de fijne donkere lijn rond elke vorm

const kiesWillekeurig = (lijst) => lijst[Math.floor(Math.random() * lijst.length)];

// ---------------------------------------------------------------------
// Een personage geldig maken: onbekende of ontbrekende waarden → de eerste optie.
// Zo kan een fout of een oud bericht nooit iets laten crashen.
// ---------------------------------------------------------------------
export function controleerPersonage(p) {
  const goed = {};
  for (const [sleutel, rij] of Object.entries(KEUZES)) {
    goed[sleutel] = rij.opties.some(([id]) => id === p?.[sleutel]) ? p[sleutel] : rij.opties[0][0];
  }
  for (const [sleutel, rij] of Object.entries(KLEURKEUZES)) {
    goed[sleutel] = rij.kleuren.includes(p?.[sleutel]) ? p[sleutel] : rij.kleuren[0];
  }
  return goed;
}

// Is dit een personage van dit systeem? (heeft een geslacht)
export function isPersonage(onderdelen) {
  return typeof onderdelen?.geslacht === 'string';
}

// Een willekeurig (maar logisch) personage, voor "Verras me" en de T-toets.
// garderobe (optioneel) = de keuzes die bij het huidige schilderij horen (zie schilderijen.js).
export function willekeurigPersonage(garderobe) {
  const vrouw = Math.random() < 0.45;
  const p = {
    geslacht: vrouw ? 'vrouw' : 'man',
    gezicht: kiesWillekeurig(KEUZES.gezicht.opties)[0],
    leeftijd: kiesWillekeurig(['jong', 'volwassen', 'volwassen', 'oud']),
    uitdrukking: kiesWillekeurig(['rustig', 'rustig', 'rustig', 'blij', 'blij', 'lachend']), // de stille, ernstige gezichten van de oude meesters (zelf kiezen kan alles)
    haar: kiesWillekeurig(vrouw ? ['lang', 'vlechten', 'knot', 'krullen'] : ['kort', 'pagekop', 'lang', 'krullen', 'kaal']),
    baard: vrouw ? 'geen' : kiesWillekeurig(['geen', 'geen', 'kort', 'lang', 'punt', 'gevorkt', 'stoppels']),
    snor: vrouw ? 'geen' : kiesWillekeurig(['geen', 'geen', 'dun', 'krul', 'hang']),
    hoofddeksel: kiesWillekeurig(
      vrouw
        ? ['geen', 'sluier', 'hennin', 'kroon', 'kap']
        : ['geen', 'geen', 'tulband', 'hoed', 'kap', 'kroon', 'mijter', 'helm', 'bontmuts'],
    ),
    kleed: kiesWillekeurig(vrouw ? ['jurk', 'jurk', 'lang'] : ['tuniek', 'lang', 'pij', 'malien', 'harnas']),
    bovenkleed: kiesWillekeurig(['geen', 'mantel', 'houppelande', 'cape', 'koorkap', 'wapenrok']),
    riem: kiesWillekeurig(['leer', 'goud', 'geen']),
    broek: kiesWillekeurig(['kousen', 'miparti', 'pofbroek', 'malien']),
    schoenen: kiesWillekeurig(['puntschoenen', 'laarzen', 'sandalen', 'ijzer']),
    voorwerp: kiesWillekeurig(KEUZES.voorwerp.opties)[0],
    houding: kiesWillekeurig(['langs', 'bidden']),
    huid: kiesWillekeurig(HUIDSKLEUREN),
    haarkleur: kiesWillekeurig(HAARKLEUREN),
    kleedkleur: kiesWillekeurig(STOFKLEUREN),
    bovenkleur: kiesWillekeurig(STOFKLEUREN),
    broekkleur: kiesWillekeurig(STOFKLEUREN),
  };
  // Een ridder draagt geen mijter
  if (p.kleed === 'harnas' || p.kleed === 'malien') p.hoofddeksel = kiesWillekeurig(['helm', 'geen', 'kroon']);
  // Bij een ander schilderij: kies uit de kleren en voorwerpen van dat schilderij
  if (garderobe) {
    for (const [sleutel, ids] of Object.entries(garderobe)) {
      let opties = ids;
      if (sleutel === 'kleed') opties = ids.filter((id) => (id === 'jurk') === vrouw); // jurken voor vrouwen
      if (!opties.length) opties = ids;
      p[sleutel] = kiesWillekeurig(opties);
    }
  }
  return controleerPersonage(p);
}

// Past een personage bij een garderobe? Zo niet: zet de onderdelen die niet passen
// op de eerste keuze van de garderobe (bv. na een wissel van schilderij op de gsm).
export function pasAanGarderobe(p, garderobe) {
  const nieuw = { ...p };
  for (const [sleutel, ids] of Object.entries(garderobe ?? {})) {
    if (!ids.includes(nieuw[sleutel])) nieuw[sleutel] = ids[0];
  }
  return controleerPersonage(nieuw);
}

// ---------------------------------------------------------------------
// HULPFUNCTIES
// ---------------------------------------------------------------------

// Een kleur lichter (hoeveel > 0) of donkerder (hoeveel < 0) maken. hoeveel: -1 … 1
function tint(hex, hoeveel) {
  const doel = hoeveel > 0 ? 255 : 0;
  const t = Math.abs(hoeveel);
  return (
    '#' +
    [1, 3, 5]
      .map((i) => {
        const kanaal = parseInt(hex.slice(i, i + 2), 16);
        return Math.round(kanaal + (doel - kanaal) * t)
          .toString(16)
          .padStart(2, '0');
      })
      .join('')
  );
}

// Een "toeval" dat altijd hetzelfde is voor hetzelfde personage
// (anders zouden de haren op de gsm en op de muur net anders liggen).
function vastToeval(tekst) {
  let zaad = 7;
  for (const teken of tekst) zaad = (zaad * 31 + teken.charCodeAt(0)) % 2147483647;
  return () => (zaad = (zaad * 16807) % 2147483647) / 2147483647;
}

// --- Het materiaal uit het schilderij laden (één keer) ---
let materiaalBelofte = null;

function laadAfbeelding(naam) {
  const img = new Image();
  img.src = MAP + naam + '.png';
  return img.decode().then(() => img);
}

function laadMateriaal() {
  if (!materiaalBelofte) {
    const namen = [
      'plooi-mantel', 'plooi-fluweel', 'plooi-linnen', 'plooi-tuniek',
      'stof-fluweel', 'stof-linnen', 'stof-brokaat', 'stof-wol',
      'haar-zwart', 'haar-grijs', 'haar-krul',
      'hoed-tulband', 'hoed-hoed',
      ...['jong', 'edel', 'krul', 'kloosterling'].flatMap((g) => [`gezicht-man-${g}`, `gezicht-vrouw-${g}`]),
    ];
    materiaalBelofte = Promise.all([
      ...namen.map(laadAfbeelding),
      fetch(MAP + 'gezichten.json').then((r) => r.json()), // gemiddelde helderheid per gezicht
      fetch(MAP + 'materiaal.json').then((r) => r.json()), // maten en helderheid van de hoeden
    ]).then((resultaten) => ({
      beeld: Object.fromEntries(namen.map((naam, i) => [naam, resultaten[i]])),
      gezichten: resultaten[namen.length],
      maten: resultaten[namen.length + 1],
    }));
  }
  return materiaalBelofte;
}

// Een afbeelding omkleuren MET BEHOUD VAN LICHT EN SCHADUW.
// Elke pixel krijgt de nieuwe kleur, maal zijn eigen helderheid (t.o.v. de gemiddelde helderheid).
//   sterkte: 0 = origineel, 1 = volledig de nieuwe kleur
//   gamma:   > 1 = meer contrast
function omkleuren(img, kleur, gemiddeldeHelderheid, sterkte = 1, gamma = 0.8) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth ?? img.width;
  canvas.height = img.naturalHeight ?? img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const beeld = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = beeld.data;
  const rgb = [1, 3, 5].map((i) => parseInt(kleur.slice(i, i + 2), 16));
  for (let i = 0; i < d.length; i += 4) {
    const licht = ((0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]) / gemiddeldeHelderheid) ** gamma;
    for (let k = 0; k < 3; k++) d[i + k] = d[i + k] * (1 - sterkte) + Math.min(255, rgb[k] * licht) * sterkte;
  }
  ctx.putImageData(beeld, 0, 0);
  return canvas;
}

// ---------------------------------------------------------------------
// HET PENSEEL: tekent vormen (SVG-paden) en vult ze met geschilderd materiaal.
// ---------------------------------------------------------------------
class Penseel {
  constructor(ctx, materiaal, toeval) {
    this.ctx = ctx;
    this.m = materiaal;
    this.toeval = toeval;
    this.patronen = {};
  }

  // Een herhalend patroon van een stof-afbeelding (één keer aangemaakt)
  patroon(naam, schaal = 1) {
    const sleutel = naam + schaal;
    if (!this.patronen[sleutel]) {
      const patroon = this.ctx.createPattern(this.m.beeld[naam], 'repeat');
      patroon.setTransform(new DOMMatrix().scale((schaal / K) * 1.4));
      this.patronen[sleutel] = patroon;
    }
    return this.patronen[sleutel];
  }

  // STOF: de basiskleur, dan echte plooien uit het schilderij (overlay),
  // dan de structuur van de stof, een schaduw naar rechts, en een zachte donkere rand.
  //   opties.plooi:   'mantel' | 'fluweel' | 'linnen' | 'tuniek' | null (geen plooien)
  //   opties.kader:   [x, y, breedte, hoogte] waar de plooi-afbeelding komt
  //   opties.weefsel: 'wol' | 'fluweel' | 'linnen' | 'brokaat' | null
  stof(pad, kleur, opties = {}) {
    const { ctx } = this;
    const vorm = new Path2D(pad);
    ctx.save();
    ctx.clip(vorm);
    ctx.fillStyle = kleur;
    ctx.fillRect(-10, -30, 80, 140);

    if (opties.plooi !== null) {
      const [x, y, b, h] = opties.kader ?? [10, 25, 40, 75];
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = opties.plooiSterkte ?? 0.95;
      ctx.drawImage(this.m.beeld['plooi-' + (opties.plooi ?? 'mantel')], x, y, b, h);
    }
    if (opties.weefsel !== null) {
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = this.patroon('stof-' + (opties.weefsel ?? 'wol'));
      ctx.fillRect(-10, -30, 80, 140);
    }

    // Licht van links, schaduw rechts
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'multiply';
    const schaduw = ctx.createLinearGradient(12, 0, 50, 4);
    schaduw.addColorStop(0, 'rgba(255,255,255,0)');
    schaduw.addColorStop(0.55, 'rgba(225,215,205,0.2)');
    schaduw.addColorStop(1, 'rgba(35,20,12,0.55)');
    ctx.fillStyle = schaduw;
    ctx.fillRect(-10, -30, 80, 140);

    // Zachte donkere rand binnenin (geeft volume)
    ctx.filter = `blur(${1.4 * K}px)`;
    ctx.strokeStyle = 'rgba(25,12,6,0.55)';
    ctx.lineWidth = 2.6;
    ctx.stroke(vorm);
    ctx.filter = 'none';
    ctx.restore();

    // Fijne omtrek
    ctx.strokeStyle = OMTREK;
    ctx.lineWidth = 0.3;
    ctx.stroke(vorm);
  }

  // GOUD: goudkleur met brokaat-structuur
  goud(pad) {
    this.stof(pad, GOUD, { plooi: null, weefsel: 'brokaat' });
  }

  // METAAL: glanzend staal (harnas, helm, zwaard). van/tot = waar het licht → donker verloopt
  metaal(pad, van = 14, tot = 46) {
    const { ctx } = this;
    const vorm = new Path2D(pad);
    ctx.save();
    ctx.clip(vorm);
    const glans = ctx.createLinearGradient(van, 0, tot, 0);
    glans.addColorStop(0, '#dfe3e6');
    glans.addColorStop(0.3, '#aeb5bb');
    glans.addColorStop(0.55, '#7f878e');
    glans.addColorStop(1, '#3c4248');
    ctx.fillStyle = glans;
    ctx.fillRect(-10, -30, 80, 140);
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = this.patroon('stof-brokaat', 0.6);
    ctx.fillRect(-10, -30, 80, 140);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'multiply';
    ctx.filter = `blur(${1.2 * K}px)`;
    ctx.strokeStyle = 'rgba(20,20,25,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke(vorm);
    ctx.restore();
    ctx.strokeStyle = 'rgba(25,25,30,0.8)';
    ctx.lineWidth = 0.3;
    ctx.stroke(vorm);
  }

  // MALIËN: kleine ringetjes in rijen
  malien(pad) {
    const { ctx } = this;
    const vorm = new Path2D(pad);
    ctx.save();
    ctx.clip(vorm);
    ctx.fillStyle = '#464b51';
    ctx.fillRect(-10, -30, 80, 140);
    ctx.strokeStyle = '#b4bbc1';
    ctx.lineWidth = 0.2;
    for (let y = -20; y < 100; y += 0.8) {
      ctx.beginPath();
      for (let x = 0; x < 60; x += 1) {
        const verschuif = (Math.round(y / 0.8) % 2) * 0.5; // elke tweede rij een halve ring opzij
        ctx.moveTo(x + verschuif + 0.38, y);
        ctx.arc(x + verschuif, y, 0.38, 0, Math.PI);
      }
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'multiply';
    const schaduw = ctx.createLinearGradient(14, 0, 46, 0);
    schaduw.addColorStop(0, 'rgba(255,255,255,0)');
    schaduw.addColorStop(1, 'rgba(15,15,20,0.6)');
    ctx.fillStyle = schaduw;
    ctx.fillRect(-10, -30, 80, 140);
    ctx.filter = `blur(${1.2 * K}px)`;
    ctx.strokeStyle = 'rgba(10,10,15,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke(vorm);
    ctx.restore();
    ctx.strokeStyle = OMTREK;
    ctx.lineWidth = 0.3;
    ctx.stroke(vorm);
  }

  // HUID: effen kleur met schaduw (geen plooien of weefsel)
  huid(pad, kleur) {
    this.stof(pad, kleur, { plooi: null, weefsel: null });
  }

  // HAAR: kleur + echte haarstructuur uit het schilderij + losse haarlokjes
  //   soort: 'zwart' | 'grijs' | 'krul' (welke haar-afbeelding)
  haar(pad, kleur, soort = 'zwart') {
    const { ctx, toeval } = this;
    const vorm = new Path2D(pad);
    ctx.save();
    ctx.clip(vorm);
    ctx.fillStyle = kleur;
    ctx.fillRect(-10, -30, 80, 140);
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = this.patroon('haar-' + soort, 0.55);
    ctx.fillRect(-10, -30, 80, 140);

    // Lichte en donkere lokjes
    ctx.globalAlpha = 0.55;
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineCap = 'round';
    for (let i = 0; i < 120; i++) {
      const x = 18 + toeval() * 24;
      const y = -4 + toeval() * 46;
      ctx.strokeStyle = toeval() > 0.55 ? tint(kleur, 0.3) : tint(kleur, -0.4);
      ctx.lineWidth = 0.12 + toeval() * 0.15;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + (x - 30) * 0.1, y + 1.5, x + (x - 30) * 0.05, y + 3 + toeval() * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'multiply';
    ctx.filter = `blur(${0.9 * K}px)`;
    ctx.strokeStyle = 'rgba(20,10,5,0.5)';
    ctx.lineWidth = 1.4;
    ctx.stroke(vorm);
    ctx.restore();
  }

  lijn(pad, kleur, dikte) {
    this.ctx.strokeStyle = kleur;
    this.ctx.lineWidth = dikte;
    this.ctx.lineCap = 'round';
    this.ctx.stroke(new Path2D(pad));
  }

  vul(pad, kleur) {
    this.ctx.fillStyle = kleur;
    this.ctx.fill(new Path2D(pad));
  }
}

// SVG-pad van een cirkel en van een ellips
const cirkel = (x, y, r) => `M${x - r} ${y} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`;
const ellips = (x, y, rx, ry) => `M${x - rx} ${y} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0`;

// Een "buis" langs een reeks punten (voor armen/mouwen): punten [[x,y],...], diktes per punt
function buis(punten, diktes) {
  const links = [];
  const rechts = [];
  for (let i = 0; i < punten.length; i++) {
    const vorige = punten[Math.max(i - 1, 0)];
    const volgende = punten[Math.min(i + 1, punten.length - 1)];
    const dx = volgende[0] - vorige[0];
    const dy = volgende[1] - vorige[1];
    const lengte = Math.hypot(dx, dy) || 1;
    const nx = -dy / lengte; // loodrecht op de richting
    const ny = dx / lengte;
    const half = diktes[i] / 2;
    links.push([punten[i][0] + nx * half, punten[i][1] + ny * half]);
    rechts.push([punten[i][0] - nx * half, punten[i][1] - ny * half]);
  }
  return 'M' + [...links, ...rechts.reverse()].map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(' L') + ' Z';
}

// De lichaamsbouw: s = schouders, t = taille, h = heupen (L = links, R = rechts)
function bouw(p) {
  return p.geslacht === 'vrouw'
    ? { sL: 21.2, sR: 38.8, tL: 23.5, tR: 36.5, hL: 19, hR: 41 }
    : { sL: 19.2, sR: 40.8, tL: 21, tR: 39, hL: 20, hR: 40 };
}

// De armen: elke arm is 3 punten (schouder, elleboog, hand).
// "voor: true" = de armen komen vóór het lijf (bv. een boek vasthouden).
function armen(p, b) {
  let houding = p.voorwerp === 'geen' ? p.houding : (HOUDING_VAN[p.voorwerp] ?? 'langs');
  if (houding === 'zwaaien') houding = 'omhoog';
  const schouderL = [b.sL + 1.6, 31.6];
  const schouderR = [b.sR - 1.6, 31.6];
  const langsL = [schouderL, [b.sL - 2.2, 45], [b.sL - 1.6, 58]];
  const langsR = [schouderR, [b.sR + 2.2, 45], [b.sR + 1.6, 58]];
  const houdingen = {
    langs: { L: langsL, R: langsR },
    borst: { L: [schouderL, [b.sL - 1.2, 46], [27.4, 50.5]], R: [schouderR, [b.sR + 1.2, 46], [32.6, 50.5]], voor: true },
    bidden: { L: [schouderL, [b.sL + 0.5, 47.5], [29.2, 43]], R: [schouderR, [b.sR - 0.5, 47.5], [30.8, 43]], voor: true },
    staf: { L: langsL, R: [schouderR, [b.sR + 4, 43], [45.8, 51]] },
    zwaard: { L: [schouderL, [b.sL - 0.5, 47], [28.6, 58]], R: [schouderR, [b.sR + 0.5, 47], [31.4, 58]], voor: true },
    schild: { L: [schouderL, [b.sL - 3.5, 44], [17.5, 53]], R: langsR },
    omhoog: { L: langsL, R: [schouderR, [b.sR + 4.5, 22], [44, 10.5]] }, // rechterarm in de lucht
  };
  return { houding, ...houdingen[houding] };
}

// ---------------------------------------------------------------------
// ONDERDELEN TEKENEN
// ---------------------------------------------------------------------

// Eén been (x = linkerkant van het been) + schoen
function tekenBeen(pen, p, x) {
  const been = `M${x} 62 h5.2 l-0.3 33 h-4.6 z`;
  const kader = [x - 1, 60, 8, 40];
  if (p.broek === 'malien') pen.malien(been);
  else if (p.broek === 'miparti' && x > 29) pen.stof(been, tint(p.broekkleur, 0.55), { plooi: 'fluweel', kader, weefsel: 'linnen' });
  else pen.stof(been, p.broekkleur, { plooi: 'fluweel', kader, weefsel: 'linnen' });

  if (p.broek === 'pofbroek') {
    pen.stof(`M${x - 1.4} 60 Q${x - 2} 68 ${x - 0.4} 71.5 L${x + 5.8} 71.5 Q${x + 7} 68 ${x + 6.4} 60 Z`, p.broekkleur, {
      plooi: 'tuniek',
      kader: [x - 2, 58, 9, 15],
      weefsel: 'fluweel',
    });
    pen.lijn(`M${x + 1.4} 61 V71 M${x + 3.6} 61 V71`, 'rgba(235,225,195,0.65)', 0.45);
  }

  const schoen = p.schoenen;
  if (schoen === 'laarzen') {
    pen.stof(`M${x - 0.6} 82 h6.4 v13 q3.6 0.5 3.6 3.6 v1.4 h-10.6 z`, '#4a2e1c', { plooi: 'tuniek', kader: [x - 1, 80, 11, 20], weefsel: 'wol' });
  } else if (schoen === 'puntschoenen') {
    pen.stof(`M${x - 0.4} 94.5 h5.8 q2 2.6 9.5 5.5 h-15.4 z`, '#2a211c', { plooi: null, weefsel: 'fluweel' });
  } else if (schoen === 'ijzer') {
    pen.metaal(`M${x - 0.6} 91.5 h6.6 q4.6 3 7 8.5 h-13.6 z`, x - 1, x + 13);
    pen.lijn(`M${x - 0.4} 94.5 h7.4 M${x - 0.4} 97 h9`, 'rgba(25,25,30,0.6)', 0.3);
  } else {
    // sandalen of blootsvoets: een blote voet
    pen.huid(`M${x + 0.2} 95 h4.6 q3.6 1.5 3.6 3.5 q0 1.5 -1.5 1.5 h-6.8 z`, p.huid);
    if (schoen === 'sandalen') pen.lijn(`M${x + 0.2} 96.5 h5.5 M${x + 2.5} 95 v4.8`, '#4a2e1c', 0.6);
  }
}

// Het kleed (romp + rok)
function tekenKleed(pen, p, b) {
  const kleur = p.kleedkleur;
  const { sL, sR, tL, tR, hL, hR } = b;
  const hals = `M${sL} 30.4 Q30 27 ${sR} 30.4`;
  switch (p.kleed) {
    case 'tuniek':
      pen.stof(`${hals} L${tR + 0.5} 48 L${hR + 4} 69 Q30 72 ${hL - 4} 69 L${tL - 0.5} 48 Z`, kleur, { plooi: 'tuniek', kader: [hL - 5, 28, hR - hL + 10, 44] });
      break;
    case 'lang':
      pen.stof(`${hals} L${tR + 0.5} 48 L${hR + 7} 96 Q30 99 ${hL - 7} 96 L${tL - 0.5} 48 Z`, kleur, { plooi: 'linnen', kader: [hL - 8, 28, hR - hL + 16, 72] });
      break;
    case 'jurk':
      pen.stof(
        `${hals} L${tR} 41 Q${tR + 1} 44 ${hR + 1} 50 L${hR + 10} 97 Q30 101 ${hL - 10} 97 L${hL - 1} 50 Q${tL - 1} 44 ${tL} 41 Z`,
        kleur,
        { plooi: 'linnen', kader: [hL - 11, 26, hR - hL + 22, 76], weefsel: 'fluweel' },
      );
      break;
    case 'pij':
      pen.stof(`${hals} L${hR + 3} 60 L${hR + 5} 95 Q30 98 ${hL - 5} 95 L${hL - 3} 60 Z`, kleur, { plooi: 'fluweel', kader: [hL - 6, 28, hR - hL + 12, 70], weefsel: 'wol' });
      // de kap op de schouders
      pen.stof(`M${sL - 0.5} 31 Q30 40 ${sR + 0.5} 31 Q37 27 30 27.4 Q23 27 ${sL - 0.5} 31 Z`, kleur, { plooi: 'tuniek', kader: [sL, 26, sR - sL, 14], weefsel: 'wol' });
      break;
    case 'malien':
      pen.malien(`${hals} L${tR + 1} 48 L${hR + 3} 68 Q30 71 ${hL - 3} 68 L${tL - 1} 48 Z`);
      break;
    case 'harnas':
      pen.metaal(`${hals} L${tR + 1} 50 Q30 54 ${tL - 1} 50 Z`); // borstplaat
      pen.lijn('M30 30 V52', 'rgba(255,255,255,0.5)', 0.5);
      pen.metaal(`M${tL - 1} 50 Q30 54 ${tR + 1} 50 L${tR + 2} 56 Q30 60 ${tL - 2} 56 Z`); // lamellen
      pen.metaal(`M${tL - 2} 56 Q30 60 ${tR + 2} 56 L${tR + 3} 63 Q30 67 ${tL - 3} 63 Z`);
      break;
    case 'uniform': {
      // Soldatenjas (rond 1815): kort van voren, met slippen, witte kruisbanden en koperen knopen
      pen.stof(
        `${hals} L${tR + 0.8} 48 L${tR + 1.5} 60 L${hR + 1.5} 67 L30 61 L${hL - 1.5} 67 L${tL - 1.5} 60 L${tL - 0.8} 48 Z`,
        kleur,
        { plooi: 'tuniek', kader: [hL - 3, 28, hR - hL + 6, 40], weefsel: 'wol' },
      );
      const band = { plooi: null, weefsel: 'linnen' };
      pen.stof(`M${sL + 1.4} 30.4 L${sL + 4.2} 30.2 L${tR + 1} 57 L${tR - 1.8} 58 Z`, '#ddd6c4', band);
      pen.stof(`M${sR - 1.4} 30.4 L${sR - 4.2} 30.2 L${tL - 1} 57 L${tL + 1.8} 58 Z`, '#d3ccba', band);
      pen.stof(`M${sL + 1.5} 30.6 Q30 34 ${sR - 1.5} 30.6 L${sR - 2} 28.8 Q30 31.6 ${sL + 2} 28.8 Z`, tint(kleur, -0.45), band); // kraag
      for (let y = 35; y < 58; y += 4.4) pen.goud(cirkel(30, y, 0.6)); // knopen
      break;
    }
    case 'wambuis':
      // Wambuis zoals bij de schutters van Rembrandt: getailleerd, met een korte schoot
      pen.stof(
        `${hals} L${tR + 0.3} 47 L${tR + 3} 49 L${hR + 2} 58 Q30 60 ${hL - 2} 58 L${tL - 3} 49 L${tL - 0.3} 47 Z`,
        kleur,
        { plooi: 'fluweel', kader: [hL - 3, 28, hR - hL + 6, 34], weefsel: 'fluweel' },
      );
      pen.lijn('M27.4 34 V46 M32.6 34 V46', 'rgba(20,12,8,0.35)', 0.35); // splitten in de stof
      for (let y = 34; y < 47; y += 2.4) pen.goud(cirkel(30, y, 0.42));
      // De platte witte kraag over de schouders
      pen.stof(`M${sL - 0.5} 30.2 Q30 38.6 ${sR + 0.5} 30.2 Q30 26.8 ${sL - 0.5} 30.2 Z`, '#ddd5c3', { plooi: 'linnen', kader: [sL - 1, 27, sR - sL + 2, 12], weefsel: 'linnen' });
      break;
    case 'hemd': {
      // Een los, gescheurd hemd met een open hals (de rafels zijn een zigzag)
      pen.huid('M27 29.6 L30 38 L33 29.6 Z', p.huid);
      let zoom = '';
      for (let x = hR + 3, i = 0; x > hL - 3; x -= 2.2, i++) zoom += ` L${x.toFixed(1)} ${i % 2 ? 63.5 : 66.5}`;
      pen.stof(
        `M${sL} 30.4 L27.2 29.8 L30 38.4 L32.8 29.8 L${sR} 30.4 L${tR + 2} 48 L${hR + 3} 64${zoom} L${hL - 3} 64 L${tL - 2} 48 Z`,
        kleur,
        { plooi: 'linnen', kader: [hL - 4, 28, hR - hL + 8, 40], weefsel: 'linnen' },
      );
      break;
    }
  }
}

function tekenRiem(pen, p, b) {
  if (p.riem === 'geen' || ['harnas', 'pij'].includes(p.kleed)) return;
  const y = p.kleed === 'jurk' ? 41 : 48; // een jurk heeft een hoge taille
  const riem = `M${b.tL - 0.8} ${y - 1.2} Q30 ${y + 1.4} ${b.tR + 0.8} ${y - 1.2} L${b.tR + 0.9} ${y + 1.2} Q30 ${y + 3.8} ${b.tL - 0.9} ${y + 1.2} Z`;
  if (p.riem === 'goud') pen.goud(riem);
  else pen.stof(riem, '#3a2416', { plooi: null, weefsel: 'wol' });
  pen.goud(`M28.6 ${y} h2.8 v2.6 h-2.8 z`); // gesp
}

// Bovenkleren: sommige hebben een deel achter het lijf ("achter") en een deel ervoor ("voor")
const BOVENKLEDEN = {
  hermelijn: {
    // De keizersmantel van Napoleon: een lange sleep, en een kraag van hermelijn (wit bont met zwarte staartjes)
    achter(pen, p, b) {
      pen.stof(`M${b.sL - 1} 30 Q30 25.5 ${b.sR + 1} 30 L${b.hR + 13} 99 Q30 102 ${b.hL - 13} 99 Z`, tint(p.bovenkleur, -0.25), {
        plooi: 'mantel',
        kader: [b.hL - 14, 26, b.hR - b.hL + 28, 76],
        weefsel: 'fluweel',
      });
    },
    voor(pen, p, b) {
      const kader = [b.hL - 12, 26, b.hR - b.hL + 24, 74];
      pen.stof(`M${b.sL - 1} 30 L${b.sL + 4} 31.5 L${b.hL - 1} 97 L${b.hL - 11} 96 Z`, p.bovenkleur, { plooi: 'mantel', kader, weefsel: 'fluweel' });
      pen.stof(`M${b.sR + 1} 30 L${b.sR - 4} 31.5 L${b.hR + 1} 97 L${b.hR + 11} 96 Z`, p.bovenkleur, { plooi: 'mantel', kader, weefsel: 'fluweel' });
      pen.lijn(`M${b.sL + 3.4} 33 L${b.hL - 1.6} 96 M${b.sR - 3.4} 33 L${b.hR + 1.6} 96`, GOUD, 0.5); // gouden boord
      const kraag = `M${b.sL - 2} 29.6 Q30 24.8 ${b.sR + 2} 29.6 L${b.sR + 3} 40 Q30 44.5 ${b.sL - 3} 40 Z`;
      pen.stof(kraag, '#e2dccd', { plooi: 'linnen', kader: [b.sL - 3, 25, b.sR - b.sL + 6, 20], weefsel: 'wol' });
      pen.ctx.save();
      pen.ctx.clip(new Path2D(kraag));
      for (let i = 0; i < 16; i++) pen.vul(ellips(b.sL - 1 + ((i * 5.3) % (b.sR - b.sL + 2)), 31 + ((i * 3.7) % 10), 0.35, 0.9), '#1e1a18');
      pen.ctx.restore();
    },
  },
  sjerp: {
    // Een brede sjerp schuin over de borst, met een strik op de heup (zoals kapitein Banninck Cocq)
    voor(pen, p, b) {
      const opties = { plooi: 'tuniek', kader: [b.tL - 6, 28, b.sR - b.tL + 8, 36], weefsel: 'fluweel' };
      pen.stof(`M${b.sR - 2.6} 30 L${b.sR + 0.6} 31.4 L${b.tL + 1.6} 52.5 L${b.tL - 1.6} 50.5 Z`, p.bovenkleur, opties);
      pen.stof(`M${b.tL - 0.4} 51 L${b.tL - 4.2} 63 L${b.tL - 1.6} 63.6 L${b.tL + 1.6} 52.6 Z`, tint(p.bovenkleur, -0.2), opties);
      pen.stof(ellips(b.tL, 51.6, 2.2, 1.7), tint(p.bovenkleur, 0.08), { plooi: null, weefsel: 'fluweel' });
    },
  },
  mantel: {
    achter(pen, p, b) {
      pen.stof(`M${b.sL - 1} 30 Q30 25.5 ${b.sR + 1} 30 L${b.hR + 9} 97 Q30 100 ${b.hL - 9} 97 Z`, tint(p.bovenkleur, -0.25), {
        plooi: 'mantel',
        kader: [b.hL - 10, 26, b.hR - b.hL + 20, 74],
        weefsel: 'fluweel',
      });
    },
    voor(pen, p, b) {
      const kader = [b.hL - 10, 26, b.hR - b.hL + 20, 74];
      pen.stof(`M${b.sL - 1} 30 L${b.sL + 4} 31.5 L${b.hL - 2} 97 L${b.hL - 9} 96 Z`, p.bovenkleur, { plooi: 'mantel', kader, weefsel: 'fluweel' });
      pen.stof(`M${b.sR + 1} 30 L${b.sR - 4} 31.5 L${b.hR + 2} 97 L${b.hR + 9} 96 Z`, p.bovenkleur, { plooi: 'mantel', kader, weefsel: 'fluweel' });
      pen.goud(cirkel(30, 31.4, 1.4)); // mantelspeld
      pen.lijn(`M${b.sL + 3.6} 31.4 L28.8 31.4 M31.2 31.4 L${b.sR - 3.6} 31.4`, GOUD, 0.5);
    },
  },
  houppelande: {
    voor(pen, p, b) {
      pen.stof(
        `M${b.sL - 0.5} 30 Q30 25.5 ${b.sR + 0.5} 30 L${b.hR + 6} 68 L${b.hR + 9} 94 Q30 97.5 ${b.hL - 9} 94 L${b.hL - 6} 68 Z`,
        p.bovenkleur,
        { plooi: 'mantel', kader: [b.hL - 10, 26, b.hR - b.hL + 20, 72], weefsel: 'fluweel' },
      );
      // bontranden
      const bont = { plooi: null, weefsel: 'wol' };
      pen.stof(`M${b.hL - 9.4} 92.4 Q30 96 ${b.hR + 9.4} 92.4 L${b.hR + 9.7} 95.4 Q30 99 ${b.hL - 9.7} 95.4 Z`, '#c4ad80', bont);
      pen.stof('M28.9 31 H31.1 V95 H28.9 Z', '#c4ad80', bont);
      pen.stof(`M${b.sL - 0.5} 29.6 Q30 25 ${b.sR + 0.5} 29.6 Q30 34 ${b.sL - 0.5} 29.6 Z`, '#c4ad80', bont);
    },
  },
  cape: {
    achter(pen, p) {
      // de kap achter het hoofd
      pen.stof('M21 28 Q19 18 30 17 Q41 18 39 28 Z', tint(p.bovenkleur, -0.2), { plooi: 'tuniek', kader: [19, 16, 22, 14], weefsel: 'wol' });
    },
    voor(pen, p, b) {
      pen.stof(`M${b.sL - 1} 30 Q30 26 ${b.sR + 1} 30 L${b.sR + 5} 46 Q30 50 ${b.sL - 5} 46 Z`, p.bovenkleur, {
        plooi: 'mantel',
        kader: [b.sL - 6, 26, b.sR - b.sL + 12, 26],
        weefsel: 'wol',
      });
    },
  },
  koorkap: {
    voor(pen, p, b) {
      pen.stof(`M${b.sL} 29.5 Q30 25.5 ${b.sR} 29.5 L${b.hR + 11} 88 Q30 94 ${b.hL - 11} 88 Z`, p.bovenkleur, {
        plooi: 'mantel',
        kader: [b.hL - 12, 26, b.hR - b.hL + 24, 68],
        weefsel: 'brokaat',
      });
      // gouden boorden
      pen.stof(
        `M${b.sL} 29.5 L${b.hL - 11} 88 L${b.hL - 7} 88.8 L${b.sL + 3.2} 31 Z M${b.sR} 29.5 L${b.hR + 11} 88 L${b.hR + 7} 88.8 L${b.sR - 3.2} 31 Z`,
        GOUD,
        { plooi: null, weefsel: 'brokaat' },
      );
      pen.goud('M26.4 33.5 h7.2 v5 h-7.2 z'); // sluiting met edelsteen
      pen.vul(cirkel(30, 36, 1.2), '#8e1414');
    },
  },
  wapenrok: {
    voor(pen, p) {
      pen.stof('M23.5 30 H36.5 L38.5 72 L30 74 L21.5 72 Z', p.bovenkleur, { plooi: 'tuniek', kader: [21, 29, 18, 45], weefsel: 'wol' });
      // een kruis, in een kleur die afsteekt
      const kruis = p.bovenkleur === '#d9cdb8' ? '#a3241a' : '#e9e0cb';
      pen.stof('M28.6 36 h2.8 v24 h-2.8 z M24.5 43 h11 v2.8 h-11 z', kruis, { plooi: null, weefsel: 'linnen' });
    },
  },
};

// Mouwen of handen tekenen (wat = 'mouwen' of 'handen')
function tekenArmen(pen, p, b, arm, wat) {
  const wijdeMouwen = p.bovenkleed === 'houppelande' || p.kleed === 'pij';
  const materiaal = p.kleed === 'harnas' ? 'metaal' : p.kleed === 'malien' && p.bovenkleed !== 'houppelande' ? 'malien' : 'stof';
  const kleur = p.bovenkleed === 'houppelande' ? p.bovenkleur : p.kleedkleur;
  const plooi = p.bovenkleed === 'houppelande' ? 'mantel' : 'tuniek';
  const mouw = (pad) => {
    if (materiaal === 'metaal') pen.metaal(pad);
    else if (materiaal === 'malien') pen.malien(pad);
    else pen.stof(pad, kleur, { plooi, kader: [10, 28, 40, 34], weefsel: p.bovenkleed === 'houppelande' ? 'fluweel' : 'wol' });
  };

  for (const kant of ['L', 'R']) {
    if (wat === 'mouwen') {
      const punten = arm[kant];
      mouw(buis(punten, [5.4, 4.4, 3.6]));
      if (wijdeMouwen) {
        // een wijde, hangende mouw onder de onderarm
        const [elleboog, hand] = [punten[1], punten[2]];
        const r = kant === 'L' ? -1 : 1;
        mouw(
          `M${elleboog[0]} ${elleboog[1]} L${hand[0]} ${hand[1]} Q${hand[0] + r} ${hand[1] + 9} ${(elleboog[0] + hand[0]) / 2} ${hand[1] + 7} Q${elleboog[0] + 2 * r} ${elleboog[1] + 6} ${elleboog[0]} ${elleboog[1]} Z`,
        );
      }
    } else {
      const [x, y] = arm[kant][2];
      if (arm.houding === 'bidden') pen.huid(ellips(x, y, 1.2, 2.6), p.huid);
      else pen.huid(ellips(x, y + 0.6, 1.9, 2.3), p.huid);
    }
  }
}

// Voorwerpen. Een functie = vóór het lijf; { achter } = achter het lijf (staf, lans)
const VOORWERPEN = {
  boek(pen) {
    pen.stof('M22.5 47 L30 49.5 L37.5 47 L37.5 56.4 L30 58.8 L22.5 56.4 Z', '#6e1a14', { plooi: null, weefsel: 'fluweel' });
    pen.stof('M23.4 47.2 L30 49.2 L36.6 47.2 L36.6 55.4 L30 57.4 L23.4 55.4 Z', '#ebe1c6', { plooi: null, weefsel: 'linnen' });
    pen.lijn('M30 49.2 V57.4 M24.4 49.6 L29 51 M24.4 51.6 L29 53 M31 51 L35.6 49.6 M31 53 L35.6 51.6', 'rgba(60,40,30,0.5)', 0.22);
  },
  kelk(pen) {
    pen.goud('M26 43.5 Q26 49.6 30 50.2 Q34 49.6 34 43.5 Z');
    pen.goud('M29.4 50 h1.2 v3.6 h-1.2 z');
    pen.goud('M27.2 53.6 Q30 52.8 32.8 53.6 L32.8 54.8 L27.2 54.8 Z');
  },
  rozenkrans(pen) {
    for (let i = 0; i < 18; i++) {
      const hoek = (i / 18) * Math.PI * 1.7 + 0.6;
      pen.vul(cirkel(30 + Math.cos(hoek) * 2.6, 55 + Math.sin(hoek) * 4.4, 0.45), '#5a2418');
    }
    pen.lijn('M30 59.5 V63 M29 61.4 H31', GOUD, 0.35); // kruisje
  },
  luit(pen) {
    pen.stof('M25.5 53 Q18 48 21 42 Q25 38 30.5 42.5 Q34.6 47.5 30 53.6 Q28 55 25.5 53 Z', '#8a5a2e', { plooi: null, weefsel: 'wol' });
    pen.vul(cirkel(25.3, 46.2, 1.5), '#2a1a10'); // klankgat
    pen.stof('M29.2 43.4 L40.4 31.4 L41.6 32.6 L30.6 44.6 Z', '#4a2e1c', { plooi: null, weefsel: 'wol' }); // hals
  },
  staf: {
    achter(pen) {
      pen.goud('M45.2 3 h1.2 v96 h-1.2 z');
      pen.ctx.lineWidth = 1.4;
      pen.ctx.strokeStyle = GOUD;
      pen.ctx.stroke(new Path2D('M45.8 4 Q45.6 -5 40 -5 Q36 -4.5 37 -0.5 Q38 2 40.4 0.8')); // krul van de bisschopsstaf
    },
  },
  lans: {
    achter(pen, p) {
      pen.stof('M45.2 -19 h1.2 v118 h-1.2 z', '#6b4a2b', { plooi: null, weefsel: 'wol' });
      pen.metaal('M45.8 -20 L44.4 -14 L47.2 -14 Z', 44, 48);
      pen.stof('M46.4 -13 L57 -10 L50 -7 L57 -4 L46.4 -1 Z', p.bovenkleur, { plooi: null, weefsel: 'linnen' }); // vaandel
    },
  },
  zwaard(pen) {
    // met de punt naar beneden, beide handen op het gevest
    pen.metaal('M29.4 60 L30.6 60 L31 95 L30 97.5 L29 95 Z', 28.5, 31.5);
    pen.goud('M25.5 59.3 L34.5 59.3 L34.5 60.7 L25.5 60.7 Z');
    pen.stof('M29.1 53.4 h1.8 v5.9 h-1.8 z', '#3a2416', { plooi: null, weefsel: 'wol' });
    pen.goud(cirkel(30, 53, 1.1));
  },
  schild(pen, p) {
    const schild = 'M8.5 44 H25 V54.5 Q25 65 16.75 69.5 Q8.5 65 8.5 54.5 Z';
    pen.stof(schild, p.bovenkleur, { plooi: 'tuniek', kader: [8, 44, 17, 26], weefsel: 'fluweel' });
    const kruis = p.bovenkleur === '#d9cdb8' ? '#a3241a' : '#ece4cf';
    pen.stof('M15.5 45 h2.5 v23 h-2.5 z M9.5 52 h15 v2.5 h-15 z', kruis, { plooi: null, weefsel: 'linnen' });
    pen.ctx.lineWidth = 0.8;
    pen.ctx.strokeStyle = GOUD;
    pen.ctx.stroke(new Path2D(schild));
  },
  lantaarn(pen, p, arm) {
    const [x, y] = arm.L[2]; // hangt aan de linkerhand
    pen.lijn(`M${x} ${y + 1} V${y + 5}`, '#333', 0.4);
    pen.metaal(`M${x - 2.8} ${y + 5} h5.6 v1.2 h-5.6 z M${x - 2.8} ${y + 13} h5.6 v1.2 h-5.6 z`, x - 3, x + 3);
    pen.vul(`M${x - 2.4} ${y + 6.2} h4.8 v6.8 h-4.8 z`, 'rgba(255,212,120,0.92)');
    pen.ctx.save();
    pen.ctx.filter = `blur(${2.2 * K}px)`; // gloed
    pen.vul(cirkel(x, y + 9.6, 4.2), 'rgba(255,200,90,0.45)');
    pen.ctx.restore();
  },
  sabel(pen, p, arm) {
    // Een gebogen sabel, hoog in de lucht (rechterhand)
    const [x, y] = arm.R[2];
    pen.metaal(`M${x + 0.2} ${y - 1} Q${x + 2.4} ${y - 12} ${x - 1} ${y - 24} Q${x + 3.8} ${y - 12} ${x + 1.6} ${y - 1} Z`, x - 1, x + 4);
    pen.goud(`M${x - 2.4} ${y - 0.6} h5.2 v1.3 h-5.2 z`);
  },
  musket: {
    // Een lang geweer, rechtop naast het lichaam
    achter(pen) {
      pen.metaal('M45.3 -10 h1.1 V36 h-1.1 z', 45, 47);
      pen.stof('M44.6 34 h2.5 l1.6 26 q-1.6 1.6 -3.8 0.4 z', '#5a3a22', { plooi: null, weefsel: 'wol' }); // kolf
      pen.goud('M44.8 42 h2.4 v1.2 h-2.4 z');
    },
  },
  vlag: {
    // Een grote vlag in drie kleuren (de kleuren van je mantel, wit en je kleed)
    achter(pen, p) {
      pen.stof('M45.2 -22 h1.2 v121 h-1.2 z', '#6b4a2b', { plooi: null, weefsel: 'wol' });
      pen.goud(cirkel(45.8, -22.5, 0.9));
      const golf = (x1, x2) => `M${x1} ${-20 + (x1 - 46.4) * 0.15} Q${(x1 + x2) / 2} ${-22 + (x1 - 46.4) * 0.2} ${x2} ${-20 + (x2 - 46.4) * 0.15} L${x2} ${-6 + (x2 - 46.4) * 0.25} Q${(x1 + x2) / 2} ${-8 + (x1 - 46.4) * 0.3} ${x1} ${-6 + (x1 - 46.4) * 0.25} Z`;
      const kleuren = [p.bovenkleur, '#e3ddcd', p.kleedkleur];
      for (let i = 0; i < 3; i++) pen.stof(golf(46.4 + i * 4.4, 46.4 + (i + 1) * 4.4), kleuren[i], { plooi: 'mantel', kader: [46, -24, 14, 22], weefsel: 'linnen' });
    },
  },
  trommel(pen, p, arm) {
    // Een trommel voor de buik, met trommelstokken in de handen
    pen.stof('M22.6 51.5 L22.6 60 Q30 63.4 37.4 60 L37.4 51.5 Q30 55 22.6 51.5 Z', '#8e1c14', { plooi: null, weefsel: 'fluweel' });
    pen.lijn('M22.8 53 L26 60.6 L29 54.6 L32 61.2 L35 54.6 L37.2 59.6', GOUD, 0.35); // touwen
    pen.stof(ellips(30, 51.5, 7.4, 2.1), '#d6ccb4', { plooi: null, weefsel: 'linnen' }); // vel
    pen.lijn('M22.6 60 Q30 63.4 37.4 60', '#d6ccb4', 0.6);
    for (const kant of ['L', 'R']) {
      const [x, y] = arm[kant][2];
      pen.lijn(`M${x} ${y + 1} L${x + (kant === 'L' ? 3 : -3)} ${y - 5}`, '#6b4a2b', 0.6);
    }
  },
  scepter: {
    achter(pen) {
      pen.goud('M45.2 33 h1.2 v26 h-1.2 z');
      pen.goud(cirkel(45.8, 31.6, 1.7)); // bol bovenaan
      pen.vul(cirkel(45.8, 31.6, 0.7), '#8e1414');
    },
  },
  doek(pen, p, arm) {
    // Een doek om mee te zwaaien naar het schip in de verte
    const [x, y] = arm.R[2];
    pen.stof(
      `M${x} ${y - 1} Q${x + 6} ${y - 4} ${x + 12} ${y - 1} Q${x + 10} ${y + 5} ${x + 13} ${y + 11} Q${x + 6} ${y + 8} ${x + 1} ${y + 10} Q${x + 3} ${y + 4} ${x} ${y - 1} Z`,
      '#d8cfbc',
      { plooi: 'linnen', kader: [x, y - 4, 14, 16], weefsel: 'linnen' },
    );
  },
  kip(pen) {
    // Een witte kip in de armen (zoals het meisje in De Nachtwacht)
    pen.stof('M38.6 46 Q41.6 41 40 37.4 Q37 41.6 36.2 45.4 Z', '#cfc6b2', { plooi: null, weefsel: 'linnen' }); // staart
    pen.stof(ellips(30.6, 51, 6.6, 4.4), '#e2dbc9', { plooi: 'linnen', kader: [23, 46, 15, 10], weefsel: 'linnen' });
    pen.stof(cirkel(24.4, 47, 2.1), '#e2dbc9', { plooi: null, weefsel: 'linnen' }); // kop
    pen.vul('M23.4 45 q0.6 -2 1.4 -0.4 q0.8 -1.6 1.4 0.2 q-1.4 0.6 -2.8 0.2 z', '#a3241a'); // kam
    pen.vul('M22.4 47.2 l-1.8 0.6 l1.8 0.6 z', '#c98a2e'); // snavel
    pen.vul(cirkel(23.8, 46.6, 0.3), '#1a1410');
  },
};

// Kapsels: "achter" = achter het hoofd (lang haar), "voor" = op het hoofd
const KAPSELS = {
  kort: {
    voor: 'M24 15.6 Q23.2 8.4 30 8.2 Q36.8 8.4 36 15.6 Q35 11.6 32.5 11.4 Q30 12.6 27.4 11.4 Q25 11.8 24 15.6 Z',
  },
  pagekop: {
    voor: 'M23.3 21 Q21.8 7.4 30 7.4 Q38.2 7.4 36.7 21 L35.3 21 Q35.4 13 30 12.4 Q24.6 13 24.7 21 Z',
  },
  lang: {
    achter: 'M22.8 13 Q20.2 24 21.2 34.5 Q25.5 36.5 27.6 32 L32.4 32 Q34.5 36.5 38.8 34.5 Q39.8 24 37.2 13 Z',
    voor: 'M23.6 18 Q22.8 7.8 30 7.8 Q37.2 7.8 36.4 18 Q35.4 11.8 30 11.6 Q24.6 11.8 23.6 18 Z',
  },
  krullen: {
    achter: 'M22.6 12 Q19 18 21 27 Q23.6 28.6 25 24.6 L35 24.6 Q36.4 28.6 39 27 Q41 18 37.4 12 Z',
    voor: 'M22.8 16.4 Q21 11 23.8 8.8 Q24.4 6 27.5 6.4 Q30 4.6 32.5 6.4 Q35.6 6 36.2 8.8 Q39 11 37.2 16.4 Q35.6 12.2 33 12.4 Q31.5 11.2 30 12.2 Q28.5 11.2 27 12.4 Q24.4 12.2 22.8 16.4 Z',
    soort: 'krul',
  },
  vlechten: {
    voor: 'M23.8 17 Q23 8.2 30 8 Q37 8.2 36.2 17 Q35.2 11.8 30 11.6 Q24.8 11.8 23.8 17 Z',
    vlecht: true,
  },
  knot: {
    achter: 'M25.2 5.6 a4.8 3.8 0 1 0 9.6 0 a4.8 3.8 0 1 0 -9.6 0',
    voor: 'M23.8 16 Q23.2 8 30 7.8 Q36.8 8 36.2 16 Q35 11.4 30 11.2 Q25 11.4 23.8 16 Z',
  },
  kaal: {},
};

const BAARDEN = {
  kort: 'M24.4 18.6 Q24.6 25.8 30 27 Q35.4 25.8 35.6 18.6 Q34 22.4 32 22.6 Q30 21.6 28 22.6 Q26 22.4 24.4 18.6 Z',
  lang: 'M24.4 18.6 Q23.4 31 30 39 Q36.6 31 35.6 18.6 Q34 22.4 32 22.6 Q30 21.6 28 22.6 Q26 22.4 24.4 18.6 Z',
  punt: 'M25.6 21 Q27 27.6 30 32.4 Q33 27.6 34.4 21 Q32.4 22.8 30 22.4 Q27.6 22.8 25.6 21 Z',
  gevorkt: 'M24.4 18.6 Q24.2 28 27.6 33.4 L30 28.6 L32.4 33.4 Q35.8 28 35.6 18.6 Q34 22.4 32 22.6 Q30 21.6 28 22.6 Q26 22.4 24.4 18.6 Z',
};

const SNORREN = {
  dun: 'M27 21.2 Q30 19.8 33 21.2 Q30 20.9 27 21.2 Z',
  krul: 'M25.6 20 Q26.4 21.8 28 21 Q30 19.9 32 21 Q33.6 21.8 34.4 20 Q34 22.6 32 21.9 Q30 21.2 28 21.9 Q26 22.6 25.6 20 Z',
  hang: 'M27.4 20.5 Q30 19.6 32.6 20.5 Q33.8 22.2 33.4 24.6 Q32.6 21.8 30 21.3 Q27.4 21.8 26.6 24.6 Q26.2 22.2 27.4 20.5 Z',
};

// Welke haar-afbeelding? Oud of grijs → grijs haar, krullen → krulhaar
function haarSoort(p) {
  return p.haarkleur === GRIJS_HAAR || p.leeftijd === 'oud' ? 'grijs' : (KAPSELS[p.haar]?.soort ?? 'zwart');
}

// Oude mensen krijgen lichter (grijzer) haar
function haarKleur(p) {
  return p.leeftijd === 'oud' && p.haarkleur !== GRIJS_HAAR ? tint(p.haarkleur, 0.45) : p.haarkleur;
}

// Onder deze hoofddeksels zie je het haar op het hoofd niet
const BEDEKT_HAAR = ['helm', 'mijter', 'kap', 'sluier', 'hennin', 'bontmuts', 'tulband', 'hoofddoek', 'vrijheidsmuts', 'shako'];

// Alles wat ACHTER het hoofd komt: kap, sluier, aureool, lang haar
function tekenAchterHoofd(pen, p) {
  const kapsel = KAPSELS[p.haar];
  if (p.hoofddeksel === 'kap') {
    pen.stof('M20.8 27 Q18 5.4 30 4.4 Q42 5.4 39.2 27 Q35.5 31 30 31 Q24.5 31 20.8 27 Z', p.bovenkleur, { plooi: 'tuniek', kader: [18, 4, 24, 28], weefsel: 'wol' });
  }
  if (p.hoofddeksel === 'sluier') {
    pen.stof('M20.6 30 Q18 6 30 5 Q42 6 39.4 30 Q38 36 34 34 L26 34 Q22 36 20.6 30 Z', LINNEN, { plooi: 'linnen', kader: [18, 4, 24, 32], weefsel: 'linnen' });
  }
  if (p.hoofddeksel === 'hennin') {
    // de doorschijnende sluier die van de puntmuts afhangt
    pen.stof('M33 -14 Q46 4 44 34 Q40 36 37 30 Q39 10 31 -12 Z', 'rgba(214,204,186,0.5)', { plooi: null, weefsel: 'linnen' });
  }
  if (p.hoofddeksel === 'aureool') {
    pen.goud(cirkel(30, 16, 13));
    pen.lijn('M30 4 a12 12 0 1 0 0.1 0', 'rgba(255,240,190,0.7)', 0.35);
  }
  if (kapsel?.achter && !['helm', 'kap', 'sluier'].includes(p.hoofddeksel)) {
    pen.haar(kapsel.achter, haarKleur(p), haarSoort(p));
  }
}

// ---------------------------------------------------------------------
// GEZICHTEN
// Elk gezicht heeft een eigen vorm (ogen, wenkbrauwen, neus, mond).
// "-s" = gespiegeld: het gezicht kijkt naar de andere kant.
// Alles is in eenheden; het midden van het gezicht ligt op x = 30.
// ---------------------------------------------------------------------
const GEZICHT_VORMEN = {
  //            oogAfstand oogHoogte oogGrootte wenkbrauw(schuin) neusLengte neusBreedte mondBreedte lippen  blik
  jong:         { oog: 2.45, oogY: 16.2, oogR: 0.95, brauw: 0.3, neus: 3.6, neusB: 1.0, mond: 1.9, lip: 0.55, blik: 0.15 },
  edel:         { oog: 2.35, oogY: 16.0, oogR: 0.8, brauw: -0.2, neus: 4.3, neusB: 0.85, mond: 1.6, lip: 0.4, blik: 0.25 },
  krul:         { oog: 2.55, oogY: 16.4, oogR: 1.0, brauw: 0.5, neus: 3.3, neusB: 1.2, mond: 2.1, lip: 0.7, blik: 0.1 },
  kloosterling: { oog: 2.4, oogY: 16.3, oogR: 0.85, brauw: 0.6, neus: 4.0, neusB: 1.0, mond: 1.5, lip: 0.4, blik: -0.3 }, // kijkt naar beneden
};

// Gezichtsuitdrukkingen: hoe de wenkbrauwen, de ogen en de mond veranderen.
//   brauwBinnen = hoeveel het binnenste uiteinde van de wenkbrauw zakt (+) of stijgt (-)
//   brauwHoog   = de hele wenkbrauw hoger (-) of lager (+)
//   oogOpen     = 1 = normaal, kleiner = dichtgeknepen (lachen), groter = wijd open
const UITDRUKKINGEN = {
  rustig: { brauwBinnen: 0, brauwHoog: 0, oogOpen: 1 },
  blij: { brauwBinnen: 0, brauwHoog: -0.15, oogOpen: 0.75, blos: 0.1 },
  lachend: { brauwBinnen: -0.1, brauwHoog: -0.3, oogOpen: 0.55, blos: 0.16 },
  verbaasd: { brauwBinnen: -0.2, brauwHoog: -1.0, oogOpen: 1.45 },
  boos: { brauwBinnen: 1.1, brauwHoog: 0.25, oogOpen: 0.8 },
  verdrietig: { brauwBinnen: -1.0, brauwHoog: 0, oogOpen: 0.85 },
};

function tekenGezicht(pen, p) {
  const { ctx, m } = pen;
  const gespiegeld = p.gezicht.endsWith('-s');
  const basis = p.gezicht.replace('-s', '');
  const v = GEZICHT_VORMEN[basis] ?? GEZICHT_VORMEN.jong;
  const u = UITDRUKKINGEN[p.uitdrukking] ?? UITDRUKKINGEN.rustig;
  const vrouw = p.geslacht === 'vrouw';
  const schedel = new Path2D('M24.4 16 Q24 8.2 30 8 Q36 8.2 35.6 16 Q35.4 24 30 25.4 Q24.6 24 24.4 16 Z');
  const donker = tint(p.huid, -0.45); // schaduwkleur van de huid
  const lipKleur = vrouw ? '#a8483f' : '#93503f';

  ctx.save();
  ctx.clip(schedel);
  if (gespiegeld) {
    ctx.translate(60, 0);
    ctx.scale(-1, 1);
  }

  // 1. Volume: licht van links, schaduw rechts en onder de kin (zoals bij Van Eyck)
  ctx.globalCompositeOperation = 'multiply';
  const zij = ctx.createLinearGradient(25, 0, 36, 0);
  zij.addColorStop(0, 'rgba(255,255,255,0)');
  zij.addColorStop(0.55, 'rgba(255,255,255,0)');
  zij.addColorStop(1, 'rgba(90,50,35,0.5)');
  ctx.fillStyle = zij;
  ctx.fillRect(20, 5, 20, 25);
  ctx.filter = `blur(${0.9 * K}px)`;
  pen.vul(ellips(27.6, v.oogY, 1.9, 1.3), 'rgba(110,60,45,0.45)'); // oogkassen
  pen.vul(ellips(32.4, v.oogY, 1.9, 1.3), 'rgba(110,60,45,0.55)');
  pen.vul(ellips(31.4, 19 + v.neus * 0.2, 0.9, 2.2), 'rgba(110,60,45,0.4)'); // schaduw naast de neus
  pen.vul(ellips(30, 24.6, 3.6, 1.2), 'rgba(90,45,30,0.4)'); // onder de kin
  ctx.globalCompositeOperation = 'source-over';
  const blos = (vrouw ? 0.26 : 0.16) + (u.blos ?? 0); // wie lacht, krijgt rodere wangen
  pen.vul(ellips(26.6, 19.4, 1.6, 1.1), `rgba(200,90,80,${blos})`); // blosjes
  pen.vul(ellips(33.4, 19.4, 1.6, 1.1), `rgba(200,90,80,${blos - 0.06})`);
  ctx.globalCompositeOperation = 'screen';
  pen.vul(ellips(28.4, 11.6, 2.6, 1.6), 'rgba(255,240,220,0.3)'); // licht op het voorhoofd
  pen.vul(ellips(29.6, 18.6, 0.5, 1.6), 'rgba(255,240,220,0.35)'); // licht op de neusrug
  ctx.filter = 'none';
  ctx.globalCompositeOperation = 'source-over';

  // 2. Een vleugje van het echte gezicht uit het schilderij (voor de verftextuur)
  const bron = m.beeld[`gezicht-${p.geslacht}-${basis}`];
  if (bron) {
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = 0.35;
    ctx.filter = `blur(${0.35 * K}px)`;
    const breedte = vrouw ? 12.6 : 13.2;
    ctx.drawImage(bron, 30 - breedte / 2, 16.6 - (62 / 48) * breedte / 2, breedte, (62 / 48) * breedte);
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  // 3. Ogen: oogwit, iris, bovenooglid
  for (const kant of [-1, 1]) {
    const x = 30 + kant * v.oog;
    const y = v.oogY;
    const r = v.oogR;
    const open = u.oogOpen;
    const oog = `M${x - r * 1.25} ${y} Q${x} ${y - r * 0.95 * open} ${x + r * 1.25} ${y} Q${x} ${y + r * 0.7 * Math.min(open, 1.1)} ${x - r * 1.25} ${y} Z`;
    pen.vul(oog, '#e6dccd');
    ctx.save();
    ctx.clip(new Path2D(oog));
    pen.vul(cirkel(x + v.blik * 0.4 + 0.15, y + (v.blik < 0 ? 0.2 : 0), r * 0.62), '#3a271c'); // iris
    pen.vul(cirkel(x + v.blik * 0.4 + 0.15, y + (v.blik < 0 ? 0.2 : 0), r * 0.3), '#120c08'); // pupil
    ctx.restore();
    pen.vul(cirkel(x + v.blik * 0.4 - 0.05, y - r * 0.2, 0.16), 'rgba(255,250,240,0.9)'); // lichtpuntje
    // bovenooglid (dik en donker: zo lees je de ogen ook van ver)
    pen.lijn(`M${x - r * 1.35} ${y + 0.1} Q${x} ${y - r * 1.15 * open} ${x + r * 1.35} ${y + 0.1}`, '#2a1810', vrouw ? 0.42 : 0.36);
    pen.lijn(`M${x - r * 0.9} ${y + r * 0.55} Q${x} ${y + r * 0.8} ${x + r * 0.9} ${y + r * 0.55}`, 'rgba(90,50,35,0.45)', 0.16);
    // wenkbrauw
    const by = y - 1.7 + u.brauwHoog;
    const scheef = v.brauw * kant;
    pen.lijn(
      `M${x - kant * 1.4} ${by + 0.2 + scheef * 0.3 + u.brauwBinnen} Q${x} ${by - 0.55} ${x + kant * 1.5} ${by + 0.3 - scheef * 0.3 - u.brauwBinnen * 0.3}`,
      haarKleur(p),
      vrouw ? 0.32 : 0.5,
    );
  }

  // 4. Neus: een schaduwlijn langs de zijkant, neusvleugels en het puntje
  const ny = v.oogY + v.neus;
  pen.lijn(`M30.9 ${v.oogY + 0.4} Q31.2 ${ny - 1.2} ${31 + v.neusB * 0.6} ${ny - 0.2}`, `rgba(100,55,40,0.5)`, 0.28);
  pen.lijn(`M${30 - v.neusB} ${ny - 0.1} Q30 ${ny + 0.75} ${30 + v.neusB} ${ny - 0.1}`, donker, 0.3);
  pen.vul(ellips(29.8, ny - 0.5, 0.45, 0.35), 'rgba(255,235,215,0.35)');

  // 5. Mond: hangt af van de gezichtsuitdrukking
  const my = Math.min(ny + 1.85, 23.4);
  const w = v.mond;
  const lijnKleur = '#4a2016';
  switch (p.uitdrukking) {
    case 'blij': { // een brede glimlach, mondhoeken omhoog
      const b = w * 1.2;
      pen.vul(`M${30 - b} ${my - 0.8} Q30 ${my + v.lip * 1.6 + 1.1} ${30 + b} ${my - 0.8} Q30 ${my + 0.6} ${30 - b} ${my - 0.8} Z`, tint(lipKleur, 0.12));
      pen.lijn(`M${30 - b - 0.2} ${my - 0.95} Q30 ${my + 1.1} ${30 + b + 0.2} ${my - 0.95}`, lijnKleur, 0.38);
      break;
    }
    case 'lachend': { // open mond met tanden
      const b = w * 1.25;
      const mond = `M${30 - b} ${my - 0.8} Q30 ${my - 0.1} ${30 + b} ${my - 0.8} Q30 ${my + 3.4} ${30 - b} ${my - 0.8} Z`;
      pen.vul(mond, '#3a1410');
      ctx.save();
      ctx.clip(new Path2D(mond));
      pen.vul(`M${30 - b} ${my - 0.9} H${30 + b} V${my + 0.35} H${30 - b} Z`, '#e8dfcf'); // tanden
      pen.vul(ellips(30, my + 1.9, b * 0.5, 0.6), '#a8483f'); // tong
      ctx.restore();
      pen.lijn(`M${30 - b} ${my - 0.8} Q30 ${my + 3.4} ${30 + b} ${my - 0.8}`, tint(lipKleur, 0.05), 0.38);
      break;
    }
    case 'verbaasd': // een klein rond mondje
      pen.vul(ellips(30, my + 0.45, w * 0.5, 1.25), '#3a1410');
      pen.lijn(`M${30 - w * 0.42} ${my + 0.35} a${w * 0.42} 1 0 1 0 ${w * 0.84} 0 a${w * 0.42} 1 0 1 0 ${-w * 0.84} 0`, tint(lipKleur, 0.05), 0.25);
      break;
    case 'boos': // dunne, platte mond, hoeken iets omlaag
      pen.lijn(`M${30 - w * 0.95} ${my + 0.6} Q30 ${my - 0.35} ${30 + w * 0.95} ${my + 0.6}`, lijnKleur, 0.4);
      break;
    case 'verdrietig': // mondhoeken omlaag
      pen.vul(`M${30 - w * 0.8} ${my + 0.5} Q30 ${my - 0.6} ${30 + w * 0.8} ${my + 0.5} Q30 ${my + 0.3} ${30 - w * 0.8} ${my + 0.5} Z`, tint(lipKleur, 0.08));
      pen.lijn(`M${30 - w * 0.95} ${my + 1} Q30 ${my - 0.8} ${30 + w * 0.95} ${my + 1}`, lijnKleur, 0.38);
      break;
    default: // rustig: bovenlip, onderlip en de lijn ertussen
      pen.vul(`M${30 - w} ${my} Q${30 - w / 2} ${my - v.lip - 0.15} 30 ${my - v.lip * 0.55} Q${30 + w / 2} ${my - v.lip - 0.15} ${30 + w} ${my} Z`, tint(lipKleur, -0.1));
      pen.vul(`M${30 - w * 0.85} ${my} Q30 ${my + v.lip * 1.5 + 0.2} ${30 + w * 0.85} ${my} Z`, tint(lipKleur, 0.12));
      pen.lijn(`M${30 - w - 0.1} ${my + 0.05} Q30 ${my + 0.3} ${30 + w + 0.1} ${my + 0.05}`, lijnKleur, 0.22);
  }
  ctx.restore();
}

// Het hoofd: hals, oren, schedel, en daarop een geschilderd gezicht
function tekenHoofd(pen, p) {
  pen.huid('M27.6 22 h4.8 v9 h-4.8 z', p.huid); // hals
  pen.huid(ellips(24.6, 17.6, 1.1, 1.9), p.huid); // oren
  pen.huid(ellips(35.4, 17.6, 1.1, 1.9), p.huid);
  pen.huid('M24.4 16 Q24 8.2 30 8 Q36 8.2 35.6 16 Q35.4 24 30 25.4 Q24.6 24 24.4 16 Z', p.huid); // schedel

  // Het gezicht: geschilderde ogen, neus en mond (duidelijk, ook van ver),
  // met daarover een vleugje van het echte gezicht uit het schilderij.
  tekenGezicht(pen, p);

  // Leeftijd
  const { ctx } = pen;
  if (p.leeftijd === 'oud') {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    pen.lijn( // rimpels
      'M26.4 12.2 Q30 11.4 33.6 12.2 M26.8 13.6 Q30 13 33.2 13.6 M26.6 19 Q26.8 21.4 27.8 22.6 M33.4 19 Q33.2 21.4 32.2 22.6 M25.8 16.4 l1.2 0.6 M34.2 16.4 l-1.2 0.6',
      'rgba(90,50,35,0.55)',
      0.22,
    );
    ctx.globalCompositeOperation = 'saturation'; // iets bleker
    ctx.fillStyle = 'rgba(128,128,128,0.25)';
    ctx.fill(new Path2D(ellips(30, 16.6, 5.8, 7.8)));
    ctx.restore();
  } else if (p.leeftijd === 'jong') {
    ctx.save();
    ctx.globalCompositeOperation = 'screen'; // iets frisser
    ctx.fillStyle = 'rgba(255,225,205,0.12)';
    ctx.fill(new Path2D(ellips(30, 17, 5.6, 7.4)));
    ctx.restore();
  }
}

function tekenBaardEnSnor(pen, p) {
  if (p.geslacht !== 'man' || p.hoofddeksel === 'helm') return;
  const kleur = haarKleur(p);
  if (p.baard === 'stoppels') {
    const { ctx, toeval } = pen;
    ctx.save();
    ctx.clip(new Path2D('M24.6 18 Q25 25 30 25.8 Q35 25 35.4 18 Q30 23 24.6 18 Z'));
    ctx.fillStyle = tint(kleur, -0.3);
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 200; i++) ctx.fillRect(24 + toeval() * 12, 17 + toeval() * 9, 0.2, 0.2);
    ctx.restore();
  } else if (BAARDEN[p.baard]) {
    pen.haar(BAARDEN[p.baard], kleur, haarSoort(p) === 'krul' ? 'zwart' : haarSoort(p));
  }
  if (SNORREN[p.snor]) pen.haar(SNORREN[p.snor], kleur, 'zwart');
}

// Haar op het hoofd + het hoofddeksel
function tekenHaarEnHoofddeksel(pen, p) {
  const kapsel = KAPSELS[p.haar];
  if (kapsel?.voor && !BEDEKT_HAAR.includes(p.hoofddeksel)) {
    pen.haar(kapsel.voor, haarKleur(p), haarSoort(p));
    if (kapsel.vlecht) {
      for (const x of [24.4, 35.6]) for (let y = 19; y < 40; y += 2.2) pen.haar(ellips(x, y, 1.3, 1.4), haarKleur(p), 'krul');
    }
  }

  const { m } = pen;
  switch (p.hoofddeksel) {
    case 'tulband':
    case 'hoed': {
      // Echte hoeden uit het schilderij (de tulband wordt omgekleurd)
      const img = m.beeld['hoed-' + p.hoofddeksel];
      const maat = m.maten['hoed-' + p.hoofddeksel];
      const beeld = p.hoofddeksel === 'tulband' ? omkleuren(img, p.bovenkleur, maat.helderheid, 0.85, 0.8) : img;
      const breedte = p.hoofddeksel === 'tulband' ? 19 : 22;
      const hoogte = breedte * (maat.hoogte / maat.breedte);
      pen.ctx.drawImage(beeld, 30 - breedte / 2, 14 - hoogte, breedte, hoogte);
      break;
    }
    case 'kap':
      pen.lijn('M22.6 24 Q21.3 8.6 30 8 Q38.7 8.6 37.4 24', tint(p.bovenkleur, -0.4), 1.1); // rand van de kap
      break;
    case 'sluier':
      pen.stof('M22.8 15 Q22.6 6.6 30 6.4 Q37.4 6.6 37.2 15 Q34.6 9.6 30 9.6 Q25.4 9.6 22.8 15 Z', tint(LINNEN, 0.06), { plooi: 'linnen', kader: [22, 6, 16, 10], weefsel: 'linnen' });
      break;
    case 'hennin':
      pen.stof('M22.8 12.4 L33.5 -16 L37.6 11.6 Q30 14 22.8 12.4 Z', p.bovenkleur, { plooi: 'fluweel', kader: [22, -16, 16, 30], weefsel: 'fluweel' });
      pen.goud('M22.6 10.6 Q30 12.6 37.6 10 L37.8 12 Q30 14.4 22.4 12.6 Z');
      break;
    case 'kroon':
      pen.goud('M23.4 12 L23 3.5 L26 7.5 L30 1.5 L34 7.5 L37 3.5 L36.6 12 Q30 13.5 23.4 12 Z');
      for (const [x, y, kleur] of [
        [30, 9.8, '#8e1414'],
        [26, 10.4, '#1c3f6e'],
        [34, 10.4, '#1f5a3a'],
      ]) pen.vul(cirkel(x, y, 0.95), kleur); // edelstenen
      break;
    case 'mijter':
      pen.stof('M23.5 12.3 L24.2 -4 Q30 -10.5 30 -10.5 Q30 -10.5 35.8 -4 L36.5 12.3 Q30 13.6 23.5 12.3 Z', LINNEN, { plooi: 'linnen', kader: [23, -11, 14, 25], weefsel: 'linnen' });
      pen.goud('M28.9 -9.6 h2.2 V12.8 h-2.2 Z');
      pen.goud('M23.7 8.5 Q30 10 36.3 8.5 L36.4 10.6 Q30 12 23.6 10.6 Z');
      break;
    case 'helm':
      pen.malien('M21.5 20 Q21 30.6 24 31.6 L36 31.6 Q39 30.6 38.5 20 L36 20 L36 25 Q30 28 24 25 L24 20 Z'); // maliënkap
      pen.metaal('M22.6 19 Q21.8 5 30 1 Q38.2 5 37.4 19 L37.4 23 Q36.4 25.6 34 25.8 L34 17.6 Q30 15.8 26 17.6 L26 25.8 Q23.6 25.6 22.6 23 Z', 22, 38);
      break;
    case 'bontmuts':
      pen.haar('M22.8 13 Q22.4 2.4 30 2.2 Q37.6 2.4 37.2 13 Q30 15 22.8 13 Z', '#5e4028', 'krul');
      break;
    case 'shako': {
      // Hoge soldatenmuts met klep, koperen plaat en pluim
      const zwart = { plooi: null, weefsel: 'fluweel' };
      pen.stof('M29 -5 Q27.4 -14 30.4 -19.5 Q33.2 -13 31.2 -5 Z', '#d6cfbf', { plooi: null, weefsel: 'linnen' }); // pluim
      pen.stof('M23.4 13 L22.4 -5 Q30 -7.2 37.6 -5 L36.6 13 Q30 14.4 23.4 13 Z', '#1f1c1a', zwart);
      pen.vul('M23 12.2 Q30 14.4 37 12.2 L37.6 13 Q30 15.6 22.4 13 Z', '#121010'); // klep
      pen.goud('M27.8 1.6 h4.4 v4.6 l-2.2 1.8 l-2.2 -1.8 z');
      pen.lijn('M23.2 10.6 Q30 12.4 36.8 10.6', GOUD, 0.4);
      break;
    }
    case 'steek':
      // De tweepuntige hoed van Napoleon (van opzij gezien), met een kokarde
      pen.stof('M14.6 10.4 Q16 1.6 30 0.6 Q44 1.6 45.4 10.4 Q38 7.4 30 8.6 Q22 7.4 14.6 10.4 Z', '#1d1a19', { plooi: null, weefsel: 'fluweel' });
      pen.lijn('M15.4 9.8 Q22 7 30 8.2 Q38 7 44.6 9.8', GOUD, 0.35);
      pen.vul(cirkel(37.5, 5.8, 1.7), '#1c3f6e');
      pen.vul(cirkel(37.5, 5.8, 1.15), '#e3ddcd');
      pen.vul(cirkel(37.5, 5.8, 0.6), '#a3241a');
      break;
    case 'lauwerkrans': {
      // Gouden blaadjes in een boog rond het hoofd
      for (let i = 0; i <= 12; i++) {
        const hoek = Math.PI * (1.05 + (i / 12) * 0.9);
        const x = 30 + Math.cos(hoek) * 6.6;
        const y = 13 + Math.sin(hoek) * 4.2;
        const r = i < 6 ? -1 : 1;
        pen.goud(`M${x} ${y} q${1.2 * r} -1.6 ${2.6 * r} -0.6 q-${1.2 * r} 1.4 -${2.6 * r} 0.6 z`);
      }
      break;
    }
    case 'breedhoed':
      // Zwarte hoed met een brede rand en een witte veer (zoals de schutters van Rembrandt)
      pen.stof('M23.6 9.4 Q23 -1.6 30 -2 Q37 -1.6 36.4 9.4 Q30 10.8 23.6 9.4 Z', '#1d1a19', { plooi: null, weefsel: 'fluweel' });
      pen.stof('M15.8 10 Q30 5.2 44.2 10 Q30 13.6 15.8 10 Z', '#181514', { plooi: null, weefsel: 'fluweel' });
      pen.lijn('M23.8 7.8 Q30 9.2 36.2 7.8', GOUD, 0.45);
      pen.stof('M34.6 3 Q43 -5 47.6 3.4 Q42 0.6 36.4 5.6 Z', '#ddd6c6', { plooi: null, weefsel: 'linnen' }); // veer
      break;
    case 'hogehoed':
      pen.stof('M24.2 11 L23.6 -6.4 Q30 -7.6 36.4 -6.4 L35.8 11 Z', '#1c1a19', { plooi: null, weefsel: 'fluweel' });
      pen.stof('M20.4 11 Q30 8.2 39.6 11 Q30 14 20.4 11 Z', '#141211', { plooi: null, weefsel: 'fluweel' });
      pen.lijn('M24 8.8 Q30 9.8 36 8.8', '#3a2c22', 0.9);
      break;
    case 'vrijheidsmuts':
      // De rode Frygische muts: de punt valt naar voren
      pen.stof('M23.2 13.6 Q22.4 4 29 3.4 Q36.4 2.4 38.8 7.8 Q40.6 12.4 37.6 13.8 Q37.2 9.8 35.4 9.2 L36.8 13.6 Q30 15.2 23.2 13.6 Z', p.bovenkleur, {
        plooi: 'tuniek',
        kader: [22, 2, 19, 14],
        weefsel: 'wol',
      });
      break;
    case 'hoofddoek':
      pen.stof('M23 15 Q22.2 6 30 5.4 Q37.8 6 37 15 Q30 11 23 15 Z', p.bovenkleur, { plooi: 'tuniek', kader: [22, 5, 16, 11], weefsel: 'linnen' });
      pen.stof('M36 12 Q40.4 13 40.6 18 Q37.6 16.8 35.6 14.6 Z', tint(p.bovenkleur, -0.2), { plooi: null, weefsel: 'linnen' }); // knoop
      break;
  }
}

// ---------------------------------------------------------------------
// HET GEHEEL TEKENEN
// ---------------------------------------------------------------------

// Een leeg canvas, al geschaald naar eenheden en met de bovenmarge
function nieuwCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_BREEDTE;
  canvas.height = CANVAS_HOOGTE;
  const ctx = canvas.getContext('2d');
  ctx.scale(K, K);
  ctx.translate(0, BOVENMARGE);
  return canvas;
}

// De "verflaag": een beetje zachter, wat weefsel erover en een warme vernis,
// zodat het personage past bij het wandtapijt.
function verflaag(canvas, materiaal) {
  const uit = document.createElement('canvas');
  uit.width = canvas.width;
  uit.height = canvas.height;
  const ctx = uit.getContext('2d');
  ctx.filter = 'blur(0.7px) saturate(1.05) contrast(1.05)';
  ctx.drawImage(canvas, 0, 0);
  ctx.filter = 'none';
  ctx.globalCompositeOperation = 'source-atop';
  ctx.globalAlpha = 0.11; // vroeger 0.18: gaf barstjes op de gezichten
  ctx.fillStyle = ctx.createPattern(materiaal.beeld['stof-wol'], 'repeat');
  ctx.fillRect(0, 0, uit.width, uit.height);
  ctx.globalAlpha = 0.14;
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = '#e8cf9c'; // warme vernis
  ctx.fillRect(0, 0, uit.width, uit.height);
  // Alles buiten de oorspronkelijke vorm weer weg (de vervaging liep een beetje uit)
  ctx.globalCompositeOperation = 'destination-in';
  ctx.globalAlpha = 1;
  ctx.drawImage(canvas, 0, 0);
  // Op de muur: in de toon van het schilderij dat er hangt (zie inpassen.js)
  kleurNaarSchilderij(uit);
  return uit.toDataURL('image/png');
}

// Hetzelfde personage wordt maar één keer getekend (bv. 10 keer "Verras me" terug)
const bewaard = new Map();

// Tekent een personage. Geeft (een belofte van) { lang, lijf, beenL, beenR } terug:
//   lijf  = afbeelding (data-URL) van alles behalve de benen
//   beenL/beenR = de benen apart (om te stappen), of null bij lange kleren
//   lang  = true bij lange kleren: dan "schrijdt" het hele personage
export function maakPersonage(onderdelen) {
  const p = controleerPersonage(onderdelen);
  const sleutel = JSON.stringify(p);
  const bewaarSleutel = sleutel + greepSleutel(); // een andere kleurgreep = opnieuw tekenen
  if (!bewaard.has(bewaarSleutel)) bewaard.set(bewaarSleutel, teken(p, sleutel));
  return bewaard.get(bewaarSleutel);
}

async function teken(p, sleutel) {
  const materiaal = await laadMateriaal();
  // Op de muur: elke stofkleur in de tint van het schilderij (zelfde kleur, andere tint; zie inpassen.js)
  p = {
    ...p,
    kleedkleur: schilderijKleur(p.kleedkleur),
    bovenkleur: schilderijKleur(p.bovenkleur),
    broekkleur: schilderijKleur(p.broekkleur),
  };
  const toeval = vastToeval(sleutel);
  const b = bouw(p);
  const arm = armen(p, b);
  const lang = LANGE_KLEDEN.includes(p.kleed) || LANGE_BOVENKLEDEN.includes(p.bovenkleed);
  const bovenkleed = BOVENKLEDEN[p.bovenkleed];
  const voorwerp = VOORWERPEN[p.voorwerp];

  const lijfCanvas = nieuwCanvas();
  const pen = new Penseel(lijfCanvas.getContext('2d'), materiaal, toeval);

  // Van achter naar voor:
  bovenkleed?.achter?.(pen, p, b); // 1. achterkant van de mantel
  tekenAchterHoofd(pen, p); // 2. lang haar, sluier, aureool
  if (!arm.voor) tekenArmen(pen, p, b, arm, 'mouwen'); // 3. armen langs het lijf

  // 4. de benen: bij lange kleren op het lijf, anders op aparte canvassen
  let beenL = null;
  let beenR = null;
  if (lang) {
    tekenBeen(pen, p, 24.6);
    tekenBeen(pen, p, 30.2);
  } else {
    beenL = nieuwCanvas();
    beenR = nieuwCanvas();
    tekenBeen(new Penseel(beenL.getContext('2d'), materiaal, toeval), p, 24.6);
    tekenBeen(new Penseel(beenR.getContext('2d'), materiaal, toeval), p, 30.2);
  }

  tekenKleed(pen, p, b); // 5. kleed
  tekenRiem(pen, p, b); // 6. riem
  if (p.bovenkleed !== 'koorkap') bovenkleed?.voor?.(pen, p, b); // 7. voorkant van de mantel
  if (!arm.voor) tekenArmen(pen, p, b, arm, 'handen'); // 8. handen
  if (p.bovenkleed === 'koorkap') bovenkleed.voor(pen, p, b); // de koorkap valt over de handen
  voorwerp?.achter?.(pen, p, arm); // 9. staf of lans
  if (arm.voor) tekenArmen(pen, p, b, arm, 'mouwen'); // 10. armen vóór het lijf
  if (typeof voorwerp === 'function') voorwerp(pen, p, arm); // 11. voorwerp in de handen
  if (arm.voor) tekenArmen(pen, p, b, arm, 'handen'); // 12. handen eroverheen
  tekenHoofd(pen, p); // 13. hoofd en gezicht
  tekenBaardEnSnor(pen, p); // 14. baard en snor
  tekenHaarEnHoofddeksel(pen, p); // 15. haar en hoofddeksel

  return {
    lang,
    lijf: verflaag(lijfCanvas, materiaal),
    beenL: beenL && verflaag(beenL, materiaal),
    beenR: beenR && verflaag(beenR, materiaal),
  };
}

// Zet een personage in een HTML-element (gsm-voorbeeld, bevestiging of op de muur).
// Er komen 2 of 3 <img>'s in die precies over elkaar liggen (zie .samengesteld in de CSS).
export async function zetPersonageIn(element, onderdelen) {
  const delen = await maakPersonage(onderdelen);
  element.innerHTML = '';
  element.classList.add('samengesteld');
  element.classList.toggle('lang', delen.lang);
  for (const [bron, klasse] of [
    [delen.beenL, 'been-l'],
    [delen.beenR, 'been-r'],
    [delen.lijf, 'lijf'],
  ]) {
    if (!bron) continue;
    const img = new Image();
    img.src = bron;
    img.alt = '';
    img.className = 'deel ' + klasse;
    element.appendChild(img);
  }
}
