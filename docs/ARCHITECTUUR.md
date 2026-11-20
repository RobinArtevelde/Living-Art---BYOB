# Architectuur — hoe alles samenhangt

## De twee pagina's en de verbinding

```
 GSM (join.html)                      FIREBASE                       MUUR (display.html)
 ─────────────────                    ────────                       ───────────────────
 naam + personage  ─ stuurMannetje ─▶ /mannetjes/<id> ─ luister ──▶ new Mannetje(...)
 (src/join.js)       (verbinding.js)                    (verbinding.js) (src/display.js)
```

- `src/verbinding.js` is de **enige** plek met Firebase-code. Twee functies:
  `stuurMannetje(gegevens)` (gsm) en `luisterNaarMannetjes(terugroep)` (muur).
- Is `FIREBASE_CONFIG.databaseURL` leeg, dan is `DEMOMODUS` waar en gaat alles via een
  `BroadcastChannel` (alleen tussen tabbladen van dezelfde browser).
- De muur luistert enkel naar personages van de laatste `recenteMinuten` (15) minuten.

## Welk schilderij hangt er?

```
 MUUR  ── meldSchilderij('waterloo') ──▶  /schilderij  ── luisterNaarSchilderij ──▶  GSM
```

- `display.html?schilderij=<id>` kiest het schilderij; `instellingen.js` leest dat en neemt de
  `diepte` en de map over uit `src/schilderijen.js`.
- Om de `wisselMinuten` laadt de muur zichzelf opnieuw met het volgende schilderij (alleen die met
  `klaar: true`). De mannetjes gaan mee via `sessionStorage`.
- In demomodus vraagt de gsm via een BroadcastChannel aan de muur welk schilderij er hangt.
- `database.rules.json` laat op `/schilderij` alleen een kort id toe.
- Feitjes: `display.js` kiest om de `feitjeElke` seconden een vrij mannetje, dat naar een plek vooraan
  wandelt (`Mannetje.vertelFeitje`) en daar een tekstballon toont.

## De data van één personage

```js
// samengesteld
{
  naam: 'Lotte', type: 'samengesteld', tijdstip: 1731234567890,
  onderdelen: {
    geslacht: 'vrouw', gezicht: 'edel-s', uitdrukking: 'blij', leeftijd: 'jong', haar: 'vlechten',
    baard: 'geen', snor: 'geen', hoofddeksel: 'hennin',
    kleed: 'jurk', bovenkleed: 'mantel', riem: 'goud', broek: 'kousen', schoenen: 'puntschoenen',
    voorwerp: 'boek', houding: 'langs',
    huid: '#d4a07e', haarkleur: '#5a3a22', kleedkleur: '#1c3f6e', bovenkleur: '#a3241a', broekkleur: '#2b2622'
  }
}
// zelf getekend
{ naam: 'Jonas', type: 'tekening', tekening: 'data:image/png;base64,...', tijdstip: ... }
```

De toegelaten waarden staan in `KEUZES` en `KLEURKEUZES` in `src/personage.js`.
`controleerPersonage()` vervangt elke onbekende waarde door de eerste optie, dus kapotte of
kwaadaardige data kan niets laten crashen. `database.rules.json` controleert de vorm.

## De muur

- **Wereld**: `#wereld` is altijd 1920 × 1080 en wordt met CSS (`--schaal`) passend gemaakt.
  Alle coördinaten zijn "wereld-pixels".
- **Loopzone**: `masker.png` (wit = mag lopen). `src/wereld.js` leest de pixels en kiest
  willekeurige doelen waar je in een rechte lijn naartoe kan (`isVrijPad`).
- **Perspectief**: `schaalOp(y)` – hoger op het scherm = kleiner en trager.
- **Y-sortering**: `z-index = y` van de voeten. Wie lager staat, staat vóór.
- **Achter objecten lopen**: voorgrondlagen krijgen `z-index = voetY`; groepen geschilderde
  mensen zijn in stroken van 16 px geknipt, elk met zijn eigen voetY (`groepen.json`).
- **Lagen in `#wereld`** (van achter naar voor): sfeer-lucht (stralen, wolken) → horizon →
  zon/duif → vogels → schilderij (WebGL-wind) → `#mannetjes-laag` (mannetjes + voorgrond +
  groepstroken, allemaal gesorteerd met z-index) → windstrepen/blaadjes → QR → debug.
