# CLAUDE.md — instructies voor Claude (en andere AI-assistenten)

Dit bestand wordt automatisch gelezen door Claude Code wanneer iemand deze map opent.
Lees het volledig voor je iets aanpast. Lees daarna `docs/ARCHITECTUUR.md` en `README.md`.

## Wat is dit project?

**"Stap in het schilderij"**: een interactieve installatie voor het BYOB-event in Gent.

- Een beamer projecteert een schilderij op een muur (`display.html`). Om de 10 minuten wisselt het:
  **Lam Gods, Slag bij Waterloo, De Vrijheid leidt het volk, Kroning van Napoleon, De Nachtwacht**
  (lijst, feitjes en garderobe per schilderij in `src/schilderijen.js`).
- Bezoekers scannen een **QR-code**, typen een naam en stellen op hun gsm een middeleeuws
  personage samen of tekenen er zelf een (`join.html`).
- Hun personage **wandelt daarna rond in het schilderij**, tussen en achter de geschilderde
  figuren, het altaar, het lam, de engelen en de fontein.
- Af en toe stapt een personage naar voren en vertelt een **feitje** over het schilderij (tekstballon).
- De gsm toont welk schilderij er hangt, een "wist je dat", en **kleren/voorwerpen die bij dat schilderij passen**.
- Extra's op de muur: stenen gooien (klik), **brawl** (iedereen vecht, de laatste wint),
  **nuke**, een bewegende achtergrond (zon, wolken, vogels, wind in de struiken, het lam, engelen).

De makers zijn Nederlandstalig (Vlaams). **Antwoord in het Nederlands** en schrijf
**commentaar in de code in het Nederlands**, in dezelfde duidelijke, uitleggende stijl als de
bestaande code (het project moet leesbaar blijven voor beginners).

## Harde afspraken (niet van afwijken zonder het te vragen)

