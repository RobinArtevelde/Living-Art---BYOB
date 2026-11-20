// =====================================================================
// WIND: struiken en bomen die ritselen.
//
// We vervangen een <img> (het schilderij of de horizon) door een WebGL-canvas.
// Een kleine shader verschuift elke pixel een heel klein beetje met golven,
// maar ALLEEN waar het windmasker wit is (de struiken en bomen).
// Lukt WebGL niet? Dan blijft gewoon de stilstaande afbeelding staan.
//
// Twee soorten beweging:
//   - ritselen (soort 'ritsel'): kleine, snelle golfjes, voor struiken en bomen
//   - golven   (soort 'golf'):   grote, trage golven met licht en schaduw, voor een vlag of doek.
//     Bij 'golf' telt het masker per kleur: ROOD = wapperen (vlag), GROEN = rustig deinen
//     (een gordijn, een vaandel of een cape die zachtjes heen en weer gaat).
// =====================================================================

const HOEKPUNTEN_SHADER = `
attribute vec2 positie;
varying vec2 uv;
void main() {
  uv = vec2((positie.x + 1.0) / 2.0, 1.0 - (positie.y + 1.0) / 2.0);
  gl_Position = vec4(positie, 0.0, 1.0);
}`;

const PIXEL_SHADER = `
precision mediump float;
uniform sampler2D beeld;     // het schilderij (of de horizon-strook)
uniform sampler2D masker;    // het windmasker (hele schilderij)
uniform vec2 maat;           // breedte en hoogte van dit canvas in pixels
uniform float maskerVanaf;   // vanaf welke y dit canvas in het masker begint
uniform float tijd;
uniform float wind;          // windkracht (1 = normaal)
uniform float kracht;        // hoe ver de pixels verschuiven (1 = zoals de struiken)
uniform float golf;          // 0 = ritselen, 1 = grote golven (vlag)
uniform sampler2D voorwerpen; // (optioneel) de bewegende voorwerpen, precies uitgeknipt
uniform float metVoorwerpen;  // 1 = alleen de voorwerpen bewegen, over een vaste achtergrond
uniform vec2 stroom;         // stroomrichting en -snelheid van water (pixels per seconde)
varying vec2 uv;
void main() {
  vec2 px = uv * maat;                                   // positie in pixels
  vec4 m = texture2D(masker, vec2(uv.x, (px.y + maskerVanaf) / 1080.0));
  float hoeveel = m.r;
  float deinen = m.g * golf; // alleen bij 'golf': het groene kanaal = rustig deinen

  // Een paar golven door elkaar: kleine ritselende golfjes + een trage zwaai
  float ritsel = sin(px.y * 0.09 + tijd * 3.3 + px.x * 0.03) * 0.5
               + sin(px.x * 0.06 - tijd * 2.1 + px.y * 0.02) * 0.5;
  float zwaai  = sin(px.x * 0.004 - tijd * 1.1) * 0.5 + 0.5;

  vec2 struik = vec2(ritsel * 1.4 + zwaai * wind * 2.0, ritsel * 0.6);

  // Een vlag: golven die van de stok weg lopen, de doek gaat op en neer
  float fase = px.x * 0.021 - tijd * 3.4 * (0.7 + wind * 0.3) + px.y * 0.008;
  vec2 vlag = vec2(sin(fase * 0.7) * 0.5, sin(fase));

  // Rustig deinen: heen en weer, trager en zachter, lager in de stof wat meer
  float deinFase = px.y * 0.011 - tijd * 1.05 + px.x * 0.0035;
  vec2 dein = vec2(sin(deinFase) + sin(px.y * 0.027 - tijd * 1.6) * 0.3, sin(deinFase * 0.6) * 0.15);

  vec2 verschuiving = mix(struik, vlag, golf) * hoeveel * kracht * (0.6 + wind * 0.6)
                    + dein * deinen * kracht * 0.45;
  // De plooien vangen licht (helderder) of liggen in de schaduw (donkerder)
  float licht = 1.0 + cos(fase) * 0.13 * hoeveel * golf + cos(deinFase) * 0.05 * deinen;

  if (metVoorwerpen > 0.5) {
    // Alleen het voorwerp beweegt: de achtergrond blijft staan (en is onder het voorwerp
    // bijgeschilderd, zodat er geen stilstaande kopie te zien is als het opzij gaat)
    vec4 achter = texture2D(beeld, uv);
    vec4 voorwerp = texture2D(voorwerpen, uv + verschuiving / maat);
    gl_FragColor = vec4(mix(achter.rgb, voorwerp.rgb * licht, voorwerp.a), 1.0);
  } else {
    vec4 kleur = texture2D(beeld, uv + verschuiving / maat);
    kleur.rgb *= licht;
    gl_FragColor = kleur;
  }

  // Stromend water (blauw kanaal van het masker): het water schuift langzaam in de stroomrichting.
  // Twee fasen die elkaar afwisselen (een "flow map"), zodat er nooit een naad of sprong te zien is.
  // We nemen alleen pixels die zelf water zijn, zodat de oever en de zwemmer niet meestromen.
  float water = m.b * golf;
  if (water > 0.01) {
    float fase0 = fract(tijd * 0.18);
    float fase1 = fract(tijd * 0.18 + 0.5);
    float meng = abs(fase0 - 0.5) * 2.0;
    vec2 golfje = vec2(0.0, sin(px.x * 0.12 + tijd * 2.4) * 0.6 + sin(px.x * 0.05 - tijd * 1.3) * 0.5);
    vec2 uvA = uv - (stroom * fase0 * 5.5 - golfje) / maat;
    vec2 uvB = uv - (stroom * fase1 * 5.5 - golfje) / maat;
    float wA = texture2D(masker, vec2(uvA.x, (uvA.y * maat.y + maskerVanaf) / 1080.0)).b;
    float wB = texture2D(masker, vec2(uvB.x, (uvB.y * maat.y + maskerVanaf) / 1080.0)).b;
    vec3 a = mix(gl_FragColor.rgb, texture2D(beeld, uvA).rgb, wA);
    vec3 b = mix(gl_FragColor.rgb, texture2D(beeld, uvB).rgb, wB);
    vec3 stromend = mix(a, b, meng);
    // glinstering: lichte rimpels die meedrijven
    float rimpel = sin((px.x - tijd * stroom.x * 0.9) * 0.25 + sin(px.y * 0.6) * 2.0) * sin(px.y * 0.9 + tijd * 1.7);
    stromend += vec3(0.07, 0.08, 0.08) * smoothstep(0.75, 1.0, rimpel);
    gl_FragColor.rgb = mix(gl_FragColor.rgb, stromend, water);
  }
}`;

