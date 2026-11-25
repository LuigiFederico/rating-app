export const FILENAME = 'rating-data.json';
export const CARTELLA_FOTO = 'foto';
export const LS_KEY = 'rating-app-data';
export const LS_SYNC = 'rating-app-sync'; // 'aggiornato' dell'ultima versione uguale sul telefono e nel file

export const VERSIONE_DATI = 1;

/* lato lungo massimo delle foto salvate, in pixel, e qualità JPEG */
export const LATO_FOTO = 1200;
export const QUALITA_FOTO = 0.85;
/* una foto non citata dai dati si toglie solo dopo questi giorni: può essere di un altro dispositivo o di una modifica in corso */
export const GIORNI_ORFANE = 7;

/* tavolozza delle categorie: i pastelli del design, più tre dello stesso tono */
export const PALETTE = ['#F6D9DC', '#D7EADC', '#EBDCC8', '#FBE8B4', '#DCE1F3', '#E6DCF0', '#D4EAEA', '#F8DDC9'];

/* emoji proposte nel pannello categoria (se ne può scrivere un'altra) */
export const EMOJI = ['🍷', '🍺', '☕', '🍵', '🧀', '🍝', '🍕', '🍣', '🍫', '🍰', '🍦', '🥐', '🧴', '💄', '🌸', '📚', '🎬', '🎧', '🎮', '✈️', '🏨', '👟', '🍸', '⭐'];

export const MESI_BREVI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
