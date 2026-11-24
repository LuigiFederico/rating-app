/* Collegamento degli eventi: clic delegati su vista e pannelli, tasto Indietro, Esc. */

import { S } from '../state.js';
import { scegliCartella, riattivaAccesso, confermaVersione } from '../persistenza.js';
import { render, renderSheets, vai, sheetAperto, svuotaSheet, chiudiSheet } from './render.js';

function clicVista(e) {
  const t = e.target.closest('button, a, [data-vai]');
  if (!t) return;
  if (t.dataset.vai) vai(t.dataset.vai, t.dataset.categoria || null);
  else if (t.dataset.indietro) history.back();
  else if (t.id === 'pickDir') scegliCartella();
  else if (t.id === 'riattiva') riattivaAccesso();
}

function clicSheet(e) {
  const t = e.target;
  if (t.closest('[data-close]')) chiudiSheet();
  else if (t.closest('#confOk')) confermaVersione();
}

function cambioSheet(e) {
  const t = e.target;
  if (t.name === 'versione' && S.conflitto) {
    S.conflitto.scelta = t.value;
    renderSheets();
    // il pannello è stato ridisegnato: il focus torna sulla scelta, per chi usa la tastiera
    document.querySelector('input[name="versione"][value="' + t.value + '"]').focus();
  }
}

export function collegaEventi() {
  history.replaceState({ vista: 'home', categoriaId: null }, '');

  document.getElementById('vista').addEventListener('click', clicVista);
  const sheets = document.getElementById('sheets');
  sheets.addEventListener('click', clicSheet);
  sheets.addEventListener('change', cambioSheet);

  // Indietro (anche quello di Android): prima chiude il pannello aperto, poi torna alla vista precedente
  window.addEventListener('popstate', (e) => {
    if (sheetAperto()) { svuotaSheet(); return; }
    const st = e.state || { vista: 'home', categoriaId: null };
    if (st.sheet || (st.vista === S.vista && st.categoriaId === S.categoriaId)) return;
    S.vista = st.vista;
    S.categoriaId = st.categoriaId;
    render();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sheetAperto()) chiudiSheet();
  });
}
