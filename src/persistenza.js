/* Salvataggio dei dati: sempre in localStorage, e nel file se c'è una cartella collegata.
   Come wallet-app, ma il confronto con il file usa l'ultima versione allineata (vedi core/sincronia.js):
   così le modifiche fatte altrove non vengono mai sovrascritte senza chiedere. */

import { S } from './state.js';
import { FILENAME, LS_KEY, LS_SYNC } from './core/costanti.js';
import { normalizza, nomeBackup, fotoCitate } from './core/dati.js';
import { decidi, timbro } from './core/sincronia.js';
import { supportaFS, chiediCartella, permessoAttivo, riattivaPermesso, leggiFile, scriviFile, FileIlleggibile } from './storage/file.js';
import { salvaHandle, leggiHandle } from './storage/handle-db.js';
import { elencaFoto, eliminaFoto, copiaFoto, leggiFoto, fotoCitateNeiFile } from './storage/foto.js';
import { fotoOrfane } from './core/calcoli.js';
import { render, apriSheet, chiudiConflitto, aggiornaStatoSalvataggio } from './ui/render.js';
import { toast } from './ui/toast.js';

let ultimoSalvato = ''; // 'aggiornato' dell'ultimo salvataggio su questo telefono ('' = mai)
let sync = '';          // 'aggiornato' dell'ultima versione uguale sul telefono e nel file ('' = mai)
let localeOk = true;    // l'ultimo salvataggio nel browser è riuscito

// le operazioni sul file una alla volta, nell'ordine: due salvataggi vicini non si sovrappongono
let coda = Promise.resolve();
function inCoda(fn) {
  const p = coda.then(fn);
  coda = p.catch(() => {});
  return p;
}

export function serializza(dati) {
  return JSON.stringify(dati, null, 1);
}

/* Se il browser non ha salvato i dati, l'allineamento vale solo in memoria: al prossimo avvio
   i dati del browser sono quelli vecchi e il file (più nuovo) va ricaricato, non sovrascritto. */
function segnaSync(v) {
  sync = v;
  if (localeOk) try { localStorage.setItem(LS_SYNC, v); } catch (e) {}
}

/* S.dati nel browser così com'è, senza cambiare 'aggiornato'. false se il browser rifiuta (spazio pieno, bloccato). */
function salvaLocale() {
  ultimoSalvato = String(S.dati.aggiornato || '');
  try { localStorage.setItem(LS_KEY, serializza(S.dati)); localeOk = true; } catch (e) { localeOk = false; }
  return localeOk;
}

/* copia di un contenuto accanto al file, con un nome che non si ripete */
async function copiaDiSicurezza(h, testo) {
  const nome = nomeBackup(timbro());
  await scriviFile(h, testo, nome);
  return nome;
}

/* Il file diventa i dati del telefono; se non aveva una data valida gliela riscrive,
   così il prossimo confronto lo riconosce. */
async function adotta(h, file) {
  S.dati = normalizza(file);
  salvaLocale();
  const versione = S.dati.aggiornato; // letta prima dell'attesa: una modifica nel frattempo non va segnata come allineata
  S.scrittoAlle = null;
  if (String(file.aggiornato || '') !== versione) { await scriviFile(h, serializza(S.dati)); S.scrittoAlle = new Date().toISOString(); }
  segnaSync(versione);
  S.salvato = 'dal file';
}

/* scrive nel file i dati di adesso; segna come allineata proprio quella versione */
async function scrivi(h) {
  const json = serializza(S.dati), versione = S.dati.aggiornato;
  S.scrivo = true; aggiornaStatoSalvataggio();
  await scriviFile(h, json);
  segnaSync(versione);
  S.salvato = 'adesso';
  S.scrittoAlle = new Date().toISOString();
}

/* Il file, o null se non c'è. Se è illeggibile ne tiene una copia e lo sostituisce subito con i dati
   del telefono (così la copia si fa una volta sola): ritorna quello che ha scritto. */
async function leggiOConserva(h) {
  try { return await leggiFile(h); } catch (e) {
    if (!(e instanceof FileIlleggibile)) throw e;
    const copia = await copiaDiSicurezza(h, e.testo);
    salvaLocale();
    const scritto = JSON.parse(serializza(S.dati));
    await scriviFile(h, serializza(scritto));
    S.scrittoAlle = new Date().toISOString();
    toast(FILENAME + ' non era leggibile: l\'ho conservato come ' + copia + ' e riscritto con i dati del telefono.');
    return scritto;
  }
}

/* Confronta telefono e file e fa quello che serve. Da chiamare in coda, con il permesso attivo. */
async function sincronizza() {
  const h = S.dirHandle;
  try {
    const file = await leggiOConserva(h);
    const azione = decidi(ultimoSalvato, file ? String(file.aggiornato || '') : null, sync);
    if (azione === 'conflitto') { S.salvato = 'da decidere'; chiediVersione(h, file, 'riattiva'); }
    else if (azione === 'carica') { await adotta(h, file); render(); }
    else if (azione === 'scrivi') await scrivi(h);
    else if (azione === 'allinea') segnaSync(ultimoSalvato);
  } catch (e) {
    S.salvato = 'errore di scrittura';
    toast('Non riesco a usare la cartella, ma i dati sono al sicuro su questo telefono. Ricollegala dal profilo.');
  } finally {
    S.scrivo = false; aggiornaStatoSalvataggio();
  }
}

