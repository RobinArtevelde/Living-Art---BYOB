// =====================================================================
// ACTIES: de NUKE (N) en de BRAWL (B)
// =====================================================================

import { maakWolkje } from './stenen.js';
import { Nuke } from './nuke.js';

// Waar de bom valt (midden van de wei)
const BOM_X = 960;
const BOM_Y = 640;

let nukeBezig = false;

function maakDiv(ouder, klasse) {
  const div = document.createElement('div');
  div.className = klasse;
  ouder.appendChild(div);
  return div;
}

// Grote tekst in het midden van het scherm (bv. "BRAWL!")
export function groteTekst(wereld, tekst) {
  const div = maakDiv(wereld, 'grote-tekst');
  div.textContent = tekst;
  setTimeout(() => div.remove(), 2600);
}

// ---------------------------------------------------------------------
// NUKE: een bom valt, flits, vuurbal, paddenstoelwolk, iedereen sterft
// (wie dichter bij de bom staat, sterft eerst).
// mannetjes = de lijst van alle mannetjes; die wordt leeggemaakt.
// ---------------------------------------------------------------------
export function nuke(wereld, laag, mannetjes, grond = { x: BOM_X, y: BOM_Y }) {
  if (nukeBezig) return;
  nukeBezig = true;
  // Alles zit in nuke.js: vallende bom, flits, schokgolf, vuurbal, paddenstoelwolk, stof, puin, krater
  new Nuke(wereld, mannetjes, grond, 1, () => (nukeBezig = false));
}

// ---------------------------------------------------------------------
// BRAWL: iedereen krijgt een zwaard en een levensbalk en vecht
// tot er één overblijft (last man standing). Na 60 seconden wint wie
// het meeste leven over heeft.
// ---------------------------------------------------------------------
const MAX_DUUR = 60000; // ms

export class Brawl {
  constructor(wereld) {
    this.wereld = wereld;
    this.bezig = false;
  }

  start(mannetjes) {
    if (this.bezig) return;
    if (mannetjes.length < 2) {
      groteTekst(this.wereld, 'Te weinig mannetjes!');
      return;
    }
    this.bezig = true;
    this.starttijd = Date.now();
    for (const m of mannetjes) m.pakZwaard();
    groteTekst(this.wereld, '⚔️ BRAWL!');
  }

  // Elke frame: is er al een winnaar?
  update(mannetjes) {
    if (!this.bezig) return;
    const vechters = mannetjes.filter((m) => m.toestand === 'vechten');
    if (vechters.length <= 1) {
      this.einde(vechters[0]);
    } else if (Date.now() - this.starttijd > MAX_DUUR) {
      vechters.sort((a, b) => b.leven - a.leven);
      for (const m of vechters.slice(1)) m.legZwaardNeer();
      this.einde(vechters[0]);
    }
  }

  einde(winnaar) {
    this.bezig = false;
    if (!winnaar) return;
    groteTekst(this.wereld, `🏆 ${winnaar.naam} wint!`);
    winnaar.element.classList.add('winnaar');
    setTimeout(() => winnaar.legZwaardNeer(), 3500);
  }
}
