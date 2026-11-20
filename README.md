# Stap in het schilderij – BYOB Gent

Een interactieve installatie: een beamer projecteert het **Lam Gods** op een muur. Bezoekers
scannen een QR-code, typen hun naam en maken op hun gsm een middeleeuws personage (of tekenen
er zelf een). Even later wandelt dat personage rond in het schilderij – tussen de geschilderde
figuren, achter het altaar en de fontein.

Gemaakt met gewone **HTML, CSS en JavaScript**, **Vite**, en **Firebase** (Realtime Database +
Hosting).

> Werk je met Claude? Lees dan ook `CLAUDE.md`. Ben je nieuw? Begin bij `STARTEN.md`.

---

## Snel starten (zonder Firebase)

1. Installeer **Node.js** 20 of nieuwer (https://nodejs.org, de LTS-versie).
2. Open een terminal in deze map en typ:

   ```bash
   npm install
   npm run dev
   ```

3. Open in je browser:
   - `http://localhost:5173/display.html` → de muur
   - `http://localhost:5173/join.html` → de gsm-pagina, **in een ander tabblad van dezelfde browser**

Zonder Firebase werkt alles in **demomodus**: de twee tabbladen praten rechtstreeks met elkaar.
Druk op de muur een paar keer op `T` voor testpersonages.

## De schilderijen

De muur wisselt om de 10 minuten: Lam Gods, Waterloo, Vrijheid, Kroning, Nachtwacht.
Eén schilderij bekijken: `display.html?schilderij=nachtwacht` (id's in `src/schilderijen.js`).

## Toetsen op de beamer-pagina

| Toets | Wat |
|---|---|
| `F` | fullscreen aan/uit |
| `D` | debugmodus: loopzone (groen = mag, rood = niet), voetY-lijnen, muispositie |
| `T` | testpersonage toevoegen |
| `B` | **brawl**: iedereen krijgt een zwaard en een levensbalk, de laatste wint |
| `N` | **nuke** |
| `S` | volgend schilderij |
| `V` | nu een feitje laten vertellen |
| `E` | bewegende effecten (rook, vonken, licht, vlag) aan/uit |
| klik | steen gooien (30 schade; iedereen overleeft minstens 3 stenen) |

## Welke bestanden doen wat?

```
index.html                         startpagina met links
join.html  / src/join.js  / src/join.css         gsm-pagina
display.html / src/display.js / src/display.css  muur: game loop, QR, debug, toetsen
src/instellingen.js   ← ALLE instelbare waarden (horizon, schaal, snelheid, voorgrond, ...)
src/personage.js      het personage: keuzes, poses, tekenen met echt materiaal uit het schilderij
src/mannetje.js       één mannetje: wachten → doel kiezen → lopen → wachten ...; vechten; sterven
src/wereld.js         leest het masker: waar mag je lopen? hoe groot op welke hoogte?
src/tekenvlak.js      zelf een mannetje tekenen op de gsm
src/stenen.js         stenen gooien + rook- en stofwolkjes
src/acties.js         de nuke en de brawl
src/sfeer.js          bewegende achtergrond: zon, duif, wolken, vogels, blaadjes, windvlagen
src/wind.js           struiken die ritselen in de wind, of een vlag die golft (WebGL-shader + masker)
src/effecten.js       bewegende sfeer per schilderij: rook, vonken, stofjes, licht, glinsters, flitsen
affiche.html          A4-affiche met de QR-code om af te drukken (src/affiche.js)
src/inpassen.js       personages krijgen de kleur, het licht en de verte van het schilderij
tools/vlag_masker.py  maakt het masker voor de wapperende vlag (Python + OpenCV)
src/naamfilter.js     naamcontrole + lijst scheldwoorden
src/verbinding.js     de enige plek die met Firebase praat (+ demomodus)
public/<schilderij>/  per schilderij: schilderij.jpg, masker.png, ... (Lam Gods: public/lamgods/, zie hieronder)
tools/                Python-scripts die de afbeeldingen maken (+ tools/bronnen/: de originele foto's)
public/materiaal/     plooien, stoffen, haar, hoeden en gezichten uit het Lam Gods
public/stralen.png    de draaiende zonnestralen
database.rules.json   wie mag wat in de database (beveiliging)
firebase.json         instellingen voor firebase deploy
docs/                 uitleg: architectuur, uitbreiden, takenlijst
```

### Wat zit er in `public/lamgods/`?

Het échte paneel van Van Eyck (foto: Wikimedia Commons, publiek domein). Alle lagen zijn gemaakt
met `tools/lamgods_echt.py`.

| Bestand | Rol |
|---|---|
| `schilderij.jpg` | het schilderij (1920 × 1080) |
| `masker.png` | loopzone: wit = mag lopen, zwart = niet |
| `horizon.png` | lucht + horizon apart, zodat de wolken erachter kunnen |
| `wind-masker.png` | wit = beweegt in de wind |
| `zon.png`, `duif.png` | de zon en de duif (bewegen apart) |
| `voorgrond-*.png` | objecten waar je achter kan lopen (fontein, altaar, lam, engelen, vleugels) |
| `groep-*.png` + `groepen.json` | de geschilderde mensenmassa's, in stroken (zie hieronder) |

## Het personage

Op de gsm kies je:

- **man of vrouw**, gezicht (vier gezichten uit het schilderij, elk ook gespiegeld), leeftijd, huidskleur
- haar, baard, snor (alleen bij mannen), hoofddeksel (tulband, hoed, kap, sluier, hennin,
  kroon, mijter, helm, bontmuts, aureool)
- kleed, mantel (open mantel, bontmantel, cape, bisschopsmantel, wapenrok of geen), riem, broek, schoenen
- iets **in je handen** – de **pose** past zich aan (boek/kelk/rozenkrans/luit → armen voor de
  borst, staf/lans → arm opzij, zwaard, schild, lantaarn). Met lege handen kies je zelf:
  armen naast je of biddend.
- vijf kleuren: huid, haar, kleed, mantel/hoofddeksel, broek

Alles wordt op een canvas getekend: de vormen zijn getekend, maar gevuld met **echt materiaal
uit het Lam Gods** (`public/materiaal/`). De gezichten zijn herkleurd, gespiegeld en per man/vrouw
aangepast, zodat je geen gezicht krijgt dat zo op het schilderij staat.

Via Firebase gaan alleen korte woorden (bv. `hoofddeksel: 'kroon'`); de muur tekent het
personage zelf opnieuw. Iets toevoegen: zie `docs/UITBREIDEN.md`.

## Achter objecten lopen

Elke figuur krijgt `z-index = y van de voeten`. Wie lager op het scherm staat, staat dus vóór.

- **Voorgrondobjecten** (`instellingen.js` → `voorgrond`) krijgen `z-index = voetY`
  (de y van hun onderkant). Een personage met een kleinere y loopt erachter.
- **Groepen geschilderde mensen** zijn in verticale stroken van 16 px geknipt
  (`groepen.json`: per strook `[x, voetY]`). Zo kan je achter de ene persoon en vóór de andere lopen.
- Druk `D` om de voetY-lijnen te zien.

## Diepte en snelheid afstellen

In `src/instellingen.js`:

- `horizonY` / `schaalHorizon`: waar en hoe klein de figuren het kleinst zijn
- `onderkantY` / `schaalOnderaan`: waar en hoe groot ze het grootst zijn
- `snelheid`, `wachtMin`, `wachtMax`, `maxMannetjes`, `figuurHoogte`
- `steenSchade`, `zwaardSchadeMin/Max`, `levenspunten`
- `sfeer`: wolken, vogels, wind, zonnestralen

## Firebase instellen (eenmalig)

1. Ga naar https://console.firebase.google.com en maak een project.
2. **Build → Realtime Database → Create database** (kies `europe-west1`, start in *locked mode*).
3. **Projectinstellingen → Jouw apps → Web-app toevoegen** (`</>`). Kopieer het `firebaseConfig`-object.
4. Plak die waarden in `FIREBASE_CONFIG` bovenaan **`src/verbinding.js`**
   (vergeet `databaseURL` niet; zonder `databaseURL` blijft het in demomodus).
5. Installeer de Firebase-tools en log in:

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add        # kies jullie project
   ```

6. Zet de beveiligingsregels online: `firebase deploy --only database`
7. Bouw en publiceer de site:

   ```bash
   npm run build
   firebase deploy --only hosting
   ```

8. Open `https://<jullie-project>.web.app/display.html` op de beamer-computer. De QR-code wijst
   automatisch naar `join.html` op hetzelfde adres.

### De beveiliging (`database.rules.json`)

- Iedereen mag lezen en **nieuwe** personages toevoegen, maar niets aanpassen of verwijderen.
- Een naam is 1–16 tekens, `type` is `samengesteld` of `tekening`, elk onderdeel is een korte
  string (≤ 20 tekens), een tekening is een PNG van max. ±150 kB. Andere velden worden geweigerd.

### Database leegmaken

In de Firebase-console: Realtime Database → Data → bij `mannetjes` op het vuilbakje klikken.
De muur toont sowieso enkel personages van de laatste 15 minuten (`recenteMinuten`).

## Testen met je gsm vóór het event

- Snelst: publiceer naar Firebase Hosting (stap 7) en scan de QR-code.
- Lokaal: `npm run dev` start met `--host`, dus Vite toont ook een netwerkadres
  (bv. `http://192.168.1.20:5173`). Je gsm moet dan op hetzelfde wifi zitten, en Firebase moet
  ingesteld zijn (de demomodus werkt niet tussen twee toestellen).

## Waarom Vite?

Vite laat ons `import` gebruiken (Firebase, de QR-codebibliotheek, onze eigen modules), ververst
de pagina meteen bij elke wijziging en maakt met `npm run build` een kleine, snelle versie in
`dist/` om online te zetten.

## Checklist voor de avond zelf

- [ ] Firebase ingesteld en getest met minstens twee verschillende gsm's
- [ ] Database leeggemaakt
- [ ] Beamer-computer: `display.html` open, `F` voor fullscreen, laptop op netstroom, slaapstand uit
- [ ] De QR-code is goed leesbaar vanaf waar de mensen staan
- [ ] Wifi/4G in de zaal getest
- [ ] Iemand weet hoe je `B` (brawl) en `N` (nuke) doet 🙂

## Over deze versie

Deze code is teruggebouwd uit de online demo, nadat de oorspronkelijke projectmap verloren ging.
Alles werkt en is getest (beide versies, gsm → muur, brawl, nuke, stenen). Weggelaten: de oudere,
niet meer gebruikte personagesystemen, en de Python-scripts waarmee de afbeeldingen in `public/`
gemaakt werden (de afbeeldingen zelf zijn er wel allemaal).
