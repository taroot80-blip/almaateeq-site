// المسائل المستجدة: يضيفها المرشد على جهازه، فتُدمج فورًا في الدليل (الفهرس، الأبواب، شجرة الفتوى، الباحث، المقارنة، الاختبار).
// تُحفظ في localStorage تحت nusk:custom، وتُصدَّر ملفَّ JSON لدمجها لاحقًا في النسخة العامة.
(function(){
  let list=[];
  try{list=JSON.parse(localStorage.getItem('nusk:custom')||'[]')||[]}catch(e){list=[]}
  window.CUSTOM_LIST=list;
  window.BOOKS.push({id:'custom',name:'المسائل المستجدة',pages:0});
  list.forEach(x=>{
    const ms=[...new Set(x.cases.flatMap(c=>c.opinions.flatMap(o=>o.maraji)))];
    window.ISSUES.push({id:x.id,book:'custom',pages:[x.n],title:x.q,toc:x.q,station:x.station,maraji:ms,custom:1,date:x.date});
    window.RULINGS[x.id]={q:x.q,cases:x.cases,note:x.note||'',source:(x.source||'')+(x.page?' | '+x.page:''),status:'custom'};
  });
})();

// بطاقة التوثيق في صفحة المسألة المستجدة: المصدر ورقم الصفحة وصورة العبارة
window.customDocHTML=id=>{const x=(window.CUSTOM_LIST||[]).find(y=>y.id===id);if(!x)return '';
  const e=t=>String(t||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  if(!(x.source&&x.page&&x.img))return '<div class="note">هذه المسألة غير موثّقة: افتح «تعديل» وأضف المصدر ورقم الصفحة وصورة العبارة.</div>';
  return `<details class="card pad" style="margin:10px 0" open><summary style="cursor:pointer;color:var(--gold2);font-weight:700">📄 التوثيق: ${e(x.source)} | ${e(x.page)}</summary>
    <img src="${x.img}" alt="صورة العبارة من المصدر" style="margin-top:10px;border-radius:12px;background:#fff;cursor:zoom-in" onclick="this.requestFullscreen&&this.requestFullscreen()"></details>`};
