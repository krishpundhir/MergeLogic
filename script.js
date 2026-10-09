/* In-place merge visualizer: two fixed examples, array + pointers + variables.
   Every step is an explicit stored state, so Previous/Next are deterministic. */

'use strict';

const CALL_OP = 'Call merge(arr, left, i - 1, right)';
const OP_A = 'swap(left, i), left++, i++, count++';
const OP_B = 'swap(left, mid+1), left++';

/* Each state is what the screen shows AFTER its step.
   call = [left, mid, right] in the header; swaps = swaps performed to reach this state. */
const EXAMPLES = [
  {
    arr: [-2, 1, 6, 7, 8, -9, -1, 0, 3, 5],
    states: [
      { call: [0, 4, 9], array: [-2, 1, 6, 7, 8, -9, -1, 0, 3, 5], ptr: { left: 0, mid: 4, i: 5, right: 9 }, count: 0, swaps: [], op: '' },
      { call: [0, 4, 9], array: [-9, 1, 6, 7, 8, -2, -1, 0, 3, 5], ptr: { left: 1, mid: 4, i: 6, right: 9 }, count: 1, swaps: [[0, 5]], op: OP_A },
      { call: [0, 4, 9], array: [-9, -2, 6, 7, 8, 1, -1, 0, 3, 5], ptr: { left: 2, mid: 4, i: 6, right: 9 }, count: 1, swaps: [[1, 5]], op: OP_B },
      { call: [0, 4, 9], array: [-9, -2, -1, 7, 8, 1, 6, 0, 3, 5], ptr: { left: 3, mid: 4, i: 7, right: 9 }, count: 2, swaps: [[2, 6]], op: OP_A },
      { call: [0, 4, 9], array: [-9, -2, -1, 0, 8, 1, 6, 7, 3, 5], ptr: { left: 4, mid: 4, i: 8, right: 9 }, count: 3, swaps: [[3, 7]], op: OP_A },
      { call: [0, 4, 9], array: [-9, -2, -1, 0, 1, 6, 7, 8, 3, 5], ptr: { left: 5, mid: 4, i: 8, right: 9 }, count: 3, swaps: [[4, 5], [5, 6], [6, 7]], op: 'swap(left, mid+1), swap(5, 6), swap(6, 7), left++' },
      { call: [5, 7, 9], array: [-9, -2, -1, 0, 1, 6, 7, 8, 3, 5], ptr: { left: 5, mid: 7, i: 8, right: 9 }, count: 0, swaps: [], op: CALL_OP },
      { call: [5, 7, 9], array: [-9, -2, -1, 0, 1, 3, 7, 8, 6, 5], ptr: { left: 6, mid: 7, i: 9, right: 9 }, count: 1, swaps: [[5, 8]], op: OP_A },
      { call: [5, 7, 9], array: [-9, -2, -1, 0, 1, 3, 5, 8, 6, 7], ptr: { left: 7, mid: 7, i: 10, right: 9 }, count: 2, swaps: [[6, 9]], op: OP_A },
      { call: [5, 7, 9], array: [-9, -2, -1, 0, 1, 3, 5, 6, 7, 8], ptr: { left: 7, mid: 7, i: 10, right: 9 }, count: 2, swaps: [[7, 8], [8, 9]], op: 'swap(7, 8), swap(8, 9)' }
    ]
  },
  {
    arr: [-7, -3, 3, 6, 9, -11, 2, 3, 10],
    states: [
      { call: [0, 4, 8], array: [-7, -3, 3, 6, 9, -11, 2, 3, 10], ptr: { left: 0, mid: 4, i: 5, right: 8 }, count: 0, swaps: [], op: '' },
      { call: [0, 4, 8], array: [-11, -3, 3, 6, 9, -7, 2, 3, 10], ptr: { left: 1, mid: 4, i: 6, right: 8 }, count: 1, swaps: [[0, 5]], op: OP_A },
      { call: [0, 4, 8], array: [-11, -7, 3, 6, 9, -3, 2, 3, 10], ptr: { left: 2, mid: 4, i: 6, right: 8 }, count: 1, swaps: [[5, 1]], op: 'swap(mid+1, left), left++' },
      { call: [0, 4, 8], array: [-11, -7, -3, 6, 9, 3, 2, 3, 10], ptr: { left: 3, mid: 4, i: 6, right: 8 }, count: 1, swaps: [[5, 2]], op: 'swap(mid+1, left), left++' },
      { call: [0, 4, 8], array: [-11, -7, -3, 2, 9, 3, 6, 3, 10], ptr: { left: 4, mid: 4, i: 7, right: 8 }, count: 2, swaps: [[3, 6]], op: OP_A },
      { call: [0, 4, 8], array: [-11, -7, -3, 2, 3, 6, 9, 3, 10], ptr: { left: 5, mid: 4, i: 7, right: 8 }, count: 2, swaps: [[4, 5], [5, 6]], op: 'swap(left, mid+1), swap(5, 6), left++' },
      { call: [5, 6, 8], array: [-11, -7, -3, 2, 3, 6, 9, 3, 10], ptr: { left: 5, mid: 6, i: 7, right: 8 }, count: 0, swaps: [], op: CALL_OP },
      { call: [5, 6, 8], array: [-11, -7, -3, 2, 3, 3, 9, 6, 10], ptr: { left: 6, mid: 6, i: 8, right: 8 }, count: 1, swaps: [[5, 7]], op: OP_A },
      { call: [5, 6, 8], array: [-11, -7, -3, 2, 3, 3, 6, 9, 10], ptr: { left: 7, mid: 6, i: 8, right: 8 }, count: 1, swaps: [[6, 7]], op: OP_B },
      { call: [7, 7, 8], array: [-11, -7, -3, 2, 3, 3, 6, 9, 10], ptr: { left: 7, mid: 7, i: 8, right: 8 }, count: 0, swaps: [], op: CALL_OP },
      { call: [7, 7, 8], array: [-11, -7, -3, 2, 3, 3, 6, 9, 10], ptr: { left: 7, mid: 7, i: 8, right: 8 }, count: 0, swaps: [], op: 'No swaps. Return.' }
    ]
  }
];

