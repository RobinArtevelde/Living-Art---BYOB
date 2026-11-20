# Wat is er nieuw? (versie van 17 november 2026)

Een overzicht voor het team van alles wat er sinds de vorige versie veranderd is.
Starten gaat nog altijd zo (zie ook `STARTEN.md`):

```bash
npm install
npm run dev
```

Muur: `http://localhost:5173/display.html` · Gsm: `http://localhost:5173/join.html` (ander tabblad, zelfde browser).

## 1. Meerdere schilderijen, die om de 10 minuten wisselen

| Schilderij | Maker, jaar | Map in `public/` | Klaar? |
|---|---|---|---|
| Het Lam Gods | Hubert en Jan van Eyck, 1432 | `open/` en `vol/` | ja |
| De Slag bij Waterloo | Jan Willem Pieneman, 1824 | `waterloo/` | ja (afbeelding is klein, zie hieronder) |
| De Vrijheid leidt het volk | Eugène Delacroix, 1830 | `vrijheid/` | ja |
| De kroning van Napoleon | Jacques-Louis David, 1805–1807 | `kroning/` | ja |
| De Nachtwacht | Rembrandt van Rijn, 1642 | `nachtwacht/` | **nee**: tijdelijke afbeelding |

- Alles over de schilderijen staat in **`src/schilderijen.js`**: titel, maker, jaar, diepte (schaal),
  feitjes en garderobe (welke kleren/voorwerpen de gsm toont).
- Wisseltijd: `wisselMinuten` in `src/instellingen.js`. Schilderijen met `klaar: false` worden overgeslagen.
- De personages gaan mee naar het volgende schilderij.
- De naam van het schilderij staat **niet** op de muur (`toonSchilderijNaam: false` in instellingen.js).
- Elk schilderij heeft een `masker.png` (wit = loopzone). Toets `D` op de muur toont het.

## 2. Feitjes

Om de 25–45 seconden stapt een personage naar voren en vertelt een feitje in een tekstballon.
De feitjes staan per schilderij in `src/schilderijen.js` (kort houden, ±120 tekens). Ze zijn nagekeken.

## 3. De gsm past zich aan het schilderij aan

- Bovenaan: "Nu op de muur" met de titel en een "Wist je dat…".
- Alleen kleren en voorwerpen die bij het schilderij passen (bv. soldatenmuts en sabel bij Waterloo,
  keizersmantel en lauwerkrans bij de Kroning, hoed met veer en kip bij de Nachtwacht).
- Wisselt de muur, dan verandert de gsm vanzelf mee.
- Nieuw in de kleerkast: soldatenmuts, steek, lauwerkrans, hoed met veer, hoge hoed, vrijheidsmuts,
  hoofddoek, soldatenjas, wambuis, gescheurd hemd, keizersmantel, sjerp, sabel, musket, vlag,
  trommel, scepter, zwaaidoek, kip, en de houding "arm in de lucht".

## 4. Gsm-pagina beter op een gsm

- Nooit meer opzij scrollen (getest op 320, 360 en 390 px breed).
- Het voorbeeld blijft bovenaan staan terwijl je scrolt.
- Samenstellen in 5 stappen: Wie · Hoofd · Kleren · In je handen · Kleuren.
- "Gezicht" = de uitdrukking: rustig, blij, lachend, verbaasd, boos, verdrietig.

## 5. Mooiere gezichten

Geschilderde ogen, wenkbrauwen, neus en mond (ook van ver leesbaar), met de uitdrukking erin.
Witte sluiers en mijters zijn gebroken wit, zodat ze minder fel opvallen.

## Nieuwe toetsen op de muur

| Toets | Wat |
|---|---|
| `S` | volgend schilderij (ook die nog niet klaar zijn) |
| `V` | nu een feitje laten vertellen |

## Firebase: één nieuwe regel

`database.rules.json` heeft een nieuwe regel voor `/schilderij` (zo weet de gsm welk schilderij er hangt).
Deploy die mee: `firebase deploy --only database`.

## Online demo (zonder Firebase)

