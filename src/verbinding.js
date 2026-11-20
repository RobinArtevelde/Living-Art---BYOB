// =====================================================================
// VERBINDING: de ENIGE plek in het project die met Firebase praat.
//
// De gsm stuurt een personage → Firebase Realtime Database → de muur luistert.
// De muur laat weten welk schilderij er hangt → Firebase → de gsm luistert.
//
// Is Firebase nog niet ingesteld (FIREBASE_CONFIG hieronder leeg)?
// Dan draait alles in DEMOMODUS: de gsm en de muur praten via een
// BroadcastChannel met elkaar. Dat werkt alleen tussen tabbladen in
// dezelfde browser op dezelfde computer – handig om te testen.
// =====================================================================

import { initializeApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  push,
  set,
  query,
  orderByChild,
  startAt,
  onChildAdded,
  onValue,
} from 'firebase/database';
import { INSTELLINGEN } from './instellingen.js';

// ---------------------------------------------------------------------
// STAP 1: plak hier de config van jullie Firebase-project.
// (Firebase-console → Projectinstellingen → "Jouw apps" → Web-app → Config)
// Deze waarden zijn niet geheim: ze staan altijd in de website zelf.
// De beveiliging zit in database.rules.json.
// ---------------------------------------------------------------------
const FIREBASE_CONFIG = {
  apiKey: '',
  authDomain: '',
  databaseURL: '', // bv. https://jullie-project-default-rtdb.europe-west1.firebasedatabase.app
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

// Geen databaseURL ingevuld? Dan demomodus.
export const DEMOMODUS = !FIREBASE_CONFIG.databaseURL;

const KANAAL_NAAM = 'byob-schilderij';
const SCHILDERIJ_KANAAL = 'byob-schilderij-huidig'; // apart kanaal: welk schilderij hangt er?
let database = null;

if (!DEMOMODUS) {
  const app = initializeApp(FIREBASE_CONFIG);
  database = getDatabase(app);
}

// ---------------------------------------------------------------------
// GSM: een personage versturen.
// gegevens = { naam, type: 'samengesteld', onderdelen } of { naam, type: 'tekening', tekening }
// ---------------------------------------------------------------------
// Geeft het id van het nieuwe mannetje terug (nodig om het daarna iets te laten doen).
export async function stuurMannetje(gegevens) {
  const bericht = { ...gegevens, tijdstip: Date.now() };

  if (DEMOMODUS) {
    const id = 'demo-' + Date.now();
    const kanaal = new BroadcastChannel(KANAAL_NAAM);
    kanaal.postMessage({ id, ...bericht });
    kanaal.close();
    return id;
  }

  // push() maakt een nieuwe, unieke sleutel onder /mannetjes
  const nieuw = push(ref(database, 'mannetjes'));
  await set(nieuw, bericht);
  return nieuw.key;
}

// ---------------------------------------------------------------------
// GSM: je mannetje iets laten doen (een actie uit "acties" in schilderijen.js).
// ---------------------------------------------------------------------
const ACTIE_KANAAL = 'byob-schilderij-acties';

export async function stuurActie(mannetjeId, actie) {
  const bericht = { mannetje: mannetjeId, actie, tijdstip: Date.now() };
  if (DEMOMODUS) {
    const kanaal = new BroadcastChannel(ACTIE_KANAAL);
    kanaal.postMessage(bericht);
    kanaal.close();
    return;
  }
  await set(push(ref(database, 'acties')), bericht);
}

// MUUR: luisteren naar acties. terugroep({ mannetje, actie }) per nieuwe actie.
export function luisterNaarActies(terugroep) {
  if (DEMOMODUS) {
    const kanaal = new BroadcastChannel(ACTIE_KANAAL);
    kanaal.addEventListener('message', (event) => terugroep(event.data));
    return;
  }
  // Alleen acties van vanaf nu (niet die van vóór een herstart van de muur)
  const nieuw = query(ref(database, 'acties'), orderByChild('tijdstip'), startAt(Date.now() - 5000));
  onChildAdded(nieuw, (momentopname) => terugroep(momentopname.val()));
}

// ---------------------------------------------------------------------
// MUUR: luisteren naar nieuwe personages.
// terugroep(mannetje) wordt opgeroepen voor elk nieuw personage,
// met mannetje = { id, naam, type, onderdelen/tekening, tijdstip }.
// ---------------------------------------------------------------------
export function luisterNaarMannetjes(terugroep) {
  if (DEMOMODUS) {
    const kanaal = new BroadcastChannel(KANAAL_NAAM);
    kanaal.addEventListener('message', (event) => terugroep(event.data));
    return;
  }

  // Alleen personages van de laatste X minuten (zie instellingen.js)
  const vanaf = Date.now() - INSTELLINGEN.recenteMinuten * 60 * 1000;
  const recent = query(ref(database, 'mannetjes'), orderByChild('tijdstip'), startAt(vanaf));
  onChildAdded(recent, (momentopname) => {
    terugroep({ id: momentopname.key, ...momentopname.val() });
  });
}

// ---------------------------------------------------------------------
// MUUR: laten weten welk schilderij er nu hangt (bv. 'nachtwacht').
// De gsm toont dan de juiste kleren, voorwerpen en feitjes.
// ---------------------------------------------------------------------
export function meldSchilderij(id) {
  if (DEMOMODUS) {
    // In demomodus bestaat er geen "geheugen": we antwoorden telkens als een gsm het vraagt.
    const kanaal = new BroadcastChannel(SCHILDERIJ_KANAAL);
    kanaal.postMessage({ schilderij: id });
    kanaal.addEventListener('message', (event) => {
      if (event.data?.vraag) kanaal.postMessage({ schilderij: id });
    });
    return;
  }
  set(ref(database, 'schilderij'), id).catch((fout) => console.error('Kon het schilderij niet melden:', fout));
}

// ---------------------------------------------------------------------
// GSM: luisteren welk schilderij er hangt.
// terugroep(id) wordt opgeroepen bij het begin en bij elke wissel.
// ---------------------------------------------------------------------
export function luisterNaarSchilderij(terugroep) {
  if (DEMOMODUS) {
    const kanaal = new BroadcastChannel(SCHILDERIJ_KANAAL);
    kanaal.addEventListener('message', (event) => {
      if (typeof event.data?.schilderij === 'string') terugroep(event.data.schilderij);
    });
    kanaal.postMessage({ vraag: true }); // "muur, welk schilderij hangt er?"
    return;
  }
  onValue(ref(database, 'schilderij'), (momentopname) => {
    if (typeof momentopname.val() === 'string') terugroep(momentopname.val());
  });
}
