// =====================================================================
// ÉÉN MANNETJE op de muur.
//
// Normaal: wachten → een doel kiezen → ernaartoe lopen → wachten → ...
// Af en toe: naar voren stappen en een feitje vertellen (tekstballon).
// Tijdens een brawl: "vechten" (naar de dichtstbijzijnde vechter lopen en slaan).
// Na te veel schade: "dood".
//
// Het element ziet er zo uit:
//   .mannetje            (verplaatst + geschaald naar x, y)
//     .mannetje-binnen   (pop-in animatie)
//       .tekstballon  (alleen zichtbaar als het een feitje vertelt)
//       .naam
//       .levensbalk      (alleen zichtbaar tijdens een brawl)
//       .figuur          (het personage of de tekening)
// =====================================================================

import { INSTELLINGEN } from './instellingen.js';
import { isPersonage, zetPersonageIn } from './personage.js';
import { kleurTekening, lichtOp, verteFactor } from './inpassen.js';
import { maakWolkje } from './stenen.js';

// Een zwaard voor de brawl
const ZWAARD_SVG = `<svg viewBox="0 0 20 70" xmlns="http://www.w3.org/2000/svg">
  <path d="M8 48 V6 L10 0 L12 6 V48 Z" fill="#dfe4ea" stroke="#5b6570" stroke-width="1"/>
  <path d="M10 2 V46" stroke="#ffffff" stroke-width="1" opacity="0.7"/>
  <rect x="1" y="47" width="18" height="4" rx="2" fill="#d6a845" stroke="#7a5a1c" stroke-width="0.8"/>
  <rect x="8.5" y="51" width="3" height="13" fill="#6b4a2b"/>
  <circle cx="10" cy="66" r="3" fill="#d6a845" stroke="#7a5a1c" stroke-width="0.8"/>
</svg>`;

function tussen(min, max) {
  return min + Math.random() * (max - min);
}

// Is dit een veilige getekende afbeelding? (alleen PNG-data, niets anders)
function isTekening(tekening) {
  return typeof tekening === 'string' && tekening.startsWith('data:image/png;base64,');
}

export class Mannetje {
  constructor(gegevens, wereld, laag) {
    this.id = gegevens.id;
    this.naam = gegevens.naam;
    this.gegevens = gegevens; // bewaard, zodat het mannetje een schilderijwissel overleeft
    this.wereld = wereld;
    this.laag = laag;

    // Start op een willekeurige plek in de loopzone
    const start = wereld.willekeurigPunt() ?? { x: wereld.breedte / 2, y: wereld.hoogte - 10 };
    this.x = start.x;
    this.y = start.y;
    this.doel = null;
    this.toestand = 'wachten'; // wachten | lopen | vertellen | actie | vechten | dood
    this.snelheidFactor = 1; // > 1 bij glijden over het ijs
    this.bijAankomst = null; // wat er moet gebeuren als het doel bereikt is (bv. een feitje vertellen)
    this.wachttijd = tussen(0.5, 1.5);
    this.kijktNaarLinks = Math.random() < 0.5;
    this.leven = INSTELLINGEN.levenspunten;

    // --- HTML opbouwen ---
    this.element = document.createElement('div');
    this.element.className = 'mannetje';
    const binnen = document.createElement('div');
    binnen.className = 'mannetje-binnen pop-in';

    this.naamElement = document.createElement('div');
    this.naamElement.className = 'naam';
    this.naamElement.textContent = this.naam; // textContent: een naam kan nooit HTML worden

    this.figuurElement = document.createElement('div');
    this.figuurElement.className = 'figuur';
    if (gegevens.type === 'tekening' && isTekening(gegevens.tekening)) {
      const img = new Image();
      img.src = gegevens.tekening;
      img.alt = '';
      img.className = 'tekening';
      this.figuurElement.appendChild(img);
      kleurTekening(gegevens.tekening).then((bron) => (img.src = bron)); // in de toon van het schilderij
    } else {
      // Een samengesteld personage (onbekende of kapotte gegevens → standaardpersonage)
      const houder = document.createElement('div');
      this.figuurElement.appendChild(houder);
      zetPersonageIn(houder, isPersonage(gegevens.onderdelen) ? gegevens.onderdelen : {});
    }

    // Slagschaduw: hetzelfde figuurtje, zwart en wazig, platgedrukt op de grond in de richting
    // van het licht van het schilderij (zie "schaduw" in schilderijen.js en .slagschaduw in display.css).
    // Ze draait niet mee als het mannetje omdraait: het licht blijft van dezelfde kant komen.
    this.schaduwElement = document.createElement('div');
    this.schaduwElement.className = 'slagschaduw';
    this.schaduwFiguur = document.createElement('div');
    this.schaduwFiguur.className = 'figuur schaduw-figuur';
    this.schaduwElement.appendChild(this.schaduwFiguur);
    if (gegevens.type === 'tekening' && isTekening(gegevens.tekening)) {
      const img = new Image();
      img.src = gegevens.tekening;
      img.alt = '';
      img.className = 'tekening';
      this.schaduwFiguur.appendChild(img);
    } else {
      const houder = document.createElement('div');
      this.schaduwFiguur.appendChild(houder);
      zetPersonageIn(houder, isPersonage(gegevens.onderdelen) ? gegevens.onderdelen : {});
    }

    this.levensbalk = document.createElement('div');
    this.levensbalk.className = 'levensbalk';
    this.levensVulling = document.createElement('div');
    this.levensbalk.appendChild(this.levensVulling);

    this.ballon = document.createElement('div');
    this.ballon.className = 'tekstballon';
    this.ballon.hidden = true;

    binnen.append(this.schaduwElement, this.ballon, this.naamElement, this.levensbalk, this.figuurElement);
    this.element.appendChild(binnen);
    laag.appendChild(this.element);
    this.teken();
  }

