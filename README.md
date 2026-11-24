# Rating app

App per tenere il conto di quello che provi e di quanto ti è piaciuto: vini, caffè,
ristoranti, creme, qualsiasi cosa. Ogni categoria ha i suoi oggetti, ognuno con un voto
da mezza a cinque stelle (o «?» se è ancora da provare), una nota, dei campi liberi e una
foto. Per ogni categoria vedi la tua classifica, con il podio.

I dati vivono in un file **`rating-data.json`** in una cartella del telefono scelta da te,
e le foto accanto, nella sottocartella **`foto/`**. L'app li riscrive a ogni modifica.
Nessun server, nessun account, nessun dato che esce dal dispositivo.

Il design è la pagina «Primo design» del canvas *Provato — primo design*; la condivisione
con altre persone (gruppi, inviti, voti degli altri) non c'è ancora.

---

## Installare sul telefono (Samsung / Android)

1. Pubblica l'app su un indirizzo **HTTPS** (vedi sotto: GitHub Pages).
2. Apri l'indirizzo con **Chrome** sul telefono.
3. Menu ⋮ → **Installa app** (o «Aggiungi a schermata Home»).
4. Apri l'app dall'icona. Tocca il cerchio in alto a destra (**Profilo**) → **Cartella →
   Collega** e indica dove salvare `rating-data.json` e le foto.

> Suggerimento: scegli una cartella sincronizzata con Google Drive o OneDrive.
> Hai backup automatico e apri gli stessi file dal PC.

Su Android Chrome non conserva il permesso sulla cartella tra un avvio e l'altro
(il permesso permanente, «Consenti a ogni visita», esiste solo sul computer): l'app lo
chiede al primo tocco dopo ogni apertura e poi rilegge il file. Se lo neghi, l'app
continua a funzionare salvando nel browser e il profilo mostra «Accesso scaduto»: da
**Profilo → Riattiva l'accesso alla cartella** torna a scrivere nella stessa cartella,
oppure il browser lo chiede al prossimo salvataggio.

---

## Come si usa

- **Home**: le categorie. **Nuova categoria** ne crea una (nome, emoji, colore). Tieni
  premuta una categoria e trascinala per cambiare l'ordine (da tastiera: Alt + ↑/↓).
- **Categoria**: tre sezioni. *Oggetti* (quelli votati, per voto o per data), *Da provare*
  (quelli senza voto, con **Provato!** per votarli) e *Classifica* (podio e resto, migliori o
  peggiori). **Modifica** in alto cambia nome, emoji e colore o elimina la categoria; il **+**
  aggiunge un oggetto.
