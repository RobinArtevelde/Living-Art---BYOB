// =====================================================================
// TEKENVLAK: zelf een mannetje tekenen met je vinger (op de gsm).
// We onthouden elke lijn als een lijst punten, zodat "ongedaan maken" kan.
// =====================================================================

const PENDIKTE = 14;
// De verstuurde afbeelding is altijd 150 x 250 (verhouding 60:100, zoals de figuren)
const UIT_BREEDTE = 150;
const UIT_HOOGTE = 250;

export class Tekenvlak {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.lijnen = []; // elke lijn: { kleur, punten: [{x, y}, ...] }
    this.huidigeLijn = null;
    this.kleur = '#1d1d1d';

    // Pointer-events werken voor vinger, pen én muis
    canvas.addEventListener('pointerdown', (e) => this.begin(e));
    canvas.addEventListener('pointermove', (e) => this.beweeg(e));
    canvas.addEventListener('pointerup', () => this.stop());
    canvas.addEventListener('pointercancel', () => this.stop());
  }

  // Van schermpositie naar canvas-pixels (het canvas wordt door CSS geschaald)
  positie(e) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * this.canvas.width,
      y: ((e.clientY - r.top) / r.height) * this.canvas.height,
    };
  }

  begin(e) {
    e.preventDefault();
    this.canvas.setPointerCapture(e.pointerId);
    this.huidigeLijn = { kleur: this.kleur, punten: [this.positie(e)] };
    this.lijnen.push(this.huidigeLijn);
    this.teken();
  }

  beweeg(e) {
    if (!this.huidigeLijn) return;
    this.huidigeLijn.punten.push(this.positie(e));
    this.teken();
  }

  stop() {
    this.huidigeLijn = null;
  }

  ongedaan() {
    this.lijnen.pop();
    this.teken();
  }

  wis() {
    this.lijnen = [];
    this.teken();
  }

  isLeeg() {
    return this.lijnen.length === 0;
  }

  tekenLijnen(ctx) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = PENDIKTE;
    for (const lijn of this.lijnen) {
      ctx.strokeStyle = lijn.kleur;
      ctx.beginPath();
      ctx.moveTo(lijn.punten[0].x, lijn.punten[0].y);
      for (const punt of lijn.punten) ctx.lineTo(punt.x, punt.y);
      // één tik = een stip
      if (lijn.punten.length === 1) ctx.lineTo(lijn.punten[0].x + 0.1, lijn.punten[0].y);
      ctx.stroke();
    }
  }

  teken() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.tekenLijnen(this.ctx);
  }

  // Maakt een PNG (data-URL) van de tekening: bijgesneden, gecentreerd,
  // en met het laagste punt van de tekening op de onderkant (= de voeten).
  naarAfbeelding() {
    if (this.isLeeg()) return null;
    const punten = this.lijnen.flatMap((l) => l.punten);
    const half = PENDIKTE / 2;
    const links = Math.min(...punten.map((p) => p.x)) - half;
    const rechts = Math.max(...punten.map((p) => p.x)) + half;
    const boven = Math.min(...punten.map((p) => p.y)) - half;
    const onder = Math.max(...punten.map((p) => p.y)) + half;
    const breedte = rechts - links;
    const hoogte = onder - boven;
    const schaal = Math.min(UIT_BREEDTE / breedte, UIT_HOOGTE / hoogte);
    const dx = (UIT_BREEDTE - breedte * schaal) / 2; // horizontaal centreren
    const dy = UIT_HOOGTE - hoogte * schaal; // onderaan zetten

    const uit = document.createElement('canvas');
    uit.width = UIT_BREEDTE;
    uit.height = UIT_HOOGTE;
    const ctx = uit.getContext('2d');
    ctx.setTransform(schaal, 0, 0, schaal, dx - links * schaal, dy - boven * schaal);
    this.tekenLijnen(ctx);
    return uit.toDataURL('image/png');
  }
}
