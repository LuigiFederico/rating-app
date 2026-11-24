import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  datiVuoti, normalizza, votoValido, nomeBackup, erroreNomeCategoria, coloreLibero,
  aggiungiCategoria, modificaCategoria, eliminaCategoria, spostaCategoria,
  bozzaNuova, bozzaDaOggetto, bozzaPronta, salvaOggetto, eliminaOggetto, fotoCitate
} from '../src/core/dati.js';
import { PALETTE } from '../src/core/costanti.js';

function conVini() {
  const d = datiVuoti();
  const c = aggiungiCategoria(d, { nome: 'Vini', emoji: '🍷', colore: PALETTE[0] });
  return { d, c };
}

test('datiVuoti parte senza categorie né oggetti', () => {
  const d = datiVuoti();
  assert.equal(d.versione, 1);
  assert.deepEqual(d.categorie, []);
  assert.deepEqual(d.oggetti, []);
  assert.ok(!isNaN(Date.parse(d.aggiornato)));
});

test('votoValido accetta solo mezzi punti tra 0,5 e 5', () => {
  assert.equal(votoValido(4.5), 4.5);
  assert.equal(votoValido('3'), 3);
  assert.equal(votoValido(0.5), 0.5);
  assert.equal(votoValido(5), 5);
  for (const v of [null, undefined, '', ' ', 0, 5.5, 4.2, -1, 'abc', NaN, true, [3]]) assert.equal(votoValido(v), null, String(v));
});

test('normalizza sistema un documento incompleto o rovinato', () => {
  assert.deepEqual(normalizza(null).categorie, []);
  const d = normalizza({
    aggiornato: '2026-11-01T10:00:00.000Z',
    categorie: [{ id: 'c1', nome: 'Vini', emoji: '🍷' }, { nome: 'senza id' }],
    oggetti: [
      { id: 'o1', categoriaId: 'c1', nome: 'Barolo', voto: 4.2, campi: [{ nome: 'Annata', valore: 2018 }, { valore: 'senza nome' }], creato: 'non è una data' },
      { id: 'o2', categoriaId: 'sparita', nome: 'Orfano' },
      { categoriaId: 'c1', nome: 'senza id' }
    ]
  });
  assert.equal(d.aggiornato, '2026-11-01T10:00:00.000Z');
  assert.deepEqual(d.categorie, [{ id: 'c1', nome: 'Vini', emoji: '🍷', colore: PALETTE[0] }]);
  assert.equal(d.oggetti.length, 1);
  const o = d.oggetti[0];
  assert.equal(o.voto, null);                       // 4,2 non è un mezzo punto
  assert.deepEqual(o.campi, [{ nome: 'Annata', valore: '2018' }]); // il numero diventa testo
  assert.equal(o.nota, '');
  assert.equal(o.foto, null);
  assert.equal(o.creato, new Date(0).toISOString());
});

test('normalizza: id numerici, id ripetuti, date con fuso e voti non numerici', () => {
  const d = normalizza({
    categorie: [{ id: 1, nome: 'Vini' }, { id: 1, nome: 'Doppione' }, { id: 2, nome: 123 }],
    oggetti: [
      { id: 'a', categoriaId: 1, nome: 'Barolo', voto: '4', creato: '2026-11-24T23:00:00+05:00' },
      { id: 'a', categoriaId: 1, nome: 'Doppione' },
      { id: 'b', categoriaId: '2', nome: 'X', voto: true }
    ]
  });
  assert.deepEqual(d.categorie.map((c) => [c.id, c.nome]), [['1', 'Vini'], ['2', '123']]);
  assert.deepEqual(d.oggetti.map((o) => [o.id, o.categoriaId, o.nome, o.voto]), [['a', '1', 'Barolo', 4], ['b', '2', 'X', null]]);
  assert.equal(d.oggetti[0].creato, '2026-11-24T18:00:00.000Z');
});

test('normalizza conserva un documento già in forma', () => {
  const { d, c } = conVini();
  salvaOggetto(d, { ...bozzaNuova(c.id), nome: 'Barolo', voto: 4.5, nota: 'Teso', campi: [{ nome: 'Annata', valore: '2018' }], foto: 'foto/x.jpg' });
  assert.deepEqual(normalizza(JSON.parse(JSON.stringify(d))), d);
});

test('nomeBackup mette il timbro prima di .json', () => {
  assert.equal(nomeBackup('2026-11-24-143205'), 'rating-data.backup-2026-11-24-143205.json');
});

test('erroreNomeCategoria vuole un nome non vuoto e non ripetuto', () => {
  const { d, c } = conVini();
  assert.equal(erroreNomeCategoria(d, '  ', null), 'Scrivi un nome.');
  assert.equal(erroreNomeCategoria(d, ' vini ', null), 'Esiste già una categoria con questo nome.');
  assert.equal(erroreNomeCategoria(d, 'Vini', c.id), '');   // è lei stessa
  assert.equal(erroreNomeCategoria(d, 'Caffè', null), '');
});

test('coloreLibero prende il primo colore non usato', () => {
  const { d } = conVini();
  assert.equal(coloreLibero(d), PALETTE[1]);
  PALETTE.slice(1).forEach((colore, i) => aggiungiCategoria(d, { nome: 'C' + i, emoji: '', colore }));
  // tutti usati: si ricomincia dal giro, in base a quante categorie ci sono
  assert.equal(coloreLibero(d), PALETTE[0]);
  aggiungiCategoria(d, { nome: 'Nona', emoji: '', colore: PALETTE[0] });
  assert.equal(coloreLibero(d), PALETTE[1]);
});

