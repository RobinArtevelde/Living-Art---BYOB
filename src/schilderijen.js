// =====================================================================
// DE SCHILDERIJEN
//
// De muur toont één schilderij tegelijk en wisselt om de zoveel minuten
// (zie wisselMinuten in instellingen.js). Hier staat per schilderij:
//   - titel, maker, jaar          → het naambordje op de muur en de gsm
//   - map                         → de map in public/ met schilderij.jpg, masker.png, ...
//   - inReeks                     → false = dit schilderij komt niet meer aan de beurt
//   - klaar                       → false = er is nog geen echte afbeelding/masker;
//                                   dan slaat de automatische wissel dit schilderij over
//                                   (met de S-toets kan je het toch bekijken)
//   - diepte                      → waar de figuren het kleinst/grootst zijn (zie wereld.js)
//   - feitjes                     → wat de personages komen vertellen (max. ±120 tekens!)
//   - inpassen                    → hoe sterk de personages de kleur, het licht en de verte van
//                                   het schilderij overnemen (0 … 1), zie inpassen.js
//   - schaduw                     → de slagschaduw van de mannetjes: vorm (CSS-transform, vanaf de voeten)
//                                   en sterkte. Kijk naar de geschilderde schaduwen in het schilderij.
//   - effecten                    → bewegende sfeer: rook, vonken, licht, een wapperende vlag, ...
//                                   (zie effecten.js voor alle soorten)
//   - grens                       → optioneel [x, y, breedte, hoogte]: effecten alleen binnen dit kader
//   - acties                      → wat je mannetje kan doen (3 knoppen op de gsm na het versturen):
//                                   id, icoon, label (de knop), doel ([x, y] = daar naartoe lopen,
//                                   'overkant' = naar de andere kant, weg = ter plaatse), kijkNaar (x),
//                                   loop ('glijden'), animatie (zie "ACTIES" in display.css), prop ('vlag'),
//                                   tekst (korte ballon), effect (zie maakDeeltjes in display.js), duur (s)
//   - lijst                       → stijl van de museumlijst: gotisch, barok, ebben of zwart (lijst.js)
//   - garderobe                   → welke keuzes de gsm toont bij dit schilderij
//                                   (sleutels en id's uit KEUZES in personage.js;
//                                   een rij die hier niet staat, toont alle opties)
//
// Een nieuw schilderij toevoegen? Zie docs/UITBREIDEN.md, "Een ander schilderij gebruiken".
// =====================================================================

