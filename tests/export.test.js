import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { zip, crc32, dataDos } from '../src/export/zip.js';
import { nomeExport } from '../src/core/formato.js';

/* legge uno zip "store-only" dalla directory centrale: [{ name, data }] */
function leggiZip(buf) {
  const v = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const fine = buf.length - 22;
  assert.equal(v.getUint32(fine, true), 0x06054b50, 'fine della directory centrale');
  const n = v.getUint16(fine + 10, true);
  let p = v.getUint32(fine + 16, true);
  const out = [];
  for (let i = 0; i < n; i++) {
    assert.equal(v.getUint32(p, true), 0x02014b50);
    const crc = v.getUint32(p + 16, true), size = v.getUint32(p + 20, true), lung = v.getUint16(p + 28, true), loc = v.getUint32(p + 42, true);
    const name = new TextDecoder().decode(buf.subarray(p + 46, p + 46 + lung));
    assert.equal(v.getUint32(loc, true), 0x04034b50);
    const inizio = loc + 30 + v.getUint16(loc + 26, true);
    const data = buf.subarray(inizio, inizio + size);
    assert.equal(crc32(data), crc, 'crc di ' + name);
    out.push({ name, data });
    p += 46 + lung;
  }
  return out;
}

test('crc32 di riferimento', () => {
  assert.equal(crc32(new TextEncoder().encode('123456789')), 0xCBF43926);
});

test('zip con testo UTF-8 e byte di un\'immagine', async () => {
  const jpeg = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0, 16, 74, 70, 73, 70, 0, 0xFF, 0xD9]);
  const blob = zip([{ name: 'rating-data.json', data: '{"nome":"Caffè"}' }, { name: 'foto/f1.jpg', data: jpeg }]);
  assert.equal(blob.type, 'application/zip');
  const file = leggiZip(new Uint8Array(await blob.arrayBuffer()));
  assert.deepEqual(file.map((f) => f.name), ['rating-data.json', 'foto/f1.jpg']);
  assert.equal(new TextDecoder().decode(file[0].data), '{"nome":"Caffè"}');
  assert.deepEqual([...file[1].data], [...jpeg]);
});

test('lo zip si apre con un programma vero (python zipfile)', async (t) => {
  let python = null;
  for (const cmd of ['python3', 'python']) { try { execFileSync(cmd, ['--version']); python = cmd; break; } catch (e) {} }
  if (!python) { t.skip('python non disponibile'); return; }
  const dir = mkdtempSync(join(tmpdir(), 'zip-'));
  try {
    const blob = zip([{ name: 'rating-data.json', data: '{"a":1}' }, { name: 'foto/x.jpg', data: new Uint8Array([1, 2, 3]) }], 'application/zip', new Date(2026, 10, 24, 18, 20, 5));
    writeFileSync(join(dir, 'a.zip'), Buffer.from(await blob.arrayBuffer()));
    const out = execFileSync(python, ['-I', '-c', 'import sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); print(z.testzip(), z.namelist(), z.read("foto/x.jpg").hex(), z.getinfo("foto/x.jpg").date_time)', join(dir, 'a.zip')]).toString().trim();
    assert.equal(out, "None ['rating-data.json', 'foto/x.jpg'] 010203 (2026, 11, 24, 18, 20, 4)");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('nomeExport usa la data locale', () => {
  assert.equal(nomeExport(new Date(2026, 10, 24, 23, 30)), 'rating-app-2026-11-24.zip');
});

test('dataDos: ora locale a passi di 2 secondi', () => {
  assert.deepEqual(dataDos(new Date(1980, 0, 1, 0, 0, 0)), { ora: 0, giorno: (1 << 5) | 1 });
  const d = dataDos(new Date(2026, 10, 24, 18, 20, 5));
  assert.equal(d.ora, (18 << 11) | (20 << 5) | 2);
  assert.equal(d.giorno, (46 << 9) | (11 << 5) | 24);
});
