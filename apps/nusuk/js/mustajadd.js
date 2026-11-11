// صندوق المسائل المستجدة: إضافة مسألة بأقوال المراجع وحفظها، فتُدمج فورًا في الدليل (انظر js/custom.js)،
// مع تصدير ملف JSON لدمجها لاحقًا في النسخة العامة، واستيراده على جهاز آخر.
'use strict';
const CU={
  all:()=>window.CUSTOM_LIST,
  save(list){localStorage.setItem('nusk:custom',JSON.stringify(list))},
  nextN(){return Math.max(0,...CU.all().map(x=>x.n))+1},
  stations(){const ks=[...new Set(Object.values(STATIONS).flatMap(s=>s.topics||[]).concat(Object.keys(TOPICS)))];return ks.filter(k=>STATIONS[k]||TOPICS[k]).map(k=>[k,stationName(k)])},
  // دمج فوري: إعادة تحميل الصفحة لتُبنى الفهارس والبحث بالمسألة الجديدة
  apply(h){location.hash=h;location.reload()},
};
const TONES=[['yes','منع / وجوب / بطلان'],['no','جواز / عفو / صحة'],['ihtiyat','على الأحوط'],['detail','تفصيل / بيان']];

// تصغير الصورة قبل حفظها (أقصى بُعد 900 بكسل، JPEG) لتبقى خفيفة على الجهاز وفي ملف التصدير
function shrinkImage(file,max,q){return new Promise((res,rej)=>{const fr=new FileReader();fr.onerror=rej;fr.onload=()=>{const im=new Image();im.onerror=rej;im.onload=()=>{
  const k=Math.min(1,max/Math.max(im.width,im.height)),cv=document.createElement('canvas');cv.width=Math.round(im.width*k);cv.height=Math.round(im.height*k);
  const x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,cv.width,cv.height);x.drawImage(im,0,0,cv.width,cv.height);res(cv.toDataURL('image/jpeg',q))};im.src=fr.result};fr.readAsDataURL(file)})}
