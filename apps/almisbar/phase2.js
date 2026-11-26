/* phase2.js — أبواب المرحلة الثانية: مسافة السفر، أعمال الحج، أوقات العقد، أوقات المقاربة، الآداب والسنن.
   المادة من research/phase2.md (بحث 2026-11-05): فتاوى السيد السيستاني أولاً من sistani.org، والروايات من مكارم الأخلاق والكافي.
   ما لم يُتحقق من نصه موسوم بذلك صراحة. */
(function () {
  'use strict';
  const P = (self.Phase2 = self.Phase2 || {});
  const DATA = self.FalakData, H = DATA.HMONTHS, W = DATA.WEEKDAYS;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ------------------------------------------------------------ المصادر
  const SRC = {
    minhaj1: ['منهاج الصالحين ج1 (السفر)', 'https://www.sistani.org/arabic/book/23720/4691/'],
    muntakhaba: ['المسائل المنتخبة', 'https://www.sistani.org/arabic/book/13/591/'],
    khoei: ['صراط النجاة (الخوئي)', 'https://www.al-khoei.us/books/?id=8342'],
    baqia: ['بقية الله (الخامنئي)', 'https://baqiatollah.net/article.php?id=4091'],
    maaref: ['مكتبة المعارف (الخامنئي)', 'https://books.almaaref.org/view.php?id=619'],
    manasik: ['مناسك الحج (السيستاني)', 'https://www.sistani.org/arabic/book/14/'],
    ihram: ['المناسك: الإحرام', 'https://www.sistani.org/arabic/book/14/3531/'],
    arafat: ['المناسك: الوقوف بعرفات', 'https://www.sistani.org/arabic/book/14/3532/'],
    mashar: ['المناسك: المشعر', 'https://www.sistani.org/arabic/book/14/3533/'],
    aqaba: ['المناسك: رمي العقبة', 'https://www.sistani.org/arabic/book/14/3536/'],
    dhabh: ['المناسك: الذبح', 'https://www.sistani.org/arabic/book/14/3537/'],
    halq: ['المناسك: الحلق والتقصير', 'https://www.sistani.org/arabic/book/14/3539/'],
    tawaf: ['المناسك: طواف الحج', 'https://www.sistani.org/arabic/book/14/3540/'],
    nisa: ['المناسك: طواف النساء', 'https://www.sistani.org/arabic/book/14/8200/'],
    mabit: ['المناسك: المبيت بمنى', 'https://www.sistani.org/arabic/book/14/3541/'],
    jimar: ['المناسك: رمي الجمار', 'https://www.sistani.org/arabic/book/14/3542/'],
    mulhaq: ['ملحقات المناسك (الاستفتاءات)', 'https://www.sistani.org/arabic/book/14/8176/'],
    mulhaqMabit: ['ملحقات: المبيت ومنتصف الليل', 'https://www.sistani.org/arabic/book/14/8190/'],
    nikah: ['منهاج الصالحين ج3 (النكاح م3–5)', 'https://www.sistani.org/arabic/book/16/858/'],
    imamus: ['جواب مكتب I.M.A.M (أمريكا)', 'https://ask.imam-us.org/qa/12653/i-have-a-question-regarding-the-moon-in-scorpius-al-qamar-fi-al-aqrab-we-are'],
    kafi: ['الكافي ج5 ب141 بتقييم المجلسي', 'https://thaqalayn.com/chapter/5/3/141'],
    hoda: ['مركز الهدى: سند الوصية', 'https://alhodacenter.com/article/2426'],
    hadithnet: ['hadith.net (الفقيه والوسائل)', 'https://hadith.net/en/n3663-e34259-p2.html'],
    kafeelSleep: ['منتدى الكفيل (ناقل عن الوسائل)', 'https://forums.alkafeel.net/node/1046818'],
  };
  const mak = (p) => [`مكارم الأخلاق ص${p}`, `https://books.rafed.net/view/166/page/${p}`];
  const link = (s) => { const [t, u] = typeof s === 'string' ? SRC[s] : s; return `<a class="src" href="${u}" target="_blank" rel="noopener">${esc(t)}</a>`; };
  const srcs = (...a) => a.map(link).join('، ');

  // مستوى الحكم ← لون
  const LV = {
    'واجب': 'no', 'احتياط وجوبي': 'no', 'حرام': 'no', 'مكروه': 'mid', 'مكروه رجاءً': 'mid', 'احتياط استحبابي': 'info',
    'مستحب': 'ok', 'مستحب رجاءً': 'ok', 'جائز': 'info', 'إرشادي': 'dim', 'متعارض': 'dim', 'لم يُتحقق': 'dim',
  };
  const lv = (s) => `<span class="pill ${LV[s] || 'dim'}">${esc(s)}</span>`;
  const table = (head, rows, cls = '') => `<div class="scroll"><table class="p2 ${cls}"><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, i) => `<td data-h="${head[i] ? head[i].replace(/<[^>]+>/g, '') : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const card = (title, body, extra = '') => `<div class="card ${extra}"><h2 class="sec"><span>${title}</span></h2>${body}</div>`;
  const RAJA = '<p class="note">روايات الآداب أكثرها ضعيف السند أو مرسل. تُعرض «رجاءَ المطلوبية» ولا تُنسب جزماً إلى المعصوم، إلا ما نصّت عليه الفتوى.</p>';

  // ------------------------------------------------------------ أدوات زمنية
  const pad = (x) => String(x).padStart(2, '0');
  function tmz(M, date, tz) {
    if (!date) return '—';
    const t = new Date(date.getTime() + tz * 3600000); let h = t.getUTCHours(); const mi = t.getUTCMinutes();
    const suf = h < 12 ? 'ص' : 'م'; h = h % 12 || 12;
    return M.n(`${h}:${pad(mi)}`) + ' ' + suf;
  }
  const hn = (M, h) => `${M.n(h.d)} ${H[h.m - 1]}`;
  // الليلة تسبق نهارها: ليلة اليوم الهجري الذي يبدأ عند غروب g هي ليلة hijriOf(g+1)
  const nightName = (F, g) => 'ليلة ' + W[F.weekday(F.addDays(g, 1))];
  const dateVal = (o) => `${o.y}-${pad(o.m)}-${pad(o.d)}`;
  function eventsAround(M, F, g) {
    // كسوف أو خسوف يقع نهار g أو ليلته التالية (بتوقيت البلد)
    const from = new Date(Date.UTC(g.y, g.m - 1, g.d) - M.PL.tz * 3600000 - 86400000);
    let ev = [];
    try { ev = F.eclipses(M.PL, from, 3); } catch (e) { ev = []; }
    const day = F.dkey(g), next = F.dkey(F.addDays(g, 1));
    return ev.filter((e) => { const k = F.dkey(M.dOf(e.peak)); return k === day || k === next; });
  }
  function scorpioOn(F, M, g) {
    const t0 = new Date(Date.UTC(g.y, g.m - 1, g.d) - M.PL.tz * 3600000), t1 = new Date(t0.getTime() + 2 * 86400000);
    return F.aqrabPeriods(new Date(t0.getTime() - 3 * 86400000), t1).filter((p) => (!p.to || p.to > t0) && p.from < t1);
  }
  const isMahaq = (h) => h && h.month && h.month.length ? h.d >= h.month.length - 1 : h && h.d >= 28;

  // اختيارات أيام الشهر (مكارم ص474، منسوب إلى الصادق ع بلا سند) — [الوصف، نوع]
  const DAYS = [null,
    ['سعد: للقاء الأمراء وطلب الحوائج والتجارة والزرع والسفر', 'g'], ['للسفر وطلب الحوائج', 'g'], ['رديء لا يصلح لشيء', 'b'],
    ['صالح للتزويج، ويكره فيه السفر', 'm'], ['رديء نحس', 'b'], ['مبارك: للتزويج وطلب الحوائج', 'g'], ['مبارك مختار لكل ما يراد', 'g'],
    ['لكل حاجة سوى السفر', 'm'], ['مبارك، من سافر فيه رُزق مالاً', 'g'], ['لكل حاجة سوى الدخول على السلطان', 'm'],
    ['للبيع والشراء والحوائج والسفر، سوى الدخول على السلطان', 'm'], ['صالح مبارك', 'g'], ['نحس مستمر: اتقوا فيه جميع الأعمال', 'b'],
    ['جيد لكل عمل', 'g'], ['صالح لكل حاجة', 'g'], ['رديء مذموم لكل شيء', 'b'], ['مختار: للتزويج والبيع والزرع والبناء', 'g'],
    ['للسفر وطلب الحوائج ومخاصمة العدو', 'g'], ['مختار لكل عمل، والمولود فيه مبارك', 'g'], ['للحوائج والسفر والبناء والغرس والعرس', 'g'],
    ['نحس مستمر', 'b'], ['للبيع والشراء ولقاء السلطان والسفر والصدقة', 'g'], ['جيد خاصة للتزويج والتجارات', 'g'], ['نحس مشؤوم', 'b'],
    ['رديء مذموم', 'b'], ['لكل حاجة سوى التزويج والسفر، وتُستحب فيه الصدقة', 'm'], ['جيد مختار للحوائج', 'g'], ['ممزوج', 'm'],
    ['جيد لكل حاجة ما خلا الكاتب', 'g'],
  ];
  const DK = { g: 'ok', m: 'mid', b: 'no' }, DKL = { g: 'مختار', m: 'بقيد', b: 'يُتّقى' };
  const dayPill = (d) => (DAYS[d] ? `<span class="pill ${DK[DAYS[d][1]]}">${DKL[DAYS[d][1]]}</span>` : '<span class="pill dim">لم يرد</span>');

  // ============================================================ ١) مسافة السفر
  const KM_SIS = 44, KM_KH_OUT = 22.5;
  function gc(a, b) {
    const R = Math.PI / 180, h = Math.sin((b.lat - a.lat) * R / 2) ** 2 + Math.cos(a.lat * R) * Math.cos(b.lat * R) * Math.sin((b.lon - a.lon) * R / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.sqrt(h));
  }
  P.safar = {
    render(M, F, el) {
      const st = M.store.get('safar', { out: '', back: '', from: M.PL.key || 'qatif', to: 'najaf' });
      const opts = (sel) => Object.keys(F.PLACES).map((k) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${F.PLACES[k][0]}</option>`).join('');
      el.innerHTML = card('حاسبة القصر والإفطار', `
        <p class="lede">أدخل مسافة الذهاب، ومسافة الإياب إن كان السفر ملفّقاً. تُحسب من آخر البلد عرفاً إلى مقصدك داخل البلد الآخر لا إلى أوله.</p>
        <div class="row">
          <div class="field"><label class="label" for="sfOut">الذهاب (كم)</label><input id="sfOut" type="number" min="0" step="0.1" inputmode="decimal" value="${st.out}" style="width:9em"></div>
          <div class="field"><label class="label" for="sfBack">الإياب (كم)</label><input id="sfBack" type="number" min="0" step="0.1" inputmode="decimal" value="${st.back}" style="width:9em"></div>
        </div>
        <div id="sfOut2" style="margin-top:14px"></div>
        <details style="margin-top:14px"><summary class="label" style="cursor:pointer">تقدير المسافة المستقيمة بين مدينتين</summary>
          <div class="row" style="margin-top:10px">
            <div class="field"><label class="label" for="sfA">من</label><select id="sfA">${opts(st.from)}</select></div>
            <div class="field"><label class="label" for="sfB">إلى</label><select id="sfB">${opts(st.to)}</select></div>
            <button type="button" class="btn sm ghost" id="sfUse">اعتمدها للذهاب</button>
          </div><p id="sfGc" class="note"></p>
        </details>`) +
      card('الفتوى عند السيد السيستاني', table(['المسألة', 'الخلاصة', 'الحكم', 'المصدر'], [
        ['قدر المسافة', 'ثمانية فراسخ امتدادية ذهاباً، أو ملفّقة من الذهاب والإياب', lv('واجب'), srcs('minhaj1')],
        ['بالكيلومتر', 'نحو ٤٤ كم («أربعاً وأربعين كيلو متراً تقريباً»)', '—', srcs('minhaj1', 'muntakhaba')],
        ['النقص اليسير', '«إذا نقصت المسافة عن ذلك ولو يسيراً بقي على التمام»', lv('واجب'), srcs('minhaj1')],
        ['الملفّقة والرجوع ليومه', 'لا يلزم الرجوع في اليوم نفسه، ولو بات ليلة أو أكثر ما لم يقطع السفرَ قاطع', '—', srcs('minhaj1', 'muntakhaba')],
        ['تساوي الذهاب والإياب', 'لا يُشترط: خمسة فراسخ ذهاباً وثلاثة إياباً يُقصَّر فيها', '—', srcs('minhaj1')],
        ['مبدأ الحساب', 'من الموضع الذي يُعدّ بعد تجاوزه مسافراً عرفاً، وهو آخر البلد غالباً', '—', srcs('minhaj1')],
        ['حدّ الترخّص', 'أن يتوارى عن أنظار أهل بلده، ولا عبرة بخفاء الأذان. ولا يقصّر قبله، ولا يُعتبر في الإياب', lv('واجب'), srcs('minhaj1', 'muntakhaba')],
        ['الشك في بلوغ الحدّ', 'يبني على عدم البلوغ ويتمّ', lv('واجب'), srcs('muntakhaba')],
        ['كثير السفر', 'من مهنته السفر يتمّ. وغيره إذا سافر في كل شهر عشر مرات من عشرة أيام منه', lv('واجب'), srcs('minhaj1', 'muntakhaba')],
        ['الإقامة', 'قصد إقامة عشرة أيام، أو البقاء ثلاثين يوماً متردداً، يقطع حكم السفر', lv('واجب'), srcs('muntakhaba')],
      ])) +
      card('موارد الخلاف بين الفقهاء', table(['المورد', 'السيستاني', 'الآخرون', 'المصدر'], [
        ['تقدير المسافة', 'نحو ٤٤ كم', 'الخوئي: نحو ٤٤ كم. الخامنئي: تعارضت المصادر الثانوية بين ٤٥ و٤١ كم <span class="pill dim">لم يُتحقق من الأصل</span>', srcs('khoei', 'baqia', 'maaref')],
        ['تقسيم الملفّقة', 'يكفي أن يبلغ المجموع ثمانية فراسخ', 'الخامنئي: لا يقلّ الذهاب وحده عن أربعة فراسخ (نحو ٢٢٫٥ كم)', srcs('minhaj1', 'maaref')],
        ['حدّ الترخّص', 'التواري عن أنظار أهل البلد', 'الخامنئي: خفاء أذان البلد. الخوئي في جواب استفتاء: خفاء الأذان والجدران', srcs('minhaj1', 'maaref', 'khoei')],
        ['مبدأ الحساب', 'آخر البلد عرفاً', 'الخوئي: سور البلد، وإلا فمنتهى البيوت. الخامنئي: آخر البلد عرفاً، وإلا فآخر البيوت', srcs('khoei', 'maaref')],
        ['كثير السفر', 'عشرة أسفار في الشهر، أو أن يكون السفر مهنته', 'الخوئي: إن لم يكن السفر عملاً له أو مقدمة لعمله لم يتمّ', srcs('khoei')],
        ['الوطن الشرعي (ملك مع سكنى ستة أشهر)', 'لا يذكره في منهاجه <span class="pill dim">لم يُتحقق نص النفي</span>', 'الخوئي قال به، والتبريزي: «لم يثبت لنا الوطن الشرعي»', srcs('khoei')],
        ['الشيرازي، الوحيد، الحكيم', '—', '<span class="pill dim">لم يُتحقق</span> لم نجد نصاً مفتوحاً بأرقامهم', '—'],
      ]) + '<p class="note">قدّرت حسابات اجتهادية الفرسخ الشرعي بين ٤٣٫٨ و٤٦٫١ كم بحسب تقدير عرض الإصبع، وهي للتوضيح لا للفتوى. ويرجع كل مكلف إلى مرجعه.</p>');

      const calc = () => {
        const o = parseFloat($('#sfOut').value), b = parseFloat($('#sfBack').value) || 0;
        M.store.set('safar', { out: $('#sfOut').value, back: $('#sfBack').value, from: $('#sfA').value, to: $('#sfB').value });
        if (!(o > 0)) { $('#sfOut2').innerHTML = '<p class="lede">أدخل مسافة الذهاب.</p>'; return; }
        const tot = o + b, ext = o >= KM_SIS;
        const sis = ext ? ['ok', 'قصر', 'المسافة امتدادية تبلغ الحد'] : (tot >= KM_SIS ? ['ok', 'قصر', `الملفّقة تبلغ ${M.fx(tot, 1)} كم ولا يُشترط تساوي الطرفين`] : ['no', 'تمام', `المجموع ${M.fx(tot, 1)} كم دون ٤٤ كم`]);
        const khT = 45, khOk = o >= khT || (o >= KM_KH_OUT && tot >= khT);
        const kh = khOk ? ['ok', 'قصر', o >= khT ? 'امتدادية' : 'ملفّقة والذهاب لا يقل عن ٢٢٫٥ كم'] : ['no', 'تمام', o < KM_KH_OUT && tot >= khT ? 'الذهاب وحده دون ٢٢٫٥ كم' : 'دون الحد'];
        const near = Math.abs(tot - KM_SIS) < 2 || Math.abs(o - KM_SIS) < 2;
        $('#sfOut2').innerHTML = `<div class="p2res">
          <div class="p2box"><div class="label">على فتوى السيد السيستاني</div><div class="big"><span class="pill ${sis[0]}">${sis[1]}</span></div><div class="label">${sis[2]}</div></div>
          <div class="p2box"><div class="label">للمقارنة: السيد الخامنئي (بحد ٤٥ كم)</div><div class="big"><span class="pill ${kh[0]}">${kh[1]}</span></div><div class="label">${kh[2]}</div></div>
        </div>${near ? '<p class="note">المسافة قريبة من الحد: النقص اليسير يوجب التمام، والشك في بلوغها يُبنى فيه على العدم ما لم يثبت بعلم أو بيّنة أو اطمئنان.</p>' : ''}
        <p class="note">يقصّر المسافر والصائم يفطر بعد تجاوز حدّ الترخّص، بشرط قصد المسافة من أول السفر وألّا يكون كثير السفر أو سفره معصية.</p>`;
      };
      const $ = (s) => el.querySelector(s);
      const gcUpd = () => {
        const a = F.place($('#sfA').value), b = F.place($('#sfB').value), d = gc(a, b);
        $('#sfGc').textContent = `المسافة المستقيمة على سطح الأرض ${M.fx(d, 1)} كم. طريق السيارة أطول عادة بنحو ١٠–٣٠٪، والمعتبر الطريق الذي يُسلك فعلاً.`;
        return d;
      };
      ['#sfOut', '#sfBack'].forEach((s) => $(s).addEventListener('input', calc));
      ['#sfA', '#sfB'].forEach((s) => $(s).addEventListener('change', () => { gcUpd(); calc(); }));
      $('#sfUse').addEventListener('click', () => { $('#sfOut').value = gcUpd().toFixed(1); calc(); });
      gcUpd(); calc();
    },
  };

  // ============================================================ ٢) أعمال الحج
  P.hajj = {
    render(M, F, el) {
      const mk = F.place('mecca'), tz = mk.tz, T0 = M.TODAY;
      const months = F.buildMonths(mk, F.addDays(T0, -60), F.addDays(T0, 420), (DATA.announcements && DATA.announcements.overrides) || {});
      // ذو الحجة الحالي إن لم ينقضِ، وإلا القادم
      const dh = months.find((m) => m.hm === 12 && F.dayDiff(T0, F.addDays(m.start, 13)) >= 0);
      if (!dh) { el.innerHTML = card('أعمال الحج', '<p class="lede">تعذّر حساب ذي الحجة القادم.</p>'); return; }
      const uq = F.ummAlQuraStart(dh.newMoon), diff = F.dayDiff(uq, dh.start);
      const day = (k) => F.addDays(dh.start, k - 1);
      const T = (k) => { const g = day(k); return F.dayTimes(mk, g.y, g.m, g.d, {}); };
      const t = {}; for (let k = 7; k <= 13; k++) t[k] = T(k);
      const tm = (d) => tmz(M, d, tz), gd = (k) => M.gdate(day(k));
      const midN = (k) => t[k].midnight; // منتصف ليلة k+1: من غروب k إلى فجر k+1
      const rows = [
        [8, 'التروية', 'إحرام الحج من مكة', `أفضله عند <b>الزوال ${tm(t[8].zawal)}</b>، ويجوز قبله بأيام`, 'ألّا يؤخّره حتى يفوته الوقوف الاختياري', lv('واجب'), srcs('ihram')],
        [9, 'عرفة', 'الوقوف بعرفات', `<b>الزوال ${tm(t[9].zawal)}</b> على الأحوط، ويجوز تأخيره بقدر الغسل والظهرين جمعاً`, `<b>الغروب ${tm(t[9].sunset)}</b>، وإن احتُمل استتار الشمس بالجبال فإلى ذهاب الحمرة ${tm(t[9].maghrib)}`, lv('واجب') + ' والركن مسمّى الوقوف', srcs('arafat', 'mulhaq')],
        [9, 'عرفة', 'الإفاضة قبل الغروب عمداً', '—', '—', lv('حرام') + ' والحج صحيح، وعليه بدنة إن لم يرجع', srcs('arafat')],
        ['ليلة 10', '', 'الوقوف الاضطراري بعرفة (للمعذور)', 'برهة من ليلة العيد', `قبل <b>الفجر ${tm(t[10].fajr)}</b>`, lv('واجب'), srcs('arafat')],
        ['ليلة 10', '', 'المبيت بالمزدلفة', `بعد الإفاضة من عرفات (غروب ${tm(t[9].sunset)})`, 'حتى يصبح بها', lv('واجب'), srcs('mashar')],
        ['ليلة 10', '', 'إفاضة النساء والمعذورين إلى منى', 'ليلاً', `قبل الفجر ${tm(t[10].fajr)}`, lv('جائز'), srcs('mashar')],
        [10, 'النحر', 'الوقوف بالمشعر الحرام', `<b>الفجر ${tm(t[10].fajr)}</b>`, `<b>الشروق ${tm(t[10].sunrise)}</b> (بين الطلوعين)`, lv('واجب') + ' والركن مسمّى الوقوف', srcs('mashar')],
        [10, 'النحر', 'لا يتجاوز وادي محسّر إلى منى', '—', `قبل الشروق ${tm(t[10].sunrise)}`, lv('حرام'), srcs('mashar')],
        [10, 'النحر', 'الوقوف الاضطراري بالمشعر', `الشروق ${tm(t[10].sunrise)}`, `الزوال ${tm(t[10].zawal)}`, lv('واجب'), srcs('mashar')],
        [10, 'النحر', 'رمي جمرة العقبة', `<b>الشروق ${tm(t[10].sunrise)}</b>`, `<b>الغروب ${tm(t[10].sunset)}</b>، وللنساء والمرخّص لهم ليلة العيد`, lv('واجب'), srcs('aqaba')],
        [10, 'النحر', 'الذبح أو النحر بمنى', 'بعد الرمي على الأحوط، نهار العيد، ولا يذبح ليلاً إلا الخائف', `الأفضل يوم العيد، ويجوز تأخيره إلى غروب ١٣ (${tm(t[13].sunset)})`, lv('واجب'), srcs('dhabh')],
        [10, 'النحر', 'الحلق أو التقصير بمنى', 'نهار العيد بعد الرمي (والذبح على الأولى)', `لا يؤخَّر عن <b>غروب العيد ${tm(t[10].sunset)}</b>`, lv('واجب') + ' والحلق للصرورة احتياطاً، والتقصير للمرأة', srcs('halq')],
        [10, 'النحر', 'طواف الحج وصلاته والسعي', 'بعد الحلق أو التقصير', 'يستحب يوم النحر وألّا يؤخَّر عن ١١، ويجوز إلى آخر ذي الحجة على الأقوى', lv('واجب'), srcs('tawaf')],
        ['بعد السعي', '', 'طواف النساء وصلاته', 'بعد السعي، ولا يُقدَّم عليه', 'لم يرد حدّ صريح فيما فُتح <span class="pill dim">لم يُتحقق</span>', lv('واجب'), srcs('nisa')],
        ['ليلة 11', '', 'المبيت بمنى: النصف الأول', `<b>الغروب ${tm(t[10].sunset)}</b>`, `<b>منتصف الليل ${tm(midN(10))}</b>`, lv('واجب') + ' وهو الأحوط', srcs('mabit', 'mulhaqMabit')],
        ['ليلة 11', '', 'أو النصف الثاني', `قبيل المنتصف ${tm(midN(10))}`, `<b>الفجر ${tm(t[11].fajr)}</b>`, lv('واجب'), srcs('mabit')],
        [11, '', 'رمي الجمار الثلاث بالترتيب', `الشروق ${tm(t[11].sunrise)}`, `<b>الغروب ${tm(t[11].sunset)}</b>، وللمعذور في ليلته`, lv('واجب'), srcs('jimar')],
        ['ليلة 12', '', 'المبيت بمنى (أحد النصفين)', `الغروب ${tm(t[11].sunset)} → منتصف الليل ${tm(midN(11))}`, `أو المنتصف → الفجر ${tm(t[12].fajr)}`, lv('واجب'), srcs('mabit')],
        [12, '', 'رمي الجمار الثلاث (وقضاء رمي ١١ إن فات)', `الشروق ${tm(t[12].sunrise)}`, `الغروب ${tm(t[12].sunset)}`, lv('واجب'), srcs('jimar')],
        [12, '', 'النفر الأول', `بعد <b>الزوال ${tm(t[12].zawal)}</b>`, `قبل <b>الغروب ${tm(t[12].sunset)}</b>، فإن غربت عليه بمنى وجب مبيت ليلة ١٣`, lv('جائز') + ' لمن اتقى الصيد والنساء', srcs('mabit')],
        [13, '', 'رمي يوم ١٣ لمن بات ليلته', `الشروق ${tm(t[13].sunrise)}`, `الغروب ${tm(t[13].sunset)}`, lv('واجب') + ' على الأظهر', srcs('jimar')],
      ];
      const head = `<p class="lede">ذو الحجة ${M.n(dh.hy)}هـ بحساب الهلال الجعفري في أفق مكة: أوله <b>${M.gdate(dh.start)}</b>${dh.source === 'إعلان' ? ' (بإعلان)' : ''}. وبتقويم أم القرى: <b>${M.gdate(uq)}</b>${diff ? ` <span class="pill mid">الفرق ${M.n(Math.abs(diff))} يوم</span>` : ' <span class="pill ok">متوافقان</span>'}.</p>
        <dl class="kv"><dt>يوم التروية</dt><dd>${gd(8)}</dd><dt>يوم عرفة</dt><dd>${gd(9)}</dd><dt>يوم النحر</dt><dd>${gd(10)}</dd><dt>أيام التشريق</dt><dd>${gd(11)} إلى ${gd(13)}</dd></dl>
        <p class="note">الأوقات بتوقيت مكة (UTC+3)، ومنتصف الليل محسوب من غروب الشمس إلى طلوع الفجر كما في ملحقات المناسك. الأوقات الحسابية تقريبية بدقائق، فيُحتاط في الحدود.</p>`;
      el.innerHTML = card('أزمان أعمال حج التمتع', head) +
        card('الجدول الزمني (السيد السيستاني)', table(['اليوم', 'العمل', 'يبدأ', 'ينتهي', 'الحكم', 'المصدر'], rows.map((r) => [
          typeof r[0] === 'number' ? `<b>${M.n(r[0])}</b>${r[1] ? '<br><span class="label">' + r[1] + '</span>' : ''}<br><span class="label">${M.gshort(day(r[0]))}</span>` : `<b>${M.n(r[0])}</b>`, r[2], r[3], r[4], r[5], r[6]])), 'wide') +
        card('إذا اختلف أول ذي الحجة عن الإعلان الرسمي', table(['البند', 'موقف السيد السيستاني', 'المستوى'], [
          ['الفحص', 'على الحاج أن يتحرّى ثبوت الهلال، لأن الأعمال مؤقتة بأيام معيّنة', lv('واجب')],
          ['متابعة حكم قاضي الديار المقدسة', 'ذكر قولي المتابعة (مع احتمال الموافقة، أو حتى مع العلم بالمخالفة تقيةً) ووصفهما بأنهما «في غاية الإشكال»', '—'],
          ['الإجزاء', '«نحن لا نفتي بالإجزاء بالحجّ معهم إذا كان مخالفاً لما تقتضيه الموازين الشرعية»، ولو مع القطع بالمخالفة. فيرجع المقلِّد إلى غيره الأعلم فالأعلم، ويستحب الوقوف في اليوم الصحيح إن أمكن', lv('احتياط وجوبي')],
          ['من عدل عن الخوئي', 'لا يبقى على رأي الخوئي في هذه المسألة (المفهوم أن الخوئي كان يرى الإجزاء)', '—'],
          ['الخامنئي وغيره', 'المشهور أنهم يرون الإجزاء بمتابعة الحكم الرسمي', lv('لم يُتحقق')],
        ]) + `<p class="note">المصادر: ${srcs('arafat', 'mulhaq', 'manasik')}</p>`);
    },
  };

  // ============================================================ ٣) أوقات العقد والزفاف
  function dayPicker(M, key, label) {
    const v = M.store.get(key, '') || dateVal(M.TODAY);
    return `<div class="row"><div class="field"><label class="label" for="${key}D">${label}</label><input type="date" id="${key}D" value="${v}"></div>
      <button type="button" class="btn sm ghost" data-prev>اليوم السابق</button><button type="button" class="btn sm ghost" data-next>التالي</button><button type="button" class="btn sm" data-today>اليوم</button></div>`;
  }
  function wirePicker(M, F, el, key, calc) {
    const inp = el.querySelector('#' + key + 'D');
    const set = (o) => { inp.value = dateVal(o); M.store.set(key, inp.value); calc(o); };
    inp.addEventListener('change', () => inp.value && set(F.parseKey(inp.value)));
    el.querySelector('[data-prev]').addEventListener('click', () => set(F.addDays(F.parseKey(inp.value), -1)));
    el.querySelector('[data-next]').addEventListener('click', () => set(F.addDays(F.parseKey(inp.value), 1)));
    el.querySelector('[data-today]').addEventListener('click', () => set(M.TODAY));
    calc(F.parseKey(inp.value));
  }
  const fmtSpan = (M, p) => `${M.gshort(M.dOf(p.from))} ${M.tm(p.from)} ← ${p.to ? M.gshort(M.dOf(p.to)) + ' ' + M.tm(p.to) : '…'}`;

  P.aqd = {
    render(M, F, el) {
      el.innerHTML = card('افحص يوماً للعقد', dayPicker(M, 'aqd', 'اليوم') + '<div id="aqOut" style="margin-top:14px"></div>') +
        card('القمر في العقرب خلال الأيام الستين القادمة', '<div id="aqList"></div><p class="note">العقرب هنا البرج الاستوائي (٢١٠°–٢٤٠° من الطول السماوي)، ومدته نحو يومين ونصف كل شهر. لم يحدد مكتب السيد المذهب الحسابي (استوائي أو نجمي) <span class="pill dim">لم يُتحقق</span>.</p>') +
        card('المستحب والمكروه في العقد والزفاف', table(['الوقت', 'الحكم', 'الدليل', 'المصدر'], [
          ['العقد والقمر في برج العقرب', lv('مكروه') + ' فتوى', 'عن الصادق ع: «من سافر أو تزوج والقمر في العقرب لم يرَ الحسنى»', srcs('nikah', mak(242))],
          ['العقد في محاق الشهر (آخره حين لا يُرى القمر)', lv('مكروه') + ' فتوى', '«كان أمير المؤمنين ع يكره أن يسافر الرجل أو يزوّج والقمر في المحاق»', srcs('nikah', mak(242))],
          ['الزفاف ليلاً', lv('مستحب') + ' فتوى', '«زفّوا عرائسكم ليلاً وأطعموا ضحى»', srcs('nikah', mak(208))],
          ['الوليمة ضحىً', lv('مستحب رجاءً'), '«وأطعموا ضحى»', srcs(mak(208))],
          ['الزفاف والقمر في العقرب', '<span class="pill ok">ليس مكروهاً</span>', 'الكراهة عند السيد خاصة بإيقاع العقد', srcs('imamus')],
          ['أيام الشهر للتزويج: ٤، ٦، ١٧، ٢٠، ٢٣', lv('إرشادي'), 'رواية «اختيارات الأيام» بلا سند', srcs(mak(474))],
          ['يُتّقى: ٢٦ للتزويج، و٣، ٥، ١٣، ١٦، ٢١، ٢٤، ٢٥ لكل عمل', lv('إرشادي'), 'الرواية نفسها', srcs(mak(474))],
          ['يوم الأربعاء للعقد', lv('لم يُتحقق'), 'لم نجد نصاً خاصاً بالعقد يوم الأربعاء، وورد ذمّه عموماً', srcs(mak(241))],
        ]) + RAJA);
      const calc = (g) => {
        const h = F.hijriOf(g, M.MONTHS), sc = scorpioOn(F, M, g), mah = isMahaq(h);
        const d = h ? h.d : null, wed = F.weekday(g) === 3;
        const flags = [];
        if (sc.length) flags.push(`<li><span class="pill mid">مكروه</span> القمر في العقرب: ${sc.map((p) => fmtSpan(M, p)).join('، ')}. يُجتنب العقد في هذه المدة فقط.</li>`);
        if (mah) flags.push('<li><span class="pill mid">مكروه</span> اليوم من محاق الشهر، فالقمر لا يُرى.</li>');
        if (d && [4, 6, 17, 20, 23].includes(d)) flags.push(`<li><span class="pill ok">إرشادي</span> اليوم ${M.n(d)} من الأيام المذكورة للتزويج في رواية الاختيارات.</li>`);
        if (d && [26, 3, 5, 13, 16, 21, 24, 25].includes(d)) flags.push(`<li><span class="pill dim">إرشادي</span> اليوم ${M.n(d)} مما يُتّقى في رواية الاختيارات.</li>`);
        if (wed) flags.push('<li><span class="pill dim">تنبيه</span> يوم الأربعاء: ورد ذمّه عموماً، ولا نص خاصاً بالعقد فيما تُحقق منه.</li>');
        const ok = !sc.length && !mah;
        el.querySelector('#aqOut').innerHTML = `<dl class="kv"><dt>اليوم</dt><dd><b>${M.gdate(g)}</b></dd><dt>هجرياً</dt><dd>${h ? M.hname(h) : '—'}</dd>
          <dt>اختيار اليوم</dt><dd>${d ? dayPill(d) + ' ' + DAYS[d][0] : '—'}</dd>
          <dt>الخلاصة</dt><dd>${ok ? '<span class="pill ok">لا كراهة فقهية في العقد</span>' : '<span class="pill mid">فيه كراهة في بعض الوقت</span>'}</dd></dl>
          ${flags.length ? `<ul class="p2flags">${flags.join('')}</ul>` : ''}`;
      };
      wirePicker(M, F, el, 'aqd', calc);
      const now = new Date(), list = F.aqrabPeriods(now, new Date(now.getTime() + 60 * 86400000));
      el.querySelector('#aqList').innerHTML = list.length ? `<ul class="p2flags">${list.map((p) => `<li>${fmtSpan(M, p)}</li>`).join('')}</ul>` : '<p class="lede">لا شيء.</p>';
    },
  };

  // ============================================================ ٤) أوقات المقاربة
  P.muqaraba = {
    render(M, F, el) {
      el.innerHTML = card('افحص ليلة', dayPicker(M, 'mq', 'مساء يوم') + '<div id="mqOut" style="margin-top:14px"></div>') +
        card('المكروه', `<p class="lede">نصّ السيد السيستاني في منهاج الصالحين (ج3، النكاح م5) على كراهة: ليلة الخسوف، ويوم الكسوف، وعند الزوال إلا يوم الخميس، وعند الغروب قبل ذهاب الشفق، وفي المحاق، وبعد الفجر حتى تطلع الشمس، وفي أول ليلة من الشهر إلا شهر رمضان، وفي ليلة النصف من الشهر وآخره، وعند الزلزلة والريح الصفراء والسوداء.</p>` +
          table(['الوقت', 'الحكم', 'قوة السند', 'المصدر'], [
            ['ليلة الخسوف ويوم الكسوف', lv('مكروه') + ' فتوى', 'حسن (المجلسي)', srcs('nikah', 'kafi')],
            ['من الفجر إلى طلوع الشمس', lv('مكروه') + ' فتوى', 'حسن', srcs('nikah', 'kafi', mak(212))],
            ['من الغروب إلى ذهاب الشفق', lv('مكروه') + ' فتوى', 'حسن', srcs('nikah', 'kafi')],
            ['عند الزوال إلا يوم الخميس', lv('مكروه') + ' فتوى', 'ضعيف (الوصية)', srcs('nikah', mak(209))],
            ['يوم الريح السوداء أو الصفراء وليلته، ويوم الزلزلة وليلتها', lv('مكروه') + ' فتوى', 'حسن', srcs('nikah', 'kafi')],
            ['المحاق', lv('مكروه') + ' فتوى', 'ضعيف', srcs('nikah', 'kafi')],
            ['أول ليلة من الشهر إلا رمضان، وليلة النصف، وآخر الشهر', lv('مكروه') + ' فتوى', 'مرسل/ضعيف', srcs('nikah', 'kafi', mak(210))],
            ['ليلتا العيدين، وبين الأذان والإقامة، وأول ساعة من الليل، وليلة الخروج إلى السفر', lv('مكروه رجاءً'), 'ضعيف (الوصية)', srcs(mak(210), mak(211))],
            ['ليلة القدوم من السفر حتى يصبح', lv('مكروه رجاءً'), 'ضعيف على المشهور', srcs('kafi')],
            ['في السفر مع فقد الماء للغسل', lv('مكروه رجاءً'), '<span class="pill dim">لم يُتحقق</span>', '—'],
          ])) +
        card('المستحب (من وصية النبي ص لعلي ع، وتُعرض رجاءً)', table(['الوقت', 'الحكم', 'المصدر'], [
          ['ليلة الاثنين (بعد غروب الأحد)', lv('مستحب رجاءً'), srcs(mak(211))],
          ['ليلة الثلاثاء (بعد غروب الاثنين)', lv('مستحب رجاءً'), srcs(mak(211))],
          ['ليلة الخميس (بعد غروب الأربعاء)', lv('مستحب رجاءً'), srcs(mak(211))],
          ['يوم الخميس عند الزوال، وهو مستثنى من كراهة الزوال في الفتوى', lv('مستحب رجاءً'), srcs(mak(211), 'nikah')],
          ['ليلة الجمعة، وخاصة بعد العشاء الآخرة', lv('مستحب رجاءً'), srcs(mak(211))],
          ['يوم الجمعة بعد العصر', lv('مستحب رجاءً'), srcs(mak(211))],
          ['أول ليلة من شهر رمضان', lv('مستحب') + ' ومستثناة من الكراهة في الفتوى', srcs('nikah')],
        ]) + `<p class="note">الوصية سندها ضعيف، وقال الشهيد الثاني: «تفوح منها رائحة الوضع» (${link('hoda')}). فما فيها غير منصوص في الفتوى يُعمل به رجاءً.</p>`);

      const calc = (g) => {
        const g1 = F.addDays(g, 1), h = F.hijriOf(g1, M.MONTHS), wd1 = F.weekday(g1); // الليلة تتبع اليوم الهجري التالي
        const t = F.dayTimes(M.PL, g.y, g.m, g.d, {}), t1 = F.dayTimes(M.PL, g1.y, g1.m, g1.d, {});
        const ev = eventsAround(M, F, g), lunar = ev.find((e) => e.type === 'lunar' && e.kind !== 'penumbral' && e.seen), solar = ev.find((e) => e.type === 'solar' && e.seen && F.dkey(M.dOf(e.peak)) === F.dkey(g1));
        const bad = [], good = [];
        if (lunar) bad.push(`ليلة خسوف: ذروته ${M.tm(lunar.peak)} (فتوى)`);
        if (solar) bad.push(`نهار الغد يوم كسوف ${M.tm(solar.peak)} (فتوى)`);
        if (h) {
          const len = h.month.length || 30;
          if (h.d === 1 && h.m !== 9) bad.push('أول ليلة من الشهر (فتوى)');
          if (h.d === 1 && h.m === 9) good.push('أول ليلة من شهر رمضان: مستثناة من الكراهة ومستحبة');
          if (h.d === 15) bad.push('ليلة النصف من الشهر (فتوى)' + (h.m === 8 ? '، وهي ليلة النصف من شعبان' : ''));
          if (h.d >= len - 1) bad.push('آخر الشهر والمحاق (فتوى)');
          else if (h.d >= 28) bad.push('قرب المحاق (فتوى في المحاق)');
          if (h.m === 10 && h.d === 1) bad.push('ليلة عيد الفطر (رجاءً)');
          if (h.m === 12 && h.d === 10) bad.push('ليلة عيد الأضحى (رجاءً)');
        }
        if ([1, 2, 4, 5].includes(wd1)) good.push(`${nightName(F, g)} من الليالي المذكورة في الوصية (رجاءً)`);
        if (wd1 === 3) good.push('يوم الخميس عند الزوال مستثنى من كراهة الزوال، ومذكور في الوصية');
        const win = `<table class="p2 mini"><tbody>
          <tr><td>من الغروب إلى ذهاب الشفق</td><td>${M.tm(t.sunset)} ← ${M.tm(t.shafaq)}</td><td><span class="pill mid">مكروه</span></td></tr>
          <tr><td>من الفجر إلى طلوع الشمس</td><td>${M.tm(t1.fajr)} ← ${M.tm(t1.sunrise)}</td><td><span class="pill mid">مكروه</span></td></tr>
          <tr><td>عند زوال الغد${wd1 === 4 ? ' (الخميس مستثنى)' : ''}</td><td>${M.tm(t1.zawal)}</td><td>${wd1 === 4 ? '<span class="pill ok">مستثنى</span>' : '<span class="pill mid">مكروه</span>'}</td></tr>
          <tr><td>منتصف الليل</td><td>${M.tm(t.midnight)}</td><td><span class="pill dim">للعلم</span></td></tr></tbody></table>`;
        el.querySelector('#mqOut').innerHTML = `<dl class="kv"><dt>الليلة</dt><dd><b>${nightName(F, g)}</b> (مساء ${M.gdate(g)})</dd>
          <dt>هجرياً</dt><dd>${h ? 'ليلة ' + M.hname(h) : '—'}</dd>
          <dt>الخلاصة</dt><dd>${bad.length ? '<span class="pill mid">فيها كراهة</span>' : (good.length ? '<span class="pill ok">لا كراهة، وفيها استحباب رجاءً</span>' : '<span class="pill info">لا كراهة خاصة</span>')}</dd></dl>
          ${bad.length ? `<ul class="p2flags">${bad.map((x) => `<li><span class="pill mid">مكروه</span> ${x}</li>`).join('')}</ul>` : ''}
          ${good.length ? `<ul class="p2flags">${good.map((x) => `<li><span class="pill ok">مستحب</span> ${x}</li>`).join('')}</ul>` : ''}
          <h3 style="margin-top:14px">ساعات الليلة وغدها</h3><div class="scroll">${win}</div>
          <p class="note">الزلزلة والريح الصفراء والسوداء لا تُحسب فلكياً، فتُراعى عند وقوعها. والمحاق محسوب بآخر يومين من الشهر المتوقع.</p>`;
      };
      wirePicker(M, F, el, 'mq', calc);
    },
  };

  // ============================================================ ٥) الآداب والسنن
  const ADAB = {
    nails: ['الأظفار والشارب', 'مكارم الأخلاق: الباب ٤، ف١–٢', [
      ['تقليم الأظفار في أي يوم إذا طالت', 'جائز', '«خذها إن شئت في الجمعة وإن شئت في سائر الأيام»', 64],
      ['يوم الجمعة', 'مستحب رجاءً', '«من قلّم أظفاره يوم الجمعة أخرج الله من أنامله داء وأدخل فيها شفاء»', 64],
      ['من جمعة إلى جمعة (الأظفار والشارب)', 'مستحب رجاءً', '«… أمان من الجذام»، و«خذ من شاربك وأظفارك في كل جمعة»', 65],
      ['يوم الخميس', 'مستحب رجاءً', '«خذ من أظفارك في كل خميس» (لوجع العين)', 65],
      ['الخميس مع ترك واحد للجمعة', 'مستحب رجاءً', '«نفى الله عنه الفقر»', 66],
      ['يوم السبت ويوم الخميس', 'مستحب رجاءً', 'أمان من وجع الضرس والعين', 65],
      ['يوم الأربعاء بادئاً بخنصر اليسرى', 'مستحب رجاءً', 'عن طب الأئمة: أمان من الرمد', 65],
      ['ترتيب التقليم', 'مستحب رجاءً', 'يبدأ بخنصر اليسرى ويختم بخنصر اليمنى', 66],
      ['يوم مكروه للتقليم', 'لم يُتحقق', 'لم نجد في المكارم يوماً مكروهاً للتقليم، وما يشيع من ذلك لا أصل له فيما فُتح', null],
    ], { 5: 'يوم الجمعة: يُستحب تقليم الأظفار والأخذ من الشارب.', 4: 'يوم الخميس: يُستحب التقليم، ويُترك واحد للجمعة.', 6: 'يوم السبت: ورد التقليم فيه أماناً من وجع الضرس والعين.', 3: 'يوم الأربعاء: ورد التقليم بادئاً بخنصر اليسرى.' }],
    cupping: ['الحجامة', 'مكارم الأخلاق: الباب ٤، ف٤', [
      ['يوم السبت', 'مستحب رجاءً', '«من كان منكم محتجماً فليحتجم يوم السبت»', 74],
      ['يوم الأحد ومساؤه', 'مستحب رجاءً', '«فيها شفاء من كل داء»', 74],
      ['الاثنين بعد العصر', 'مستحب رجاءً', '«كان النبي يحتجم يوم الإثنين بعد العصر»', 74],
      ['الثلاثاء إذا وافق ١٧ أو ١٩ أو ٢١ من الشهر', 'مستحب رجاءً', '«دواء لداء سنة»', 74],
      ['أيام ١٥ و١٧ و٢١ من الشهر', 'مستحب رجاءً', '«لا يتبيّغ بكم الدم فيقتلكم»', 74],
      ['آخر خميس من الشهر، آخر النهار', 'مستحب رجاءً', '«سلّ الداء سلاً»', 75],
      ['الخميس قبل الزوال', 'مستحب رجاءً', '«فإذا زالت الشمس تفرّق» الدم', 75],
      ['يوم الأربعاء', 'مكروه رجاءً', '«نزل عليّ جبريل بالنهي عن الحجامة يوم الأربعاء»', 75],
      ['الأربعاء والشمس في العقرب', 'مكروه رجاءً', 'النهي عن الحجامة حينها', 75],
      ['الجمعة عند الزوال', 'مكروه رجاءً', 'النهي عن الحجامة مع الزوال يوم الجمعة', 75],
      ['٧ حزيران (يونيو)، فإن فات فـ١٤', 'مستحب رجاءً', '«لا تدع الحجامة في سبع من حزيران»', 75],
    ], { 6: 'يوم السبت: ورد استحباب الحجامة.', 0: 'يوم الأحد: ورد أن الحجامة فيه شفاء.', 3: 'يوم الأربعاء: تُكره الحجامة.' }],
    travel: ['السفر', 'مكارم الأخلاق: الباب ٩، ف١', [
      ['يوم السبت', 'مستحب رجاءً', '«من أراد السفر فليسافر في يوم السبت»', 240],
      ['يوم الخميس', 'مستحب رجاءً', 'سفر النبي ص يوم الخميس', 240],
      ['يوم الثلاثاء', 'مستحب رجاءً', '«لا تخرجوا يوم الاثنين واخرجوا يوم الثلاثاء»', 242],
      ['ليلة الجمعة', 'جائز', '«لا بأس للخروج للسفر ليلة الجمعة»', 240],
      ['يوم الجمعة قبل الصلاة', 'مكروه رجاءً', '«الصلاة يوم الجمعة والانتشار يوم السبت»، وتعارضها رواية لأنس', 241],
      ['يوم الاثنين', 'متعارض', 'نهيٌ في روايات، و«يوم سفر وطلب» في عيون أخبار الرضا', 241],
      ['يوم الأربعاء', 'مكروه رجاءً', 'وتقابلها رواية تجيزه «خلافاً على أهل الطيرة»', 241],
      ['أيام ٣ و٤ و٢١ و٢٥ من الشهر', 'مكروه رجاءً', '«اتقِ الخروج إلى السفر في اليوم الثالث من الشهر…»', 241],
      ['القمر في العقرب', 'مكروه رجاءً', '«من سافر أو تزوج والقمر في العقرب لم يرَ الحسنى»', 242],
      ['القمر في المحاق', 'مكروه رجاءً', '«يكره أن يسافر الرجل أو يزوّج والقمر في المحاق»', 242],
      ['السير ليلاً', 'مستحب رجاءً', '«عليكم بالسير بالليل فإن الأرض تطوى بالليل»', 241],
      ['دفع الكراهة', 'مستحب', 'افتتاح السفر بالصدقة وقراءة آية الكرسي', 242],
      ['«آخر أربعاء من الشهر»', 'لم يُتحقق', 'لم يرد بهذا القيد في صفحات المكارم المفتوحة', null],
    ], { 6: 'يوم السبت: ورد استحباب السفر فيه.', 4: 'يوم الخميس: سافر فيه النبي ص.', 2: 'يوم الثلاثاء: ورد الأمر بالخروج فيه.', 3: 'يوم الأربعاء: يُكره السفر رجاءً، وتُدفع الكراهة بالصدقة.', 1: 'يوم الاثنين: الروايات متعارضة.' }],
    sleep: ['النوم', 'الوسائل ج6، بنقل منتدى الكفيل', [
      ['بين الطلوعين (الفجر إلى الشروق)', 'مكروه رجاءً', '«إن الرزق يُبسط تلك الساعة»', 'kafeelSleep'],
      ['بعد العصر', 'مكروه رجاءً', '«النوم بعد العصر حُمق»', 'kafeelSleep'],
      ['بين العشاءين', 'مكروه رجاءً', '«النوم بين العشاءين يحرم الرزق»', 'kafeelSleep'],
      ['القيلولة قبيل الظهر', 'مستحب رجاءً', '«والقائلة نعمة»', 'kafeelSleep'],
    ], {}],
    home: ['البيت والثياب', 'الفقيه والوسائل والمكارم', [
      ['إخراج القمامة نهاراً وألّا تبيت ليلاً', 'مستحب رجاءً', '«لا تُبيّتوا القمامة في بيوتكم وأخرجوها نهاراً فإنها مقعد الشيطان»', 'hadithnet'],
      ['التراب خلف الباب', 'مكروه رجاءً', '«لا تؤووا التراب خلف الباب فإنه مأوى الشيطان»', 'hadithnet'],
      ['نسج العنكبوت في البيت', 'مكروه رجاءً', 'أمر علي ع بتنظيف البيوت منه', 'hadithnet'],
      ['غسل الثياب', 'مستحب', '«غسل الثياب يذهب الهمّ والحزن وهو طهور للصلاة»', 103],
      ['الانتقال إلى سكن جديد', 'لم يُتحقق', 'لا وقت محدد في المكارم، وفيه رواية تحوّل أبي الحسن ع إلى دار اشتراها', 125],
      ['كنس البيت ليلاً', 'لم يُتحقق', 'لم نجد نصاً في الكنس ليلاً بعينه', null],
      ['غسل الآنية', 'لم يُتحقق', 'لا نص زمني فيما فُتح', null],
      ['لبس الجديد وقطع الثوب', 'لم يُتحقق', 'لم يرد وقت محدد فيما فُتح', null],
      ['إطفاء السراج عند النوم', 'لم يُتحقق', 'الرواية مشهورة ولم يُفتح موضعها', null],
      ['آداب الخلاء والحلق', 'لم يُتحقق', 'ليست زمنية غالباً، ولم تُفتح نصوصها في هذا البحث', null],
    ], {}],
  };
  const srcCell = (s) => (s == null ? '—' : typeof s === 'number' ? link(mak(s)) : link(s));

  P.adab = {
    render(M, F, el) {
      const wd = F.weekday(M.TODAY), h = F.hijriOf(M.TODAY, M.MONTHS), T = M.TIMES, now = new Date();
      const tips = [];
      Object.values(ADAB).forEach((a) => { if (a[3][wd]) tips.push(a[3][wd]); });
      if (h && [15, 17, 21].includes(h.d)) tips.push(`اليوم ${M.n(h.d)} من الشهر: من أيام الحجامة المذكورة.`);
      if (h && [3, 4, 21, 25].includes(h.d)) tips.push(`اليوم ${M.n(h.d)} من الشهر: يُتّقى فيه الخروج إلى السفر رجاءً.`);
      if (now < T.sunset) tips.push('أخرِج قمامة البيت نهاراً قبل الغروب، ولا تُبيّتها.');
      if (now > T.fajr && now < T.sunrise) tips.push('الآن بين الطلوعين: يُكره النوم، فإن الرزق يُبسط في هذه الساعة.');
      if (now > T.sunset && now < T.shafaq) tips.push('الآن بين العشاءين: يُكره النوم.');
      const tabs = Object.entries(ADAB);
      el.innerHTML = card('آداب اليوم', `<dl class="kv"><dt>اليوم</dt><dd><b>${M.gdate(M.TODAY)}</b>${h ? '، ' + M.hname(h) : ''}</dd>
          <dt>اختيار اليوم</dt><dd>${h && DAYS[h.d] ? dayPill(h.d) + ' ' + DAYS[h.d][0] : '<span class="pill dim">لم يرد في الرواية</span>'}</dd></dl>
          ${tips.length ? `<ul class="p2flags">${tips.map((x) => `<li>${x}</li>`).join('')}</ul>` : ''}`) +
        `<div class="card"><h2 class="sec"><span>الآداب المرتبطة بالأوقات</span></h2>
          <div class="seg" id="adTabs">${tabs.map(([k, a], i) => `<button type="button" data-k="${k}" aria-pressed="${i === 0}">${a[0]}</button>`).join('')}<button type="button" data-k="days" aria-pressed="false">أيام الشهر</button></div>
          <div id="adBody" style="margin-top:14px"></div>${RAJA}
          <p class="note">بُني هذا الباب على مكارم الأخلاق للطبرسي، مع مواضع من الوسائل والفقيه. أما كتاب «الآداب والسنن» للسيد محمد الحسيني الشيرازي فلم يُتح نصه للقراءة الآلية بعد، ويُقابَل به لاحقاً.</p></div>`;
      const show = (k) => {
        el.querySelectorAll('#adTabs button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === k)));
        const body = el.querySelector('#adBody');
        if (k === 'days') {
          body.innerHTML = '<p class="lede">اختيارات أيام الشهر القمري، منسوبة إلى الصادق ع بلا سند (مكارم ص٤٧٤). كلها إرشادية.</p>' +
            table(['اليوم', '', 'الوصف'], DAYS.slice(1).map((x, i) => [`<b>${M.n(i + 1)}</b>${h && h.d === i + 1 ? ' <span class="pill info">اليوم</span>' : ''}`, dayPill(i + 1), x[0]])) + `<p class="note">${link(mak(474))}. اليوم الثلاثون لم يرد في الصفحة.</p>`;
          return;
        }
        const a = ADAB[k];
        body.innerHTML = `<p class="label">${a[1]}</p>` + table(['الوقت أو الفعل', 'الحكم', 'النص مختصراً', 'المصدر'], a[2].map((r) => [r[0], lv(r[1]), r[2], srcCell(r[3])]));
      };
      el.querySelector('#adTabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) show(b.dataset.k); });
      show('nails');
    },
  };
})();
