# Uitbreiden — recepten voor veelgevraagde aanpassingen

Test na elke wijziging: `npm run dev`, open `display.html` en `join.html` in dezelfde browser,
kies je nieuwe optie op de gsm, stuur, kijk op de muur. Druk ook eens `T` (willekeurig).

## Een nieuwe optie in een bestaande rij (bv. een nieuw hoofddeksel)

1. `src/personage.js` → `KEUZES.hoofddeksel.opties`: voeg `['strohoed', 'Strohoed']` toe.
   Het id is max. 20 tekens, enkel letters/cijfers/streepjes.
2. Teken het in `tekenHaarEnHoofddeksel()` (een nieuwe `case 'strohoed':`). Gebruik het penseel:
   - `pen.stof(pad, kleur, { plooi, kader, weefsel })` – stof met echte plooien
   - `pen.goud(pad)`, `pen.metaal(pad)`, `pen.malien(pad)`, `pen.huid(pad, kleur)`, `pen.haar(pad, kleur, soort)`
   - `pad` is een SVG-pad in eenheden: het hoofd is ongeveer x 24–36, y 8–25.
3. Bedekt het het haar? Zet het id dan ook in `BEDEKT_HAAR`.
4. Wil je het in "Verras me"? Voeg het toe aan de lijsten in `willekeurigPersonage()`.

## Een volledig nieuwe rij (bv. "Halsketting")

1. Nieuwe rij in `KEUZES`, met `['geen', 'Geen']` als eerste optie.
   `controleerPersonage()` en de gsm-pagina pakken ze automatisch mee.
2. Teken ze in `teken()` op de juiste plek in de volgorde (van achter naar voor; zie de
   genummerde stappen daar), bv. na `tekenKleed`.
3. Voeg een waarde toe in `willekeurigPersonage()`.

## Een nieuwe kleur

Voeg een hexwaarde toe aan `STOFKLEUREN`, `HAARKLEUREN` of `HUIDSKLEUREN`.
Kies gedempte, "geschilderde" kleuren (diep rood, ultramarijn, olijfgroen, oker, linnen).

## Een nieuw voorwerp / een nieuwe pose

1. Voorwerp toevoegen aan `KEUZES.voorwerp.opties`.
2. In `HOUDING_VAN` kiezen welke armhouding erbij hoort (`langs`, `borst`, `staf`, `zwaard`, `schild`).
3. Een nieuwe houding nodig? Voeg ze toe in `armen()`: per arm drie punten (schouder, elleboog,
   hand). Zet `voor: true` als de armen vóór het lijf komen.
4. Teken het voorwerp in `VOORWERPEN`: een functie `(pen, p, arm)` komt vóór het lijf; een object
   `{ achter(pen, p, arm) }` komt erachter (zoals de staf en de lans). `arm.L[2]` / `arm.R[2]` is
   de positie van de linker-/rechterhand.

## Nieuw materiaal uit het schilderij

Het materiaal staat in `public/materiaal/`. Wil je een nieuwe stof of een nieuw gezicht:
- **Stof/plooien**: een stukje uitknippen uit een scherpe foto van het Lam Gods, grijs maken en
  het contrast oprekken; opslaan als `plooi-<naam>.png` of `stof-<naam>.png`, en de naam toevoegen
  aan de lijst in `laadMateriaal()`.
- **Gezicht**: 48 × 62 px, vrijstaand (transparante achtergrond), als
  `gezicht-man-<naam>.png` én `gezicht-vrouw-<naam>.png`; de gemiddelde helderheid toevoegen in
  `gezichten.json`; en `<naam>` + `<naam>-s` toevoegen aan `KEUZES.gezicht`.
- De oorspronkelijke Python-scripts (OpenCV) bestaan niet meer; Claude kan nieuwe schrijven.

## Een ander schilderij toevoegen

1. Nieuwe map `public/<id>/` met `schilderij.jpg` (1920 × 1080) en `masker.png` (wit = loopzone).
2. In `src/schilderijen.js` een nieuw blok: `id`, `titel`, `maker`, `jaar`, `map: '<id>/'`,
   `klaar: true`, `diepte`, `feitjes` (kort!) en `garderobe` (welke keuzes de gsm toont).
3. Test met `display.html?schilderij=<id>`; `D` toont het masker, `V` laat een feitje vertellen.
4. Nieuwe kleren of voorwerpen voor dat schilderij: zie de recepten hierboven.

## Bewegende effecten bij een schilderij

In `src/schilderijen.js` heeft elk schilderij een lijst `effecten`. Alle soorten en hun opties
staan bovenaan `src/effecten.js`. Coördinaten zijn wereld-pixels (1920 × 1080); `D` op de muur
toont de muispositie, handig om een gebied op te meten.

```js
effecten: [
  { soort: 'rook', gebied: [x, y, breedte, hoogte], aantal: 10, kleur: '#ddd3bd', dekking: 0.25 },
  { soort: 'rook', laag: 'voor', ... },           // vóór de mannetjes in plaats van erachter
  { soort: 'vonken', gebied: [...], aantal: 25 },
  { soort: 'stofjes', gebied: [...], aantal: 40 },
  { soort: 'lichtstralen', stralen: [[vanX, vanY, naarX, naarY, breedte]], sterkte: 0.3 },
  { soort: 'gloed', punten: [[x, y, straal]] },    // flakkerend kaarslicht
  { soort: 'glinsters', punten: [[x, y], ...] },   // sterretjes op goud
  { soort: 'flitsen', gebied: [...], elke: [3, 8] }, // geweerschoten in de verte
  { soort: 'golf', masker: 'vlag-masker.png', kracht: 7 }, // een deel van het doek golft
],
grens: [x, y, breedte, hoogte], // optioneel: niets tekenen buiten het doek
```

Een **golf** heeft een masker nodig in de map van het schilderij: wit = beweegt (hoe witter, hoe
meer), zwart = stil. Kijk naar `tools/vlag_masker.py` als voorbeeld.

## Personages laten passen bij een schilderij

`inpassen` in `src/schilderijen.js`, alles van 0 tot 1:

- `sterkte`: hoeveel de personages de kleur, helderheid en verzadiging van het schilderij overnemen
- `licht`: hoeveel ze donkerder worden in een donkere hoek (en lichter in het licht)
- `verte`: hoeveel fletser ze worden naarmate ze verder weg staan

Het werkt automatisch: `src/inpassen.js` bekijkt het schilderij bij het opstarten. Op de gsm
zie je je personage altijd in zijn echte kleuren.

## Afstellen

Alles in `src/instellingen.js`: diepte (`horizonY`, `schaalHorizon`, `onderkantY`,
`schaalOnderaan`), snelheid, wachttijden, `maxMannetjes`, schade, sfeer.
