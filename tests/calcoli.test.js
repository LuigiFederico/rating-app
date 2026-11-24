import { test } from 'node:test';
import assert from 'node:assert/strict';
import { categoria, oggetto, oggettiDi, perVoto, perData, daProvare, classifica, vicini, conteggio, contatori, misureRidotte, fotoOrfane } from '../src/core/calcoli.js';

/* due categorie; creato in ordine crescente di giorno di novembre */
function dati() {
  const o = (id, cat, voto, giorno) => ({ id, categoriaId: cat, nome: id, voto, nota: '', campi: [], foto: null, creato: new Date(2026, 10, giorno, 12).toISOString() });
  return {
    categorie: [{ id: 'v', nome: 'Vini' }, { id: 'k', nome: 'Caffè' }],
    oggetti: [
      o('barolo', 'v', 4.5, 20), o('etna', 'v', 4, 10), o('lugana', 'v', 3.5, 21),
      o('prosecco', 'v', 3, 1), o('chianti', 'v', 4, 15), o('timorasso', 'v', null, 22),
      o('etna-bianco', 'v', null, 5), o('moka', 'k', 2, 23)
    ]
  };
}
const nomi = (l) => l.map((o) => o.id);

test('categoria, oggetto e oggettiDi trovano per id', () => {
  const d = dati();
  assert.equal(categoria(d, 'k').nome, 'Caffè');
  assert.equal(categoria(d, 'x'), null);
  assert.equal(oggetto(d, 'moka').voto, 2);
  assert.equal(oggetto(d, 'x'), null);
  assert.equal(oggettiDi(d, 'k').length, 1);
});

test('perVoto: dal più alto, a parità il più recente; niente da provare', () => {
  assert.deepEqual(nomi(perVoto(oggettiDi(dati(), 'v'))), ['barolo', 'chianti', 'etna', 'lugana', 'prosecco']);
});

test('perData: votati dal più recente', () => {
  assert.deepEqual(nomi(perData(oggettiDi(dati(), 'v'))), ['lugana', 'barolo', 'chianti', 'etna', 'prosecco']);
});

test('daProvare: solo senza voto, dal più recente', () => {
  assert.deepEqual(nomi(daProvare(oggettiDi(dati(), 'v'))), ['timorasso', 'etna-bianco']);
});

test('classifica migliori e peggiori', () => {
  const d = dati();
  assert.deepEqual(nomi(classifica(d, 'v')).slice(0, 3), ['barolo', 'chianti', 'etna']);
  assert.deepEqual(nomi(classifica(d, 'v', 'peggiori')).slice(0, 3), ['prosecco', 'lugana', 'chianti']);
  assert.deepEqual(nomi(classifica(d, 'k')), ['moka']);
  assert.deepEqual(classifica({ categorie: [], oggetti: [] }, 'v'), []);
});

test('vicini: chi sta subito sopra e subito sotto, nell\'ordine della classifica', () => {
  const d = dati();
  const nov = (g) => new Date(2026, 10, g, 12).toISOString();
  // lugana rivotata 3,5 resta al suo posto: sopra etna (4, più vecchio dei 4), sotto prosecco
  assert.deepEqual(nomi(Object.values(vicini(d, 'v', 3.5, 'lugana', nov(21)))), ['etna', 'prosecco']);
  // un nuovo 4, il più recente: è il primo dei 4 (sopra barolo, sotto chianti, anche se ha lo stesso voto)
  assert.deepEqual(nomi(Object.values(vicini(d, 'v', 4, 'nuovo', nov(24)))), ['barolo', 'chianti']);
  // un 4 più vecchio di tutti: è l'ultimo dei 4 (sopra etna, sotto lugana)
  assert.deepEqual(nomi(Object.values(vicini(d, 'v', 4, 'nuovo', nov(1)))), ['etna', 'lugana']);
  assert.equal(vicini(d, 'v', 5, 'nuovo', nov(24)).sopra, null);
  assert.equal(vicini(d, 'v', 0.5, 'nuovo', nov(24)).sotto, null);
  // l'unico altro ha lo stesso voto: non si dice "il tuo migliore e il tuo peggiore" insieme
  const due = { categorie: [{ id: 'z' }], oggetti: [{ id: 'a', categoriaId: 'z', voto: 4, creato: nov(1) }] };
  assert.deepEqual(nomi(Object.values(vicini(due, 'z', 4, 'nuovo', nov(24))).filter(Boolean)), ['a']);
  // gli oggetti da provare e le altre categorie non c'entrano
  assert.deepEqual(vicini(d, 'k', 2, 'moka', nov(23)), { sopra: null, sotto: null });
});

test('conteggio separa votati e da provare', () => {
  assert.deepEqual(conteggio(dati(), 'v'), { votati: 5, daProvare: 2 });
  assert.deepEqual(conteggio(dati(), 'x'), { votati: 0, daProvare: 0 });
});

test('contatori del profilo', () => {
  assert.deepEqual(contatori(dati(), new Date(2026, 10, 24)), { recensioni: 6, categorie: 2, mese: 6 });
  assert.deepEqual(contatori(dati(), new Date(2026, 11, 1)), { recensioni: 6, categorie: 2, mese: 0 });
});

test('misureRidotte: lato lungo a 1200, proporzioni mantenute, mai ingrandite', () => {
  assert.deepEqual(misureRidotte(4032, 3024), { w: 1200, h: 900 });   // foto orizzontale del telefono
  assert.deepEqual(misureRidotte(3024, 4032), { w: 900, h: 1200 });   // verticale
  assert.deepEqual(misureRidotte(800, 600), { w: 800, h: 600 });      // già piccola
  assert.deepEqual(misureRidotte(5000, 2), { w: 1200, h: 1 });        // mai zero
});

test('fotoOrfane: solo .jpg non citate e vecchie di almeno 7 giorni', () => {
  const ora = Date.UTC(2026, 10, 24);
  const giorni = (n) => ora - n * 86400000;
  const foto = [
    { nome: 'citata.jpg', modificato: giorni(30) },
    { nome: 'vecchia.jpg', modificato: giorni(8) },
    { nome: 'recente.jpg', modificato: giorni(2) },   // forse di un altro dispositivo o di una modifica in corso
    { nome: 'appunti.txt', modificato: giorni(30) }    // non è una foto dell'app
  ];
  assert.deepEqual(fotoOrfane(foto, new Set(['foto/citata.jpg']), ora), ['vecchia.jpg']);
  assert.deepEqual(fotoOrfane([], new Set(), ora), []);
});
