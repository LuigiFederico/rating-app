/* Stato dell'app: i dati persistiti più lo stato dell'interfaccia. */

import { datiVuoti } from './core/dati.js';

export const S = {
  dati: datiVuoti(),

  // navigazione
  vista: 'home',          // 'home' | 'categoria' | 'profilo'
  categoriaId: null,      // categoria aperta

  // salvataggio
  dirHandle: null,
  permessoCartella: false, // readwrite concesso sulla cartella in questa sessione
  salvato: 'mai',
  scrivo: false,

  // pannelli aperti
  conflitto: null         // file e telefono diversi: quale versione tenere
};
