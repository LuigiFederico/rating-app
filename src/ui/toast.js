/* Messaggio temporaneo in basso. */

import { esc } from '../core/formato.js';

let timer = null;

export function toast(msg) {
  clearTimeout(timer);
  const el = document.getElementById('toast');
  el.innerHTML = '<div class="toast" role="status"><div class="toast-msg">' + esc(msg) + '</div></div>';
  el.hidden = false;
  timer = setTimeout(() => { el.hidden = true; }, 4000);
}
