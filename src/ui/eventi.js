/* Collegamento degli eventi: clic delegati su vista e pannelli, tasto Indietro, Esc. */

import { S } from '../state.js';
import { coloreLibero, aggiungiCategoria, erroreNomeCategoria, spostaCategoria } from '../core/dati.js';
import { primoSegno } from '../core/formato.js';
import { cambia } from '../azioni.js';
import { scegliCartella, riattivaAccesso, confermaVersione } from '../persistenza.js';
import { render, renderSheets, vai, apriSheet, sheetAperto, svuotaSheet, chiudiSheet, finitoIndietro } from './render.js';
import { anteprima } from './sheet/categoria.js';
import { collegaRiordino } from './riordina.js';

/* ---------- categorie ---------- */

function apriNuovaCategoria() {
  S.categoria = { nome: '', emoji: '⭐', colore: coloreLibero(S.dati), errore: '' };
  apriSheet();
  document.getElementById('catNome').focus();
}

/* aggiorna l'anteprima della tile senza ridisegnare il pannello (il campo che si sta scrivendo resta attivo) */
function aggiornaAnteprima() {
  const el = document.getElementById('catAnteprima');
  el.innerHTML = anteprima(S.categoria);
  el.style.background = S.categoria.colore;
}

function salvaCategoria() {
  const c = S.categoria;
  c.errore = erroreNomeCategoria(S.dati, c.nome, null);
  if (c.errore) {
    renderSheets();
    document.getElementById('catNome').focus();
    return;
  }
  const valori = { nome: c.nome, emoji: c.emoji, colore: c.colore };
  chiudiSheet();
  cambia('Categoria ' + c.nome.trim() + ' creata.', (d) => { aggiungiCategoria(d, valori); });
}

function sposta(id, posizione) {
  cambia('Ordine delle categorie aggiornato.', (d) => {
    if (d.categorie.findIndex((c) => c.id === id) === posizione) return false;
    spostaCategoria(d, id, posizione);
  });
}

/* ---------- vista e pannelli ---------- */

function clicVista(e) {
  const t = e.target.closest('button, a, [data-vai]');
  if (!t) return;
  if (t.dataset.vai) vai(t.dataset.vai, t.dataset.categoria || null);
  else if (t.dataset.indietro) history.back();
  else if (t.id === 'nuovaCategoria') apriNuovaCategoria();
  else if (t.id === 'pickDir') scegliCartella();
  else if (t.id === 'riattiva') riattivaAccesso();
}

function clicSheet(e) {
  const t = e.target;
  if (t.closest('[data-close]')) chiudiSheet();
  else if (t.closest('#confOk')) confermaVersione();
  else if (t.closest('#catSalva')) salvaCategoria();
  else if (t.closest('[data-emoji]')) {
    scegliEmoji(t.closest('[data-emoji]').dataset.emoji);
    document.getElementById('catEmoji').value = '';
  }
}

/* aggiorna in place (il pulsante premuto resta, e con lui il focus) */
function scegliEmoji(emoji) {
  S.categoria.emoji = emoji;
  document.querySelectorAll('[data-emoji]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.emoji === emoji)));
  aggiornaAnteprima();
}

function inputSheet(e) {
  const t = e.target, c = S.categoria;
  if (!c) return;
  if (t.id === 'catNome') {
    c.nome = t.value;
    // l'errore sparisce appena si corregge il nome
    if (c.errore) { c.errore = ''; t.removeAttribute('aria-invalid'); t.removeAttribute('aria-describedby'); document.getElementById('catErrore').remove(); }
    aggiornaAnteprima();
  } else if (t.id === 'catEmoji') {
    scegliEmoji(primoSegno(t.value) || '⭐');
  }
}

function cambioSheet(e) {
  const t = e.target;
  if (t.name === 'versione' && S.conflitto) {
    S.conflitto.scelta = t.value;
    renderSheets();
    // il pannello è stato ridisegnato: il focus torna sulla scelta, per chi usa la tastiera
    document.querySelector('input[name="versione"][value="' + t.value + '"]').focus();
  } else if (t.name === 'catColore' && S.categoria) {
    S.categoria.colore = t.value;
    aggiornaAnteprima();
  }
}

export function collegaEventi() {
  history.replaceState({ vista: 'home', categoriaId: null }, '');

  const vista = document.getElementById('vista');
  vista.addEventListener('click', clicVista);
  collegaRiordino(vista, sposta);

  const sheets = document.getElementById('sheets');
  sheets.addEventListener('click', clicSheet);
  sheets.addEventListener('input', inputSheet);
  sheets.addEventListener('change', cambioSheet);
  // Invio nel nome della categoria = Crea
  sheets.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing && e.target.id === 'catNome') { e.preventDefault(); salvaCategoria(); }
  });

  // Indietro (anche quello di Android): prima chiude il pannello aperto, poi torna alla vista precedente
  window.addEventListener('popstate', (e) => {
    if (finitoIndietro()) return;
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
