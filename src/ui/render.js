/* Disegna la vista corrente, i pannelli aperti e lo stato del salvataggio. */

import { S } from '../state.js';
import { orarioBreve } from '../core/formato.js';
import { vistaHome } from './viste/home.js';
import { vistaProfilo } from './viste/profilo.js';
import { sheetConflitto } from './sheet/conflitto.js';

const VISTE = { home: vistaHome, profilo: vistaProfilo };

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
  const main = document.getElementById('vista');
  const chiave = S.vista + ':' + (S.categoriaId || '');
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
  const quale = S.conflitto ? 'conflitto' : '';
  const host = document.getElementById('sheets');
  // ridisegnare lo stesso pannello non ne ripete l'animazione di entrata
  host.dataset.fermo = quale && quale === ultimoSheet ? 1 : 0;
  ultimoSheet = quale;
  host.innerHTML = quale === 'conflitto' ? sheetConflitto() : '';
}

export function sheetAperto() {
  return !!S.conflitto;
}

export function apriSheet() {
  if (!(history.state && history.state.sheet)) history.pushState({ sheet: 1 }, '');
  renderSheets();
}

/* chiude i pannelli senza toccare la cronologia (dopo un Indietro) */
export function svuotaSheet() {
  S.conflitto = null;
  renderSheets();
}

export function chiudiSheet() {
  svuotaSheet();
  if (history.state && history.state.sheet) history.back();
}
