/* Rating app — PWA
   Dati in rating-data.json e foto in foto/, scritti direttamente nella cartella scelta
   tramite File System Access API (Chrome Android / desktop).
   Fallback: localStorage + export manuale. */

import './styles/index.css';

// in sviluppo niente service worker: servirebbe file vecchi dalla cache
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
