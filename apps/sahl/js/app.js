// السهل الممتنع — قارئ PDF ومعلِّق عليه
import * as pdfjsLib from '../lib/pdf.min.mjs';

const LIB = new URL('../lib/', import.meta.url).href;
pdfjsLib.GlobalWorkerOptions.workerSrc = LIB + 'pdf.worker.min.mjs';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const NS = 'http://www.w3.org/2000/svg';
const Bridge = window.SahlAndroid || null;
const fmtNum = n => new Intl.NumberFormat('ar-EG').format(n);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const uid = () => Math.random().toString(36).slice(2, 10);
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ───────── التخزين ───────── */
const DB = (() => {
  let p;
  const open = () => p ||= new Promise((res, rej) => {
    const r = indexedDB.open('sahl', 1);
    r.onupgradeneeded = () => { const d = r.result; d.createObjectStore('files'); d.createObjectStore('meta'); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
  const run = async (st, mode, fn) => {
    try {
      const d = await open();
      return await new Promise((res, rej) => {
        const t = d.transaction(st, mode); const q = fn(t.objectStore(st));
        t.oncomplete = () => res(q ? q.result : undefined); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
      });
    } catch (e) { console.warn('DB', e); return undefined; }
  };
  return {
    get: (st, k) => run(st, 'readonly', s => s.get(k)),
    put: (st, k, v) => run(st, 'readwrite', s => s.put(v, k)),
    del: (st, k) => run(st, 'readwrite', s => s.delete(k)),
    all: st => run(st, 'readonly', s => s.getAll()),
  };
})();
const MAX_STORE = 80 * 1024 * 1024;

/* ───────── الصوت ───────── */
const Sound = (() => {
  let ctx, on = localStorage.getItem('sahl.sound') !== '0';
  const tone = (f, d = .05, type = 'sine', v = .06, delay = 0) => {
    if (!on) return;
    try {
      ctx ||= new (window.AudioContext || window.webkitAudioContext)();
      const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + d + .02);
    } catch (e) {}
  };
  return {
    get on() { return on; },
    toggle() { on = !on; try { localStorage.setItem('sahl.sound', on ? '1' : '0'); } catch (e) {} return on; },
    tap: () => tone(720, .04, 'triangle', .04),
    pop: () => { tone(520, .06, 'sine', .05); tone(880, .08, 'sine', .04, .05); },
    ok: () => { tone(660, .09, 'sine', .06); tone(990, .14, 'sine', .05, .08); },
    err: () => tone(200, .18, 'sawtooth', .04),
  };
})();
const vibrate = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };

/* ───────── أدوات الواجهة ───────── */
let toastT;
function toast(msg, kind = '') {
  const t = $('#toast'); t.textContent = msg; t.className = 'toast show ' + kind;
  clearTimeout(toastT); toastT = setTimeout(() => t.className = 'toast', 2600);
}
function flash() { const f = document.createElement('div'); f.className = 'flash'; document.body.appendChild(f); setTimeout(() => f.remove(), 700); }

// نافذة عامة تعيد قيمة الزر المضغوط
function dialog({ title, body = '', actions = [{ label: 'حسنًا', value: 'ok', cls: 'gold' }], onOpen }) {
  const d = $('#dlg');
  $('#dlgTitle').textContent = title;
  const b = $('#dlgBody'); b.innerHTML = ''; typeof body === 'string' ? b.innerHTML = body : b.appendChild(body);
  const a = $('#dlgActions'); a.innerHTML = '';
  actions.forEach(x => {
    const btn = document.createElement('button');
    btn.className = 'btn ' + (x.cls || ''); btn.value = x.value; btn.textContent = x.label;
    a.appendChild(btn);
  });
  return new Promise(res => {
    d.onclose = () => res(d.returnValue || 'cancel');
    d.returnValue = '';
    d.showModal(); Sound.pop();
    onOpen && onOpen(b);
  });
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ───────── الحالة ───────── */
const S = {
  docs: [], cur: null,
  tool: 'hand',
  color: { marker: '#f3d36b', pen: '#b03a2e', text: '#1f4e79', shape: '#b03a2e' },
  shape: 'rect',
  width: { marker: 16, pen: 2.5, shape: 2 },
  mode: localStorage.getItem('sahl.mode') || 'normal',
  stamp: null,
};
const COLORS = {
  marker: ['#f3d36b', '#a9d8b8', '#a8cbe6', '#e2c2a4', '#c9c3e0'],
  pen: ['#b03a2e', '#1f4e79', '#24553f', '#1d2622', '#7a5c2e', '#5b4b8a'],
  shape: ['#b03a2e', '#1f4e79', '#24553f', '#1d2622', '#c8963e', '#5b4b8a'],
  text: ['#1f4e79', '#b03a2e', '#24553f', '#1d2622', '#7a5c2e'],
};
const SHAPES = [
  ['rect', 'مربع', '<rect x="4" y="6" width="16" height="12" rx="1"/>'],
  ['ellipse', 'دائرة', '<circle cx="12" cy="12" r="7.5"/>'],
  ['tri', 'مثلث', '<path d="M12 4.5l8 14H4z"/>'],
  ['line', 'خط', '<path d="M5 19L19 5"/>'],
  ['arrow', 'سهم', '<path d="M5 19L19 5M11 5h8v8"/>'],
];
const SHAPE_NAME = { rect: 'مربع', ellipse: 'دائرة', tri: 'مثلث', line: 'خط', arrow: 'سهم' };
const STAMPS = [
  { label: 'تم الاطلاع', color: '#1565c0' },
  { label: 'معتمد', color: '#2e7d32' },
  { label: 'مراجَع', color: '#6a1b9a' },
  { label: 'عاجل', color: '#c62828' },
  { label: 'مرفوض', color: '#c62828' },
  { label: 'للحفظ', color: '#8d6e00' },
];

/* ───────── فتح الملفات ───────── */
function quickHash(u8) {
  let h = 2166136261; const n = Math.min(u8.length, 65536);
  for (let i = 0; i < n; i += 7) { h ^= u8[i]; h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}

async function openBytes(u8, name, opts = {}) {
  name = (name || 'ملف.pdf').replace(/^.*[\\/]/, '');
  const key = `${name}|${u8.length}|${quickHash(u8)}`;
  const open = S.docs.find(d => d.key === key);
  if (open) { showReader(); switchDoc(open); return; }
  showReader();
  setLoading(true, 'يُفتح «' + name + '»…');
  let pdf;
  try {
    const task = pdfjsLib.getDocument({
      data: u8.slice(), cMapUrl: LIB + 'cmaps/', cMapPacked: true, standardFontDataUrl: LIB + 'standard_fonts/',
      isEvalSupported: false, enableXfa: false,
    });
    task.onPassword = (update, reason) => {
      askPassword(reason === pdfjsLib.PasswordResponses.INCORRECT_PASSWORD).then(pw => {
        if (pw == null) task.destroy(); else update(pw);
      });
    };
    pdf = await task.promise;
  } catch (e) {
    setLoading(false);
    if (!S.docs.length) showHome();
    if (e && e.name === 'PasswordException') return;
    console.error(e); Sound.err();
    dialog({ title: 'تعذّر فتح الملف', body: `<p>الملف «${esc(name)}» ليس PDF سليمًا أو أنه تالف. جرّب ملفًا آخر.</p>` });
    return;
  }
  const meta = (await DB.get('meta', key)) || {};
  const doc = {
    id: uid(), key, name, size: u8.length, bytes: u8, pdf, numPages: pdf.numPages,
    sizes: [], annots: meta.annots || {}, bookmarks: meta.bookmarks || [], undo: [],
    lastPage: meta.lastPage || 0, scale: meta.scale || 0, text: [], scrollTop: null,
  };
  S.docs.push(doc);
  const p1 = await pdf.getPage(1); const v1 = p1.getViewport({ scale: 1 });
  for (let i = 0; i < doc.numPages; i++) doc.sizes.push({ w: v1.width, h: v1.height, known: i === 0 });
  if (!opts.fromRecent && u8.length <= MAX_STORE) DB.put('files', key, u8);
  doc.thumb = await makeThumb(p1, 120).catch(() => null);
  saveMeta(doc, true);
  setLoading(false);
  renderTabs(); switchDoc(doc);
  fetchSizes(doc);
  Sound.ok(); flash();
}

function askPassword(wrong) {
  const wrap = document.createElement('div');
  wrap.innerHTML = `<p>${wrong ? 'كلمة السر غير صحيحة. أعد كتابتها.' : 'هذا الملف محمي بكلمة سر.'}</p>
    <div class="field" style="margin-top:12px"><label for="pw">كلمة سر الملف</label><input id="pw" type="password" autocomplete="off"></div>`;
  return dialog({
    title: 'ملف محمي', body: wrap,
    actions: [{ label: 'افتح', value: 'ok', cls: 'gold' }, { label: 'إلغاء', value: 'cancel' }],
    onOpen: b => setTimeout(() => $('#pw', b).focus(), 60),
  }).then(v => v === 'ok' ? $('#pw', wrap).value : null);
}

async function fetchSizes(doc) {
  for (let i = 1; i < doc.numPages; i++) {
    if (!S.docs.includes(doc)) return;
    if (doc.sizes[i].known) continue;
    try {
      const p = await doc.pdf.getPage(i + 1); const v = p.getViewport({ scale: 1 });
      setSize(doc, i, v.width, v.height);
    } catch (e) {}
    if (i % 25 === 0) await sleep(0);
  }
}
function setSize(doc, i, w, h) {
  const s = doc.sizes[i]; s.known = true;
  if (Math.abs(s.w - w) < .5 && Math.abs(s.h - h) < .5) return;
  s.w = w; s.h = h;
  if (doc === S.cur && pageEls[i]) {
    const before = pageEls[i].offsetTop < viewer.scrollTop;
    const oldH = pageEls[i].offsetHeight;
    sizePage(i);
    if (before) viewer.scrollTop += pageEls[i].offsetHeight - oldH;
  }
}

async function makeThumb(page, w) {
  const v = page.getViewport({ scale: 1 }); const s = w / v.width; const vp = page.getViewport({ scale: s });
  const c = document.createElement('canvas'); c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
  await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
  return c.toDataURL('image/jpeg', .7);
}

let metaT = {};
function saveMeta(doc, now) {
  clearTimeout(metaT[doc.key]);
  const go = () => DB.put('meta', doc.key, {
    key: doc.key, name: doc.name, size: doc.size, pages: doc.numPages, opened: Date.now(),
    lastPage: doc.lastPage, scale: doc.scale, annots: doc.annots, bookmarks: doc.bookmarks,
    thumb: doc.thumb, stored: doc.size <= MAX_STORE,
  });
  now ? go() : metaT[doc.key] = setTimeout(go, 600);
}

/* ───────── الشاشات ───────── */
const viewer = $('#viewer'), pagesEl = $('#pages');
let pageEls = [];

function showHome() {
  $('#reader').hidden = true; $('#home').hidden = false;
  document.body.classList.remove('reading');
  closeAllPop();
  renderRecent();
}
function showReader() {
  $('#home').hidden = true; $('#reader').hidden = false;
  document.body.classList.add('reading');
}
function setLoading(on, txt) { $('#loading').hidden = !on; if (txt) $('#loadingText').textContent = txt; }

async function renderRecent() {
  const list = $('#recentList');
  const all = ((await DB.all('meta')) || []).sort((a, b) => b.opened - a.opened);
  list.innerHTML = '';
  $('#recentEmpty').hidden = all.length > 0;
  all.slice(0, 30).forEach((m, i) => {
    const pct = m.pages ? Math.round(((m.lastPage || 0) + 1) / m.pages * 100) : 0;
    const n = Object.values(m.annots || {}).reduce((s, a) => s + a.length, 0);
    const el = document.createElement('div');
    el.className = 'rcard'; el.style.animationDelay = (i * 45) + 'ms';
    el.innerHTML = `
      <button class="rmain" style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;text-align:start;min-height:60px">
        <span class="rthumb">${m.thumb ? `<img src="${m.thumb}" alt="">` : '<svg><use href="#i-file"/></svg>'}</span>
        <span class="rinfo">
          <span class="rname">${esc(m.name)}</span>
          <span class="rmeta">${fmtNum(m.pages || 0)} صفحة · ${fmtSize(m.size)}${n ? ' · ' + fmtNum(n) + ' تعليق' : ''} · ${fmtDate(m.opened)}</span>
          <span class="rprog"><b style="width:${pct}%"></b></span>
        </span>
      </button>
      <button class="rdel" aria-label="أزل من القائمة"><svg><use href="#i-trash"/></svg></button>`;
    $('.rmain', el).onclick = () => openRecent(m);
    const del = $('.rdel', el);
    del.onclick = async () => {
      if (!del.classList.contains('arm')) {
        del.classList.add('arm'); del.textContent = 'اضغط للتأكيد'; Sound.tap(); vibrate(15);
        clearTimeout(del._t); del._t = setTimeout(() => { del.classList.remove('arm'); del.innerHTML = '<svg><use href="#i-trash"/></svg>'; }, 4000);
        return;
      }
      clearTimeout(del._t);
      await DB.del('meta', m.key); await DB.del('files', m.key);
      Sound.pop(); renderRecent(); toast(n ? 'أُزيل الملف وتعليقاته من القائمة' : 'أُزيل من القائمة');
    };
    list.appendChild(el);
  });
}
async function openRecent(m) {
  Sound.tap();
  const bytes = await DB.get('files', m.key);
  if (bytes) return openBytes(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes), m.name, { fromRecent: true });
  const v = await dialog({
    title: 'افتح الملف من جديد',
    body: `<p>«${esc(m.name)}» كبير فلم يُحفظ داخل التطبيق. اختره من هاتفك مرة أخرى، وتعود تعليقاتك وآخر صفحة كما كانت.</p>`,
    actions: [{ label: 'اختر الملف', value: 'pick', cls: 'gold' }, { label: 'إلغاء', value: 'cancel' }],
  });
  if (v === 'pick') pickFile();
}
const fmtSize = b => b > 1048576 ? new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 1 }).format(b / 1048576) + ' م.ب' : fmtNum(Math.max(1, Math.round(b / 1024))) + ' ك.ب';
function fmtDate(t) {
  if (!t) return '';
  const d = new Date(t), now = new Date();
  if (d.toDateString() === now.toDateString()) return 'اليوم ' + d.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' });
  return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' });
}