- **Scheda di un oggetto**: voto, i due oggetti subito sopra e subito sotto nella tua
  classifica, nota, dettagli, foto. La matita apre la modifica: nome, foto, voto a mezze stelle
  (o «?»), nota, campi liberi (Annata, Cantina, Prezzo… quello che serve a quell'oggetto),
  eliminazione.
- **Annulla**: ogni modifica mostra un messaggio in basso con «Annulla» per qualche secondo.
- **Profilo**: quante recensioni, categorie e recensioni di questo mese; cartella e stato
  del salvataggio; esportazione.

Il tasto Indietro di Android chiude prima il pannello aperto, poi torna alla schermata
precedente.

---

## Sviluppo

Serve Node.js 22.12 o più recente (lo richiede Vite 8).

```bash
npm install
npm run dev       # server di sviluppo con ricarica automatica
npm test          # test della logica (node:test)
npm run build     # build di produzione in dist/
npm run preview   # prova la build in locale, service worker compreso
```

In sviluppo il service worker non viene registrato, così non servono file vecchi dalla cache.

---

## Pubblicare con GitHub Pages

Il workflow `.github/workflows/deploy.yml`, a ogni push su `main`, esegue i test, fa la
build e pubblica `dist/` su GitHub Pages.

Da impostare una volta sola su GitHub: **Settings → Pages → Build and deployment →
Source: GitHub Actions**.

L'app è su `https://luigifederico.github.io/rating-app/`.

---

## Struttura

```
index.html              guscio dell'app: vista, pannelli, toast
vite.config.js          build; genera dist/sw.js con la lista dei file da tenere offline
public/                 manifest e icone (logo.svg è l'originale delle PNG)
src/
  main.js               avvio
  state.js              stato: dati salvati e stato dell'interfaccia
  azioni.js             cambia(): ogni modifica salva, ridisegna e si può annullare
  persistenza.js        salvataggio nel browser e nel file, confronto con il file, pulizia foto
  sw.js                 service worker (modello; vite.config.js lo completa)
  core/                 logica pura, senza DOM, coperta dai test
    costanti.js         nomi dei file, tavolozza, emoji, misure delle foto
    dati.js             forma del documento, normalizza, categorie e oggetti
    calcoli.js          elenchi, classifica, vicini, contatori, foto orfane
    sincronia.js        decidi(): scrivere, caricare o chiedere quale versione tenere
    formato.js          voti, date ('ieri', '2 sett'), conteggi, testo sicuro per l'HTML
  storage/              accesso a file e cartelle (File System Access API, IndexedDB)
  export/               zip «store-only» e «Esporta i miei dati»
  ui/
    render.js           disegna vista e pannelli; cronologia e tasto Indietro
    eventi.js           tutti gli eventi (delegati)
    riordina.js         riordino delle categorie con pressione lunga
    immagini.js         foto a schermo
    toast.js            messaggio in basso, con «Annulla»
    componenti.js       icone condivise
    viste/              home, categoria, profilo
    sheet/              scheda, modifica, categoria, conflitto
  styles/               token del design, base, layout, componenti, viste, pannelli
tests/                  node:test sulla logica di core/ e sullo zip
```

---

## Formato di `rating-data.json`

```json
{
 "versione": 1,
 "aggiornato": "2026-11-24T18:20:00.000Z",
 "categorie": [
  { "id": "cmwv0dtd3k2a", "nome": "Vini", "emoji": "🍷", "colore": "#F6D9DC" }
 ],
 "oggetti": [
  {
   "id": "omwv0dx1b7qe",
   "categoriaId": "cmwv0dtd3k2a",
   "nome": "Barolo Mascarello 2018",
   "voto": 4.5,
   "nota": "Teso e lungo, ciliegia e catrame.",
   "campi": [{ "nome": "Annata", "valore": "2018" }, { "nome": "Prezzo", "valore": "58 €" }],
   "foto": "foto/fmwv0dtdxtyci.jpg",
   "creato": "2026-11-24T18:19:41.000Z"
  }
 ]
}
```

- **`categorie`**: l'ordine dell'elenco è quello della Home.
- **`voto`**: da 0,5 a 5 a passi di mezzo punto; `null` = da provare.
- **`campi`**: liberi, oggetto per oggetto (non c'è un modello per categoria).
- **`foto`**: percorso relativo alla cartella, sempre `foto/<nome>.jpg`; `null` se non c'è.
- **`creato`**: data di aggiunta, non cambia; è la data di «ordina per data», di «ieri»,
  «2 sett» e di «questo mese».
- **`aggiornato`**: istante dell'ultimo salvataggio; serve a capire, al confronto con il file,
  chi ha modifiche che l'altro non ha.

Un file scritto a mano viene sistemato in lettura: campi mancanti, voti fuori scala, id
ripetuti e oggetti di categorie che non esistono più vengono corretti o tolti. Deve però
essere JSON valido con un elenco `categorie`: altrimenti l'app lo considera illeggibile, ne
tiene una copia (`rating-data.backup-…json`) e lo riscrive con i dati del telefono.

**Se modifichi il file a mano, cambia o togli `aggiornato`**: l'app capisce che il file è
cambiato solo da quella data (un file senza data conta sempre come cambiato). Con la data di
prima, la modifica verrebbe sovrascritta al prossimo salvataggio dal telefono.

---

## Foto

Ogni oggetto può avere una foto. Prima di salvarla l'app la riduce a **1200 px** sul lato
lungo e la scrive in JPEG come file a parte in `foto/`: il file dei dati resta leggero.
Le foto si possono aggiungere e vedere solo con una cartella collegata.

Le foto che i dati non usano più (oggetti eliminati, foto cambiate) vengono tolte
all'avvio, con prudenza: solo se nessun file della cartella le cita (né `rating-data.json`
né le copie di sicurezza), e solo se non sono state toccate negli ultimi **7 giorni**, così
non si perde la foto appena scattata da un altro dispositivo. Se uno di quei file non si
legge, la pulizia non toglie niente. Durante una sessione le foto restano tutte, così
«Annulla» le ritrova.

Collegando una cartella nuova, l'app ci copia le foto dei dati che porta con sé, se la
cartella di prima è ancora accessibile; altrimenti dice quante mancano, da copiare a mano
in `foto/`.

---

## Due dispositivi, conflitti e copie di sicurezza

L'app ricorda l'ultima versione uguale sul telefono e nel file. A ogni salvataggio e a ogni
avvio confronta: se è cambiato solo il telefono scrive il file, se è cambiato solo il file
(per esempio dal PC) lo carica, se sono cambiati entrambi chiede **quale versione tenere** e
salva l'altra accanto, come `rating-data.backup-AAAA-MM-GG-hhmmss.json`. Finché non scegli,
ogni salvataggio lo richiede: le modifiche fatte con l'app su un altro dispositivo non
vengono mai sovrascritte senza chiedere (per quelle fatte a mano, vedi sopra la nota su
`aggiornato`). Anche un `rating-data.json` illeggibile (per esempio modificato a mano con un
errore) viene conservato come copia prima di essere riscritto.

---

## Esportare

**Profilo → Esporta i miei dati** scarica `rating-app-AAAA-MM-GG.zip` con
`rating-data.json` e la cartella `foto/`: una copia da tenere dove vuoi. Le foto entrano
nello zip solo con la cartella collegata e l'accesso attivo (se è scaduto, l'app lo chiede
prima di esportare); se ne manca qualcuna, un messaggio dice quante e perché.

---

## Funziona senza cartella collegata?

Sì, tranne le foto. Senza permesso sui file l'app salva nel browser (`localStorage`) e
puoi esportare a mano. I dati restano, ma sono legati a quel browser: se disinstalli Chrome
o cancelli i dati del sito, spariscono. Per questo conviene collegare una cartella al
primo avvio.

## Browser supportati per la scrittura diretta su file

| Browser | Scrittura su file | Foto |
| --- | --- | --- |
| Chrome Android | sì | sì |
| Chrome / Edge desktop | sì | sì |
| Edge, Samsung Internet e altri su Android | dipende dalla versione | come la scrittura |
| Firefox, Safari | no — solo salvataggio nel browser ed export manuale | no |

L'app usa la scrittura su file se il browser ce l'ha: se in **Profilo** la cartella risulta
«Non disponibile in questo browser», usa Chrome.
