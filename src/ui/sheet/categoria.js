/* Pannello categoria: nuova o modifica (nome, emoji, colore, con l'anteprima della tile), ed eliminazione. */

import { S } from '../../state.js';
import { EMOJI, PALETTE } from '../../core/costanti.js';
import { esc } from '../../core/formato.js';
import { categoria, oggettiDi } from '../../core/calcoli.js';
import { ICONA } from '../componenti.js';

/* la tile come apparirà in Home */
export function anteprima(c) {
  return '<span class="big" aria-hidden="true">' + (esc(c.emoji) || '·') + '</span>'
    + '<span class="tile-testi"><span class="nm">' + (esc(c.nome.trim()) || 'Nome') + '</span>'
    + '<span class="ct">' + (c.id ? 'Anteprima' : 'Ancora vuota') + '</span></span>';
}

/* conferma dell'eliminazione, al posto dei pulsanti */
function conferma(c) {
  const n = oggettiDi(S.dati, c.id).length;
  // il nome salvato, non quello che si sta scrivendo: è quello che verrà eliminato
  const salvata = categoria(S.dati, c.id);
  return '<div class="avviso avviso--pericolo" role="alert">' + ICONA.info + '<span><strong>Eliminare ' + esc(salvata ? salvata.nome : 'la categoria') + '?</strong> '
    + (n > 1 ? 'Spariscono anche i suoi ' + n + ' oggetti.' : n === 1 ? 'Sparisce anche il suo unico oggetto.' : 'È vuota.') + ' Potrai annullare per qualche secondo.</span></div>'
    + '<div class="pannello-azioni">'
    + '<button class="cta cta--chiara cta--stretta" id="catNonEliminare">No, tienila</button>'
    + '<button class="cta cta--pericolo" id="catEliminaSi">Elimina</button>'
    + '</div>';
}

export function sheetCategoria() {
  const c = S.categoria, nuova = !c.id;
  return '<div class="sheet"><div class="velo" data-close="1"></div>'
    + '<div class="pannello" role="dialog" aria-modal="true" aria-labelledby="catTitolo">'
    + '<span class="maniglia" aria-hidden="true"></span>'
    + '<div class="pannello-testa"><h2 id="catTitolo" class="pannello-titolo titoli">' + (nuova ? 'Nuova categoria' : 'Modifica categoria') + '</h2>'
    + '<button class="tondo" data-close="1" aria-label="Chiudi">' + ICONA.chiudi + '</button></div>'

    + '<div id="catAnteprima" class="tile tile--anteprima" style="background:' + esc(c.colore) + '">' + anteprima(c) + '</div>'

    + '<div class="campo"><label for="catNome" class="lab">NOME</label>'
    + '<input id="catNome" class="input" value="' + esc(c.nome) + '" maxlength="40" autocomplete="off" placeholder="Vini, caffè, ristoranti…"'
    + (c.errore ? ' aria-invalid="true" aria-describedby="catErrore"' : '') + '>'
    + (c.errore ? '<p id="catErrore" class="errore">' + esc(c.errore) + '</p>' : '') + '</div>'

    + '<fieldset class="campo"><legend class="lab">EMOJI</legend>'
    + '<div class="emoji-griglia">'
    + EMOJI.map((e) => '<button type="button" class="emoji-scelta" data-emoji="' + e + '" aria-pressed="' + (c.emoji === e) + '">' + e + '</button>').join('')
    + '</div>'
    + '<label class="emoji-altra"><span>Oppure scrivine una</span>'
    + '<input id="catEmoji" class="input input--emoji" value="' + esc(EMOJI.includes(c.emoji) ? '' : c.emoji) + '" autocomplete="off" aria-label="Emoji a scelta"></label>'
    + '</fieldset>'

    + '<fieldset class="campo"><legend class="lab">COLORE</legend><div class="colori">'
    + PALETTE.map((p, i) => '<label class="colore" style="background:' + p + '">'
      + '<input type="radio" name="catColore" value="' + p + '"' + (c.colore === p ? ' checked' : '') + ' aria-label="Colore ' + (i + 1) + '"></label>').join('')
    + '</div></fieldset>'

    + (c.eliminando ? conferma(c)
      : '<div class="pannello-azioni">'
        + '<button class="cta cta--chiara cta--stretta" data-close="1">Annulla</button>'
        + '<button id="catSalva" class="cta">' + (nuova ? 'Crea' : 'Salva') + '</button>'
        + '</div>'
        + (nuova ? '' : '<button class="link-pericolo" id="catElimina">Elimina categoria</button>'))
    + '</div></div>';
}
