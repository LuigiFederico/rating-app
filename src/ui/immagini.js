/* Le foto a schermo: si leggono dalla cartella dopo il disegno e si tengono in memoria (URL di oggetti). */

import { S } from '../state.js';
import { esc } from '../core/formato.js';
import { leggiFoto } from '../storage/foto.js';

let url = new Map(); // percorso → promessa dell'URL dell'immagine (una lettura sola per percorso)
let cartella = null;  // la cartella da cui vengono le immagini in memoria

/* cambiata la cartella, le immagini in memoria non valgono più */
function cache() {
  if (cartella !== S.dirHandle) {
    url.forEach((p) => p.then((u) => URL.revokeObjectURL(u), () => {}));
    url = new Map();
    cartella = S.dirHandle;
  }
  return url;
}

/* le foto si possono leggere e salvare solo con una cartella collegata e il permesso attivo */
export const fotoAccessibili = () => !!(S.dirHandle && S.permessoCartella);

/* riquadro di una foto nel colore della categoria; l'immagine arriva dopo (caricaImmagini) */
export function riquadroFoto(percorso, colore, classe, alt) {
  if (!fotoAccessibili()) {
    return '<div class="foto ' + classe + ' foto--assente" style="background:' + esc(colore) + '"><span class="foto-testo">'
      + (S.dirHandle ? 'Riattiva l\'accesso alla cartella dal profilo per vedere la foto' : 'Collega la cartella per vedere la foto') + '</span></div>';
  }
  return '<div class="foto ' + classe + '" style="background:' + esc(colore) + '">'
    + '<img data-foto="' + esc(percorso) + '" alt="' + esc(alt) + '"><span class="foto-testo foto-mancante">Foto non trovata nella cartella</span></div>';
}

/* mette le immagini nei riquadri appena disegnati dentro radice */
export async function caricaImmagini(radice) {
  if (!fotoAccessibili()) return;
  for (const img of radice.querySelectorAll('img[data-foto]:not([src])')) {
    const p = img.dataset.foto;
    const c = cache();
    if (!c.has(p)) c.set(p, leggiFoto(S.dirHandle, p).then((file) => URL.createObjectURL(file)));
    try {
      img.src = await c.get(p);
    } catch (e) {
      c.delete(p); // il file può comparire più tardi (cartella sincronizzata)
      img.closest('.foto').classList.add('foto--mancante');
    }
  }
}
