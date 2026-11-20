// =====================================================================
// MUUR / BEAMER-PAGINA (display.html)
//
// Toont het schilderij, laat de mannetjes rondlopen, toont de QR-code,
// wisselt om de zoveel minuten van schilderij, laat af en toe een mannetje
// naar voren stappen om een feitje te vertellen, en reageert op toetsen:
//   F = fullscreen   D = debug   T = testmannetje   B = brawl   N = nuke
//   S = volgend schilderij   V = nu een feitje vertellen   E = effecten aan/uit
//   klik = steen gooien
// =====================================================================

import QRCode from 'qrcode';
import { INSTELLINGEN } from './instellingen.js';
import { Wereld } from './wereld.js';
import { Mannetje } from './mannetje.js';
import { Steen, maakWolkje } from './stenen.js';
import { Brawl, nuke } from './acties.js';
import { Sfeer } from './sfeer.js';
import { Effecten } from './effecten.js';
import { tekenLijst } from './lijst.js';
import { bekijkSchilderij } from './inpassen.js';
import { controleerNaam } from './naamfilter.js';
import { luisterNaarMannetjes, luisterNaarActies, meldSchilderij, DEMOMODUS } from './verbinding.js';
import { volgendSchilderij } from './schilderijen.js';
import { willekeurigPersonage } from './personage.js';

const wereldElement = document.querySelector('#wereld');
const schilderij = document.querySelector('#schilderij');
const laag = document.querySelector('#mannetjes-laag');
const debugCanvas = document.querySelector('#debug-canvas');
const debugCtx = debugCanvas.getContext('2d');
const debugPaneel = document.querySelector('#debug-paneel');
const melding = document.querySelector('#melding');
const naambordje = document.querySelector('#naambordje');
const naamkaart = document.querySelector('#naamkaart');
const wisselDoek = document.querySelector('#wissel-doek');
const SCHILDERIJ = INSTELLINGEN.schilderijInfo; // titel, maker, jaar, feitjes, garderobe

const wereld = new Wereld();
const mannetjes = [];
const stenen = [];
const brawl = new Brawl(wereldElement);
let sfeer = null;
let effecten = null;
let effectenAan = INSTELLINGEN.effectenAan;
let debug = false;
let muis = { x: 0, y: 0 };

// --- De wereld (1920 x 1080) schalen zodat ze op elk scherm past ---
// Met een lijst (zie lijst.js) wordt het schilderij iets kleiner, zodat de lijst, het lampje en
// het naambordje er rond passen. L = lijst aan/uit.
const lijstCanvas = document.createElement('canvas');
lijstCanvas.id = 'lijst';
document.body.appendChild(lijstCanvas);
let lijstAan = INSTELLINGEN.lijstAan;

function pasSchaalAan() {
  if (lijstAan) {
    const bordje = INSTELLINGEN.toonBordje ? `${SCHILDERIJ.titel}  ·  ${SCHILDERIJ.maker}, ${SCHILDERIJ.jaar}` : null;
    // "uitsnede" = welk stuk van de wereld (x van..tot) het echte doek is. De Nachtwacht is bijna
    // vierkant: links en rechts zit donkere opvulling, die verdwijnt dan achter de lijst.
    const [x0, x1] = SCHILDERIJ.uitsnede ?? [0, INSTELLINGEN.breedte];
    const p = tekenLijst(lijstCanvas, SCHILDERIJ.lijst ?? 'gotisch', bordje, (x1 - x0) / INSTELLINGEN.hoogte, INSTELLINGEN.muurKleur);
    const schaal = p.b / (x1 - x0);
    wereldElement.style.setProperty('--schaal', schaal);
    wereldElement.style.left = p.x + p.b / 2 - ((x0 + x1) / 2 - INSTELLINGEN.breedte / 2) * schaal + 'px';
    wereldElement.style.top = p.y + p.h / 2 + 'px';
    lijstCanvas.hidden = false;
    return;
  }
  lijstCanvas.hidden = true;
  wereldElement.style.left = '';
  wereldElement.style.top = '';
  const schaal = Math.min(window.innerWidth / INSTELLINGEN.breedte, window.innerHeight / INSTELLINGEN.hoogte);
  wereldElement.style.setProperty('--schaal', schaal);
}
window.addEventListener('resize', pasSchaalAan);
pasSchaalAan();
document.fonts?.ready.then(pasSchaalAan); // het bordje opnieuw, zodra het lettertype geladen is
wereldElement.style.setProperty('--figuur-hoogte', INSTELLINGEN.figuurHoogte + 'px');
wereldElement.style.setProperty('--vernis-sterkte', INSTELLINGEN.vernisSterkte);
// Slagschaduw van de mannetjes: richting en sterkte zoals het licht in dit schilderij
if (SCHILDERIJ.schaduw) {
  wereldElement.style.setProperty('--schaduw-vorm', SCHILDERIJ.schaduw.vorm);
  wereldElement.style.setProperty('--schaduw-sterkte', SCHILDERIJ.schaduw.sterkte);
}
// (hier en niet in de CSS: zo klopt het pad zowel tijdens npm run dev als na npm run build)
document.querySelector('#vernis').style.backgroundImage =
  'radial-gradient(130% 115% at 50% 45%, transparent 55%, rgb(25 12 4 / 0.55)), url(vernis.png)';