- **Effecten** (`src/effecten.js`): canvassen op halve resolutie, achter (vóór `#mannetjes-laag`)
  of voor (z-index 1900) de mannetjes; licht-effecten op een aparte laag met `mix-blend-mode: screen`.
  Een `golf` vervangt `#schilderij` door een WebGL-canvas (`wind.js`).
- **Inpassen** (`src/inpassen.js`): bij het opstarten wordt het schilderij bekeken. Elk personage
  krijgt de kleurgreep mee in `verflaag()` (personage.js, één keer per personage); per frame zet
  `Mannetje.teken()` de CSS-variabelen `--licht` en `--verte` (zie `.figuur` in display.css).
- **Game loop** (`frame()` in `display.js`): sfeer/effecten bijwerken, elk mannetje bijwerken, doden
  opruimen, brawl controleren, stenen laten vliegen.

## Een mannetje (`src/mannetje.js`)

Toestanden: `wachten` → `lopen` → `wachten` …, tijdens een brawl `vechten`, en `dood`.

```
.mannetje            translate(x, y) scale(schaalOp(y)), z-index = y
  .mannetje-binnen   pop-in / pop-out / omvallen / juichen
    .naam
    .levensbalk      alleen zichtbaar met .vechter
    .figuur          het personage (.samengesteld met .lijf/.been-l/.been-r) of img.tekening
```

Stappen gebeurt in CSS: met de klasse `.loopt` zwaaien `.been-l` en `.been-r`; bij lange kleren
(`.samengesteld.lang`) schrijdt het hele personage.

## Het personage (`src/personage.js`)

| Export | Doet |
|---|---|
| `KEUZES`, `KLEURKEUZES` | alle keuzes die de gsm toont (labels, opties, `alleen`-voorwaarde) |
| `controleerPersonage(p)` | maakt een personage geldig |
| `isPersonage(o)` | heeft het een `geslacht`? |
| `willekeurigPersonage(garderobe)` | random maar logisch personage ("Verras me", toets T), past bij het schilderij |
| `pasAanGarderobe(p, garderobe)` | vervangt kleren die niet bij het schilderij passen |
| `maakPersonage(o)` | tekent; geeft `{ lang, lijf, beenL, beenR }` (data-URL's), met cache |
| `zetPersonageIn(el, o)` | zet de afbeeldingen in een element |

Hoe het tekent:
- Raster van 60 × 100 eenheden, plus 20 eenheden boven het hoofd. Canvas 360 × 720 px (K = 6).
- Vormen zijn SVG-paden. De klasse `Penseel` vult ze met **echt materiaal**: plooikaarten
  (`plooi-*.png`, overlay), stofstructuur (`stof-*.png`), haar (`haar-*.png`), plus schaduw en een
  zachte rand. Kleuren worden toegepast met behoud van licht en schaduw.
- **Volgorde** (achter → voor): achterkant mantel → lang haar/sluier/aureool → armen langs het lijf
  → benen → kleed → riem → voorkant mantel → handen → staf/lans → armen voor de borst → voorwerp →
  handen → hoofd + gezicht → baard/snor → haar + hoofddeksel.
- **Pose**: `HOUDING_VAN` koppelt voorwerp → houding; `armen()` geeft per houding de punten
  schouder–elleboog–hand.
- **Gezicht** (`tekenGezicht`): geschilderde ogen, wenkbrauwen, neus en mond met licht en schaduw.
  De vorm komt uit `GEZICHT_VORMEN` (`gezicht`, `-s` = gespiegeld; de gsm toont deze keuze niet, ze
  is willekeurig). De **uitdrukking** (op de gsm de rij "Gezicht": rustig, blij, lachend, verbaasd,
  boos, verdrietig) komt uit `UITDRUKKINGEN`. Het oude gezicht uit het Lam Gods
  (`gezicht-<man|vrouw>-<naam>.png`) ligt er als lichte verflaag over. Leeftijd voegt rimpels toe.
- Op het einde legt `verflaag()` er een warme vernis en wat weefsel over, zodat het personage bij
  het wandtapijt past.
