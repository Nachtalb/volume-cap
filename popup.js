const DEFAULTS = { boost: 200, ceiling: -20, boostOn: true, capOn: true };
const POLL_MS = 50; // fast, so each graph step lands on time

// Graph geometry. One block row is 4 dB, so the grid lines and the default
// -20 dB cap sit exactly in the gaps between rows.
const TOP_DB = 12, BOTTOM_DB = -48, DB_PER_ROW = 4, GRID_DB = 12;
const BAR = 12, BLOCK = 6, GAP = 2, LABELS = 22; // CSS px
const ROWS = (TOP_DB - BOTTOM_DB) / DB_PER_ROW;

const $ = (id) => document.getElementById(id);
const canvas = $('graph');
const g = canvas.getContext('2d');
canvas.style.height = `${ROWS * (BLOCK + GAP)}px`;

const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
const send = (msg) =>
  chrome.runtime.sendMessage({ to: 'sw', tabId: tab.id, ...msg });

const { settings: stored } = await chrome.storage.local.get('settings');
const saved = { ...DEFAULTS, ...stored };
const state = await send({ type: 'start', settings: saved });
if (state?.error) $('error').textContent = state.error;
const settings = { ...saved, ...state?.settings };
let history = [];
let lastAt = 0;

function renderControls() {
  $('boost').value = settings.boost;
  $('ceiling').value = settings.ceiling;
  $('boostVal').textContent = `${settings.boost}%`;
  $('ceilingVal').textContent = `${settings.ceiling}dB`;
  for (const [unit, key] of [['boostUnit', 'boostOn'], ['capUnit', 'capOn']]) {
    $(unit).classList.toggle('on', settings[key]);
    $(key).textContent = settings[key] ? 'ON' : 'OFF';
    $(key).setAttribute('aria-pressed', settings[key]);
  }
}

function drawGraph() {
  const css = getComputedStyle(document.documentElement);
  const color = (name) => css.getPropertyValue(name).trim();
  const dpr = devicePixelRatio || 1;
  const W = (canvas.width = canvas.clientWidth * dpr);
  const H = (canvas.height = canvas.clientHeight * dpr);
  const step = H / ROWS, block = BLOCK * dpr, gap = GAP * dpr;
  const left = LABELS * dpr; // label gutter, bars never go under the numbers
  const rows = (db) =>
    (Math.max(BOTTOM_DB, Math.min(TOP_DB, db)) - BOTTOM_DB) / DB_PER_ROW;
  const y = (db) => H - rows(db) * step;
  const hline = (db) => {
    g.beginPath(); g.moveTo(left, y(db)); g.lineTo(W, y(db)); g.stroke();
  };

  g.clearRect(0, 0, W, H);
  g.font = `${9 * dpr}px ui-monospace, monospace`;
  g.textAlign = 'right';
  g.textBaseline = 'middle';
  g.strokeStyle = color('--screen-dim');
  g.fillStyle = color('--screen-ink');
  g.setLineDash([dpr, 3 * dpr]);
  for (let db = 0; db > BOTTOM_DB; db -= GRID_DB) {
    hline(db);
    g.globalAlpha = 0.7;
    g.fillText(db, left - 4 * dpr, y(db));
    g.globalAlpha = 1;
  }
  g.setLineDash([]);

  // Newest bar on the right. Blocks above the cap are what it cuts: grey.
  const cap = settings.capOn ? settings.ceiling : Infinity;
  const litRows = Math.floor(rows(cap));
  const ink = color('--screen-ink'), cut = color('--cut');
  const pitch = (BAR + GAP) * dpr;
  history.forEach((db, i) => {
    const x = W - (history.length - i) * pitch + gap;
    if (x < left) return;
    for (let k = 0; k < Math.ceil(rows(db) - 1e-9); k++) {
      g.fillStyle = k < litRows ? ink : cut;
      g.fillRect(x, H - (k + 1) * step + gap / 2, BAR * dpr, block);
    }
  });

  if (settings.capOn) {
    g.strokeStyle = color('--led');
    g.lineWidth = dpr;
    hline(cap);
  }
}

function renderReadout(cutDb) {
  const last = history.at(-1);
  const cut = settings.capOn ? Math.round(-cutDb) : 0;
  $('peak').textContent = last > -100 ? `Peak ${Math.round(last)}dB` : 'Peak --';
  $('cut').textContent = cut > 0 ? `Cut -${cut}dB` : 'Cut --';
}

function update() {
  renderControls();
  drawGraph();
  send({ type: 'set', settings });
  chrome.storage.local.set({ settings });
}

for (const key of ['boost', 'ceiling']) {
  $(key).addEventListener('input', (e) => {
    settings[key] = Number(e.target.value);
    update();
  });
}
for (const key of ['boostOn', 'capOn']) {
  $(key).addEventListener('click', () => {
    settings[key] = !settings[key];
    update();
  });
}
// The canvas reads theme colours at draw time, so redraw on a theme switch.
matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', drawGraph);
$('off').addEventListener('click', async () => {
  await send({ type: 'stop' });
  window.close();
});

renderControls();
drawGraph();
renderReadout(0);
setInterval(async () => {
  const s = await send({ type: 'get' });
  if (!s || s.error) return;
  if (s.lastAt !== lastAt) {
    ({ lastAt, history } = s);
    drawGraph();
  }
  renderReadout(s.cut);
}, POLL_MS);
