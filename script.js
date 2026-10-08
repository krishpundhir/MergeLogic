/* In-place merge visualizer.
   One array, no temporary array. Every step is an explicit, predefined state,
   so Next and Previous are fully deterministic. */

'use strict';

/* ------------------------------------------------------------------ */
/* Data                                                               */
/* ------------------------------------------------------------------ */

const ORIGINAL = [-2, 1, 6, 7, 8, -9, -1, 0, 3, 5];
const LEFT_ORIGIN = new Set([-2, 1, 6, 7, 8]);
const N = ORIGINAL.length;

const CALL = 'merge(arr, 0, 4, 9)';
const POINTER_ORDER = ['left', 'i', 'mid', 'right'];
const VAR_ORDER = ['left', 'mid', 'i', 'right', 'count'];
const FIXED_POINTERS = new Set(['mid', 'right']);

/* Each state describes what the screen shows AFTER its transition.
   `compare` and `swaps` describe the transition from the previous state. */
const states = [
  {
    title: 'Initial state',
    call: CALL,
    array: [-2, 1, 6, 7, 8, -9, -1, 0, 3, 5],
    ptr: { left: 0, mid: 4, i: 5, right: 9 },
    count: 0,
    swaps: [],
    focus: [0, 5],
    ops: [{
      kind: 'compare', status: 'active',
      text: 'compare(arr[left], arr[i])',
      detail: 'arr[0] = -2 vs arr[5] = -9  →  -9 < -2'
    }],
    why: 'Compare arr[left] = -2 with arr[i] = -9. Since -9 is smaller, the element at index i must be moved before the element at index left.',
    brackets: [
      { from: 0, to: 4, label: 'Left sorted section', cls: 'left' },
      { from: 5, to: 9, label: 'Right sorted section', cls: 'right' }
    ]
  },
  {
    title: 'Swap index 0 and index 5',
    call: CALL,
    array: [-9, 1, 6, 7, 8, -2, -1, 0, 3, 5],
    ptr: { left: 1, mid: 4, i: 6, right: 9 },
    count: 1,
    compare: { a: 0, b: 5 },
    swaps: [[0, 5]],
    why: '-9 is smaller than -2, so the two elements are swapped. left moves from 0 → 1. i moves from 5 → 6. count becomes 1.',
    brackets: [{ from: 0, to: 0, label: 'Placed', cls: 'placed' }]
  },
  {
    title: 'Swap index 1 and index 5',
    call: CALL,
    array: [-9, -2, 6, 7, 8, 1, -1, 0, 3, 5],
    ptr: { left: 2, mid: 4, i: 6, right: 9 },
    count: 1,
    compare: { a: 1, b: 5 },
    swaps: [[1, 5]],
    why: 'Compare 1 and -2. Since -2 is smaller, move -2 into the left sorted portion.',
    note: 'The swap partner here is index 5: that is where the displaced -2 now sits. It is not where the i pointer is.',
    brackets: [{ from: 0, to: 1, label: 'Placed', cls: 'placed' }]
  },
  {
    title: 'Compare, then swap index 2 and index 6',
    call: CALL,
    array: [-9, -2, -1, 7, 8, 1, 6, 0, 3, 5],
    ptr: { left: 3, mid: 4, i: 7, right: 9 },
    count: 2,
    compare: { a: 2, b: 6 },
    swaps: [[2, 6]],
    why: 'Compare arr[2] = 6 with arr[6] = -1. Since -1 is smaller, the two elements are swapped, and -1 moves into the left portion.',
    brackets: [{ from: 0, to: 2, label: 'Placed', cls: 'placed' }]
  },
  {
    title: 'Swap index 3 and index 7',
    call: CALL,
    array: [-9, -2, -1, 0, 8, 1, 6, 7, 3, 5],
    ptr: { left: 4, mid: 4, i: 8, right: 9 },
    count: 3,
    compare: { a: 3, b: 7 },
    swaps: [[3, 7]],
    why: '0 is smaller than 7, so 0 is moved into the left portion.',
    brackets: [{ from: 0, to: 3, label: 'Placed', cls: 'placed' }]
  },
  {
    title: 'Shift 8 right with three swaps',
    call: CALL,
    array: [-9, -2, -1, 0, 1, 6, 7, 8, 3, 5],
    ptr: { left: 4, mid: 4, i: 8, right: 9 },
    count: 3,
    swaps: [[4, 5], [5, 6], [6, 7]],
    why: '8 is out of order inside arr[4..7]. Adjacent swaps shift it right one position at a time, past 1, 6 and 7, until arr[4..7] = [1, 6, 7, 8] is sorted. These swaps are shifts, so no pointer changes.',
    brackets: [
      { from: 0, to: 7, label: 'Sorted left portion', cls: 'left' },
      { from: 8, to: 9, label: 'Remaining right', cls: 'right' }
    ]
  },
  {
    title: 'Next merge call',
    call: 'next: merge(arr, left, i - 1, right)',
    array: [-9, -2, -1, 0, 1, 6, 7, 8, 3, 5],
    ptr: { left: 4, mid: 4, i: 8, right: 9 },
    count: 3,
    swaps: [],
    ops: [{
      kind: 'call', status: 'next',
      text: 'merge(arr, left, i - 1, right)',
      detail: '= merge(arr, 4, 7, 9)'
    }],
    why: 'The current merge step is complete. The merged portion arr[0..7] is now sorted. The algorithm continues with merge(arr, left, i - 1, right) on what is left.',
    brackets: [
      { from: 0, to: 3, label: 'Placed', cls: 'placed' },
      { from: 4, to: 7, label: 'Next left', cls: 'left' },
      { from: 8, to: 9, label: 'Next right', cls: 'right' }
    ],
    nextCall: { left: 4, mid: 7, right: 9 }
  }
];