// --- QR-code naar de gsm-pagina ---
function maakQrCode() {
  const adres = INSTELLINGEN.joinUrl ?? new URL('join.html', window.location.href).href;
  QRCode.toCanvas(document.querySelector('#qr-code'), adres, { width: 400, margin: 1 });
  console.log('QR-code wijst naar:', adres);
}

// --- Een nieuw mannetje (van Firebase of de demo) ---
function voegMannetjeToe(gegevens) {
  if (mannetjes.some((m) => m.id === gegevens.id)) return; // al op de muur
  const controle = controleerNaam(gegevens.naam); // nog eens controleren: vertrouw nooit de gsm
  if (!controle.ok) return;
  gegevens.naam = controle.naam;

  const mannetje = new Mannetje(gegevens, wereld, laag);
  mannetjes.push(mannetje);
  if (brawl.bezig) mannetje.pakZwaard(); // meteen meevechten
  // Te veel? De oudste verdwijnt.
  while (mannetjes.length > INSTELLINGEN.maxMannetjes) mannetjes.shift().verwijder();
}

// T-toets: een willekeurig voorbeeldpersonage, met een oude Vlaamse naam
const NAMEN = {
  man: ['Joos', 'Pieter', 'Lieven', 'Gillis', 'Jan', 'Wouter', 'Boudewijn', 'Arnoud', 'Hendrik', 'Cornelis',
    'Willem', 'Gijsbrecht', 'Floris', 'Rombout', 'Matthijs', 'Adriaan', 'Jacob', 'Simon', 'Lodewijk', 'Daneel'],
  vrouw: ['Margriet', 'Lysbeth', 'Machteld', 'Aleydis', 'Katelijne', 'Geertruid', 'Beatrijs', 'Clementia',
    'Josina', 'Hadewijch', 'Elisabeth', 'Marie', 'Agnes', 'Mayken', 'Goedele', 'Barbara', 'Joanna'],
};
let voorbeeldTeller = 1;
function voegTestMannetjeToe() {
  const onderdelen = willekeurigPersonage(SCHILDERIJ.garderobe); // past bij het schilderij
  // een naam die nog niet op de muur staat (als dat kan)
  const alle = NAMEN[onderdelen.geslacht] ?? NAMEN.man;
  const vrij = alle.filter((n) => !mannetjes.some((m) => m.naam === n));
  const namen = vrij.length ? vrij : alle;
  voegMannetjeToe({
    id: 'voorbeeld-' + Date.now() + '-' + voorbeeldTeller++,
    naam: namen[Math.floor(Math.random() * namen.length)],
    type: 'samengesteld',
    onderdelen,
    tijdstip: Date.now(),
  });
}

// --- Voorgrond: objecten waar je achter kan lopen (fontein, altaar, engelen, lam) ---
// Ze zitten in dezelfde laag als de mannetjes, met z-index = voetY.
// Een mannetje met y < voetY heeft een lagere z-index en loopt er dus achter.
function maakVoorgrond() {
  for (const object of INSTELLINGEN.voorgrond) {
    const groep = document.createElement('div');
    groep.className = 'voorgrond-groep';
    groep.style.zIndex = object.voetY;
    zetBeweging(groep, object);
    groep.appendChild(voorgrondAfbeelding(object.afbeelding));
    for (const deel of object.delen ?? []) {
      const img = voorgrondAfbeelding(deel.afbeelding);
      zetBeweging(img, deel);
      groep.appendChild(img);
    }
    laag.appendChild(groep);
  }
}

