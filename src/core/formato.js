/* Testi mostrati a schermo: voti, date, conteggi. Funzioni pure. */

import { MESI_BREVI } from './costanti.js';

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* 4.5 → '4,5'; 4 → '4' */
export function voto(v) {
  return String(v).replace('.', ',');
}

/* giorni di calendario tra due istanti, nell'ora locale */
function giorniTra(da, a) {
  const g = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((g(a) - g(da)) / 86400000);
}

/* Quanto tempo fa, come nel design: 'oggi', 'ieri', '3 giorni', '2 sett', 'ago' (o 'ago 2025' se di un altro anno). */
export function dataRelativa(iso, oggi = new Date()) {
  const d = new Date(iso);
  const n = giorniTra(d, oggi);
  if (n <= 0) return 'oggi';
  if (n === 1) return 'ieri';
  if (n < 7) return n + ' giorni';
  if (n < 28) return Math.floor(n / 7) + ' sett';
  return MESI_BREVI[d.getMonth()] + (d.getFullYear() !== oggi.getFullYear() ? ' ' + d.getFullYear() : '');
}

/* '24 nov', con l'anno se non è quello di oggi */
export function dataBreve(iso, oggi = new Date()) {
  const d = new Date(iso);
  return d.getDate() + ' ' + MESI_BREVI[d.getMonth()] + (d.getFullYear() !== oggi.getFullYear() ? ' ' + d.getFullYear() : '');
}

/* Conteggio di una categoria in Home, senza accordo di genere: '24 voti · 6 da provare'. */
export function testoConteggio(votati, daProvare) {
  const parti = [];
  if (votati) parti.push(votati + (votati === 1 ? ' voto' : ' voti'));
  if (daProvare) parti.push(daProvare + ' da provare');
  return parti.join(' · ') || 'Ancora vuota';
}

/* Prima "lettera" visibile di un testo: un'emoji composta (👩‍🍳, 👍🏽, 🇮🇹) resta intera. */
export function primoSegno(testo) {
  const t = String(testo).trim();
  if (!t) return '';
  return new Intl.Segmenter('it', { granularity: 'grapheme' }).segment(t)[Symbol.iterator]().next().value.segment;
}

/* nome del file esportato: 'rating-app-2026-11-24.zip' (data locale) */
export function nomeExport(oggi = new Date()) {
  const z = (n) => String(n).padStart(2, '0');
  return 'rating-app-' + oggi.getFullYear() + '-' + z(oggi.getMonth() + 1) + '-' + z(oggi.getDate()) + '.zip';
}

/* 'alle 14:05' */
export function orarioBreve(iso) {
  const d = new Date(iso);
  return 'alle ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}
