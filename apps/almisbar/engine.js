/*
 * engine.js — محرك «المسبار» الفلكي الشرعي
 * نقلٌ إلى JavaScript لمنطق falak.py وshari.py (مهارة falak-shari 1.2.0)،
 * مبنيّ على مكتبة Astronomy Engine (VSOP87 + نظرية القمر لـ Chapront، دقة دون الدقيقة القوسية).
 * كل الحساب على الجهاز؛ لا يحتاج اتصالاً.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('astronomy-engine'));
  else root.Falak = factory(root.Astronomy);
})(typeof self !== 'undefined' ? self : this, function (A) {
  'use strict';
  const RAD = Math.PI / 180, DAY = 86400000;
  const KAABA = { lat: 21.4225, lon: 39.8262 };

  // ------------------------------------------------------------ المدن
  // المفتاح: [الاسم، العرض، الطول، الارتفاع م، فرق التوقيت]
  const PLACES = {
    qatif: ['القطيف', 26.5654, 50.0089, 5, 3], dammam: ['الدمام', 26.4207, 50.0888, 10, 3],
    ahsa: ['الأحساء', 25.3830, 49.5860, 160, 3], riyadh: ['الرياض', 24.7136, 46.6753, 610, 3],
    mecca: ['مكة المكرمة', 21.4225, 39.8262, 277, 3], medina: ['المدينة المنورة', 24.4672, 39.6111, 608, 3],
    jeddah: ['جدة', 21.5433, 39.1728, 12, 3], bahrain: ['البحرين', 26.2235, 50.5876, 5, 3],
    kuwait: ['الكويت', 29.3759, 47.9774, 10, 3], najaf: ['النجف الأشرف', 32.0000, 44.3350, 50, 3],
    karbala: ['كربلاء المقدسة', 32.6160, 44.0249, 30, 3], basra: ['البصرة', 30.5085, 47.7804, 5, 3],
    qum: ['قم المقدسة', 34.6401, 50.8764, 930, 3.5], tehran: ['طهران', 35.6892, 51.3890, 1190, 3.5],
    mashhad: ['مشهد المقدسة', 36.2605, 59.6168, 990, 3.5], beirut: ['بيروت', 33.8938, 35.5018, 30, 2],
    cairo: ['القاهرة', 30.0444, 31.2357, 25, 2], rabat: ['الرباط', 34.0209, -6.8416, 50, 1],
    dakar: ['داكار', 14.7167, -17.4677, 20, 0], london: ['لندن', 51.5074, -0.1278, 20, 0],
    rio: ['ريو دي جانيرو', -22.9068, -43.1729, 10, -3], newyork: ['نيويورك', 40.7128, -74.0060, 10, -5],
    la: ['لوس أنجلوس', 34.0522, -118.2437, 90, -8],
  };
  function place(key) {
    const p = PLACES[key];
    return { key, name: p[0], lat: p[1], lon: p[2], elev: p[3], tz: p[4] };
  }
  const obsOf = (pl) => new A.Observer(pl.lat, pl.lon, pl.elev || 0);

  // ------------------------------------------------------------ الوقت المحلي
  // التاريخ المحلي {y,m,d} ← لحظة UTC لمنتصف الليل المحلي
  const localMidnight = (y, m, d, tz) => new Date(Date.UTC(y, m - 1, d) - tz * 3600000);
  const toLocal = (date, tz) => new Date(date.getTime() + tz * 3600000); // اقرأ بـ getUTC*
  const ymd = (date, tz) => { const t = toLocal(date, tz); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }; };
  const addDays = (o, n) => { const t = new Date(Date.UTC(o.y, o.m - 1, o.d + n)); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }; };
  const dkey = (o) => `${o.y}-${String(o.m).padStart(2, '0')}-${String(o.d).padStart(2, '0')}`;
  const parseKey = (s) => { const [y, m, d] = s.split('-').map(Number); return { y, m, d }; };
  const cmpDay = (a, b) => (a.y - b.y) || (a.m - b.m) || (a.d - b.d);
  const dayDiff = (a, b) => Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / DAY);
  const weekday = (o) => new Date(Date.UTC(o.y, o.m - 1, o.d)).getUTCDay(); // 0 = الأحد
  const D = (t) => (t ? t.date : null);

  // ------------------------------------------------------------ الليل والنهار
  function riseSet(body, obs, dir, start, limit) {
    try { return D(A.SearchRiseSet(body, obs, dir, start, limit)); } catch (e) { return null; }
  }
  function sunAlt(obs, dir, start, alt, limit = 1) {
    try { return D(A.SearchAltitude(A.Body.Sun, obs, dir, start, limit, alt)); } catch (e) { return null; }
  }
  function transit(obs, start) { return A.SearchHourAngle(A.Body.Sun, obs, 0, start).time.date; }
  function sunDecAt(t, obs) { return A.Equator(A.Body.Sun, t, obs, true, true).dec; }

  /** ارتفاع الشمس حين يبلغ الظل الحادث n من الشاخص (بعد ظل الزوال): cot h = n + tan|φ−δ| */
  function shadowAlt(n, phi, dec) {
    return Math.atan(1 / (n + Math.tan(Math.abs(phi - dec) * RAD))) / RAD;
  }

  /**
   * أوقات اليوم والليلة. الليلة تسبق يومها: «ليلة» اليوم d هي مساء d-1،
   * أما هنا فنحسب نهار d ثم ليلته التالية (من غروب d إلى فجر d+1).
   */
  function dayTimes(pl, y, m, d, opt = {}) {
    const fajrDeg = opt.fajr ?? -18, maghribDeg = opt.maghrib ?? -4, shafaqDeg = opt.shafaq ?? -14;
    const obs = obsOf(pl), t0 = localMidnight(y, m, d, pl.tz);
    const zawal = transit(obs, t0);
    const dec = sunDecAt(zawal, obs);
    const fajr = sunAlt(obs, +1, t0, fajrDeg);
    const sunrise = riseSet(A.Body.Sun, obs, +1, t0, 1);
    const sunset = riseSet(A.Body.Sun, obs, -1, zawal, 1);
    const maghrib = sunAlt(obs, -1, zawal, maghribDeg);
    const shafaq = sunAlt(obs, -1, zawal, shafaqDeg);
    const mithl = (n) => sunAlt(obs, -1, zawal, shadowAlt(n, pl.lat, dec));
    const sab = mithl(2 / 7), mithl1 = mithl(1), mithl2 = mithl(2);
    const fajrNext = sunset ? sunAlt(obs, +1, sunset, fajrDeg) : null;
    const sunriseNext = sunset ? riseSet(A.Body.Sun, obs, +1, sunset, 1) : null;
    const mid = (a, b, f) => (a && b ? new Date(a.getTime() + (b - a) * f) : null);
    return {
      fajr, sunrise, zawal, sab, mithl1, mithl2, sunset, maghrib, shafaq, fajrNext, sunriseNext,
      dec,
      dayLen: sunrise && sunset ? (sunset - sunrise) / 3600000 : null,
      nightLen: sunset && fajrNext ? (fajrNext - sunset) / 3600000 : null,
      midnight: mid(sunset, fajrNext, 1 / 2),          // السيستاني: منتصف ما بين الغروب والفجر (م 502)
      midnightSunrise: mid(sunset, sunriseNext, 1 / 2), // القول الآخر: إلى الشروق
      thirdLast: mid(sunset, fajrNext, 2 / 3),
      thirdFirst: mid(sunset, fajrNext, 1 / 3),
      highLat: !fajr || !shafaq,
    };
  }

  // ------------------------------------------------------------ الهلال
  function nearestNewMoon(t) {
    return A.SearchMoonPhase(0, new Date(t.getTime() - 15 * DAY), 30).date;
  }
  function newMoonsBetween(a, b) {
    const out = []; let t = a;
    for (;;) { const nm = A.SearchMoonPhase(0, t, 40); if (!nm || nm.date > b) break; out.push(nm.date); t = new Date(nm.date.getTime() + DAY); }
    return out;
  }

  function crescentAt(pl, t) {
    const obs = obsOf(pl);
    const em = A.Equator(A.Body.Moon, t, obs, true, true), es = A.Equator(A.Body.Sun, t, obs, true, true);
    const hm = A.Horizon(t, obs, em.ra, em.dec, ''), hs = A.Horizon(t, obs, es.ra, es.dec, '');
    const malt = hm.altitude, salt = hs.altitude;
    let daz = Math.abs(hm.azimuth - hs.azimuth); if (daz > 180) daz = 360 - daz;
    const arcvTopo = malt - salt;
    const arclTopo = A.AngleBetween(em.vec, es.vec);
    const distKm = em.dist * 149597870.7;
    const hp = Math.asin(6378.14 / distKm) / RAD;
    const arcvGeo = malt + hp * Math.cos(malt * RAD) - salt;
    const arclGeo = A.AngleBetween(A.GeoVector(A.Body.Moon, t, true), A.GeoVector(A.Body.Sun, t, true));
    const sd = Math.asin(1737.4 / distKm) / RAD * 60; // نصف القطر الظاهري بالدقائق
    const w = sd * (1 - Math.cos(arclTopo * RAD));
    const q = (arcvGeo - (11.8371 - 6.3226 * w + 0.7319 * w * w - 0.1018 * w ** 3)) / 10;
    const v = arcvTopo - (-0.1018 * w ** 3 + 0.7319 * w * w - 6.3226 * w + 7.1651);
    const illum = A.Illumination(A.Body.Moon, t).phase_fraction * 100;
    return { malt, salt, daz, arcv: arcvTopo, arcl: arclTopo, arclGeo, w, q, v, illum, mAz: hm.azimuth, sAz: hs.azimuth };
  }
  const YALLOP = [[0.216, 'A', 'يُرى بالعين بسهولة'], [-0.014, 'B', 'يُرى بالعين في صفاء تام'],
    [-0.160, 'C', 'قد يحتاج منظاراً ثم يُرى بالعين'], [-0.232, 'D', 'بالمنظار فقط'],
    [-0.293, 'E', 'غير مرئي حتى بالمنظار'], [-Infinity, 'F', 'غير مرئي (تحت حد دانجون)']];
  function yallopClass(q) { for (const [lim, c, t] of YALLOP) if (q > lim) return { code: c, text: t }; }
  function odehClass(v) {
    if (v >= 5.65) return { code: 'A', text: 'يُرى بالعين المجردة', eye: true };
    if (v >= 2.0) return { code: 'B', text: 'بالأجهزة، وقد يُرى بالعين', eye: false, maybe: true };
    if (v >= -0.96) return { code: 'C', text: 'بالأجهزة فقط', eye: false };
    return { code: 'D', text: 'مستحيل الرؤية', eye: false };
  }

  /** تقييم مساء يوم محلي في موقع (منطق falak.py hilal_evening). */
  function hilalEvening(pl, y, m, d) {
    const obs = obsOf(pl);
    const noon = new Date(localMidnight(y, m, d, pl.tz).getTime() + 12 * 3600000);
    const ss = riseSet(A.Body.Sun, obs, -1, noon, 1);
    if (!ss) return null;
    const ms = riseSet(A.Body.Moon, obs, -1, new Date(ss.getTime() - 0.25 * DAY), 1);
    const lag = ms ? (ms - ss) / 60000 : null;
    const nm = nearestNewMoon(ss);
    const ageH = (ss - nm) / 3600000;
    const best = ms && ms > ss ? new Date(ss.getTime() + (4 / 9) * (ms - ss)) : ss;
    const c = crescentAt(pl, best);
    const impossible = ageH < 0 || lag == null || lag <= 0;
    const yc = yallopClass(c.q), oc = odehClass(c.v);
    return {
      date: { y, m, d }, sunset: ss, moonset: ms, lag, ageH, newMoon: nm, best, ...c,
      impossible, danjon: c.arcl < 6.4,
      yallop: impossible ? { code: '—', text: 'لا رؤية' } : yc,
      odeh: impossible ? { code: '—', text: 'مستحيل: القمر يغرب قبل الشمس أو قبل الاقتران', eye: false } : oc,
      eye: !impossible && oc.eye, maybe: !impossible && !!oc.maybe,
    };
  }

  /** أم القرى (شرط وجود): اقتران قبل غروب مكة وغروب القمر بعد الشمس → الغد أول الشهر. */
  function ummAlQuraStart(nm) {
    const mk = place('mecca');
    let day = ymd(nm, 3);
    for (let k = 0; k < 3; k++) {
      const e = hilalEvening(mk, day.y, day.m, day.d);
      if (e && e.ageH > 0 && e.lag > 0) return addDays(day, 1);
      day = addDays(day, 1);
    }
    return day;
  }

  /**
   * أول الشهر المتوقع جعفرياً لاقتران nm في أفق pl: اليوم التالي لأول مساء يكون فيه
   * الهلال في منطقة الرؤية بالعين المجردة (عودة A)، ولا يتجاوز إكمال الثلاثين.
   * possibleEarlier: مساء سابق في المنطقة B (قد يُرى بالعين في صفاء تام).
   */
  function monthStart(nm, pl, prevStart) {
    let day = ymd(nm, pl.tz);
    const evenings = [];
    let start = null, earlier = null;
    for (let k = 0; k < 3 && !start; k++) {
      const e = hilalEvening(pl, day.y, day.m, day.d);
      evenings.push(e);
      if (e && e.eye) start = addDays(day, 1);
      else if (e && e.maybe && !earlier) earlier = addDays(day, 1);
      day = addDays(day, 1);
    }
    if (!start) start = day;
    let completed30 = false;
    if (prevStart) {
      const cap = addDays(prevStart, 30);
      if (cmpDay(start, cap) > 0) { start = cap; completed30 = true; }
    }
    if (earlier && cmpDay(earlier, start) >= 0) earlier = null;
    return { start, earlier, evenings, completed30 };
  }

  // ------------------------------------------------------------ التقويم الهجري الجدولي (للتسمية فقط)
  const ISLAMIC_EPOCH = 1948439.5;
  function gregToJd(y, m, d) {
    if (m <= 2) { y -= 1; m += 12; }
    const a = Math.floor(y / 100), b = 2 - a + Math.floor(a / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524.5;
  }
  function jdToGreg(jd) {
    jd += 0.5; const z = Math.floor(jd); let a = z;
    if (z >= 2299161) { const al = Math.floor((z - 1867216.25) / 36524.25); a = z + 1 + al - Math.floor(al / 4); }
    const b = a + 1524, c = Math.floor((b - 122.1) / 365.25), dd = Math.floor(365.25 * c), e = Math.floor((b - dd) / 30.6001);
    const day = b - dd - Math.floor(30.6001 * e), month = e < 14 ? e - 1 : e - 13, year = month > 2 ? c - 4716 : c - 4715;
    return { y: year, m: month, d: day };
  }
  const hijriTabToJd = (y, m, d) => d + Math.ceil(29.5 * (m - 1)) + (y - 1) * 354 + Math.floor((3 + 11 * y) / 30) + ISLAMIC_EPOCH - 1;
  function jdToHijriTab(jd) {
    jd = Math.floor(jd) + 0.5;
    const y = Math.floor((30 * (jd - ISLAMIC_EPOCH) + 10646) / 10631);
    const m = Math.min(12, Math.ceil((jd - (29 + hijriTabToJd(y, 1, 1))) / 29.5) + 1);
    return { y, m, d: jd - hijriTabToJd(y, m, 1) + 1 };
  }
  const tabularOf = (o) => jdToHijriTab(gregToJd(o.y, o.m, o.d));

  // ------------------------------------------------------------ التقويم الجعفري المحسوب
  /**
   * يبني جدول بدايات الشهور (بالرؤية المتوقعة في أفق pl) بين تاريخين.
   * overrides: {"1448-09": "2027-02-09"} إعلانات ثابتة تتقدّم على الحساب.
   */
  function buildMonths(pl, fromDay, toDay, overrides = {}) {
    const a = new Date(Date.UTC(fromDay.y, fromDay.m - 1, fromDay.d) - 32 * DAY);
    const b = new Date(Date.UTC(toDay.y, toDay.m - 1, toDay.d) + 2 * DAY);
    const nms = newMoonsBetween(a, b);
    const months = []; let prev = null;
    for (const nm of nms) {
      const r = monthStart(nm, pl, prev && prev.start);
      const lab = tabularOf(addDays(r.start, 14));
      const key = `${lab.y}-${String(lab.m).padStart(2, '0')}`;
      const mo = { hy: lab.y, hm: lab.m, key, newMoon: nm, ...r, computed: r.start, source: 'حساب' };
      if (overrides[key]) { mo.start = parseKey(overrides[key]); mo.source = 'إعلان'; mo.earlier = null; }
      months.push(mo); prev = mo;
    }
    for (let i = 0; i < months.length; i++) {
      const n = months[i + 1];
      months[i].length = n ? dayDiff(months[i].start, n.start) : null;
    }
    return months;
  }
  function hijriOf(day, months) {
    for (let i = months.length - 1; i >= 0; i--) {
      if (cmpDay(day, months[i].start) >= 0) {
        return { y: months[i].hy, m: months[i].hm, d: dayDiff(months[i].start, day) + 1, month: months[i] };
      }
    }
    return null;
  }

  // ------------------------------------------------------------ الهجري الشمسي
  function nowruz(gy) {
    const eq = A.Seasons(gy).mar_equinox.date;
    const t = toLocal(eq, 3.5);
    let o = { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
    if (t.getUTCHours() >= 12) o = addDays(o, 1);
    return o;
  }
  function solarHijri(g) {
    let n = nowruz(g.y);
    if (cmpDay(g, n) < 0) n = nowruz(g.y - 1);
    const sy = n.y - 621; let days = dayDiff(n, g);
    if (days < 186) return { y: sy, m: Math.floor(days / 31) + 1, d: days % 31 + 1 };
    days -= 186; const m = Math.min(12, Math.floor(days / 30) + 7);
    return { y: sy, m, d: days - (m - 7) * 30 + 1 };
  }

  // ------------------------------------------------------------ المنازل
  const MANAZIL = ['الشرطان', 'البطين', 'الثريا', 'الدبران', 'الهقعة', 'الهنعة', 'الذراع', 'النثرة', 'الطرف', 'الجبهة',
    'الزبرة', 'الصرفة', 'العواء', 'السماك', 'الغفر', 'الزبانى', 'الإكليل', 'القلب', 'الشولة', 'النعائم', 'البلدة',
    'سعد الذابح', 'سعد بلع', 'سعد السعود', 'سعد الأخبية', 'الفرغ المقدم', 'الفرغ المؤخر', 'الرشاء'];
  const BUROOJ = ['الحمل', 'الثور', 'الجوزاء', 'السرطان', 'الأسد', 'السنبلة', 'الميزان', 'العقرب', 'القوس', 'الجدي', 'الدلو', 'الحوت'];
  const SPAN = 360 / 28;
  const manzilOf = (lon) => { const i = Math.floor(((lon % 360) + 360) % 360 / SPAN); return { i, name: MANAZIL[i] }; };
  const burjOf = (lon) => { const i = Math.floor(((lon % 360) + 360) % 360 / 30); return { i, name: BUROOJ[i] }; };
  const moonLon = (t) => A.EclipticGeoMoon(t).lon;
  const sunLon = (t) => A.SunPosition(t).elon;

  function skyNow(t) {
    const ml = moonLon(t), sl = sunLon(t);
    const ill = A.Illumination(A.Body.Moon, t);
    const phase = A.MoonPhase(t); // 0 اقتران، 180 بدر
    return { moonLon: ml, sunLon: sl, phase, illum: ill.phase_fraction * 100,
      moonManzil: manzilOf(ml), sunManzil: manzilOf(sl), moonBurj: burjOf(ml), sunBurj: burjOf(sl),
      aqrab: ml >= 210 && ml < 240 };
  }

  /** دخول الشمس كل منزلة في سنة ميلادية (حلول مداري). */
  function sunManazilYear(year) {
    const out = []; let t = new Date(Date.UTC(year, 0, 1)); const end = new Date(Date.UTC(year + 1, 0, 1));
    let last = manzilOf(sunLon(t)).i;
    while (t < end) {
      const t2 = new Date(t.getTime() + 6 * 3600000);
      const i = manzilOf(sunLon(t2)).i;
      if (i !== last) { out.push({ date: t2, i, name: MANAZIL[i] }); last = i; }
      t = t2;
    }
    return out;
  }

  /** فترات القمر في برج العقرب المداري (210°–240°). */
  function aqrabPeriods(from, to) {
    const inside = (t) => { const l = moonLon(t); return l >= 210 && l < 240; };
    const bis = (a, b, want) => { for (let k = 0; k < 30; k++) { const c = new Date((a.getTime() + b.getTime()) / 2); if (inside(c) === want) b = c; else a = c; } return b; };
    const out = []; let t = from, was = inside(t), entry = was ? from : null;
    const step = 2 * 3600000;
    while (t < to) {
      const t2 = new Date(t.getTime() + step), now = inside(t2);
      if (now && !was) entry = bis(t, t2, true);
      if (!now && was) out.push({ from: entry, to: bis(t, t2, false) });
      was = now; t = t2;
    }
    if (was) out.push({ from: entry, to: null });
    return out;
  }

  // ------------------------------------------------------------ الكسوف والخسوف
  function eclipses(pl, from, count = 8) {
    const obs = obsOf(pl), out = [];
    let le = A.SearchLunarEclipse(from);
    let ge = A.SearchGlobalSolarEclipse(from);
    let ls = A.SearchLocalSolarEclipse(from, obs);
    while (out.length < count) {
      if (le.peak.date < ge.peak.date) {
        const peak = le.peak.date;
        const half = (le.sd_partial || le.sd_penum) * 60000;
        const begin = new Date(peak.getTime() - half), end = new Date(peak.getTime() + half);
        const altAt = (t) => { const e = A.Equator(A.Body.Moon, t, obs, true, true); return A.Horizon(t, obs, e.ra, e.dec, 'normal').altitude; };
        const altPeak = altAt(peak), altB = altAt(begin), altE = altAt(end);
        const seen = Math.max(altPeak, altB, altE) > 0;
        const penumbral = le.kind === 'penumbral';
        out.push({
          type: 'lunar', kind: le.kind, peak, begin: le.sd_partial ? begin : null, end: le.sd_partial ? end : null,
          penBegin: new Date(peak.getTime() - le.sd_penum * 60000), penEnd: new Date(peak.getTime() + le.sd_penum * 60000),
          totalBegin: le.sd_total ? new Date(peak.getTime() - le.sd_total * 60000) : null,
          totalEnd: le.sd_total ? new Date(peak.getTime() + le.sd_total * 60000) : null,
          obscuration: le.obscuration, altPeak, seen,
          ayat: penumbral ? 'لا تجب (شبه ظلي)' : (seen ? 'تجب' : 'لا يُرى من البلد'),
          ayatOn: !penumbral && seen,
        });
        le = A.NextLunarEclipse(le.peak);
      } else {
        while (ls.peak.time.date.getTime() < ge.peak.date.getTime() - 2 * DAY) ls = A.NextLocalSolarEclipse(ls.peak.time, obs);
        const local = Math.abs(ls.peak.time.date - ge.peak.date) < 2 * DAY ? ls : null;
        let seen = false, info = null;
        if (local) {
          const up = [local.partial_begin, local.peak, local.partial_end].some((e) => e.altitude > 0);
          seen = up;
          info = { kind: local.kind, obscuration: local.obscuration, begin: local.partial_begin.time.date, peak: local.peak.time.date,
            end: local.partial_end.time.date, altPeak: local.peak.altitude,
            totalBegin: local.total_begin ? local.total_begin.time.date : null, totalEnd: local.total_end ? local.total_end.time.date : null };
        }
        out.push({ type: 'solar', kind: ge.kind, peak: ge.peak.date, globalLat: ge.latitude, globalLon: ge.longitude, local: info, seen,
          ayat: seen ? 'تجب' : 'لا يُرى من البلد', ayatOn: seen });
        ge = A.NextGlobalSolarEclipse(ge.peak);
      }
    }
    return out;
  }

  // ------------------------------------------------------------ القبلة والكعبة
  function qibla(lat, lon) {
    const phi = lat * RAD, pk = KAABA.lat * RAD, dl = (KAABA.lon - lon) * RAD;
    const q = Math.atan2(Math.sin(dl), Math.cos(phi) * Math.tan(pk) - Math.sin(phi) * Math.cos(dl));
    const h = Math.sin((pk - phi) / 2) ** 2 + Math.cos(phi) * Math.cos(pk) * Math.sin(dl / 2) ** 2;
    return { az: (q / RAD + 360) % 360, km: 2 * 6371 * Math.asin(Math.sqrt(h)) };
  }
  /** أيام مرور الشمس بسمت رأس نقطة (عند العبور) في سنة. */
  function subsolarHits(year, lat, lon) {
    const obs = new A.Observer(lat, lon, 0), rows = [];
    let t = new Date(Date.UTC(year, 0, 1)); const end = new Date(Date.UTC(year + 1, 0, 1));
    while (t < end) {
      const tr = A.SearchHourAngle(A.Body.Sun, obs, 0, t).time;
      const e = A.Equator(A.Body.Sun, tr, obs, true, true);
      const alt = A.Horizon(tr, obs, e.ra, e.dec, '').altitude;
      rows.push({ zd: 90 - alt, t: tr.date });
      t = new Date(tr.date.getTime() + 0.6 * DAY);
    }
    const out = [];
    for (let i = 1; i < rows.length - 1; i++)
      if (rows[i].zd <= rows[i - 1].zd && rows[i].zd <= rows[i + 1].zd && rows[i].zd < 0.6) out.push(rows[i]);
    return out;
  }
  function kaabaDays(year) {
    return { onKaaba: subsolarHits(year, KAABA.lat, KAABA.lon), antipode: subsolarHits(year, -KAABA.lat, KAABA.lon - 180) };
  }

  return {
    PLACES, place, KAABA, MANAZIL, BUROOJ, SPAN,
    localMidnight, toLocal, ymd, addDays, dkey, parseKey, cmpDay, dayDiff, weekday,
    dayTimes, shadowAlt, hilalEvening, crescentAt, yallopClass, odehClass, nearestNewMoon, newMoonsBetween,
    monthStart, ummAlQuraStart, buildMonths, hijriOf, tabularOf, jdToGreg, gregToJd, hijriTabToJd, jdToHijriTab,
    solarHijri, nowruz, manzilOf, burjOf, skyNow, sunManazilYear, aqrabPeriods, eclipses, qibla, kaabaDays,
  };
});