/* Boxes keep an identity (token id), so equal values such as the two 3s in
   Example 2 are never confused. Precompute the token order of every state
   and check each stored array against it. */
EXAMPLES.forEach((E, e) => {
  E.states.forEach((s, k) => {
    s.ids = (k ? E.states[k - 1].ids : E.arr.map((_, id) => id)).slice();
    s.swaps.forEach(([a, b]) => { [s.ids[a], s.ids[b]] = [s.ids[b], s.ids[a]]; });
    if (s.ids.map((id) => E.arr[id]).join() !== s.array.join()) {
      console.error('Example', e + 1, 'step', k, 'does not match its swaps');
    }
  });
  E.slots = Math.max(E.arr.length, ...E.states.map((s) => Math.max(...Object.values(s.ptr)) + 1));
});

/* ------------------------------------------------------------------ */

const POINTERS = ['left', 'i', 'mid', 'right'];
const VARS = ['left', 'mid', 'i', 'right', 'count'];
const FIXED = new Set(['mid', 'right']);

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
};

const viz = $('viz'), board = $('board'), track = $('track');
const indicesEl = $('indices'), pointersEl = $('pointers');
const prevBtn = $('prevBtn'), nextBtn = $('nextBtn');
const tabs = [...document.querySelectorAll('.tab')];

const cells = [], idxEls = [];
let ptrEls = {};
let E = EXAMPLES[0];
let n = 0, slots = 0;
let currentStep = 0;
let busy = false;
let displayed = [];
let geo = {};
let pendingResize = false;

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SPEED = reduceMotion ? 0.3 : 1;
const wait = (ms) => new Promise((r) => setTimeout(r, ms * SPEED));

/* ---------- board ---------- */

function computeGeometry() {
  const cs = getComputedStyle(viz);
  const avail = viz.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const gap = avail < 520 ? 6 : 12;
  const cell = Math.max(24, Math.min(76, Math.floor((avail - gap * (slots - 1)) / slots)));
  geo = { cell, gap, pitch: cell + gap, cellH: Math.round(cell * 0.92), lane: Math.round(cell * 0.5), width: (cell + gap) * slots - gap };
}