`docs/testpagina.html` toont de muur en de gsm naast elkaar met knoppen i.p.v. toetsen.
Gebruik: `npm run build`, kopieer `docs/testpagina.html` naar `dist/index.html` en zet de map `dist`
online. Muur en gsm praten via de demomodus (zelfde browser).

## Nog te doen

- [ ] **De Nachtwacht**: afbeelding in `public/nachtwacht/schilderij.jpg` (1920 × 1080), masker tekenen, `klaar: true`.
- [ ] **Waterloo**: grotere afbeelding (nu een uitsnede van 1200 px breed, wat wazig op de beamer).
- [ ] Firebase instellen, zodat de QR-code met echte gsm's werkt (zie README).
- [ ] Op de echte beamer de grootte van de figuren per schilderij nakijken (`diepte` in schilderijen.js).
- [ ] Idee: het gsm-voorbeeld laten inzoomen op het hoofd bij het kiezen van het gezicht.
- [ ] Idee: voorgrondlagen voor de nieuwe schilderijen (achter de geschilderde figuren lopen).

---

# Wat is er nieuw? (versie van 18 november 2026)

## 6. Personages passen beter in elk schilderij

- Op de muur krijgt elk personage automatisch de **toon van het schilderij**: warm en donker bij
  Waterloo, rokerig en flets bij de Vrijheid, goudachtig bij de Kroning. Op de gsm zie je je
  personage nog in zijn echte kleuren.
- **Licht per plek**: in een donkere hoek wordt een personage donkerder, in het licht lichter.
- **Verte**: wie ver weg staat, is iets fletser, zoals de geschilderde figuren.
- Een zachtere, echtere **schaduw** op de grond.
- Afstellen per schilderij: `inpassen` in `src/schilderijen.js` (uitleg in `docs/UITBREIDEN.md`).
  De code staat in `src/inpassen.js`.

## 7. Bewegende sfeer voor de andere schilderijen

| Schilderij | Wat beweegt er? |
|---|---|
| De Slag bij Waterloo | kruitdamp die over het veld drijft, geweerschoten in de verte, stof in het zonlicht, nevel over de grond |
| De Vrijheid leidt het volk | **de vlag wappert**, rook rond de Notre-Dame en achter de strijders, vonken van de barricade |
| De kroning van Napoleon | lichtbundels door de kathedraal, stofjes in het licht, flakkerend kaarslicht op het altaar, glinsters op de kroon en het goud |

- Alles staat per schilderij in `effecten` in `src/schilderijen.js`; de code in `src/effecten.js`.
- De wapperende vlag gebruikt dezelfde WebGL-truc als de struiken van het Lam Gods (`src/wind.js`),
  met een masker `public/vrijheid/vlag-masker.png`, gemaakt met `tools/vlag_masker.py`.
- Nieuwe toets **`E`**: effecten aan/uit. Hapert het beeld op de beamer-laptop, druk dan `E`
  (of zet `effectenAan: false` in `src/instellingen.js`).

## 8. De QR-code op papier

- **`affiche.html`**: een A4-affiche met een grote QR-code, om af te drukken en naast de beamer
  te hangen. Open ze op het échte adres (na `firebase deploy`, bv.
  `https://jullie-project.web.app/affiche.html`) en druk af met Ctrl+P / Cmd+P (A4, marges "geen").
  De QR-code wijst automatisch naar `join.html` op dat adres. Open je ze op `localhost`,
  dan krijg je een waarschuwing: zo'n code werkt niet op een gsm.
- De QR-code staat daarom **niet meer op de muur** (`toonQrCode: false` in `src/instellingen.js`;
  zet op `true` om ze terug in de hoek te tonen).

## Hoe hangt alles aan elkaar op de avond zelf?

Het is één website met twee aparte pagina's. Die praten niet rechtstreeks met elkaar, maar
via Firebase:

```
gsm van een bezoeker                FIREBASE (internet)            laptop aan de beamer
https://…/join.html   ── personage ──▶  database  ── nieuw personage ──▶  https://…/display.html
(gescand via de A4)   ◀── welk schilderij hangt er ──  ◀── meldt het schilderij ──
```

- De beamer-laptop opent alleen `display.html` (F = volledig scherm).
- Bezoekers komen via de QR-code alleen op `join.html`. Ze zien de muur nooit op hun gsm.
- Beide moeten internet hebben. Ze hoeven niet op hetzelfde wifi te zitten.

