/* extras.js — الأصوات، أوضاع الليل والنهار، الأبواب، السماء، التكليف، البرج والطالع، حول */
(function () {
  'use strict';
  const M = self.Misbar, F = self.Falak, A = self.Astronomy, DATA = self.FalakData;
  const $ = (s) => document.querySelector(s), $$ = (s) => document.querySelectorAll(s);
  const { n, fx, tm, gdate, gshort, dOf, store } = M;
  const H = DATA.HMONTHS, W = DATA.WEEKDAYS;
  const ico = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const I = {
    vol: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 010 6"/><path d="M18.5 6.5a8 8 0 010 11"/>',
    mute: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9l5 6M21 9l-5 6"/>',
    wifi: '<path d="M2 8.5a15 15 0 0120 0"/><path d="M5 12a10 10 0 0114 0"/><path d="M8.5 15.5a5 5 0 017 0"/><circle cx="12" cy="19" r="1.2" fill="currentColor"/>',
    wifioff: '<path d="M2 8.5a15 15 0 0120 0"/><path d="M5 12a10 10 0 0114 0"/><path d="M8.5 15.5a5 5 0 017 0"/><path d="M3 3l18 18"/>',
    moon: '<path d="M16 3a9 9 0 1 0 5 15A7.5 7.5 0 1 1 16 3z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
    clock: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>',
    eclipse: '<circle cx="10" cy="12" r="7"/><circle cx="14" cy="12" r="7" fill="currentColor" fill-opacity=".25"/>',
    rings: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5" stroke-dasharray="2 2"/><circle cx="12" cy="3" r="1.6" fill="currentColor"/>',
    qibla: '<circle cx="12" cy="12" r="9"/><path d="M12 5l3 8h-6z" fill="currentColor"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    star: '<path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4z"/><circle cx="19" cy="18" r="1.3"/><circle cx="5" cy="17" r="1"/>',
    child: '<circle cx="12" cy="5" r="2.5"/><path d="M12 8v7M8 11h8M10 21l2-6 2 6"/>',
    zodiac: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/>',
    road: '<path d="M4 21L9 3M20 21L15 3M12 6v2M12 11v2M12 16v2"/>',
    kaaba: '<path d="M4 7l8-3 8 3v11l-8 3-8-3z"/><path d="M4 10l8 3 8-3"/>',
    ring: '<circle cx="9" cy="14" r="5"/><circle cx="15" cy="14" r="5"/><path d="M10 4l2 3 2-3"/>',
    heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z"/>',
    leaf: '<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15"/><path d="M5 19l8-8"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  };

  // ============================================================ الأصوات (محرّك «مرشد النسك»، مولَّدة دون ملفات)
  const SFX = (() => {
    let ctx = null;
    const on = () => store.get('sfx', true);
    const ac = () => { if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); } if (ctx.state === 'suspended') ctx.resume(); return ctx; };
    const tone = (f, t0, d, type = 'sine', g = 0.18, f2) => { const c = ac(); if (!c) return; const t = c.currentTime + t0, o = c.createOscillator(), v = c.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(g, t + 0.008); v.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(v).connect(c.destination); o.start(t); o.stop(t + d + 0.02); };
    const air = (t0, d, from, to, g = 0.1) => { const c = ac(); if (!c) return; const t = c.currentTime + t0, len = Math.floor(c.sampleRate * d), b = c.createBuffer(1, len, c.sampleRate), a = b.getChannelData(0);
      for (let i = 0; i < len; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / len); const s = c.createBufferSource(), f = c.createBiquadFilter(), v = c.createGain();
      s.buffer = b; f.type = 'bandpass'; f.Q.value = 1.4; f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + d);
      v.gain.setValueAtTime(g, t); v.gain.exponentialRampToValueAtTime(0.0001, t + d); s.connect(f).connect(v).connect(c.destination); s.start(t); };
    const P = {
      tap: () => tone(1400, 0, 0.045, 'triangle', 0.07),
      choice: () => { tone(660, 0, 0.07, 'triangle', 0.14); tone(990, 0.055, 0.09, 'triangle', 0.12); },
      open: () => { air(0, 0.16, 500, 2600, 0.09); tone(520, 0, 0.12, 'sine', 0.07, 880); },
      close: () => { air(0, 0.14, 2400, 450, 0.08); tone(820, 0, 0.1, 'sine', 0.06, 480); },
      shutter: () => { air(0, 0.035, 3000, 6000, 0.22); tone(2200, 0, 0.03, 'square', 0.05); air(0.06, 0.09, 4500, 1500, 0.16); tone(900, 0.06, 0.05, 'triangle', 0.06); },
      bell: () => { [[880, 0], [1318.5, 0.16]].forEach(([f, t]) => { tone(f, t, 1.3, 'sine', 0.16); tone(f * 2.76, t, 0.6, 'sine', 0.05); tone(f * 5.4, t, 0.25, 'sine', 0.025); }); },
      save: () => { tone(523, 0, 0.1, 'triangle', 0.13); tone(659, 0.08, 0.1, 'triangle', 0.13); tone(784, 0.16, 0.18, 'triangle', 0.14); },
      // أصوات المسبار الخاصة
      pop: () => { tone(420, 0, 0.09, 'sine', 0.14, 760); tone(1180, 0.05, 0.12, 'triangle', 0.06); },
      laser: () => { tone(1700, 0, 0.22, 'sawtooth', 0.025, 320); air(0, 0.2, 4200, 900, 0.05); },
      gold: () => { [1046.5, 1568].forEach((f, i) => tone(f, i * 0.07, 0.42, 'sine', 0.08)); },
      night: () => { [[392, 0], [523.3, 0.18], [659.3, 0.36], [784, 0.54]].forEach(([f, t]) => { tone(f, t, 1.6, 'sine', 0.09); tone(f * 2, t, 0.5, 'sine', 0.02); }); air(0.4, 1.4, 7000, 9000, 0.012); },
      day: () => { [[523.3, 0], [659.3, 0.1], [784, 0.2], [1046.5, 0.3]].forEach(([f, t]) => tone(f, t, 0.5, 'triangle', 0.1)); },
      star: () => { [1760, 2349, 2637, 3136].forEach((f, i) => tone(f, i * 0.06, 0.6 - i * 0.08, 'sine', 0.05)); },
      orb: () => { [[659.3, 0], [987.8, 0.11], [1318.5, 0.22]].forEach(([f, t], i) => { tone(f, t, 0.9 - i * 0.15, 'sine', 0.15); tone(f * 3.01, t, 0.35, 'triangle', 0.035); }); tone(1975.5, 0.34, 1.1, 'sine', 0.06); },
    };
    return { play(k) { if (!on()) return; try { P[k] && P[k](); } catch (e) { /* */ } }, on, toggle() { store.set('sfx', !on()); if (on()) P.choice(); return on(); } };
  })();
  self.SFX = SFX;

  let toastT;
  function toast(msg) {
    let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2200);
  }
  function decorate() {
    const ok = navigator.onLine !== false, ns = $('#netState');
    ns.className = 'netstate ' + (ok ? 'ok' : 'off'); ns.innerHTML = ico(ok ? I.wifi : I.wifioff);
    ns.title = ok ? 'متصل: تُحدَّث إعلانات الهلال والصور الفوتوغرافية' : 'دون اتصال: كل الحسابات تعمل';
    $('#sndBtn').innerHTML = ico(SFX.on() ? I.vol : I.mute);
  }
  $('#sndBtn').addEventListener('click', () => { const v = SFX.toggle(); toast(v ? 'الأصوات مفعّلة' : 'الأصوات مكتومة'); decorate(); });
  addEventListener('online', () => { decorate(); toast('عاد الاتصال'); });
  addEventListener('offline', () => { decorate(); toast('دون اتصال: الحسابات تعمل كما هي'); });

  // ربط الأصوات بالواجهة
  document.addEventListener('click', (e) => {
    const el = e.target.closest('button,a,summary,.tile'); if (!el || el.id === 'sndBtn') return;
    if (el.matches('.tile')) { SFX.play('laser'); return SFX.play('open'); }
    if (el.matches('.btn:not(.ghost)')) SFX.play('gold');
    if (el.matches('[data-img]')) return SFX.play('shutter');
    if (el.matches('.dock .tab')) return SFX.play('choice');
    if (el.matches('summary')) return SFX.play(el.parentElement.open ? 'close' : 'open');
    if (el.matches('#placeBtn')) return SFX.play('open');
    if (el.matches('.x')) return SFX.play('close');
    if (el.matches('#saveBtn,#copyMail')) return SFX.play('save');
    if (el.matches('.seg button,.btn,.imgbtn')) return SFX.play('tap');
  }, true);
  document.addEventListener('change', (e) => { if (e.target.matches('select,input')) SFX.play('tap'); }, true);

  // ============================================================ أوضاع الوقت: نهار، شفق، ليل، سَحَر
  let MODE = null, lastNext = null;
  function modeNow() {
    const t = M.TIMES, now = new Date();
    if (!t.sunset) return 'day';
    const tY = F.dayTimes(M.PL, ...Object.values(F.addDays(M.TODAY, -1)), { fajr: store.get('fajr', -18) });
    if (t.fajr && now < t.fajr) return tY.thirdLast && now >= tY.thirdLast ? 'sahar' : 'night';
    if (t.sunrise && now < t.sunrise) return 'dusk';
    if (now < new Date(t.sunset.getTime() - 20 * 60000)) return 'day';
    if (t.shafaq && now < t.shafaq) return 'dusk';
    if (t.thirdLast && now >= t.thirdLast) return 'sahar';
    return 'night';
  }
  const GREET = {
    day: [I.sun, 'النهار', () => `الزوال ${tm(M.TIMES.zawal)}، والغروب ${tm(M.TIMES.sunset)}. طول النهار ${fx(M.TIMES.dayLen, 1)} ساعة.`],
    dusk: [I.sun, () => (new Date() < M.TIMES.zawal ? 'الفجر' : 'الشفق'), () => (new Date() < M.TIMES.zawal ? `بين الفجر والشروق: وقت صلاة الصبح حتى ${tm(M.TIMES.sunrise)}.` : `الغروب ${tm(M.TIMES.sunset)}، والمغرب بذهاب الحمرة ${tm(M.TIMES.maghrib)}. وقت تحرّي الهلال في أول الشهر.`)],
    night: [I.moon, 'الليل', () => `منتصف الليل ${tm(M.TIMES.midnight)}، والثلث الأخير يبدأ ${tm(M.TIMES.thirdLast)}. القمر في ${M.SKY.moonManzil.name}.`],
    sahar: [I.star, 'السَّحَر', () => `الثلث الأخير من الليل: وقت صلاة الليل والاستغفار حتى الفجر.`],
  };
  function setMode(force) {
    const m = modeNow();
    if (m !== MODE || force) {
      const changed = MODE && m !== MODE; MODE = m;
      document.body.classList.remove('t-day', 't-dusk', 't-night', 't-sahar'); document.body.classList.add('t-' + m);
      if (changed) SFX.play(m === 'day' ? 'day' : m === 'night' || m === 'sahar' ? 'night' : 'star');
    }
    const g = GREET[MODE], h = F.hijriOf(M.TODAY, M.MONTHS), wd = F.weekday(M.TODAY);
    const eve = MODE === 'night' || MODE === 'sahar' || (MODE === 'dusk' && new Date() > M.TIMES.zawal);
    const nightName = eve && wd === 4 ? ' · ليلة الجمعة' : '';
    $('#greet').innerHTML = `${ico(g[0])}<div><b>${typeof g[1] === "function" ? g[1]() : g[1]}${nightName}</b> <span>${g[2]()}</span></div>`;
    const N = M.NEXT; if (N && lastNext && N[0] !== lastNext) { SFX.play('bell'); toast('حان ' + lastNextName); }
    if (N) { lastNext = N[0]; lastNextName = N[1]; }
  }
  let lastNextName = '';

  // نجوم الخلفية: تتلألأ ليلاً وسَحَراً، وتخفت نهاراً
  const cv = $('#skyfx'), cx = cv.getContext('2d'); let STARS = [], shoot = null;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function sizeSky() { const r = devicePixelRatio || 1; cv.width = innerWidth * r; cv.height = innerHeight * r; cx.setTransform(r, 0, 0, r, 0, 0);
    STARS = Array.from({ length: Math.round(innerWidth * innerHeight / 5200) }, () => ({ x: Math.random() * innerWidth, y: Math.random() * innerHeight * 0.85, r: Math.random() ** 3 * 1.6 + 0.3, p: Math.random() * 6.28, s: 0.5 + Math.random() * 1.5 })); }
  function frame(t) {
    const vis = MODE === 'night' || MODE === 'sahar' ? 1 : MODE === 'dusk' ? 0.45 : 0.12;
    cx.clearRect(0, 0, innerWidth, innerHeight);
    for (const s of STARS) {
      const a = vis * (0.55 + 0.45 * Math.sin(t / 1000 * s.s + s.p));
      cx.globalAlpha = a; cx.fillStyle = s.r > 1.3 ? '#ffe9b0' : '#dfe6ff'; cx.beginPath(); cx.arc(s.x, s.y, s.r, 0, 6.283); cx.fill();
    }
    if (vis > 0.5 && !shoot && Math.random() < 0.002) shoot = { x: Math.random() * innerWidth, y: Math.random() * innerHeight * 0.4, l: 0 };
    if (shoot) { shoot.l += 14; cx.globalAlpha = Math.max(0, 1 - shoot.l / 420); cx.strokeStyle = '#fff6d8'; cx.lineWidth = 1.5; cx.beginPath();
      cx.moveTo(shoot.x - shoot.l, shoot.y + shoot.l * 0.45); cx.lineTo(shoot.x - shoot.l + 60, shoot.y + shoot.l * 0.45 - 27); cx.stroke(); if (shoot.l > 420) shoot = null; }
    cx.globalAlpha = 1;
    if (!reduce) requestAnimationFrame(frame);
  }
  sizeSky(); addEventListener('resize', sizeSky);

  // ============================================================ الأبواب
  const TILES = [
    ['hilal', I.moon, 'الهلال', 'Crescent', 'إمكان الرؤية وبدايات الشهور'],
    ['rihla', '<path d="M5 21V5a2 2 0 012-2h0"/><circle cx="7" cy="6" r="2"/><circle cx="7" cy="13" r="2"/><circle cx="7" cy="20" r="1.5"/><path d="M11 6h8M11 13h8M11 20h5"/>', 'رحلة اليوم', 'Day journey', 'لكل ساعة شأنها الشرعي والسنني والحسابي'],
    ['mawaqit', I.clock, 'المواقيت والفضيلة', 'Prayer times', 'الفجر والزوال والمغرب ومنتصف الليل'],
    ['ayat', I.eclipse, 'الكسوف والخسوف', 'Eclipses', 'صلاة الآيات في بلدك'],
    ['manazil', I.rings, 'منازل القمر', 'Lunar mansions', 'المنزلة والقمر في العقرب'],
    ['sky', I.star, 'السهر والنجوم', 'Tonight’s sky', 'الكواكب والنجوم فوق أفقك الآن'],
    ['qibla', I.qibla, 'القبلة', 'Qibla', 'الاتجاه وتعامد الشمس على الكعبة'],
    ['calendar', I.cal, 'التقويم والمناسبات', 'Calendar', 'المناسبات وتحويل التاريخ'],
    ['safar', I.road, 'مسافة السفر', 'Travel distance', 'المسافة الشرعية للقصر والإفطار'],
    ['hajj', I.kaaba, 'أعمال الحج', 'Hajj timeline', 'أزمان المناسك بساعة مكة'],
    ['aqd', I.ring, 'أوقات العقد', 'Marriage timing', 'المستحب والمكروه للعقد والزفاف'],
    ['muqaraba', I.heart, 'أوقات المقاربة', 'Marital etiquette', 'فحص ليلة بعينها'],
    ['taklif', I.child, 'التمييز والتكليف', 'Age of duty', 'متى يبلغ الولد والبنت'],
    ['burj', I.zodiac, 'برج المولود والطالع', 'Birth sign', 'تراث فلكي للفضول العلمي'],
    ['adab', I.leaf, 'الآداب والسنن', 'Etiquette', 'آداب الأيام والأوقات'],
    ['about', I.info, 'حول المسبار', 'About', 'المصمم والإشراف والمراجع'],
  ];
  function liveBadge(k) {
    const S = M.SKY;
    if (k === 'manazil') return S.moonManzil.name;
    if (k === 'mawaqit' && M.NEXT) return M.NEXT[1] + ' ' + tm(M.NEXT[2]);
    if (k === 'sky') return MODE === 'day' ? 'نهاراً' : 'الليلة';
    if (k === 'hilal') { const m = M.MONTHS.find((x) => F.cmpDay(x.start, M.TODAY) > 0); return m ? H[m.hm - 1] + ' ' + gshort(m.start) : ''; }
    return '';
  }
  function renderHub(el) {
    el.innerHTML = TILES.map(([k, ic, t, en, d]) => { const b = liveBadge(k); return `<a class="tile" href="#${k}" data-go="${k}">${b ? `<i class="live">${b}</i>` : ''}<span class="ic">${ico(ic)}</span><b>${t}</b><em>${en}</em><span>${d}</span></a>`; }).join('');
  }
  document.addEventListener('click', (e) => { const a = e.target.closest('a.tile'); if (a) e.preventDefault(); }, true);

  // ============================================================ السهر والنجوم
  const PLANETS = [['Mercury', 'عطارد'], ['Venus', 'الزهرة'], ['Mars', 'المريخ'], ['Jupiter', 'المشتري'], ['Saturn', 'زحل']];
  const BRIGHT = [ // [الاسم، المطلع بالساعات، الميل بالدرجات، القدر]
    ['الشِّعرى اليمانية', 6.7525, -16.716, -1.46], ['سُهيل', 6.3992, -52.696, -0.74], ['السِّماك الرامح', 14.261, 19.182, -0.05],
    ['النَّسر الواقع', 18.6156, 38.784, 0.03], ['العَيّوق', 5.2782, 45.998, 0.08], ['رِجل الجبّار', 5.2423, -8.202, 0.13],
    ['الشِّعرى الشامية', 7.655, 5.225, 0.34], ['منكب الجوزاء', 5.9195, 7.407, 0.5], ['النَّسر الطائر', 19.8464, 8.868, 0.76],
    ['الدَّبَران', 4.5987, 16.509, 0.86], ['السِّماك الأعزل', 13.4199, -11.161, 0.97], ['قلب العقرب', 16.4901, -26.432, 1.0],
    ['فم الحوت', 22.9608, -29.622, 1.16], ['قلب الأسد', 10.1395, 11.967, 1.35], ['الثُّريّا', 3.7914, 24.105, 1.6], ['الجدي (نجم القطب)', 2.5303, 89.264, 1.98],
  ];
  const dirAr = (az) => ['الشمال', 'الشمال الشرقي', 'الشرق', 'الجنوب الشرقي', 'الجنوب', 'الجنوب الغربي', 'الغرب', 'الشمال الغربي'][Math.round(az / 45) % 8];
  function skyObjects(t) {
    const pl = M.PL, obs = new A.Observer(pl.lat, pl.lon, pl.elev || 0), out = [];
    const hz = (ra, dec) => A.Horizon(t, obs, ra, dec, 'normal');
    for (const [b, ar] of PLANETS) {
      const e = A.Equator(A.Body[b], t, obs, true, true), h = hz(e.ra, e.dec), mag = A.Illumination(A.Body[b], t).mag;
      const rise = A.SearchRiseSet(A.Body[b], obs, +1, t, 1), set = A.SearchRiseSet(A.Body[b], obs, -1, t, 1);
      out.push({ kind: 'planet', name: ar, alt: h.altitude, az: h.azimuth, mag, rise: rise && rise.date, set: set && set.date });
    }
    const em = A.Equator(A.Body.Moon, t, obs, true, true), hm = hz(em.ra, em.dec);
    out.push({ kind: 'moon', name: 'القمر', alt: hm.altitude, az: hm.azimuth, mag: -10, rise: (A.SearchRiseSet(A.Body.Moon, obs, +1, t, 1) || {}).date, set: (A.SearchRiseSet(A.Body.Moon, obs, -1, t, 1) || {}).date });
    for (const [ar, ra, dec, mag] of BRIGHT) { const h = hz(ra, dec); out.push({ kind: 'star', name: ar, alt: h.altitude, az: h.azimuth, mag }); }
    return out;
  }
  let skyT = null;
  function renderSky() {
    const t = skyT || (MODE === 'day' && M.TIMES.shafaq ? M.TIMES.shafaq : new Date());
    const objs = skyObjects(t), up = objs.filter((o) => o.alt > 0).sort((a, b) => a.mag - b.mag);
    const R = 230, C = 260, P = (o) => { const r = R * (90 - o.alt) / 90, a = (o.az) * Math.PI / 180; return [C - r * Math.sin(a), C - r * Math.cos(a)]; }; // الشرق يساراً كما ننظر إلى السماء مستلقين ورأسنا للشمال
    let g = `<defs><radialGradient id="skyg"><stop offset="0" stop-color="#1b2552"/><stop offset="1" stop-color="#070b1f"/></radialGradient></defs>
      <circle cx="${C}" cy="${C}" r="${R}" fill="url(#skyg)" stroke="#d6b266" stroke-width="2"/>
      ${[30, 60].map((a) => `<circle cx="${C}" cy="${C}" r="${R * (90 - a) / 90}" fill="none" stroke="#d6b266" stroke-opacity=".25" stroke-dasharray="3 5"/>`).join('')}
      ${[['ش', 0], ['ق', 90], ['ج', 180], ['غ', 270]].map(([s, az]) => { const a = az * Math.PI / 180; return `<text x="${C - (R + 18) * Math.sin(a)}" y="${C - (R + 18) * Math.cos(a) + 6}" fill="#ffd98a" font-size="18" text-anchor="middle" font-family="El Messiri">${s}</text>`; }).join('')}`;
    // دائرة البروج تقريباً: نقاط الطول من الشمس
    for (const o of up) {
      const [x, y] = P(o);
      if (o.kind === 'moon') g += `<circle cx="${x}" cy="${y}" r="11" fill="#f4f1e6"/><text x="${x}" y="${y - 16}" fill="#eef1ff" font-size="13" text-anchor="middle">القمر</text>`;
      else { const r = Math.max(1.6, 5.2 - o.mag * 1.3); g += `<circle cx="${x}" cy="${y}" r="${r}" fill="${o.kind === 'planet' ? '#ffd98a' : '#dfe6ff'}" ${o.kind === 'planet' ? 'stroke="#7ff5e0" stroke-width="1.2"' : ''}/>
        <text x="${x}" y="${y - r - 5}" fill="${o.kind === 'planet' ? '#ffd98a' : '#b7bfdc'}" font-size="${o.kind === 'planet' ? 13 : 11}" text-anchor="middle">${o.name}</text>`; }
    }
    const when = skyT ? tm(skyT) : (t === M.TIMES.shafaq ? 'بعد ذهاب الشفق ' + tm(t) : 'الآن');
    const row = (o) => `<tr><td><b>${o.name}</b></td><td>${o.alt > 0 ? n(Math.round(o.alt)) + '° ' + dirAr(o.az) : '<span class="label">تحت الأفق</span>'}</td><td>${o.rise ? tm(o.rise) : '—'}</td><td>${o.set ? tm(o.set) : '—'}</td></tr>`;
    $('#skyBody').innerHTML = `<div class="card"><h2 class="sec"><span>خريطة السماء ${when}</span></h2>
        <p class="lede">مركز الدائرة سمت رأسك، وحافتها الأفق. أمسك الهاتف فوق رأسك ووجّه حرف الشين إلى الشمال.</p>
        <div class="row" style="margin-bottom:10px"><button class="btn sm ghost" data-skyt="now" type="button">الآن</button><button class="btn sm ghost" data-skyt="dusk" type="button">بعد العشاء</button><button class="btn sm ghost" data-skyt="mid" type="button">منتصف الليل</button><button class="btn sm ghost" data-skyt="sahar" type="button">السَّحَر</button></div>
        <svg class="skychart" viewBox="0 0 520 520" role="img" aria-label="خريطة السماء">${g}</svg></div>
      <div class="card"><h2 class="sec"><span>الكواكب السيّارة والقمر</span></h2>
        <div class="scroll"><table><tr><th>الكوكب</th><th>موضعه</th><th>يطلع</th><th>يغرب</th></tr>${objs.filter((o) => o.kind !== 'star').map(row).join('')}</table></div>
        <p class="note">الطبائع والسعد والنحس المنسوبة إلى الكواكب معرفة تراثية، والحساب للهداية في البر والبحر لا للتنجيم.</p></div>
      <div class="card"><h2 class="sec"><span>النجوم اللامعة فوق أفقك</span></h2>
        <div class="scroll"><table><tr><th>النجم</th><th>الارتفاع والجهة</th></tr>${up.filter((o) => o.kind === 'star').map((o) => `<tr><td><b>${o.name}</b></td><td>${n(Math.round(o.alt))}° ${dirAr(o.az)}</td></tr>`).join('') || '<tr><td colspan="2">لا نجم لامع فوق الأفق الآن</td></tr>'}</table></div></div>`;
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-skyt]'); if (!b) return;
    const T = M.TIMES, k = b.dataset.skyt;
    skyT = k === 'now' ? null : k === 'dusk' ? T.shafaq : k === 'mid' ? T.midnight : T.thirdLast;
    SFX.play('star'); renderSky();
  });

  // ============================================================ التمييز والتكليف
  function renderTaklif() {
    const v = store.get('birth', { d: '', sex: 'f', after: false });
    $('#taklifBody').innerHTML = `<div class="card"><h2 class="sec"><span>حاسبة سن التكليف</span></h2>
      <div class="row">
        <div class="field"><label class="label" for="bDate">تاريخ الولادة (ميلادي)</label><input type="date" id="bDate" value="${v.d}"></div>
        <div class="field"><span class="label">المولود</span><div class="seg" id="bSex"><button type="button" data-s="f">بنت</button><button type="button" data-s="m">ولد</button></div></div>
        <div class="field"><label class="label" for="bAfter">وُلد بعد غروب الشمس</label><input type="checkbox" id="bAfter" ${v.after ? 'checked' : ''} style="min-height:28px;width:28px"></div>
      </div><div id="tkOut" style="margin-top:14px"></div></div>
      <div class="card"><h3>الحكم</h3><p class="ruling">يتحقق البلوغ في الأنثى بإكمال تسع سنين قمرية، وفي الذكر بإكمال خمس عشرة سنة قمرية أو بإحدى العلامتين قبلها. والتمييز لا سنّ محددة له، وهو أن يعرف الصبي الحسن والقبيح ويفهم الخطاب، وتصح عبادات المميّز تمريناً.</p>
      <p class="note">على فتاوى السيد السيستاني بحسب المشهور، ويُراجَع نص منهاج الصالحين. اليوم الهجري يبدأ من غروب الشمس، فمن وُلد بعد الغروب حُسب من اليوم التالي.</p></div>`;
    $$('#bSex button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.s === v.sex)));
    const calc = () => {
      const d = $('#bDate').value, sex = $$('#bSex button[aria-pressed="true"]')[0]?.dataset.s || 'f', after = $('#bAfter').checked;
      store.set('birth', { d, sex, after }); if (!d) { $('#tkOut').innerHTML = '<p class="lede">أدخل تاريخ الولادة.</p>'; return; }
      let g = F.parseKey(d); if (after) g = F.addDays(g, 1);
      const inRange = M.MONTHS.length && F.cmpDay(g, M.MONTHS[0].start) >= 0;
      const h = inRange ? F.hijriOf(g, M.MONTHS) : F.tabularOf(g);
      const yrs = sex === 'f' ? 9 : 15;
      // اليوم الذي يكتمل فيه العمر: نفس اليوم والشهر الهجريين بعد yrs سنة (جدولياً ثم تصحيح بالتقويم المحسوب إن كان في مداه)
      const jd = F.hijriTabToJd(h.y + yrs, h.m, Math.min(h.d, 29)); let done = F.jdToGreg(jd);
      const mo = M.MONTHS.find((x) => x.hy === h.y + yrs && x.hm === h.m); if (mo) done = F.addDays(mo.start, Math.min(h.d, mo.length || 30) - 1);
      const daysLeft = F.dayDiff(M.TODAY, done), age = F.dayDiff(g, M.TODAY) / 354.367;
      $('#tkOut').innerHTML = `<dl class="kv"><dt>الولادة هجرياً</dt><dd><b>${n(h.d)} ${H[h.m - 1]} ${n(h.y)}هـ</b> <span class="label">${inRange ? 'بالتقويم المتوقع' : 'جدولي ±١–٢ يوم'}</span></dd>
        <dt>العمر القمري</dt><dd>${fx(age, 2)} سنة</dd>
        <dt>${sex === 'f' ? 'تبلغ' : 'يبلغ'} سن التكليف</dt><dd><b>${n(h.d)} ${H[h.m - 1]} ${n(h.y + yrs)}هـ</b>، الموافق نحو <b>${gdate(done)}</b>، ويبدأ التكليف من غروب ليلته</dd>
        <dt>المتبقّي</dt><dd>${daysLeft > 0 ? `<span class="pill mid">${n(daysLeft)} يوم</span>` : '<span class="pill ok">بلغ سن التكليف</span>'}</dd></dl>
        <p class="note">الفرق بين ${n(yrs)} سنة قمرية وشمسية نحو ${n(Math.round(yrs * 10.9))} يوماً، فالتكليف يسبق عيد الميلاد الميلادي.</p>`;
    };
    $('#bDate').addEventListener('change', calc); $('#bAfter').addEventListener('change', calc);
    $('#bSex').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; $$('#bSex button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); calc(); });
    calc();
  }

  // ============================================================ برج المولود والطالع
  function ascendant(t, lat, lon) {
    const lst = ((A.SiderealTime(t) + lon / 15) % 24 + 24) % 24 * 15 * Math.PI / 180, eps = 23.4393 * Math.PI / 180, phi = lat * Math.PI / 180;
    let asc = Math.atan2(Math.cos(lst), -(Math.sin(lst) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps))) * 180 / Math.PI;
    return (asc + 360) % 360;
  }
  function renderBurj() {
    const v = store.get('burjIn', { d: '', t: '12:00' });
    $('#burjBody').innerHTML = `<div class="card"><h2 class="sec"><span>البرج والطالع ساعة الولادة</span></h2>
      <div class="row"><div class="field"><label class="label" for="zDate">التاريخ</label><input type="date" id="zDate" value="${v.d}"></div>
      <div class="field"><label class="label" for="zTime">الساعة (بتوقيت ${M.PL.name})</label><input type="time" id="zTime" value="${v.t}"></div></div>
      <div id="zOut" style="margin-top:14px"></div></div>
      <div class="card"><h3>تنبيه</h3><p class="ruling">هذا باب من التراث الفلكي يُعرض للمعرفة والفضول العلمي. فالبرج موضع الشمس من دائرة البروج، والطالع البرج الذي يشرق في الأفق الشرقي تلك الساعة. ولا يُعتقد للكواكب تأثير مستقل في الأقدار، والإخبار بالغيب منها محرّم.</p>
      <p class="note">البروج هنا مدارية (الحمل يبدأ عند الاعتدال الربيعي)، وهي المعتمدة في التقاويم العربية والجعفرية.</p></div>`;
    const calc = () => {
      const d = $('#zDate').value, tt = $('#zTime').value || '12:00'; store.set('burjIn', { d, t: tt });
      if (!d) { $('#zOut').innerHTML = '<p class="lede">أدخل تاريخ الولادة وساعتها.</p>'; return; }
      const o = F.parseKey(d), [hh, mm] = tt.split(':').map(Number);
      const t = new Date(Date.UTC(o.y, o.m - 1, o.d, hh, mm) - M.PL.tz * 3600000);
      const s = F.skyNow(t), asc = ascendant(t, M.PL.lat, M.PL.lon), ab = F.burjOf(asc), deg = (x) => n(Math.floor(x % 30)) + '°';
      $('#zOut').innerHTML = `<div class="grid3">
        <div class="time"><span class="label">برج الشمس</span><b>${s.sunBurj.name}</b><span class="sub">${deg(s.sunLon)} منه · منزلة ${s.sunManzil.name}</span></div>
        <div class="time is-next"><span class="label">الطالع</span><b>${ab.name}</b><span class="sub">${deg(asc)} منه في الأفق الشرقي</span></div>
        <div class="time"><span class="label">القمر</span><b>${s.moonBurj.name}</b><span class="sub">منزلة ${s.moonManzil.name} · إضاءة ${n(Math.round(s.illum))}٪</span></div></div>`;
    };
    $('#zDate').addEventListener('change', calc); $('#zTime').addEventListener('change', calc); calc();
  }

  // ============================================================ أبواب تنتظر مادة البحث (تُملأ من phase2.js)
  function pendingBody(id, title) {
    const P = self.Phase2 && self.Phase2[id];
    if (P && P.render) return P.render(M, F, $('#' + id + 'Body'));
    $('#' + id + 'Body').innerHTML = `<div class="card"><h2 class="sec"><span>${title}</span></h2><p class="lede">مادة هذا الباب قيد البحث المعمّق من المصادر المعتمدة، وتُضاف قريباً.</p></div>`;
  }


  // ============================================================ رحلة اليوم
  const CHALDEAN = ['زحل', 'المشتري', 'المريخ', 'الشمس', 'الزهرة', 'عطارد', 'القمر'];
  const DAY_RULER = [3, 6, 2, 5, 1, 4, 0]; // الأحد الشمس، الاثنين القمر، ... السبت زحل (فهارس في CHALDEAN)
  function sunAltAt(t) { const pl = M.PL, o = new A.Observer(pl.lat, pl.lon, pl.elev || 0), e = A.Equator(A.Body.Sun, t, o, true, true); return A.Horizon(t, o, e.ra, e.dec, '').altitude; }
  function renderRihla() {
    const T = M.TIMES, now = new Date(), h = F.hijriOf(M.TODAY, M.MONTHS), ram = h && h.m === 9, fri = F.weekday(M.TODAY) === 5;
    const alt = (t) => (t ? fx(sunAltAt(t), 1) + '°' : '—');
    const ST = [
      ['fajr', 'الفجر الصادق', T.fajr, T.sunrise,
        'يدخل وقت صلاة الصبح، ويجب الإمساك على الصائم. فضيلتها إلى ظهور الحمرة المشرقية.',
        'نافلة الفجر ركعتان قبل الفريضة، والتعقيب بعدها. ويُكره النوم بين الطلوعين.',
        `الشمس تحت الأفق بـ${n(Math.abs(store.get('fajr', -18)))}° (الضوء المعترض في الأفق).`],
      ['sunrise', 'الشروق', T.sunrise, T.zawal,
        'ينتهي وقت صلاة الصبح أداءً بطلوع الشمس.',
        'السعي في الرزق وطلب الحوائج أول النهار.',
        `طلوع الحافة العليا للقرص، وطول النهار ${fx(T.dayLen, 2)} ساعة.`],
      ['zawal', 'الزوال', T.zawal, T.mithl1,
        'يدخل وقت الظهرين، ويختص الظهر بمقدار أدائها من أوله. فضيلة الظهر إلى بلوغ الظل مثل الشاخص.' + (fri ? ' وفي يوم الجمعة صلاة الجمعة أو الظهر.' : ''),
        'نافلة الظهر ثمان ركعات قبل الفريضة، ونافلة العصر ثمان قبل العصر.',
        `الشمس على خط الزوال بارتفاع ${alt(T.zawal)}، وميلها ${fx(T.dec, 2)}°.`],
      ['mithl1', 'بلوغ المثل', T.mithl1, T.mithl2,
        'تنتهي فضيلة الظهر، ويستمر وقت فضيلة العصر.',
        'التعقيب بعد العصر، والاستغفار سبعين مرة.',
        `الظل الحادث يساوي طول الشاخص، وارتفاع الشمس ${alt(T.mithl1)}.`],
      ['mithl2', 'بلوغ المثلين', T.mithl2, T.sunset,
        'تنتهي فضيلة العصر، ويبقى وقت الإجزاء إلى الغروب، ويختص العصر بآخره.',
        'الدعاء آخر النهار' + (fri ? '، وساعة آخر نهار الجمعة من ساعات الإجابة.' : '.'),
        `الظل الحادث ضعف الشاخص، وارتفاع الشمس ${alt(T.mithl2)}.`],
      ['sunset', 'الغروب والمغرب', T.sunset, T.shafaq,
        'يدخل وقت المغرب بذهاب الحمرة المشرقية احتياطاً، وفضيلته إلى ذهاب الشفق الأحمر.' + (ram ? ' والإفطار في رمضان بدخول المغرب.' : ''),
        'نافلة المغرب أربع ركعات بعد الفريضة. ويُكره النوم بين العشاءين.',
        `يغرب القرص ${tm(T.sunset)}، وتنخفض الشمس 4° الساعة ${tm(T.maghrib)}.`],
      ['shafaq', 'ذهاب الشفق', T.shafaq, T.thirdFirst,
        'يبدأ وقت فضيلة العشاء إلى ثلث الليل.',
        'الوتيرة ركعتان من جلوس بعد العشاء، والنوم على طهارة.',
        `الشمس تحت الأفق بنحو 14°، ويظلم الأفق الغربي.`],
      ['midnight', 'منتصف الليل', T.midnight, T.thirdLast,
        'ينتهي وقت العشاءين الاختياري عند السيد السيستاني (منتصف ما بين الغروب والفجر).',
        'من فاتته العشاءان حتى منتصف الليل فالأحوط أن يأتي بهما قبل الفجر بلا نية أداء ولا قضاء.',
        `طول الليل ${fx(T.nightLen, 2)} ساعة، ومنتصفه ${tm(T.midnight)}.`],
      ['thirdLast', 'الثلث الأخير والسَّحَر', T.thirdLast, T.fajrNext,
        'أفضل أوقات صلاة الليل، وكلما قرب من الفجر كان أفضل.' + (ram ? ' والسحور قبيل الفجر.' : ''),
        'صلاة الليل إحدى عشرة ركعة: ثمان، والشفع، والوتر، والاستغفار في قنوت الوتر.',
        `يبدأ الثلث الأخير ${tm(T.thirdLast)}، والفجر التالي ${tm(T.fajrNext)}.`],
    ];
    const cur = ST.findIndex(([, , a, b]) => a && b && now >= a && now < b);
    const stations = ST.map(([k, name, a, b, sh, su, hi], i) => `<article class="card st ${i === cur ? 'now' : a && b && now >= b ? 'past' : ''}">
      <header><b>${name}</b><time>${tm(a)} ← ${tm(b)}</time></header>
      <div class="facets"><div class="f-shar"><i>الشأن الشرعي</i>${sh}</div><div class="f-sun"><i>السنن</i>${su}</div><div class="f-his"><i>الحساب</i>${hi}</div></div></article>`).join('');
    // الساعات الزمانية: 12 للنهار و12 لليل
    const rows = []; const dr = DAY_RULER[F.weekday(M.TODAY)];
    if (T.sunrise && T.sunset && T.sunriseNext) {
      const dh = (T.sunset - T.sunrise) / 12, nh = (T.sunriseNext - T.sunset) / 12;
      for (let i = 0; i < 24; i++) {
        const a = i < 12 ? new Date(T.sunrise.getTime() + i * dh) : new Date(T.sunset.getTime() + (i - 12) * nh);
        const b = new Date(a.getTime() + (i < 12 ? dh : nh));
        const st = ST.filter(([, , x]) => x && x < b).pop();
        rows.push(`<tr class="${now >= a && now < b ? 'cur' : ''}"><td>${i < 12 ? 'النهار' : 'الليل'} ${n((i % 12) + 1)}</td><td>${tm(a)}</td><td>${n(Math.round((b - a) / 60000))} د</td><td>${st ? st[1] : 'آخر الليل'}</td><td><span class="label">${CHALDEAN[(dr + i) % 7]}</span></td></tr>`);
      }
    }
    $('#rihlaBody').innerHTML = `<div class="tl">${stations}</div>
      <div class="card"><h2 class="sec"><span>الساعات الزمانية</span></h2>
        <p class="lede">يُقسم النهار من الشروق إلى الغروب اثنتي عشرة ساعة، والليل مثلها، فتطول ساعات النهار صيفاً وتقصر شتاءً.</p>
        <div class="scroll"><table class="hours"><tr><th>الساعة</th><th>تبدأ</th><th>طولها</th><th>المحطة الشرعية</th><th>ربّها في التراث</th></tr>${rows.join('')}</table></div>
        <p class="note">«ربّ الساعة» تسمية تراثية من الهيئة القديمة تُعرض معرفةً لا اعتقاداً بتأثير الكواكب. والسنن المذكورة على المشهور عند الإمامية، ويُراجَع منهاج الصالحين.</p></div>`;
    const nowEl = $('#rihlaBody .st.now'); if (nowEl && M.view === 'rihla') setTimeout(() => nowEl.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }), 200);
  }

  // ============================================================ التسجيل
  const R = M.RENDER;
  R.hub = () => renderHub($('#hubAll'));
  const todayOrig = R.today; R.today = () => { todayOrig(); renderHub($('#hubHome')); setMode(); };
  R.sky = renderSky; R.rihla = renderRihla; R.taklif = renderTaklif; R.burj = renderBurj; R.about = () => {};
  R.safar = () => pendingBody('safar', 'مسافة السفر'); R.hajj = () => pendingBody('hajj', 'أعمال الحج');
  R.aqd = () => pendingBody('aqd', 'أوقات العقد'); R.muqaraba = () => pendingBody('muqaraba', 'أوقات المقاربة'); R.adab = () => pendingBody('adab', 'الآداب والسنن');
  $('#copyMail').addEventListener('click', () => { const m = 'taroot80@gmail.com'; (navigator.clipboard ? navigator.clipboard.writeText(m) : Promise.reject()).then(() => toast('نُسخ البريد'), () => { const r = document.createRange(); r.selectNodeContents($('#mailTxt')); getSelection().removeAllRanges(); getSelection().addRange(r); toast('حدّد البريد وانسخه'); }); });
  decorate(); setMode(true);
  requestAnimationFrame(frame);
  setInterval(() => { setMode(); if (M.view === 'today') renderHub($('#hubHome')); }, 30000);
  setInterval(() => { const N = M.NEXT; if (N && lastNext && N[0] !== lastNext) setMode(); }, 1000);
})();
