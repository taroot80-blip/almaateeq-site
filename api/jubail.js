// مسابقة رحلة الجبيل: استقبال صور الهاتف وعرضها على التلفاز مباشرة (مخزن Vercel Blob خاص)
const { put, list, get } = require('@vercel/blob');

const SLOT = /^(staff-(hs|mm|am|md)|team[0-3]-(lead|group)|meta|lock)$/;

async function isLocked(prefix) {
  const { blobs } = await list({ prefix: `${prefix}lock__`, limit: 1000, ...TOKEN() });
  if (!blobs.length) return false;
  const last = blobs.map(b => ({ b, t: +((/lock__(\d+)/.exec(b.pathname) || [])[1] || 0) })).sort((x, y) => y.t - x.t)[0].b;
  const r = await get(last.pathname, { access: 'private', ...TOKEN() });
  if (!r || r.statusCode !== 200) return false;
  try { return !!JSON.parse((await readAll(r)).toString('utf8')).locked; } catch (e) { return false; }
}
const TOKEN = () => process.env.BLOB_READ_WRITE_TOKEN ? { token: process.env.BLOB_READ_WRITE_TOKEN } : {};
const readAll = async r => Buffer.from(await new Response(r.stream).arrayBuffer());

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const q = req.query || {};
  const room = String(q.room || '');
  if (!/^\d{4,8}$/.test(room)) return res.status(400).json({ ok: false, error: 'room' });
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) return res.status(503).json({ ok: false, error: 'storage-not-connected' });
  const prefix = `jubail/${room}/`;
  try {
    if (req.method === 'POST') {
      const slot = String(q.slot || '');
      if (!SLOT.test(slot)) return res.status(400).json({ ok: false, error: 'slot' });
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const stamp = Date.now();
      if (slot === 'lock') {
        await put(`${prefix}lock__${stamp}.json`, JSON.stringify({ locked: !!body.locked }), { ...TOKEN(), access: 'private', contentType: 'application/json', addRandomSuffix: true });
        return res.json({ ok: true, locked: !!body.locked });
      }
      if (slot.startsWith('staff-') && await isLocked(prefix)) return res.status(423).json({ ok: false, error: 'locked' });
      if (slot === 'meta') {
        const names = Array.isArray(body.meta && body.meta.names) ? body.meta.names.slice(0, 4).map(n => String(n).slice(0, 40)) : [];
        await put(`${prefix}meta__${stamp}.json`, JSON.stringify({ names }), { ...TOKEN(), access: 'private', contentType: 'application/json', addRandomSuffix: true });
        return res.json({ ok: true });
      }
      const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(body.img || ''));
      if (!m) return res.status(400).json({ ok: false, error: 'image' });
      const buf = Buffer.from(m[1], 'base64');
      if (buf.length > 3 * 1024 * 1024) return res.status(413).json({ ok: false, error: 'too-big' });
      await put(`${prefix}${slot}__${stamp}.jpg`, buf, { ...TOKEN(), access: 'private', contentType: 'image/jpeg', addRandomSuffix: true });
      return res.json({ ok: true, t: stamp });
    }
    if (req.method === 'GET') {
      // تمرير صورة خاصة إلى الصفحة
      if (q.file) {
        const file = String(q.file);
        if (!file.startsWith(prefix) || file.includes('..')) return res.status(400).json({ ok: false, error: 'file' });
        const r = await get(file, { access: 'private', ...TOKEN() });
        if (!r || r.statusCode !== 200) return res.status(404).json({ ok: false, error: 'not-found' });
        res.setHeader('Content-Type', r.blob.contentType || 'image/jpeg');
        return res.status(200).send(await readAll(r));
      }
      const { blobs } = await list({ prefix, limit: 1000, ...TOKEN() });
      const slots = {}; let meta = null, metaT = 0;
      for (const b of blobs) {
        const name = b.pathname.split('/').pop();
        const mm = /^(.+?)__(\d+)/.exec(name);
        if (!mm) continue;
        const slot = mm[1], t = +mm[2];
        if (slot === 'meta') { if (t > metaT) { metaT = t; meta = b.pathname; } continue; }
        if (slot === 'lock') continue;
        if (!slots[slot] || slots[slot].t < t) slots[slot] = { url: `/api/jubail?room=${room}&file=${encodeURIComponent(b.pathname)}`, t };
      }
      let metaObj = null;
      if (meta) { try { const r = await get(meta, { access: 'private', ...TOKEN() }); if (r && r.statusCode === 200) metaObj = JSON.parse((await readAll(r)).toString('utf8')); } catch (e) {} }
      let locked = false; try { locked = await isLocked(prefix); } catch (e) {}
      return res.json({ ok: true, slots, meta: metaObj, locked });
    }
    return res.status(405).json({ ok: false, error: 'method' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'server', detail: String(e && e.message || e).slice(0, 200) });
  }
};
