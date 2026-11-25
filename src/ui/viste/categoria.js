/* Una categoria: Oggetti (votati, per voto o data), Da provare, Classifica (podio e resto). */

import { S } from '../../state.js';
import { esc, voto, dataRelativa, testoConteggio } from '../../core/formato.js';
import { categoria, oggettiDi, perVoto, perData, daProvare, classifica, conteggio } from '../../core/calcoli.js';
import { ICONA } from '../componenti.js';

/* miniatura di un oggetto: l'emoji della categoria sul suo colore */
function miniatura(c) {
  return '<span class="mini" style="background:' + esc(c.colore) + '" aria-hidden="true">' + esc(c.emoji) + '</span>';
}

/* sotto il nome: i primi due campi compilati e quando è stato aggiunto ('2019 · Vietti · ieri') */
function sottotitolo(o) {
  const valori = o.campi.map((f) => f.valore).filter(Boolean).slice(0, 2);
  return esc(valori.concat(dataRelativa(o.creato)).join(' · '));
}

function riga(c, o) {
  return '<button class="riga" data-oggetto="' + esc(o.id) + '">' + miniatura(c)
    + '<span class="riga-testi"><span class="riga-nome">' + esc(o.nome) + '</span><span class="riga-sub">' + sottotitolo(o) + '</span></span>'
    + '<span class="riga-voto titoli"><span class="nascosto">voto </span>' + voto(o.voto) + '</span></button>';
}

function rigaDaProvare(c, o) {
  return '<div class="riga">' + miniatura(c)
    + '<button class="riga-testi riga-apri" data-oggetto="' + esc(o.id) + '"><span class="riga-nome">' + esc(o.nome) + '</span><span class="riga-sub">' + sottotitolo(o) + '</span></button>'
    + '<button class="provato" data-provato="' + esc(o.id) + '">Provato!</button></div>';
}

const chip = (attivo, attr, testo) => '<button class="chip" ' + attr + ' aria-pressed="' + attivo + '">' + testo + '</button>';

function tabOggetti(c, lista) {
  const votati = S.ordine === 'data' ? perData(lista) : perVoto(lista);
  if (!votati.length) return vuoto('Nessun voto ancora', 'Aggiungi la prima cosa che hai provato con il +.');
  return '<div class="ordina"><span>Ordina per</span>'
    + chip(S.ordine !== 'data', 'data-ordine="voto"', 'Voto') + chip(S.ordine === 'data', 'data-ordine="data"', 'Data') + '</div>'
    + '<div class="righe">' + votati.map((o) => riga(c, o)).join('') + '</div>';
}

function tabDaProvare(c, lista) {
  const l = daProvare(lista);
  if (!l.length) return vuoto('Niente da provare', 'Aggiungi senza voto (con «?») quello che vuoi provare: lo ritrovi qui.');
  return '<div class="righe">' + l.map((o) => rigaDaProvare(c, o)).join('') + '</div>';
}

/* podio: secondo, primo, terzo (come nel design); solo le posizioni che ci sono */
function podio(primi) {
  const posto = (o, n) => !o ? '<div class="podio-posto"></div>'
    : '<button class="podio-posto" data-oggetto="' + esc(o.id) + '"><span class="podio-nome">' + esc(o.nome) + '</span>'
      + '<span class="podio-gradino podio-gradino--' + n + '"><span class="titoli podio-n">' + n + '</span><span class="podio-voto">' + voto(o.voto) + '</span></span></button>';
  return '<div class="podio">' + posto(primi[1], 2) + posto(primi[0], 1) + posto(primi[2], 3) + '</div>';
}

function tabClassifica(c) {
  const lista = classifica(S.dati, c.id, S.verso);
  if (!lista.length) return vuoto('Ancora nessuna classifica', 'Vota qualcosa e qui vedrai il tuo podio.');
  const resto = lista.slice(3);
  return podio(lista.slice(0, 3))
    + '<div class="ordina">' + chip(S.verso !== 'peggiori', 'data-verso="migliori"', 'Migliori') + chip(S.verso === 'peggiori', 'data-verso="peggiori"', 'Peggiori') + '</div>'
    + (resto.length ? '<ol class="righe classifica" start="4">' + resto.map((o) => '<li>' + riga(c, o) + '</li>').join('') + '</ol>' : '');
}

function vuoto(titolo, testo) {
  return '<div class="vuoto"><p class="vuoto-titolo titoli">' + titolo + '</p><p class="vuoto-testo">' + testo + '</p></div>';
}

const segmento = (tab, testo) => '<button class="seg" data-tab="' + tab + '" aria-pressed="' + (S.tab === tab) + '">' + testo + '</button>';

export function vistaCategoria() {
  const c = categoria(S.dati, S.categoriaId);
  const lista = oggettiDi(S.dati, c.id);
  const n = conteggio(S.dati, c.id);
  const corpo = S.tab === 'daProvare' ? tabDaProvare(c, lista) : S.tab === 'classifica' ? tabClassifica(c) : tabOggetti(c, lista);
  return '<div class="categoria">'
    + '<header class="cat-testa" style="background:' + esc(c.colore) + '">'
    + '<div class="cat-barra"><button class="tondo cat-indietro" data-indietro="1" aria-label="Indietro">' + ICONA.indietro + '</button>'
    + '<button class="pillola" id="modificaCategoria">' + ICONA.matita(16) + 'Modifica</button></div>'
    + '<div class="cat-titolo"><span class="cat-emoji" aria-hidden="true">' + esc(c.emoji) + '</span>'
    + '<div><h1 class="titoli">' + esc(c.nome) + '</h1><p class="cat-conta">' + testoConteggio(n.votati, n.daProvare) + '</p></div></div>'
    + '<div class="segmenti" role="group" aria-label="Sezione">' + segmento('oggetti', 'Oggetti') + segmento('daProvare', 'Da provare' + (n.daProvare ? ' · ' + n.daProvare : ''))
    + segmento('classifica', 'Classifica') + '</div>'
    + '</header>'
    + '<div class="cat-corpo">' + corpo + '</div>'
    + '<button class="fab" id="aggiungi" aria-label="Aggiungi a ' + esc(c.nome) + '">' + ICONA.piu(26, 2.6) + '</button>'
    + '</div>';
}