function voorgrondAfbeelding(bron) {
  const img = document.createElement('img');
  img.className = 'voorgrond';
  img.src = bron;
  img.alt = '';
  return img;
}

// Een CSS-animatie (zie "BEWEGENDE OBJECTEN" in display.css) met het juiste draaipunt
function zetBeweging(element, object) {
  if (!object.beweging) return;
  element.classList.add('beweging-' + object.beweging);
  element.style.transformOrigin = `${object.oorsprong[0]}px ${object.oorsprong[1]}px`;
  element.style.animationDelay = -Math.random() * 5 + 's'; // niet allemaal tegelijk
}

// --- Geschilderde groepen (de mensenmassa's) ---
// Een groep is opgeknipt in smalle verticale stroken van 16 px. Elke strook krijgt
// als z-index de y van de voeten op die plek. Zo kan je achter de ene persoon
// en vóór de andere lopen.
async function maakGroepen() {
  let groepen;
  try {
    groepen = await (await fetch(INSTELLINGEN.groepen)).json();
  } catch {
    return; // dit schilderij heeft geen groepen
  }
  for (const groep of Object.values(groepen)) {
    const bron = `url(${INSTELLINGEN.groepen.replace('groepen.json', groep.afbeelding)})`;
    // Variant met "stukken": per strook meerdere losse stukjes [x, boven, hoogte, voetY]
    // (een kind boven een ander kind, zie tools/kinderspelen_zones.py)
    for (const [x, boven, hoogte, voetY] of groep.stukken ?? []) {
      const stuk = document.createElement('div');
      stuk.className = 'groep-strook';
      stuk.style.left = x + 'px';
      stuk.style.top = boven + 'px';
      stuk.style.width = groep.strook + 'px';
      stuk.style.height = hoogte + 'px';
      stuk.style.backgroundImage = bron;
      stuk.style.backgroundPosition = `${-x}px ${-boven}px`;
      stuk.style.zIndex = voetY;
      laag.appendChild(stuk);
    }
    for (const [x, voetY] of groep.stroken ?? []) {
      const strook = document.createElement('div');
      strook.className = 'groep-strook';
      strook.style.left = x + 'px';
      strook.style.width = groep.strook + 'px';
      strook.style.backgroundImage = `url(${INSTELLINGEN.groepen.replace('groepen.json', groep.afbeelding)})`;
      strook.style.backgroundPosition = `${-x}px 0`;
      strook.style.zIndex = voetY;
      laag.appendChild(strook);
    }
  }
}

// --- De game loop: elke frame alles bijwerken ---
let vorigeTijd = performance.now();
function frame(nu) {
  const dt = Math.min((nu - vorigeTijd) / 1000, 0.1); // max 0.1 s (bv. na een verborgen tabblad)
  vorigeTijd = nu;

  sfeer?.update(dt); // het Lam Gods: zon, wolken, vogels, wind
  if (effectenAan) effecten?.update(dt); // de andere schilderijen: rook, vonken, licht, vlag (zie schilderijen.js)
  updateFeitjes(dt);
  for (const m of mannetjes) m.update(dt, mannetjes);
  // Wie geen leven meer heeft, sterft
  for (let i = mannetjes.length - 1; i >= 0; i--) {
    if (mannetjes[i].leven <= 0) mannetjes.splice(i, 1)[0].sterf();
  }
  brawl.update(mannetjes);
  for (let i = stenen.length - 1; i >= 0; i--) {
    const steen = stenen[i];
    if (steen.update(dt)) {
      stenen.splice(i, 1);
      steenLandt(steen);
    }
  }
  if (debug) tekenDebug();
  requestAnimationFrame(frame);
}

// --- Feitjes: af en toe stapt een mannetje naar voren en vertelt iets ---
let volgendFeitje = tussen(...INSTELLINGEN.feitjeElke);
let feitjeNummer = Math.floor(Math.random() * SCHILDERIJ.feitjes.length); // niet altijd met hetzelfde beginnen

function tussen(min, max) {
  return min + Math.random() * (max - min);
}

function updateFeitjes(dt) {
  if (brawl.bezig) return; // tijdens een brawl wordt er niet gepraat
  if (mannetjes.some((m) => m.toestand === 'vertellen' || m.bijAankomst)) return; // één verteller tegelijk
  volgendFeitje -= dt;
  if (volgendFeitje <= 0) {
    volgendFeitje = tussen(...INSTELLINGEN.feitjeElke);
    vertelFeitje();
  }
}