function pickFile() { const i = $('#fileInput'); i.value = ''; i.click(); }
$('#fileInput').addEventListener('change', async e => {
  for (const f of e.target.files) {
    const buf = new Uint8Array(await f.arrayBuffer());
    await openBytes(buf, f.name);
  }
});

/* ───────── التبويبات ───────── */
function renderTabs() {
  const t = $('#tabs'); t.innerHTML = '';
  S.docs.forEach(d => {
    const b = document.createElement('div');
    b.className = 'tab' + (d === S.cur ? ' on' : ''); b.setAttribute('role', 'tab');
    b.innerHTML = `<button class="tx" aria-label="أغلق"><svg><use href="#i-close"/></svg></button><button class="tname">${esc(d.name.replace(/\.pdf$/i, ''))}</button>`;
    $('.tname', b).onclick = () => { if (d !== S.cur) { Sound.tap(); switchDoc(d); } };
    $('.tx', b).onclick = () => closeDoc(d);
    t.appendChild(b);
  });
  const on = $('.tab.on', t); on && on.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
function closeDoc(d) {
  saveMeta(d, true);
  const i = S.docs.indexOf(d); S.docs.splice(i, 1);
  d.pdf.destroy();
  if (S.cur === d) {
    S.cur = null;
    if (S.docs.length) switchDoc(S.docs[Math.max(0, i - 1)]); else { pagesEl.innerHTML = ''; pageEls = []; showHome(); }
  }
  renderTabs();
}

/* ───────── بناء الصفحات ───────── */
let io;
function switchDoc(doc) {
  if (S.cur) { S.cur.scrollTop = viewer.scrollTop; S.cur.scrollLeft = viewer.scrollLeft; }
  S.cur = doc; clearSearch(true); closeAllPop();
  renderTabs();
  if (!doc.scale) doc.scale = fitScale(doc);
  buildPages();
  if (doc.scrollTop != null) { viewer.scrollTop = doc.scrollTop; viewer.scrollLeft = doc.scrollLeft; }
  else goPage(doc.lastPage, false);
  $('#pageTotal').textContent = fmtNum(doc.numPages);
  updateZoomLabel(); updateCurPage(); updateUndo();
  if (!$('#panel').hidden) renderPanel();
}
function fitScale(doc) {
  const w = viewer.clientWidth || innerWidth;
  return clamp((w - 16) / doc.sizes[0].w, .25, 6);
}
function buildPages() {
  const doc = S.cur;
  io && io.disconnect();
  pagesEl.innerHTML = ''; pageEls = [];
  io = new IntersectionObserver(onIntersect, { root: viewer, rootMargin: '120% 60%' });
  const frag = document.createDocumentFragment();
  for (let i = 0; i < doc.numPages; i++) {
    const el = document.createElement('div');
    el.className = 'page'; el.dataset.i = i;
    el.innerHTML = `<span class="ph">${fmtNum(i + 1)}</span>`;
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'annot');
    svg.setAttribute('preserveAspectRatio', 'none');
    el.appendChild(svg);
    pageEls.push(el); frag.appendChild(el);
    el._vis = false;
  }
  pagesEl.appendChild(frag);
  pageEls.forEach((el, i) => { sizePage(i); drawAnnots(i); io.observe(el); });
}
function sizePage(i) {
  const doc = S.cur, s = doc.sizes[i], el = pageEls[i];
  el.style.width = Math.round(s.w * doc.scale) + 'px';
  el.style.height = Math.round(s.h * doc.scale) + 'px';
  $('svg.annot', el).setAttribute('viewBox', `0 0 ${s.w} ${s.h}`);
}
function onIntersect(entries) {
  for (const e of entries) {
    const el = e.target; el._vis = e.isIntersecting;
    if (e.isIntersecting) queueRender(+el.dataset.i);
  }
  scheduleCleanup();
}
const renderQ = new Set(); let rendering = 0;
function queueRender(i) { renderQ.add(i); pump(); }
async function pump() {
  if (rendering >= 2) return;
  const doc = S.cur; if (!doc) return;
  // الأقرب إلى الصفحة الحالية أولًا
  const list = [...renderQ].filter(i => pageEls[i] && pageEls[i]._vis).sort((a, b) => Math.abs(a - curPage) - Math.abs(b - curPage));
  renderQ.clear();
  list.slice(2).forEach(i => renderQ.add(i));
  for (const i of list.slice(0, 2 - rendering)) {
    rendering++;
    renderPage(doc, i).catch(e => console.warn(e)).finally(() => { rendering--; pump(); });
  }
}
async function renderPage(doc, i) {
  const el = pageEls[i];
  if (!el || doc !== S.cur || el._scale === doc.scale) return;
  const scale = doc.scale;
  const page = await doc.pdf.getPage(i + 1);
  const base = page.getViewport({ scale: 1 });
  setSize(doc, i, base.width, base.height);
  const vp = page.getViewport({ scale });
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  let out = dpr; const MAXPX = 14e6;
  if (vp.width * vp.height * out * out > MAXPX) out = Math.sqrt(MAXPX / (vp.width * vp.height));
  const c = document.createElement('canvas'); c.className = 'pc';
  c.width = Math.floor(vp.width * out); c.height = Math.floor(vp.height * out);
  const ctx = c.getContext('2d', { alpha: false });
  if (el._task) { try { el._task.cancel(); } catch (e) {} }
  const task = page.render({ canvasContext: ctx, viewport: vp, transform: out !== 1 ? [out, 0, 0, out, 0, 0] : null });
  el._task = task;
  try { await task.promise; } catch (e) { return; }
  el._task = null;
  if (doc !== S.cur || scale !== doc.scale) { c.width = c.height = 0; return; }
  const old = $('canvas.pc', el); old ? (old.replaceWith(c), old.width = old.height = 0) : el.prepend(c);
  const ph = $('.ph', el); ph && ph.remove();
  if (!el._scale) { el.classList.add('fresh'); setTimeout(() => el.classList.remove('fresh'), 500); }
  el._scale = scale;
  // طبقة النص
  let tl = $('.textLayer', el);
  if (tl) tl.remove();
  tl = document.createElement('div'); tl.className = 'textLayer';
  tl.style.setProperty('--scale-factor', scale);
  el.insertBefore(tl, $('svg.annot', el));
  try {
    const tc = await getText(doc, i, page);
    const layer = new pdfjsLib.TextLayer({ textContentSource: tc, container: tl, viewport: vp });
    await layer.render();
    tl.addEventListener('pointerdown', () => tl.classList.add('selecting'));
  } catch (e) {}
  // الروابط
  renderLinks(doc, i, page, vp, el);
  if (search.q) paintHits(i);
}
async function getText(doc, i, page) {
  if (doc.text[i]) return doc.text[i];
  page ||= await doc.pdf.getPage(i + 1);
  const tc = await page.getTextContent();
  doc.text[i] = tc; return tc;
}
async function renderLinks(doc, i, page, vp, el) {
  $('.links', el)?.remove();
  let anns; try { anns = await page.getAnnotations({ intent: 'display' }); } catch (e) { return; }
  const links = anns.filter(a => a.subtype === 'Link' && (a.url || a.dest));
  if (!links.length) return;
  const box = document.createElement('div'); box.className = 'links';
  for (const a of links) {
    const r = vp.convertToViewportRectangle(a.rect);
    const x = Math.min(r[0], r[2]), y = Math.min(r[1], r[3]);
    const l = document.createElement('a');
    Object.assign(l.style, { left: x + 'px', top: y + 'px', width: Math.abs(r[2] - r[0]) + 'px', height: Math.abs(r[3] - r[1]) + 'px' });
    if (a.url) { l.href = a.url; l.target = '_blank'; l.rel = 'noopener'; }
    else l.href = '#', l.onclick = ev => { ev.preventDefault(); goDest(a.dest); };
    box.appendChild(l);
  }
  el.appendChild(box);
}
let cleanT;
function scheduleCleanup() {
  clearTimeout(cleanT);
  cleanT = setTimeout(() => {
    pageEls.forEach((el, i) => {
      if (Math.abs(i - curPage) > 6 && el._scale) {
        const c = $('canvas.pc', el); if (c) { c.width = c.height = 0; c.remove(); }
        $('.textLayer', el)?.remove(); $('.links', el)?.remove();
        el._scale = 0;
        if (!$('.ph', el)) el.insertAdjacentHTML('afterbegin', `<span class="ph">${fmtNum(i + 1)}</span>`);
      }
    });
  }, 400);
}