export function salva() {
  S.dati.aggiornato = new Date().toISOString();
  if (!salvaLocale()) {
    S.salvato = 'errore sul telefono';
    toast('Non riesco a salvare su questo telefono (spazio pieno o salvataggio bloccato).' + (S.dirHandle ? '' : ' Collega una cartella dal profilo.'));
  } else if (!S.dirHandle) S.salvato = 'solo su questo telefono';
  aggiornaStatoSalvataggio();
  if (!S.dirHandle) return Promise.resolve();
  return inCoda(async () => {
    // dopo un riavvio Chrome chiede di nuovo il permesso (su Android sempre; sul computer non con "Consenti a ogni visita")
    if (!S.permessoCartella) {
      if (!(await riattivaPermesso(S.dirHandle))) { S.salvato = 'permesso da riattivare'; aggiornaStatoSalvataggio(); return; }
      S.permessoCartella = true;
    }
    await sincronizza();
  });
}

/* Pulsante "Riattiva l'accesso" del profilo: chiede il permesso subito invece di aspettare il prossimo salvataggio. */
export async function riattivaAccesso() {
  if (!(await riattivaPermesso(S.dirHandle))) { S.salvato = 'permesso da riattivare'; render(); return; }
  S.permessoCartella = true;
  await inCoda(sincronizza);
  render();
}

/* stessi dati, a parte l'istante dell'ultimo salvataggio */
function stessiDati(file, dati) {
  const senzaData = (d) => JSON.stringify(Object.assign({}, d, { aggiornato: '' }));
  return senzaData(normalizza(file)) === senzaData(dati);
}

/* File e telefono hanno modifiche diverse: il pannello chiede quale versione tenere.
   origine: 'nuova' = cartella appena scelta, 'riattiva' = cartella già collegata. */
function chiediVersione(h, file, origine) {
  const dataFile = String(file.aggiornato || '');
  const piuRecente = dataFile > ultimoSalvato ? 'file' : 'locale';
  S.conflitto = { h, file: normalizza(file), dataFile, origine, piuRecente, scelta: piuRecente, inCorso: false };
  apriSheet();
}

/* Tiene la versione scelta, scrive l'altra accanto al file come copia di sicurezza
   e allinea file e telefono. Finché non si sceglie, ogni salvataggio richiede di nuovo. */
export function confermaVersione() {
  const c = S.conflitto;
  if (!c || c.inCorso) return;
  c.inCorso = true;
  return inCoda(async () => {
    const tieniFile = c.scelta === 'file';
    try {
      // il file può essere cambiato di nuovo mentre il pannello era aperto: si richiede con quello nuovo
      const ora = await leggiOConserva(c.h);
      if (ora && String(ora.aggiornato || '') !== c.dataFile) {
        chiediVersione(c.h, ora, c.origine);
        toast('Il file è cambiato di nuovo nel frattempo: controlla le due versioni.');
        return;
      }
      const tenuta = tieniFile ? c.file : S.dati;
      // si tengono i dati del telefono in una cartella nuova: le loro foto la seguono
      const avviso = c.origine === 'nuova' && !tieniFile ? await portaFoto(c.h) : '';
      const backup = await copiaDiSicurezza(c.h, serializza(tieniFile ? S.dati : c.file));
      S.scrivo = true; aggiornaStatoSalvataggio();
      await scriviFile(c.h, serializza(tenuta));
      if (c.origine === 'nuova') await salvaHandle(c.h);
      // solo ora, a file scritto, il telefono passa alla versione scelta e alla cartella
      if (tieniFile) { S.dati = c.file; salvaLocale(); }
      S.dirHandle = c.h;
      S.permessoCartella = true;
      segnaSync(tenuta.aggiornato);
      S.salvato = 'adesso';
      S.scrittoAlle = new Date().toISOString();
      chiudiConflitto();
      render();
      toast((tieniFile ? 'Caricato ' + FILENAME + '. I dati del telefono sono in ' : 'Tenuti i dati del telefono. Il file di prima è in ') + backup + '.' + avviso);
    } catch (e) {
      c.inCorso = false;
      toast('Non è stato possibile scrivere nella cartella ' + c.h.name + '.');
    } finally {
      S.scrivo = false; aggiornaStatoSalvataggio();
    }
  });
}

