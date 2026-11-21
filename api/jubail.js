// مسابقة رحلة الجبيل: استقبال صور الهاتف وعرضها على التلفاز (مخزن Vercel Blob خاص)
// مقتصد في العمليات: فهرس واحد index.json يُقرأ بعملية بسيطة، والقوائم (list) لا تُستعمل إلا مرة لبناء الفهرس.
const { put, list, get } = require('@vercel/blob');

const SLOT = /^(staff-(hs|mm|am|md)|team[0-3]-(lead|group)|meta|lock)$/;
const TOKEN = () => (process.env.BLOB_READ_WRITE_TOKEN ? { token: process.env.BLOB_READ_WRITE_TOKEN } : {});
const readAll = async r => Buffer.from(await new Response(r.stream).arrayBuffer());

async function readJson(pathname) {
  const r = await get(pathname, { access: 'private', useCache: false, ...TOKEN() });
  if (!r || r.statusCode !== 200) return null;
  try { return JSON.parse((await readAll(r)).toString('utf8')); } catch (e) { return null; }
}

async function readIndex(prefix) {
  const idx = await readJson(`${prefix}index.json`);
  if (idx) return idx;
  // أول مرة فقط: يُبنى الفهرس من الملفات الموجودة
  const built = { slots: {}, meta: null, locked: false };
  const { blobs } = await list({ prefix, limit: 1000, ...TOKEN() });
  let metaT = 0, lockT = 0, metaP = null, lockP = null;
  for (const b of blobs) {
    const name = b.pathname.split('/').pop();
    const mm = /^(.+?)__(\d+)/.exec(name);
    if (!mm) continue;
    const slot = mm[1], t = +mm[2];
    if (slot === 'meta') { if (t > metaT) { metaT = t; metaP = b.pathname; } continue; }
    if (slot === 'lock') { if (t > lockT) { lockT = t; lockP = b.pathname; } continue; }
    if (!built.slots[slot] || built.slots[slot].t < t) built.slots[slot] = { p: b.pathname, t };
  }
  if (metaP) built.meta = await readJson(metaP);
  if (lockP) { const l = await readJson(lockP); built.locked = !!(l && l.locked); }
  await writeIndex(prefix, built);
  return built;
}

const writeIndex = (prefix, idx) => put(`${prefix}index.json`, JSON.stringify(idx), {
  ...TOKEN(), access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60,
});

module.exports = async (req, res) => {
  const q = req.query || {};
  const room = String(q.room || '');
  res.setHeader('Cache-Control', 'no-store');
  if (!/^\d{4,8}$/.test(room)) return res.status(400).json({ ok: false, error: 'room' });
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) return res.status(503).json({ ok: false, error: 'storage-not-connected' });
  const prefix = `jubail/${room}/`;
  try {
    if (req.method === 'POST') {
      const slot = String(q.slot || '');
      if (!SLOT.test(slot)) return res.status(400).json({ ok: false, error: 'slot' });
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const stamp = Date.now();
      const idx = await readIndex(prefix);
      if (slot === 'lock') { idx.locked = !!body.locked; await writeIndex(prefix, idx); return res.json({ ok: true, locked: idx.locked }); }
      if (slot === 'meta') {
        idx.meta = { names: Array.isArray(body.meta && body.meta.names) ? body.meta.names.slice(0, 4).map(n => String(n).slice(0, 40)) : [] };
        await writeIndex(prefix, idx); return res.json({ ok: true });
      }
      if (slot.startsWith('staff-') && idx.locked) return res.status(423).json({ ok: false, error: 'locked' });
      const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(body.img || ''));
      if (!m) return res.status(400).json({ ok: false, error: 'image' });
      const buf = Buffer.from(m[1], 'base64');
      if (buf.length > 3 * 1024 * 1024) return res.status(413).json({ ok: false, error: 'too-big' });
      const b = await put(`${prefix}${slot}__${stamp}.jpg`, buf, { ...TOKEN(), access: 'private', contentType: 'image/jpeg', addRandomSuffix: true });
      idx.slots[slot] = { p: b.pathname, t: stamp };
      await writeIndex(prefix, idx);
      return res.json({ ok: true, t: stamp });
    }
    if (req.method === 'GET') {
      if (q.file) {
        const file = String(q.file);
        if (!file.startsWith(prefix) || file.includes('..')) return res.status(400).json({ ok: false, error: 'file' });
        const r = await get(file, { access: 'private', ...TOKEN() });
        if (!r || r.statusCode !== 200) return res.status(404).json({ ok: false, error: 'not-found' });
        res.setHeader('Content-Type', r.blob.contentType || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
        return res.status(200).send(await readAll(r));
      }
      const idx = await readIndex(prefix);
      const slots = {};
      for (const [k, v] of Object.entries(idx.slots || {})) slots[k] = { url: `/api/jubail?room=${room}&file=${encodeURIComponent(v.p)}`, t: v.t };
      res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120');
      return res.json({ ok: true, slots, meta: idx.meta || null, locked: !!idx.locked });
    }
    return res.status(405).json({ ok: false, error: 'method' });
  } catch (e) {
    const msg = String((e && e.message) || e);
    return res.status(/suspended/i.test(msg) ? 503 : 500).json({ ok: false, error: /suspended/i.test(msg) ? 'storage-suspended' : 'server', detail: msg.slice(0, 200) });
  }
};
