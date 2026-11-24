/* Collegamento degli eventi: clic delegati su vista e pannelli, tasto Indietro, Esc. */

import { S } from '../state.js';
import { coloreLibero, aggiungiCategoria, modificaCategoria, eliminaCategoria, erroreNomeCategoria, spostaCategoria } from '../core/dati.js';
import { categoria } from '../core/calcoli.js';
import { primoSegno } from '../core/formato.js';
import { cambia } from '../azioni.js';
import { scegliCartella, riattivaAccesso, confermaVersione } from '../persistenza.js';
import { render, renderSheets, vai, apriSheet, sheetAperto, svuotaSheet, chiudiSheet, finitoIndietro } from './render.js';
import { anteprima } from './sheet/categoria.js';
import { toast } from './toast.js';
import { collegaRiordino } from './riordina.js';

/* ---------- categorie ---------- */

function apriNuovaCategoria() {
  S.categoria = { id: null, nome: '', emoji: '⭐', colore: coloreLibero(S.dati), errore: '', eliminando: false };
  apriSheet();
  document.getElementById('catNome').focus();
}

function apriModificaCategoria() {
  const c = categoria(S.dati, S.categoriaId);
  S.categoria = { id: c.id, nome: c.nome, emoji: c.emoji, colore: c.colore, errore: '', eliminando: false };
  apriSheet();
  document.getElementById('catNome').focus();
}

/* la categoria in modifica può sparire mentre il pannello è aperto (dati caricati dal file, Annulla) */
function categoriaSparita() {
  if (!S.categoria.id || categoria(S.dati, S.categoria.id)) return false;
  chiudiSheet();
  toast('Questa categoria non c\'è più: i dati sono cambiati nel frattempo.');
  return true;
}

/* elimina la categoria aperta e torna alla Home (il pannello e la vista lasciano la cronologia insieme) */
function eliminaCategoriaAperta() {
  if (categoriaSparita()) return;
  const { id } = S.categoria, nome = categoria(S.dati, id).nome;
  chiudiSheet(2);
  cambia('Categoria ' + nome + ' eliminata.', (d) => { eliminaCategoria(d, id); });
}

/* aggiorna l'anteprima della tile senza ridisegnare il pannello (il campo che si sta scrivendo resta attivo) */
function aggiornaAnteprima() {
  const el = document.getElementById('catAnteprima');
  el.innerHTML = anteprima(S.categoria);
  el.style.background = S.categoria.colore;
}

function salvaCategoria() {
  const c = S.categoria;
  if (c.eliminando || categoriaSparita()) return;
  c.errore = erroreNomeCategoria(S.dati, c.nome, c.id);
  if (c.errore) {
    renderSheets();
    document.getElementById('catNome').focus();
    return;
  }
  const valori = { nome: c.nome, emoji: c.emoji, colore: c.colore }, id = c.id;
  chiudiSheet();
  if (!id) { cambia('Categoria ' + c.nome.trim() + ' creata.', (d) => { aggiungiCategoria(d, valori); }); return; }
  cambia('Categoria aggiornata.', (d) => {
    const prima = categoria(d, id);
    if (prima.nome === valori.nome.trim() && prima.emoji === valori.emoji && prima.colore === valori.colore) return false;
    modificaCategoria(d, id, valori);
  });
}

function sposta(id, posizione) {
  cambia('Ordine delle categorie aggiornato.', (d) => {
    if (d.categorie.findIndex((c) => c.id === id) === posizione) return false;
    spostaCategoria(d, id, posizione);
  });
}

/* ---------- vista e pannelli ---------- */

/* la vista di una voce della cronologia */
function mostra(st) {
  if (st.sheet || (st.vista === S.vista && st.categoriaId === S.categoriaId)) return;
  S.vista = st.vista;
  S.categoriaId = st.categoriaId;
  render();
}

function clicVista(e) {
  const t = e.target.closest('button, a, [data-vai]');
  if (!t) return;
  if (t.dataset.vai) {
    if (t.dataset.vai === 'categoria') S.tab = 'oggetti';
    vai(t.dataset.vai, t.dataset.categoria || null);
  }
  else if (t.dataset.indietro) history.back();
  else if (t.dataset.tab) { S.tab = t.dataset.tab; render(); }
  else if (t.dataset.ordine) { S.ordine = t.dataset.ordine; render(); }
  else if (t.dataset.verso) { S.verso = t.dataset.verso; render(); }
  else if (t.id === 'modificaCategoria') apriModificaCategoria();
  else if (t.id === 'nuovaCategoria') apriNuovaCategoria();
  else if (t.id === 'pickDir') scegliCartella();
  else if (t.id === 'riattiva') riattivaAccesso();
}

function clicSheet(e) {
  const t = e.target;
  if (t.closest('[data-close]')) chiudiSheet();
  else if (t.closest('#confOk')) confermaVersione();
  else if (t.closest('#catSalva')) salvaCategoria();
  else if (t.closest('#catElimina')) { S.categoria.eliminando = true; renderSheets(); document.getElementById('catNonEliminare').focus(); }
  else if (t.closest('#catNonEliminare')) { S.categoria.eliminando = false; renderSheets(); document.getElementById('catElimina').focus(); }
  else if (t.closest('#catEliminaSi')) eliminaCategoriaAperta();
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
    const st = e.state || { vista: 'home', categoriaId: null };
    // l'Indietro di chiudiSheet: la vista segue la voce raggiunta (chiudiSheet(2) torna anche di una vista)
    if (finitoIndietro()) { mostra(st); return; }
    if (sheetAperto()) { svuotaSheet(); return; }
    mostra(st);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sheetAperto()) chiudiSheet();
  });
}