function vertelFeitje() {
  if (!SCHILDERIJ.feitjes.length) return;
  // Een willekeurig vrij mannetje dat naar voren kan wandelen
  const vrij = mannetjes.filter((m) => m.isVrij()).sort(() => Math.random() - 0.5);
  for (const m of vrij) {
    const route = routeVooraan(m);
    if (!route) continue;
    const tekst = SCHILDERIJ.feitjes[feitjeNummer++ % SCHILDERIJ.feitjes.length];
    m.vertelFeitje(route, tekst);
    return;
  }
}

// Een route naar een plek vooraan en in het midden.
// Vooraan = onderaan het scherm = het dichtst bij het publiek (en dus het grootst).
// Mannetjes lopen in rechte lijnen; staat er iets in de weg (de fontein, het altaar),
// dan zoeken we een tussenpunt van waaruit het wel kan. Geeft [punt] of [tussenpunt, punt].
function routeVooraan(m) {
  // 1. De beste plekken vooraan, ook als je er niet rechtstreeks heen kan
  const plekken = [];
  for (let poging = 0; poging < 300; poging++) {
    const x = wereld.breedte * tussen(0.25, 0.75);
    const y = wereld.hoogte * tussen(0.55, 0.98);
    if (!wereld.isLoopbaar(x, y)) continue;
    plekken.push({ x, y, score: y - Math.abs(x - wereld.breedte / 2) * 0.3 }); // laag en in het midden
  }
  plekken.sort((a, b) => b.score - a.score);

  // 2. Rechtstreeks, of via één tussenpunt
  for (const p of plekken.slice(0, 8)) {
    const route = routeNaar(m, p);
    if (route) return route;
  }
  return null;
}

// Een route van mannetje m naar punt p: een lijst punten (het laatste = p), of null.
// Rechtdoor als dat kan; anders zoeken we een weg over een raster van vakjes van 16 px
// (zoals een navigatiesysteem: "breadth-first search") en halen we daarna overbodige tussenpunten weg.
const VAK = 16;
function routeNaar(m, p) {
  if (wereld.isVrijPad(m.x, m.y, p.x, p.y)) return [p];
  const kolommen = Math.ceil(wereld.breedte / VAK);
  const rijen = Math.ceil(wereld.hoogte / VAK);
  const vak = (x, y) => Math.floor(y / VAK) * kolommen + Math.floor(x / VAK);
  const midden = (i) => ({ x: (i % kolommen) * VAK + VAK / 2, y: Math.floor(i / kolommen) * VAK + VAK / 2 });
  const start = vak(m.x, m.y);
  const einde = vak(p.x, p.y);
  const vorige = new Int32Array(kolommen * rijen).fill(-1);
  vorige[start] = start;
  const rij = [start];
  for (let k = 0; k < rij.length && vorige[einde] === -1; k++) {
    const i = rij[k];
    const cx = i % kolommen;
    const cy = Math.floor(i / kolommen);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= kolommen || ny >= rijen) continue;
      const j = ny * kolommen + nx;
      if (vorige[j] !== -1) continue;
      const c = midden(j);
      if (j !== einde && !wereld.isLoopbaar(c.x, c.y)) continue;
      vorige[j] = i;
      rij.push(j);
    }
  }
  // Geen weg (de loopzone bestaat uit losse stukken)? Dan zo dicht mogelijk bij het doel.
  let doelVak = einde;
  let doelPunt = p;
  if (vorige[einde] === -1) {
    let beste = start;
    let kortste = Math.hypot(m.x - p.x, m.y - p.y);
    for (const i of rij) {
      const c = midden(i);
      const afstand = Math.hypot(c.x - p.x, c.y - p.y);
      if (afstand < kortste) {
        kortste = afstand;
        beste = i;
      }
    }
    if (beste === start) return null;
    doelVak = beste;
    doelPunt = midden(beste);
  }
  // De weg terug volgen, van het einde naar het begin
  const weg = [];
  for (let i = doelVak; i !== start; i = vorige[i]) weg.unshift(midden(i));
  weg[weg.length - 1] = doelPunt;
  // Overbodige tussenpunten weg: zo ver mogelijk rechtdoor
  const route = [];
  let van = { x: m.x, y: m.y };
  let k = 0;
  while (k < weg.length) {
    let verst = k;
    for (let j = weg.length - 1; j > k; j--) {
      if (wereld.isVrijPad(van.x, van.y, weg[j].x, weg[j].y)) {
        verst = j;
        break;
      }
    }
    route.push(weg[verst]);
    van = weg[verst];
    k = verst + 1;
  }
  return route;
}

