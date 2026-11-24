/* Pannello "in modifica" di un oggetto, nuovo o esistente: nome, voto a mezze stelle o "?", nota, campi liberi. */

import { S } from '../../state.js';
import { esc, voto } from '../../core/formato.js';
import { categoria, oggetto } from '../../core/calcoli.js';
import { ICONA } from '../componenti.js';
import { testaAlta, blocchiVicini, stellaSvg } from './scheda.js';
import { riquadroFoto, fotoAccessibili } from '../immagini.js';

const MENO = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round" aria-hidden="true"><path d="M6 12h12"></path></svg>';

/* stelle che si toccano: metà sinistra = mezzo punto, metà destra = punto intero */
function stellaScelta(n, v) {
  const pieno = v !== null && v >= n ? 100 : v !== null && v >= n - 0.5 ? 50 : 0;
  const bottone = (valore, lato) => '<button type="button" class="stella-meta stella-meta--' + lato + '" data-voto="' + valore + '"'
    + ' aria-label="' + voto(valore) + (valore === 1 ? ' stella' : ' stelle') + '" aria-pressed="' + (v === valore) + '"></button>';
  return '<span class="stella stella--scelta">' + stellaSvg('#FFFFFF') + '<span class="stella-piena" style="width:' + pieno + '%">' + stellaSvg('#FF5A3C') + '</span>'
    + bottone(n - 0.5, 'sx') + bottone(n, 'dx') + '</span>';
}

/* il blocco del voto, ridisegnato da solo a ogni tocco (il resto del pannello e il focus non si muovono) */
export function bloccoVoto() {
  const b = S.bozza, c = categoria(S.dati, b.categoriaId), v = b.voto;
  // un oggetto nuovo sarà il più recente: a parità di voto va sopra gli altri
  const salvato = b.id && oggetto(S.dati, b.id);
  const creato = salvato ? salvato.creato : new Date().toISOString();
  const vic = v !== null ? blocchiVicini(c, v, b.id, creato) : null;
  return (vic ? vic.sopra : '')
    + '<div class="stelle stelle--scelta" role="group" aria-label="Voto">' + [1, 2, 3, 4, 5].map((n) => stellaScelta(n, v)).join('')
    + '<button type="button" class="non-so" data-voto="" aria-pressed="' + (v === null) + '" aria-label="Non ancora provato">?</button></div>'
    + (vic ? vic.sotto : '<div class="avviso avviso--stretto"><span>Senza voto finisce in «Da provare»: voti quando l\'hai provato.</span></div>');
}

/* i campi liberi: nome e valore, con il meno per toglierli */
export function bloccoCampi() {
  const { campi, erroreCampo } = S.bozza;
  return (campi.length ? '<div class="card">' + campi.map((f, i) => '<div class="f f--modifica">'
    + '<button type="button" class="rm" data-rimuovi="' + i + '" aria-label="Rimuovi ' + (esc(f.nome) || 'campo') + '">' + MENO + '</button>'
    + '<input class="campo-nome" data-campo="' + i + '" data-parte="nome" value="' + esc(f.nome) + '" placeholder="Campo" aria-label="Nome del campo ' + (i + 1) + '" autocomplete="off"'
    + (erroreCampo === i ? ' aria-invalid="true" aria-describedby="campoErrore"' : '') + '>'
    + '<input class="campo-valore" data-campo="' + i + '" data-parte="valore" value="' + esc(f.valore) + '" placeholder="Valore" aria-label="Valore del campo ' + (i + 1) + '" autocomplete="off">'
    + '</div>').join('') + '</div>' : '')
    + (erroreCampo !== undefined && erroreCampo !== null ? '<p id="campoErrore" class="errore">Dai un nome a questo campo, o svuotalo.</p>' : '')
    + '<button type="button" class="pulsante-chiaro" id="aggiungiCampo">+ Aggiungi campo</button>';
}

const FOTOCAMERA = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"></path><circle cx="12" cy="13" r="3.5"></circle></svg>';

