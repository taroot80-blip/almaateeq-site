/* app.js — واجهة «المسبار» */
(function () {
  'use strict';
  const F = self.Falak, DATA = self.FalakData;
  const $ = (s) => document.querySelector(s);
  const H = DATA.HMONTHS, G = DATA.GMONTHS, W = DATA.WEEKDAYS;
  const ORN = '<svg class="orn" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1l3 6 6-3-3 6 6 2-6 2 3 6-6-3-3 6-3-6-6 3 3-6-6-2 6-2-3-6 6 3z" fill="currentColor"/></svg>';

  // ------------------------------------------------------------ الإعدادات
  const store = {
    get(k, d) { try { const v = localStorage.getItem('misbar.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('misbar.' + k, JSON.stringify(v)); } catch (e) { /* تخزين غير متاح */ } },
  };
  const S = {
    place: store.get('place', 'qatif'),
    custom: store.get('custom', { lat: 26.5654, lon: 50.0089, tz: 3 }),
    digits: store.get('digits', 'arab'),
    fajr: store.get('fajr', -18),
  };
  function currentPlace() {
    if (S.place === 'custom') return { key: 'custom', name: 'موقع مخصّص', lat: +S.custom.lat, lon: +S.custom.lon, elev: 0, tz: +S.custom.tz };
    return F.place(S.place);
  }
  let PL = currentPlace();

  // ------------------------------------------------------------ التنسيق
  const AR = '٠١٢٣٤٥٦٧٨٩';
  const n = (x) => (S.digits === 'arab' ? String(x).replace(/[0-9]/g, (c) => AR[c]).replace(/\./g, '٫') : String(x));
  const fx = (x, k = 1) => (x == null || isNaN(x) ? '—' : n(x.toFixed(k)));
  const pad = (x) => String(x).padStart(2, '0');
  function tm(date, withSec) {
    if (!date) return '—';
    const t = F.toLocal(date, PL.tz); let h = t.getUTCHours(); const mi = t.getUTCMinutes();
    const suf = h < 12 ? 'ص' : 'م'; h = h % 12 || 12;
    return n(`${h}:${pad(mi)}${withSec ? ':' + pad(t.getUTCSeconds()) : ''}`) + ' ' + suf;
  }
  const gdate = (o, wd = true) => (wd ? W[F.weekday(o)] + ' ' : '') + n(o.d) + ' ' + G[o.m - 1] + ' ' + n(o.y);
  const gshort = (o) => n(o.d) + ' ' + G[o.m - 1];
  const dOf = (date) => F.ymd(date, PL.tz);
  const dtm = (date) => (date ? gshort(dOf(date)) + '، ' + tm(date) : '—');
  const hname = (h) => n(h.d) + ' ' + H[h.m - 1] + ' ' + n(h.y) + 'هـ';
  const tzLabel = (tz) => 'UTC' + (tz >= 0 ? '+' : '−') + n(Math.abs(tz).toString().replace('.5', ':30'));

  // ------------------------------------------------------------ الحالة المحسوبة
  let MONTHS = [], TODAY, TIMES, TIMES_Y, SKY;
  let ann = DATA.announcements;
  function compute() {
    PL = currentPlace();
    TODAY = dOf(new Date());
    MONTHS = F.buildMonths(PL, F.addDays(TODAY, -420), F.addDays(TODAY, 420), ann.overrides || {});
    TIMES = F.dayTimes(PL, TODAY.y, TODAY.m, TODAY.d, { fajr: S.fajr });
    const yst = F.addDays(TODAY, -1);
    TIMES_Y = F.dayTimes(PL, yst.y, yst.m, yst.d, { fajr: S.fajr });
    SKY = F.skyNow(new Date());
  }
  const hijriToday = () => {
    // اليوم الهجري يبدأ من الغروب: بعد المغرب نعرض تاريخ الليلة القادمة أيضاً
    return F.hijriOf(TODAY, MONTHS);
  };

  // ------------------------------------------------------------ الرسم: القمر
  function drawMoon(ctx, x, y, r, phase, opts = {}) {
    ctx.save();
    const dark = opts.dark || '#1f1710', lit = opts.lit || '#f5ead6';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = dark; ctx.fill();
    const waxing = phase <= 180, p = (waxing ? phase : 360 - phase) * Math.PI / 180;
    const s = waxing ? 1 : -1; // RTL للسماء: المضاء يمين الناظر في التزايد
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) { const t = -Math.PI / 2 + Math.PI * i / 60; const px = x + s * r * Math.cos(t), py = y + r * Math.sin(t); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    for (let i = 60; i >= 0; i--) { const t = -Math.PI / 2 + Math.PI * i / 60; ctx.lineTo(x + s * r * Math.cos(p) * Math.cos(t), y + r * Math.sin(t)); }
    ctx.closePath();
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, '#fff8e8'); g.addColorStop(1, lit);
    ctx.fillStyle = g; ctx.shadowColor = 'rgba(242,182,50,0.45)'; ctx.shadowBlur = r * 0.35; ctx.fill();
    ctx.shadowBlur = 0; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(201,162,90,0.5)'; ctx.lineWidth = Math.max(1, r * 0.03); ctx.stroke();
    ctx.restore();
  }

  // ------------------------------------------------------------ الرسم: قرص المنازل (الأسطرلاب)
  function drawAstro() {
    const cv = $('#astro'), ctx = cv.getContext('2d'), Z = cv.width, c = Z / 2;
    ctx.clearRect(0, 0, Z, Z);
    const R1 = Z * 0.485, R2 = Z * 0.33, R3 = Z * 0.265, R4 = Z * 0.215;
    // زاوية الطول: 0° الحمل في الأعلى، والتزايد عكس عقارب الساعة كما في السماء
    const ang = (lon) => -Math.PI / 2 - lon * Math.PI / 180;
    const P = (lon, r) => [c + r * Math.cos(ang(lon)), c + r * Math.sin(ang(lon))];
    const brass = '#c9a25a', gold = '#f2b632', ink = '#f5ead6', muted = '#b9a88c';
    // الحلقات
    ctx.lineWidth = 2; ctx.strokeStyle = brass;
    for (const r of [R1, R2, R3]) { ctx.beginPath(); ctx.arc(c, c, r, 0, Math.PI * 2); ctx.stroke(); }
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(201,162,90,0.35)'; ctx.beginPath(); ctx.arc(c, c, R4, 0, Math.PI * 2); ctx.stroke();
    // تدرّج الأطوال
    for (let d = 0; d < 360; d += 2) {
      const [a1, b1] = P(d, R1), [a2, b2] = P(d, R1 - (d % 10 === 0 ? 16 : 7));
      ctx.beginPath(); ctx.moveTo(a1, b1); ctx.lineTo(a2, b2); ctx.strokeStyle = 'rgba(201,162,90,0.55)'; ctx.stroke();
    }
    // المنازل الثماني والعشرون
    const cur = SKY.moonManzil.i;
    for (let i = 0; i < 28; i++) {
      const l0 = i * F.SPAN, lm = l0 + F.SPAN / 2;
      const [x0, y0] = P(l0, R1 - 16), [x1, y1] = P(l0, R2);
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.strokeStyle = brass; ctx.lineWidth = 1.2; ctx.stroke();
      if (i === cur) {
        ctx.beginPath(); ctx.arc(c, c, (R1 - 16 + R2) / 2, ang(l0), ang(l0 + F.SPAN), true);
        ctx.lineWidth = R1 - 16 - R2; ctx.strokeStyle = 'rgba(20,184,166,0.28)'; ctx.stroke(); ctx.lineWidth = 1;
      }
      const [tx, ty] = P(lm, (R1 - 16 + R2) / 2);
      ctx.save(); ctx.translate(tx, ty);
      let rot = ang(lm); if (Math.cos(ang(lm)) < 0) rot += Math.PI;
      ctx.rotate(rot);
      ctx.fillStyle = i === cur ? '#5eead4' : ink; ctx.font = `${i === cur ? 700 : 500} ${Z * 0.024}px Tajawal, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl';
      ctx.fillText(F.MANAZIL[i], 0, 0); ctx.restore();
    }
    // البروج
    for (let i = 0; i < 12; i++) {
      const [x0, y0] = P(i * 30, R2), [x1, y1] = P(i * 30, R3);
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.strokeStyle = 'rgba(201,162,90,0.6)'; ctx.stroke();
      const [tx, ty] = P(i * 30 + 15, (R2 + R3) / 2);
      ctx.save(); ctx.translate(tx, ty); let rot = ang(i * 30 + 15) + Math.PI / 2; if (Math.sin(ang(i * 30 + 15)) > 0) rot += Math.PI; ctx.rotate(rot);
      ctx.fillStyle = i === 7 ? '#fca5a5' : muted; ctx.font = `500 ${Z * 0.022}px "El Messiri", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(F.BUROOJ[i], 0, 0); ctx.restore();
    }
    // خطوط من المركز إلى الشمس والقمر
    const [sx, sy] = P(SKY.sunLon, R3 - Z * 0.03), [mx, my] = P(SKY.moonLon, R3 - Z * 0.03);
    ctx.setLineDash([4, 6]); ctx.strokeStyle = 'rgba(242,182,50,0.45)'; ctx.beginPath(); ctx.moveTo(c, c); ctx.lineTo(sx, sy); ctx.stroke();
    ctx.strokeStyle = 'rgba(94,234,212,0.5)'; ctx.beginPath(); ctx.moveTo(c, c); ctx.lineTo(mx, my); ctx.stroke(); ctx.setLineDash([]);
    // الشمس
    ctx.save(); ctx.shadowColor = gold; ctx.shadowBlur = 24; ctx.beginPath(); ctx.arc(sx, sy, Z * 0.028, 0, Math.PI * 2); ctx.fillStyle = gold; ctx.fill(); ctx.restore();
    for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; ctx.beginPath(); ctx.moveTo(sx + Math.cos(a) * Z * 0.036, sy + Math.sin(a) * Z * 0.036); ctx.lineTo(sx + Math.cos(a) * Z * 0.048, sy + Math.sin(a) * Z * 0.048); ctx.strokeStyle = gold; ctx.lineWidth = 2; ctx.stroke(); }
    ctx.lineWidth = 1;
    // القمر بطوره
    drawMoon(ctx, mx, my, Z * 0.032, SKY.phase);
    // المركز: الطور الكبير واسم المنزلة
    drawMoon(ctx, c, c - Z * 0.055, Z * 0.075, SKY.phase);
    ctx.fillStyle = '#5eead4'; ctx.font = `700 ${Z * 0.045}px "El Messiri", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl';
    ctx.fillText(SKY.moonManzil.name, c, c + Z * 0.065);
    ctx.fillStyle = muted; ctx.font = `500 ${Z * 0.022}px Tajawal, sans-serif`;
    ctx.fillText('الإضاءة ' + n(Math.round(SKY.illum)) + '٪', c, c + Z * 0.11);
  }

  // ------------------------------------------------------------ اليوم
  function timesList(t) {
    return [
      ['fajr', 'الفجر', t.fajr, 'زاوية ' + n(Math.abs(S.fajr)) + '°'],
      ['sunrise', 'الشروق', t.sunrise, 'نهاية وقت الصبح'],
      ['zawal', 'الزوال', t.zawal, 'أول وقت الظهرين'],
      ['mithl1', 'المثل', t.mithl1, 'منتهى فضيلة الظهر'],
      ['mithl2', 'المثلان', t.mithl2, 'منتهى فضيلة العصر'],
      ['sunset', 'الغروب', t.sunset, 'سقوط القرص'],
      ['maghrib', 'المغرب', t.maghrib, 'ذهاب الحمرة المشرقية'],
      ['shafaq', 'ذهاب الشفق', t.shafaq, 'فضيلة العشاء (تقريباً)'],
      ['midnight', 'منتصف الليل', t.midnight, 'الغروب ← الفجر'],
      ['thirdLast', 'الثلث الأخير', t.thirdLast, 'وقت صلاة الليل الأفضل'],
    ];
  }
  function renderToday() {
    const h = hijriToday();
    const now = new Date();
    const afterSunset = TIMES.sunset && now > TIMES.sunset;
    if (h) {
      const tonight = afterSunset ? ' · الليلة ليلة ' + n(h.d + 1 > (h.month.length || 30) ? 1 : h.d + 1) : '';
      const label = `${n(h.d)} ${H[h.m - 1]} ${n(h.y)}هـ`;
      $('#hijriBig').textContent = label;
      $('#hijriArc').textContent = label;
      $('#subArc').textContent = `${W[F.weekday(TODAY)]} · ${h.month.source === 'إعلان' ? 'ثابت بالإعلان' : 'متوقع بالرؤية في أفق ' + PL.name}${tonight}`;
    }
    const sh = F.solarHijri(TODAY);
    $('#dates3').innerHTML = `<div><span class="label">الميلادي</span><span>${gdate(TODAY, false)}</span></div>
      <div><span class="label">الهجري الشمسي</span><span>${n(sh.d)} ${DATA.SMONTHS[sh.m - 1]} ${n(sh.y)}</span></div>
      <div><span class="label">طول النهار</span><span>${fx(TIMES.dayLen, 2)} ساعة</span></div>`;
    $('#timesLede').textContent = `${PL.name} · ${gdate(TODAY)} · ${tzLabel(PL.tz)}`;
    const list = timesList(TIMES);
    const nxt = list.find((x) => x[2] && x[2] > now) || ['fajr', 'فجر الغد', TIMES.fajrNext];
    $('#timesToday').innerHTML = list.map((x) => `<div class="time ${x === nxt ? 'is-next' : ''} ${x[2] && x[2] < now ? 'is-past' : ''}"><span class="label">${x[1]}</span><b>${tm(x[2])}</b><span class="sub">${x[3]}</span></div>`).join('');
    NEXT = nxt;
    drawDayDial(list);
    tick();
    // القمر
    const mc = $('#moonSmall').getContext('2d'); mc.clearRect(0, 0, 172, 172); drawMoon(mc, 86, 86, 70, SKY.phase);
    const age = (now - F.nearestNewMoon(now)) / 86400000;
    $('#moonKv').innerHTML = `<dt>المنزلة</dt><dd><b>${SKY.moonManzil.name}</b></dd>
      <dt>البرج</dt><dd>${SKY.moonBurj.name} ${SKY.aqrab ? '<span class="pill no">القمر في العقرب</span>' : ''}</dd>
      <dt>الإضاءة</dt><dd>${n(Math.round(SKY.illum))}٪ · العمر ${age >= 0 ? fx(age, 1) + ' يوم' : 'قبل الاقتران'}</dd>
      <dt>منزلة الشمس</dt><dd>${SKY.sunManzil.name} · ${SKY.sunBurj.name}</dd>`;
    const dawn = TIMES.fajr && TIMES.sunrise && now > TIMES.fajr && now < TIMES.sunrise;
    const hk = SKY.illum > 80 ? 'fullmoon' : SKY.illum < 25 ? 'hilal' : 'phases';
    const hb = $('#heroImgBtn'); hb.dataset.img = hk; hb.lastChild.textContent = 'صورة ' + DATA.IMAGES[hk][0];
    drawAstro();
    renderHilalSummary(); renderEclipseSummary();
  }
  let NEXT = null;
  // ------------------------------------------------------------ ساعة الليل والنهار (الظهر في الأعلى)
  const hourOf = (d) => { const t = F.toLocal(d, PL.tz); return t.getUTCHours() + t.getUTCMinutes() / 60 + t.getUTCSeconds() / 3600; };
  const hourAngle = (d) => ((hourOf(d) - 12) / 24) * 360;
  function ringArc(a1, a2, r1, r2) {
    if (a2 < a1) a2 += 360;
    const P = (a, r) => [200 + r * Math.sin(a * Math.PI / 180), 200 - r * Math.cos(a * Math.PI / 180)];
    const big = a2 - a1 > 180 ? 1 : 0;
    const [x1, y1] = P(a1, r2), [x2, y2] = P(a2, r2), [x3, y3] = P(a2, r1), [x4, y4] = P(a1, r1);
    return `M${x1} ${y1} A${r2} ${r2} 0 ${big} 1 ${x2} ${y2} L${x3} ${y3} A${r1} ${r1} 0 ${big} 0 ${x4} ${y4}Z`;
  }
  function drawDayDial(list) {
    const t = TIMES, A = (d) => hourAngle(d), R1 = 112, R2 = 150;
    const seg = (d1, d2, fill, op = 1) => (d1 && d2 ? `<path d="${ringArc(A(d1), A(d2), R1, R2)}" fill="${fill}" fill-opacity="${op}"/>` : '');
    let g = `<defs><radialGradient id="dialBg"><stop offset="0" stop-color="#1b2552"/><stop offset="1" stop-color="#070b1f"/></radialGradient></defs>
      <circle cx="200" cy="200" r="196" fill="url(#dialBg)" stroke="#c9a25a" stroke-width="1.5"/>
      <circle cx="200" cy="200" r="${(R1 + R2) / 2}" fill="none" stroke="#141a3a" stroke-width="${R2 - R1}"/>`;
    g += seg(t.fajr, t.sunrise, '#4b4f86') + seg(t.sunrise, t.sunset, '#f2b632', 0.92) + seg(t.zawal, t.mithl1, '#ffd36b') +
      seg(t.sunset, t.maghrib, '#e0743a') + seg(t.maghrib, t.shafaq, '#7a3b5a');
    for (let h = 0; h < 24; h++) {
      const a = (h - 12) * 15 * Math.PI / 180, r0 = h % 6 ? 156 : 152, r1 = h % 6 ? 162 : 170;
      g += `<line x1="${200 + r0 * Math.sin(a)}" y1="${200 - r0 * Math.cos(a)}" x2="${200 + r1 * Math.sin(a)}" y2="${200 - r1 * Math.cos(a)}" stroke="#c9a25a" stroke-width="${h % 6 ? 1 : 2}"/>`;
      if (h % 6 === 0) g += `<text x="${200 + 182 * Math.sin(a)}" y="${200 - 182 * Math.cos(a) + 5}" fill="#b9a88c" font-size="13" text-anchor="middle">${n(h === 0 ? 12 : h > 12 ? h - 12 : h)}${h === 12 ? 'ظ' : h === 0 ? 'ل' : ''}</text>`;
    }
    const lbl = { fajr: 1, sunrise: 1, zawal: 1, sunset: 1, midnight: 1 };
    for (const [k, name, d] of list) {
      if (!d) continue;
      const a = A(d) * Math.PI / 180, isN = NEXT && NEXT[0] === k;
      g += `<circle cx="${200 + (R1 - 8) * Math.sin(a)}" cy="${200 - (R1 - 8) * Math.cos(a)}" r="${isN ? 5 : 3}" fill="${isN ? '#f2b632' : '#f5ead6'}"/>`;
      if (lbl[k]) g += `<text x="${200 + (R1 - 26) * Math.sin(a)}" y="${200 - (R1 - 26) * Math.cos(a) + 4}" fill="#e9dcc3" font-size="12" text-anchor="middle">${name}</text>`;
    }
    g += `<g id="dialNeedle" transform="rotate(${hourAngle(new Date())} 200 200)"><line x1="200" y1="200" x2="200" y2="${200 - R2 - 6}" stroke="#5eead4" stroke-width="2.5"/><circle cx="200" cy="${200 - R2 - 10}" r="6" fill="#5eead4"/></g>
      <circle cx="200" cy="200" r="58" fill="#070b1f" stroke="#c9a25a" stroke-opacity=".6"/>
      <text x="200" y="190" fill="#b9a88c" font-size="13" text-anchor="middle">${NEXT ? 'حتى ' + NEXT[1] : ''}</text>
      <text id="dialCd" x="200" y="218" fill="#f2b632" font-size="24" text-anchor="middle" font-family="El Messiri"></text>`;
    $('#dayDial').innerHTML = g;
  }
  function tick() {
    if (!NEXT || !NEXT[2]) { $('#nextBox').innerHTML = ''; return; }
    let s = Math.max(0, Math.round((NEXT[2] - new Date()) / 1000));
    if (s === 0) { compute(); renderToday(); return; }
    const hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
    const cd = n(pad(hh) + ':' + pad(mm) + ':' + pad(ss));
    $('#nextBox').innerHTML = `<span class="label">القادم: ${NEXT[1]} · ${tm(NEXT[2])}</span><span class="cd">${cd}</span>`;
    const dc = document.getElementById('dialCd'); if (dc) dc.textContent = cd;
    const nd = document.getElementById('dialNeedle'); if (nd) nd.setAttribute('transform', `rotate(${hourAngle(new Date())} 200 200)`);
  }

  function nextHilal() {
    // الشهر القادم: أول شهر بدايته بعد اليوم
    const idx = MONTHS.findIndex((m) => F.cmpDay(m.start, TODAY) > 0);
    return idx >= 0 ? MONTHS[idx] : null;
  }
  function renderHilalSummary() {
    const m = nextHilal(); if (!m) return;
    const ev = m.evenings.filter(Boolean)[0];
    $('#hilalSummary').innerHTML = `<h2 class="sec">${ORN}هلال ${H[m.hm - 1]} ${n(m.hy)}</h2>
      <dl class="kv"><dt>الاقتران</dt><dd>${gdate(dOf(m.newMoon))}، ${tm(m.newMoon)}</dd>
      <dt>أول الشهر المتوقع</dt><dd><b>${gdate(m.start)}</b> ${m.earlier ? `<span class="pill mid">أو ${gshort(m.earlier)} إن رُئي بالعين</span>` : ''}</dd>
      <dt>أم القرى</dt><dd>${gdate(F.ummAlQuraStart(m.newMoon))} <span class="label">(للمقارنة)</span></dd></dl>
      <p style="margin-top:12px"><button class="btn ghost" data-go="hilal" type="button">تفاصيل الرؤية</button></p>`;
  }
  let ECL = null;
  function getEclipses() { if (!ECL) ECL = F.eclipses(PL, new Date(Date.now() - 2 * 86400000), 10); return ECL; }
  function renderEclipseSummary() {
    const e = getEclipses().find((x) => x.ayatOn) || getEclipses()[0];
    if (!e) return;
    const what = e.type === 'solar' ? 'كسوف الشمس' : 'خسوف القمر';
    const t = e.type === 'solar' && e.local ? e.local.peak : e.peak;
    $('#eclipseSummary').innerHTML = `<h2 class="sec">${ORN}أقرب آية في ${PL.name}</h2>
      <p class="big">${what} ${kindAr(e)}</p>
      <dl class="kv"><dt>الذروة</dt><dd>${gdate(dOf(t))}، ${tm(t)}</dd>
      <dt>صلاة الآيات</dt><dd><span class="pill ${e.ayatOn ? 'ok' : 'dim'}">${e.ayat}</span></dd></dl>
      <p style="margin-top:12px"><button class="btn ghost" data-go="ayat" type="button">كل الكسوف والخسوف</button></p>`;
  }
  const KIND = { total: 'كلي', partial: 'جزئي', annular: 'حلقي', penumbral: 'شبه ظلي' };
  const kindAr = (e) => (e.type === 'solar' ? KIND[e.kind] + (e.local && e.local.kind !== e.kind ? ' (في بلدك ' + KIND[e.local.kind] + ')' : '') : KIND[e.kind]);

  // ------------------------------------------------------------ الهلال
  function horizonSvg(e) {
    // مخطط الأفق لحظة أفضل وقت: المحور الأفقي فرق السمت، والعمودي الارتفاع
    const Wd = 300, Hd = 150, base = 110, sc = 7; // 7 بكسل للدرجة
    const x0 = Wd / 2;
    const moonX = x0 + (e.mAz - e.sAz) * sc, moonY = base - e.malt * sc; // مواجهة الغرب: الجنوب يساراً والشمال يميناً
    const sunX = x0, sunY = base - e.salt * sc;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    return `<svg class="horizon" style="direction:ltr" viewBox="0 0 ${Wd} ${Hd}" role="img" aria-label="موضع الهلال فوق الأفق">
      <defs><linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1430"/><stop offset="1" stop-color="#7a3b1c"/></linearGradient></defs>
      <rect x="0" y="0" width="${Wd}" height="${base}" fill="url(#dusk)" rx="8"/>
      <rect x="0" y="${base}" width="${Wd}" height="${Hd - base}" fill="#0b0805"/>
      <line x1="0" x2="${Wd}" y1="${base}" y2="${base}" stroke="#c9a25a"/>
      ${[5, 10].map((a) => `<line x1="0" x2="${Wd}" y1="${base - a * sc}" y2="${base - a * sc}" stroke="#c9a25a" stroke-opacity=".25" stroke-dasharray="3 4"/><text x="6" y="${base - a * sc - 3}" fill="#b9a88c" font-size="10">${n(a)}°</text>`).join('')}
      <circle cx="${clamp(sunX, 8, Wd - 8)}" cy="${clamp(sunY, 0, Hd - 6)}" r="7" fill="#f2b632"/>
      ${e.malt > -3 ? (() => { const mx = clamp(moonX, 10, Wd - 10), my = clamp(moonY, 9, Hd - 9); return `<path d="M ${mx} ${my - 8} A 8 8 0 1 1 ${mx} ${my + 8} A 10 10 0 0 0 ${mx} ${my - 8} Z" fill="#f5ead6" transform="rotate(${Math.atan2(sunY - my, sunX - mx) * 180 / Math.PI} ${mx} ${my})"/><text x="${mx}" y="${my - 13}" fill="#f5ead6" font-size="10" text-anchor="middle">الهلال</text>`; })() : ''}
      <text x="${Wd - 8}" y="16" fill="#b9a88c" font-size="10" text-anchor="end">الأفق الغربي · الشمال يميناً</text>
    </svg>`;
  }
  function eveCard(e, label) {
    if (!e) return '';
    const cls = e.eye ? 'eye' : e.maybe ? 'maybe' : '';
    const pill = e.impossible ? '<span class="pill no">لا رؤية</span>' : e.eye ? '<span class="pill ok">يُرى بالعين</span>' : e.maybe ? '<span class="pill mid">قد يُرى بالعين</span>' : '<span class="pill no">لا يُرى بالعين</span>';
    return `<article class="eve ${cls}"><h3><span>${label}</span>${pill}</h3>
      ${e.impossible ? '' : horizonSvg(e)}
      <dl class="kv">
        <dt>الغروب / غروب القمر</dt><dd>${tm(e.sunset)} / ${tm(e.moonset)}</dd>
        <dt>المكث</dt><dd>${e.lag == null ? '—' : fx(e.lag, 0) + ' دقيقة'}</dd>
        <dt>عمر الهلال</dt><dd>${e.ageH < 0 ? 'قبل الاقتران' : fx(e.ageH, 1) + ' ساعة'}</dd>
        ${e.impossible ? '' : `<dt>الارتفاع / الاستطالة</dt><dd>${fx(e.malt, 1)}° / ${fx(e.arcl, 1)}°${e.danjon ? ' <span class="pill no">دون حد دانجون</span>' : ''}</dd>
        <dt>عرض الهلال</dt><dd>${fx(e.w, 2)}′ · الإضاءة ${fx(e.illum, 1)}٪</dd>
        <dt>عودة V</dt><dd>${fx(e.v, 2)} — <b>${e.odeh.code}</b> ${e.odeh.text}</dd>
        <dt>يالوب q</dt><dd>${fx(e.q, 3)} — <b>${e.yallop.code}</b> ${e.yallop.text}</dd>`}
      </dl></article>`;
  }
  function renderHilal() {
    const m = nextHilal(); if (!m) return;
    $('#hilalTitle').textContent = `هلال ${H[m.hm - 1]} ${n(m.hy)}هـ في أفق ${PL.name}`;
    $('#hilalLede').innerHTML = `الاقتران ${gdate(dOf(m.newMoon))} الساعة ${tm(m.newMoon)}. أول الشهر المتوقع <b>${gdate(m.start)}</b>${m.earlier ? `، أو ${gdate(m.earlier)} إن ثبتت الرؤية بالعين مساء ${gdate(F.addDays(m.earlier, -1), false)}` : ''}${m.completed30 ? ' (بإكمال الثلاثين)' : ''}.`;
    $('#evenings').innerHTML = m.evenings.filter(Boolean).map((e) => eveCard(e, 'مساء ' + W[F.weekday(e.date)] + ' ' + gshort(e.date))).join('');
    // مقارنة المدن مساء أول ليلة ممكنة
    const evDay = F.addDays(m.earlier || m.start, -1);
    const keys = ['qatif', 'kuwait', 'bahrain', 'najaf', 'qum', 'mashhad', 'mecca', 'beirut', 'cairo', 'rabat', 'london', 'newyork'];
    $('#cmpLede').textContent = `مساء ${gdate(evDay)} بالتوقيت المحلي لكل مدينة.`;
    $('#cmpTable').innerHTML = '<tr><th>المدينة</th><th>الغروب</th><th>المكث</th><th>الارتفاع</th><th>الاستطالة</th><th>عودة</th><th>يالوب</th><th>الحكم</th></tr>' +
      keys.map((k) => {
        const p = F.place(k), e = F.hilalEvening(p, evDay.y, evDay.m, evDay.d); if (!e) return '';
        const loc = (d) => { if (!d) return '—'; const t = F.toLocal(d, p.tz); let h = t.getUTCHours() % 12 || 12; return n(h + ':' + pad(t.getUTCMinutes())); };
        const v = e.impossible ? '<span class="pill no">مستحيل</span>' : e.eye ? '<span class="pill ok">بالعين</span>' : e.maybe ? '<span class="pill mid">ممكن</span>' : '<span class="pill no">لا</span>';
        return `<tr class="${k === PL.key ? 'today' : ''}"><td>${p.name}</td><td>${loc(e.sunset)}</td><td>${e.lag == null ? '—' : fx(e.lag, 0) + ' د'}</td><td>${e.impossible ? '—' : fx(e.malt, 1) + '°'}</td><td>${e.impossible ? '—' : fx(e.arcl, 1) + '°'}</td><td>${e.impossible ? '—' : fx(e.v, 2)}</td><td>${e.impossible ? '—' : fx(e.q, 3)}</td><td>${v}</td></tr>`;
      }).join('');
    // جدول الشهور
    const from = MONTHS.findIndex((x) => F.cmpDay(x.start, F.addDays(TODAY, -60)) >= 0);
    $('#monthsTable').innerHTML = '<tr><th>الشهر</th><th>الاقتران</th><th>أوله المتوقع</th><th>احتمال أسبق</th><th>أم القرى</th><th>عدد أيامه</th><th>المصدر</th></tr>' +
      MONTHS.slice(Math.max(0, from), from + 14).map((x) => {
        const uq = F.ummAlQuraStart(x.newMoon), imp = DATA.IMPORTANT.includes(x.hm);
        const cur = F.cmpDay(TODAY, x.start) >= 0 && (!x.length || F.dayDiff(x.start, TODAY) < x.length);
        return `<tr class="${cur ? 'today' : ''}"><td>${imp ? '<b>' : ''}${H[x.hm - 1]} ${n(x.hy)}${imp ? '</b>' : ''}</td><td>${gshort(dOf(x.newMoon))} ${tm(x.newMoon)}</td><td><b>${gdate(x.start)}</b></td><td>${x.earlier ? gshort(x.earlier) : '—'}</td><td>${gshort(uq)}${F.cmpDay(uq, x.start) < 0 ? ' <span class="label">يسبق</span>' : ''}</td><td>${x.length ? n(x.length) : '—'}</td><td><span class="pill ${x.source === 'إعلان' ? 'ok' : 'info'}">${x.source}</span></td></tr>`;
      }).join('');
    $('#annNote').textContent = `الإعلانات: ${ann.source} (آخر تحديث ${n(ann.updated)}).`;
  }

  // ------------------------------------------------------------ المواقيت الشهري
  function renderMawaqit() {
    const inp = $('#mMonth');
    if (!inp.value) inp.value = `${TODAY.y}-${pad(TODAY.m)}`;
    const [y, m] = inp.value.split('-').map(Number);
    const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
    let rows = '<tr><th>اليوم</th><th>الهجري</th><th>الفجر</th><th>الشروق</th><th>الزوال</th><th>المثل</th><th>المثلان</th><th>الغروب</th><th>المغرب</th><th>منتصف الليل</th><th>الثلث الأخير</th></tr>';
    for (let d = 1; d <= days; d++) {
      const t = F.dayTimes(PL, y, m, d, { fajr: S.fajr }), o = { y, m, d }, h = F.hijriOf(o, MONTHS);
      const isT = F.cmpDay(o, TODAY) === 0;
      rows += `<tr class="${isT ? 'today' : ''}"><td>${W[F.weekday(o)]} ${n(d)}</td><td>${h ? n(h.d) + ' ' + H[h.m - 1] : '—'}</td><td>${tm(t.fajr)}</td><td>${tm(t.sunrise)}</td><td>${tm(t.zawal)}</td><td>${tm(t.mithl1)}</td><td>${tm(t.mithl2)}</td><td>${tm(t.sunset)}</td><td>${tm(t.maghrib)}</td><td>${tm(t.midnight)}</td><td>${tm(t.thirdLast)}</td></tr>`;
    }
    $('#mTable').innerHTML = rows;
    syncSeg('#fajrSeg', 'a', S.fajr);
  }

  // ------------------------------------------------------------ الآيات
  function renderAyat() {
    $('#ayatLede').textContent = `الرؤية والأوقات من ${PL.name} بالتوقيت المحلي ${tzLabel(PL.tz)}.`;
    $('#ayatTable').innerHTML = '<tr><th>الآية</th><th>النوع</th><th>التاريخ</th><th>البداية</th><th>الذروة</th><th>النهاية</th><th>في بلدك</th><th>صلاة الآيات</th></tr>' +
      getEclipses().map((e) => {
        const h = F.hijriOf(dOf(e.peak), MONTHS), hs = h ? `<div class="label">${hname(h)}</div>` : '';
        if (e.type === 'lunar') {
          const b = e.begin || e.penBegin, en = e.end || e.penEnd;
          return `<tr><td>خسوف القمر</td><td>${KIND[e.kind]}</td><td>${gdate(dOf(e.peak))}${hs}</td><td>${tm(b)}</td><td>${tm(e.peak)}</td><td>${tm(en)}</td><td>${e.seen ? 'القمر فوق الأفق (ارتفاع الذروة ' + fx(e.altPeak, 0) + '°)' : 'تحت الأفق'}</td><td><span class="pill ${e.ayatOn ? 'ok' : 'dim'}">${e.ayat}</span></td></tr>`;
        }
        const L = e.local;
        return `<tr><td>كسوف الشمس</td><td>${kindAr(e)}</td><td>${gdate(dOf(e.peak))}${hs}</td><td>${L && e.seen ? tm(L.begin) : '—'}</td><td>${L && e.seen ? tm(L.peak) : tm(e.peak) + ' <span class="label">(عالمياً)</span>'}</td><td>${L && e.seen ? tm(L.end) : '—'}</td><td>${L && e.seen ? 'يُستر ' + n(Math.round(L.obscuration * 100)) + '٪ من القرص' : 'لا يُرى'}</td><td><span class="pill ${e.ayatOn ? 'ok' : 'dim'}">${e.ayat}</span></td></tr>`;
      }).join('');
  }

  // ------------------------------------------------------------ المنازل
  function renderManazil() {
    $('#manzilNow').innerHTML = `<h2 class="sec">${ORN}القمر الآن في ${SKY.moonManzil.name}</h2>
      <dl class="kv"><dt>طول القمر</dt><dd>${fx(SKY.moonLon, 2)}° · برج ${SKY.moonBurj.name}</dd>
      <dt>المنزلة التالية</dt><dd>${F.MANAZIL[(SKY.moonManzil.i + 1) % 28]}</dd>
      <dt>الشمس</dt><dd>في ${SKY.sunManzil.name} · برج ${SKY.sunBurj.name} (${fx(SKY.sunLon, 2)}°)</dd>
      <dt>الإضاءة</dt><dd>${n(Math.round(SKY.illum))}٪</dd></dl>`;
    const per = F.aqrabPeriods(new Date(), new Date(Date.now() + 75 * 86400000));
    $('#aqrabBox').innerHTML = `<h2 class="sec">${ORN}القمر في العقرب</h2>
      <p class="lede">يُكره عند الإمامية التزويج والقمر في العقرب، لقول الصادق (ع): «من تزوّج والقمر في العقرب لم يرَ الحُسنى». والحساب هنا بالبرج المداري 210°–240°، وهو المعتمد في أكثر التقاويم الجعفرية.</p>
      <div class="scroll"><table><tr><th>من</th><th>إلى</th></tr>${per.map((p) => `<tr><td>${dtm(p.from)}</td><td>${p.to ? dtm(p.to) : '…'}</td></tr>`).join('')}</table></div>`;
    let rows = '<tr><th>اليوم</th><th>الهجري</th><th>منزلة القمر</th><th>البرج</th><th>الإضاءة</th></tr>';
    for (let k = 0; k < 14; k++) {
      const o = F.addDays(TODAY, k), t = F.dayTimes(PL, o.y, o.m, o.d, { fajr: S.fajr }).sunset || F.localMidnight(o.y, o.m, o.d, PL.tz);
      const s = F.skyNow(t), h = F.hijriOf(o, MONTHS);
      rows += `<tr class="${k === 0 ? 'today' : ''}"><td>${W[F.weekday(o)]} ${gshort(o)}</td><td>${h ? n(h.d) + ' ' + H[h.m - 1] : ''}</td><td><b>${s.moonManzil.name}</b></td><td>${s.moonBurj.name}${s.aqrab ? ' <span class="pill no">العقرب</span>' : ''}</td><td>${n(Math.round(s.illum))}٪</td></tr>`;
    }
    $('#moonDays').innerHTML = rows;
    const sm = F.sunManazilYear(TODAY.y);
    $('#sunManazil').innerHTML = '<tr><th>المنزلة</th><th>دخول الشمس</th><th>المنزلة</th><th>دخول الشمس</th></tr>' +
      Array.from({ length: Math.ceil(sm.length / 2) }, (_, i) => {
        const a = sm[i * 2], b = sm[i * 2 + 1];
        const c = (x) => (x ? `<td>${x.name}</td><td>${gdate(dOf(x.date))}</td>` : '<td></td><td></td>');
        return `<tr>${c(a)}${c(b)}</tr>`;
      }).join('');
  }

  // ------------------------------------------------------------ القبلة
  function renderQibla() {
    const q = F.qibla(PL.lat, PL.lon);
    const a = q.az;
    const ticks = Array.from({ length: 72 }, (_, i) => { const r1 = 148, r2 = i % 18 === 0 ? 128 : i % 2 ? 140 : 134, t = (i * 5 - 90) * Math.PI / 180; return `<line x1="${160 + r1 * Math.cos(t)}" y1="${160 + r1 * Math.sin(t)}" x2="${160 + r2 * Math.cos(t)}" y2="${160 + r2 * Math.sin(t)}" stroke="#c9a25a" stroke-opacity="${i % 18 ? .5 : 1}"/>`; }).join('');
    const lbl = [['ش', 0], ['ق', 90], ['ج', 180], ['غ', 270]].map(([s, d]) => { const t = (d - 90) * Math.PI / 180; return `<text x="${160 + 112 * Math.cos(t)}" y="${160 + 112 * Math.sin(t) + 6}" fill="${d ? '#b9a88c' : '#f2b632'}" font-size="18" text-anchor="middle" font-family="El Messiri">${s}</text>`; }).join('');
    $('#compass').innerHTML = `<circle cx="160" cy="160" r="152" fill="#0e1533" stroke="#c9a25a" stroke-width="2"/>${ticks}${lbl}
      <g transform="rotate(${a} 160 160)"><line x1="160" y1="160" x2="160" y2="44" stroke="#f2b632" stroke-width="3"/><path d="M160 30 l12 22 h-24z" fill="#f2b632"/>
      <rect x="150" y="16" width="20" height="16" rx="2" fill="#0b0805" stroke="#f2b632" transform="rotate(${-a} 160 24)"/></g>
      <circle cx="160" cy="160" r="6" fill="#f2b632"/>
      <text x="160" y="205" fill="#f5ead6" font-size="30" text-anchor="middle" font-family="El Messiri">${fx(a, 1)}°</text>`;
    $('#qiblaInfo').innerHTML = `<h2 class="sec">${ORN}القبلة من ${PL.name}</h2>
      <dl class="kv"><dt>الاتجاه</dt><dd><b>${fx(a, 2)}°</b> من الشمال الجغرافي باتجاه عقارب الساعة</dd>
      <dt>المسافة إلى الكعبة</dt><dd>${n(Math.round(q.km).toLocaleString('en'))} كم</dd>
      <dt>الموقع</dt><dd>${fx(PL.lat, 4)}°، ${fx(PL.lon, 4)}°</dd></dl>
      <p class="note">البوصلة تشير إلى الشمال المغناطيسي، فأضف الانحراف المغناطيسي المحلي قبل الاستعمال، أو استعمل ظل الشمس يوم التعامد.</p>`;
    const k = F.kaabaDays(TODAY.y);
    const row = (x, what) => `<tr><td>${gdate(dOf(x.t))}</td><td>${tm(x.t)}</td><td>${what}</td><td>${fx(x.zd, 2)}°</td></tr>`;
    $('#kaabaTable').innerHTML = '<tr><th>اليوم</th><th>الوقت في ' + PL.name + '</th><th>دلالة الظل</th><th>البعد عن السمت</th></tr>' +
      k.onKaaba.map((x) => row(x, 'الظل يشير عكس القبلة')).join('') + k.antipode.map((x) => row(x, 'الظل يشير إلى القبلة (حيث الشمس فوق الأفق)')).join('');
  }

  // ------------------------------------------------------------ التقويم والمناسبات
  function renderCalendar() {
    const h = hijriToday(); if (!h) return;
    const yrs = [h.y, h.y + 1];
    $('#occTitle').textContent = `مناسبات ${n(h.y)} – ${n(h.y + 1)}هـ`;
    const rows = [];
    for (const y of yrs) for (const [m, d, name, kind] of DATA.OCCASIONS) {
      const mo = MONTHS.find((x) => x.hy === y && x.hm === m); if (!mo) continue;
      const g = F.addDays(mo.start, d - 1);
      if (F.dayDiff(TODAY, g) < -3) continue;
      rows.push({ g, y, m, d, name, kind, src: mo.source, alt: mo.earlier ? F.addDays(mo.earlier, d - 1) : null });
    }
    const pk = { f: 'ok', w: 'no', q: 'mid', m: 'info' }, pn = { f: 'فرح', w: 'حزن', q: 'إحياء', m: 'موسم' };
    $('#occTable').innerHTML = '<tr><th>المناسبة</th><th>الهجري</th><th>الميلادي</th><th>بعد</th><th></th></tr>' +
      rows.slice(0, 40).map((r) => {
        const dd = F.dayDiff(TODAY, r.g);
        return `<tr class="${dd === 0 ? 'today' : ''}"><td>${r.name}</td><td>${n(r.d)} ${H[r.m - 1]} ${n(r.y)}</td><td><b>${gdate(r.g)}</b>${r.alt ? `<div class="label">أو ${gshort(r.alt)} إن رُئي الهلال مبكراً</div>` : ''}</td><td>${dd === 0 ? 'اليوم' : dd > 0 ? n(dd) + ' يوم' : 'مضى'}</td><td><span class="pill ${pk[r.kind]}">${pn[r.kind]}</span></td></tr>`;
      }).join('');
    const ci = $('#convIn'); if (!ci.value) ci.value = F.dkey(TODAY);
    renderConv();
  }
  function renderConv() {
    const v = $('#convIn').value; if (!v) return;
    const o = F.parseKey(v);
    let h = F.hijriOf(o, MONTHS);
    const inRange = h && F.dayDiff(MONTHS[0].start, o) >= 0 && F.dayDiff(o, MONTHS[MONTHS.length - 1].start) >= 0;
    const tab = F.tabularOf(o), sh = F.solarHijri(o);
    $('#convOut').innerHTML = `<dl class="kv"><dt>اليوم</dt><dd>${gdate(o)}</dd>
      <dt>الهجري القمري</dt><dd><b>${inRange ? hname(h) : hname(tab)}</b> <span class="label">${inRange ? 'بالرؤية المتوقعة في أفق ' + PL.name : 'جدولي تقريبي ±١–٢ يوم'}</span></dd>
      <dt>الهجري الشمسي</dt><dd>${n(sh.d)} ${DATA.SMONTHS[sh.m - 1]} ${n(sh.y)}هـ.ش</dd></dl>`;
  }

  // ------------------------------------------------------------ التنقل
  const RENDER = { today: renderToday, hilal: renderHilal, mawaqit: renderMawaqit, ayat: renderAyat, manazil: renderManazil, qibla: renderQibla, calendar: renderCalendar };
  let view = 'today';
  function show(v) {
    if (!RENDER[v]) v = 'today';
    view = v;
    document.querySelectorAll('.tab').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.v === v)));
    document.querySelectorAll('section.view').forEach((el) => { const on = el.id === 'v-' + v; el.hidden = !on; if (on) { el.classList.remove('fadein'); void el.offsetWidth; el.classList.add('fadein'); } });
    document.dispatchEvent(new CustomEvent('misbar:view', { detail: v }));
    try { RENDER[v](); } catch (e) { console.error(e); }
    if (location.hash.slice(1) !== v) history.replaceState(null, '', '#' + v);
    window.scrollTo({ top: 0 });
  }
  document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => show(b.dataset.v)));
  document.addEventListener('click', (e) => {
    const g = e.target.closest('[data-go]'); if (g) show(g.dataset.go);
    const im = e.target.closest('[data-img]'); if (im) openImage(im.dataset.img);
  });
  function openImage(k) {
    const m = DATA.IMAGES[k]; if (!m) return;
    const img = $('#lbImg'), local = 'images/' + k + '.jpg', ph = (DATA.PHOTOS || {})[k];
    $('#lbTitle').textContent = m[0]; $('#lbText').textContent = m[1];
    img.alt = m[0]; img.onerror = null;
    if (ph && navigator.onLine !== false) {
      // الصورة الفوتوغرافية عند الاتصال، والرسم المحفوظ بديلاً
      $('#lbCredit').textContent = 'صورة فوتوغرافية: ' + ph[1] + ' (ويكيميديا كومنز)';
      img.onerror = () => { img.onerror = null; img.src = local; $('#lbCredit').textContent = DATA.IMAGE_CREDIT; };
      img.src = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + ph[0] + '?width=1600';
    } else { img.src = local; $('#lbCredit').textContent = DATA.IMAGE_CREDIT; }
    $('#lightbox').showModal();
  }
  $('#lightbox').addEventListener('click', (e) => { if (e.target.id === 'lightbox') $('#lightbox').close(); });
  window.addEventListener('hashchange', () => show(location.hash.slice(1)));

  // ------------------------------------------------------------ الإعدادات
  function syncSeg(sel, attr, val) { document.querySelectorAll(sel + ' button').forEach((b) => b.setAttribute('aria-pressed', String(String(b.dataset[attr]) === String(val)))); }
  function header() { $('#placeName').textContent = PL.name; $('#placeTz').textContent = tzLabel(PL.tz); }
  const sel = $('#selPlace');
  sel.innerHTML = Object.keys(F.PLACES).map((k) => `<option value="${k}">${F.PLACES[k][0]}</option>`).join('') + '<option value="custom">موقع مخصّص…</option>';
  let draft = {};
  $('#placeBtn').addEventListener('click', () => {
    draft = { place: S.place, digits: S.digits, fajr: S.fajr };
    sel.value = S.place; $('#cLat').value = S.custom.lat; $('#cLon').value = S.custom.lon; $('#cTz').value = S.custom.tz;
    $('#customBox').hidden = S.place !== 'custom';
    syncSeg('#digitSeg', 'd', draft.digits); syncSeg('#fajrSeg2', 'a', draft.fajr);
    $('#dlg').showModal();
  });
  sel.addEventListener('change', () => { $('#customBox').hidden = sel.value !== 'custom'; });
  $('#digitSeg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; draft.digits = b.dataset.d; syncSeg('#digitSeg', 'd', draft.digits); });
  $('#fajrSeg2').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; draft.fajr = +b.dataset.a; syncSeg('#fajrSeg2', 'a', draft.fajr); });
  $('#dlg').addEventListener('close', () => {
    if ($('#dlg').returnValue !== 'ok') return;
    S.place = sel.value; S.digits = draft.digits; S.fajr = draft.fajr;
    if (S.place === 'custom') {
      const lat = parseFloat($('#cLat').value), lon = parseFloat($('#cLon').value), tz = parseFloat($('#cTz').value);
      if (isFinite(lat) && isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) S.custom = { lat, lon, tz: isFinite(tz) ? tz : Math.round(lon / 15) };
    }
    Object.entries(S).forEach(([k, v]) => store.set(k, v));
    refresh();
  });
  $('#fajrSeg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; S.fajr = +b.dataset.a; store.set('fajr', S.fajr); refresh(); });
  $('#mMonth').addEventListener('change', renderMawaqit);
  $('#convIn').addEventListener('change', renderConv);

  function refresh() { ECL = null; compute(); header(); show(view); }

  // ------------------------------------------------------------ الإعلانات (الشبكة للإعلانات فقط)
  try { const c = store.get('ann', null); if (c && c.updated >= ann.updated) ann = c; } catch (e) { /* */ }
  function fetchAnn() {
    if (!self.fetch) return;
    fetch('data/announcements.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).then((j) => {
      if (j && j.updated && j.updated >= (ann.updated || '')) {
        const changed = JSON.stringify(j.overrides) !== JSON.stringify(ann.overrides);
        ann = j; store.set('ann', j); if (changed) refresh(); else if (view === 'hilal') renderHilal();
      }
    }).catch(() => {});
  }

  // ------------------------------------------------------------ البدء
  // واجهة مشتركة لملف الأبواب الإضافية (extras.js)
  self.Misbar = {
    RENDER, show, store, $, n, fx, tm, gdate, gshort, dOf, hname, tzLabel, drawMoon, pad,
    get PL() { return PL; }, get TIMES() { return TIMES; }, get MONTHS() { return MONTHS; }, get SKY() { return SKY; },
    get TODAY() { return TODAY; }, get NEXT() { return NEXT; }, get view() { return view; }, refresh: () => refresh(),
  };
  compute(); header();
  const boot = () => show(location.hash.slice(1) || 'today');
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else setTimeout(boot, 0);
  setInterval(() => { if (view === 'today') tick(); }, 1000);
  setInterval(() => { const d = dOf(new Date()); if (F.cmpDay(d, TODAY) !== 0) refresh(); else { SKY = F.skyNow(new Date()); if (view === 'today') drawAstro(); } }, 60000);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (view === 'today') drawAstro(); });
  fetchAnn();
  if ('serviceWorker' in navigator && location.protocol === 'https:') { try { navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) { /* غير متاح في المعاينة */ } }
})();