// Het dichtste punt in de loopzone bij (x, y): we zoeken in steeds grotere cirkels
function dichtstbijLoopbaar(x, y) {
  if (wereld.isLoopbaar(x, y)) return { x, y };
  for (let straal = 10; straal < 700; straal += 10) {
    for (let i = 0; i < 24; i++) {
      const hoek = (i / 24) * Math.PI * 2;
      const px = x + Math.cos(hoek) * straal;
      const py = y + Math.sin(hoek) * straal;
      if (wereld.isLoopbaar(px, py)) return { x: px, y: py };
    }
  }
  return null;
}

// --- Acties van de gsm: "Kniel voor het lam", "Sla op de trommel", ... (zie schilderijen.js) ---
function ontvangActie({ mannetje: id, actie: actieId }) {
  const m = mannetjes.find((x) => x.id === id);
  const actie = (SCHILDERIJ.acties ?? []).find((a) => a.id === actieId);
  if (!m || !actie || brawl.bezig) return;

  // Waar moet het naartoe? Een punt, de overkant, of ter plaatse blijven.
  let route = [];
  let doel = null;
  if (Array.isArray(actie.doel)) doel = dichtstbijLoopbaar(...actie.doel);
  else if (actie.doel === 'overkant') doel = dichtstbijLoopbaar(wereld.breedte - m.x, m.y);
  if (doel) {
    // niet allemaal op exact dezelfde plek: een beetje spreiding
    const gespreid = { x: doel.x + tussen(-40, 40), y: doel.y + tussen(-12, 12) };
    route = routeNaar(m, wereld.isLoopbaar(gespreid.x, gespreid.y) ? gespreid : doel) ?? [];
  }
  m.doeActie(actie, route, (wie) => speelEffect(actie.effect, wie));
}

// Het effect bij een actie: deeltjes rond het hoofd, een sneeuwbal, een schot ...
function speelEffect(effect, m) {
  if (!effect) return;
  const schaal = wereld.schaalOp(m.y);
  const hoofdY = m.y - INSTELLINGEN.figuurHoogte * schaal * 0.85;
  if (effect === 'sneeuwbal') return gooiSneeuwbal(m);
  if (effect === 'schot') {
    const loopX = m.x + (m.kijktNaarLinks ? -1 : 1) * INSTELLINGEN.figuurHoogte * schaal * 0.35;
    maakDeeltjes(laag, loopX, hoofdY + 20 * schaal, schaal, 'flits');
    maakWolkje(laag, loopX, hoofdY, schaal, 'rook');
    return;
  }
  maakDeeltjes(laag, m.x, hoofdY, schaal, effect);
}

// Kleine deeltjes die opstijgen of vallen. soort: noten, sterren, druppels, munten, blaadjes,
// vonken, sneeuw, boem, flits. Allemaal tekst of bolletjes, opgemaakt in display.css ("ACTIES").
const DEELTJES = {
  noten: { tekens: ['♪', '♫', '♩', '♬'], aantal: 7 },
  sterren: { tekens: ['✦', '✧', '✦'], aantal: 9 },
  boem: { tekens: ['bom!', 'rom!', 'bom!'], aantal: 4 },
  druppels: { aantal: 10 },
  munten: { aantal: 8 },
  blaadjes: { aantal: 18 },
  vonken: { aantal: 14 },
  sneeuw: { aantal: 12 },
  flits: { aantal: 1 },
};
function maakDeeltjes(ouder, x, y, schaal, soort) {
  const instelling = DEELTJES[soort];
  if (!instelling) return;
  const groep = document.createElement('div');
  groep.className = 'actie-deeltjes ' + soort;
  groep.style.transform = `translate(${x}px, ${y}px) scale(${Math.max(schaal, 0.6)})`;
  groep.style.zIndex = 2500;
  for (let i = 0; i < instelling.aantal; i++) {
    const d = document.createElement('div');
    d.className = 'actie-deeltje';
    if (instelling.tekens) d.textContent = instelling.tekens[i % instelling.tekens.length];
    d.style.setProperty('--dx', tussen(-70, 70) + 'px');
    d.style.setProperty('--dy', tussen(-110, -40) + 'px');
    d.style.setProperty('--draai', tussen(-200, 200) + 'deg');
    d.style.animationDelay = (i / instelling.aantal) * 1.6 + 's';
    groep.appendChild(d);
  }
  ouder.appendChild(groep);
  setTimeout(() => groep.remove(), 4200);
}