  // Elke frame: dt = seconden sinds de vorige frame, allen = alle mannetjes
  update(dt, allen) {
    if (this.toestand === 'vechten') this.vechtUpdate(dt, allen);
    else if (this.toestand === 'vertellen') {
      // Stil blijven staan tot het feitje voorbij is (in echte seconden, ook als de laptop hapert)
      if (performance.now() >= this.vertelTot) this.stopMetVertellen();
    } else if (this.toestand === 'actie') {
      // een actie van de gsm (knielen, trommelen, ...): stil tot ze voorbij is
      if (performance.now() >= this.actieTot) this.stopActie();
    } else if (this.toestand === 'wachten') {
      this.wachttijd -= dt;
      if (this.wachttijd <= 0) this.kiesNieuwDoel();
    } else if (this.toestand === 'lopen') this.loopNaarDoel(dt);
  }

  // Een willekeurig doel waar je in een rechte lijn naartoe kan
  kiesNieuwDoel() {
    for (let poging = 0; poging < 10; poging++) {
      const punt = this.wereld.willekeurigPunt();
      if (punt && this.wereld.isVrijPad(this.x, this.y, punt.x, punt.y)) {
        this.doel = punt;
        this.toestand = 'lopen';
        this.element.classList.add('loopt');
        return;
      }
    }
    this.wachttijd = 0.5; // niets gevonden: straks opnieuw proberen
  }

  loopNaarDoel(dt) {
    const dx = this.doel.x - this.x;
    const dy = this.doel.y - this.y;
    const afstand = Math.hypot(dx, dy);
    // Verder weg (kleiner) = trager, zodat het perspectief klopt
    const stap = INSTELLINGEN.snelheid * this.wereld.schaalOp(this.y) * this.snelheidFactor * dt;

    if (stap >= afstand) {
      // Aangekomen
      this.x = this.doel.x;
      this.y = this.doel.y;
      this.doel = null;
      this.toestand = 'wachten';
      this.wachttijd = tussen(INSTELLINGEN.wachtMin, INSTELLINGEN.wachtMax);
      this.element.classList.remove('loopt');
      if (this.bijAankomst) {
        const actie = this.bijAankomst;
        this.bijAankomst = null;
        actie();
      }
    } else {
      this.x += (dx / afstand) * stap;
      this.y += (dy / afstand) * stap;
      if (Math.abs(dx) > 1) this.kijktNaarLinks = dx < 0;
    }
    this.teken();
  }