---

# Wat is er nieuw? (versie van 18 november 2026, avond)

## 9. Het Lam Gods: nu het échte paneel

- Vroeger was het een foto van een **wandtapijt** (wazig, vreemde kleuren, en een "lege" wei
  die met de computer was bijgekleurd). Nu is het een scherpe foto van het **echte paneel van
  Van Eyck** (Wikimedia Commons, publiek domein).
- Alle lagen (fontein, altaar, engelen, lam, de groepen waar je achter loopt, zon, duif,
  loopzone, wind) zijn automatisch overgezet met `tools/lamgods_echt.py`.
- De twee versies (`open`/`vol`, `?versie=`) bestaan niet meer: alle geschilderde figuren
  blijven staan en je loopt ertussen. De map is nu `public/lamgods/`.

## 10. De Nachtwacht doet mee

- Echte afbeelding (Wikimedia Commons, publiek domein), het hele doek met wazige randen links en
  rechts (`tools/nachtwacht.py`), een loopzone op de vloer vooraan, en effecten: licht van
  linksboven, stofjes, kruitdamp, glinsters op goud.

## 11. Personages even groot als de geschilderde figuren

- Gemeten per schilderij: de personages zijn nu ongeveer even groot als de geschilderde mensen
  op dezelfde hoogte (`diepte` in `src/schilderijen.js`). Vooral bij Waterloo, de Vrijheid en
  de Kroning waren ze vroeger maar half zo groot.
- Gevolg: op die schilderijen nemen 40 personages veel plaats in. Wordt het te druk, verlaag dan
  `maxMannetjes` in `src/instellingen.js`.

## Bronnen van de afbeeldingen

De originele foto's staan in `tools/bronnen/`:
- `lamgods-echt.jpg`: "Ghent Altarpiece - Adoration of the Mystic Lamb.jpg", Wikimedia Commons, publiek domein
- `nachtwacht.jpg`: "The Night Watch - HD.jpg" (verkleind), Wikimedia Commons, publiek domein

## 12. Bijgestuurd (18 november, laat)

- **Lam Gods**: de mannetjes zijn nu even groot als de geschilderde figuren in de wei
  (de engelen rond het altaar), en dus een stuk kleiner dan vroeger.
- **Kroning**: de mannetjes zijn iets kleiner, zoals de gasten op het schilderij.
- **Waterloo** is uit de reeks gehaald (`inReeks: false` in `src/schilderijen.js`): de muur wisselt
  nu tussen Lam Gods → Vrijheid → Kroning → Nachtwacht. Bekijken kan nog met
  `display.html?schilderij=waterloo`. Terugzetten: haal `inReeks: false` weg.
- **Diepte**: op alle schilderijen worden de mannetjes duidelijker groter als ze naar voren komen
  en kleiner als ze naar achteren lopen (`diepte` in `src/schilderijen.js`).
- **Feitjes**: de verteller loopt naar vooraan in het midden (zo dicht mogelijk bij het publiek),
  blijft daar stil staan zolang de tekstballon er is (`feitjeSeconden` in instellingen.js, in
  echte seconden), en wandelt pas daarna weer verder.

---

# Wat is er nieuw? (19 november 2026): "10x mooier"

## 13. Niet meer door geschilderde figuren lopen
- Bij de **Kroning**, de **Nachtwacht** en de **Vrijheid** zijn de voorste geschilderde figuren
  uitgeknipt (zoals de groepen bij het Lam Gods). Wie erachter staat, verdwijnt er echt achter.
- De loopzone spaart de plek uit waar geschilderde voeten staan.
- Bij de Vrijheid loop je áchter de gesneuvelden (je benen verdwijnen achter de lichamen).
- Gemaakt met `tools/uitknippen.py` (GrabCut + zelf getekende omtrekken voor donkere figuren).
  Een figuur bijsturen: pas daar het kader of de omtrek aan en draai het script opnieuw.

