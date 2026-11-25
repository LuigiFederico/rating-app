/* Cosa fare tra i dati del telefono e il file nella cartella. Funzione pura.

   Si confrontano tre istanti ('aggiornato' dei documenti):
   - locale: l'ultimo salvataggio su questo telefono ('' = niente di salvato qui);
   - file:   il file nella cartella (null = il file non c'è);
   - sync:   l'ultima versione uguale nei due posti ('' = mai allineati).
   Chi è cambiato dall'ultimo allineamento ha modifiche che l'altro non ha. */
export function decidi(locale, file, sync) {
  // un file senza data (scritto a mano o da altro) conta sempre come cambiato
  const fileCambiato = file !== null && (file === '' || file !== sync);
  const localeCambiato = locale !== '' && locale !== sync;
  if (fileCambiato && localeCambiato) return locale === file ? 'allinea' : 'conflitto';
  if (fileCambiato) return 'carica';
  if (localeCambiato || (file === null && locale !== '')) return 'scrivi';
  return 'niente';
}

/* istante locale per i nomi delle copie di sicurezza: '2026-11-24-143205' */
export function timbro(d = new Date()) {
  const z = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + '-' + z(d.getHours()) + z(d.getMinutes()) + z(d.getSeconds());
}
