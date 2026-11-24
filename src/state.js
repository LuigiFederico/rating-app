/* Stato dell'app: i dati persistiti più lo stato dell'interfaccia. */

import { datiVuoti } from './core/dati.js';

export const S = {
  dati: datiVuoti(),

  // navigazione
  vista: 'home',          // 'home' | 'categoria' | 'profilo'
  categoriaId: null,      // categoria aperta
  tab: 'oggetti',         // categoria: 'oggetti' | 'daProvare' | 'classifica'
  ordine: 'voto',         // oggetti: 'voto' | 'data'
  verso: 'migliori',      // classifica: 'migliori' | 'peggiori'

  // salvataggio
  dirHandle: null,
  permessoCartella: false, // readwrite concesso sulla cartella in questa sessione
  salvato: 'mai',
  scrivo: false,

  // pannelli aperti
  categoria: null,        // nuova o modifica categoria: { id (null = nuova), nome, emoji, colore, errore, eliminando }
  conflitto: null         // file e telefono diversi: quale versione tenere
};
