/* Disegna la vista corrente, i pannelli aperti e lo stato del salvataggio. */

import { S } from '../state.js';
import { orarioBreve } from '../core/formato.js';
import { categoria } from '../core/calcoli.js';
import { vistaHome } from './viste/home.js';
import { vistaCategoria } from './viste/categoria.js';
import { vistaProfilo } from './viste/profilo.js';
import { sheetConflitto } from './sheet/conflitto.js';
import { sheetCategoria } from './sheet/categoria.js';

const VISTE = { home: vistaHome, categoria: vistaCategoria, profilo: vistaProfilo };

/* testo e tono dello stato del salvataggio (Profilo) */
export function statoSalvataggio() {
  return S.scrivo ? ['ok', 'Salvo…']
    : S.salvato.startsWith('errore') ? ['errore', 'Errore di salvataggio']
    : S.salvato === 'da decidere' ? ['errore', 'Versione da scegliere']
    : S.dirHandle && !S.permessoCartella ? ['errore', 'Accesso scaduto']
    : S.dirHandle ? ['ok', S.salvato === 'mai' ? 'Collegato' : 'Salvato ' + orarioBreve(S.dati.aggiornato)]
    : ['locale', 'Solo su questo telefono'];
}

export function aggiornaStatoSalvataggio() {
  const el = document.getElementById('statoSalva');
  if (!el) return;
  const [stato, testo] = statoSalvataggio();
  el.dataset.stato = stato;
  el.textContent = testo;
}

let ultimaVista = '';

export function render() {
  // la categoria aperta non c'è più (eliminata, annullata, dati caricati dal file): si torna alla Home,
  // togliendo anche la sua voce dalla cronologia (altrimenti il prossimo Indietro non farebbe niente)
  if (S.vista === 'categoria' && !categoria(S.dati, S.categoriaId)) {
    S.vista = 'home'; S.categoriaId = null;
    if (!indietroInAttesa && history.state && history.state.vista === 'categoria') { indietroInAttesa = true; history.back(); }
  }
  const main = document.getElementById('vista');
  // cambiare tab è come cambiare pagina: si riparte dall'alto
  const chiave = S.vista + ':' + (S.categoriaId || '') + (S.vista === 'categoria' ? ':' + S.tab : '');
  const y = main.scrollTop;
  main.innerHTML = (VISTE[S.vista] || vistaHome)();
  // ridisegnare la stessa vista non la riporta in cima
  main.scrollTop = chiave === ultimaVista ? y : 0;
  ultimaVista = chiave;
  aggiornaStatoSalvataggio();
  renderSheets();
}

/* ---------- navigazione: ogni vista e ogni pannello occupano una voce della cronologia,
   così il tasto Indietro di Android torna indietro invece di uscire (vedi il popstate in eventi.js) ---------- */

export function vai(vista, categoriaId = null) {
  S.vista = vista;
  S.categoriaId = categoriaId;
  history.pushState({ vista, categoriaId }, '');
  render();
}

let ultimoSheet = '';

export function renderSheets() {
  // il conflitto passa davanti a tutto: finché non si sceglie, il resto aspetta
  const quale = S.conflitto ? 'conflitto' : S.categoria ? 'categoria' : '';
  const host = document.getElementById('sheets');
  // ridisegnare lo stesso pannello non ne ripete l'animazione di entrata
  host.dataset.fermo = quale && quale === ultimoSheet ? 1 : 0;
  ultimoSheet = quale;
  host.innerHTML = quale === 'conflitto' ? sheetConflitto() : quale === 'categoria' ? sheetCategoria() : '';
}

export function sheetAperto() {
  return !!(S.conflitto || S.categoria);
}

// chiudiSheet ha chiamato history.back() e il popstate non è ancora arrivato
let indietroInAttesa = false;

export function apriSheet() {
  // con un Indietro in attesa la voce la aggiunge finitoIndietro, quando arriva il popstate
  if (!indietroInAttesa && !(history.state && history.state.sheet)) history.pushState({ sheet: 1 }, '');
  renderSheets();
}

/* Dal popstate: true se era l'Indietro di chiudiSheet (non va trattato come un tasto Indietro).
   Se nel frattempo si è aperto un altro pannello (per esempio un conflitto), gli ridà la sua voce. */
export function finitoIndietro() {
  if (!indietroInAttesa) return false;
  indietroInAttesa = false;
  if (sheetAperto()) history.pushState({ sheet: 1 }, '');
  return true;
}

/* chiude i pannelli senza toccare la cronologia (dopo un Indietro) */
export function svuotaSheet() {
  S.conflitto = null;
  S.categoria = null;
  renderSheets();
}

/* passi = 2: chiude il pannello e torna anche indietro di una vista (es. dopo aver eliminato la categoria aperta) */
export function chiudiSheet(passi = 1) {
  svuotaSheet();
  if (!indietroInAttesa && history.state && history.state.sheet) { indietroInAttesa = true; history.go(-passi); }
}
