// مسابقة رحلة الجبيل: استقبال صور الهاتف وعرضها على التلفاز مباشرة (Vercel Blob)
const { put, list } = require('@vercel/blob');

const SLOT = /^(staff-(hs|mm|md)|team[0-3]-(lead|group)|meta)$/;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const room = String((req.query && req.query.room) || '');
  if (!/^\d{4,8}$/.test(room)) return res.status(400).json({ ok: false, error: 'room' });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({ ok: false, error: 'storage-not-connected' });
  try {
    if (req.method === 'POST') {
      const slot = String(req.query.slot || '');
      if (!SLOT.test(slot)) return res.status(400).json({ ok: false, error: 'slot' });
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const stamp = Date.now();
      if (slot === 'meta') {
        const names = Array.isArray(body.meta && body.meta.names) ? body.meta.names.slice(0, 4).map(n => String(n).slice(0, 40)) : [];
        await put(`jubail/${room}/meta__${stamp}.json`, JSON.stringify({ names }), { access: 'public', contentType: 'application/json', addRandomSuffix: true });
        return res.json({ ok: true });
      }
      const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(body.img || ''));
      if (!m) return res.status(400).json({ ok: false, error: 'image' });
      const buf = Buffer.from(m[1], 'base64');
      if (buf.length > 3 * 1024 * 1024) return res.status(413).json({ ok: false, error: 'too-big' });
      const b = await put(`jubail/${room}/${slot}__${stamp}.jpg`, buf, { access: 'public', contentType: 'image/jpeg', addRandomSuffix: true });
      return res.json({ ok: true, url: b.url, t: stamp });
    }
    if (req.method === 'GET') {
      const { blobs } = await list({ prefix: `jubail/${room}/`, limit: 1000 });
      const slots = {}; let meta = null, metaT = 0;
      for (const b of blobs) {
        const name = b.pathname.split('/').pop();
        const mm = /^(.+?)__(\d+)/.exec(name);
        if (!mm) continue;
        const slot = mm[1], t = +mm[2];
        if (slot === 'meta') { if (t > metaT) { metaT = t; meta = b.url; } continue; }
        if (!slots[slot] || slots[slot].t < t) slots[slot] = { url: b.url, t };
      }
      let metaObj = null;
      if (meta) { try { metaObj = await (await fetch(meta)).json(); } catch (e) {} }
      return res.json({ ok: true, slots, meta: metaObj });
    }
    return res.status(405).json({ ok: false, error: 'method' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'server' });
  }
};
