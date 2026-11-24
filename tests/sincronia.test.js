import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decidi, timbro } from '../src/core/sincronia.js';

const T0 = '2026-11-20T10:00:00.000Z', T1 = '2026-11-21T10:00:00.000Z', T2 = '2026-11-22T10:00:00.000Z';

test('nessuno è cambiato dall\'ultimo allineamento: niente da fare', () => {
  assert.equal(decidi(T0, T0, T0), 'niente');
});

test('solo il telefono è cambiato: si scrive il file', () => {
  assert.equal(decidi(T1, T0, T0), 'scrivi');
});

test('solo il file è cambiato (altro dispositivo): si carica', () => {
  assert.equal(decidi(T0, T1, T0), 'carica');
  // anche se il file è "più vecchio" del telefono: conta che sia diverso dall'ultimo allineamento
  assert.equal(decidi(T0, '2026-01-01T00:00:00.000Z', T0), 'carica');
});

test('entrambi cambiati: conflitto, anche dopo "Decidi più tardi" e altre modifiche', () => {
  assert.equal(decidi(T2, T1, T0), 'conflitto');
  // l'allineamento non si sposta finché non si sceglie: la modifica successiva chiede di nuovo
  assert.equal(decidi('2026-11-23T10:00:00.000Z', T1, T0), 'conflitto');
});

test('entrambi cambiati ma arrivati alla stessa versione: basta allineare', () => {
  assert.equal(decidi(T1, T1, T0), 'allinea');
});

test('niente salvato su questo telefono: si carica il file, non si propone una versione vuota', () => {
  assert.equal(decidi('', T1, ''), 'carica');
  assert.equal(decidi('', T1, T0), 'carica');
  assert.equal(decidi('', null, ''), 'niente');
});

test('il file non c\'è: si scrive se il telefono ha dati', () => {
  assert.equal(decidi(T0, null, T0), 'scrivi');   // file cancellato dalla cartella
  assert.equal(decidi(T1, null, ''), 'scrivi');
});

test('file senza data (vecchio o scritto a mano): è "cambiato"', () => {
  assert.equal(decidi(T1, '', T0), 'conflitto');
  assert.equal(decidi(T0, '', T0), 'carica');
  // anche quando non c'è mai stato un allineamento
  assert.equal(decidi(T1, '', ''), 'conflitto');
  assert.equal(decidi('', '', ''), 'carica');
});

test('timbro usa l\'ora locale e i secondi', () => {
  assert.equal(timbro(new Date(2026, 10, 24, 0, 30, 5)), '2026-11-24-003005');
});
