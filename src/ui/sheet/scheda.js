/* Scheda di un oggetto (sola lettura) e pannello "in modifica". Pannelli alti: da sotto la barra di stato al fondo. */

import { S } from '../../state.js';
import { esc, voto, dataBreve } from '../../core/formato.js';
import { categoria, oggetto, vicini } from '../../core/calcoli.js';
import { ICONA } from '../componenti.js';
import { riquadroFoto } from '../immagini.js';

const STELLA = 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z';
export const stellaSvg = (colore) => '<svg width="44" height="44" viewBox="0 0 24 24" aria-hidden="true"><path d="' + STELLA + '" fill="' + colore + '" stroke="#1E1B18" stroke-width="1.4" stroke-linejoin="round"></path></svg>';

/* una stella piena, mezza o vuota (la parte arancio è un ritaglio sopra quella bianca) */
function stella(n, v) {
  const pieno = v >= n ? 100 : v >= n - 0.5 ? 50 : 0;
  return '<span class="stella">' + stellaSvg('#FFFFFF') + '<span class="stella-piena" style="width:' + pieno + '%">' + stellaSvg('#FF5A3C') + '</span></span>';
}

export function stelle(v) {
  return '<div class="stelle" role="img" aria-label="' + voto(v) + (v === 1 ? ' stella' : ' stelle') + ' su 5">' + [1, 2, 3, 4, 5].map((n) => stella(n, v)).join('') + '</div>';
}

/* riga del vicino sopra o sotto nella tua classifica */
function vicino(o, su, vuoto) {
  const freccia = su ? '<path d="M12 19V5M6 11l6-6 6 6"></path>' : '<path d="M12 5v14M6 13l6 6 6-6"></path>';
  return '<div class="vicino"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true">' + freccia + '</svg>'
    + '<span class="vicino-nome">' + (o ? esc(o.nome) : vuoto) + '</span>' + (o ? '<span class="titoli">' + voto(o.voto) + '</span>' : '') + '</div>';
}

export function blocchiVicini(c, v, id, creato) {
  const { sopra, sotto } = vicini(S.dati, c.id, v, id, creato);
  return { sopra: vicino(sopra, true, 'Niente sopra: il tuo migliore!'), sotto: vicino(sotto, false, 'Niente sotto: il tuo peggiore.') };
}

/* intestazione comune: maniglia, chip della categoria, (badge), chiudi */
export function testaAlta(c, extra, chiudiLabel) {
  return '<div class="alto-testa"><span class="maniglia" aria-hidden="true"></span>'
    + '<div class="alto-barra"><span class="alto-sinistra"><span class="chip-cat" style="background:' + esc(c.colore) + '">' + esc(c.emoji) + ' ' + esc(c.nome) + '</span>' + extra + '</span>'
    + '<button class="tondo" data-close="1" aria-label="' + chiudiLabel + '">' + ICONA.chiudi + '</button></div></div>';
}

export function sheetScheda() {
  const o = oggetto(S.dati, S.scheda), c = categoria(S.dati, o.categoriaId);
  const v = blocchiVicini(c, o.voto, o.id, o.creato);
  return '<div class="sheet sheet--alto"><div class="velo velo--alto" data-close="1"></div>'
    + '<div class="pannello pannello--alto" role="dialog" aria-modal="true" aria-labelledby="schedaNome">'
    + testaAlta(c, '', 'Chiudi')
    + '<div class="alto-corpo">'
    + '<h2 id="schedaNome" class="scheda-nome titoli" tabindex="-1">' + esc(o.nome) + '</h2>'
    + (o.foto ? riquadroFoto(o.foto, c.colore, 'foto--grande', 'Foto di ' + o.nome) : '')
    + (o.voto !== null
      ? '<div class="voto-blocco">' + v.sopra + stelle(o.voto) + v.sotto + '</div>'
      : '<div class="avviso">' + ICONA.info + '<span>Ancora <strong>da provare</strong>: quando l\'hai provato, dagli un voto con la matita.</span></div>')
    + (o.nota ? '<section class="sezione"><h3 class="lab">NOTA</h3><p class="nota">' + esc(o.nota) + '</p></section>' : '')
    + (o.campi.length ? '<section class="sezione"><h3 class="lab">DETTAGLI</h3><dl class="card">'
      + o.campi.map((f) => '<div class="f"><dt class="k">' + esc(f.nome) + '</dt><dd>' + (f.valore ? esc(f.valore) : '<span class="vuoto-valore">—</span>') + '</dd></div>').join('')
      + '</dl></section>' : '')
    + '<p class="scheda-data">Aggiunto il ' + dataBreve(o.creato) + '</p>'
    + '</div>'
    + '<button class="fab fab--pannello" id="modificaOggetto" aria-label="Modifica">' + ICONA.matita(26) + '</button>'
    + '</div></div>';
}
