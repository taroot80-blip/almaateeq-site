// التواصل المستعجل: زر طوارئ في كل صفحة يفتح: الاتصال بالمرشد، إرسال الموقع، مجموعة الحملة،
// سؤال شرعي مستعجل إلى الفقيه أو المكتب، أرقام الطوارئ الرسمية في السعودية، وبطاقة الحاج للمسعفين.
// الإعدادات تُحفظ على الجهاز، ويستطيع المرشد مشاركة «رمز الحملة» مع حجاجه فتُملأ بياناتهم مرة واحدة.
'use strict';
const SOS={
  get(){return store.get('sos',{})},set(v){store.set('sos',v)},
  digits:s=>String(s||'').replace(/[^\d+]/g,'').replace(/^00/,'+'),
  wa:(num,text)=>`https://wa.me/${SOS.digits(num).replace('+','')}?text=${encodeURIComponent(text)}`,
};
// أرقام الطوارئ في السعودية (911 الموحد يعمل في مكة المكرمة والرياض والشرقية)
const SOS_OFFICIAL=[
  ['911','الطوارئ الموحد','مكة المكرمة والرياض والشرقية: شرطة وإسعاف ودفاع مدني'],
  ['997','الإسعاف (الهلال الأحمر)','في كل المناطق ومنها المدينة المنورة'],
  ['999','الشرطة',''],['998','الدفاع المدني',''],
  ['993','المرور','حوادث السير داخل المدن'],['996','أمن الطرق','الحوادث على الطرق السريعة'],
  ['112','الطوارئ الدولي','يعمل دون شريحة أو مع ضعف التغطية'],
];
const CARD_FIELDS=[['name','الاسم','Name'],['nation','الجنسية','Nationality'],['blood','فصيلة الدم','Blood type'],
  ['conditions','أمراض مزمنة','Medical conditions'],['meds','أدوية يتناولها','Medications'],['allergy','حساسية','Allergies'],
  ['hamla','الحملة','Hajj group'],['hotel','السكن في مكة / المدينة','Accommodation'],['home','رقم أهله في البلد','Family contact']];
const SETUP_FIELDS=[['guide','اسم المرشد'],['guidePhone','هاتف المرشد (مع رمز الدولة)'],['group','رابط مجموعة واتساب للحملة'],
  ['embassy','هاتف السفارة أو القنصلية']];
// الجهات الشرعية: المضمّنة في data/contacts.js + ما يضيفه المستخدم على جهازه
function myContacts(){const c=SOS.get();let L=c.contacts||[];if(c.faqih&&!L.some(x=>x.whatsapp===c.faqih))L=[{name:c.faqihName||'الفقيه / المكتب',whatsapp:c.faqih,phone:c.faqih},...L];return L}
function allContacts(){return [...(window.SHARI_CONTACTS||[]).map(x=>({...x,fixed:1})),...myContacts()]}
const telBtn=(n,label,sub,cls='')=>`<a class="btn ${cls} sosbig" href="tel:${SOS.digits(n)}"><b>${esc(label)}</b>${sub?`<small>${esc(sub)}</small>`:''}<span class="num">${esc(n)}</span></a>`;

// الزر العائم
function sosFab(){if($('#sosfab'))return;document.body.insertAdjacentHTML('beforeend',`<a id="sosfab" href="#/sos" aria-label="تواصل مستعجل">SOS</a>`)}
addEventListener('hashchange',()=>{const f=$('#sosfab');if(f)f.style.display=location.hash.startsWith('#/sos')||location.hash.startsWith('#/teach/play')?'none':''});