## 14. Meer rustige beweging in de schilderijen
- **Kroning**: de groene gordijnen en de rode baldakijn deinen zachtjes.
- **Nachtwacht**: het grote vaandel links deint, de pluim van de luitenant wappert.
- **Vrijheid**: naast de vlag wappert nu ook de rode sjaal, en de zoom van haar jurk deint.
- Masker per schilderij: `beweeg-masker.png` (rood = wapperen, groen = deinen), gemaakt met
  `tools/beweeg_maskers.py`. Draai daarna `tools/uitknippen.py` opnieuw (bewegende delen worden
  uit de uitgeknipte lagen gehaald, anders ligt er een stilstaand stuk over).

## 15. De sfeer van een oud schilderij
- **Vernis** over alles, ook over de mannetjes: linnenstructuur, craquelé (barstjes in oude verf)
  en donkere randen (`public/vernis.png`, gemaakt met `tools/vernis.py`;
  sterkte: `vernisSterkte` in `src/instellingen.js`).
- **Naamkaartjes** van perkament met een oud lettertype (IM Fell English).
- **Tekstballon** als perkament met een gouden rand en een rode sierletter.
- **Namen**: de voorbeeldpersonages (toets T) heten nu Joos, Margriet, Lieven, Machteld, ...
  (oude Vlaamse namen, nooit twee keer dezelfde tegelijk).

## 16. Feitjes
- De verteller wandelt nu altijd tot vooraan in het midden, ook als er iets in de weg staat
  (dan loopt hij via een tussenpunt om).
- Naamkaartjes kleiner (19 px, en nooit groter dan op ware grootte: `naamMaximumSchaal: 1.0`).
- De tekstballon hangt nu net boven het hoofd van wie spreekt; zolang die spreekt, verdwijnt
  het naamkaartje (anders zat het tussen hoofd en ballon).

---

# Wat is er nieuw? (19 november 2026, avond)

## 17. Een Belgisch schilderij: De volkstelling te Bethlehem (Bruegel, 1566)
- Pieter Bruegel de Oude, Koninklijke Musea voor Schone Kunsten, Brussel (foto: Google Art
  Project via Wikimedia Commons, publiek domein; `tools/bronnen/volkstelling.jpg`).
- Veel open sneeuw en ijs: je loopt over het plein, over de bevroren vijver en over het ijs vooraan.
  De loopzone mijdt vanzelf alle geschilderde mensjes (op de lichte sneeuw zijn dat donkere
  vlekken) en je loopt áchter de karren, de ezel met Maria, de menigte bij de herberg en de mensen
  vooraan rechts (`tools/uitknippen.py`).
- Effecten: het sneeuwt zachtjes (nieuwe effect-soort `sneeuw`), rook uit de schoorstenen, het
  vuurtje bij het grote huis, de rode winterzon, de takken van de grote boom en het uithangbord bewegen.
- Eigen feitjes en garderobe (kappen, hoofddoeken, bontmutsen, mantels, lantaarn, kip).
- De reeks is nu: Lam Gods → Volkstelling → Vrijheid → Kroning → Nachtwacht.

## 18. Onzuiverheden weggewerkt
- **Vrijheid**: de rook van de brand dreef over de jongen met de pistolen (hij leek half
  doorzichtig). De rook blijft nu rond de torens, en de jongen is beter uitgeknipt.
- Effecten (rook, licht) stopten met een harde, rechte rand naast het doek (Vrijheid, Nachtwacht):
  die rand vervaagt nu zacht.
- **Nachtwacht**: de rook hoog in de zaal gaf ronde vlekken op het donkere doek; nu bijna onzichtbaar.
- **Kroning**: de lichtbundels waren te fel.
- **Lam Gods**: minder witte bloesems die door het beeld waaien.
- Vrijheid en Nachtwacht: de mannetjes iets kleiner (ze bedekten te veel van het schilderij).

## 19. Kleine dingen
- Wie stilstaat, ademt heel zachtjes (wiegt een fractie), zoals een levend mens.
- Tekstballon: geen grote sierletter meer die de tekst inspringt; alle regels starten op dezelfde lijn (de eerste letter is nog rood).