route(/^\/new$/,()=>{
  const L=CU.all();
  view(topbar('المسائل المستجدة','/')+`
  <div class="card pad">
    <p class="muted" style="margin-top:0">سجّل هنا مسألة استجدّت في الرحلة أو استفتاءً جديدًا، بأقوال المراجع ومصدرها. تُحفظ على هذا الجهاز <b>وتُدمج فورًا</b> في الأبواب وشجرة الفتوى والباحث والمقارنة والاختبار، وتُميَّز بعلامة <span class="badge new">مستجدة</span>.</p>
    <a class="btn" href="#/new/add">${ico('plus')} أضف مسألة مستجدة</a>
  </div>
  <div class="h2">المحفوظة <small>${AR(L.length)}</small></div>
  ${L.length?L.slice().reverse().map(x=>`<div class="card hit cu">
      <a href="#/issue/${x.id}"><b>${esc(x.q)}</b><div class="dim">${esc(stationName(x.station))} | ${esc(x.date)} | ${AR(x.cases.reduce((a,c)=>a+c.opinions.length,0))} قول</div></a>
      <div class="row" style="margin-top:8px"><a class="btn sm ghost" href="#/new/edit/${x.id}">✎ تعديل</a><button class="btn sm ghost del" data-id="${x.id}">حذف</button></div></div>`).join('')
    :`<div class="card empty">${ico('plus')}لا مسائل مستجدة بعد.</div>`}
  <div class="h2">الدمج في النسخة العامة</div>
  <div class="card pad">
    <p class="muted" style="margin-top:0;font-size:.92rem">المسائل محفوظة على هذا الجهاز فقط. لدمجها في الدليل لكل المرشدين، صدّرها ملفًّا وأرسله، فتُضاف إلى البيانات وتُراجَع. ويمكن استيراد الملف على جهاز آخر.</p>
    <div class="row"><button class="btn sm" id="exp" ${L.length?'':'disabled'}>⬇ صدّر الملف</button><button class="btn sm ghost" id="shr" ${L.length?'':'disabled'}>${ico('share')} أرسل</button><label class="btn sm ghost" style="cursor:pointer">⬆ استورد<input type="file" id="imp" accept=".json,application/json" hidden></label></div>
  </div>`);
  const blob=()=>new Blob([JSON.stringify({app:'nusk',kind:'custom-issues',version:1,exported:new Date().toISOString(),items:CU.all()},null,1)],{type:'application/json'});
  const fname='مسائل-مستجدة-'+new Date().toISOString().slice(0,10)+'.json';
  $('#exp').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(blob());a.download=fname;a.click();SFX.play('save')};
  const nativeShare=()=>{const fr=new FileReader();fr.onload=()=>NuskAndroid.shareFile(fname,'application/json',String(fr.result).split(',')[1],'المسائل المستجدة — مرشد النسك');fr.readAsDataURL(blob())};
  if(window.NuskAndroid){$('#exp').onclick=nativeShare}
  if(window.NUSK_PACKED){const sheet=()=>{blob().text().then(t=>{showSaveSheet('<textarea id="jsn" readonly style="width:100%;height:240px;background:var(--bg2);color:var(--text);border:1px solid var(--line);border-radius:12px;padding:8px;direction:ltr;font:12px monospace"></textarea><button class="btn sm" id="cpy" style="margin-top:8px">انسخ النص</button>','انسخ النص وأرسله في رسالة، أو احفظه ملفًّا باسم ينتهي بـ .json.');$('#jsn').value=t;$('#cpy').onclick=()=>{navigator.clipboard.writeText(t).then(()=>toast('نُسخ')).catch(()=>{$('#jsn').select()})}})};$('#exp').onclick=sheet;$('#shr').onclick=sheet}
  $('#shr').onclick=async()=>{if(window.NuskAndroid)return nativeShare();if(window.NUSK_PACKED)return $('#exp').click();const f=new File([blob()],fname,{type:'application/json'});
    if(navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f],title:'المسائل المستجدة — مرشد النسك'})}catch(e){}}else $('#exp').click()};
  $('#imp').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const d=JSON.parse(await f.text());const all=(d.items||d).filter(x=>x&&x.q&&x.cases),items=all.filter(x=>x.source&&x.page&&x.img);if(all.length>items.length)toast('رُفضت '+AR(all.length-items.length)+' مسألة غير موثّقة');
      const L=CU.all();let n=CU.nextN(),added=0;
      items.forEach(x=>{if(L.some(y=>y.q===x.q&&y.date===x.date))return;const k=n++;L.push({...x,n:k,id:'custom-'+String(k).padStart(3,'0')});added++});
      CU.save(L);setTimeout(()=>toast('استُورد '+AR(added)+' مسألة موثّقة'),900);setTimeout(()=>CU.apply('#/new'),500)}catch(err){toast('الملف غير صالح')}};
  $$('.del').forEach(b=>b.onclick=()=>{if(!confirmDel(b))return;CU.save(CU.all().filter(x=>x.id!==b.dataset.id));CU.apply('#/new')});
});
// تأكيد الحذف بضغطتين (بدل نوافذ المتصفح المنبثقة)
function confirmDel(b){if(b.dataset.sure)return true;b.dataset.sure=1;b.textContent='اضغط ثانيةً للتأكيد';b.classList.add('danger');setTimeout(()=>{delete b.dataset.sure;b.textContent='حذف';b.classList.remove('danger')},2500);return false}