/* Build the operation list of each state and verify the whole chain once. */
states.forEach((s, k) => {
  if (k === 0) return;
  const sim = states[k - 1].array.slice();
  const ops = [];
  if (s.compare) {
    const { a, b } = s.compare;
    ops.push({
      kind: 'compare',
      text: `compare(arr[${a}], arr[${b}])`,
      detail: `arr[${a}] = ${sim[a]} vs arr[${b}] = ${sim[b]}  →  ${sim[b]} < ${sim[a]}`
    });
  }
  s.swaps.forEach(([a, b]) => {
    ops.push({ kind: 'swap', text: `swap(arr[${a}], arr[${b}])`, detail: `${sim[a]} ↔ ${sim[b]}` });
    [sim[a], sim[b]] = [sim[b], sim[a]];
  });
  if (!s.ops) s.ops = ops;
  if (sim.join() !== s.array.join()) {
    console.error('State chain mismatch at step', k + 1, sim, s.array);
  }
});

/* ------------------------------------------------------------------ */
/* DOM + runtime state                                                */
/* ------------------------------------------------------------------ */

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
};

const viz = $('viz'), board = $('board'), track = $('track'), indicesEl = $('indices');
const pointersEl = $('pointers'), bracketsEl = $('brackets');
const prevBtn = $('prevBtn'), nextBtn = $('nextBtn');

const cells = new Map();     // value -> cell element (values are unique)
const idxEls = [];
const ptrEls = {};           // name -> { root, stem }

let currentStep = 0;
let busy = false;
let displayed = ORIGINAL.slice();   // array currently on screen
let lastVars = null;
let geo = {};
let pendingResize = false;

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SPEED = reduceMotion ? 0.3 : 1;
const wait = (ms) => new Promise((r) => setTimeout(r, ms * SPEED));

/* ------------------------------------------------------------------ */
/* Geometry and board construction                                    */
/* ------------------------------------------------------------------ */

function computeGeometry() {
  const cs = getComputedStyle(viz);
  const avail = viz.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const gap = avail < 520 ? 6 : 12;
  const cell = Math.max(26, Math.min(76, Math.floor((avail - gap * (N - 1)) / N)));
  geo = {
    cell, gap,
    pitch: cell + gap,
    cellH: Math.round(cell * 0.92),
    lane: Math.round(cell * 0.5),
    width: (cell + gap) * N - gap
  };
}