route(/^\/sos$/,()=>{
  const c=SOS.get(),ready=c.guidePhone||allContacts().length;
  view(topbar('تواصل مستعجل','/')+`
  ${ready?'':`<div class="note">لم تُضبط أرقام الحملة بعد. <a href="#/sos/setup">اضبطها الآن</a> أو الصق «رمز الحملة» الذي يرسله المرشد.</div>`}
  <div class="grid sosgrid">
    ${c.guidePhone?telBtn(c.guidePhone,'اتصل بالمرشد',c.guide||'','danger'):''}
    ${c.guidePhone?`<button class="btn danger sosbig" id="sendloc"><b>أرسل موقعي للمرشد</b><small>رسالة واتساب برابط الخريطة</small><span class="num">📍</span></button>`:''}
    ${c.group?`<a class="btn ghost sosbig" href="${esc(c.group)}" target="_blank" rel="noopener"><b>مجموعة الحملة</b><small>واتساب</small><span class="num">💬</span></a>`:''}
    ${c.embassy?telBtn(c.embassy,'السفارة / القنصلية','','ghost'):''}
  </div>
  <div class="h2">سؤال شرعي مستعجل</div>
  <div class="card pad cform">
    <p class="muted" style="margin:0 0 8px;font-size:.9rem">اكتب السؤال، واختر الجهة الشرعية، ثم أرسله بالإيميل أو واتساب أو اتصل مباشرة. يُرفق تلقائيًا مرجع التقليد وموضعك في النسك.</p>
    <label>المرجع<select id="fq_mj" class="sel">${window.MARAJI.map(m=>`<option value="${m.id}" ${m.id===mine()?'selected':''}>${esc(m.name)}</option>`).join('')}</select></label>
    <label>السؤال<textarea id="fq_q" rows="3" placeholder="مثال: شككت بعد التقصير في عدد أشواط السعي، فما الحكم؟"></textarea></label>
    <div id="fq_list"></div>
    <div class="row" style="margin-top:8px"><a class="btn sm ghost" href="#/sos/setup">＋ أضف جهة شرعية</a><a class="btn sm ghost" href="#/search/data/">ابحث في الأحكام أولًا</a></div>
  </div>
  <div class="h2">أرقام الطوارئ في السعودية</div>
  <div class="grid sosgrid">${SOS_OFFICIAL.map(([n,l,s])=>telBtn(n,l,s,n==='911'||n==='997'?'danger':'ghost')).join('')}</div>
  <div class="h2">بطاقة الحاج للمسعفين</div>
  ${c.card&&c.card.name?cardHTML(c.card):`<div class="card pad muted">أضف بيانات بطاقتك من الإعدادات لتعرضها على المسعف عند الحاجة.</div>`}
  <div class="row" style="margin-top:12px"><a class="btn ghost" href="#/sos/setup">⚙️ الإعدادات ورمز الحملة</a></div>
  <p class="dim" style="font-size:.8rem">أرقام الطوارئ: مصادر محلية سعودية، ورقم 911 الموحد يعمل في مكة المكرمة والرياض والشرقية. البيانات محفوظة على هذا الجهاز فقط.</p>`);
  const sl=$('#sendloc');if(sl)sl.onclick=()=>{const send=t=>location.href=SOS.wa(c.guidePhone,t);
    const base=`طلب مساعدة عاجل من الحاج: ${(c.card&&c.card.name)||''}`;
    if(!navigator.geolocation){send(base);return}
    sl.querySelector('small').textContent='أحدّد موقعك…';
    navigator.geolocation.getCurrentPosition(p=>send(`${base}\nموقعي الآن: https://maps.google.com/?q=${p.coords.latitude.toFixed(6)},${p.coords.longitude.toFixed(6)}`),
      ()=>send(base+'\n(تعذّر تحديد الموقع)'),{enableHighAccuracy:true,timeout:9000})};
  const msg=()=>{const st=STATIONS[(store.get('lastStation','')||'')];const nm=(c.card&&c.card.name)||'';
    return `سؤال شرعي مستعجل${nm?`\nالسائل: ${nm}`:''}\nالمرجع: ${MJ[$('#fq_mj').value].name}${st?`\nالموضع: ${st.name}`:''}\n\n${$('#fq_q').value.trim()}\n\n— مرسل من «مرشد النسك»`};
  const drawList=()=>{const mj=$('#fq_mj').value,L=allContacts().sort((a,b)=>(b.marja===mj)-(a.marja===mj));
    $('#fq_list').innerHTML=L.length?L.map((x,i)=>`<div class="shc ${x.marja===mj?'match':''}"><div class="shn"><b>${esc(x.name)}</b>${x.marja&&MJ[x.marja]?`<small>${esc(MJ[x.marja].name)}</small>`:''}${x.note?`<small class="dim">${esc(x.note)}</small>`:''}</div>
      <div class="sha">${x.email?`<button class="btn sm" data-via="email" data-i="${i}">✉️ إيميل</button>`:''}${x.whatsapp?`<button class="btn sm teal" data-via="wa" data-i="${i}">💬 واتساب</button>`:''}${x.phone?`<a class="btn sm ghost" href="tel:${SOS.digits(x.phone)}">📞 اتصال</a>`:''}</div></div>`).join('')
      :`<div class="note">لا توجد جهات شرعية بعد. أضفها من الإعدادات (إيميل أو هاتف أو واتساب)، أو الصق «رمز الحملة» من المرشد.</div>`;
    $$('[data-via]',$('#fq_list')).forEach(b=>b.onclick=()=>{if(!$('#fq_q').value.trim()){toast('اكتب السؤال أولًا');$('#fq_q').focus();return}
      const x=L[+b.dataset.i];SFX.play('save');
      if(b.dataset.via==='email')location.href=`mailto:${encodeURIComponent(x.email)}?subject=${encodeURIComponent('سؤال شرعي مستعجل — مرشد النسك')}&body=${encodeURIComponent(msg())}`;
      else location.href=SOS.wa(x.whatsapp,msg())})};
  $('#fq_mj').onchange=drawList;drawList();
});
function cardHTML(k){return `<div class="card pad pcard"><div class="pch"><b>بطاقة حاج | Pilgrim card</b><span>🆘</span></div>
  ${CARD_FIELDS.filter(([f])=>k[f]).map(([f,a,e])=>`<div class="pr"><small>${a} | ${e}</small><b>${esc(k[f])}</b></div>`).join('')}
  ${SOS.get().guidePhone?`<div class="pr"><small>المرشد | Guide</small><b dir="ltr">${esc(SOS.get().guide||'')} ${esc(SOS.get().guidePhone)}</b></div>`:''}</div>`}

