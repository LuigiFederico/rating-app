/* Pannello "quale versione tenere": il file nella cartella e i dati del telefono sono diversi. */

import { S } from '../../state.js';
import { FILENAME } from '../../core/costanti.js';
import { esc, dataBreve, orarioBreve } from '../../core/formato.js';
import { nomeBackup } from '../../core/dati.js';
import { ICONA } from '../componenti.js';

function contenuto(d) {
  const n = d.oggetti.length, c = d.categorie.length;
  return c + (c === 1 ? ' categoria' : ' categorie') + ', ' + n + (n === 1 ? ' oggetto' : ' oggetti');
}

const quando = (iso) => dataBreve(iso) + ' ' + orarioBreve(iso);

function opzione(valore, titolo, dettaglio) {
  const c = S.conflitto, on = c.scelta === valore;
  return '<label class="opzione" data-on="' + (on ? 1 : 0) + '">'
    + '<input type="radio" name="versione" value="' + valore + '"' + (on ? ' checked' : '') + '>'
    + '<span class="opzione-testo"><span class="opzione-titolo">' + titolo
    + (c.piuRecente === valore ? '<span class="badge">Più recente</span>' : '') + '</span>'
    + '<span class="opzione-dettaglio">' + dettaglio + '</span></span></label>';
}

export function sheetConflitto() {
  const c = S.conflitto, cartella = '<strong>' + esc(c.h.name) + '</strong>', nuova = c.origine === 'nuova';
  return '<div class="sheet"><div class="velo" data-close="1"></div>'
    + '<div class="pannello" role="dialog" aria-modal="true" aria-labelledby="confTitolo">'
    + '<span class="maniglia" aria-hidden="true"></span>'
    + '<h2 id="confTitolo" class="pannello-titolo titoli">' + (nuova ? 'In questa cartella c\'è già un file' : 'Il file è stato aggiornato altrove') + '</h2>'
    + '<p class="pannello-testo">' + (nuova ? cartella + ' contiene già ' + FILENAME + '.' : FILENAME + ' in ' + cartella + ' è cambiato da un altro dispositivo.')
    + ' Quale versione vuoi tenere?</p>'
    + '<fieldset class="opzioni"><legend class="nascosto">Versione da tenere</legend>'
    + opzione('locale', 'Dati di questo telefono', contenuto(S.dati) + ' · modificati ' + quando(S.dati.aggiornato))
    + opzione('file', 'Il file nella cartella', contenuto(c.file) + ' · modificato ' + quando(c.file.aggiornato))
    + '</fieldset>'
    + '<div class="avviso">' + ICONA.info + '<span>L\'altra versione non si perde: la salvo come copia nella stessa cartella (<strong>' + nomeBackup('…') + '</strong>, con data e ora).</span></div>'
    + '<button id="confOk" class="cta">' + (c.scelta === 'locale' ? 'Tieni i dati del telefono' : 'Usa il file della cartella') + '</button>'
    + '<button data-close="1" class="cta cta--chiara">' + (nuova ? 'Non collegare la cartella' : 'Decidi più tardi') + '</button>'
    + '</div></div>';
}