  // Positie, grootte, z-index (wie lager staat, staat vóór) en kijkrichting
  teken() {
    const schaal = this.wereld.schaalOp(this.y);
    this.element.style.transform = `translate(${this.x}px, ${this.y}px) scale(${schaal})`;
    this.element.style.zIndex = Math.round(this.y);
    this.figuurElement.style.transform = this.kijktNaarLinks ? 'scaleX(-1)' : '';
    this.schaduwFiguur.style.transform = this.figuurElement.style.transform;
    // Naam en levensbalk niet te klein en niet te groot
    const naamSchaal = Math.min(Math.max(schaal, INSTELLINGEN.naamMinimumSchaal), INSTELLINGEN.naamMaximumSchaal) / schaal;
    this.naamElement.style.transform = `scale(${naamSchaal})`;
    this.levensbalk.style.transform = `scale(${naamSchaal})`;
    // De tekstballon is altijd even groot, hoe ver het mannetje ook staat
    this.ballon.style.transform = `scale(${1 / schaal}) translateX(-50%)`;

    // Licht en verte (zie inpassen.js en .figuur in display.css):
    // in een donkere hoek donkerder, ver weg wat fletser
    const licht = lichtOp(this.x, this.y - INSTELLINGEN.figuurHoogte * schaal * 0.5);
    const { horizonY, onderkantY } = INSTELLINGEN;
    const dichtbij = Math.min(1, Math.max(0, (this.y - horizonY) / (onderkantY - horizonY)));
    this.element.style.setProperty('--licht', licht.toFixed(3));
    this.element.style.setProperty('--verte', ((1 - dichtbij) * verteFactor()).toFixed(3));
  }

  // ------------------------- FEITJES -------------------------

  // Kan dit mannetje nu een feitje komen vertellen? (niet tijdens een brawl, niet als het al vertelt)
  isVrij() {
    return (this.toestand === 'wachten' || this.toestand === 'lopen') && !this.bijAankomst;
  }

  // Langs een route (een lijst punten, het laatste = vooraan) naar voren stappen,
  // en daar het feitje vertellen
  vertelFeitje(route, tekst) {
    const [punt, ...rest] = route;
    this.doel = punt;
    this.toestand = 'lopen';
    this.element.classList.add('loopt');
    if (rest.length) {
      this.bijAankomst = () => this.vertelFeitje(rest, tekst); // eerst nog een tussenpunt
      return;
    }
    this.bijAankomst = () => {
      this.toestand = 'vertellen';
      this.vertelTot = performance.now() + INSTELLINGEN.feitjeSeconden * 1000;
      this.ballon.textContent = tekst; // textContent: veilig, nooit HTML
      this.ballon.hidden = false;
      this.element.classList.add('vertelt');
      this.teken();
    };
  }

  // ------------------------- ACTIES (van de gsm) -------------------------

  // Een actie uit "acties" in schilderijen.js: eerst langs de route lopen (kan leeg zijn),
  // dan de animatie, de korte tekst en het effect (opAankomst, zie display.js).
  doeActie(actie, route, opAankomst) {
    if (['vechten', 'dood', 'vertellen'].includes(this.toestand)) return false;
    this.stopActie();
    this.element.classList.remove('loopt');
    if (actie.loop === 'glijden') {
      this.snelheidFactor = 2.4;
      this.element.classList.add('glijdt');
    }
    const begin = () => {
      this.snelheidFactor = 1;
      this.element.classList.remove('glijdt', 'loopt');
      this.toestand = 'actie';
      this.actie = actie;
      this.actieTot = performance.now() + (actie.duur ?? 5) * 1000;
      if (actie.kijkNaar !== undefined && Math.abs(actie.kijkNaar - this.x) > 20) this.kijktNaarLinks = actie.kijkNaar < this.x;
      this.element.classList.add('actie-' + actie.animatie);
      if (actie.tekst) {
        this.ballon.textContent = `${this.naam}: ${actie.tekst}`; // textContent: veilig, nooit HTML
        this.ballon.classList.add('kort');
        this.ballon.hidden = false;
      }
      if (actie.prop === 'vlag') {
        this.prop = document.createElement('div');
        this.prop.className = 'actie-vlag';
        this.figuurElement.appendChild(this.prop);
      }
      this.teken();
      opAankomst?.(this);
    };
    const stap = (rest) => {
      if (!rest.length) return begin();
      const [punt, ...verder] = rest;
      this.doel = punt;
      this.toestand = 'lopen';
      this.element.classList.add('loopt');
      this.bijAankomst = () => stap(verder);
    };
    this.bijAankomst = null;
    this.doel = null;
    stap(route);
    return true;
  }

