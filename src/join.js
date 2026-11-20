// =====================================================================
// GSM-PAGINA (join.html)
// Naam invullen → personage samenstellen of zelf tekenen → versturen.
// Bovenaan staat welk schilderij er nu op de muur hangt, met een "wist je dat".
// De kleren en voorwerpen passen zich aan dat schilderij aan (zie schilderijen.js).
// =====================================================================

import { KEUZES, KLEURKEUZES, controleerPersonage, willekeurigPersonage, pasAanGarderobe, zetPersonageIn } from './personage.js';
import { controleerNaam } from './naamfilter.js';
import { stuurMannetje, stuurActie, luisterNaarSchilderij } from './verbinding.js';
import { zoekSchilderij } from './schilderijen.js';
import { Tekenvlak } from './tekenvlak.js';

// Hoeveel seconden je moet wachten tussen twee personages (tegen spam)
const WACHTTIJD = 10;
const PENKLEUREN = ['#1d1d1d', '#a3262a', '#2a5ea8', '#2f6b3a', '#e8b931', '#f2efe6'];

const $ = (selector) => document.querySelector(selector);
const formulier = $('#formulier');
const naamVeld = $('#naam');
const teller = $('#teller');
const foutmelding = $('#foutmelding');
const verstuurKnop = $('#verstuur-knop');
const tabSamenstellen = $('#tab-samenstellen');
const tabTekenen = $('#tab-tekenen');
const paneelSamenstellen = $('#paneel-samenstellen');
const paneelTekenen = $('#paneel-tekenen');
const formulierScherm = $('#formulier-scherm');
const bevestigingScherm = $('#bevestiging-scherm');
const bevestigingFiguur = $('#bevestiging-figuur');
const bevestigingNaam = $('#bevestiging-naam');

let manier = 'samengesteld'; // of 'tekening'
let schilderij = zoekSchilderij('lamgods'); // tot de muur laat weten welk schilderij er hangt
let personage = willekeurigPersonage(schilderij.garderobe); // we beginnen met een willekeurig personage
let feitjeNummer = 0;

// Het samenstellen gebeurt in stappen, zodat de lijst kort blijft en je mannetje in beeld blijft.
// Elke stap toont een paar rijen uit KEUZES (of de kleuren).
const STAPPEN = [
  { id: 'wie', label: 'Wie', rijen: ['geslacht', 'uitdrukking', 'leeftijd'] }, // 'gezicht' (de vorm) wordt willekeurig gekozen
  { id: 'hoofd', label: 'Hoofd', rijen: ['haar', 'baard', 'snor', 'hoofddeksel'] },
  { id: 'kleren', label: 'Kleren', rijen: ['kleed', 'bovenkleed', 'riem', 'broek', 'schoenen'] },
  { id: 'handen', label: 'In je handen', rijen: ['voorwerp', 'houding'] },
  { id: 'kleuren', label: 'Kleuren', rijen: [], kleuren: true },
];
let stapNummer = 0;
let laatstVerstuurd = 0;
const tekenvlak = new Tekenvlak($('#tekenvlak'));

// --- Tabbladen ---
function kiesManier(nieuw) {
  manier = nieuw;
  const tekenen = manier === 'tekening';
  tabSamenstellen.setAttribute('aria-selected', !tekenen);
  tabTekenen.setAttribute('aria-selected', tekenen);
  paneelSamenstellen.hidden = tekenen;
  paneelTekenen.hidden = !tekenen;
  foutmelding.textContent = '';
}
tabSamenstellen.addEventListener('click', () => kiesManier('samengesteld'));
tabTekenen.addEventListener('click', () => kiesManier('tekening'));

// --- Samenstellen: voorbeeld + rijen met pijltjes + kleuren ---
function tekenSamensteller() {
  zetPersonageIn($('#voorbeeld'), personage);

  tekenStappen();
  const stap = STAPPEN[stapNummer];

  // Eén rij per keuze van deze stap:  Label   ‹  waarde  ›
  const kiezers = $('#kiezers');
  kiezers.innerHTML = '';
  for (const sleutel of stap.rijen) {
    const alleRij = KEUZES[sleutel];
    if (!alleRij) continue;
    if (alleRij.alleen && !alleRij.alleen(personage)) continue; // bv. geen baard bij een vrouw
    // Alleen de keuzes die bij het schilderij passen (staat de rij niet in de garderobe: alles)
    const toegelaten = schilderij.garderobe[sleutel];
    const rij = toegelaten
      ? { ...alleRij, opties: toegelaten.map((id) => alleRij.opties.find(([optie]) => optie === id)).filter(Boolean) }
      : alleRij;
    const index = Math.max(0, rij.opties.findIndex(([id]) => id === personage[sleutel]));
    const div = document.createElement('div');
    div.className = 'kiezer';
    div.innerHTML = `
      <span class="kiezer-label">${rij.label}</span>
      <button type="button" class="pijl" aria-label="Vorige ${rij.label}">‹</button>
      <span class="kiezer-waarde">${rij.opties[index][1]}</span>
      <button type="button" class="pijl" aria-label="Volgende ${rij.label}">›</button>`;
    const [vorige, volgende] = div.querySelectorAll('.pijl');
    const aantal = rij.opties.length;
    vorige.addEventListener('click', () => kies(sleutel, rij.opties[(index - 1 + aantal) % aantal][0]));
    volgende.addEventListener('click', () => kies(sleutel, rij.opties[(index + 1) % aantal][0]));
    kiezers.appendChild(div);
  }

  // De kleuren (alleen bij de stap "Kleuren")
  const kleurvelden = $('#kleurvelden');
  kleurvelden.innerHTML = '';
  for (const [sleutel, rij] of stap.kleuren ? Object.entries(KLEURKEUZES) : []) {
    const label = document.createElement('p');
    label.className = 'kleurlabel';
    label.textContent = rij.label;
    const bolletjes = document.createElement('div');
    bolletjes.className = 'kleuren';
    kleurvelden.append(label, bolletjes);
    tekenKleurknoppen(bolletjes, rij.kleuren, personage[sleutel], (kleur) => kies(sleutel, kleur));
  }
}

