import { test } from 'node:test';
import assert from 'node:assert/strict';
import { categoria, oggetto, oggettiDi, perVoto, perData, daProvare, classifica, vicini, conteggio, contatori } from '../src/core/calcoli.js';

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

test('vicini: il primo sopra e il primo sotto, esclusi l\'oggetto stesso e i pari voto', () => {
  const d = dati();
  assert.deepEqual(nomi(Object.values(vicini(d, 'v', 3.5, 'lugana'))), ['chianti', 'prosecco']);
  // 4: sopra c'è barolo; chianti ed etna hanno lo stesso voto e non contano
  const v4 = vicini(d, 'v', 4, 'nuovo');
  assert.equal(v4.sopra.id, 'barolo');
  assert.equal(v4.sotto.id, 'lugana');
  assert.equal(vicini(d, 'v', 5, 'nuovo').sopra, null);
  assert.equal(vicini(d, 'v', 0.5, 'nuovo').sotto, null);
  // a parità di voto, sia sopra sia sotto, il più recente: chianti (15) prima di etna (10)
  assert.equal(vicini(d, 'v', 4.5, 'barolo').sotto.id, 'chianti');
  // le altre categorie non c'entrano
  assert.deepEqual(vicini(d, 'k', 2, 'moka'), { sopra: null, sotto: null });
});

test('conteggio separa votati e da provare', () => {
  assert.deepEqual(conteggio(dati(), 'v'), { votati: 5, daProvare: 2 });
  assert.deepEqual(conteggio(dati(), 'x'), { votati: 0, daProvare: 0 });
});

test('contatori del profilo', () => {
  assert.deepEqual(contatori(dati(), new Date(2026, 10, 24)), { recensioni: 6, categorie: 2, mese: 6 });
  assert.deepEqual(contatori(dati(), new Date(2026, 11, 1)), { recensioni: 6, categorie: 2, mese: 0 });
});
