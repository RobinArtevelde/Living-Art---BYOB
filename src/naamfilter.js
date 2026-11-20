// =====================================================================
// NAAMCONTROLE: lengte + een (eenvoudige) scheldwoordfilter.
// Wordt gebruikt op de gsm (meteen een foutmelding) én op de muur
// (voor het geval iemand de gsm-pagina omzeilt).
// =====================================================================

export const MAX_NAAM_LENGTE = 16;

// Woorden die nergens in een naam mogen voorkomen (ook niet als deel van een woord).
// Voeg gerust woorden toe, in kleine letters, zonder accenten.
const VERBODEN = [
  'kut', 'klootzak', 'hoer', 'kanker', 'kenker', 'tering', 'tyfus', 'mongool', 'debiel',
  'lul', 'neuk', 'slet', 'trut', 'flikker', 'nikker', 'neger', 'poep', 'stront', 'schijt',
  'sukkel', 'idioot',
  'merde', 'putain', 'salope', 'connard', 'pute', 'encule',
  'fuck', 'shit', 'bitch', 'cunt', 'dick', 'cock', 'pussy', 'whore', 'slut', 'nigga',
  'nigger', 'fag', 'porn', 'sex', 'nazi', 'hitler',
];

// Maakt van een naam een "kale" versie om te vergelijken:
// kleine letters, geen accenten, cijfers die op letters lijken worden letters (k4nk3r → kanker),
// en alles wat geen letter is valt weg (k.u.t → kut).
function vereenvoudig(tekst) {
  return tekst
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // accenten weg
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/[^a-z]/g, '');
}

// Controleert een naam. Geeft { ok: true, naam } of { ok: false, fout } terug.
export function controleerNaam(invoer) {
  const naam = String(invoer ?? '')
    .trim()
    .replace(/\s+/g, ' '); // dubbele spaties weg

  if (naam.length === 0) return { ok: false, fout: 'Vul eerst je naam in.' };
  if (naam.length > MAX_NAAM_LENGTE) {
    return { ok: false, fout: `Je naam mag maximaal ${MAX_NAAM_LENGTE} tekens zijn.` };
  }

  const kaal = vereenvoudig(naam);
  if (VERBODEN.some((woord) => kaal.includes(woord))) {
    return { ok: false, fout: 'Kies een vriendelijkere naam 🙂' };
  }
  return { ok: true, naam };
}
