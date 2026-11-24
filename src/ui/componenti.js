/* Icone e pezzi di markup condivisi tra le viste. Icone a tratto, come nel design. */

const svg = (w, path, sw = 2.2) => '<svg width="' + w + '" height="' + w + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + sw
  + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + '</svg>';

export const ICONA = {
  chiudi: svg(22, '<path d="M6 6l12 12M18 6L6 18"></path>'),
  indietro: svg(22, '<path d="M15 6l-6 6 6 6"></path>', 2.4),
  matita: (w = 22) => svg(w, '<path d="M4 20h4L19 9l-4-4L4 16z"></path><path d="M13.5 6.5l4 4"></path>'),
  piu: (w = 15, sw = 2.8) => svg(w, '<path d="M12 5v14M5 12h14"></path>', sw),
  utente: (w = 20) => svg(w, '<circle cx="12" cy="8.5" r="3.8"></circle><path d="M4.5 20c1-4 3.9-6.2 7.5-6.2s6.5 2.2 7.5 6.2"></path>', 2),
  info: svg(20, '<circle cx="12" cy="12" r="9"></circle><path d="M12 8v5M12 16.5v.5"></path>', 2)
};
