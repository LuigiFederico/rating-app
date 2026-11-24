/* Home: le categorie. */

import { ICONA } from '../componenti.js';

export function vistaHome() {
  return '<div class="home">'
    + '<header class="home-testa"><h1 class="home-titolo titoli">Home</h1>'
    + '<button class="home-profilo" data-vai="profilo" aria-label="Profilo e impostazioni">' + ICONA.utente() + '</button></header>'
    + '</div>';
}