/* la foto (una sola: aggiungi, cambia, togli); senza cartella collegata il pulsante è spento e dice perché */
export function bloccoFoto() {
  const b = S.bozza, c = categoria(S.dati, b.categoriaId), puo = fotoAccessibili();
  const perche = S.dirHandle ? 'Per aggiungere foto riattiva l\'accesso alla cartella dal profilo.' : 'Le foto si salvano nella cartella: collegane una dal profilo per aggiungerle.';
  return '<div class="foto-riga">'
    + (b.foto ? '<div class="foto-mini-box">' + riquadroFoto(b.foto, c.colore, 'foto--mini', 'Foto di ' + (b.nome || 'questo oggetto'))
      + '<button type="button" class="foto-togli" id="togliFoto" aria-label="Rimuovi la foto">' + ICONA.chiudi + '</button></div>' : '')
    + '<label class="foto-aggiungi' + (puo ? '' : ' foto-aggiungi--spenta') + (b.fotoInCorso ? ' foto-aggiungi--attesa' : '') + '">'
    + '<input type="file" accept="image/*" id="fotoInput" class="nascosto"' + (puo && !b.fotoInCorso ? '' : ' disabled')
    + (puo ? '' : ' aria-describedby="fotoPerche"') + '>'
    + FOTOCAMERA + (b.fotoInCorso ? 'Salvo…' : b.foto ? 'Cambia' : 'Foto') + '</label>'
    + '</div>'
    + (puo ? '' : '<p id="fotoPerche" class="nota-piccola">' + perche + '</p>');
}

function conferma() {
  return '<div class="avviso avviso--pericolo" role="alert">' + ICONA.info + '<span><strong>Eliminare ' + esc(S.bozza.nome.trim() || 'questo oggetto') + '?</strong> Potrai annullare per qualche secondo.</span></div>'
    + '<div class="pannello-azioni"><button class="cta cta--chiara cta--stretta" id="oggNonEliminare">No, tienilo</button>'
    + '<button class="cta cta--pericolo" id="oggEliminaSi">Elimina</button></div>';
}

export function sheetModifica() {
  const b = S.bozza, c = categoria(S.dati, b.categoriaId);
  const badge = '<span class="badge-modifica">' + ICONA.matita(12) + (b.id ? 'In modifica' : 'Nuovo') + '</span>';
  return '<div class="sheet sheet--alto"><div class="velo velo--alto"></div>'
    + '<div class="pannello pannello--alto" role="dialog" aria-modal="true" aria-label="' + (b.id ? 'Modifica ' + esc(b.nome) : 'Nuovo in ' + esc(c.nome)) + '">'
    + testaAlta(c, badge, 'Annulla modifiche')
    + '<div class="alto-corpo">'
    + '<div class="campo"><label for="oggNome" class="lab">NOME</label>'
    + '<input id="oggNome" class="input-nome titoli" value="' + esc(b.nome) + '" maxlength="80" autocomplete="off" placeholder="Come si chiama?"'
    + (b.errore ? ' aria-invalid="true" aria-describedby="oggErrore"' : '') + '>'
    + (b.errore ? '<p id="oggErrore" class="errore">' + esc(b.errore) + '</p>' : '') + '</div>'
    + '<div id="bloccoFoto" class="sezione">' + bloccoFoto() + '</div>'
    + '<section class="sezione"><h3 id="votoTitolo" class="sezione-titolo titoli" tabindex="-1">Com\'era?</h3><div id="bloccoVoto" class="voto-blocco">' + bloccoVoto() + '</div></section>'
    + '<section class="sezione"><label for="oggNota" class="lab">NOTA</label>'
    + '<textarea id="oggNota" class="nota nota--modifica" rows="3" placeholder="Com\'era davvero? Due parole bastano.">' + esc(b.nota) + '</textarea></section>'
    + '<section class="sezione"><h3 class="lab">DETTAGLI</h3><div id="bloccoCampi" class="campi-liberi">' + bloccoCampi() + '</div></section>'
    + (b.id ? (b.eliminando ? conferma() : '<button class="link-pericolo" id="oggElimina">Elimina oggetto</button>') : '')
    + '</div>'
    + '<div class="alto-piede"><button class="cta cta--chiara cta--stretta" data-close="1">Annulla</button>'
    + '<button class="cta" id="oggSalva">Salva</button></div>'
    + '</div></div>';
}