route(/^\/sos\/setup$/,()=>{
  const c=SOS.get(),k=c.card||{};
  view(topbar('إعدادات التواصل','/sos')+`
  <div class="card pad cform">
    <div class="gh"><b>رمز الحملة</b></div>
    <p class="muted" style="margin:0 0 8px;font-size:.88rem">المرشد يضبط أرقام الحملة مرة، ثم ينسخ الرمز ويرسله لحجاجه؛ والحاج يلصقه هنا فتُملأ الأرقام.</p>
    <label>الصق رمز الحملة<input id="code_in" placeholder="NUSK-…" dir="ltr"></label>
    <div class="row"><button class="btn sm" id="code_apply">طبّق الرمز</button><button class="btn sm ghost" id="code_copy">انسخ رمز حملتي</button></div>
  </div>
  <div class="card pad cform" style="margin-top:12px"><div class="gh"><b>أرقام الحملة</b></div>
    ${SETUP_FIELDS.map(([f,l])=>`<label>${l}<input data-s="${f}" value="${esc(c[f]||'')}" ${/Phone|faqih$|embassy/.test(f)?'dir="ltr" inputmode="tel"':''}></label>`).join('')}</div>
  <div class="card pad cform" style="margin-top:12px"><div class="gh"><b>الجهات الشرعية للتواصل المستعجل</b></div>
    <p class="muted" style="margin:0 0 8px;font-size:.88rem">مكتب مرجع، أو عالم الحملة، أو من تثق به. يكفي إيميل أو هاتف أو واتساب، وتُرسل مع رمز الحملة.</p>
    <div id="ctl"></div>
    <div class="cbox"><legend>جهة جديدة</legend>
      <input id="ct_name" placeholder="الاسم: مكتب سماحة… / الشيخ…">
      <select id="ct_mj" class="sel" style="margin-top:6px"><option value="">— المرجع (اختياري) —</option>${window.MARAJI.map(m=>`<option value="${m.id}">${esc(m.name)}</option>`).join('')}</select>
      <input id="ct_email" placeholder="البريد الإلكتروني" dir="ltr" inputmode="email">
      <input id="ct_phone" placeholder="📞 الهاتف مع رمز الدولة" dir="ltr" inputmode="tel">
      <input id="ct_wa" placeholder="💬 واتساب مع رمز الدولة" dir="ltr" inputmode="tel">
      <input id="ct_note" placeholder="ملاحظة: أوقات الرد مثلًا (اختياري)">
      <button type="button" class="btn sm" id="ct_add" style="margin-top:8px">＋ أضف الجهة</button></div></div>
  <div class="card pad cform" style="margin-top:12px"><div class="gh"><b>بطاقة الحاج</b></div>
    <p class="muted" style="margin:0 0 8px;font-size:.88rem">تظهر للمسعف عند الطوارئ، وتبقى على هذا الجهاز فقط.</p>
    ${CARD_FIELDS.map(([f,a,e])=>`<label>${a} <small class="dim">${e}</small><input data-k="${f}" value="${esc(k[f]||'')}"></label>`).join('')}</div>
  <div class="row" style="margin:12px 0"><button class="btn" id="sos_save">احفظ</button><a class="btn ghost" href="#/sos">رجوع</a></div>`);
  let CT=myContacts().slice();
  const drawCT=()=>{$('#ctl').innerHTML=[...(window.SHARI_CONTACTS||[]).map(x=>({...x,fixed:1})),...CT].map((x,i)=>`<div class="shc"><div class="shn"><b>${esc(x.name)}</b><small dir="ltr">${esc([x.email,x.phone,x.whatsapp].filter(Boolean).join(' · '))}</small></div>
      ${x.fixed?'<small class="dim">مضمّنة</small>':`<button type="button" class="x" data-del="${i-(window.SHARI_CONTACTS||[]).length}">✕</button>`}</div>`).join('')||'<p class="dim">لا جهات بعد.</p>';
    $$('[data-del]').forEach(b=>b.onclick=()=>{CT.splice(+b.dataset.del,1);drawCT()})};
  drawCT();
  $('#ct_add').onclick=()=>{const x={name:$('#ct_name').value.trim(),marja:$('#ct_mj').value,email:$('#ct_email').value.trim(),phone:$('#ct_phone').value.trim(),whatsapp:$('#ct_wa').value.trim(),note:$('#ct_note').value.trim()};
    if(!x.name){toast('اكتب اسم الجهة');return}if(!x.email&&!x.phone&&!x.whatsapp){toast('أضف إيميلًا أو هاتفًا أو واتساب');return}
    if(x.email&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x.email)){toast('البريد الإلكتروني غير صحيح');return}
    Object.keys(x).forEach(k=>{if(!x[k])delete x[k]});CT.push(x);['ct_name','ct_email','ct_phone','ct_wa','ct_note'].forEach(id=>$('#'+id).value='');$('#ct_mj').value='';drawCT();toast('أُضيفت؛ لا تنس «احفظ»')};
  const collect=()=>{const v={...SOS.get(),card:{},contacts:CT};delete v.faqih;delete v.faqihName;$$('[data-s]').forEach(i=>v[i.dataset.s]=i.value.trim());$$('[data-k]').forEach(i=>v.card[i.dataset.k]=i.value.trim());return v};
  $('#sos_save').onclick=()=>{SOS.set(collect());SFX.play('save');toast('حُفظت الإعدادات');go('/sos')};
  $('#code_copy').onclick=()=>{const v=collect();const pub={};SETUP_FIELDS.forEach(([f])=>{if(v[f])pub[f]=v[f]});if(v.card.hamla)pub.hamla=v.card.hamla;if(v.card.hotel)pub.hotel=v.card.hotel;if(CT.length)pub.contacts=CT;
    const code='NUSK-'+btoa(unescape(encodeURIComponent(JSON.stringify(pub))));
    (navigator.clipboard?navigator.clipboard.writeText(code):Promise.reject()).then(()=>toast('نُسخ رمز الحملة؛ أرسله لحجاجك')).catch(()=>{$('#code_in').value=code;$('#code_in').select();toast('حدّد الرمز وانسخه')})};
  $('#code_apply').onclick=()=>{try{const raw=$('#code_in').value.trim().replace(/^NUSK-/,'');const pub=JSON.parse(decodeURIComponent(escape(atob(raw))));
      const v=collect();SETUP_FIELDS.forEach(([f])=>{if(pub[f])v[f]=pub[f]});if(pub.hamla)v.card.hamla=pub.hamla;if(pub.hotel)v.card.hotel=pub.hotel;if(pub.contacts)pub.contacts.forEach(x=>{if(!v.contacts.some(y=>y.name===x.name))v.contacts.push(x)});
      SOS.set(v);toast('طُبّق رمز الحملة');render()}catch(e){toast('الرمز غير صحيح')}};
});
// تذكّر آخر محطة فتحها (يُرفق بالسؤال المستعجل)
addEventListener('hashchange',()=>{const m=location.hash.match(/^#\/station\/(\w+)/);if(m)store.set('lastStation',m[1])});

document.head.insertAdjacentHTML('beforeend',`<style>
#sosfab{position:fixed;left:14px;bottom:calc(84px + var(--safe-b));z-index:21;width:58px;height:58px;border-radius:50%;display:grid;place-items:center;
  background:radial-gradient(circle at 35% 30%,#f87171,#b91c1c);color:#fff;font:800 .95rem var(--body);text-decoration:none;letter-spacing:.5px;
  box-shadow:inset 0 2px 0 rgba(255,255,255,.35),0 4px 0 #7f1d1d,0 8px 18px rgba(0,0,0,.5),0 0 0 4px rgba(239,68,68,.25);animation:sospulse 2.4s infinite}
@keyframes sospulse{0%,100%{box-shadow:inset 0 2px 0 rgba(255,255,255,.35),0 4px 0 #7f1d1d,0 8px 18px rgba(0,0,0,.5),0 0 0 4px rgba(239,68,68,.25)}50%{box-shadow:inset 0 2px 0 rgba(255,255,255,.35),0 4px 0 #7f1d1d,0 8px 18px rgba(0,0,0,.5),0 0 0 10px rgba(239,68,68,.08)}}
@media (prefers-reduced-motion:reduce){#sosfab{animation:none}}
.sosgrid{grid-template-columns:1fr 1fr}
.sosbig{flex-direction:column;align-items:flex-start;justify-content:flex-start;gap:2px;min-height:84px;text-align:start;padding:10px 14px;text-decoration:none}
.sosbig small{font-weight:500;opacity:.85;font-size:.76rem;line-height:1.4}
.sosbig .num{order:-1;font:800 1.35rem/1.2 var(--body);direction:ltr;margin-bottom:2px}
.shc{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;padding:10px;margin:8px 0;border:1px solid var(--line);border-radius:14px;background:rgba(0,0,0,.18)}
.shc.match{border-color:var(--gold);box-shadow:0 0 0 1px var(--gold) inset}.shn{display:flex;flex-direction:column;min-width:0}.shn small{font-size:.78rem;color:var(--muted)}
.sha{display:flex;gap:6px;flex-wrap:wrap}
.pcard{background:#fff;color:#111;border:3px solid #dc2626}.pcard .pch{display:flex;justify-content:space-between;color:#b91c1c;font-size:1.1rem;margin-bottom:6px}
.pr{border-top:1px solid #eee;padding:6px 0}.pr small{display:block;color:#666}.pr b{font-size:1.05rem}
</style>`);
sosFab();
