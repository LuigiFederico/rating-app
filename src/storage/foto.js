/* Foto degli oggetti: file JPEG nella sottocartella foto/ della cartella collegata.
   Sempre ridotte (lato lungo massimo LATO_FOTO) prima di essere salvate. */

import { CARTELLA_FOTO, QUALITA_FOTO } from '../core/costanti.js';
import { misureRidotte } from '../core/calcoli.js';
import { normalizza, fotoCitate } from '../core/dati.js';

/* JPEG ridotto da un file immagine scelto dall'utente (rispetta l'orientamento EXIF) */
export async function riduci(file) {
  const img = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const { w, h } = misureRidotte(img.width, img.height);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  // fondo bianco: i PNG trasparenti in JPEG altrimenti diventano neri
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  img.close();
  return new Promise((ok, ko) => canvas.toBlob((b) => (b ? ok(b) : ko(new Error('conversione non riuscita'))), 'image/jpeg', QUALITA_FOTO));
}

const sottocartella = (h, crea) => h.getDirectoryHandle(CARTELLA_FOTO, { create: crea });
const nomeFile = (percorso) => percorso.slice(CARTELLA_FOTO.length + 1);

/* salva il JPEG come foto/<nome>.jpg e ritorna il percorso da mettere nei dati */
export async function scriviFoto(dirHandle, nome, blob) {
  const fh = await (await sottocartella(dirHandle, true)).getFileHandle(nome, { create: true });
  const w = await fh.createWritable();
  await w.write(blob);
  await w.close();
  return CARTELLA_FOTO + '/' + nome;
}

export async function leggiFoto(dirHandle, percorso) {
  return (await (await sottocartella(dirHandle, false)).getFileHandle(nomeFile(percorso))).getFile();
}

/* i file di foto/ con la data di ultima modifica: [{ nome, modificato }] (cartella assente = nessuna foto) */
export async function elencaFoto(dirHandle) {
  let dir;
  try { dir = await sottocartella(dirHandle, false); } catch (e) { return []; }
  const out = [];
  for await (const [nome, h] of dir.entries()) {
    if (h.kind === 'file') out.push({ nome, modificato: (await h.getFile()).lastModified });
  }
  return out;
}

/* toglie i file indicati (la lista si prepara prima: non si cancella mentre si scorre la cartella) */
export async function eliminaFoto(dirHandle, nomi) {
  if (!nomi.length) return;
  const dir = await sottocartella(dirHandle, false);
  for (const nome of nomi) await dir.removeEntry(nome);
}

/* copia le foto da una cartella all'altra (cambio di cartella); ritorna quante non è riuscita a copiare */
export async function copiaFoto(da, a, percorsi) {
  let mancate = 0;
  for (const p of percorsi) {
    try { await scriviFoto(a, nomeFile(p), await leggiFoto(da, p)); } catch (e) { mancate++; }
  }
  return mancate;
}

/* Le foto citate da rating-data.json e dalle sue copie di sicurezza nella cartella.
   null se uno di quei file non si legge: non si può sapere quali foto citi, quindi nessuna è sicuramente orfana. */
export async function fotoCitateNeiFile(dirHandle) {
  const citate = new Set();
  for await (const [nome, h] of dirHandle.entries()) {
    if (h.kind !== 'file' || !nome.startsWith('rating-data') || !nome.endsWith('.json')) continue;
    try { fotoCitate(normalizza(JSON.parse(await (await h.getFile()).text()))).forEach((f) => citate.add(f)); } catch (e) { return null; }
  }
  return citate;
}