// Een sneeuwbal naar het dichtstbijzijnde andere mannetje (doet geen pijn!)
function gooiSneeuwbal(van) {
  const doelwit = mannetjes
    .filter((m) => m !== van && m.toestand !== 'dood')
    .sort((a, b) => Math.hypot(a.x - van.x, a.y - van.y) - Math.hypot(b.x - van.x, b.y - van.y))[0];
  const schaal = wereld.schaalOp(van.y);
  const vanY = van.y - INSTELLINGEN.figuurHoogte * schaal * 0.7;
  const naarX = doelwit ? doelwit.x : van.x + (van.kijktNaarLinks ? -300 : 300);
  const naarY = doelwit ? doelwit.y - INSTELLINGEN.figuurHoogte * wereld.schaalOp(doelwit.y) * 0.6 : vanY;
  if (doelwit) van.kijktNaarLinks = naarX < van.x;
  van.teken();
  const bal = document.createElement('div');
  bal.className = 'sneeuwbal';
  bal.style.zIndex = 2600;
  laag.appendChild(bal);
  const begin = performance.now();
  const duur = 700;
  (function vlieg(nu) {
    const t = Math.min((nu - begin) / duur, 1);
    const x = van.x + (naarX - van.x) * t;
    const y = vanY + (naarY - vanY) * t - Math.sin(t * Math.PI) * 120;
    const s = schaal + (wereld.schaalOp(naarY) - schaal) * t;
    bal.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
    if (t < 1) return requestAnimationFrame(vlieg);
    bal.remove();
    maakDeeltjes(laag, naarX, naarY, s, 'sneeuw');
    if (doelwit) {
      doelwit.element.classList.add('au');
      setTimeout(() => doelwit.element.classList.remove('au'), 180);
    }
  })(begin);
}

// --- Wisselen van schilderij ---
// De pagina laadt opnieuw met ?schilderij=<volgende>. De mannetjes nemen we mee
// via sessionStorage (een klein geheugen van dit tabblad dat een herlaadbeurt overleeft).
const BEWAAR_SLEUTEL = 'byob-mannetjes';
let bezigMetWisselen = false;

function wisselSchilderij(alleenKlaar = true) {
  if (bezigMetWisselen) return;
  bezigMetWisselen = true;
  const volgende = volgendSchilderij(SCHILDERIJ.id, alleenKlaar);
  bewaarMannetjes();
  wisselDoek.classList.add('zichtbaar'); // langzaam naar zwart
  setTimeout(() => {
    const adres = new URL(window.location.href);
    adres.searchParams.set('schilderij', volgende.id);
    window.location.replace(adres.href);
  }, 1200);
}

function bewaarMannetjes() {
  const lijst = mannetjes.filter((m) => m.toestand !== 'dood').map((m) => m.gegevens);
  try {
    sessionStorage.setItem(BEWAAR_SLEUTEL, JSON.stringify(lijst));
  } catch {
    // Te veel tekeningen voor het geheugen? Dan bewaren we alleen de samengestelde personages.
    try {
      sessionStorage.setItem(BEWAAR_SLEUTEL, JSON.stringify(lijst.filter((g) => g.type !== 'tekening')));
    } catch {
      /* dan maar zonder */
    }
  }
}

function haalMannetjesTerug() {
  try {
    const lijst = JSON.parse(sessionStorage.getItem(BEWAAR_SLEUTEL) ?? '[]');
    sessionStorage.removeItem(BEWAAR_SLEUTEL);
    for (const gegevens of lijst) voegMannetjeToe(gegevens);
  } catch {
    /* niets bewaard of kapot: gewoon leeg beginnen */
  }
}

// Het naambordje (klein, altijd zichtbaar) en de grote naamkaart (even, na een wissel)
function toonNaam() {
  if (!INSTELLINGEN.toonSchilderijNaam) {
    naambordje.hidden = true; // uitgezet in instellingen.js
    return;
  }
  const regel = `${SCHILDERIJ.maker}, ${SCHILDERIJ.jaar}`;
  naambordje.querySelector('strong').textContent = SCHILDERIJ.titel;
  naambordje.querySelector('span').textContent = regel;
  naamkaart.querySelector('h1').textContent = SCHILDERIJ.titel;
  naamkaart.querySelector('p').textContent = regel;
  naamkaart.classList.add('zichtbaar');
  setTimeout(() => naamkaart.classList.remove('zichtbaar'), INSTELLINGEN.naamkaartSeconden * 1000);
}