function buildBoard() {
  track.replaceChildren(); indicesEl.replaceChildren(); pointersEl.replaceChildren();
  cells.length = 0; idxEls.length = 0; ptrEls = {};

  const initialMid = E.states[0].ptr.mid;
  if (slots > n) track.appendChild(el('div', 'ghost'));          // empty slot for a pointer that runs past the end
  E.arr.forEach((v, id) => {
    const c = el('div', 'cell ' + (id <= initialMid ? 'o-left' : 'o-right'), String(v));
    c.setAttribute('role', 'listitem');
    cells.push(c);
    track.appendChild(c);
  });
  for (let k = 0; k < slots; k++) {
    const d = el('div', 'idx', String(k));
    idxEls.push(d);
    indicesEl.appendChild(d);
  }
  POINTERS.forEach((name) => {
    const root = el('div', 'ptr ptr-' + name);
    const stem = el('div', 'stem');
    root.append(stem, el('div', 'badge', name));
    pointersEl.appendChild(root);
    ptrEls[name] = { root, stem };
  });
}

function applyGeometry() {
  board.style.width = geo.width + 'px';
  track.style.height = geo.cellH + geo.lane * 2 + 'px';
  const size = (node) => {
    node.style.width = geo.cell + 'px';
    node.style.height = geo.cellH + 'px';
    node.style.top = geo.lane + 'px';
  };
  cells.forEach((c) => { size(c); c.style.fontSize = Math.max(12, Math.round(geo.cell * 0.3)) + 'px'; });
  const ghost = track.querySelector('.ghost');
  if (ghost) { size(ghost); ghost.style.transform = `translateX(${n * geo.pitch}px)`; }
  idxEls.forEach((d, k) => { d.style.left = k * geo.pitch + 'px'; d.style.width = geo.cell + 'px'; });
}

const moveCell = (id, index, y = 0) => { cells[id].style.transform = `translate(${index * geo.pitch}px, ${y}px)`; };
function positionCells(ids) {
  ids.forEach((id, k) => { cells[id].style.transitionDuration = ''; moveCell(id, k, 0); });
}

/* Pointers that are close together are stacked on different levels so labels never overlap. */
const LEVEL_H = 40, STEM_BASE = 12, BADGE_H = 32;
function renderPointers(ptr) {
  const labelW = geo.cell < 44 ? 44 : 58;
  const placed = [];
  let maxLevel = 0;
  POINTERS.forEach((name) => {
    const x = ptr[name] * geo.pitch + geo.cell / 2;
    let level = 0;
    while (placed.some((p) => p.level === level && Math.abs(p.x - x) < labelW + 6)) level++;
    placed.push({ x, level });
    maxLevel = Math.max(maxLevel, level);
    const { root, stem } = ptrEls[name];
    root.style.width = labelW + 'px';
    root.style.zIndex = String(10 - level);
    root.style.transform = `translateX(${x - labelW / 2}px)`;
    stem.style.height = STEM_BASE + level * LEVEL_H + 'px';
  });
  pointersEl.style.height = STEM_BASE + maxLevel * LEVEL_H + BADGE_H + 8 + 'px';
}

function renderVars(s, prev) {
  const vals = { ...s.ptr, count: s.count };
  const before = prev ? { ...prev.ptr, count: prev.count } : null;
  const box = $('vars');
  box.replaceChildren();
  VARS.forEach((name) => {
    const card = el('div', 'var ' + name + (FIXED.has(name) ? ' fixed' : '') + (before && before[name] !== vals[name] ? ' changed' : ''));
    card.append(el('span', 'vname', name), el('span', 'veq', '='), el('span', 'vval', String(vals[name])));
    box.appendChild(card);
  });
}

function renderTexts(k) {
  const s = E.states[k];
  $('callLabel').textContent = `merge(arr, ${s.call[0]}, ${s.call[1]}, ${s.call[2]})`;
  $('opLine').textContent = s.op;
  $('stepIndicator').textContent = `Step ${k + 1} / ${E.states.length}`;
}

