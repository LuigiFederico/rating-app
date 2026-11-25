/* Profilo e impostazioni: contatori, dove sono salvati i dati, esportazione. */

import { S } from '../../state.js';
import { FILENAME } from '../../core/costanti.js';
import { esc } from '../../core/formato.js';
import { contatori } from '../../core/calcoli.js';
import { supportaFS } from '../../storage/file.js';
import { ICONA } from '../componenti.js';

function rigaCartella() {
  if (!supportaFS) {
    return '<div class="it"><span>Cartella</span><span class="v">Non disponibile in questo browser</span></div>';
  }
  return '<button id="pickDir" class="it"><span>Cartella</span><span class="v">'
    + (S.dirHandle ? esc(S.dirHandle.name) + ' · cambia' : 'Collega') + ' ›</span></button>';
}

const contatore = (n, testo) => '<div class="contatore"><span class="titoli contatore-n">' + n + '</span><span class="v">' + testo + '</span></div>';

export function vistaProfilo() {
  const scaduto = S.dirHandle && !S.permessoCartella;
  const c = contatori(S.dati);
  return '<div class="profilo">'
    + '<button class="tondo profilo-chiudi" data-indietro="1" aria-label="Chiudi">' + ICONA.chiudi + '</button>'
    + '<div class="profilo-testa"><span class="profilo-avatar">' + ICONA.utente(30) + '</span>'
    + '<h1 class="profilo-titolo titoli">Profilo</h1></div>'
    + '<div class="contatori">' + contatore(c.recensioni, c.recensioni === 1 ? 'recensione' : 'recensioni')
    + contatore(c.categorie, c.categorie === 1 ? 'categoria' : 'categorie') + contatore(c.mese, 'questo mese') + '</div>'

    + '<h2 class="lab">SALVATAGGIO</h2>'
    + '<div class="grp">'
    + rigaCartella()
    + '<div class="it"><span>Stato</span><span id="statoSalva" class="v stato"></span></div>'
    + (scaduto ? '<button id="riattiva" class="it it--azione"><span>Riattiva l\'accesso alla cartella</span><span class="v">›</span></button>' : '')
    + '</div>'
    + '<p class="nota-piccola">' + (S.dirHandle
      ? 'I dati sono in ' + FILENAME + ' nella cartella collegata, e una copia resta su questo telefono.'
      : supportaFS
        ? 'Per ora i dati sono solo nel browser di questo telefono. Collega una cartella per salvarli in un file e aggiungere le foto.'
        : 'I dati sono solo nel browser di questo telefono. Per salvarli in un file serve Chrome o Edge.')
    + '</p>'

    + '<h2 class="lab">DATI</h2>'
    + '<div class="grp"><button id="esporta" class="it"><span>Esporta i miei dati</span><span class="v">.zip ›</span></button></div>'
    + '<p class="nota-piccola">Un file .zip con ' + FILENAME + ' e le foto: una copia da tenere dove vuoi.</p>'

    + '<p class="versione">Rating app ' + __VERSIONE_APP__ + ' · ' + __DATA_BUILD__ + '</p>'
    + '</div>';
}