function laadAfbeelding(url) {
  const img = new Image();
  img.src = url;
  return img.decode().then(() => img);
}

function maakShader(gl, soort, bron) {
  const shader = gl.createShader(soort);
  gl.shaderSource(shader, bron);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}

function maakTextuur(gl, eenheid, afbeelding) {
  gl.activeTexture(gl.TEXTURE0 + eenheid);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, afbeelding);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

// Vervangt imgElement door een bewegend canvas.
// Geeft { teken(tijd, wind) } terug, of null als het niet lukt.
//   opties.kracht = hoe ver het beweegt (1 = struiken; een vlag: ±7)
//   opties.soort  = 'ritsel' (struiken) of 'golf' (vlag)
//   opties.stroom = [vx, vy] stroomrichting van water (blauw kanaal van het masker), in px/s
//   opties.achtergrond + opties.voorwerpen = (bij 'golf') alleen de uitgeknipte voorwerpen bewegen
//     over een vaste, bijgeschilderde achtergrond (zie tools/beweeg_lagen.py)
export async function maakWindLaag(imgElement, maskerUrl, maskerVanaf = 0, opties = {}) {
  try {
    const metVoorwerpen = Boolean(opties.achtergrond && opties.voorwerpen);
    const [beeld, masker, voorwerpen] = await Promise.all([
      laadAfbeelding(metVoorwerpen ? opties.achtergrond : imgElement.src),
      laadAfbeelding(maskerUrl),
      metVoorwerpen ? laadAfbeelding(opties.voorwerpen) : null,
    ]);
    const canvas = document.createElement('canvas');
    canvas.width = beeld.naturalWidth;
    canvas.height = beeld.naturalHeight;
    canvas.className = imgElement.className;
    canvas.id = imgElement.id;
    const gl = canvas.getContext('webgl', { premultipliedAlpha: false, alpha: true });
    if (!gl) return null;

    const programma = gl.createProgram();
    gl.attachShader(programma, maakShader(gl, gl.VERTEX_SHADER, HOEKPUNTEN_SHADER));
    gl.attachShader(programma, maakShader(gl, gl.FRAGMENT_SHADER, PIXEL_SHADER));
    gl.linkProgram(programma);
    gl.useProgram(programma);

    // Twee driehoeken die het hele canvas bedekken
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const positie = gl.getAttribLocation(programma, 'positie');
    gl.enableVertexAttribArray(positie);
    gl.vertexAttribPointer(positie, 2, gl.FLOAT, false, 0, 0);

    maakTextuur(gl, 0, beeld);
    maakTextuur(gl, 1, masker);
    gl.uniform1i(gl.getUniformLocation(programma, 'beeld'), 0);
    gl.uniform1i(gl.getUniformLocation(programma, 'masker'), 1);
    if (metVoorwerpen) maakTextuur(gl, 2, voorwerpen);
    gl.uniform1i(gl.getUniformLocation(programma, 'voorwerpen'), metVoorwerpen ? 2 : 0);
    gl.uniform1f(gl.getUniformLocation(programma, 'metVoorwerpen'), metVoorwerpen ? 1 : 0);
    gl.uniform2f(gl.getUniformLocation(programma, 'stroom'), ...(opties.stroom ?? [0, 0]));
    gl.uniform2f(gl.getUniformLocation(programma, 'maat'), canvas.width, canvas.height);
    gl.uniform1f(gl.getUniformLocation(programma, 'maskerVanaf'), maskerVanaf);
    gl.uniform1f(gl.getUniformLocation(programma, 'kracht'), opties.kracht ?? 1);
    gl.uniform1f(gl.getUniformLocation(programma, 'golf'), opties.soort === 'golf' ? 1 : 0);
    const tijdPlek = gl.getUniformLocation(programma, 'tijd');
    const windPlek = gl.getUniformLocation(programma, 'wind');
    gl.viewport(0, 0, canvas.width, canvas.height);

    imgElement.replaceWith(canvas);
    return {
      teken(tijd, wind) {
        gl.uniform1f(tijdPlek, tijd);
        gl.uniform1f(windPlek, wind);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      },
    };
  } catch (fout) {
    console.warn('Wind-effect werkt niet (WebGL):', fout);
    return null;
  }
}