test('aggiungi e modifica categoria tolgono gli spazi dal nome', () => {
  const { d, c } = conVini();
  assert.equal(c.nome, 'Vini');
  assert.match(c.id, /^c/);
  modificaCategoria(d, c.id, { nome: ' Vini rossi ', emoji: '🍇', colore: PALETTE[2] });
  assert.deepEqual(d.categorie[0], { id: c.id, nome: 'Vini rossi', emoji: '🍇', colore: PALETTE[2] });
});

test('eliminaCategoria toglie anche i suoi oggetti', () => {
  const { d, c } = conVini();
  const altra = aggiungiCategoria(d, { nome: 'Caffè', emoji: '☕', colore: PALETTE[1] });
  salvaOggetto(d, { ...bozzaNuova(c.id), nome: 'A' });
  salvaOggetto(d, { ...bozzaNuova(c.id), nome: 'B' });
  salvaOggetto(d, { ...bozzaNuova(altra.id), nome: 'C' });
  assert.equal(eliminaCategoria(d, c.id), 2);
  assert.deepEqual(d.categorie.map((x) => x.nome), ['Caffè']);
  assert.deepEqual(d.oggetti.map((x) => x.nome), ['C']);
});

test('spostaCategoria cambia l\'ordine della Home', () => {
  const d = datiVuoti();
  const [a, b, c] = ['A', 'B', 'C'].map((nome) => aggiungiCategoria(d, { nome, emoji: '', colore: '' }));
  spostaCategoria(d, a.id, 2);
  assert.deepEqual(d.categorie.map((x) => x.nome), ['B', 'C', 'A']);
  spostaCategoria(d, a.id, 0);
  assert.deepEqual(d.categorie.map((x) => x.nome), ['A', 'B', 'C']);
  spostaCategoria(d, c.id, 99);
  assert.deepEqual(d.categorie.map((x) => x.nome), ['A', 'B', 'C']);
  spostaCategoria(d, 'nessuna', 0);
  assert.deepEqual(d.categorie.map((x) => x.id), [a.id, b.id, c.id]);
});

test('salvaOggetto crea con data di creazione e scarta i campi senza nome', () => {
  const { d, c } = conVini();
  const ora = new Date('2026-11-24T10:00:00.000Z');
  const b = { ...bozzaNuova(c.id), nome: ' Barolo ', voto: 4, nota: ' Teso ', campi: [{ nome: ' Annata ', valore: ' 2018 ' }, { nome: ' ', valore: 'x' }] };
  assert.ok(bozzaPronta(b));
  const o = salvaOggetto(d, b, ora);
  assert.match(o.id, /^o/);
  assert.deepEqual({ ...o, id: '' }, { id: '', categoriaId: c.id, nome: 'Barolo', voto: 4, nota: 'Teso', campi: [{ nome: 'Annata', valore: '2018' }], foto: null, creato: ora.toISOString() });
});

test('salvaOggetto aggiorna senza toccare la data di creazione', () => {
  const { d, c } = conVini();
  const o = salvaOggetto(d, { ...bozzaNuova(c.id), nome: 'Barolo' }, new Date('2026-01-01T00:00:00.000Z'));
  const b = bozzaDaOggetto(o);
  b.voto = 3.5; b.campi.push({ nome: 'Dove', valore: 'Alba' });
  assert.equal(o.campi.length, 0);                  // la bozza è una copia
  salvaOggetto(d, b, new Date('2026-11-24T00:00:00.000Z'));
  assert.equal(d.oggetti.length, 1);
  assert.equal(d.oggetti[0].voto, 3.5);
  assert.deepEqual(d.oggetti[0].campi, [{ nome: 'Dove', valore: 'Alba' }]);
  assert.equal(d.oggetti[0].creato, '2026-01-01T00:00:00.000Z');
});

test('salvaOggetto non resuscita un oggetto o una categoria eliminati', () => {
  const { d, c } = conVini();
  const o = salvaOggetto(d, { ...bozzaNuova(c.id), nome: 'Barolo' });
  const b = bozzaDaOggetto(o);
  eliminaOggetto(d, o.id);
  assert.equal(salvaOggetto(d, b), null);
  eliminaCategoria(d, c.id);
  assert.equal(salvaOggetto(d, { ...bozzaNuova(c.id), nome: 'Nuovo' }), null);
  assert.equal(d.oggetti.length, 0);
});

test('bozzaPronta vuole un nome', () => {
  assert.equal(bozzaPronta({ ...bozzaNuova('c'), nome: '   ' }), false);
});

test('eliminaOggetto e fotoCitate', () => {
  const { d, c } = conVini();
  const a = salvaOggetto(d, { ...bozzaNuova(c.id), nome: 'A', foto: 'foto/a.jpg' });
  salvaOggetto(d, { ...bozzaNuova(c.id), nome: 'B' });
  assert.deepEqual([...fotoCitate(d)], ['foto/a.jpg']);
  eliminaOggetto(d, a.id);
  assert.deepEqual(d.oggetti.map((o) => o.nome), ['B']);
  assert.equal(fotoCitate(d).size, 0);
});