  stopActie() {
    if (this.actie) {
      this.element.classList.remove('actie-' + this.actie.animatie);
      this.ballon.hidden = true;
      this.ballon.classList.remove('kort');
      this.prop?.remove();
      this.prop = null;
      this.actie = null;
    }
    this.snelheidFactor = 1;
    this.element.classList.remove('glijdt');
    if (this.toestand === 'actie') {
      this.toestand = 'wachten';
      this.wachttijd = tussen(INSTELLINGEN.wachtMin, INSTELLINGEN.wachtMax);
    }
  }

  stopMetVertellen() {
    this.ballon.hidden = true;
    this.element.classList.remove('vertelt');
    if (this.toestand === 'vertellen') {
      this.toestand = 'wachten';
      this.wachttijd = tussen(INSTELLINGEN.wachtMin, INSTELLINGEN.wachtMax);
    }
  }

  // ------------------------- BRAWL -------------------------

  pakZwaard() {
    if (this.toestand === 'dood') return;
    this.bijAankomst = null; // een feitje kan wachten: er moet gevochten worden!
    this.stopMetVertellen();
    this.stopActie();
    this.toestand = 'vechten';
    this.genees();
    this.slaWacht = tussen(0.3, 1);
    this.doel = null;
    this.vastTijd = 0;
    this.omwegTijd = 0;
    this.zwaard = document.createElement('div');
    this.zwaard.className = 'zwaard';
    this.zwaard.innerHTML = ZWAARD_SVG;
    this.figuurElement.appendChild(this.zwaard);
    this.element.classList.add('vechter');
  }

  legZwaardNeer() {
    if (this.toestand !== 'vechten') return;
    this.zwaard.remove();
    this.element.classList.remove('vechter');
    this.genees();
    this.toestand = 'wachten';
    this.wachttijd = 1;
    this.element.classList.remove('loopt', 'winnaar');
  }

  vechtUpdate(dt, allen) {
    const schaal = this.wereld.schaalOp(this.y);
    const stap = INSTELLINGEN.snelheid * 1.8 * schaal * dt; // vechters lopen sneller

    // Vastgelopen? Dan eerst even een omweg
    if (this.omwegTijd > 0) {
      this.omwegTijd -= dt;
      this.element.classList.add('loopt');
      this.kijktNaarLinks = this.omweg.x < this.x;
      this.stapNaar(this.omweg.x, this.omweg.y, stap);
      this.teken();
      return;
    }

    // De dichtstbijzijnde andere vechter
    let tegenstander = null;
    let kortste = Infinity;
    for (const ander of allen) {
      if (ander === this || ander.toestand !== 'vechten' || ander.leven <= 0) continue;
      const afstand = Math.hypot(ander.x - this.x, ander.y - this.y);
      if (afstand < kortste) {
        kortste = afstand;
        tegenstander = ander;
      }
    }
    if (!tegenstander) {
      this.element.classList.remove('loopt');
      return;
    }

    const bereik = 55 * schaal;
    this.kijktNaarLinks = tegenstander.x < this.x;
    if (kortste > bereik) {
      // Ernaartoe lopen
      this.element.classList.add('loopt');
      const vorigeX = this.x;
      const vorigeY = this.y;
      this.stapNaar(tegenstander.x, tegenstander.y, stap);
      if (Math.hypot(this.x - vorigeX, this.y - vorigeY) < stap * 0.3) {
        this.vastTijd += dt;
        if (this.vastTijd > 0.5) this.kiesOmweg();
      } else {
        this.vastTijd = 0;
      }
    } else {
      // Dichtbij genoeg: slaan
      this.element.classList.remove('loopt');
      this.slaWacht -= dt;
      if (this.slaWacht <= 0) {
        this.slaWacht = tussen(0.5, 1);
        this.zwaaiZwaard();
        tegenstander.krijgSchade(tussen(INSTELLINGEN.zwaardSchadeMin, INSTELLINGEN.zwaardSchadeMax), this.x, this.y);
      }
    }
    this.teken();
  }