## 20. Een eigen kleurenpalet per schilderij
- Op de muur krijgt elke stofkleur (kleed, mantel, broek) de tint die dát schilderij voor die
  kleur gebruikt. Rood blijft rood, maar wordt het rood van Van Eyck, van Bruegel, van David...;
  blauw wordt bij de Vrijheid indigo, groen wordt er olijfgroen, oranje bij de Kroning feller.
- Het werkt automatisch: `schilderijKleur()` in `src/inpassen.js` zoekt in het schilderij de pixels
  met dezelfde kleurtoon en schuift de kleur daarnaartoe, binnen grenzen (de kleur blijft herkenbaar).
  Wit, grijs en zwart nemen de "neutrale" tint over (warm wit, koel grijs). Hoe sterk:
  `PALET_STERKTE` in `src/inpassen.js`.
- Op de gsm zie je nog de gewone kleuren.

---

# Wat is er nieuw? (19 november 2026, laat): "alleen het voorwerp beweegt"

## 21. Niets beweegt meer mee dat niet mag
- **Vlag, sjaal, gordijnen, vaandel, takken, uithangbord** (Vrijheid, Kroning, Nachtwacht,
  Volkstelling): elk bewegend voorwerp is nu precies uitgeknipt (`voorwerpen.png`), en de
  achtergrond eronder is bijgeschilderd (`achtergrond.jpg`). De shader (`src/wind.js`) verschuift
  alléén het voorwerp: de lucht naast de vlag, de muur naast het gordijn, de hand en het hoofd
  van de Vrijheid blijven stil. Gemaakt met `tools/beweeg_lagen.py` (vervangt `beweeg_maskers.py`).
- **Lam Gods**:
  - het lam, de kop, de engelen en de vleugels zijn opnieuw en strakker uitgeknipt uit het échte
    paneel (geen stukken gras meer die meebewegen);
  - het altaar en de kelk bewegen niet meer mee met het lam;
  - de kop zit niet meer dubbel (in het lam én apart), de vleugels ook niet;
  - onder alles wat beweegt is het schilderij bijgeschilderd: geen stilstaande "geestkopie" meer;
  - de wind laat alleen nog het gebladerte ritselen, niet het gras, de lucht of de mensen;
  - de zon gloeit nog, maar wordt niet meer groter (dat schoof over zijn eigen kopie).
  - Alles gemaakt met `tools/lamgods_netjes.py` (de originelen staan in `tools/bronnen/lamgods-origineel/`).
- Gecontroleerd door twee momentopnames te vergelijken zonder mannetjes en zonder rook/licht:
  alleen de bedoelde voorwerpen veranderen.

## 22. Mannetjes bewegen natuurlijker
- Bij het stappen wiegt het bovenlijf mee rond de heup (er komt nooit meer een gat tussen lijf en
  benen) en veert het figuurtje bij elke stap een heel klein beetje op.
- Omdraaien gaat vloeiend, alsof de figuur rond draait, in plaats van in één klap te spiegelen.

---

# Wat is er nieuw? (20 november 2026)

## 23. Meer beweging in de schilderijen
- **Volkstelling**: niet alleen de grote boom, maar alle kale bomen tegen de lucht wiegen nu in de
  wind (vast aan hun stam, de buitenste takjes het meest). Af en toe vliegt er een groepje kraaien
  over het dorp (nieuwe effect-soort `vogels` in `src/effecten.js`).
- **Lam Gods**: de gouden stralen van de duif ademen zachtjes over de wei, gouden stofjes zweven
  rond het lam en het water van de fontein glinstert.
- **Vrijheid**: ook het rode vlaggetje linksboven wappert.
- Zoals altijd beweegt alleen het voorwerp zelf (`tools/beweeg_lagen.py`).

## 24. Slagschaduwen
- Elk mannetje werpt een schaduw op de grond, in de richting van het licht in dát schilderij:
  lang en flauw naar rechts in de winterzon van Bruegel, kort naar voren onder de duif van het
  Lam Gods, naar achter-rechts bij de Kroning, de Nachtwacht en de Vrijheid. De schaduw draait niet
  mee als het mannetje omdraait (het licht blijft van dezelfde kant komen) en stapt mee.
- Instellen per schilderij: `schaduw` in `src/schilderijen.js` (vorm en sterkte).