function buildBoard() {
  ORIGINAL.forEach((v) => {
    const c = el('div', 'cell ' + (LEFT_ORIGIN.has(v) ? 'o-left' : 'o-right'), String(v));
    c.setAttribute('role', 'listitem');
    cells.set(v, c);
    track.appendChild(c);
  });
  for (let i = 0; i < N; i++) {
    const d = el('div', 'idx', String(i));
    idxEls.push(d);
    indicesEl.appendChild(d);
  }
  POINTER_ORDER.forEach((name) => {
    const root = el('div', 'ptr ptr-' + name);
    const stem = el('div', 'stem');
    const badge = el('div', 'badge');
    badge.appendChild(el('span', '', name));
    badge.appendChild(el('small', '', FIXED_POINTERS.has(name) ? 'fixed' : 'moves'));
    root.append(stem, badge);
    pointersEl.appendChild(root);
    ptrEls[name] = { root, stem };
  });
}

function applyGeometry() {
  board.style.width = geo.width + 'px';
  track.style.height = geo.cellH + geo.lane * 2 + 'px';
  cells.forEach((c) => {
    c.style.width = geo.cell + 'px';
    c.style.height = geo.cellH + 'px';
    c.style.top = geo.lane + 'px';
    c.style.fontSize = Math.max(13, Math.round(geo.cell * 0.3)) + 'px';
  });
  idxEls.forEach((d, i) => {
    d.style.left = i * geo.pitch + 'px';
    d.style.width = geo.cell + 'px';
  });
}

const cellX = (index) => index * geo.pitch;
const moveCell = (v, index, y = 0) => {
  cells.get(v).style.transform = `translate(${cellX(index)}px, ${y}px)`;
};

function positionCells(arr) {
  arr.forEach((v, i) => {
    cells.get(v).style.transitionDuration = '';
    moveCell(v, i, 0);
  });
}

/* ------------------------------------------------------------------ */
/* Rendering pieces                                                   */
/* ------------------------------------------------------------------ */

const LEVEL_H = 46, STEM_BASE = 12, BADGE_H = 38;