route(/^\/new\/(add|edit\/([\w-]+))$/,(_m,id)=>{
  const ex=id?CU.all().find(x=>x.id===id):null;if(id&&!ex)return go('/new');
  const d=ex||{q:'',station:'tawaf',source:'',note:'',cases:[{label:'',opinions:[{ruling:'',tone:'no',maraji:[],note:''}]}]};
  // التوثيق أولًا: لا يُفتح مربع كتابة المسألة إلا بعد المصدر ورقم الصفحة وصورة العبارة من مصدرها
  const DOC={source:d.source||'',page:d.page||'',img:d.img||''};
  view(topbar(ex?'تعديل مسألة مستجدة':'مسألة مستجدة','/new')+`
  <div class="card pad cform docgate" id="gate">
    <div class="gh"><span class="step">١</span><b>توثيق المسألة من مصدرها</b></div>
    <p class="muted" style="margin:4px 0 12px;font-size:.9rem">لا تُقبل مسألة مستجدة ولا تعديل إلا موثَّقة. اكتب المصدر ورقم الصفحة، وارفع صورة مصغّرة للعبارة من المصدر نفسه؛ وبعدها يُفتح مربع كتابة المسألة.</p>
    <label>المصدر <span class="req">*</span><input id="g_src" placeholder="مثال: منهاج الصالحين ج1، أو استفتاء مكتب… بتاريخ…" value="${esc(DOC.source)}"></label>
    <label>رقم الصفحة أو المسألة <span class="req">*</span><input id="g_pg" placeholder="مثال: ص 214 / م 345 / س 27" value="${esc(DOC.page)}"></label>
    <label>صورة العبارة من مصدرها <span class="req">*</span>
      <div class="upl" id="g_drop">${DOC.img?`<img src="${DOC.img}" alt="صورة العبارة">`:`<span>${ico('plus')} اضغط لرفع صورة (تصوير الصفحة أو لقطة شاشة)</span>`}</div>
      <input type="file" id="g_img" accept="image/*" hidden></label>
    <div class="row" style="margin-top:4px"><button type="button" class="btn" id="g_ok" disabled>تابع إلى كتابة المسألة</button><a class="btn ghost" href="#/new">إلغاء</a></div>
    <p class="dim" id="g_msg" style="margin:8px 0 0"></p>
  </div>
  <div id="formwrap"></div>`);
  const gateCheck=()=>{DOC.source=$('#g_src').value.trim();DOC.page=$('#g_pg').value.trim();
    const miss=[!DOC.source&&'المصدر',!DOC.page&&'رقم الصفحة',!DOC.img&&'صورة العبارة'].filter(Boolean);
    $('#g_ok').disabled=!!miss.length;$('#g_msg').textContent=miss.length?'المطلوب: '+miss.join('، '):'اكتمل التوثيق ✓';return !miss.length};
  $('#g_src').oninput=$('#g_pg').oninput=()=>{gateCheck();if($('#cf'))$('#cf').querySelector('.docsum').innerHTML=docSum()};
  $('#g_drop').onclick=()=>$('#g_img').click();
  $('#g_img').onchange=async e=>{const f=e.target.files[0];if(!f)return;
    if(!/^image\//.test(f.type)){toast('الملف ليس صورة');return}
    try{DOC.img=await shrinkImage(f,900,.72);$('#g_drop').innerHTML=`<img src="${DOC.img}" alt="صورة العبارة">`;gateCheck();if($('#cf'))$('#cf').querySelector('.docsum').innerHTML=docSum()}
    catch(err){toast('تعذّرت قراءة الصورة')}};
  const docSum=()=>`<b>التوثيق:</b> ${esc(DOC.source)} | ${esc(DOC.page)} <img src="${DOC.img}" alt="">`;
  gateCheck();
  $('#g_ok').onclick=()=>{if(!gateCheck())return;SFX.play('open');openForm();$('#formwrap').scrollIntoView({behavior:'smooth'})};
  const openForm=()=>{if($('#cf'))return;$('#formwrap').innerHTML=`
  <form id="cf" class="card pad cform" autocomplete="off" style="margin-top:12px">
    <div class="gh"><span class="step">٢</span><b>نص المسألة وأقوال المراجع</b></div>
    <div class="docsum">${docSum()}</div>
    <label>نص المسألة<textarea name="q" rows="2" required placeholder="مثال: حكم الطواف بالكرسي الكهربائي في الطابق الأول">${esc(d.q)}</textarea></label>
    <label>الباب<select name="station" class="sel">${CU.stations().map(([k,n])=>`<option value="${k}" ${k===d.station?'selected':''}>${esc(n)}</option>`).join('')}</select></label>
    <div id="cases"></div>
    <button type="button" class="btn sm ghost" id="addc">${ico('plus')} أضف حالة أخرى</button>
    <label>ملاحظة عامة (اختياري)<textarea name="note" rows="2">${esc(d.note)}</textarea></label>
    <div class="row" style="margin-top:6px"><button class="btn" type="submit">احفظ وادمج الآن</button><a class="btn ghost" href="#/new">إلغاء</a></div>
  </form>`;
  const C=JSON.parse(JSON.stringify(d.cases));
  const draw=()=>{$('#cases').innerHTML=C.map((c,ci)=>`<fieldset class="cbox"><legend>الحالة ${AR(ci+1)}${C.length>1?` <button type="button" class="x" data-rc="${ci}">✕</button>`:''}</legend>
      <input data-c="${ci}" data-f="label" placeholder="عنوان الحالة (اختياري)، مثل: قبل بلوغ النصف" value="${esc(c.label)}">
      ${c.opinions.map((o,oi)=>`<div class="obox ${o.tone}"><div class="row" style="flex-wrap:nowrap;justify-content:space-between"><b>القول ${AR(oi+1)}</b>${c.opinions.length>1?`<button type="button" class="x" data-ro="${ci}.${oi}">✕</button>`:''}</div>
        <textarea rows="2" data-c="${ci}" data-o="${oi}" data-f="ruling" placeholder="نص الحكم كما ورد، مثل: يجوز / لا يجوز على الأحوط…">${esc(o.ruling)}</textarea>
        <div class="tones">${TONES.map(([k,l])=>`<button type="button" class="chip ${o.tone===k?'on':''} t-${k}" data-tone="${ci}.${oi}.${k}">${l}</button>`).join('')}</div>
        <div class="dim" style="margin:6px 0 4px">المراجع القائلون به:</div>
        <div class="mjs">${window.MARAJI.map(m=>`<button type="button" class="chip ${o.maraji.includes(m.id)?'on':''}" data-mj="${ci}.${oi}.${m.id}">${esc(m.name)}</button>`).join('')}</div>
        <input data-c="${ci}" data-o="${oi}" data-f="note" placeholder="تعليق أو قيد (اختياري)" value="${esc(o.note||'')}">
      </div>`).join('')}
      <button type="button" class="btn sm ghost" data-ao="${ci}">${ico('plus')} أضف قولًا</button></fieldset>`).join('');
    $$('[data-f]',$('#cases')).forEach(i=>i.oninput=()=>{const c=C[+i.dataset.c];if(i.dataset.o!=null)c.opinions[+i.dataset.o][i.dataset.f]=i.value;else c[i.dataset.f]=i.value});
    $$('[data-tone]').forEach(b=>b.onclick=()=>{const[ci,oi,k]=b.dataset.tone.split('.');C[ci].opinions[oi].tone=k;draw()});
    $$('[data-mj]').forEach(b=>b.onclick=()=>{const[ci,oi,k]=b.dataset.mj.split('.');const a=C[ci].opinions[oi].maraji;const j=a.indexOf(k);j<0?a.push(k):a.splice(j,1);b.classList.toggle('on')});
    $$('[data-ao]').forEach(b=>b.onclick=()=>{C[+b.dataset.ao].opinions.push({ruling:'',tone:'no',maraji:[],note:''});draw()});
    $$('[data-ro]').forEach(b=>b.onclick=()=>{const[ci,oi]=b.dataset.ro.split('.');C[ci].opinions.splice(oi,1);draw()});
    $$('[data-rc]').forEach(b=>b.onclick=()=>{C.splice(+b.dataset.rc,1);draw()});
  };
  draw();
  $('#addc').onclick=()=>{C.push({label:'',opinions:[{ruling:'',tone:'no',maraji:[],note:''}]});draw()};
  $('#cf').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);const q=String(f.get('q')).trim();
    const cases=C.map(c=>({label:c.label.trim(),opinions:c.opinions.filter(o=>o.ruling.trim()).map(o=>{const r={ruling:o.ruling.trim(),tone:o.tone,maraji:o.maraji.slice()};if(o.note&&o.note.trim())r.note=o.note.trim();return r})})).filter(c=>c.opinions.length);
    if(!gateCheck()){toast('أكمل التوثيق: المصدر ورقم الصفحة وصورة العبارة');$('#gate').scrollIntoView({behavior:'smooth'});return}
    if(!q){toast('اكتب نص المسألة');return}
    if(!cases.length){toast('أضف قولًا واحدًا على الأقل');return}
    cases.forEach(c=>{if(!c.label)delete c.label});
    const L=CU.all();const n=ex?ex.n:CU.nextN();
    const item={id:'custom-'+String(n).padStart(3,'0'),n,q,station:f.get('station'),source:DOC.source,page:DOC.page,img:DOC.img,note:String(f.get('note')).trim(),cases,
      date:ex?ex.date:new Date().toLocaleDateString('ar-KW-u-nu-latn',{year:'numeric',month:'2-digit',day:'2-digit'}),updated:new Date().toISOString()};
    if(ex)L.splice(L.indexOf(ex),1,item);else L.push(item);
    try{CU.save(L)}catch(err){toast('تعذّر الحفظ: مساحة الجهاز ممتلئة، جرّب صورة أصغر');return}
    SFX.play('save');toast('حُفظت المسألة ودُمجت في الدليل');setTimeout(()=>CU.apply('#/issue/'+item.id),450);
  };
  };
  if(ex&&ex.source&&ex.page&&ex.img)openForm();
});