## 25. Rustigere gezichten
- De voorbeeldpersonages (toets T) kijken rustig of blij, zoals de ernstige gezichten van de oude
  meesters. Op de gsm kan je nog altijd elke uitdrukking kiezen.
- **Volkstelling**: het uithangbord van de herberg was verkeerd uitgeknipt (er wapperde een stuk boomstam en tentdoek scheef mee). Nu beweegt alleen het rode bordje, dat zachtjes aan zijn haak zwaait.

## 26. Doe mee met het verhaal: 3 acties per schilderij op de gsm
Na het versturen krijg je op de gsm drie knoppen die bij het verhaal van het schilderij passen.
Druk erop en jouw mannetje doet het op de muur (het loopt er zelf naartoe, rond obstakels heen):

| Schilderij | Acties |
|---|---|
| Lam Gods | 🙏 Kniel voor het lam · 💧 Drink uit de fontein · 🎵 Zing met de engelen |
| Volkstelling | 📜 Schrijf je in bij de herberg · ⛸️ Glij over het ijs · ❄️ Gooi een sneeuwbal |
| Vrijheid | 🚩 Zwaai met de vlag · 🧱 Klim op de barricade · 🤝 Help een gewonde |
| Kroning | 👑 Buig voor de keizer · 🌹 Strooi rozenblaadjes · 🧵 Draag de sleep mee |
| Nachtwacht | 🥁 Sla op de trommel · 🚶 Marcheer mee · 💥 Vuur een saluutschot |

- Wisselt de muur van schilderij, dan krijgt de gsm vanzelf de nieuwe knoppen.
- Na een actie moet je 6 seconden wachten (`ACTIE_WACHTTIJD` in `src/join.js`).
- Alles staat per schilderij in `acties` in `src/schilderijen.js` (doel, animatie, tekst, effect);
  de animaties staan onder "ACTIES" in `src/display.css`, de effecten in `maakDeeltjes` in `src/display.js`.
- **Firebase**: nieuwe regel voor `/acties` in `database.rules.json`; deploy die mee
  (`firebase deploy --only database`).
- De mannetjes zoeken nu zelf een weg rond obstakels (`routeNaar` in `src/display.js`), ook bij de feitjes.
- **Volkstelling**: de loopzone is nu één geheel. Smalle bruggetjes door open sneeuw en ijs verbinden de bevroren vijver (achter de grote boom door), het dorpsplein en het ijs vooraan (`verbindingen` in `tools/uitknippen.py`; losse snippers vallen weg). Zo kunnen de mannetjes overal komen, ook bij de acties.

## 27. De Vrijheid eruit, De kinderspelen erin (Bruegel, 1560)
- Pieter Bruegel de Oude, Kunsthistorisches Museum Wenen (foto: Google Art Project via Wikimedia
  Commons, publiek domein; `tools/bronnen/kinderspelen.jpg`, gemaakt met `tools/kinderspelen.py`).
- De loopzone is de vrije zandgrond tussen de 230 kinderen, automatisch gezocht en verbonden tot
  één netwerk van paadjes (`tools/kinderspelen_zones.py`). Elk kind is uitgeknipt: je loopt áchter
  de kinderen die vóór je staan (nieuw: `stukken` in groepen.json, zie `maakGroepen` in display.js).
- Effecten: stof boven het plein, vogeltjes. Acties: ⭕ Rol een hoepel · 🐸 Speel haasje-over ·
  🌀 Laat een tol draaien. Eigen feitjes en garderobe.
- De Vrijheid staat nog in het project (`inReeks: false`): `display.html?schilderij=vrijheid`.
- De reeks is nu: Lam Gods → Volkstelling → Kinderspelen → Kroning → Nachtwacht.

## 28. De nuke, opnieuw gemaakt (`src/nuke.js`)
Een echte atoomexplosie van ±16 seconden, getekend met honderden rook- en vuurdeeltjes:
1. de bom valt, met een fluitend spoor en een schaduw die groeit;
2. een verblindende flits, en het hele schilderij wordt oranje verlicht;
3. een schokgolf raast in perspectief over de grond, met even een witte condensatiekoepel;
4. de vuurbal (wit-geel hart, oranje-rode rand) stijgt op en wordt de hoed van de paddenstoel:
   een ring die over zichzelf rolt, van onderen nog gloeiend, met een lichte koepel bovenop;
