// =====================================================================
// ALLE INSTELBARE WAARDEN OP ÉÉN PLEK
// Pas hier getallen aan; de rest van de code leest ze van hieruit.
// =====================================================================

import { zoekSchilderij } from './schilderijen.js';

// Welk schilderij hangt er nu? Kies met ?schilderij=nachtwacht in de adresbalk.
// (De muur wisselt zelf om de zoveel minuten: zie wisselMinuten hieronder.)
const ADRES = new URLSearchParams(location.search);
const SCHILDERIJ = zoekSchilderij(ADRES.get('schilderij'));

const IS_LAMGODS = SCHILDERIJ.id === 'lamgods';
const MAP = SCHILDERIJ.map; // de map in public/ met de afbeeldingen

export const INSTELLINGEN = {
  schilderijInfo: SCHILDERIJ, // titel, maker, jaar, feitjes, garderobe (zie schilderijen.js)

  // De "wereld" is altijd 1920 x 1080. display.js schaalt alles naar het scherm.
  breedte: 1920,
  hoogte: 1080,

  schilderij: MAP + 'schilderij.jpg',
  masker: MAP + 'masker.png', // wit = hier mag je lopen, zwart = niet
  groepen: MAP + 'groepen.json', // geschilderde groepen waar je achter kan lopen

  // --- Diepte: hoe hoger op het scherm, hoe kleiner ---
  // De getallen staan per schilderij in schilderijen.js ("diepte"):
  //   horizonY       = y waar de figuren het kleinst zijn
  //   onderkantY     = y waar ze het grootst zijn
  //   schaalHorizon  = schaal op de horizon
  //   schaalOnderaan = schaal helemaal onderaan
  ...SCHILDERIJ.diepte,

  // --- Wisselen van schilderij ---
  wisselMinuten: 10, // om de hoeveel minuten komt het volgende schilderij (0 = nooit)
  toonSchilderijNaam: false,
  lijstAan: true, // een museumlijst rond het schilderij (stijl per schilderij: "lijst" in schilderijen.js); toets L
  muurKleur: '#f2f0eb', // de kleur van de muur rond de lijst (wit, zoals op BYOB)
  toonBordje: true, // een koperen naambordje onder de lijst met titel, maker en jaar // true = naambordje linksonder + grote titel na een wissel
  naamkaartSeconden: 5, // hoe lang de grote titel in beeld blijft na een wissel

  // --- Bewegende effecten (rook, vonken, licht, vlag: zie effecten.js en schilderijen.js) ---
  // Hapert het beeld op de beamer-laptop? Zet dit op false, of druk E op de muur.
  effectenAan: true,

  // Vernis: linnen, craquelé en donkere randen over alles (0 = uit, 1 = heel sterk)
  vernisSterkte: 0.55,

  // --- Feitjes: af en toe stapt een personage naar voren en vertelt iets ---
  feitjeElke: [25, 45], // om de hoeveel seconden (min, max)
  feitjeSeconden: 9, // hoe lang de tekstballon blijft staan

  // --- Mannetjes ---
  maxMannetjes: 40, // meer? dan verdwijnt de oudste
  figuurHoogte: 150, // hoogte van een figuur bij schaal 1 (in wereld-pixels)
  snelheid: 110, // pixels per seconde bij schaal 1
  wachtMin: 1, // seconden stilstaan tussen twee wandelingen
  wachtMax: 4,
  naamMinimumSchaal: 0.7, // naamlabels worden nooit kleiner/groter dan dit
  naamMaximumSchaal: 1.0,

  // --- Stenen en brawl ---
  levenspunten: 100,
  steenSchade: 30, // 30 schade: iedereen overleeft minstens 3 stenen
  zwaardSchadeMin: 20,
  zwaardSchadeMax: 30,

  // --- Voorgrond: objecten waar je achter kan lopen ---
  // voetY = de y van de onderkant van het object. Wie hoger staat (kleinere y), loopt erachter.
  // beweging = naam van een CSS-animatie (zie display.css, "BEWEGENDE OBJECTEN")
  // oorsprong = het draaipunt van die beweging (in wereld-pixels)
  // delen = extra stukken die apart bewegen (vleugels, de kop van het lam)
  voorgrond: !IS_LAMGODS ? [] : [
    { afbeelding: MAP + 'voorgrond-fontein.png', voetY: 911 },
    {
      afbeelding: MAP + 'voorgrond-engel-voor-links.png',
      voetY: 631,
      beweging: 'zwaaien',
      oorsprong: [810, 656],
    },
    {
      afbeelding: MAP + 'voorgrond-engel-voor-rechts.png',
      voetY: 628,
      beweging: 'zwaaien',
      oorsprong: [1113, 656],
    },
    {
      afbeelding: MAP + 'voorgrond-engelen-rechts.png',
      voetY: 525,
      beweging: 'wiegen',
      oorsprong: [1177, 553],
      delen: [{ afbeelding: MAP + 'voorgrond-vleugel-rechts.png', beweging: 'vleugel-rechts', oorsprong: [1133, 329] }],
    },
    {
      afbeelding: MAP + 'voorgrond-engelen-links.png',
      voetY: 503,
      beweging: 'wiegen',
      oorsprong: [749, 531],
      delen: [{ afbeelding: MAP + 'voorgrond-vleugel-links.png', beweging: 'vleugel-links', oorsprong: [754, 379] }],
    },
    { afbeelding: MAP + 'voorgrond-altaar.png', voetY: 465 },
    {
      afbeelding: MAP + 'voorgrond-lam.png',
      voetY: 466,
      beweging: 'lam',
      oorsprong: [952, 386],
      delen: [{ afbeelding: MAP + 'voorgrond-lamkop.png', beweging: 'lamkop', oorsprong: [926, 313] }],
    },
  ],

  // --- Bewegende achtergrond (sfeer.js en wind.js) ---
  // Alleen het Lam Gods heeft (voorlopig) een bewegende achtergrond.
  sfeer: !IS_LAMGODS ? null : {
    stralenSterkte: 0.3, // hoe fel de draaiende zonnestralen zijn (0 = uit)
    horizon: MAP + 'horizon.png', // de lucht en de horizon, apart zodat de wolken erachter kunnen
    windMasker: MAP + 'wind-masker.png', // wit = beweegt in de wind (struiken, bomen)
    zon: { afbeelding: MAP + 'zon.png', midden: [965, 7] },
    duif: { afbeelding: MAP + 'duif.png', midden: [968, 2] },
    bomen: [], // optioneel: losse bomen die buigen { afbeelding, voetY, buig }
    aantalWolken: 5,
    wolkHoogte: [-20, 70],
    wolkGrootte: [140, 280],
    vogelsElke: [6, 16], // om de hoeveel seconden een zwerm vogels (min, max)
    windKracht: 1,
    blaadjesPerSeconde: 1.2, // bloesems die door het beeld waaien (meer = drukker)
  },

  // Op de muur verschijnen enkel personages van de laatste zoveel minuten
  // (zo komen niet alle personages van gisteren terug na een herstart).
  recenteMinuten: 15,

  // QR-code in de hoek van de muur tonen?
  // false = niet op de muur; de bezoekers scannen de QR-code op papier (print affiche.html).
  toonQrCode: false,

  // Naar welk adres wijst de QR-code? null = automatisch (dezelfde site, join.html).
  // Vul hier het echte adres in als de muur op een andere computer/adres draait,
  // bv. 'https://jullie-project.web.app/join.html'
  joinUrl: null,
};