// De knoppen bovenaan: Wie · Hoofd · Kleren · In je handen · Kleuren
function tekenStappen() {
  const houder = $('#stappen');
  houder.innerHTML = '';
  STAPPEN.forEach((stap, i) => {
    const knop = document.createElement('button');
    knop.type = 'button';
    knop.setAttribute('role', 'tab');
    knop.setAttribute('aria-selected', i === stapNummer);
    knop.textContent = `${i + 1}. ${stap.label}`;
    knop.addEventListener('click', () => gaNaarStap(i));
    houder.appendChild(knop);
  });
  const laatste = stapNummer === STAPPEN.length - 1;
  $('#volgende-stap').textContent = laatste ? 'Klaar! Naar versturen ›' : `Volgende: ${STAPPEN[stapNummer + 1].label} ›`;
}

function gaNaarStap(i) {
  stapNummer = i;
  tekenSamensteller();
  // Terug naar de stappen, zodat je de nieuwe rijen meteen ziet
  $('#stappen').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

$('#volgende-stap').addEventListener('click', () => {
  if (stapNummer < STAPPEN.length - 1) gaNaarStap(stapNummer + 1);
  else verstuurKnop.scrollIntoView({ block: 'center', behavior: 'smooth' });
});

function kies(sleutel, waarde) {
  personage = controleerPersonage({ ...personage, [sleutel]: waarde });
  // Een vrouw krijgt geen baard of snor
  if (sleutel === 'geslacht' && waarde === 'vrouw') personage = { ...personage, baard: 'geen', snor: 'geen' };
  tekenSamensteller();
}

$('#willekeurig-knop').addEventListener('click', () => {
  personage = willekeurigPersonage(schilderij.garderobe);
  tekenSamensteller();
});

// --- Welk schilderij hangt er op de muur? ---
function toonSchilderij(id) {
  const nieuw = zoekSchilderij(id);
  const anders = nieuw.id !== schilderij.id;
  schilderij = nieuw;
  $('#nu-op-de-muur').hidden = false;
  $('#nu-titel').textContent = schilderij.titel;
  $('#nu-maker').textContent = `${schilderij.maker}, ${schilderij.jaar}`;
  $('#tip-samenstellen').textContent = `Kies kleren en voorwerpen die passen bij ${schilderij.titel}.`;
  feitjeNummer = Math.floor(Math.random() * schilderij.feitjes.length);
  toonFeitje();
  if (anders && !bevestigingScherm.hidden) tekenActies(); // de muur wisselde: andere acties
  if (anders) {
    // Kleren die niet bij het nieuwe schilderij passen, worden vervangen
    personage = pasAanGarderobe(personage, schilderij.garderobe);
    tekenSamensteller();
  }
}

function toonFeitje() {
  $('#nu-feitje').textContent = schilderij.feitjes[feitjeNummer % schilderij.feitjes.length];
}
$('#feitje-knop').addEventListener('click', () => {
  feitjeNummer++;
  toonFeitje();
});

// Een rij ronde kleurknoppen
function tekenKleurknoppen(houder, kleuren, gekozen, bijKlik) {
  houder.innerHTML = '';
  for (const kleur of kleuren) {
    const knop = document.createElement('button');
    knop.type = 'button';
    knop.className = 'kleur-knop';
    knop.style.background = kleur;
    knop.setAttribute('aria-label', 'Kleur ' + kleur);
    knop.setAttribute('aria-pressed', kleur === gekozen);
    knop.addEventListener('click', () => bijKlik(kleur));
    houder.appendChild(knop);
  }
}

// --- Tekenen ---
function tekenPenkleuren() {
  tekenKleurknoppen($('#penkleuren'), PENKLEUREN, tekenvlak.kleur, (kleur) => {
    tekenvlak.kleur = kleur;
    tekenPenkleuren();
  });
}
$('#ongedaan-knop').addEventListener('click', () => tekenvlak.ongedaan());
$('#wis-knop').addEventListener('click', () => tekenvlak.wis());

// --- Naam: teller ---
naamVeld.addEventListener('input', () => {
  teller.textContent = `${naamVeld.value.length} / 16`;
  foutmelding.textContent = '';
});

// --- Versturen ---
formulier.addEventListener('submit', async (e) => {
  e.preventDefault();

  const controle = controleerNaam(naamVeld.value);
  if (!controle.ok) {
    foutmelding.textContent = controle.fout;
    naamVeld.focus();
    return;
  }

  let tekening = null;
  if (manier === 'tekening') {
    tekening = tekenvlak.naarAfbeelding();
    if (!tekening) {
      foutmelding.textContent = 'Teken eerst je mannetje.';
      return;
    }
  }

  const verstreken = (Date.now() - laatstVerstuurd) / 1000;
  if (verstreken < WACHTTIJD) {
    foutmelding.textContent = `Even geduld: nog ${Math.ceil(WACHTTIJD - verstreken)} seconden.`;
    return;
  }

  verstuurKnop.disabled = true;
  verstuurKnop.textContent = 'Bezig met versturen…';
  try {
    if (manier === 'tekening') {
      mijnMannetje = await stuurMannetje({ naam: controle.naam, type: 'tekening', tekening });
    } else {
      mijnMannetje = await stuurMannetje({ naam: controle.naam, type: 'samengesteld', onderdelen: personage });
    }
    laatstVerstuurd = Date.now();
    toonBevestiging(controle.naam, tekening);
  } catch (fout) {
    console.error(fout);
    foutmelding.textContent = 'Oei, dat lukte niet. Check je internet en probeer opnieuw.';
  } finally {
    verstuurKnop.disabled = false;
    verstuurKnop.textContent = 'Stuur mijn mannetje';
  }
});

// --- Bevestigingsscherm ---
function toonBevestiging(naam, tekening) {
  if (tekening) {
    bevestigingFiguur.innerHTML = '';
    bevestigingFiguur.classList.remove('samengesteld', 'lang');
    const img = new Image();
    img.src = tekening;
    img.alt = '';
    bevestigingFiguur.appendChild(img);
  } else {
    zetPersonageIn(bevestigingFiguur, personage);
  }
  bevestigingNaam.textContent = naam;
  tekenActies();
  formulierScherm.hidden = true;
  bevestigingScherm.hidden = false;
  window.scrollTo(0, 0);
}

// --- Acties: je mannetje iets laten doen op de muur ---
// Per schilderij drie knoppen (zie "acties" in schilderijen.js). Na een druk moet je even wachten,
// zodat de muur niet overspoeld wordt.
const ACTIE_WACHTTIJD = 6; // seconden
let mijnMannetje = null; // het id van je mannetje op de muur
let actieKlaarOm = 0;

function tekenActies() {
  const houder = $('#acties');
  houder.innerHTML = '';
  $('#acties-uitleg').textContent = `Laat je mannetje iets doen in ${schilderij.titel}:`;
  for (const actie of schilderij.acties ?? []) {
    const knop = document.createElement('button');
    knop.type = 'button';
    knop.className = 'actie-knop';
    const icoon = document.createElement('span');
    icoon.className = 'actie-icoon';
    icoon.setAttribute('aria-hidden', 'true');
    icoon.textContent = actie.icoon;
    knop.append(icoon, document.createTextNode(actie.label));
    knop.addEventListener('click', () => doeActie(actie));
    houder.appendChild(knop);
  }
}

async function doeActie(actie) {
  const melding = $('#actie-melding');
  const nog = Math.ceil((actieKlaarOm - Date.now()) / 1000);
  if (nog > 0) {
    melding.textContent = `Even wachten: je mannetje is nog bezig (${nog} s).`;
    return;
  }
  if (!mijnMannetje) return;
  actieKlaarOm = Date.now() + ACTIE_WACHTTIJD * 1000;
  for (const knop of document.querySelectorAll('.actie-knop')) knop.disabled = true;
  setTimeout(() => {
    for (const knop of document.querySelectorAll('.actie-knop')) knop.disabled = false;
    melding.textContent = '';
  }, ACTIE_WACHTTIJD * 1000);
  try {
    await stuurActie(mijnMannetje, actie.id);
    melding.textContent = `${actie.icoon} Kijk naar de muur!`;
  } catch (fout) {
    console.error(fout);
    melding.textContent = 'Oei, dat lukte niet. Probeer opnieuw.';
  }
}

$('#opnieuw-knop').addEventListener('click', () => {
  bevestigingScherm.hidden = true;
  formulierScherm.hidden = false;
});

// Het script werkt: weg met de waarschuwing "deze pagina werkt niet zo"
document.querySelector('#startfout')?.remove();
tekenSamensteller();
tekenPenkleuren();
luisterNaarSchilderij(toonSchilderij);