5. de steel zuigt rook van de grond omhoog; even verschijnt er een condensatiering rond de steel;
6. een stofring rolt over de grond, puin vliegt weg (met vuurspoor), vonken stijgen op;
7. de "camera" schudt, eerst hard, en nog eens als de schokgolf voorbijkomt;
8. de mannetjes worden verkoold en weggeblazen precies wanneer de schokgolf hen bereikt;
9. de krater blijft na-gloeien en smeulen, de lucht wordt donker, en alles dooft rustig uit.

## 29. De kinderspelen: de rivier stroomt
- De rivier linksboven stroomt nu: het water schuift langzaam voorbij met kleine rimpels en
  glinsteringen, maar alleen binnen de oevers. Het zwemmende kind, de kinderen op de kant en de
  jongen in de boom blijven stil. Nieuw in de shader (`src/wind.js`): het BLAUWE kanaal van
  `beweeg-masker.png` = stromend water, met `stroom: [vx, vy]` in schilderijen.js. Het masker maak
  je met `WATER` in `tools/beweeg_lagen.py`.
- Verder bij de kinderspelen: glinsters op het water, stof boven het plein, vogeltjes.

## 30. Echte museumlijsten (`src/lijst.js`)
Het schilderij hangt nu in een lijst op een **witte muur** (zoals de muur op BYOB), zoals in een echte zaal.
De kleur van de muur staat in `muurKleur` in instellingen.js.
- **Elk schilderij krijgt een lijst die bij zijn tijd past** (`lijst:` in schilderijen.js):
  - Lam Gods: `gotisch`, vergulde lijst met parelrand;
  - Volkstelling en Kinderspelen: `ebben`, een donkere Vlaamse lijst met een dun gouden randje;
  - Kroning: `barok`, rijk verguld met eierlijst, parels en rozetten in de hoeken;
  - Nachtwacht: `zwart`, een Hollandse lijst met ribbeltjes.
- De lijst is volledig getekend in canvas (geen afbeeldingen nodig): profielen met licht van boven,
  verstekhoeken, houtnerf/goudruis, de schaduw van de lijst op de muur en op het doek, een koperen
  schilderijlampje met lichtvlek en een **koperen naambordje** (titel, maker, jaar).
- **De Nachtwacht** hangt nu als het echte, bijna vierkante doek: de donkere opvulling links en
  rechts verdwijnt achter de lijst (`uitsnede: [318, 1612]` in schilderijen.js).
- Alles (mannetjes, effecten, nuke, feitjes, klikken) loopt gewoon binnen de lijst; de nuke schudt
  het doek, niet de lijst.
- **Toets L** zet de lijst aan of uit. Standaard aan: `lijstAan` en `toonBordje` in instellingen.js.
  Een nieuwe lijststijl maken? Voeg een stijl toe aan `LIJSTEN` in `src/lijst.js`
  (dikte + banden van buiten naar binnen: `bol`, `hol`, `vlak`, `parels`, `blad`, `ribbel`).

## 31. De Nachtwacht: niet meer door de schutters lopen
- De figuren vooraan zijn opnieuw en precies uitgeknipt, met een met de hand getekende omtrek
  (op dit donkere doek haalt GrabCut de zwarte kleren niet van de donkere achtergrond). Vroeger
  waren het grove blokken met stukken achtergrond erin; daardoor liep je "half door" iemand.
- Nieuw: **de zwarte schutter** die links van de kapitein naar voren stapt. Hij was niet uitgeknipt,
  dus liepen de mannetjes dwars door zijn zwarte kleren.
- Elke figuur heeft nu zijn eigen voetlijn: kapitein, luitenant, zwarte schutter, meisje,
  rode schutter, trommelaar en de gebukte man links. Wie erachter staat, verdwijnt er netjes achter.
- Niemand gaat nog pal vóór de kapitein en de luitenant staan: de vloer links en rechts van hen blijft apart.
- Aanpassen: `'precies'` in `tools/uitknippen.py` (de punten van de omtrek), dan
  `python3 tools/uitknippen.py nachtwacht`.
