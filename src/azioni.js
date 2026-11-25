/* Ogni modifica ai dati passa di qui: salva, ridisegna e si può annullare dal toast. */

import { S } from './state.js';
import { salva } from './persistenza.js';
import { render } from './ui/render.js';
import { toast } from './ui/toast.js';

/* fn modifica S.dati sul posto; se ritorna false non è cambiato niente (niente salvataggio né toast).
   "Annulla" riporta i dati a com'erano prima di fn, ma solo se nel frattempo non sono cambiati
   per altre vie (per esempio caricati dal file): annullare cancellerebbe anche quelle modifiche.
   alAnnulla: per rimettere a posto anche lo stato dell'interfaccia cambiato da fn (es. la tab). */
export function cambia(messaggio, fn, alAnnulla) {
  const prima = JSON.stringify(S.dati);
  if (fn(S.dati) === false) return;
  salva(); render();
  // salvataggio non riuscito sul telefono: resta visibile il suo avviso, non un "fatto"
  if (S.salvato === 'errore sul telefono') return;
  const dopo = S.dati.aggiornato;
  toast(messaggio, () => {
    if (S.dati.aggiornato !== dopo) { toast('Non si può più annullare: i dati sono cambiati nel frattempo.'); return; }
    S.dati = JSON.parse(prima);
    if (alAnnulla) alAnnulla();
    salva(); render();
  });
}
