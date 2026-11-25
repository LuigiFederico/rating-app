/* Lettura/scrittura di rating-data.json nella cartella scelta
   (File System Access API: Chrome/Edge su Android e desktop). */

import { FILENAME } from '../core/costanti.js';

export const supportaFS = typeof window.showDirectoryPicker === 'function';

export async function chiediCartella() {
  const h = await window.showDirectoryPicker({ id: 'rating', mode: 'readwrite', startIn: 'documents' });
  return (await h.requestPermission({ mode: 'readwrite' })) === 'granted' ? h : null;
}

export async function permessoAttivo(h) {
  return (await h.queryPermission({ mode: 'readwrite' })) === 'granted';
}

/* Richiede di nuovo il permesso su una cartella già scelta: serve un gesto dell'utente. */
export async function riattivaPermesso(h) {
  try { return (await h.requestPermission({ mode: 'readwrite' })) === 'granted'; } catch (e) { return false; }
}

/* Il file c'è ma non è un documento dell'app (JSON rovinato a mano, altro contenuto):
   non va sovrascritto senza tenerne una copia. testo = il contenuto originale. */
export class FileIlleggibile extends Error {
  constructor(testo) { super(FILENAME + ' non è leggibile'); this.testo = testo; }
}

/* Contenuto del file già interpretato, oppure null se il file non c'è.
   Lancia FileIlleggibile se il contenuto non è un documento valido, e gli altri errori di lettura così come sono. */
export async function leggiFile(dirHandle) {
  let txt;
  try {
    txt = await (await (await dirHandle.getFileHandle(FILENAME)).getFile()).text();
  } catch (e) {
    if (e && e.name === 'NotFoundError') return null;
    throw e;
  }
  let d;
  try { d = JSON.parse(txt); } catch (e) { throw new FileIlleggibile(txt); }
  if (!d || typeof d !== 'object' || !Array.isArray(d.categorie)) throw new FileIlleggibile(txt);
  return d;
}

export async function scriviFile(dirHandle, testo, nome = FILENAME) {
  const fh = await dirHandle.getFileHandle(nome, { create: true });
  const w = await fh.createWritable();
  await w.write(testo);
  await w.close();
}