/* ───────── التنقل والتكبير ───────── */
let curPage = 0;
function pageAtScroll() {
  const y = viewer.scrollTop + viewer.clientHeight * .35;
  let lo = 0, hi = pageEls.length - 1, ans = 0;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (pageEls[m].offsetTop <= y) { ans = m; lo = m + 1; } else hi = m - 1; }
  return ans;
}
function updateCurPage() {
  if (!S.cur || !pageEls.length) return;
  const p = pageAtScroll();
  if (p !== curPage) {
    curPage = p; S.cur.lastPage = p; saveMeta(S.cur);
    const chip = $('#pageChip'); chip.classList.remove('bump'); void chip.offsetWidth; chip.classList.add('bump');
    $$('.th.on').forEach(t => t.classList.remove('on'));
    const th = $(`.th[data-i="${p}"]`); th && th.classList.add('on');
  }
  $('#pageNow').textContent = fmtNum(curPage + 1);
  updateBookmarkLabel();
}
let scrollRaf;
viewer.addEventListener('scroll', () => {
  if (scrollRaf) return;
  scrollRaf = requestAnimationFrame(() => { scrollRaf = 0; updateCurPage(); hideSelPop(); });
}, { passive: true });

function goPage(i, smooth = true) {
  i = clamp(i, 0, (S.cur?.numPages || 1) - 1);
  const el = pageEls[i]; if (!el) return;
  viewer.scrollTo({ top: el.offsetTop - 8, behavior: smooth ? 'smooth' : 'auto' });
  if (!smooth) { curPage = i; updateCurPage(); }
}
async function goDest(dest) {
  const doc = S.cur; if (!doc) return;
  try {
    const d = typeof dest === 'string' ? await doc.pdf.getDestination(dest) : dest;
    if (!d) return;
    const idx = typeof d[0] === 'object' ? await doc.pdf.getPageIndex(d[0]) : d[0];
    goPage(idx);
  } catch (e) { console.warn(e); }
}

function setScale(ns, fx, fy) {
  const doc = S.cur; if (!doc) return;
  ns = clamp(ns, .25, 6);
  const k = ns / doc.scale; if (Math.abs(k - 1) < .001) return;
  fx ??= viewer.clientWidth / 2; fy ??= viewer.clientHeight / 2;
  const sl = viewer.scrollLeft, st = viewer.scrollTop;
  doc.scale = ns;
  pageEls.forEach((el, i) => sizePage(i));
  viewer.scrollLeft = (sl + fx) * k - fx;
  viewer.scrollTop = (st + fy) * k - fy;
  pageEls.forEach(el => { if (el._scale) { el._scale = -1; } });
  pageEls.forEach((el, i) => { if (el._vis) queueRender(i); });
  updateZoomLabel(); saveMeta(doc);
}
function updateZoomLabel() { $('#zoomVal').textContent = fmtNum(Math.round((S.cur?.scale || 1) * 100)) + '٪'; }
$('#zoomIn').onclick = () => { Sound.tap(); setScale(S.cur.scale * 1.25); };
$('#zoomOut').onclick = () => { Sound.tap(); setScale(S.cur.scale / 1.25); };
$('#zoomVal').onclick = () => { Sound.tap(); setScale(fitScale(S.cur)); };

// الضم بإصبعين للتكبير والتحريك
(() => {
  let g = null;
  const pts = e => [...e.touches].slice(0, 2).map(t => ({ x: t.clientX, y: t.clientY }));
  const dist = p => Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
  const mid = p => ({ x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 });
  viewer.addEventListener('touchstart', e => {
    if (e.touches.length !== 2 || !S.cur) return;
    cancelStroke();
    const p = pts(e), r = viewer.getBoundingClientRect(), m = mid(p);
    g = { d0: dist(p), m0: m, fx: m.x - r.left, fy: m.y - r.top, k: 1, dx: 0, dy: 0, sl: viewer.scrollLeft, st: viewer.scrollTop };
    pagesEl.style.transformOrigin = `${g.sl + g.fx}px ${g.st + g.fy}px`;
  }, { passive: true });
  viewer.addEventListener('touchmove', e => {
    if (!g || e.touches.length !== 2) return;
    e.preventDefault();
    const p = pts(e), m = mid(p);
    g.k = clamp(dist(p) / g.d0, .25 / S.cur.scale, 6 / S.cur.scale);
    g.dx = m.x - g.m0.x; g.dy = m.y - g.m0.y;
    pagesEl.style.transform = `translate(${g.dx}px,${g.dy}px) scale(${g.k})`;
  }, { passive: false });
  const end = () => {
    if (!g) return;
    const { k, dx, dy, fx, fy } = g; g = null;
    pagesEl.style.transform = ''; pagesEl.style.transformOrigin = '';
    const doc = S.cur, ns = clamp(doc.scale * k, .25, 6), kk = ns / doc.scale;
    const sl = viewer.scrollLeft, st = viewer.scrollTop;
    if (Math.abs(kk - 1) > .01) {
      doc.scale = ns; pageEls.forEach((el, i) => sizePage(i));
      pageEls.forEach(el => { if (el._scale) el._scale = -1; });
      pageEls.forEach((el, i) => { if (el._vis) queueRender(i); });
      updateZoomLabel(); saveMeta(doc);
    }
    viewer.scrollLeft = (sl + fx) * kk - fx - dx;
    viewer.scrollTop = (st + fy) * kk - fy - dy;
  };
  viewer.addEventListener('touchend', e => { if (e.touches.length < 2) end(); });
  viewer.addEventListener('touchcancel', end);
  // عجلة الفأرة مع Ctrl
  viewer.addEventListener('wheel', e => {
    if (!e.ctrlKey || !S.cur) return; e.preventDefault();
    const r = viewer.getBoundingClientRect();
    setScale(S.cur.scale * (e.deltaY < 0 ? 1.1 : 1 / 1.1), e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });
})();

$('#pageChip').onclick = () => gotoDialog();
async function gotoDialog() {
  const doc = S.cur; if (!doc) return;
  const w = document.createElement('div');
  w.innerHTML = `<div class="field"><label for="gp">رقم الصفحة (من ١ إلى ${fmtNum(doc.numPages)})</label><input id="gp" type="number" inputmode="numeric" min="1" max="${doc.numPages}" value="${curPage + 1}"></div>`;
  const v = await dialog({
    title: 'اذهب إلى صفحة', body: w,
    actions: [{ label: 'اذهب', value: 'ok', cls: 'gold' }, { label: 'إلغاء', value: 'cancel' }],
    onOpen: b => setTimeout(() => { const i = $('#gp', b); i.focus(); i.select(); }, 60),
  });
  if (v !== 'ok') return;
  const n = parseInt(toLatin($('#gp', w).value), 10);
  if (n >= 1 && n <= doc.numPages) goPage(n - 1); else toast('اكتب رقمًا من ١ إلى ' + fmtNum(doc.numPages), 'err');
}
const toLatin = s => String(s).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));