function updateNav() {
  prevBtn.disabled = busy || currentStep === 0;
  nextBtn.disabled = busy || currentStep === E.states.length - 1;
  tabs.forEach((t) => { t.disabled = busy; });
}

/* The single source of truth for a settled screen. */
function renderState(k, flashFrom) {
  const s = E.states[k];
  currentStep = k;
  displayed = s.ids.slice();
  positionCells(displayed);
  renderTexts(k);
  renderVars(s, flashFrom || null);
  renderPointers(s.ptr);
  updateNav();
}

/* ---------- animation ---------- */

function setDur(seconds, ...nodes) { nodes.forEach((nd) => { nd.style.transitionDuration = seconds * SPEED + 's'; }); }

/* Swaps arr[a] and arr[b] on screen: highlight, lift apart, travel, settle. */
async function animateSwap(a, b, ids) {
  const ia = ids[a], ib = ids[b];
  const A = cells[ia], B = cells[ib];
  const { lane } = geo;

  [A, B].forEach((c) => c.classList.add('swap-hi'));
  idxEls[a].classList.add('hot'); idxEls[b].classList.add('hot');
  await wait(400);

  setDur(0.28, A, B);
  moveCell(ia, a, -lane); moveCell(ib, b, lane);
  await wait(300);

  setDur(0.75, A, B);
  moveCell(ia, b, -lane); moveCell(ib, a, lane);
  await wait(780);

  setDur(0.28, A, B);
  moveCell(ia, b, 0); moveCell(ib, a, 0);
  await wait(300);

  ids[a] = ib; ids[b] = ia;
  [A, B].forEach((c) => { c.classList.remove('swap-hi'); c.style.transitionDuration = ''; });
  idxEls[a].classList.remove('hot'); idxEls[b].classList.remove('hot');
  await wait(100);
}

/* ---------- navigation ---------- */

async function goTo(target) {
  if (busy || target < 0 || target >= E.states.length || target === currentStep) return;
  busy = true;
  updateNav();

  const forward = target > currentStep;
  const from = E.states[currentStep];
  const owner = forward ? E.states[target] : from;     // the state whose swaps this move plays
  const ids = displayed.slice();

  if (forward) {
    $('opLine').textContent = owner.op;
    for (const [a, b] of owner.swaps) await animateSwap(a, b, ids);
    if (!owner.swaps.length) await wait(200);
  } else {
    for (let k = owner.swaps.length - 1; k >= 0; k--) await animateSwap(...owner.swaps[k], ids);
    if (!owner.swaps.length) await wait(200);
  }

  if (ids.join() !== E.states[target].ids.join()) console.error('Animation ended in an unexpected order');

  busy = false;
  renderState(target, forward ? from : null);   // pointers glide, changed variables flash
}

const nextStep = () => goTo(currentStep + 1);
const previousStep = () => goTo(currentStep - 1);

/* ---------- examples ---------- */

function loadExample(e) {
  if (busy) return;
  E = EXAMPLES[e];
  n = E.arr.length;
  slots = E.slots;
  tabs.forEach((t, k) => { t.classList.toggle('active', k === e); t.setAttribute('aria-selected', k === e); });
  buildBoard();
  computeGeometry();
  applyGeometry();
  board.classList.add('no-anim');
  renderState(0);
  requestAnimationFrame(() => requestAnimationFrame(() => board.classList.remove('no-anim')));
}

function layout() {
  computeGeometry();
  applyGeometry();
  board.classList.add('no-anim');
  positionCells(displayed);
  renderPointers(E.states[currentStep].ptr);
  requestAnimationFrame(() => requestAnimationFrame(() => board.classList.remove('no-anim')));
}

tabs.forEach((t) => t.addEventListener('click', () => loadExample(Number(t.dataset.ex))));
prevBtn.addEventListener('click', previousStep);
nextBtn.addEventListener('click', nextStep);
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') previousStep();
  if (e.key === 'ArrowRight') nextStep();
});

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { if (busy) pendingResize = true; else layout(); }, 120);
});
setInterval(() => { if (pendingResize && !busy) { pendingResize = false; layout(); } }, 400);

loadExample(0);