1. **Gewone HTML, CSS en vanilla JavaScript.** Geen React, Vue, TypeScript of Tailwind.
2. **Vite** als bouwtool (drie pagina's: `index.html`, `join.html`, `display.html`).
3. **Firebase Realtime Database** voor de verbinding gsm → muur, **Firebase Hosting** om te publiceren.
   Alleen `src/verbinding.js` praat met Firebase. Zonder Firebase-config draait alles in
   **demomodus** (BroadcastChannel tussen tabbladen in dezelfde browser).
4. Display: altijd **16:9** (een wereld van 1920 × 1080 die geschaald wordt), **maximum 40
   personages** tegelijk (de oudste verdwijnt).
5. Naam: **maximum 16 tekens**, met scheldwoordfilter (`src/naamfilter.js`), gecontroleerd op
   de gsm én op de muur.
6. Alle instelbare getallen staan in **`src/instellingen.js`**. Zet nieuwe "magische getallen" daar.
7. Wijzig `database.rules.json` mee als je de vorm van de verzonden data verandert.

## Snel starten

```bash
npm install        # eenmalig
npm run dev        # start Vite, open dan de getoonde URL
```

- Startpagina met links: `http://localhost:5173/`
- Muur: `http://localhost:5173/display.html` (één schilderij: `?schilderij=nachtwacht`)
- Gsm: `http://localhost:5173/join.html` in een ander tabblad van **dezelfde browser** (demomodus)
- Bouwen: `npm run build` (uitvoer in `dist/`); publiceren: `firebase deploy` (zie README).

Open de HTML-bestanden **niet** rechtstreeks of via Live Server: het project moet via Vite draaien.

## Toetsen op de muur (display.html)

| Toets | Wat |
|---|---|
| `F` | fullscreen |
| `D` | debugmodus (loopzone: groen mag, rood mag niet; voetY-lijnen; info) |
| `T` | willekeurig testpersonage |
| `B` | brawl |
| `N` | nuke |
| `S` | volgend schilderij (ook die nog niet "klaar" zijn) |
| `V` | nu een feitje laten vertellen |
| `E` | bewegende effecten aan/uit (als de beamer-laptop hapert) |
| `L` | museumlijst aan/uit (`src/lijst.js`, stijl per schilderij in schilderijen.js) |
| klik | steen gooien (30 schade, iedereen overleeft 3 stenen) |

## Waar zit wat?

| Bestand | Rol |
|---|---|
| `join.html`, `src/join.js`, `src/join.css` | gsm-pagina: naam, personage samenstellen, tekenen, versturen |
| `display.html`, `src/display.js`, `src/display.css` | muur: game loop, QR, voorgrond, groepen, debug, toetsen |
| `src/personage.js` | het personagesysteem: keuzes, poses, tekenen op canvas met echt materiaal |
| `src/mannetje.js` | één wandelend personage (wachten → doel → lopen; vechten; sterven) |
| `src/wereld.js` | leest het loopmasker; diepte → schaal |
| `src/instellingen.js` | alle afstelbare waarden + versie (`open`/`vol`) + voorgrondlijst |
| `src/verbinding.js` | Firebase + demomodus (enige plek met Firebase-code) |
| `src/acties.js` | brawl en nuke |
| `src/stenen.js` | stenen gooien, rook- en stofwolkjes |
| `src/sfeer.js` | zon, wolken, vogels, windvlagen, blaadjes |
| `src/wind.js` | WebGL-shader: struiken ritselen volgens `wind-masker.png`, of een vlag golft (`soort: 'golf'`) |
| `src/effecten.js` | bewegende sfeer van de andere schilderijen: rook, vonken, stofjes, lichtstralen, gloed, glinsters, flitsen, golf |
| `affiche.html`, `src/affiche.js` | A4-affiche met de QR-code (de QR-code staat standaard níét op de muur: `toonQrCode` in instellingen.js) |
| `src/lijst.js` | de museumlijst, muur, lampje en naambordje rond het schilderij (canvas) |
| `src/inpassen.js` | personages in de kleur, het licht en de verte van het schilderij (alleen op de muur) |
| `tools/vlag_masker.py` | maakt `public/vrijheid/vlag-masker.png` (Python + OpenCV) |
| `src/naamfilter.js` | naamcontrole |
| `src/schilderijen.js` | **de schilderijen**: titel, maker, jaar, diepte, feitjes, garderobe, `klaar` |
| `public/<schilderij>/` | `schilderij.jpg` (1920 × 1080) + `masker.png` per schilderij (Lam Gods: `lamgods/`, met voorgrondlagen en groepen) |
| `docs/testpagina.html` | muur + gsm naast elkaar, voor een online demo (zie `WAT-IS-NIEUW.md`) |
| `src/tekenvlak.js` | zelf tekenen op de gsm |
| `tools/` | Python-scripts (OpenCV) die afbeeldingen en maskers maken; `tools/bronnen/` = de originele foto's (publiek domein). Volgorde per schilderij: `beweeg_lagen.py` (bewegende voorwerpen + bijgeschilderde achtergrond) → `uitknippen.py`; Lam Gods: `lamgods_netjes.py` (figuren om achter te lopen + loopzone). Verder: `lamgods_echt.py`, `nachtwacht.py`, `vlag_masker.py`, `vernis.py` |
| `public/materiaal/` | plooien, stoffen, haar, hoeden en gezichten uit het Lam Gods |
| `database.rules.json` | beveiliging van de database |

## Werkwijze voor Claude

- **Test altijd in de browser** na een wijziging: `npm run dev`, open `display.html` en
  `join.html` in dezelfde browser, stuur een personage en kijk of het op de muur verschijnt.
  Druk `T` een paar keer en probeer `B` (brawl). Kijk in de console naar fouten.
  Zonder echte browser: Playwright/Chromium, met beide pagina's in **één browsercontext**
  (anders werkt het BroadcastChannel van de demomodus niet).
- De gsm-pagina werkt in **stappen** (Wie, Hoofd, Kleren, In je handen, Kleuren: `STAPPEN` in
  `src/join.js`) en het voorbeeld blijft bovenaan staan (sticky). Test ook op een smalle gsm
  (320 px): er mag **nooit horizontaal gescrold** worden.
- Een verstuurd personage ziet er zo uit:
  `{ naam, type: 'samengesteld', onderdelen: { geslacht, gezicht, uitdrukking, haar, kleed, ... }, tijdstip }`
  of `{ naam, type: 'tekening', tekening: 'data:image/png;base64,...', tijdstip }`.
  `onderdelen` bevat **alleen korte strings** (≤ 20 tekens). De muur tekent het personage zelf
  opnieuw met `personage.js`.
- Nieuwe keuze, kleur, pose of voorwerp toevoegen: zie `docs/UITBREIDEN.md`.
- Verander niets aan Firebase-sleutels of `database.rules.json` zonder het te melden.
- Commit pas als de gebruiker het vraagt.

## Geschiedenis en bekende beperkingen

- Deze code is **teruggebouwd uit de gepubliceerde demo** (de oorspronkelijke bronmap ging
  verloren). Alles werkt en is getest, maar:
  - Oudere, ongebruikte personagesystemen (atelier, samensteller, getekende SVG-figuren) zijn
    weggelaten. Alleen `personage.js` en "zelf tekenen" bestaan nog.
  - De **Python-scripts** die de afbeeldingen in `public/` maakten (uitknippen met OpenCV,
    maskers, plooikaarten) zijn er niet meer. De afbeeldingen zelf zijn er wel allemaal.
    Nieuwe afbeeldingen maken = opnieuw scripts schrijven (zie `docs/UITBREIDEN.md`).
- Gezichten komen uit het schilderij en zijn in het origineel maar ±25 px groot. Ogen, neus of
  mond apart wisselen kan pas met een scherpere bronfoto.
- Van ver ogen de gezichten nog wat grof; een witte sluier/kap valt sterk op tegen het schilderij.
- Alleen het Lam Gods heeft voorgrondlagen (achter objecten lopen). Het Lam Gods heeft
  `sfeer.js`; Waterloo, Vrijheid en Kroning hebben `effecten` (schilderijen.js); de Nachtwacht nog niets.
- Effecten en de licht/verte-filters op de personages kosten rekenkracht. Test op de echte
  beamer-laptop; hapert het, druk `E` of zet `effectenAan: false` in instellingen.js.
- De QR-code werkt pas echt als Firebase is ingesteld.
- Zie `docs/TODO.md` voor wat nog moet gebeuren.