// --- Stenen gooien: klik op de muur ---
wereldElement.addEventListener('pointerdown', (e) => {
  const punt = naarWereld(e);
  stenen.push(new Steen(punt.x, punt.y, wereld.schaalOp(punt.y), laag));
});

function steenLandt(steen) {
  const x = steen.doelX;
  const y = steen.doelY;
  // Raak je meerdere mannetjes? Dan het voorste (grootste y).
  const geraakt = mannetjes.filter((m) => m.raakt(x, y)).sort((a, b) => b.y - a.y)[0];
  if (geraakt) geraakt.krijgSchade(INSTELLINGEN.steenSchade, steen.startX, steen.startY);
  else maakWolkje(laag, x, y, wereld.schaalOp(y), 'stof');
}

// Van schermcoördinaten naar wereld-pixels (1920 x 1080)
function naarWereld(e) {
  const r = wereldElement.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * wereld.breedte,
    y: ((e.clientY - r.top) / r.height) * wereld.hoogte,
  };
}

// --- Debugmodus (D) ---
let maskerBeeld = null; // het masker als groen/rood beeld, één keer berekend

function maakMaskerBeeld() {
  const beeld = debugCtx.createImageData(wereld.breedte, wereld.hoogte);
  for (let i = 0; i < wereld.pixels.length; i += 4) {
    const loopbaar = wereld.pixels[i] > 128;
    beeld.data[i] = loopbaar ? 0 : 255;
    beeld.data[i + 1] = loopbaar ? 255 : 0;
    beeld.data[i + 2] = 0;
    beeld.data[i + 3] = loopbaar ? 70 : 90;
  }
  return beeld;
}