document.head.insertAdjacentHTML('beforeend',`<style>
.docgate{border-color:var(--gold)}
.cform input[type=file]{display:none}
.gh{display:flex;align-items:center;gap:10px;margin-bottom:6px;font-family:var(--head);color:var(--gold2);font-size:1.05rem}
.step{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:var(--gold);color:var(--ink);font-weight:700}
.req{color:var(--yes)}
.upl{margin-top:6px;border:2px dashed var(--line2);border-radius:14px;min-height:110px;display:grid;place-items:center;cursor:pointer;color:var(--muted);font-weight:400;padding:8px;text-align:center}
.upl img{max-height:260px;border-radius:10px;margin:auto}
.docsum{font-size:.88rem;color:var(--muted);background:rgba(0,0,0,.2);border:1px solid var(--line);border-radius:12px;padding:8px 10px;margin:0 0 12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.docsum img{height:42px;border-radius:6px;margin-inline-start:auto}
.cform label{display:block;margin:0 0 12px;font-weight:700;color:var(--gold2)}
.cform textarea,.cform input{display:block;width:100%;margin-top:6px;background:var(--bg2);color:var(--text);border:1px solid var(--line);border-radius:12px;padding:10px 12px;font:inherit;font-weight:400}
.cform textarea:focus,.cform input:focus{outline:2px solid var(--gold);border-color:transparent}
.cform .sel{margin-top:6px;width:100%}
.cbox{border:1px solid var(--line2);border-radius:16px;padding:10px 12px 12px;margin:0 0 12px}
.cbox legend{padding:0 8px;color:var(--gold2);font-family:var(--head);font-weight:700}
.obox{border:1px solid var(--line);border-inline-start:4px solid var(--det);border-radius:14px;padding:10px;margin:10px 0;background:rgba(0,0,0,.18)}
.obox.yes{border-inline-start-color:var(--yes)} .obox.no{border-inline-start-color:var(--no)} .obox.ihtiyat{border-inline-start-color:var(--iht)}
.tones,.mjs{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.mjs{max-height:150px;overflow:auto;padding:2px}
.cform .chip.on{background:var(--gold);color:var(--ink);border-color:var(--gold)}
.cform .chip.on.t-yes{background:var(--yes);border-color:var(--yes);color:#fff}.cform .chip.on.t-no{background:var(--no);border-color:var(--no);color:#06240f}.cform .chip.on.t-detail{background:var(--det);border-color:var(--det);color:#062030}
.x{border:0;background:rgba(239,68,68,.15);color:#fca5a5;border-radius:8px;padding:2px 8px;cursor:pointer;font:inherit}
.cu a{color:inherit;text-decoration:none}

</style>`);
