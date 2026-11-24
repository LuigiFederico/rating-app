/* Forma del documento rating-data.json (vedi README) e modifiche ai dati. Le modifiche
   cambiano il documento ricevuto sul posto, senza salvare né disegnare. */

import { FILENAME, VERSIONE_DATI, PALETTE } from './costanti.js';

export function datiVuoti() {
  return { versione: VERSIONE_DATI, aggiornato: new Date().toISOString(), categorie: [], oggetti: [] };
}

/* voto valido: da 0,5 a 5 a passi di mezzo punto; altrimenti null (= da provare) */
export function votoValido(v) {
  if (typeof v !== 'number' && !(typeof v === 'string' && v.trim())) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0.5 && n <= 5 && Number.isInteger(n * 2) ? n : null;
}

/* testo da un valore del file: anche numeri e sì/no (un "2018" scritto a mano senza virgolette) */
const testo = (s) => (typeof s === 'string' ? s : typeof s === 'number' || typeof s === 'boolean' ? String(s) : '');

/* tiene il primo elemento per ogni id (un file modificato a mano può ripeterli) */
function unici(lista) {
  const visti = new Set();
  return lista.filter((x) => !visti.has(x.id) && visti.add(x.id));
}

function normalizzaOggetto(o, idCategorie) {
  if (!o || typeof o !== 'object' || !o.id || !idCategorie.has(String(o.categoriaId))) return null;
  const creato = Date.parse(o.creato);
  return {
    id: String(o.id),
    categoriaId: String(o.categoriaId),
    nome: testo(o.nome),
    voto: votoValido(o.voto),
    nota: testo(o.nota),
    campi: Array.isArray(o.campi) ? o.campi.filter((c) => c && testo(c.nome)).map((c) => ({ nome: testo(c.nome), valore: testo(c.valore) })) : [],
    foto: typeof o.foto === 'string' && o.foto ? o.foto : null,
    // sempre in UTC: gli ordinamenti confrontano le date come testo
    creato: new Date(isNaN(creato) ? 0 : creato).toISOString()
  };
}

/* Completa un documento letto da file/localStorage: campi mancanti, valori fuori forma
   e oggetti di categorie che non esistono più vengono sistemati o tolti. */
export function normalizza(d) {
  const out = datiVuoti();
  if (!d || typeof d !== 'object') return out;
  if (typeof d.aggiornato === 'string') out.aggiornato = d.aggiornato;
  out.categorie = unici((Array.isArray(d.categorie) ? d.categorie : [])
    .filter((c) => c && c.id && testo(c.nome))
    .map((c, i) => ({ id: String(c.id), nome: testo(c.nome), emoji: testo(c.emoji), colore: testo(c.colore) || PALETTE[i % PALETTE.length] })));
  const ids = new Set(out.categorie.map((c) => c.id));
  out.oggetti = unici((Array.isArray(d.oggetti) ? d.oggetti : []).map((o) => normalizzaOggetto(o, ids)).filter(Boolean));
  return out;
}

/* Copia di sicurezza accanto al file: 'rating-data.backup-2026-11-24-143205.json' (vedi timbro in sincronia.js) */
export function nomeBackup(timbro) {
  return FILENAME.replace(/\.json$/, '.backup-' + timbro + '.json');
}

export function nuovoId(prefisso) {
  return prefisso + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/* ---------- categorie ---------- */

/* '' se il nome va bene; id = la categoria che si sta modificando (null per una nuova) */
export function erroreNomeCategoria(dati, nome, id) {
  const n = nome.trim().toLowerCase();
  if (!n) return 'Scrivi un nome.';
  if (dati.categorie.some((c) => c.id !== id && c.nome.trim().toLowerCase() === n)) return 'Esiste già una categoria con questo nome.';
  return '';
}

/* primo colore della tavolozza non ancora usato (se sono tutti usati, si ricomincia) */
export function coloreLibero(dati) {
  const usati = new Set(dati.categorie.map((c) => c.colore));
  return PALETTE.find((p) => !usati.has(p)) || PALETTE[dati.categorie.length % PALETTE.length];
}

export function aggiungiCategoria(dati, { nome, emoji, colore }) {
  const c = { id: nuovoId('c'), nome: nome.trim(), emoji, colore };
  dati.categorie.push(c);
  return c;
}

export function modificaCategoria(dati, id, { nome, emoji, colore }) {
  const c = dati.categorie.find((x) => x.id === id);
  if (c) Object.assign(c, { nome: nome.trim(), emoji, colore });
  return c;
}

/* Toglie la categoria e tutti i suoi oggetti; ritorna quanti oggetti sono stati tolti. */
export function eliminaCategoria(dati, id) {
  const prima = dati.oggetti.length;
  dati.categorie = dati.categorie.filter((c) => c.id !== id);
  dati.oggetti = dati.oggetti.filter((o) => o.categoriaId !== id);
  return prima - dati.oggetti.length;
}

/* Sposta la categoria nella posizione indicata (l'ordine dell'array è quello della Home). */
export function spostaCategoria(dati, id, posizione) {
  const da = dati.categorie.findIndex((c) => c.id === id);
  if (da < 0) return;
  const [c] = dati.categorie.splice(da, 1);
  dati.categorie.splice(Math.max(0, Math.min(posizione, dati.categorie.length)), 0, c);
}

/* ---------- oggetti ---------- */

/* Bozza del pannello "modifica": un oggetto nuovo (id null) o la copia di uno salvato. */
export function bozzaNuova(categoriaId) {
  return { id: null, categoriaId, nome: '', voto: null, nota: '', campi: [], foto: null };
}

export function bozzaDaOggetto(o) {
  return { id: o.id, categoriaId: o.categoriaId, nome: o.nome, voto: o.voto, nota: o.nota, campi: o.campi.map((c) => ({ ...c })), foto: o.foto };
}

export function bozzaPronta(b) {
  return !!b.nome.trim();
}

/* Salva la bozza: aggiorna l'oggetto con lo stesso id, o ne crea uno nuovo con data di creazione ora.
   I campi senza nome si scartano. Ritorna l'oggetto salvato, o null se nel frattempo
   l'oggetto o la sua categoria sono stati eliminati. */
export function salvaOggetto(dati, b, ora = new Date()) {
  const esistente = b.id && dati.oggetti.find((o) => o.id === b.id);
  if ((b.id && !esistente) || !dati.categorie.some((c) => c.id === b.categoriaId)) return null;
  const valori = {
    nome: b.nome.trim(),
    voto: votoValido(b.voto),
    nota: b.nota.trim(),
    campi: b.campi.filter((c) => c.nome.trim()).map((c) => ({ nome: c.nome.trim(), valore: c.valore.trim() })),
    foto: b.foto || null
  };
  if (esistente) return Object.assign(esistente, valori);
  const o = { id: nuovoId('o'), categoriaId: b.categoriaId, ...valori, creato: ora.toISOString() };
  dati.oggetti.push(o);
  return o;
}

export function eliminaOggetto(dati, id) {
  dati.oggetti = dati.oggetti.filter((o) => o.id !== id);
}

/* percorsi delle foto ancora citate dai dati (le altre nella cartella sono orfane) */
export function fotoCitate(dati) {
  return new Set(dati.oggetti.map((o) => o.foto).filter(Boolean));
}