  kiesOmweg() {
    this.vastTijd = 0;
    for (let poging = 0; poging < 10; poging++) {
      const punt = this.wereld.willekeurigPunt();
      if (punt && this.wereld.isVrijPad(this.x, this.y, punt.x, punt.y)) {
        this.omweg = punt;
        this.omwegTijd = 1.2;
        return;
      }
    }
  }

  // Een stap richting (doelX, doelY), maar nooit uit de loopzone (glijdt langs de rand)
  stapNaar(doelX, doelY, stap) {
    const dx = doelX - this.x;
    const dy = doelY - this.y;
    const afstand = Math.hypot(dx, dy) || 1;
    const nieuwX = this.x + (dx / afstand) * stap;
    const nieuwY = this.y + (dy / afstand) * stap;
    if (this.wereld.isLoopbaar(nieuwX, nieuwY)) {
      this.x = nieuwX;
      this.y = nieuwY;
    } else if (this.wereld.isLoopbaar(nieuwX, this.y)) {
      this.x = nieuwX;
    } else if (this.wereld.isLoopbaar(this.x, nieuwY)) {
      this.y = nieuwY;
    }
  }

  zwaaiZwaard() {
    this.zwaard.classList.remove('slaat');
    void this.zwaard.offsetWidth; // trucje om de CSS-animatie opnieuw te starten
    this.zwaard.classList.add('slaat');
  }

  // ------------------------- SCHADE -------------------------

  // Schade krijgen van een steen of zwaard dat van (vanX, vanY) komt
  krijgSchade(hoeveel, vanX, vanY) {
    this.leven = Math.max(0, this.leven - hoeveel);
    this.tekenLevensbalk();
    this.element.classList.add('au');
    setTimeout(() => this.element.classList.remove('au'), 180);
    // Een klein stapje achteruit (weg van de klap)
    const terugslag = 14 * this.wereld.schaalOp(this.y);
    this.stapNaar(2 * this.x - vanX, 2 * this.y - vanY, terugslag);
    this.teken();
  }

  genees() {
    this.leven = INSTELLINGEN.levenspunten;
    this.tekenLevensbalk();
  }

  tekenLevensbalk() {
    const procent = (this.leven / INSTELLINGEN.levenspunten) * 100;
    this.levensVulling.style.width = procent + '%';
    this.levensbalk.classList.toggle('bijna-dood', procent < 35);
  }

  // Raakt een steen op (x, y) dit mannetje? (een rechthoek rond de figuur)
  raakt(x, y) {
    const schaal = this.wereld.schaalOp(this.y);
    const hoogte = INSTELLINGEN.figuurHoogte * schaal;
    const breedte = hoogte * 0.6;
    return x > this.x - breedte / 2 && x < this.x + breedte / 2 && y > this.y - hoogte && y < this.y + 10;
  }

  // Omvallen, rood worden, en in een rookwolkje verdwijnen (zoals in Minecraft)
  sterf() {
    this.toestand = 'dood';
    this.element.classList.remove('loopt', 'au', 'winnaar');
    this.element.classList.add('dood');
    setTimeout(() => {
      if (!this.element.isConnected) return;
      const schaal = this.wereld.schaalOp(this.y);
      maakWolkje(this.laag, this.x, this.y - (INSTELLINGEN.figuurHoogte * schaal) / 3, schaal, 'rook');
      this.element.remove();
    }, 900);
  }

  // Rustig verdwijnen (als er te veel mannetjes zijn)
  verwijder() {
    this.element.classList.add('pop-out');
    setTimeout(() => this.element.remove(), 400);
  }
}
