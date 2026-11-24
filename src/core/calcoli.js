/* Elenchi, classifiche e contatori calcolati dai dati. Funzioni pure. */

export function categoria(dati, id) {
  return dati.categorie.find((c) => c.id === id) || null;
}

export function oggetto(dati, id) {
  return dati.oggetti.find((o) => o.id === id) || null;
}

export function oggettiDi(dati, categoriaId) {
  return dati.oggetti.filter((o) => o.categoriaId === categoriaId);
}

const piuRecente = (a, b) => (a.creato < b.creato ? 1 : a.creato > b.creato ? -1 : 0);

/* votati, dal voto più alto; a parità il più recente */
export function perVoto(lista) {
  return lista.filter((o) => o.voto !== null).sort((a, b) => b.voto - a.voto || piuRecente(a, b));
}

/* votati, dal più recente */
export function perData(lista) {
  return lista.filter((o) => o.voto !== null).sort(piuRecente);
}

/* senza voto ("?"), dal più recente */
export function daProvare(lista) {
  return lista.filter((o) => o.voto === null).sort(piuRecente);
}

/* Classifica di una categoria: 'migliori' dal voto più alto, 'peggiori' dal più basso
   (a parità, in entrambi i casi, il più recente prima). */
export function classifica(dati, categoriaId, verso = 'migliori') {
  const lista = oggettiDi(dati, categoriaId).filter((o) => o.voto !== null);
  const segno = verso === 'peggiori' ? -1 : 1;
  return lista.sort((a, b) => segno * (b.voto - a.voto) || piuRecente(a, b));
}

/* Chi sta subito sopra e subito sotto nella tua classifica della categoria (null se nessuno), per un
   oggetto con voto v e data di creazione 'creato': stesso ordine della classifica, quindi a parità
   di voto conta la data. escludiId: l'oggetto che si sta votando (la sua posizione vecchia non conta). */
export function vicini(dati, categoriaId, v, escludiId, creato) {
  const io = { id: escludiId, voto: v, creato };
  const lista = perVoto(oggettiDi(dati, categoriaId).filter((o) => o.id !== escludiId).concat(io));
  const i = lista.indexOf(io);
  return { sopra: lista[i - 1] || null, sotto: lista[i + 1] || null };
}

export function conteggio(dati, categoriaId) {
  const lista = oggettiDi(dati, categoriaId);
  const votati = lista.filter((o) => o.voto !== null).length;
  return { votati, daProvare: lista.length - votati };
}

/* Profilo: recensioni (oggetti votati), categorie, recensioni create nel mese solare di oggi */
export function contatori(dati, oggi = new Date()) {
  const votati = dati.oggetti.filter((o) => o.voto !== null);
  const mese = votati.filter((o) => {
    const d = new Date(o.creato);
    return d.getFullYear() === oggi.getFullYear() && d.getMonth() === oggi.getMonth();
  }).length;
  return { recensioni: votati.length, categorie: dati.categorie.length, mese };
}
