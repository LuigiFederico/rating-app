import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esc, voto, dataRelativa, dataBreve, testoConteggio, orarioBreve } from '../src/core/formato.js';

const oggi = new Date(2026, 10, 24, 15, 0); // 24 novembre 2026, ora locale
const giorniFa = (n, ora = 10) => new Date(2026, 10, 24 - n, ora).toISOString();

test('esc protegge i caratteri speciali dell\'HTML', () => {
  assert.equal(esc('<b>"Ca\' dei Frati" & co</b>'), '&lt;b&gt;&quot;Ca&#39; dei Frati&quot; &amp; co&lt;/b&gt;');
  assert.equal(esc(null), '');
});

test('voto usa la virgola e niente decimali inutili', () => {
  assert.equal(voto(4.5), '4,5');
  assert.equal(voto(4), '4');
  assert.equal(voto(0.5), '0,5');
});

test('dataRelativa segue le scritte del design', () => {
  assert.equal(dataRelativa(giorniFa(0), oggi), 'oggi');
  assert.equal(dataRelativa(giorniFa(1, 23), oggi), 'ieri');
  assert.equal(dataRelativa(giorniFa(3), oggi), '3 giorni');
  assert.equal(dataRelativa(giorniFa(6), oggi), '6 giorni');
  assert.equal(dataRelativa(giorniFa(7), oggi), '1 sett');
  assert.equal(dataRelativa(giorniFa(14), oggi), '2 sett');
  assert.equal(dataRelativa(giorniFa(27), oggi), '3 sett');
  assert.equal(dataRelativa(new Date(2026, 7, 10).toISOString(), oggi), 'ago');
  assert.equal(dataRelativa(new Date(2025, 7, 10).toISOString(), oggi), 'ago 2025');
});

test('dataRelativa conta i giorni di calendario, non le 24 ore', () => {
  // ieri alle 23 e oggi alle 15: meno di 24 ore, ma è "ieri"
  assert.equal(dataRelativa(new Date(2026, 10, 23, 23, 0).toISOString(), oggi), 'ieri');
  // una data nel futuro (orologio spostato) non diventa negativa
  assert.equal(dataRelativa(new Date(2026, 10, 26).toISOString(), oggi), 'oggi');
});

test('dataBreve aggiunge l\'anno solo se diverso', () => {
  assert.equal(dataBreve(new Date(2026, 10, 24).toISOString(), oggi), '24 nov');
  assert.equal(dataBreve(new Date(2025, 0, 3).toISOString(), oggi), '3 gen 2025');
});

test('testoConteggio è neutro e salta le parti a zero', () => {
  assert.equal(testoConteggio(24, 6), '24 voti · 6 da provare');
  assert.equal(testoConteggio(1, 0), '1 voto');
  assert.equal(testoConteggio(0, 2), '2 da provare');
  assert.equal(testoConteggio(0, 0), 'Ancora vuota');
});

test('orarioBreve ha ore e minuti a due cifre', () => {
  assert.equal(orarioBreve(new Date(2026, 10, 24, 9, 5).toISOString()), 'alle 09:05');
});
