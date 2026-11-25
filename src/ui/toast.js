/* Messaggio temporaneo in basso, con pulsante "Annulla" opzionale. */

import { esc } from '../core/formato.js';

let timer = null;

export function toast(msg, annulla) {
  clearTimeout(timer);
  const el = document.getElementById('toast');
  el.innerHTML = '<div class="toast" role="status">'
    + '<div class="toast-msg">' + esc(msg) + '</div>'
    + (annulla ? '<button id="undo" class="toast-undo">Annulla</button>' : '')
    + '</div>';
  el.hidden = false;
  if (annulla) document.getElementById('undo').onclick = () => { nascondiToast(); annulla(); };
  timer = setTimeout(nascondiToast, annulla ? 6000 : 4000);
}

export function nascondiToast() {
  clearTimeout(timer);
  document.getElementById('toast').hidden = true;
}