/* ───────── التعليقات: الرسم ───────── */
function svgEl(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  parent && parent.appendChild(e); return e;
}
function pathD(pts) {
  if (pts.length < 2) { const [x, y] = pts[0]; return `M${x} ${y}l.01 0`; }
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += `Q${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  const l = pts[pts.length - 1]; d += `L${l[0].toFixed(1)} ${l[1].toFixed(1)}`;
  return d;
}
const isRTL = s => /[֐-ࣿיִ-ﻼ]/.test((s.match(/[A-Za-z֐-ࣿיִ-ﻼ]/) || [''])[0]);
const textFont = (size, bold) => `${bold ? 700 : 500} ${size}px Tajawal, sans-serif`;

function drawAnnots(i) {
  const doc = S.cur, el = pageEls[i]; if (!el) return;
  const svg = $('svg.annot', el); svg.innerHTML = '';
  const list = doc.annots[i] || [];
  for (const a of list) {
    const g = svgEl('g', { 'data-id': a.id }, svg);
    if (a.type === 'ink') {
      svgEl('path', { d: pathD(a.pts), fill: 'none', stroke: a.color, 'stroke-width': a.w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: a.op ?? 1, style: a.op < 1 ? 'mix-blend-mode:multiply' : '' }, g);
      svgEl('path', { d: pathD(a.pts), fill: 'none', stroke: 'transparent', 'stroke-width': a.w + 12, 'stroke-linecap': 'round' }, g);
    } else if (a.type === 'shape') {
      g.setAttribute('class', 'hit');
      shapeSvg(a, g).forEach(n => { const c = n.cloneNode(); c.setAttribute('stroke', 'transparent'); c.setAttribute('stroke-width', a.w + 14); c.setAttribute('fill', 'none'); c.setAttribute('pointer-events', 'stroke'); g.appendChild(c); });
    } else if (a.type === 'hl' || a.type === 'ul' || a.type === 'st') {
      g.setAttribute('class', 'hit');
      for (const [x, y, w, h] of a.rects) {
        if (a.type === 'hl') svgEl('rect', { x, y, width: w, height: h, fill: a.color, opacity: .42, rx: 1.5, style: 'mix-blend-mode:multiply' }, g);
        else {
          const ly = a.type === 'ul' ? y + h - .6 : y + h * .55;
          svgEl('rect', { x, y, width: w, height: h, fill: 'transparent' }, g);
          svgEl('line', { x1: x, x2: x + w, y1: ly, y2: ly, stroke: a.color, 'stroke-width': Math.max(1, h * .08) }, g);
        }
      }
    } else if (a.type === 'text') {
      g.setAttribute('class', 'hit');
      const rtl = isRTL(a.text), lines = a.text.split('\n');
      const t = svgEl('text', { x: a.x, y: a.y + a.size, fill: a.color, 'font-size': a.size, 'font-family': 'Tajawal, sans-serif', 'font-weight': 500, direction: rtl ? 'rtl' : 'ltr', 'text-anchor': 'start', 'unicode-bidi': 'plaintext' }, g);
      lines.forEach((ln, k) => { const s = svgEl('tspan', { x: a.x, dy: k ? a.size * 1.35 : 0 }, t); s.textContent = ln || ' '; });
      const w = Math.max(...lines.map(l => measure(l, a.size))) + 8, h = lines.length * a.size * 1.35 + 6;
      svgEl('rect', { x: rtl ? a.x - w + 4 : a.x - 4, y: a.y - 2, width: w, height: h, fill: 'transparent', stroke: 'rgba(242,182,50,.0)' }, g).classList.add('tbox');
    } else if (a.type === 'note') {
      g.setAttribute('class', 'hit');
      const L = noteLayout(a, doc.sizes[i]);
      svgEl('rect', { x: L.cx, y: L.cy, width: L.w, height: L.h, rx: 5, fill: '#fff6cf', stroke: '#d9a52a', 'stroke-width': .9, filter: 'drop-shadow(0 1.5px 2px rgba(0,0,0,.18))' }, g);
      L.lines.forEach((ln, k) => { const t = svgEl('text', { x: L.cx + L.w - 7, y: L.cy + 15 + k * NOTE_LH, fill: '#3a2a10', 'font-size': NOTE_FS, 'font-family': 'Tajawal, sans-serif', 'font-weight': 500, 'text-anchor': 'start', direction: 'rtl' }, g); t.textContent = ln; });
      const ic = svgEl('g', { transform: `translate(${a.x - 11} ${a.y - 11})` }, g);
      svgEl('rect', { x: 0, y: 0, width: 22, height: 22, rx: 5, fill: '#c8963e', stroke: '#8f6310', 'stroke-width': 1 }, ic);
      svgEl('path', { d: 'M5.5 7.5h11M5.5 11h11M5.5 14.5h6.5', stroke: '#fff', 'stroke-width': 1.7, 'stroke-linecap': 'round', fill: 'none' }, ic);
    } else if (a.type === 'stamp') {
      g.setAttribute('class', 'hit');
      const w = a.w || stampW(a), h = 46;
      g.setAttribute('transform', `translate(${a.x} ${a.y}) rotate(-8)`);
      svgEl('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 7, fill: 'rgba(255,255,255,.08)', stroke: a.color, 'stroke-width': 2.6 }, g);
      svgEl('rect', { x: -w / 2 + 4, y: -h / 2 + 4, width: w - 8, height: h - 8, rx: 5, fill: 'none', stroke: a.color, 'stroke-width': 1 }, g);
      const t = svgEl('text', { x: 0, y: -1, fill: a.color, 'font-size': 20, 'font-family': 'Tajawal, sans-serif', 'font-weight': 700, 'text-anchor': 'middle', direction: 'rtl' }, g);
      t.textContent = a.label;
      const d = svgEl('text', { x: 0, y: 15, fill: a.color, 'font-size': 10, 'font-family': 'Tajawal, sans-serif', 'text-anchor': 'middle', direction: 'rtl' }, g);
      d.textContent = a.date;
    }
  }
}
let mctx;
const NOTE_FS = 10, NOTE_LH = 14, NOTE_MAX = 170;
function noteLayout(a, size) {
  mctx ||= document.createElement('canvas').getContext('2d');
  mctx.font = textFont(NOTE_FS);
  const lines = wrap(mctx, a.text, NOTE_MAX);
  const w = Math.min(NOTE_MAX + 14, Math.max(60, ...lines.map(l => mctx.measureText(l).width)) + 14);
  const h = lines.length * NOTE_LH + 8;
  let cx = a.x + 11 - w, cy = a.y + 14;
  if (size) { cx = clamp(cx, 2, size.w - w - 2); if (cy + h > size.h - 2) cy = Math.max(2, a.y - 14 - h); }
  return { lines, w, h, cx, cy };
}
function measure(s, size, bold) { mctx ||= document.createElement('canvas').getContext('2d'); mctx.font = textFont(size, bold); return mctx.measureText(s).width; }
function stampW(a) { mctx ||= document.createElement('canvas').getContext('2d'); mctx.font = '700 20px Tajawal'; return Math.max(120, mctx.measureText(a.label).width + 44); }

function addAnnot(i, a, record = true) {
  const doc = S.cur;
  a.id ||= uid();
  (doc.annots[i] ||= []).push(a);
  if (record) doc.undo.push({ op: 'add', i, a });
  drawAnnots(i); saveMeta(doc); updateUndo();
}
function removeAnnot(i, id, record = true) {
  const doc = S.cur, list = doc.annots[i] || [], k = list.findIndex(a => a.id === id);
  if (k < 0) return;
  const [a] = list.splice(k, 1);
  if (!list.length) delete doc.annots[i];
  if (record) doc.undo.push({ op: 'del', i, a, k });
  drawAnnots(i); saveMeta(doc); updateUndo();
}
function updateAnnot(i, a, patch) {
  const doc = S.cur; const before = { ...a };
  Object.assign(a, patch);
  doc.undo.push({ op: 'upd', i, a, before });
  drawAnnots(i); saveMeta(doc); updateUndo();
}
function undo() {
  const doc = S.cur; const u = doc?.undo.pop(); if (!u) return;
  Sound.tap();
  if (u.op === 'add') removeAnnot(u.i, u.a.id, false);
  else if (u.op === 'del') { const l = (doc.annots[u.i] ||= []); l.splice(u.k, 0, u.a); drawAnnots(u.i); saveMeta(doc); }
  else if (u.op === 'upd') { Object.keys(u.a).forEach(k => delete u.a[k]); Object.assign(u.a, u.before); drawAnnots(u.i); saveMeta(doc); }
  goPageIfFar(u.i); updateUndo();
}
function goPageIfFar(i) { if (Math.abs(i - curPage) > 0) goPage(i); }
function updateUndo() { $('#btnUndo').disabled = !(S.cur && S.cur.undo.length); }
$('#btnUndo').onclick = undo;
const findAnnot = (i, id) => (S.cur.annots[i] || []).find(a => a.id === id);

/* ───────── الأدوات ───────── */
const HINTS = {
  marker: 'مرّر إصبعك على السطر لتظليله · للتمرير اختر «قراءة»',
  pen: 'ارسم أو اكتب بإصبعك على الصفحة',
  shape: 'اسحب إصبعك على الصفحة لرسم الشكل، أو اضغط لوضعه بحجم جاهز',
  text: 'اضغط حيث تريد كتابة النص',
  note: 'اضغط حيث تريد وضع الملاحظة',
  stamp: 'اضغط حيث تريد وضع الختم',
  eraser: 'اضغط على أي تعليق لحذفه',
};
function setTool(t) {
  S.tool = t;
  $$('.tool[data-tool]').forEach(b => b.classList.toggle('active', b.dataset.tool === t));
  viewer.classList.toggle('drawing', ['marker', 'pen', 'shape'].includes(t));
  viewer.classList.toggle('erasing', t === 'eraser');
  const h = $('#toolhint');
  if (HINTS[t]) { h.textContent = HINTS[t]; h.hidden = false; clearTimeout(h._t); h._t = setTimeout(() => h.hidden = true, 2600); } else h.hidden = true;
  renderColorbar();
}
$$('.tool[data-tool]').forEach(b => b.onclick = async () => {
  Sound.tap(); vibrate(8);
  const t = b.dataset.tool;
  if (t === 'stamp') { const s = await chooseStamp(); if (!s) return; S.stamp = s; }
  setTool(S.tool === t && t !== 'hand' && t !== 'stamp' ? 'hand' : t);
});
function renderColorbar() {
  const bar = $('#colorbar'), t = S.tool;
  if (!COLORS[t]) { bar.hidden = true; return; }
  bar.innerHTML = ''; bar.hidden = false;
  if (t === 'shape') {
    SHAPES.forEach(([k, label, d]) => {
      const b = document.createElement('button'); b.className = 'w sh' + (S.shape === k ? ' on' : ''); b.setAttribute('aria-label', label); b.title = label;
      b.innerHTML = `<svg viewBox="0 0 24 24">${d}</svg>`;
      b.onclick = () => { S.shape = k; Sound.tap(); renderColorbar(); };
      bar.appendChild(b);
    });
    bar.insertAdjacentHTML('beforeend', '<i class="sep"></i>');
  }
  COLORS[t].forEach(c => {
    const b = document.createElement('button'); b.className = 'c' + (S.color[t] === c ? ' on' : ''); b.style.background = c;
    b.setAttribute('aria-label', 'لون'); b.onclick = () => { S.color[t] = c; Sound.tap(); renderColorbar(); };
    bar.appendChild(b);
  });
  if (S.width[t]) {
    bar.insertAdjacentHTML('beforeend', '<i class="sep"></i>');
    const opts = t === 'pen' ? [[1.5, 'رفيع'], [2.5, 'وسط'], [5, 'عريض']] : t === 'shape' ? [[1.2, 'رفيع'], [2, 'وسط'], [4, 'عريض']] : [[10, 'رفيع'], [16, 'وسط'], [24, 'عريض']];
    opts.forEach(([w, l]) => {
      const b = document.createElement('button'); b.className = 'w' + (S.width[t] === w ? ' on' : ''); b.textContent = l;
      b.onclick = () => { S.width[t] = w; Sound.tap(); renderColorbar(); };
      bar.appendChild(b);
    });
  }
}

function pagePoint(el, e) {
  const r = el.getBoundingClientRect(), s = S.cur.sizes[+el.dataset.i];
  return [(e.clientX - r.left) / r.width * s.w, (e.clientY - r.top) / r.height * s.h];
}

// الرسم الحر
let stroke = null;
function cancelStroke() { if (stroke) { stroke.live.remove(); stroke = null; } }
pagesEl.addEventListener('pointerdown', e => {
  const el = e.target.closest('.page'); if (!el || !S.cur) return;
  const t = S.tool;
  if (t === 'shape') {
    if (shapeDrag) { shapeDrag.live.remove(); shapeDrag = null; return; }
    if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    const i = +el.dataset.i, s = S.cur.sizes[i], [x, y] = pagePoint(el, e);
    const live = svgEl('svg', { class: 'live', viewBox: `0 0 ${s.w} ${s.h}`, preserveAspectRatio: 'none' }); el.appendChild(live);
    shapeDrag = { el, i, live, id: e.pointerId, a: { type: 'shape', kind: S.shape, x1: x, y1: y, x2: x, y2: y, color: S.color.shape, w: S.width.shape } };
    try { el.setPointerCapture(e.pointerId); } catch (er) {}
    return;
  }
  if (t === 'marker' || t === 'pen') {
    if (stroke) { cancelStroke(); return; }
    if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    const i = +el.dataset.i, s = S.cur.sizes[i];
    const live = svgEl('svg', { class: 'live', viewBox: `0 0 ${s.w} ${s.h}`, preserveAspectRatio: 'none' });
    el.appendChild(live);
    const w = t === 'pen' ? S.width.pen : S.width.marker;
    const path = svgEl('path', { fill: 'none', stroke: S.color[t], 'stroke-width': w, 'stroke-linecap': t === 'marker' ? 'butt' : 'round', 'stroke-linejoin': 'round', opacity: t === 'marker' ? .42 : 1 }, live);
    stroke = { el, i, live, path, pts: [pagePoint(el, e)], t, w, id: e.pointerId };
    try { el.setPointerCapture(e.pointerId); } catch (er) {}
  }
});
let shapeDrag = null;
function shapeSvg(a, parent) {
  const st = { fill: 'none', stroke: a.color, 'stroke-width': a.w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
  const x = Math.min(a.x1, a.x2), y = Math.min(a.y1, a.y2), w = Math.abs(a.x2 - a.x1), h = Math.abs(a.y2 - a.y1);
  const out = [];
  if (a.kind === 'rect') out.push(svgEl('rect', { x, y, width: w, height: h, ...st }, parent));
  else if (a.kind === 'ellipse') out.push(svgEl('ellipse', { cx: x + w / 2, cy: y + h / 2, rx: w / 2, ry: h / 2, ...st }, parent));
  else if (a.kind === 'tri') out.push(svgEl('path', { d: `M${x + w / 2} ${y}L${x + w} ${y + h}H${x}Z`, ...st }, parent));
  else {
    out.push(svgEl('path', { d: `M${a.x1} ${a.y1}L${a.x2} ${a.y2}`, ...st }, parent));
    if (a.kind === 'arrow') out.push(svgEl('path', { d: arrowHead(a), ...st }, parent));
  }
  return out;
}
function arrowHead(a) {
  const ang = Math.atan2(a.y2 - a.y1, a.x2 - a.x1), L = 6 + a.w * 3, sp = .45;
  const p1 = [a.x2 - L * Math.cos(ang - sp), a.y2 - L * Math.sin(ang - sp)], p2 = [a.x2 - L * Math.cos(ang + sp), a.y2 - L * Math.sin(ang + sp)];
  return `M${p1[0]} ${p1[1]}L${a.x2} ${a.y2}L${p2[0]} ${p2[1]}`;
}
pagesEl.addEventListener('pointermove', e => {
  if (shapeDrag && e.pointerId === shapeDrag.id) {
    const [x, y] = pagePoint(shapeDrag.el, e); shapeDrag.a.x2 = x; shapeDrag.a.y2 = y;
    shapeDrag.live.innerHTML = ''; shapeSvg(shapeDrag.a, shapeDrag.live); return;
  }
  if (!stroke || e.pointerId !== stroke.id) return;
  const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
  for (const ev of evs) {
    const p = pagePoint(stroke.el, ev), l = stroke.pts[stroke.pts.length - 1];
    if (Math.hypot(p[0] - l[0], p[1] - l[1]) > .7) stroke.pts.push(p);
  }
  let pts = stroke.pts;
  if (stroke.t === 'marker') pts = straighten(pts);
  stroke.path.setAttribute('d', pathD(pts));
});
function finishShape(e) {
  if (!shapeDrag || (e && e.pointerId !== shapeDrag.id)) return false;
  const d = shapeDrag; shapeDrag = null; d.live.remove();
  const a = d.a;
  if (Math.hypot(a.x2 - a.x1, a.y2 - a.y1) < 6) {
    // ضغطة بلا سحب: شكل بحجم جاهز حول نقطة الضغط
    const W = a.kind === 'line' || a.kind === 'arrow' ? 80 : 70, H = a.kind === 'line' || a.kind === 'arrow' ? 0 : 50;
    if (a.kind === 'line' || a.kind === 'arrow') { a.x2 = a.x1; a.x1 = a.x1 - W; } else { a.x1 -= W / 2; a.y1 -= H / 2; a.x2 = a.x1 + W; a.y2 = a.y1 + H; }
  }
  ['x1', 'y1', 'x2', 'y2'].forEach(k => a[k] = +a[k].toFixed(1));
  addAnnot(d.i, a); Sound.tap(); vibrate(8);
  return true;
}
const finishStroke = e => {
  if (finishShape(e)) return;
  if (!stroke || (e && e.pointerId !== stroke.id)) return;
  const s = stroke; stroke = null; s.live.remove();
  let pts = s.pts;
  if (s.pts.length < 2 && s.t === 'marker') return;
  if (s.t === 'marker') pts = straighten(pts);
  addAnnot(s.i, { type: 'ink', pts: pts.map(p => [+p[0].toFixed(1), +p[1].toFixed(1)]), color: S.color[s.t], w: s.w, op: s.t === 'marker' ? .42 : 1, tool: s.t });
  vibrate(6);
};
pagesEl.addEventListener('pointerup', finishStroke);
pagesEl.addEventListener('pointercancel', () => { cancelStroke(); if (shapeDrag) { shapeDrag.live.remove(); shapeDrag = null; } });
// قلم التظليل: الخط الأفقي تقريبًا يُسوّى ليبدو تظليلًا مرتبًا
function straighten(pts) {
  if (pts.length < 3) return pts;
  const a = pts[0], b = pts[pts.length - 1];
  const dy = Math.max(...pts.map(p => p[1])) - Math.min(...pts.map(p => p[1]));
  if (Math.abs(b[0] - a[0]) > 30 && dy < 14) { const y = pts.reduce((s, p) => s + p[1], 0) / pts.length; return [[a[0], y], [b[0], y]]; }
  return pts;
}

// الضغط على الصفحة: نص، ملاحظة، ختم، ممحاة، فتح تعليق
pagesEl.addEventListener('click', async e => {
  const el = e.target.closest('.page'); if (!el || !S.cur) return;
  const i = +el.dataset.i, g = e.target.closest('svg.annot g[data-id]');
  const t = S.tool;
  if (t === 'eraser') {
    if (g) { removeAnnot(i, g.dataset.id); Sound.pop(); vibrate(15); toast('حُذف التعليق · «تراجع» يعيده'); }
    return;
  }
  if (g && (t === 'hand' || t === 'text' || t === 'note' || t === 'stamp')) {
    const a = findAnnot(i, g.dataset.id); if (a) { e.stopPropagation(); return editAnnot(i, a); }
  }
  const [x, y] = pagePoint(el, e);
  if (t === 'text') {
    const r = await textDialog({ text: '', size: 14, color: S.color.text });
    if (r) { S.color.text = r.color; addAnnot(i, { type: 'text', x, y, ...r }); Sound.ok(); }
  } else if (t === 'note') {
    const r = await noteDialog('');
    if (r != null && r.trim()) { addAnnot(i, { type: 'note', x, y, text: r.trim() }); Sound.ok(); toast('وُضعت الملاحظة على الصفحة', 'ok'); }
    else if (r != null) toast('اكتب نص الملاحظة أولًا', 'err');
  } else if (t === 'stamp' && S.stamp) {
    const a = { type: 'stamp', x, y, label: S.stamp.label, color: S.stamp.color, date: new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }) };
    a.w = stampW(a); addAnnot(i, a); Sound.ok(); vibrate(20);
  }
});

async function editAnnot(i, a) {
  Sound.tap();
  if (a.type === 'note') {
    const r = await noteDialog(a.text, true);
    if (r === '__del') return removeAnnot(i, a.id), toast('حُذفت الملاحظة');
    if (r != null && r !== a.text) updateAnnot(i, a, { text: r });
  } else if (a.type === 'text') {
    const r = await textDialog(a, true);
    if (r === '__del') return removeAnnot(i, a.id), toast('حُذف النص');
    if (r) updateAnnot(i, a, r);
  } else {
    const names = { hl: 'تظليل', ul: 'تسطير', st: 'شطب', stamp: 'ختم «' + a.label + '»', shape: SHAPE_NAME[a.kind] };
    const v = await dialog({
      title: names[a.type] || 'تعليق', body: a.text ? `<p>${esc(a.text)}</p>` : '<p>هل تريد حذف هذا التعليق؟</p>',
      actions: [{ label: 'احذفه', value: 'del', cls: 'danger' }, { label: 'إبقاء', value: 'cancel' }],
    });
    if (v === 'del') { removeAnnot(i, a.id); toast('حُذف · «تراجع» يعيده'); }
  }
}

function textDialog(a, editing) {
  const w = document.createElement('div');
  let size = a.size || 14, color = a.color || S.color.text;
  w.innerHTML = `
    <div class="field"><label for="tt">النص</label><textarea id="tt" dir="auto">${esc(a.text || '')}</textarea></div>
    <div class="field" style="margin-top:12px"><label>الحجم</label><div class="chips" id="tsz"></div></div>
    <div class="field" style="margin-top:12px"><label>اللون</label><div class="chips" id="tcol"></div></div>`;
  const sz = $('#tsz', w), cl = $('#tcol', w);
  [[10, 'صغير'], [14, 'وسط'], [20, 'كبير'], [28, 'عنوان']].forEach(([v, l]) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'chip' + (v === size ? ' on' : ''); b.textContent = l;
    b.onclick = () => { size = v; $$('.chip', sz).forEach(x => x.classList.remove('on')); b.classList.add('on'); }; sz.appendChild(b);
  });
  COLORS.text.forEach(c => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'chip col' + (c === color ? ' on' : ''); b.style.background = c; b.setAttribute('aria-label', 'لون');
    b.onclick = () => { color = c; $$('.chip', cl).forEach(x => x.classList.remove('on')); b.classList.add('on'); }; cl.appendChild(b);
  });
  const acts = [{ label: editing ? 'احفظ' : 'ضع النص', value: 'ok', cls: 'gold' }, { label: 'إلغاء', value: 'cancel' }];
  if (editing) acts.push({ label: 'احذف', value: 'del', cls: 'danger' });
  return dialog({ title: editing ? 'تعديل النص' : 'نص على الصفحة', body: w, actions: acts, onOpen: b => setTimeout(() => $('#tt', b).focus(), 80) })
    .then(v => {
      if (v === 'del') return '__del';
      const text = $('#tt', w).value.replace(/\s+$/, '');
      return v === 'ok' && text.trim() ? { text, size, color } : null;
    });
}
function noteDialog(text, editing) {
  const w = document.createElement('div');
  w.innerHTML = `<div class="field"><label for="nt">نص الملاحظة</label><textarea id="nt" dir="auto">${esc(text)}</textarea></div>`;
  const acts = [{ label: editing ? 'احفظ' : 'ضع الملاحظة', value: 'ok', cls: 'gold' }, { label: 'إلغاء', value: 'cancel' }];
  if (editing) acts.push({ label: 'احذف', value: 'del', cls: 'danger' });
  return dialog({ title: editing ? 'ملاحظة' : 'ملاحظة جديدة', body: w, actions: acts, onOpen: b => setTimeout(() => $('#nt', b).focus(), 80) })
    .then(v => v === 'del' ? '__del' : v === 'ok' ? $('#nt', w).value : null);
}
function chooseStamp() {
  const w = document.createElement('div'); w.className = 'stamps';
  let picked = null;
  STAMPS.forEach((s, k) => {
    const b = document.createElement('button'); b.type = 'submit'; b.value = 's' + k; b.className = 'stamp-opt'; b.style.color = s.color; b.textContent = s.label;
    w.appendChild(b);
  });
  return dialog({ title: 'اختر الختم', body: w, actions: [{ label: 'إلغاء', value: 'cancel' }] })
    .then(v => v.startsWith('s') ? STAMPS[+v.slice(1)] : null);
}

/* ───────── تحديد النص: تظليل وتسطير وشطب ───────── */
const selPop = $('#selPop');
let selT;
document.addEventListener('selectionchange', () => {
  clearTimeout(selT);
  selT = setTimeout(() => {
    const sel = getSelection();
    if (!sel.rangeCount || sel.isCollapsed || !S.cur || $('#reader').hidden) return hideSelPop();
    const r = sel.getRangeAt(0), node = r.commonAncestorContainer;
    const host = (node.nodeType === 1 ? node : node.parentElement)?.closest('.textLayer, .pages');
    if (!host) return hideSelPop();
    const b = r.getBoundingClientRect(); if (!b.width) return hideSelPop();
    selPop.hidden = false;
    const pw = selPop.offsetWidth, ph = selPop.offsetHeight;
    let top = b.bottom + 12; if (top + ph > innerHeight - 90) top = Math.max(60, b.top - ph - 12);
    selPop.style.top = top + 'px';
    selPop.style.left = clamp(b.left + b.width / 2 - pw / 2, 8, innerWidth - pw - 8) + 'px';
  }, 220);
});
function hideSelPop() { selPop.hidden = true; }
selPop.addEventListener('pointerdown', e => e.preventDefault());
selPop.addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return;
  const sel = getSelection(); if (!sel.rangeCount) return;
  const act = b.dataset.act;
  if (act === 'copy') {
    const txt = sel.toString();
    try { await navigator.clipboard.writeText(txt); } catch (er) { Bridge?.copy?.(txt); }
    toast('نُسخ النص', 'ok'); Sound.tap();
  } else {
    const byPage = new Map();
    for (const rect of sel.getRangeAt(0).getClientRects()) {
      if (rect.width < 1 || rect.height < 1) continue;
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      const el = document.elementsFromPoint(cx, cy).find(x => x.classList?.contains('page'));
      if (!el) continue;
      const pr = el.getBoundingClientRect(), i = +el.dataset.i, s = S.cur.sizes[i];
      const fx = s.w / pr.width, fy = s.h / pr.height;
      const R = [(rect.left - pr.left) * fx, (rect.top - pr.top) * fy, rect.width * fx, rect.height * fy];
      (byPage.get(i) || byPage.set(i, []).get(i)).push(R);
    }
    const colors = { hl: '#f3d36b', ul: '#1565c0', st: '#d32f2f' };
    const text = sel.toString().trim().slice(0, 300);
    for (const [i, rects] of byPage) addAnnot(i, { type: act, rects: mergeRects(rects), color: colors[act], text });
    if (byPage.size) { Sound.ok(); vibrate(12); }
  }
  sel.removeAllRanges(); hideSelPop();
});
function mergeRects(rs) {
  rs.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  const out = [];
  for (const r of rs) {
    const l = out[out.length - 1];
    if (l && Math.abs(l[1] - r[1]) < r[3] * .5 && r[0] <= l[0] + l[2] + 3) {
      const x2 = Math.max(l[0] + l[2], r[0] + r[2]), y2 = Math.max(l[1] + l[3], r[1] + r[3]);
      l[0] = Math.min(l[0], r[0]); l[1] = Math.min(l[1], r[1]); l[2] = x2 - l[0]; l[3] = y2 - l[1];
    } else out.push([...r]);
  }
  return out.map(r => r.map(v => +v.toFixed(1)));
}

/* ───────── البحث ───────── */
const search = { q: '', hits: [], k: -1, token: 0 };
function norm(s) {
  let t = '', map = [];
  for (let i = 0; i < s.length; i++) {
    let c = s[i];
    if (/[ً-ٰٟـۖ-ۭ]/.test(c)) continue;
    if (/[أإآٱ]/.test(c)) c = 'ا'; else if (c === 'ى') c = 'ي'; else if (c === 'ة') c = 'ه'; else if (c === 'ؤ') c = 'و'; else if (c === 'ئ') c = 'ي';
    t += c.toLowerCase(); map.push(i);
  }
  map.push(s.length);
  return { t, map };
}
const itemsText = tc => tc.items.filter(it => it.str !== undefined).map(it => it.str + (it.hasEOL ? '\n' : '')).join('');
async function runSearch(q) {
  const doc = S.cur; if (!doc) return;
  const tok = ++search.token;
  clearHits();
  search.q = q.trim(); search.hits = []; search.k = -1;
  if (!search.q) { $('#searchCount').textContent = ''; return; }
  const nq = norm(search.q).t.replace(/\s+/g, ' ');
  $('#searchCount').textContent = 'أبحث…';
  for (let i = 0; i < doc.numPages; i++) {
    if (tok !== search.token) return;
    const tc = await getText(doc, i);
    const { t } = norm(itemsText(tc).replace(/\s+/g, ' '));
    let at = t.indexOf(nq);
    while (at >= 0) { search.hits.push({ i }); at = t.indexOf(nq, at + nq.length); }
    if (search.hits.length && search.k < 0) { search.k = 0; showHit(); }
    if (i % 10 === 0) $('#searchCount').textContent = search.hits.length ? `${fmtNum(search.k + 1)} من ${fmtNum(search.hits.length)}…` : `أبحث… ${fmtNum(i + 1)}/${fmtNum(doc.numPages)}`;
  }
  if (tok !== search.token) return;
  if (!search.hits.length) { $('#searchCount').textContent = 'لا نتائج'; Sound.err(); }
  else updateCount();
  pageEls.forEach((el, i) => el._scale > 0 && paintHits(i));
}
function updateCount() { $('#searchCount').textContent = search.hits.length ? `${fmtNum(search.k + 1)} من ${fmtNum(search.hits.length)}` : ''; }
function showHit() {
  const h = search.hits[search.k]; if (!h) return;
  updateCount();
  const el = pageEls[h.i];
  const ord = search.hits.slice(0, search.k).filter(x => x.i === h.i).length;
  search.cur = { i: h.i, ord };
  if (el._scale > 0) { paintHits(h.i); scrollToCur(); }
  else { goPage(h.i, false); }
}
function scrollToCur() {
  const c = $('.hits i.cur', pagesEl); if (!c) return;
  const r = c.getBoundingClientRect(), vr = viewer.getBoundingClientRect();
  if (r.top < vr.top + 40 || r.bottom > vr.bottom - 100) viewer.scrollBy({ top: r.top - vr.top - vr.height * .35, behavior: 'smooth' });
}
function paintHits(i) {
  const el = pageEls[i]; if (!el) return;
  $('.hits', el)?.remove();
  if (!search.q) return;
  const tl = $('.textLayer', el); if (!tl) return;
  // نص الطبقة مع خريطة العقد
  const nodes = []; let full = '';
  const walk = n => {
    for (const c of n.childNodes) {
      if (c.nodeType === 3) { nodes.push({ n: c, s: full.length }); full += c.data; }
      else if (c.nodeName === 'BR') full += '\n';
      else if (c.nodeType === 1 && !c.classList.contains('endOfContent')) walk(c);
    }
  };
  walk(tl);
  // نطبّع المسافات مع الحفاظ على الخريطة
  let flat = '', fmap = [];
  for (let k = 0; k < full.length; k++) {
    const c = /\s/.test(full[k]) ? ' ' : full[k];
    if (c === ' ' && flat.endsWith(' ')) continue;
    flat += c; fmap.push(k);
  }
  fmap.push(full.length);
  const N = norm(flat), nq = norm(search.q).t.replace(/\s+/g, ' ');
  const box = document.createElement('div'); box.className = 'hits';
  const pr = el.getBoundingClientRect();
  let at = N.t.indexOf(nq), ord = 0;
  const locate = off => { let lo = 0, hi = nodes.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (nodes[m].s <= off) lo = m; else hi = m - 1; } const nd = nodes[lo]; return [nd.n, clamp(off - nd.s, 0, nd.n.data.length)]; };
  while (at >= 0 && nodes.length) {
    const s = fmap[N.map[at]], e = fmap[N.map[at + nq.length - 1] ] + 1;
    try {
      const rg = document.createRange(); const a = locate(s), b = locate(e - 1);
      rg.setStart(a[0], a[1]); rg.setEnd(b[0], Math.min(b[1] + 1, b[0].data.length));
      const isCur = search.cur && search.cur.i === i && search.cur.ord === ord;
      for (const r of rg.getClientRects()) {
        const d = document.createElement('i'); if (isCur) d.className = 'cur';
        Object.assign(d.style, { left: (r.left - pr.left) + 'px', top: (r.top - pr.top) + 'px', width: r.width + 'px', height: r.height + 'px' });
        box.appendChild(d);
      }
    } catch (er) {}
    ord++; at = N.t.indexOf(nq, at + nq.length);
  }
  el.appendChild(box);
  if (search.cur && search.cur.i === i) requestAnimationFrame(scrollToCur);
}
function clearHits() { $$('.hits', pagesEl).forEach(h => h.remove()); search.cur = null; }
function clearSearch(silent) { search.token++; search.q = ''; search.hits = []; clearHits(); $('#searchCount').textContent = ''; if (!silent) $('#searchInput').value = ''; }
$('#btnSearch').onclick = () => { Sound.tap(); const sb = $('#searchbar'); sb.hidden = !sb.hidden; if (!sb.hidden) setTimeout(() => $('#searchInput').focus(), 50); else clearSearch(); };
$('#searchClose').onclick = () => { $('#searchbar').hidden = true; clearSearch(); };
let sT;
$('#searchInput').addEventListener('input', e => { clearTimeout(sT); sT = setTimeout(() => runSearch(e.target.value), 450); });
$('#searchInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(sT); if (search.q === e.target.value.trim() && search.hits.length) step(1); else runSearch(e.target.value); e.target.blur(); } });
const step = d => { if (!search.hits.length) return; search.k = (search.k + d + search.hits.length) % search.hits.length; Sound.tap(); showHit(); };
$('#searchNext').onclick = () => step(1);
$('#searchPrev').onclick = () => step(-1);

/* ───────── اللوحة: فهرس، صفحات، علامات، تعليقات ───────── */
let panelTab = 'outline';
function openPanel() { $('#panel').hidden = false; $('#scrim').hidden = false; renderPanel(); Sound.pop(); }
function closePanel() { $('#panel').hidden = true; $('#scrim').hidden = true; thumbIO && thumbIO.disconnect(); }
$('#btnPanel').onclick = () => $('#panel').hidden ? openPanel() : closePanel();
$('#panelClose').onclick = closePanel;
$('#scrim').onclick = () => { closePanel(); closeMenu(); };
$$('#panelTabs button').forEach(b => b.onclick = () => { panelTab = b.dataset.p; Sound.tap(); renderPanel(); });
let thumbIO;
async function renderPanel() {
  const doc = S.cur, body = $('#panelBody'); if (!doc) return;
  $$('#panelTabs button').forEach(b => b.classList.toggle('on', b.dataset.p === panelTab));
  body.innerHTML = ''; thumbIO && thumbIO.disconnect();
  if (panelTab === 'outline') {
    let ol; try { ol = await doc.pdf.getOutline(); } catch (e) {}
    if (!ol || !ol.length) { body.innerHTML = '<div class="empty"><p>لا فهرس داخل هذا الملف. استعمل «الصفحات» للتنقل.</p></div>'; return; }
    const build = (items, parent) => items.forEach(it => {
      const b = document.createElement('button'); b.className = 'ol-item'; b.textContent = it.title;
      b.onclick = () => { if (it.dest) goDest(it.dest); else if (it.url) window.open(it.url, '_blank'); closePanel(); };
      parent.appendChild(b);
      if (it.items?.length) { const sub = document.createElement('div'); sub.className = 'ol-sub'; parent.appendChild(sub); build(it.items, sub); }
    });
    build(ol, body);
  } else if (panelTab === 'thumbs') {
    const g = document.createElement('div'); g.className = 'thumbs'; body.appendChild(g);
    thumbIO = new IntersectionObserver(es => es.forEach(async e => {
      if (!e.isIntersecting || e.target._done) return;
      e.target._done = 1; thumbIO.unobserve(e.target);
      try {
        const p = await doc.pdf.getPage(+e.target.dataset.i + 1); const v = p.getViewport({ scale: 1 });
        const vp = p.getViewport({ scale: 220 / v.width });
        const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
        await p.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
        const tc = $('.tc', e.target); tc.style.aspectRatio = ''; tc.appendChild(c);
      } catch (er) {}
    }), { root: body, rootMargin: '300px' });
    for (let i = 0; i < doc.numPages; i++) {
      const s = doc.sizes[i];
      const t = document.createElement('button'); t.className = 'th' + (i === curPage ? ' on' : ''); t.dataset.i = i;
      t.innerHTML = `<span class="tc" style="aspect-ratio:${s.w}/${s.h}"></span><span>${fmtNum(i + 1)}${doc.bookmarks.includes(i) ? ' 🔖' : ''}</span>`;
      t.onclick = () => { goPage(i, false); closePanel(); };
      g.appendChild(t); thumbIO.observe(t);
    }
    $('.th.on', g)?.scrollIntoView({ block: 'center' });
  } else if (panelTab === 'marks') {
    if (!doc.bookmarks.length) { body.innerHTML = '<div class="empty"><p>لا علامات بعد. من قائمة ⋮ اختر «ضع علامة على هذه الصفحة».</p></div>'; return; }
    [...doc.bookmarks].sort((a, b) => a - b).forEach((p, k) => {
      const b = document.createElement('div'); b.className = 'li'; b.style.animationDelay = k * 40 + 'ms';
      b.innerHTML = `<i class="dot" style="background:var(--gold)"></i><button class="lb" style="text-align:start;min-height:40px"><span class="lt">صفحة ${fmtNum(p + 1)}</span></button><button class="icon-btn sm" aria-label="أزل العلامة"><svg><use href="#i-close"/></svg></button>`;
      $('.lb', b).onclick = () => { goPage(p); closePanel(); };
      $('.icon-btn', b).onclick = () => { toggleBookmark(p); renderPanel(); };
      body.appendChild(b);
    });
  } else {
    const names = { hl: 'تظليل', ul: 'تسطير', st: 'شطب', ink: 'رسم', text: 'نص', note: 'ملاحظة', stamp: 'ختم', shape: 'شكل' };
    const rows = [];
    Object.keys(doc.annots).map(Number).sort((a, b) => a - b).forEach(i => doc.annots[i].forEach(a => rows.push([i, a])));
    if (!rows.length) { body.innerHTML = '<div class="empty"><p>لا تعليقات بعد. حدّد نصًا لتظليله، أو اختر أداة من الشريط السفلي.</p></div>'; return; }
    rows.forEach(([i, a], k) => {
      const b = document.createElement('button'); b.className = 'li'; b.style.animationDelay = Math.min(k, 12) * 35 + 'ms';
      const col = a.color || '#F2B632';
      const label = a.type === 'shape' ? SHAPE_NAME[a.kind] : a.type === 'ink' ? (a.tool === 'marker' ? 'تظليل حر' : 'رسم بالقلم') : names[a.type];
      const snip = a.text || a.label || '';
      b.innerHTML = `<i class="dot" style="background:${col}"></i><span class="lb"><span class="lt">${label} · صفحة ${fmtNum(i + 1)}</span>${snip ? `<span class="ls">${esc(snip)}</span>` : ''}</span>`;
      b.onclick = () => { goPage(i); closePanel(); };
      body.appendChild(b);
    });
  }
}

/* ───────── قائمة المزيد ───────── */
const menu = $('#menu');
function closeMenu() { menu.hidden = true; if ($('#panel').hidden) $('#scrim').hidden = true; }
function closeAllPop() { closeMenu(); closePanel(); hideSelPop(); }
$('#btnMore').onclick = () => {
  if (!menu.hidden) return closeMenu();
  Sound.pop(); updateBookmarkLabel(); updateModeLabel();
  menu.hidden = false; $('#scrim').hidden = false;
};
menu.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  closeMenu(); Sound.tap();
  const m = b.dataset.m;
  if (m === 'bookmark') { toggleBookmark(curPage); }
  else if (m === 'goto') gotoDialog();
  else if (m === 'fit') setScale(fitScale(S.cur));
  else if (m === 'mode') cycleMode();
  else if (m === 'save') exportPdf('save');
  else if (m === 'share') exportPdf('share');
  else if (m === 'img') exportImage();
  else if (m === 'props') showProps();
});
function toggleBookmark(p) {
  const d = S.cur, k = d.bookmarks.indexOf(p);
  if (k >= 0) { d.bookmarks.splice(k, 1); toast('أُزيلت العلامة من صفحة ' + fmtNum(p + 1)); }
  else { d.bookmarks.push(p); toast('وُضعت علامة على صفحة ' + fmtNum(p + 1), 'ok'); Sound.ok(); }
  saveMeta(d); updateBookmarkLabel();
}
function updateBookmarkLabel() { if (S.cur) $('#mBookmark').textContent = S.cur.bookmarks.includes(curPage) ? 'أزل علامة هذه الصفحة' : 'ضع علامة على هذه الصفحة'; }
const MODES = { normal: 'عادي', night: 'ليلي', paper: 'ورقي' };
function applyMode() { document.body.classList.remove('mode-night', 'mode-paper'); if (S.mode !== 'normal') document.body.classList.add('mode-' + S.mode); }
function updateModeLabel() { $('#mMode').textContent = 'الوضع: ' + MODES[S.mode] + ' (اضغط للتبديل)'; }
function cycleMode() {
  const k = Object.keys(MODES); S.mode = k[(k.indexOf(S.mode) + 1) % k.length];
  try { localStorage.setItem('sahl.mode', S.mode); } catch (e) {}
  applyMode(); toast('وضع القراءة: ' + MODES[S.mode]);
}

async function showProps() {
  const doc = S.cur; let info = {};
  try { info = (await doc.pdf.getMetadata()).info || {}; } catch (e) {}
  const d = s => { const m = /D:(\d{4})(\d{2})?(\d{2})?/.exec(s || ''); return m ? new Date(+m[1], (+m[2] || 1) - 1, +m[3] || 1).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'; };
  const n = Object.values(doc.annots).reduce((s, a) => s + a.length, 0);
  const s = doc.sizes[curPage];
  const rows = [
    ['الاسم', doc.name], ['العنوان', info.Title || '—'], ['المؤلف', info.Author || '—'], ['الموضوع', info.Subject || '—'],
    ['عدد الصفحات', fmtNum(doc.numPages)], ['الحجم', fmtSize(doc.size)],
    ['قياس الصفحة', `${fmtNum(Math.round(s.w / 72 * 25.4))} × ${fmtNum(Math.round(s.h / 72 * 25.4))} مم`],
    ['أنشأه', info.Creator || '—'], ['المنتِج', info.Producer || '—'], ['تاريخ الإنشاء', d(info.CreationDate)],
    ['إصدار PDF', info.PDFFormatVersion || '—'], ['تعليقاتك', fmtNum(n)],
  ];
  dialog({ title: 'خصائص الملف', body: `<dl class="props">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` });
}

/* ───────── الحفظ والتصدير ───────── */
// يرسم تعليقات صفحة على لوح بمقياس 1 = نقطة PDF
function paintAnnots(ctx, list, size) {
  for (const a of list) {
    ctx.save();
    if (a.type === 'ink') {
      ctx.globalAlpha = a.op ?? 1; if (a.op < 1) ctx.globalCompositeOperation = 'multiply';
      ctx.strokeStyle = a.color; ctx.lineWidth = a.w; ctx.lineCap = a.tool === 'marker' ? 'butt' : 'round'; ctx.lineJoin = 'round';
      ctx.stroke(new Path2D(pathD(a.pts)));
    } else if (a.type === 'shape') {
      ctx.strokeStyle = a.color; ctx.lineWidth = a.w; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      const x = Math.min(a.x1, a.x2), y = Math.min(a.y1, a.y2), w = Math.abs(a.x2 - a.x1), h = Math.abs(a.y2 - a.y1);
      ctx.beginPath();
      if (a.kind === 'rect') ctx.rect(x, y, w, h);
      else if (a.kind === 'ellipse') ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      else if (a.kind === 'tri') { ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath(); }
      else { ctx.moveTo(a.x1, a.y1); ctx.lineTo(a.x2, a.y2); }
      ctx.stroke();
      if (a.kind === 'arrow') ctx.stroke(new Path2D(arrowHead(a)));
    } else if (a.type === 'hl') {
      ctx.globalAlpha = .42; ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = a.color;
      a.rects.forEach(([x, y, w, h]) => ctx.fillRect(x, y, w, h));
    } else if (a.type === 'ul' || a.type === 'st') {
      ctx.strokeStyle = a.color;
      a.rects.forEach(([x, y, w, h]) => { const ly = a.type === 'ul' ? y + h - .6 : y + h * .55; ctx.lineWidth = Math.max(1, h * .08); ctx.beginPath(); ctx.moveTo(x, ly); ctx.lineTo(x + w, ly); ctx.stroke(); });
    } else if (a.type === 'text') {
      const rtl = isRTL(a.text); ctx.fillStyle = a.color; ctx.font = textFont(a.size); ctx.direction = rtl ? 'rtl' : 'ltr'; ctx.textAlign = rtl ? 'right' : 'left';
      a.text.split('\n').forEach((ln, k) => ctx.fillText(ln, a.x, a.y + a.size + k * a.size * 1.35));
    } else if (a.type === 'note') {
      const L = noteLayout(a, size);
      ctx.fillStyle = '#fff6cf'; ctx.strokeStyle = '#d9a52a'; ctx.lineWidth = .9; rr(ctx, L.cx, L.cy, L.w, L.h, 5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3a2a10'; ctx.font = textFont(NOTE_FS); ctx.direction = 'rtl'; ctx.textAlign = 'right';
      L.lines.forEach((l, k) => ctx.fillText(l, L.cx + L.w - 7, L.cy + 15 + k * NOTE_LH));
      ctx.translate(a.x - 11, a.y - 11);
      ctx.fillStyle = '#c8963e'; ctx.strokeStyle = '#8f6310'; ctx.lineWidth = 1; rr(ctx, 0, 0, 22, 22, 5); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.7; ctx.lineCap = 'round'; ctx.stroke(new Path2D('M5.5 7.5h11M5.5 11h11M5.5 14.5h6.5'));
    } else if (a.type === 'stamp') {
      const w = a.w || stampW(a), h = 46;
      ctx.translate(a.x, a.y); ctx.rotate(-8 * Math.PI / 180);
      ctx.strokeStyle = a.color; ctx.lineWidth = 2.6; rr(ctx, -w / 2, -h / 2, w, h, 7); ctx.stroke();
      ctx.lineWidth = 1; rr(ctx, -w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 5); ctx.stroke();
      ctx.fillStyle = a.color; ctx.textAlign = 'center'; ctx.direction = 'rtl';
      ctx.font = '700 20px Tajawal'; ctx.fillText(a.label, 0, -1);
      ctx.font = '400 10px Tajawal'; ctx.fillText(a.date, 0, 15);
    }
    ctx.restore();
  }
}
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function wrap(ctx, text, max) {
  const out = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const w of para.split(' ')) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > max && line) { out.push(line); line = w; } else line = t; }
    out.push(line);
  }
  return out;
}
const canvasBytes = (c, type = 'image/png', q) => new Promise(r => c.toBlob(b => b.arrayBuffer().then(x => r(new Uint8Array(x))), type, q));

async function exportPdf(mode) {
  const doc = S.cur; if (!doc) return;
  const pages = Object.keys(doc.annots).map(Number).filter(i => doc.annots[i]?.length);
  setLoading(true, 'تُجهَّز النسخة…');
  try {
    let out;
    if (!pages.length) out = doc.bytes;
    else {
      if (!window.PDFLib) throw new Error('pdf-lib');
      await document.fonts.ready;
      const { PDFDocument, degrees } = window.PDFLib;
      const pd = await PDFDocument.load(doc.bytes, { ignoreEncryption: true, updateMetadata: false });
      for (const i of pages) {
        const page = await doc.pdf.getPage(i + 1), vp = page.getViewport({ scale: 1 });
        const k = Math.min(3, 4096 / Math.max(vp.width, vp.height));
        const c = document.createElement('canvas'); c.width = Math.ceil(vp.width * k); c.height = Math.ceil(vp.height * k);
        const ctx = c.getContext('2d'); ctx.scale(k, k);
        paintAnnots(ctx, doc.annots[i], doc.sizes[i]);
        const img = await pd.embedPng(await canvasBytes(c));
        c.width = c.height = 0;
        const p0 = vp.convertToPdfPoint(0, vp.height), p1 = vp.convertToPdfPoint(1, vp.height);
        const ang = Math.round(Math.atan2(p1[1] - p0[1], p1[0] - p0[0]) * 180 / Math.PI);
        pd.getPage(i).drawImage(img, { x: p0[0], y: p0[1], width: vp.width, height: vp.height, rotate: degrees(ang) });
      }
      out = await pd.save();
    }
    setLoading(false);
    const name = doc.name.replace(/\.pdf$/i, '') + (pages.length ? ' - بتعليقاتي' : '') + '.pdf';
    await deliver(name, out, 'application/pdf', mode);
  } catch (e) {
    console.error(e); setLoading(false); Sound.err();
    dialog({ title: 'تعذّر الحفظ', body: '<p>لم تُجهَّز النسخة. قد يكون الملف محميًا من التعديل. جرّب «صدّر هذه الصفحة صورة» بدلًا منه.</p>' });
  }
}
async function exportImage() {
  const doc = S.cur; if (!doc) return;
  setLoading(true, 'تُجهَّز الصورة…');
  try {
    const page = await doc.pdf.getPage(curPage + 1), v1 = page.getViewport({ scale: 1 });
    const k = Math.min(3, 3000 / Math.max(v1.width, v1.height)), vp = page.getViewport({ scale: k });
    const c = document.createElement('canvas'); c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
    const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    ctx.save(); ctx.scale(k, k); paintAnnots(ctx, doc.annots[curPage] || [], doc.sizes[curPage]); ctx.restore();
    const bytes = await canvasBytes(c, 'image/jpeg', .92); c.width = c.height = 0;
    setLoading(false);
    await deliver(doc.name.replace(/\.pdf$/i, '') + ' - صفحة ' + (curPage + 1) + '.jpg', bytes, 'image/jpeg', 'share');
  } catch (e) { console.error(e); setLoading(false); toast('تعذّر تصدير الصورة', 'err'); }
}
function b64(u8) {
  let s = ''; const CH = 0x8000;
  for (let i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
  return btoa(s);
}
async function deliver(name, bytes, mime, mode) {
  if (Bridge) {
    if (mode === 'share') { if (!Bridge.shareFile(name, b64(bytes), mime)) toast('تعذّرت المشاركة', 'err'); return; }
    const r = Bridge.saveFile(name, b64(bytes), mime);
    if (r === 'saved') { toast('حُفظ في «التنزيلات ← السهل الممتنع»', 'ok'); Sound.ok(); flash(); }
    else if (!r) { toast('تعذّر الحفظ', 'err'); Sound.err(); }
    return;
  }
  const file = new File([bytes], name, { type: mime });
  if (mode === 'share' && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => a.remove(), 1000); setTimeout(() => URL.revokeObjectURL(a.href), 20000);
  toast('جُهّز الملف: ' + name, 'ok'); Sound.ok(); flash();
}

/* ───────── الأزرار العامة والرجوع ───────── */
$('#btnOpen').onclick = () => { Sound.tap(); vibrate(10); pickFile(); };
$('#btnAddTab').onclick = () => { Sound.tap(); pickFile(); };
$('#btnHome').onclick = () => { Sound.tap(); if (S.cur) { S.cur.scrollTop = viewer.scrollTop; S.cur.scrollLeft = viewer.scrollLeft; } showHome(); };
const sb = $('#btnSound');
const paintSound = () => { $('use', sb).setAttribute('href', Sound.on ? '#i-sound' : '#i-mute'); sb.setAttribute('aria-label', Sound.on ? 'إطفاء الصوت' : 'تشغيل الصوت'); };
sb.onclick = () => { Sound.toggle(); paintSound(); Sound.tap(); toast(Sound.on ? 'الصوت مفعَّل' : 'الصوت مطفأ'); };

// زر الرجوع في أندرويد ومفتاح Esc
window.sahlBack = () => {
  const d = $('#dlg'); if (d.open) { d.close('cancel'); return 1; }
  if (!menu.hidden) { closeMenu(); return 1; }
  if (!$('#panel').hidden) { closePanel(); return 1; }
  if (!selPop.hidden) { getSelection().removeAllRanges(); hideSelPop(); return 1; }
  if (!$('#searchbar').hidden) { $('#searchbar').hidden = true; clearSearch(); return 1; }
  if (!$('#reader').hidden) {
    if (S.tool !== 'hand') { setTool('hand'); return 1; }
    $('#btnHome').click(); return 1;
  }
  return 0;
};
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('#dlg').open) window.sahlBack();
  if ($('#reader').hidden || $('#dlg').open || /INPUT|TEXTAREA/.test(document.activeElement?.tagName)) return;
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); $('#btnSearch').click(); }
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
  if (e.key === 'PageDown') { e.preventDefault(); goPage(curPage + 1); }
  if (e.key === 'PageUp') { e.preventDefault(); goPage(curPage - 1); }
});
document.addEventListener('pointerup', () => $$('.textLayer.selecting').forEach(t => t.classList.remove('selecting')));
window.addEventListener('resize', () => { if (S.cur) updateCurPage(); });

// ملف وصل من «فتح بواسطة» في أندرويد
window.sahlIncoming = async () => {
  if (!Bridge?.takeIncoming) return;
  let info; try { info = JSON.parse(Bridge.takeIncoming() || 'null'); } catch (e) {}
  if (!info) return;
  try {
    setLoading(true, 'يُفتح الملف…'); showReader();
    const r = await fetch(info.url); const u8 = new Uint8Array(await r.arrayBuffer());
    await openBytes(u8, info.name);
  } catch (e) { setLoading(false); toast('تعذّر فتح الملف الوارد', 'err'); if (!S.docs.length) showHome(); }
};

// سحب ملف وإفلاته على الحاسوب
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', async e => {
  e.preventDefault();
  for (const f of e.dataTransfer.files) if (/pdf$/i.test(f.type) || /\.pdf$/i.test(f.name)) await openBytes(new Uint8Array(await f.arrayBuffer()), f.name);
});

/* ───────── البدء ───────── */
applyMode(); paintSound(); updateUndo();
renderRecent();
// فتح كتاب من رابطه مباشرة: index.html?file=books/كتاب.pdf&page=5&name=اسم الكتاب
// أو من الكود: window.sahlOpenUrl('books/كتاب.pdf', 'اسم الكتاب', 5)
window.sahlOpenUrl = async (url, name, page) => {
  try {
    showReader(); setLoading(true, 'يُفتح الكتاب…');
    const r = await fetch(url); if (!r.ok) throw new Error(r.status);
    const u8 = new Uint8Array(await r.arrayBuffer());
    name ||= decodeURIComponent(String(url).split('?')[0].split('/').pop() || 'كتاب.pdf');
    await openBytes(u8, name);
    if (page && S.cur) goPage(page - 1, false);
  } catch (e) {
    setLoading(false); Sound.err();
    dialog({ title: 'تعذّر فتح الكتاب', body: '<p>لم يُعثر على الملف في الرابط المحدد، أو أن الموقع الذي فيه الملف لا يسمح بفتحه من هنا.</p>' });
    if (!S.docs.length) showHome();
  }
};
const Q = new URLSearchParams(location.search);
const qFile = Q.get('file');
if (Q.has('embed')) document.body.classList.add('embed');
const hasIncoming = !!(Bridge?.hasIncoming && Bridge.hasIncoming()) || !!qFile;
setTimeout(() => $('#splash').classList.add('gone'), hasIncoming ? 200 : 1100);
setTimeout(() => $('#splash').remove(), hasIncoming ? 700 : 1700);
if (qFile) window.sahlOpenUrl(qFile, Q.get('name'), parseInt(Q.get('page'), 10) || 0);
else if (hasIncoming) window.sahlIncoming();
window.__sahl = { S, openBytes };
