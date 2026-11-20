# Hallo! Zo begin je met dit project

Je kreeg deze map van een vriend. Het is een interactieve installatie: bezoekers scannen een
QR-code en hun eigen middeleeuws personage wandelt rond in het Lam Gods op de muur.

## 1. Eenmalig installeren

- **Node.js** (versie 20 of nieuwer): https://nodejs.org → de "LTS"-versie.
- **Claude Code** (daarvoor is deze map voorbereid): https://claude.com/claude-code
- Een editor zoals **VS Code**.

## 2. Het project draaien

Open een terminal **in deze map** en typ:

```bash
npm install
npm run dev
```

Open dan in je browser:
- `http://localhost:5173/display.html` → de muur (druk `T` voor testpersonages, `F` voor fullscreen)
- `http://localhost:5173/join.html` → de gsm-pagina (in een ander tabblad van dezelfde browser)

Zonder Firebase werkt het in **demomodus**: de twee tabbladen praten met elkaar in dezelfde browser.
Voor echte gsm's moet Firebase ingesteld worden (zie `README.md`).

## 3. Met Claude verder werken

Open een terminal in deze map en typ `claude` (of open de map in de Claude-app / VS Code-extensie).
Claude leest automatisch **`CLAUDE.md`** en weet dan hoe het project in elkaar zit.
Je kan gewoon in het Nederlands vragen, bijvoorbeeld:

- "Help me Firebase instellen zodat de QR-code echt werkt."
- "Voeg een palmtak toe als voorwerp dat je kan vasthouden."
- "Maak de witte sluiers minder fel."

## Wat staat waar?

- `README.md` — de volledige handleiding (Firebase, publiceren, checklist voor de avond)
- `CLAUDE.md` — de instructies voor Claude
- `docs/ARCHITECTUUR.md` — hoe alles samenhangt
- `docs/UITBREIDEN.md` — recepten om dingen toe te voegen
- `docs/TODO.md` — wat nog moet gebeuren
- `src/` — de code, `public/` — de afbeeldingen
