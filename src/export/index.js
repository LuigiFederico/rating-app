/* "Esporta i miei dati": uno zip con rating-data.json e la cartella foto/. */

import { S } from '../state.js';
import { FILENAME } from '../core/costanti.js';
import { fotoCitate } from '../core/dati.js';
import { nomeExport } from '../core/formato.js';
import { riattivaAccesso } from '../persistenza.js';
import { leggiFoto } from '../storage/foto.js';
import { toast } from '../ui/toast.js';
import { zip } from './zip.js';

function scarica(blob, nome) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}

let inCorso = false;

export async function esportaDati() {
  if (inCorso) return;
  inCorso = true;
  try {
    // accesso scaduto: lo si chiede ora (è un tocco dell'utente), così le foto entrano nello zip
    if (S.dirHandle && !S.permessoCartella) await riattivaAccesso();
    const file = [{ name: FILENAME, data: JSON.stringify(S.dati, null, 1) }];
    const percorsi = [...fotoCitate(S.dati)];
    let mancanti = 0;
    for (const p of percorsi) {
      try {
        file.push({ name: p, data: new Uint8Array(await (await leggiFoto(S.dirHandle, p)).arrayBuffer()) });
      } catch (e) { mancanti++; }
    }
    scarica(zip(file), nomeExport());
    const perche = !S.dirHandle ? 'serve la cartella collegata.' : !S.permessoCartella ? 'riattiva l\'accesso alla cartella dal profilo.' : 'non sono nella cartella foto/.';
    toast(!mancanti ? 'Esportati i dati' + (percorsi.length ? ' e ' + percorsi.length + ' foto.' : '.')
      : mancanti === percorsi.length ? 'Esportati i dati, ma non le foto: ' + perche
        : 'Esportati i dati e ' + (percorsi.length - mancanti) + ' foto; ' + mancanti + ' ' + perche);
  } catch (e) {
    toast('Esportazione non riuscita: riprova, o esporta con meno foto collegate.');
  } finally {
    inCorso = false;
  }
}
