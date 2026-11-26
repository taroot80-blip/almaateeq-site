/* جداول الكسوف والخسوف في دول المنطقة — من جداول إبراهيم دشتي، مع تنزيل الملفين */
(function () {
  'use strict';
  const T = window.ECL_TABLES; if (!T) return;
  const box = document.getElementById('eclTables'); if (!box) return;
  const MON = { 'يناير': 1, 'فبراير': 2, 'مارس': 3, 'أبريل': 4, 'مايو': 5, 'يونيو': 6, 'يوليو': 7, 'أغسطس': 8, 'سبتمبر': 9, 'أكتوبر': 10, 'نوفمبر': 11, 'ديسمبر': 12 };
  const DEF = {
    'لا': 'لا يُشاهد في أي مكان من الدولة',
    'البعض جزئي': 'يُشاهد جزئياً في قسم من الدولة ولا يُشاهد في بقيتها',
    'جزئي': 'يُشاهد جزئياً في كل الدولة',
    'حلقي': 'يُشاهد حلقياً في قسم من الدولة، وجزئياً في بقيتها',
    'كلي': 'كسوف: كلي في قسم من الدولة وجزئي في بقيتها · خسوف: كلي في كل الدولة',
    'جزئي/كلي': 'يُشاهد كلياً في قسم من الدولة وجزئياً في بقيتها',
    'مختلف': 'كلي في قسم، وجزئي في قسم آخر، ولا يُشاهد في بقيتها',
  };
  const PILL = { 'لا': 'dim', 'البعض جزئي': 'info', 'جزئي': 'mid', 'حلقي': 'ok', 'كلي': 'ok', 'جزئي/كلي': 'ok', 'مختلف': 'info' };
  const BYKEY = { qatif: 'السعودية', dammam: 'السعودية', ahsa: 'السعودية', riyadh: 'السعودية', mecca: 'السعودية', medina: 'السعودية', jeddah: 'السعودية', bahrain: 'البحرين', kuwait: 'الكويت', najaf: 'العراق', karbala: 'العراق', basra: 'العراق', beirut: 'لبنان' };
  const SITE = 'https://www.almaateeq.com/apps/almisbar/';
  const base = location.host === 'appassets.androidplatform.net' ? SITE : '';
  const FILES = {
    solar: ['downloads/solar-eclipses-2004-2048.xlsx', 'جدول الكسوف 2004–2048.xlsx', 'كسوف الشمس ٢٠٠٤–٢٠٤٨'],
    lunar: ['downloads/lunar-eclipses-1927-2126.xlsx', 'جدول الخسوف 1927–2126.xlsx', 'خسوف القمر ١٩٢٧–٢١٢٦'],
  };
  const ar = (s) => String(s).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
  const dateKey = (s) => { const m = s.match(/(\d+)(?:\/\d+)?\s+(\S+)\s+(\d{4})/); return m ? +m[3] * 10000 + (MON[m[2]] || 0) * 100 + +m[1] : 0; };
  const now = new Date(), todayKey = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  let saved = {}; try { saved = JSON.parse(localStorage.getItem('misbar.eclTables') || '{}'); } catch (e) { /* */ }
  let key = 'qatif'; try { key = JSON.parse(localStorage.getItem('misbar.place') || '"qatif"'); } catch (e) { /* */ }
  const st = { kind: saved.kind || 'solar', c: saved.c != null ? saved.c : Math.max(0, T.countries.indexOf(BYKEY[key] || 'الكويت')), upcoming: saved.upcoming !== false, seen: !!saved.seen };
  const save = () => { try { localStorage.setItem('misbar.eclTables', JSON.stringify(st)); } catch (e) { /* */ } };

  box.innerHTML = `<h2 class="sec"><svg class="orn" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1l3 6 6-3-3 6 6 2-6 2 3 6-6-3-3 6-3-6-6 3 3-6-6-2 6-2-3-6 6 3z" fill="currentColor"/></svg><span>جدول الكسوف والخسوف في دول المنطقة</span></h2>
    <p class="lede">حالة رؤية كل كسوف وخسوف في سبع عشرة دولة. الكسوف من ٢٠٠٤ إلى ٢٠٤٨، والخسوف من ١٩٢٧ إلى ٢١٢٦.</p>
    <div class="ecl-ctl">
      <div class="ecl-seg" role="tablist"><button type="button" class="btn ghost" data-k="solar">كسوف الشمس</button><button type="button" class="btn ghost" data-k="lunar">خسوف القمر</button></div>
      <label class="ecl-f">الدولة <select id="eclCountry">${T.countries.map((c, i) => `<option value="${i}">${c}</option>`).join('')}</select></label>
      <label class="ecl-f"><input type="checkbox" id="eclUp"> القادمة فقط</label>
      <label class="ecl-f"><input type="checkbox" id="eclSeen"> المرئية فقط</label>
    </div>
    <p class="label" id="eclCount"></p>
    <div class="scroll ecl-scroll"><table id="eclTbl"></table></div>
    <details class="ecl-legend"><summary>تفسير الحالات</summary><dl class="kv">${Object.keys(DEF).map((k) => `<dt><span class="pill ${PILL[k]}">${k}</span></dt><dd>${DEF[k]}</dd>`).join('')}</dl><p class="note">★ كسوف يُشاهد حلقياً أو كلياً في قسم من المنطقة.</p></details>
    <div class="ecl-dl">${['solar', 'lunar'].map((k) => `<a class="btn" href="${base}${FILES[k][0]}" download="${FILES[k][1]}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v12m0 0l-5-5m5 5l5-5M4 21h16"/></svg>تنزيل جدول ${FILES[k][2]}</a>`).join('')}</div>
    <p class="note">المصدر: جداول الأستاذ إبراهيم دشتي (ملفّا Excel أعلاه). والأوقات الدقيقة لبلدك في الجدول السابق.</p>`;

  const sel = box.querySelector('#eclCountry'), up = box.querySelector('#eclUp'), seen = box.querySelector('#eclSeen');
  function render() {
    sel.value = st.c; up.checked = st.upcoming; seen.checked = st.seen;
    box.querySelectorAll('.ecl-seg button').forEach((b) => { const on = b.dataset.k === st.kind; b.classList.toggle('ghost', !on); b.setAttribute('aria-selected', on); });
    let rows = T[st.kind].map((r) => ({ d: r[0], s: T.codes[+r[1][st.c]], all: r[1], b: r[2], k: dateKey(r[0]) }));
    if (st.upcoming) rows = rows.filter((r) => r.k >= todayKey);
    if (st.seen) rows = rows.filter((r) => r.s !== 'لا');
    box.querySelector('#eclCount').textContent = `${ar(rows.length)} ${st.kind === 'solar' ? 'كسوف' : 'خسوف'} في ${T.countries[st.c]}`;
    box.querySelector('#eclTbl').innerHTML = '<tr><th>التاريخ</th><th>الحالة في ' + T.countries[st.c] + '</th><th>تُرى في المنطقة</th></tr>' +
      (rows.length ? rows.map((r) => {
        const n = [...r.all].filter((x) => T.codes[+x] !== 'لا').length;
        return `<tr class="${r.k >= todayKey && r === rows.find((x) => x.k >= todayKey) ? 'today' : ''}"><td>${ar(r.d)}${r.b ? ' <span title="حلقي أو كلي في قسم من المنطقة">★</span>' : ''}</td><td><span class="pill ${PILL[r.s] || 'dim'}">${r.s}</span></td><td>${n ? ar(n) + ' من ١٧ دولة' : '—'}</td></tr>`;
      }).join('') : '<tr><td colspan="3">لا شيء ضمن هذا الاختيار.</td></tr>');
  }
  box.addEventListener('click', (e) => { const b = e.target.closest('.ecl-seg button'); if (b) { st.kind = b.dataset.k; save(); render(); } });
  sel.addEventListener('change', () => { st.c = +sel.value; save(); render(); });
  up.addEventListener('change', () => { st.upcoming = up.checked; save(); render(); });
  seen.addEventListener('change', () => { st.seen = seen.checked; save(); render(); });
  render();
})();
