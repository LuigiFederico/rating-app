/* Riordino delle tile della Home: tieni premuto, poi trascina (dito o mouse); da tastiera Alt+↑/↓.
   I listener stanno sul contenitore della vista, che non viene ridisegnato. */

const ATTESA = 400;  // ms di pressione prima che la tile si stacchi
const SOGLIA = 8;    // px di movimento prima del tempo: è uno scorrimento, non un riordino

/* sposta(id, posizione): chiamata quando una tile cambia posto */
export function collegaRiordino(vista, sposta) {
  let g = null;           // pressione in corso: { tile, id, pid, x, y, top0, timer, attivo }
  let bloccaClic = false; // il clic che segue un trascinamento non apre la categoria

  const tiles = () => [...vista.querySelectorAll('.tiles > .tile[data-id]')];

  /* fine della pressione (dito alzato, annullata dal browser, cattura persa) */
  function fine(e) {
    if (!g || (e && e.pointerId !== undefined && e.pointerId !== g.pid)) return;
    clearTimeout(g.timer);
    const { tile, id, attivo } = g;
    g = null;
    window.removeEventListener('pointerup', fine);
    window.removeEventListener('pointercancel', fine);
    if (!attivo) return;
    bloccaClic = true;
    setTimeout(() => { bloccaClic = false; }, 0);
    vista.classList.remove('riordino');
    tile.classList.remove('drag');
    tile.style.transform = '';
    // la vista è stata ridisegnata durante il trascinamento: la posizione non vale più
    const posizione = tiles().indexOf(tile);
    if (tile.isConnected && posizione >= 0) sposta(id, posizione);
  }

  vista.addEventListener('pointerdown', (e) => {
    const tile = e.target.closest('.tiles > .tile[data-id]');
    if (!tile || e.button > 0 || g) return;
    g = { tile, id: tile.dataset.id, pid: e.pointerId, x: e.clientX, y: e.clientY, top0: tile.offsetTop, attivo: false };
    // il dito si può alzare ovunque, anche fuori dalla vista
    window.addEventListener('pointerup', fine);
    window.addEventListener('pointercancel', fine);
    g.timer = setTimeout(() => {
      g.attivo = true;
      tile.classList.add('drag');
      vista.classList.add('riordino');
      try { tile.setPointerCapture(g.pid); } catch (err) {}
      if (navigator.vibrate) navigator.vibrate(10);
    }, ATTESA);
  });

  vista.addEventListener('pointermove', (e) => {
    if (!g || e.pointerId !== g.pid) return;
    if (!g.attivo) {
      if (Math.hypot(e.clientX - g.x, e.clientY - g.y) > SOGLIA) fine();
      return;
    }
    // la tile va prima della prima altra tile il cui centro è sotto il dito
    const t = g.tile, altre = tiles().filter((x) => x !== t);
    if (!t.isConnected) return;
    const prima = altre.find((x) => { const r = x.getBoundingClientRect(); return e.clientY < r.top + r.height / 2; });
    if (prima) { if (t.nextElementSibling !== prima) prima.before(t); }
    else if (altre.length && altre[altre.length - 1].nextElementSibling !== t) altre[altre.length - 1].after(t);
    // spostarla nel DOM può far perdere la cattura del puntatore: la si riprende
    try { t.setPointerCapture(g.pid); } catch (err) {}
    // resta sotto il dito anche dopo lo spostamento nel DOM
    t.style.transform = 'translateY(' + (e.clientY - g.y - (t.offsetTop - g.top0)) + 'px)';
  });

  // durante il trascinamento il dito non deve far scorrere la pagina
  vista.addEventListener('touchmove', (e) => { if (g && g.attivo) e.preventDefault(); }, { passive: false });
  // niente menu contestuale o selezione con la pressione lunga
  vista.addEventListener('contextmenu', (e) => { if (e.target.closest('.tiles > .tile')) e.preventDefault(); });

  vista.addEventListener('click', (e) => {
    if (bloccaClic) { e.stopPropagation(); e.preventDefault(); bloccaClic = false; }
  }, true);

  vista.addEventListener('keydown', (e) => {
    const tile = e.target.closest && e.target.closest('.tiles > .tile[data-id]');
    if (!tile || !e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    e.preventDefault();
    const i = tiles().indexOf(tile) + (e.key === 'ArrowUp' ? -1 : 1);
    if (i < 0 || i >= tiles().length) return;
    const id = tile.dataset.id;
    sposta(id, i);
    const dopo = tiles().find((x) => x.dataset.id === id);
    if (dopo) dopo.focus();
  });
}