export async function scegliCartella() {
  let h;
  try { h = await chiediCartella(); } catch (e) {
    if (e && e.name !== 'AbortError') toast('Non è stato possibile aprire la cartella.');
    return;
  }
  if (!h) return;
  await inCoda(async () => {
    try {
      const file = await leggiOConserva(h);
      const vuoto = !S.dati.categorie.length && !S.dati.oggetti.length;
      // il telefono ha dati suoi e il file altri: si sceglie prima di collegare
      if (file && !vuoto && !stessiDati(file, S.dati)) { chiediVersione(h, file, 'nuova'); return; }
      // i dati del telefono vanno nella cartella nuova: le foto si copiano prima di lasciare quella vecchia
      const avviso = file ? '' : await portaFoto(h);
      S.dirHandle = h;
      S.permessoCartella = true;
      await salvaHandle(h);
      if (file) { await adotta(h, file); toast('Collegato: caricati i dati di ' + FILENAME + ' nella cartella ' + h.name + '.'); }
      else { salvaLocale(); await scrivi(h); toast('Collegato: la cartella ' + h.name + ' ora contiene ' + FILENAME + '.' + avviso); }
      render();
    } catch (e) {
      toast('Non è stato possibile usare la cartella ' + h.name + '.');
    } finally {
      S.scrivo = false; aggiornaStatoSalvataggio();
    }
  });
}

/* Foto che nessuno cita più (oggetti eliminati, foto cambiate, modifiche non salvate). Cancellare è
   per sempre, quindi con prudenza: all'avvio, solo con i dati del telefono caricati e allineati al file,
   tenendo anche le foto citate dal file e dalle copie di sicurezza, e solo file fermi da GIORNI_ORFANE
   giorni (una foto recente può essere di un altro dispositivo o di una modifica in corso).
   Durante la sessione le foto restano: "Annulla" le ritrova sempre. */
async function pulisciFoto() {
  if (!S.dirHandle || !S.permessoCartella || S.conflitto || !ultimoSalvato || ultimoSalvato !== sync) return;
  try {
    const citate = await fotoCitateNeiFile(S.dirHandle);
    if (!citate) return; // una copia illeggibile potrebbe citare qualunque foto: meglio non togliere niente
    fotoCitate(S.dati).forEach((f) => citate.add(f));
    await eliminaFoto(S.dirHandle, fotoOrfane(await elencaFoto(S.dirHandle), citate));
  } catch (e) {}
}

/* Si passa a un'altra cartella portando i dati del telefono: le loro foto vengono copiate dalla cartella
   di prima, se è ancora leggibile. Ritorna un avviso da aggiungere al messaggio ('' se tutto bene). */
async function portaFoto(nuova) {
  if (S.dirHandle && await S.dirHandle.isSameEntry(nuova)) return '';
  // quelle che la cartella nuova ha già non si toccano
  const percorsi = [];
  for (const f of fotoCitate(S.dati)) { try { await leggiFoto(nuova, f); } catch (e) { percorsi.push(f); } }
  if (!percorsi.length) return '';
  const mancate = S.dirHandle && S.permessoCartella ? await copiaFoto(S.dirHandle, nuova, percorsi) : percorsi.length;
  return mancate ? ' ' + mancate + (mancate === 1 ? ' foto manca' : ' foto mancano') + ' nella cartella: copiale a mano in foto/.' : '';
}

/* Chrome su Android non conserva il permesso tra un avvio e l'altro e lo può chiedere
   solo dopo un gesto: lo chiedo al primo tocco, una volta per avvio. Il tocco fa anche
   la sua azione normale. */
function chiediAlPrimoTocco(h) {
  const tocco = async (e) => {
    document.removeEventListener('click', tocco, true);
    // questi pulsanti chiedono già il permesso, o un'altra cartella, da soli
    if (e.target.closest('#riattiva, #pickDir')) return;
    if (S.permessoCartella || S.dirHandle !== h || !(await riattivaPermesso(h))) return;
    S.permessoCartella = true;
    await inCoda(sincronizza);
    render();
    inCoda(pulisciFoto); // dopo il disegno, senza farlo aspettare
  };
  document.addEventListener('click', tocco, true);
}

/* All'avvio: prima localStorage, poi il file se il permesso sulla cartella è ancora valido.
   Senza permesso la cartella resta collegata e il permesso viene chiesto al primo tocco o al primo salvataggio. */
export async function avvia() {
  let raw = null;
  try { raw = localStorage.getItem(LS_KEY); sync = localStorage.getItem(LS_SYNC) || ''; } catch (e) {}
  if (raw) {
    try {
      S.dati = normalizza(JSON.parse(raw));
      ultimoSalvato = String(S.dati.aggiornato || '');
      S.salvato = 'solo su questo telefono';
    } catch (e) {
      // copia locale rovinata: si conserva a parte prima che il primo salvataggio la sostituisca
      try { localStorage.setItem(LS_KEY + '-illeggibile', raw); } catch (err) {}
    }
  }

  if (supportaFS) {
    try {
      const h = await leggiHandle();
      if (h) {
        S.dirHandle = h;
        if (await permessoAttivo(h)) {
          S.permessoCartella = true;
          await inCoda(sincronizza);
          inCoda(pulisciFoto); // in coda, senza far aspettare il primo disegno
        } else {
          S.salvato = 'permesso da riattivare';
          chiediAlPrimoTocco(h);
        }
      }
    } catch (e) {}
  }
  render();
}