function renderPointers(s) {
  const labelW = geo.cell < 44 ? 46 : 60;
  const placed = [];
  let maxLevel = 0;
  POINTER_ORDER.forEach((name) => {
    const x = s.ptr[name] * geo.pitch + geo.cell / 2;
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

function renderBrackets(s) {
  bracketsEl.replaceChildren();
  s.brackets.forEach((b) => {
    const node = el('div', 'bracket ' + b.cls);
    node.style.left = b.from * geo.pitch + 'px';
    node.style.width = (b.to - b.from) * geo.pitch + geo.cell + 'px';
    node.appendChild(el('b', '', b.label));
    node.appendChild(el('span', '', '[' + s.array.slice(b.from, b.to + 1).join(', ') + ']'));
    bracketsEl.appendChild(node);
  });
}

function renderVars(s) {
  const vals = { ...s.ptr, count: s.count };
  const box = $('vars');
  box.replaceChildren();
  VAR_ORDER.forEach((name) => {
    const kind = name === 'count' ? 'counter' : FIXED_POINTERS.has(name) ? 'fixed' : 'moves';
    const changed = lastVars && lastVars[name] !== vals[name];
    const card = el('div', 'var ' + kind + (changed ? ' changed' : ''));
    card.append(el('span', 'vname', name), el('span', 'veq', '='), el('span', 'vval', String(vals[name])));
    card.appendChild(el('span', 'vtag', kind === 'counter' ? 'changes' : kind === 'fixed' ? 'fixed, never moves' : 'moves'));
    if (changed) card.appendChild(el('span', 'vwas', 'was ' + lastVars[name]));
    box.appendChild(card);
  });
  lastVars = vals;
}

function renderOps(k, mode) {
  const s = states[k];
  const list = $('ops');
  list.replaceChildren();
  s.ops.forEach((op) => {
    const li = el('li', 'op ' + (mode === 'pending' ? 'pending' : op.status || 'done'));
    li.appendChild(el('span', 'op-mark'));
    li.appendChild(el('code', 'op-text', op.text));
    li.appendChild(el('span', 'op-detail', op.detail));
    list.appendChild(li);
  });
}

function setOp(index, status) {
  const li = $('ops').children[index];
  if (li) li.className = 'op ' + status;
}

function renderWhy(k) {
  const s = states[k];
  $('whyText').textContent = s.why;
  const note = $('noteText');
  note.hidden = !s.note;
  note.textContent = s.note || '';

  const box = $('changes');
  box.replaceChildren();
  const prev = k > 0 ? states[k - 1] : null;
  if (prev) {
    ['left', 'i'].forEach((name) => {
      if (prev.ptr[name] !== s.ptr[name]) box.appendChild(el('span', 'pill', `${name}: ${prev.ptr[name]} → ${s.ptr[name]}`));
    });
    if (prev.count !== s.count) box.appendChild(el('span', 'pill', `count: ${prev.count} → ${s.count}`));
  }
  if (!box.children.length) {
    box.appendChild(el('span', 'pill none', k === 0 ? 'No pointer has moved yet.' : 'No pointer or counter changed in this step.'));
  }
}

/* Text that describes a step: shown at the start of a forward move. */
function renderTexts(k, mode) {
  const s = states[k];
  $('callLabel').textContent = s.call;
  $('stepTitle').textContent = s.title;
  $('stepIndicator').textContent = `Step ${k + 1} / ${states.length}`;
  renderOps(k, mode);
  renderWhy(k);
}

function renderProgress(k) {
  const box = $('progress');
  if (!box.children.length) states.forEach(() => box.appendChild(el('span', 'seg')));
  [...box.children].forEach((seg, i) => seg.classList.toggle('done', i <= k));
}

function updateNav() {
  prevBtn.disabled = busy || currentStep === 0;
  nextBtn.disabled = busy || currentStep === states.length - 1;
}

function setFocus(indices) {
  cells.forEach((c) => c.classList.remove('focus'));
  indices.forEach((i) => cells.get(states[currentStep].array[i]).classList.add('focus'));
}

/* ------------------------------------------------------------------ */
/* renderState: the single source of truth for a settled screen       */
/* ------------------------------------------------------------------ */

function renderState(step) {
  const s = states[step];
  currentStep = step;
  displayed = s.array.slice();
  positionCells(displayed);
  renderTexts(step, 'static');
  renderVars(s);
  renderPointers(s);
  renderBrackets(s);
  renderProgress(step);
  setFocus(s.focus || []);
  $('opStatus').textContent = '';

  const nc = $('nextCall');
  nc.hidden = !s.nextCall;
  if (s.nextCall) {
    $('ncLeft').textContent = s.nextCall.left;
    $('ncMid').textContent = s.nextCall.mid;
    $('ncRight').textContent = s.nextCall.right;
    nc.style.animation = 'none';
    void nc.offsetWidth;            // restart the entrance animation
    nc.style.animation = '';
  }
  updateNav();
}

/* ------------------------------------------------------------------ */
/* Animation                                                          */
/* ------------------------------------------------------------------ */

function setDur(seconds, ...nodes) {
  nodes.forEach((n) => { n.style.transitionDuration = seconds * SPEED + 's'; });
}

/* Swaps arr[a] and arr[b] on screen (and in `arr`), cells travel visibly. */
async function animateSwap(a, b, arr) {
  const va = arr[a], vb = arr[b];
  const A = cells.get(va), B = cells.get(vb);
  const { lane } = geo;

  // 1. highlight both elements and their indices
  [A, B].forEach((c) => c.classList.add('swap-hi'));
  idxEls[a].classList.add('hot');
  idxEls[b].classList.add('hot');
  await wait(450);

  // 2. lift: one element up, the other down, so they can pass each other
  setDur(0.3, A, B);
  moveCell(va, a, -lane);
  moveCell(vb, b, lane);
  await wait(330);

  // 3. travel to each other's position
  setDur(0.8, A, B);
  moveCell(va, b, -lane);
  moveCell(vb, a, lane);
  await wait(820);

  // 4. settle into the row
  setDur(0.3, A, B);
  moveCell(va, b, 0);
  moveCell(vb, a, 0);
  await wait(340);

  // 5. update the array, drop the temporary highlight
  arr[a] = vb;
  arr[b] = va;
  [A, B].forEach((c) => { c.classList.remove('swap-hi'); c.style.transitionDuration = ''; });
  idxEls[a].classList.remove('hot');
  idxEls[b].classList.remove('hot');
  await wait(120);
}

async function animateCompare(a, b, arr) {
  const A = cells.get(arr[a]), B = cells.get(arr[b]);
  [A, B].forEach((c) => c.classList.add('cmp'));
  idxEls[a].classList.add('hot');
  idxEls[b].classList.add('hot');
  await wait(1200);
  [A, B].forEach((c) => c.classList.remove('cmp'));
  idxEls[a].classList.remove('hot');
  idxEls[b].classList.remove('hot');
  await wait(100);
}

/* ------------------------------------------------------------------ */
/* Navigation                                                         */
/* ------------------------------------------------------------------ */

async function goTo(target) {
  if (busy || target < 0 || target >= states.length || target === currentStep) return;
  busy = true;
  updateNav();
  setFocus([]);

  const forward = target > currentStep;
  const owner = forward ? states[target] : states[currentStep];   // state that owns the transition
  const arr = displayed.slice();
  const status = $('opStatus');

  if (forward) {
    renderTexts(target, 'pending');
    let opIdx = 0;
    if (owner.compare) {
      setOp(opIdx, 'active');
      status.textContent = 'Comparing…';
      await animateCompare(owner.compare.a, owner.compare.b, arr);
      setOp(opIdx++, 'done');
    }
    for (const [a, b] of owner.swaps) {
      setOp(opIdx, 'active');
      status.textContent = 'Swapping…';
      await animateSwap(a, b, arr);
      setOp(opIdx++, 'done');
    }
    if (!owner.compare && !owner.swaps.length) await wait(400);
  } else {
    for (let k = owner.swaps.length - 1; k >= 0; k--) {
      const [a, b] = owner.swaps[k];
      status.textContent = `Rewinding: undoing swap(arr[${a}], arr[${b}])`;
      await animateSwap(a, b, arr);
    }
    if (!owner.swaps.length) await wait(250);
  }

  if (arr.join() !== states[target].array.join()) {
    console.error('Animation ended in an unexpected array', arr, states[target].array);
  }

  renderState(target);     // exact, stored state, pointers glide to their new indices
  busy = false;
  updateNav();
}

function nextStep()     { goTo(currentStep + 1); }
function previousStep() { goTo(currentStep - 1); }

/* ------------------------------------------------------------------ */
/* Init                                                               */
/* ------------------------------------------------------------------ */

function layout() {
  computeGeometry();
  applyGeometry();
  board.classList.add('no-anim');
  positionCells(displayed);
  renderPointers(states[currentStep]);
  renderBrackets(states[currentStep]);
  requestAnimationFrame(() => requestAnimationFrame(() => board.classList.remove('no-anim')));
}

prevBtn.addEventListener('click', previousStep);
nextBtn.addEventListener('click', nextStep);
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') nextStep();
  if (e.key === 'ArrowLeft') previousStep();
});

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (busy) { pendingResize = true; return; }
    layout();
  }, 120);
});
setInterval(() => {
  if (pendingResize && !busy) { pendingResize = false; layout(); }
}, 400);

buildBoard();
computeGeometry();
applyGeometry();
board.classList.add('no-anim');
renderState(0);
requestAnimationFrame(() => requestAnimationFrame(() => board.classList.remove('no-anim')));