function tekenDebug() {
  const ctx = debugCtx;
  const { horizonY, onderkantY } = INSTELLINGEN;
  ctx.putImageData(maskerBeeld, 0, 0);

  // Horizon en onderkant (voor de schaal)
  ctx.lineWidth = 3;
  ctx.font = 'bold 22px monospace';
  ctx.setLineDash([12, 8]);
  ctx.strokeStyle = ctx.fillStyle = '#00e5ff';
  ctx.beginPath();
  ctx.moveTo(0, horizonY);
  ctx.lineTo(wereld.breedte, horizonY);
  ctx.moveTo(0, onderkantY - 2);
  ctx.lineTo(wereld.breedte, onderkantY - 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillText(`horizonY = ${horizonY} (schaal ${INSTELLINGEN.schaalHorizon})`, 10, horizonY - 10);
  ctx.fillText(`onderkantY = ${onderkantY} (schaal ${INSTELLINGEN.schaalOnderaan})`, 10, onderkantY - 12);

  // De voetY van elk voorgrondobject
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = ctx.fillStyle = '#ff9f1c';
  ctx.lineWidth = 2;
  ctx.font = 'bold 16px monospace';
  for (const object of INSTELLINGEN.voorgrond) {
    ctx.beginPath();
    ctx.moveTo(0, object.voetY);
    ctx.lineTo(wereld.breedte, object.voetY);
    ctx.stroke();
    ctx.fillText(`${object.afbeelding} voetY = ${object.voetY}`, wereld.breedte - 420, object.voetY - 6);
  }
  ctx.setLineDash([]);

  // Elk mannetje: positie en doel
  ctx.font = '16px monospace';
  for (const m of mannetjes) {
    if (m.doel) {
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(m.doel.x, m.doel.y);
      ctx.stroke();
      ctx.fillStyle = 'yellow';
      ctx.fillRect(m.doel.x - 5, m.doel.y - 5, 10, 10);
    }
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(m.x, m.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(`${Math.round(m.x)},${Math.round(m.y)}`, m.x + 8, m.y + 18);
  }

  debugPaneel.textContent =
    `DEBUG (D = uit)\n` +
    `muis:      x ${Math.round(muis.x)}, y ${Math.round(muis.y)}\n` +
    `loopbaar:  ${wereld.isLoopbaar(muis.x, muis.y) ? 'ja' : 'nee'}\n` +
    `schaal:    ${wereld.schaalOp(muis.y).toFixed(2)}\n` +
    `mannetjes: ${mannetjes.length} / ${INSTELLINGEN.maxMannetjes}\n` +
    `schilderij: ${SCHILDERIJ.id}${SCHILDERIJ.klaar ? '' : ' (nog niet klaar)'}\n` +
    `verbinding: ${DEMOMODUS ? 'DEMO (geen Firebase)' : 'Firebase'}\n` +
    `T = testmannetje   F = fullscreen\n` +
    `N = nuke           B = brawl\n` +
    `S = volgend schilderij   V = feitje\n` +
    `E = effecten ${effectenAan ? 'uit' : 'aan'}zetten   L = lijst`;
}

function wisselDebug() {
  debug = !debug;
  debugCanvas.hidden = !debug;
  debugPaneel.hidden = !debug;
  document.body.classList.toggle('debug', debug);
}

window.addEventListener('mousemove', (e) => {
  muis = naarWereld(e);
});

// --- Toetsen ---
window.addEventListener('keydown', (e) => {
  const toets = e.key.toLowerCase();
  if (toets === 'f') {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  } else if (toets === 'd') wisselDebug();
  else if (toets === 't') voegTestMannetjeToe();
  else if (toets === 'n') nuke(wereldElement, laag, mannetjes);
  else if (toets === 'b') brawl.start(mannetjes);
  else if (toets === 's') wisselSchilderij(false); // S: ook schilderijen die nog niet klaar zijn
  else if (toets === 'v') vertelFeitje();
  else if (toets === 'e') wisselEffecten();
  else if (toets === 'l') {
    lijstAan = !lijstAan;
    pasSchaalAan();
  }
});

// E: de bewegende effecten aan/uit (als de laptop het niet trekt)
function wisselEffecten() {
  effectenAan = !effectenAan;
  wereldElement.classList.toggle('geen-effecten', !effectenAan);
}

function toonMelding(tekst) {
  melding.textContent = tekst;
  melding.hidden = false;
}

// --- Opstarten ---
async function start() {
  schilderij.src = INSTELLINGEN.schilderij;
  try {
    await wereld.laad(INSTELLINGEN.masker);
  } catch (fout) {
    console.error(fout);
    toonMelding(`Kan het masker "${INSTELLINGEN.masker}" niet laden. Staat het in de map public/?`);
    return;
  }
  if (!wereld.willekeurigPunt()) toonMelding('Het masker is (bijna) helemaal zwart: er is geen plek om te lopen.');
  else if (DEMOMODUS) {
    toonMelding('Demomodus: Firebase is nog niet ingesteld (zie src/verbinding.js). Open join.html in een ander tabblad.');
    setTimeout(() => (melding.hidden = true), 8000);
  }

  // De personages in de kleur en het licht van dit schilderij (vóór er personages komen!)
  try {
    await bekijkSchilderij(INSTELLINGEN.schilderij, wereld, SCHILDERIJ.inpassen);
  } catch (fout) {
    console.warn('Kon het schilderij niet bekijken; de personages blijven in hun eigen kleuren.', fout);
  }

  if (INSTELLINGEN.sfeer) sfeer = new Sfeer(wereldElement, laag);
  if (SCHILDERIJ.effecten?.length) {
    const map = INSTELLINGEN.schilderij.replace('schilderij.jpg', '');
    effecten = new Effecten(wereldElement, laag, SCHILDERIJ.effecten, SCHILDERIJ.grens, map);
  }
  wereldElement.classList.toggle('geen-effecten', !effectenAan);
  maakVoorgrond();
  await maakGroepen();
  maskerBeeld = maakMaskerBeeld();
  if (INSTELLINGEN.toonQrCode) maakQrCode();
  else document.querySelector('#qr-hoek').hidden = true; // de QR-code hangt op papier (affiche.html)
  toonNaam();
  meldSchilderij(SCHILDERIJ.id); // zo weet de gsm welk schilderij er hangt
  haalMannetjesTerug(); // de mannetjes van het vorige schilderij
  luisterNaarMannetjes(voegMannetjeToe);
  luisterNaarActies(ontvangActie); // knoppen op de gsm: "Kniel voor het lam", ...
  requestAnimationFrame(frame);

  // Om de zoveel minuten het volgende schilderij
  if (INSTELLINGEN.wisselMinuten > 0) setTimeout(wisselSchilderij, INSTELLINGEN.wisselMinuten * 60 * 1000);
  // Het beeld komt rustig uit het zwart
  requestAnimationFrame(() => wisselDoek.classList.remove('zichtbaar'));
}

// Het script werkt: weg met de waarschuwing "deze pagina werkt niet zo"
document.querySelector('#startfout')?.remove();
start();
