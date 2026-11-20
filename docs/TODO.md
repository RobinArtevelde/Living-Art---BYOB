# Openstaande punten en ideeën

## Nog te doen vóór het event

### Lanceren (bewaard voor later, als het design klaar is)
Plan: Claude zet het online, ofwel via Remote Control (Claude-desktopapp → Instellingen →
Claude Code → Remote Control → map `byob-schilderij` toevoegen), ofwel rechtstreeks met
Claude Code in de desktopapp in deze map. Vraag dan:
"Zet dit project online met Firebase, zodat display.html op de beamer en join.html op gsm's
werken. Installeer wat nodig is (Node, firebase-tools), maak een Firebase-project met een
Realtime Database in europe-west1, zet de config in src/verbinding.js, en doe npm run build en
firebase deploy. Leg me uit wat ik zelf moet doen. Geef me de link voor de beamer en de link
van affiche.html om af te drukken."
Zelf doen: inloggen bij Google (Firebase), eventueel 1–2 klikken in de Firebase-console.
Opstelling: één muur (display.html op de beamer-laptop), QR-code op A4 (affiche.html).
Meer dan 100 gsm's tegelijk? Dan het Blaze-abonnement nemen (gratis Spark: max. 100 verbindingen).


- [ ] Firebase-project aanmaken en de config invullen in `src/verbinding.js` (zie README, "Firebase instellen").
- [ ] `firebase deploy --only database` (beveiligingsregels).
- [ ] `npm run build` en `firebase deploy --only hosting`; QR-code testen met echte gsm's op 4G/5G.
- [ ] Testen op de echte beamer (resolutie, helderheid, kleuren); eventueel `schaalHorizon`/`schaalOnderaan` bijstellen.
- [ ] Database leegmaken voor de start.

## Verbeteringen aan de personages

- [x] Gezichten zien er van ver wat grof uit → geschilderde ogen, neus en mond.
- [x] Witte sluier/kap valt te sterk op → gebroken wit (`LINNEN` in personage.js).
- [x] Personages passen zich aan elk schilderij aan: kleur, licht per plek, verte (`inpassen` in schilderijen.js).
- [ ] Per schilderij `inpassen` nakijken op de echte beamer (sterkte, licht, verte).
- [ ] Losse gelaatstrekken (ogen, neus, mond) kunnen kiezen — kan pas met een scherpere foto.

## Schilderijen

- [x] De Nachtwacht: echte afbeelding, loopzone, effecten.
- [x] Lam Gods: het echte paneel i.p.v. de foto van het wandtapijt.
- [ ] Waterloo: nog een wat wazige uitsnede (een scherpere foto kan van Wikimedia Commons).
- [ ] Waterloo: een grotere afbeelding gebruiken (nu een uitsnede van 1200 px breed).
- [ ] Per schilderij `diepte` (schaal) nakijken op de echte beamer.
- [ ] Voorgrondlagen voor de nieuwe schilderijen (achter de geschilderde figuren lopen).
- [x] Bewegende sfeer voor Waterloo (kruitdamp, geweerschoten, stof), Vrijheid (wapperende vlag,
      rook, vonken) en Kroning (lichtstralen, stofjes, kaarslicht, glinsters).
- [ ] Bewegende sfeer voor de Nachtwacht (zodra de afbeelding er is).
- [ ] Effecten testen op de beamer-laptop (haperen? → `E` of `effectenAan: false`).

## Volgende stappen (voorstel van Claude)

- [ ] De personages zelf natuurlijker: minder "kegel", meer draaiing, een mantel die meewappert bij het lopen.
- [ ] Per schilderij `maxMannetjes`: bij de Vrijheid en de Nachtwacht is de loopzone klein, 40 is daar druk.
- [ ] Op de echte beamer: helderheid van de donkere doeken (Nachtwacht, Vrijheid) en `vernisSterkte` nakijken.

## Ideeën

- [ ] Meer voorwerpen (palmtak, wierookvat, vaandel).
- [ ] Moderatie: een personage van de muur kunnen halen (bv. klik + toets).
- [ ] Geluid bij brawl en nuke.