export const SCHILDERIJEN = [
  {
    id: 'lamgods',
    titel: 'Het Lam Gods',
    maker: 'Hubert en Jan van Eyck',
    jaar: '1432',
    map: 'lamgods/', // het echte paneel van Van Eyck (vroeger een foto van het wandtapijt), zie tools/lamgods_echt.py
    lijst: 'gotisch', // de museumlijst (zie lijst.js)
    klaar: true,
    // Gemeten aan de geschilderde figuren in de wei, waar de mannetjes lopen:
    // de engelen achter het altaar ±120 px (y 420), de knielende engelen vooraan ±185 px rechtop (y 640)
    diepte: { horizonY: 240, onderkantY: 1080, schaalHorizon: 0.4, schaalOnderaan: 2.6 },
    // Het Lam Gods: de personages zijn al in deze stijl gemaakt, dus maar een klein beetje
    inpassen: { sterkte: 0.4, licht: 0.6, verte: 0.25 },
    schaduw: { vorm: 'scaleY(-0.28)', sterkte: 0.4 }, // licht van boven (de duif): korte schaduw naar voren
    // Het Lam Gods heeft daarnaast zijn eigen sfeer (sfeer.js: zon, wolken, vogels, wind in de struiken)
    effecten: [
      // de gouden stralen van de duif vallen zachtjes ademend over de wei
      {
        soort: 'lichtstralen',
        laag: 'voor',
        sterkte: 0.1,
        kleur: 'rgba(255, 236, 170, 1)',
        stralen: [
          [965, 0, 780, 520, 90],
          [965, 0, 1150, 520, 90],
          [965, 0, 965, 470, 70],
        ],
      },
      // gouden stofjes in dat licht, rond het lam
      { soort: 'stofjes', laag: 'voor', gebied: [700, 120, 520, 420], aantal: 35, kleur: 'rgba(255, 230, 150, 0.8)' },
      // het water van de fontein glinstert
      { soort: 'glinsters', punten: [[975, 560], [978, 640], [972, 700], [930, 812], [1020, 808], [985, 790], [955, 830], [1000, 835]], elke: [0.25, 0.9], grootte: 18 },
    ],
    // Wat je mannetje kan doen (knoppen op de gsm, na het versturen). Zie "acties" bovenaan dit bestand.
    acties: [
      { id: 'knielen', icoon: '🙏', label: 'Kniel voor het lam', doel: [955, 540], kijkNaar: 955, animatie: 'knielen', tekst: 'Agnus Dei!', effect: 'sterren', duur: 6 },
      { id: 'drinken', icoon: '💧', label: 'Drink uit de fontein', doel: [965, 975], kijkNaar: 965, animatie: 'buigen', tekst: 'Het water van het leven!', effect: 'druppels', duur: 5 },
      { id: 'zingen', icoon: '🎵', label: 'Zing met de engelen', animatie: 'zingen', tekst: 'Gloria in excelsis!', effect: 'noten', duur: 6 },
    ],
    feitjes: [
      'Hubert van Eyck begon aan dit altaarstuk. Na zijn dood werkte zijn broer Jan het af.',
      'Het werd op 6 mei 1432 onthuld in Gent, in de kerk die nu de Sint-Baafskathedraal is.',
      'Het lam op het altaar staat voor Jezus Christus en zijn offer voor de mensen.',
      'Uit de wonde van het lam stroomt bloed in een kelk. Kijk maar eens goed!',
      'Het paneel "De Rechtvaardige Rechters" werd in 1934 gestolen en is nooit teruggevonden.',
      'In de Tweede Wereldoorlog roofden de nazi\'s het altaarstuk. Het werd teruggevonden in een zoutmijn in Oostenrijk.',
      'Bij de restauratie kwam een heel menselijk gezicht van het lam tevoorschijn. Dat was eeuwen overschilderd.',
      'Rond het lam staan engelen, heiligen, profeten en pausen. Iedereen komt het lam aanbidden.',
    ],
    garderobe: {
      hoofddeksel: ['geen', 'tulband', 'hoed', 'kap', 'sluier', 'hennin', 'kroon', 'mijter', 'helm', 'bontmuts', 'aureool'],
      kleed: ['tuniek', 'lang', 'jurk', 'pij', 'malien', 'harnas'],
      bovenkleed: ['geen', 'mantel', 'houppelande', 'cape', 'koorkap', 'wapenrok'],
      voorwerp: ['geen', 'boek', 'kelk', 'rozenkrans', 'luit', 'staf', 'lans', 'zwaard', 'schild', 'lantaarn'],
      houding: ['langs', 'bidden'],
    },
  },
  {
    id: 'volkstelling',
    titel: 'De volkstelling te Bethlehem',
    maker: 'Pieter Bruegel de Oude',
    jaar: '1566',
    map: 'volkstelling/', // tools/volkstelling.py (bron: tools/bronnen/volkstelling.jpg, publiek domein)
    lijst: 'ebben', // de museumlijst (zie lijst.js)
    klaar: true,
    // Gemeten aan de geschilderde mensjes: ±30 px op het ijs achteraan, ±60–85 px op het plein,
    // ±160 px bij de ezel, ±240 px vooraan rechts
    diepte: { horizonY: 150, onderkantY: 1080, schaalHorizon: 0.15, schaalOnderaan: 1.6 },
    inpassen: { sterkte: 0.5, licht: 0.6, verte: 0.35 },
    schaduw: { vorm: 'scaleY(-0.32) skewX(-58deg)', sterkte: 0.4 }, // lage winterzon linksboven: lange, flauwe schaduw naar rechts
    effecten: [
      // de takken van de grote boom wiegen, het uithangbord wappert (tools/beweeg_maskers.py)
      { soort: 'golf', masker: 'beweeg-masker.png', achtergrond: 'achtergrond.jpg', voorwerpen: 'voorwerpen.png', kracht: 5 },
      // rook uit de schoorstenen
      { soort: 'rook', gebied: [915, -70, 50, 80], aantal: 5, kleur: '#d8d2c4', dekking: 0.3, grootte: [70, 150], snelheid: [3, 9] },
      { soort: 'rook', gebied: [1450, 330, 50, 60], aantal: 5, kleur: '#d8d2c4', dekking: 0.3, grootte: [60, 130], snelheid: [3, 9] },
      // het vuurtje waar de mensen zich warmen bij het grote huis, en de rode winterzon
      { soort: 'gloed', punten: [[1035, 272, 70]], kleur: 'rgba(255, 150, 60, 0.9)', sterkte: 0.45 },
      { soort: 'gloed', punten: [[620, 22, 130]], kleur: 'rgba(255, 170, 120, 0.7)', sterkte: 0.18 },
      { soort: 'vonken', gebied: [1010, 200, 50, 80], aantal: 6 },
      // kraaien boven het dorp
      { soort: 'vogels', gebied: [0, 10, 1920, 140], elke: [6, 13] },
      // het sneeuwt zachtjes
      { soort: 'sneeuw', laag: 'voor', aantal: 150, dekking: 0.75 },
    ],
    acties: [
      { id: 'inschrijven', icoon: '📜', label: 'Schrijf je in bij de herberg', doel: [640, 520], kijkNaar: 300, animatie: 'buigen', tekst: 'Ik kom me inschrijven en betalen!', effect: 'munten', duur: 6 },
      { id: 'schaatsen', icoon: '⛸️', label: 'Glij over het ijs', doel: [1760, 790], loop: 'glijden', animatie: 'zwaaien', tekst: 'Wiiieee!', effect: 'sneeuw', duur: 4 },
      { id: 'sneeuwbal', icoon: '❄️', label: 'Gooi een sneeuwbal', animatie: 'gooien', tekst: 'Pas op!', effect: 'sneeuwbal', duur: 3 },
    ],
    feitjes: [
      'Pieter Bruegel de Oude schilderde dit in 1566. Het hangt in de Koninklijke Musea voor Schone Kunsten in Brussel.',
      'Het is een verhaal uit de Bijbel, maar Bruegel zette het in een Brabants dorp, midden in de winter.',
      'Zie je Maria op de ezel, in een blauwe mantel? Jozef loopt ervoor, met een zaag op zijn schouder.',
      'Bij de herberg met de krans staan mensen aan te schuiven om zich te laten inschrijven en belasting te betalen.',
      'Vooraan links wordt een varken geslacht. Dat deden boeren in de winter, dan bleef het vlees goed.',
      'Op het ijs spelen kinderen: ze schaatsen, ze slepen elkaar mee en ze laten een tol draaien.',
      'Bruegel was een van de eersten die echte winterlandschappen schilderde, met sneeuw en ijs.',
      'Zijn zoon Pieter Brueghel de Jonge maakte later veel kopieën van dit schilderij.',
    ],
    garderobe: {
      hoofddeksel: ['kap', 'hoed', 'hoofddoek', 'bontmuts', 'breedhoed', 'geen'],
      kleed: ['tuniek', 'lang', 'jurk', 'pij', 'wambuis', 'hemd'],
      bovenkleed: ['mantel', 'cape', 'geen'],
      broek: ['kousen', 'pofbroek'],
      schoenen: ['laarzen', 'puntschoenen'],
      voorwerp: ['geen', 'lantaarn', 'staf', 'kip', 'doek', 'boek'],
      houding: ['langs', 'zwaaien', 'bidden'],
    },
  },
  {
    id: 'kinderspelen',
    titel: 'De kinderspelen',
    maker: 'Pieter Bruegel de Oude',
    jaar: '1560',
    map: 'kinderspelen/', // tools/kinderspelen.py + tools/kinderspelen_zones.py (bron: tools/bronnen/, publiek domein)
    lijst: 'ebben', // de museumlijst (zie lijst.js)
    klaar: true,
    // Gemeten aan de geschilderde kinderen: ±110 px achteraan (y 350), ±160 px in het midden, ±240 px vooraan
    diepte: { horizonY: 250, onderkantY: 1080, schaalHorizon: 0.58, schaalOnderaan: 1.45 },
    inpassen: { sterkte: 0.45, licht: 0.5, verte: 0.2 },
    schaduw: { vorm: 'scaleY(0.25) skewX(-30deg)', sterkte: 0.4 }, // de geschilderde kinderen hebben korte schaduwen naar rechtsachter
    effecten: [
      // de rivier linksboven stroomt (blauw kanaal van beweeg-masker.png, zie tools/beweeg_lagen.py)
      { soort: 'golf', masker: 'beweeg-masker.png', kracht: 0, stroom: [-9, 2.5] },
      // het water glinstert in de zon
      { soort: 'glinsters', punten: [[230, 70], [300, 60], [360, 52], [410, 45], [250, 92], [330, 70], [190, 60]], elke: [0.5, 1.4], grootte: 16 },
      // stof dat opwaait boven het zandplein waar de kinderen rennen
      { soort: 'stofjes', gebied: [400, 300, 1500, 750], aantal: 40, kleur: 'rgba(255, 225, 170, 0.7)', helderheid: 0.4 },
      // af en toe een vogeltje over het plein
      { soort: 'vogels', gebied: [100, 10, 1700, 120], elke: [8, 16], kleur: 'rgba(40, 30, 20, 0.8)', grootte: [5, 9] },
    ],
    acties: [
      { id: 'hoepel', icoon: '⭕', label: 'Rol een hoepel', doel: [1270, 1000], animatie: 'springen', tekst: 'Kijk hoe snel!', effect: 'sterren', duur: 5 },
      { id: 'haasje', icoon: '🐸', label: 'Speel haasje-over', animatie: 'springen', tekst: 'Hop, hop, hop!', duur: 5 },
      { id: 'tol', icoon: '🌀', label: 'Laat een tol draaien', animatie: 'buigen', tekst: 'Draaien maar!', effect: 'sterren', duur: 6 },
    ],
    feitjes: [
      'Pieter Bruegel de Oude schilderde dit in 1560. Het hangt in het Kunsthistorisches Museum in Wenen.',
      'Er staan meer dan 230 kinderen op, en ze spelen zo\'n 80 verschillende spelletjes!',
      'Zie je de kinderen met een hoepel? Die rolden ze voort met een stokje.',
      'Haasje-over, blindemannetje, bikkelen en tollen: veel spelletjes ken jij misschien ook nog.',
      'Bikkelen speelde je met kleine botjes van een schaap. Nu gebruiken we plastic.',
      'Rechts staat een jongen op een vat. Ze rollen het over het plein, wie blijft er het langst op?',
      'Er staat geen enkele volwassene op het plein: het is een hele stad vol spelende kinderen.',
      'Sommigen denken dat Bruegel wilde tonen dat grote mensen ook maar spelen, net als kinderen.',
    ],
    garderobe: {
      hoofddeksel: ['kap', 'hoofddoek', 'hoed', 'bontmuts', 'geen', 'sluier'],
      kleed: ['tuniek', 'jurk', 'lang', 'wambuis', 'hemd'],
      bovenkleed: ['geen', 'cape', 'mantel'],
      broek: ['kousen', 'pofbroek'],
      schoenen: ['puntschoenen', 'laarzen', 'blootsvoets'],
      voorwerp: ['geen', 'kip', 'doek', 'trommel', 'staf'],
      houding: ['zwaaien', 'langs', 'bidden'],
    },
  },
  {
    id: 'waterloo',
    titel: 'De Slag bij Waterloo',
    maker: 'Jan Willem Pieneman',
    jaar: '1824',
    map: 'waterloo/',
    inReeks: false, // uit de reeks gehaald: past niet bij de andere schilderijen (bekijken kan nog met ?schilderij=waterloo)
    lijst: 'barok', // de museumlijst (zie lijst.js)
    klaar: true,
    // Een uitsnede van dichtbij: de geschilderde soldaten zijn groot, dus onze figuren ook
    diepte: { horizonY: 690, onderkantY: 1080, schaalHorizon: 3.0, schaalOnderaan: 4.2 },
    inpassen: { sterkte: 0.65, licht: 0.8, verte: 0.2 },
    schaduw: { vorm: 'scaleY(-0.3) skewX(-40deg)', sterkte: 0.4 },
    effecten: [
      // kruitdamp die over het slagveld drijft (achter de figuren)
      { soort: 'rook', gebied: [-200, -100, 2200, 420], aantal: 14, kleur: '#d9ccb0', dekking: 0.2, grootte: [300, 560] },
      // geweerschoten tussen de soldaten in de verte, linksboven
      { soort: 'flitsen', gebied: [380, 50, 280, 110], elke: [3, 8] },
      // stof dat oplicht in de zon boven het gras
      { soort: 'stofjes', gebied: [650, 450, 1250, 450], aantal: 45, kleur: 'rgba(255, 214, 140, 0.8)' },
      // een dunne nevel laag over de grond, vóór de figuren
      { soort: 'rook', laag: 'voor', gebied: [-200, 880, 2300, 260], aantal: 6, kleur: '#cbbd9f', dekking: 0.12, grootte: [400, 700] },
    ],
    acties: [
      { id: 'saluut', icoon: '💥', label: 'Vuur een saluutschot', animatie: 'terugslag', tekst: 'Vuur!', effect: 'schot', duur: 3 },
      { id: 'vlag', icoon: '🚩', label: 'Zwaai met de vlag', animatie: 'zwaaien', prop: 'vlag', tekst: 'Overwinning!', duur: 6 },
      { id: 'trommel', icoon: '🥁', label: 'Sla op de trommel', animatie: 'trommelen', tekst: 'Rom-bom-bom!', effect: 'boem', duur: 5 },
    ],
    feitjes: [
      'Op 18 juni 1815 werd Napoleon bij Waterloo, vlak bij Brussel, definitief verslagen.',
      'Je ziet het moment waarop Wellington hoort dat de Pruisische troepen eraan komen.',
      'Links op de voorgrond ligt de gewonde Nederlandse kroonprins Willem op een brancard.',
      'Dit doek is enorm: 5,67 meter hoog en 8,23 meter breed.',
      'Pieneman liet een apart atelier bouwen, want zijn gewone atelier was te klein voor dit doek.',
      'Wellington liet zijn paard Copenhagen naar Londen brengen, zodat Pieneman het kon naschilderen.',
      'Het schilderij hangt in het Rijksmuseum in Amsterdam.',
    ],
    garderobe: {
      hoofddeksel: ['shako', 'steek', 'geen', 'helm', 'hoed'],
      kleed: ['uniform', 'hemd', 'tuniek'],
      bovenkleed: ['geen', 'sjerp', 'mantel', 'cape'],
      broek: ['kousen', 'pofbroek'],
      schoenen: ['laarzen', 'puntschoenen'],
      voorwerp: ['sabel', 'musket', 'vlag', 'trommel', 'geen'],
      houding: ['langs', 'zwaaien'],
    },
  },
  {
    id: 'vrijheid',
    titel: 'De Vrijheid leidt het volk',
    maker: 'Eugène Delacroix',
    jaar: '1830',
    map: 'vrijheid/',
    inReeks: false, // vervangen door De kinderspelen (bekijken kan nog met ?schilderij=vrijheid)
    lijst: 'barok', // de museumlijst (zie lijst.js)
    klaar: true,
    // Twee loopzones: vooraan, en bovenop de barricade naast de Vrijheid
    diepte: { horizonY: 700, onderkantY: 1080, schaalHorizon: 2.0, schaalOnderaan: 3.4 },
    inpassen: { sterkte: 0.6, licht: 0.9, verte: 0.2 },
    schaduw: { vorm: 'scaleY(0.35) skewX(-45deg)', sterkte: 0.45 }, // licht van linksvoor: schaduw naar achter-rechts
    grens: [278, 0, 1364, 1080], // het doek zelf (links en rechts staat een wazige rand)
    effecten: [
      // de vlag en de sjaal wapperen, de zoom van de jurk deint (tools/beweeg_maskers.py)
      { soort: 'golf', masker: 'beweeg-masker.png', achtergrond: 'achtergrond.jpg', voorwerpen: 'voorwerpen.png', kracht: 7 },
      // rook van de brand rechts, rond de torens van de Notre-Dame (niet over de jongen met de pistolen)
      { soort: 'rook', gebied: [1440, 170, 150, 380], aantal: 8, kleur: '#ece5d3', dekking: 0.22, richting: 1, grootte: [130, 230], snelheid: [2, 6] },
      // kruitdamp links achter de strijders
      { soort: 'rook', gebied: [380, 140, 380, 220], aantal: 6, kleur: '#cfc5ad', dekking: 0.14, grootte: [200, 340], snelheid: [3, 9] },
      // vonken die opstijgen van de barricade
      { soort: 'vonken', gebied: [300, 520, 1330, 520], aantal: 26 },
      // rook laag over de barricade, vóór de figuren
      { soort: 'rook', laag: 'voor', gebied: [200, 860, 1500, 260], aantal: 6, kleur: '#b9ae98', dekking: 0.12, grootte: [400, 650] },
    ],
    acties: [
      { id: 'vlag', icoon: '🚩', label: 'Zwaai met de vlag', animatie: 'zwaaien', prop: 'vlag', tekst: 'Leve de vrijheid!', duur: 7 },
      { id: 'barricade', icoon: '🧱', label: 'Klim op de barricade', doel: [1450, 740], animatie: 'springen', tekst: 'Allen naar de barricade!', effect: 'vonken', duur: 5 },
      { id: 'helpen', icoon: '🤝', label: 'Help een gewonde', doel: [800, 965], kijkNaar: 700, animatie: 'knielen', tekst: 'Hou vol, vriend!', duur: 6 },
    ],
    feitjes: [
      'Dit schilderij gaat over de Julirevolutie van 1830 in Parijs, niet over de Franse Revolutie van 1789.',
      'De vrouw met de vlag is geen echte persoon: ze stelt de Vrijheid voor.',
      'De Vrijheid draagt een rode muts. Dat is een oud teken van vrijheid.',
      'In Frankrijk werd zij later "Marianne", het symbool van het land.',
      'De jongen met de pistolen zou Victor Hugo geïnspireerd hebben voor Gavroche in Les Misérables.',
      'Zie je rechts in de rook de torens van de Notre-Dame?',
      'Het doek is 2,60 meter hoog en 3,25 meter breed en hangt in het Louvre.',
    ],
    garderobe: {
      hoofddeksel: ['vrijheidsmuts', 'hogehoed', 'geen', 'steek', 'shako', 'hoofddoek'],
      kleed: ['hemd', 'uniform', 'wambuis', 'jurk', 'lang'],
      bovenkleed: ['geen', 'sjerp', 'mantel'],
      broek: ['kousen', 'pofbroek'],
      schoenen: ['laarzen', 'blootsvoets', 'puntschoenen'],
      voorwerp: ['vlag', 'musket', 'sabel', 'trommel', 'doek', 'geen'],
      houding: ['zwaaien', 'langs'],
    },
  },
  {
    id: 'kroning',
    titel: 'De kroning van Napoleon',
    maker: 'Jacques-Louis David',
    jaar: '1805–1807',
    map: 'kroning/',
    lijst: 'barok', // de museumlijst (zie lijst.js)
    klaar: true,
    // Je loopt over het groene tapijt vooraan, vóór alle gasten
    diepte: { horizonY: 940, onderkantY: 1080, schaalHorizon: 1.75, schaalOnderaan: 2.7 },
    inpassen: { sterkte: 0.5, licht: 0.6, verte: 0.15 },
    schaduw: { vorm: 'scaleY(0.3) skewX(-50deg)', sterkte: 0.4 }, // licht van linksvoor: schaduw naar achter-rechts op het tapijt
    effecten: [
      // de groene gordijnen en de baldakijn deinen zachtjes (tools/beweeg_maskers.py)
      { soort: 'golf', masker: 'beweeg-masker.png', achtergrond: 'achtergrond.jpg', voorwerpen: 'voorwerpen.png', kracht: 5 },
      // het licht valt van linksboven door de kathedraal naar Napoleon (over de figuren heen)
      {
        soort: 'lichtstralen',
        laag: 'voor',
        sterkte: 0.27,
        kleur: 'rgba(255, 228, 170, 1)',
        stralen: [
          // [van x, van y, naar x, naar y, breedte onderaan]
          [560, -40, 1050, 980, 170],
          [700, -40, 1250, 900, 120],
          [430, -40, 820, 1000, 110],
        ],
      },
      // stofjes die oplichten in de lichtbundels
      { soort: 'stofjes', laag: 'voor', gebied: [420, 60, 900, 900], aantal: 70 },
      // warm, flakkerend kaarslicht op het gouden altaar
      { soort: 'gloed', punten: [[1560, 430, 260], [1475, 560, 150], [1650, 520, 150]], sterkte: 0.3 },
      // glinsteringen op de kroon, het kruis, het altaar en de gouden gewaden
      {
        soort: 'glinsters',
        punten: [[1050, 572], [985, 440], [1530, 360], [1470, 560], [1600, 470], [1660, 380], [1560, 600], [960, 760], [1240, 560]],
      },
    ],
    acties: [
      { id: 'buigen', icoon: '👑', label: 'Buig voor de keizer', doel: [1080, 1000], kijkNaar: 1090, animatie: 'buigen', tekst: 'Vive l\'Empereur!', duur: 5 },
      { id: 'rozen', icoon: '🌹', label: 'Strooi rozenblaadjes', animatie: 'zwaaien', tekst: 'Leve keizerin Joséphine!', effect: 'blaadjes', duur: 6 },
      { id: 'sleep', icoon: '🧵', label: 'Draag de sleep mee', doel: [820, 995], kijkNaar: 700, animatie: 'buigen', tekst: 'Wat is die mantel zwaar!', duur: 6 },
    ],
    feitjes: [
      'Napoleon werd op 2 december 1804 keizer, in de Notre-Dame in Parijs.',
      'Napoleon kroont hier niet zichzelf, maar zijn vrouw Joséphine tot keizerin.',
      'Paus Pius VII zit achter Napoleon en kijkt toe.',
      'Napoleons moeder staat op het schilderij, maar ze was er in het echt niet bij!',
      'Het doek is 6,21 meter hoog en 9,79 meter breed. Het hangt in het Louvre.',
      'David maakte later nog een tweede versie. Die hangt in Versailles.',
      'Door zelf de kroon te nemen, toonde Napoleon dat zijn macht niet van de paus kwam.',
    ],
    garderobe: {
      hoofddeksel: ['lauwerkrans', 'kroon', 'geen', 'steek', 'mijter', 'sluier'],
      kleed: ['lang', 'jurk', 'uniform', 'pij'],
      bovenkleed: ['hermelijn', 'geen', 'houppelande', 'koorkap', 'mantel'],
      voorwerp: ['scepter', 'geen', 'boek', 'kelk', 'rozenkrans', 'zwaard'],
      houding: ['langs', 'bidden'],
    },
  },
  {
    id: 'nachtwacht',
    titel: 'De Nachtwacht',
    maker: 'Rembrandt van Rijn',
    jaar: '1642',
    map: 'nachtwacht/',
    lijst: 'zwart', // de museumlijst (zie lijst.js)
    uitsnede: [318, 1612], // het echte doek loopt van x 318 tot 1612; de donkere randen vallen achter de lijst
    klaar: true,
    // Je loopt over de vloer vooraan; de geschilderde schutters zijn ±440 tot ±575 px groot
    diepte: { horizonY: 930, onderkantY: 1080, schaalHorizon: 2.1, schaalOnderaan: 3.3 },
    inpassen: { sterkte: 0.85, licht: 1, verte: 0.2 }, // een heel donker doek: sterk aanpassen
    schaduw: { vorm: 'scaleY(0.3) skewX(-55deg)', sterkte: 0.55 }, // sterk licht van linksvoor, zoals de schaduw van de kapitein
    grens: [313, 0, 1293, 1080], // het doek zelf (links en rechts staat een wazige rand)
    effecten: [
      // het grote vaandel links deint, de pluim van de luitenant wappert (tools/beweeg_maskers.py)
      { soort: 'golf', masker: 'beweeg-masker.png', achtergrond: 'achtergrond.jpg', voorwerpen: 'voorwerpen.png', kracht: 6 },
      // het licht valt van linksboven op de kapitein, de luitenant en het meisje
      {
        soort: 'lichtstralen',
        laag: 'voor',
        sterkte: 0.16,
        kleur: 'rgba(255, 222, 160, 1)',
        stralen: [
          [430, -40, 900, 1000, 200],
          [560, -40, 1150, 980, 140],
        ],
      },
      // stofjes die oplichten in die bundels
      { soort: 'stofjes', laag: 'voor', gebied: [450, 250, 900, 800], aantal: 55 },
      // kruitdamp van het musket achter de kapitein, en wat damp hoog in de zaal
      { soort: 'rook', gebied: [980, 480, 260, 160], aantal: 5, kleur: '#cdbfa3', dekking: 0.22, grootte: [120, 220], snelheid: [4, 10] },
      { soort: 'rook', gebied: [400, 20, 1100, 330], aantal: 5, kleur: '#7a6c55', dekking: 0.06, grootte: [420, 700], snelheid: [2, 5] },
      // goud dat glinstert: de helm, de lans, de borduursels van de luitenant
      { soort: 'glinsters', punten: [[335, 430], [1115, 620], [1150, 830], [1135, 700], [690, 660], [1580, 470], [850, 420]], elke: [0.8, 2.2], grootte: 22 },
    ],
    acties: [
      { id: 'trommel', icoon: '🥁', label: 'Sla op de trommel', animatie: 'trommelen', tekst: 'Rom-bom-bom!', effect: 'boem', duur: 5 },
      { id: 'marcheren', icoon: '🚶', label: 'Marcheer mee', doel: 'overkant', animatie: 'springen', tekst: 'Voorwaarts, mars!', duur: 3 },
      { id: 'saluut', icoon: '💥', label: 'Vuur een saluutschot', animatie: 'terugslag', tekst: 'Vuur!', effect: 'schot', duur: 3 },
    ],
    feitjes: [
      'De echte naam is "De compagnie van kapitein Frans Banninck Cocq en luitenant Willem van Ruytenburch".',
      'Het is helemaal geen nacht! Oude, donkere vernislagen maakten het schilderij zo donker.',
      'Kapitein Banninck Cocq draagt zwart met een rode sjerp, zijn luitenant een opvallend geel pak.',
      'Zie je het meisje met de kip aan haar riem? Ze is een soort mascotte van de schutters.',
      'In 1715 knipten ze stukken van het doek, zodat het tussen twee deuren paste.',
      'Rembrandt schilderde de schutters in beweging, niet netjes op een rij zoals toen gewoon was.',
      'Het schilderij hangt in het Rijksmuseum in Amsterdam en is 3,63 meter hoog en 4,37 meter breed.',
    ],
    garderobe: {
      hoofddeksel: ['breedhoed', 'helm', 'geen', 'hoed'],
      kleed: ['wambuis', 'harnas', 'jurk', 'tuniek'],
      bovenkleed: ['sjerp', 'geen', 'mantel', 'cape'],
      broek: ['pofbroek', 'kousen'],
      schoenen: ['laarzen', 'puntschoenen'],
      voorwerp: ['musket', 'lans', 'vlag', 'trommel', 'kip', 'sabel', 'geen'],
      houding: ['langs', 'zwaaien'],
    },
  },
];

// Een schilderij opzoeken (onbekend id → het Lam Gods)
export function zoekSchilderij(id) {
  return SCHILDERIJEN.find((s) => s.id === id) ?? SCHILDERIJEN[0];
}

// Het volgende schilderij in de rij. alleenKlaar = sla schilderijen zonder echte afbeelding over.
// Schilderijen met inReeks: false komen nooit aan de beurt.
export function volgendSchilderij(id, alleenKlaar = true) {
  const lijst = SCHILDERIJEN.filter((s) => s.id === id || (s.inReeks !== false && (s.klaar || !alleenKlaar)));
  const index = lijst.findIndex((s) => s.id === id);
  return lijst[(index + 1) % lijst.length];
}
