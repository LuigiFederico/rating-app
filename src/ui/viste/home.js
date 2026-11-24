/* Home: le categorie, nell'ordine scelto (si riordinano tenendo premuto). */

import { S } from '../../state.js';
import { esc, testoConteggio } from '../../core/formato.js';
import { conteggio } from '../../core/calcoli.js';
import { ICONA } from '../componenti.js';

function tile(c) {
  const n = conteggio(S.dati, c.id);
  return '<button class="tile" data-id="' + esc(c.id) + '" style="background:' + esc(c.colore) + '"'
    + ' aria-label="' + esc(c.nome) + ', ' + testoConteggio(n.votati, n.daProvare) + '. Tieni premuto per riordinare, o Alt e frecce">'
    + '<span class="big" aria-hidden="true">' + esc(c.emoji) + '</span>'
    + '<span class="tile-testi"><span class="nm">' + esc(c.nome) + '</span>'
    + '<span class="ct">' + testoConteggio(n.votati, n.daProvare) + '</span></span>'
    + '</button>';
}

export function vistaHome() {
  const cat = S.dati.categorie;
  return '<div class="home">'
    + '<header class="home-testa"><h1 class="home-titolo titoli">Home</h1>'
    + '<button class="home-profilo" data-vai="profilo" aria-label="Profilo e impostazioni">' + ICONA.utente() + '</button></header>'
    + '<div class="home-corpo">'
    + (cat.length
      ? '<div class="tiles">' + cat.map(tile).join('') + '</div>'
      : '<div class="vuoto"><p class="vuoto-titolo titoli">Ancora niente qui</p>'
        + '<p class="vuoto-testo">Crea una categoria per ogni cosa che vuoi votare: vini, caffè, ristoranti, creme…</p></div>')
    + '<button id="nuovaCategoria" class="nuova-categoria"><span class="nuova-piu">' + ICONA.piu() + '</span>Nuova categoria</button>'
    + (cat.length > 1 ? '<p class="suggerimento">Tieni premuta una categoria per spostarla.</p>' : '')
    + '</div></div>';
}
