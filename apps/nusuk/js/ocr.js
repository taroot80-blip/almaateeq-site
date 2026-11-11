// البحث بالصورة: يصوّر المرشد سؤالًا مكتوبًا أو صفحة كتاب أو رسالة، فيقرؤها التطبيق (Tesseract، عربي، دون إنترنت)
// ثم يقترح كلمات البحث الأدقّ ويعرض الأحكام.
'use strict';
const OCR={worker:null,
  base(){return (window.NUSK_OCR_BASE||'vendor/ocr/')},
  async load(){if(this.worker)return this.worker;
    if(!window.Tesseract)await new Promise((res,rej)=>{const s=document.createElement('script');s.src=this.base()+'tesseract.min.js';s.onload=res;s.onerror=rej;document.head.appendChild(s)});
    const b=new URL(this.base(),location.href).href;
    this.worker=await Tesseract.createWorker('ara',1,{workerPath:b+'worker.min.js',corePath:b+'core',langPath:b+'lang',gzip:true,cacheMethod:'none',
      logger:m=>{const st=$('#vst');if(st&&m.status==='recognizing text')st.textContent='📷 أقرأ الصورة… '+AR(Math.round(m.progress*100))+'٪'}});
    return this.worker},
};
const STOP=new Set(['في','من','على','عن','هل','ما','لو','اذا','او','ثم','حكم','مساله','مسأله','الى','إلى','التي','الذي','هذا','هذه','ذلك','كان','قد','لا','نعم','مع','بعد','قبل','عند','كل','بين','او','أو','و','يا','سماحه','السيد','الشيخ','السلام','عليكم','ورحمه','الله','وبركاته','حفظكم','دام','ظله']);
// اختيار كلمات البحث: الكلمات النادرة نسبيًا في الأشجار، بحيث تبقى نتيجة واحدة على الأقل
function pickTerms(text){
  const db=rulingsDB().map(r=>norm([r.q,r.label,r.ruling,r.text].join(' ')));
  const words=[...new Set(norm(text).split(/[^ء-ي]+/).filter(w=>w.length>=3&&!STOP.has(w)))];
  const scored=words.map(w=>{const t=terms(w)[0]||w;return [w,t,db.filter(x=>x.includes(t)).length]}).filter(x=>x[2]>0).sort((a,b)=>a[2]-b[2]);
  let pick=[];for(const [w,t] of scored){const tryT=[...pick.map(p=>p[1]),t];if(db.some(x=>tryT.every(k=>x.includes(k)))){pick.push([w,t]);if(pick.length>=3)break}}
  return {words:scored.map(x=>x[0]).slice(0,14),pick:pick.map(x=>x[0])};
}
document.addEventListener('click',async e=>{
  if(!e.target.closest('#cam'))return;
  const inp=$('#q'),st=$('#vst');if(!inp)return;
  if(window.NUSK_INLINE){st.textContent='📷 البحث بالصورة متاح في نسخة الموقع وتطبيق الجوال، لا في الملف المستقل.';return}
  const f=document.createElement('input');f.type='file';f.accept='image/*';f.setAttribute('capture','environment');
  f.onchange=async()=>{const file=f.files[0];if(!file)return;
    st.textContent='📷 أجهّز القارئ (أول مرة قد تأخذ ثواني)…';
    try{const w=await OCR.load();
      const img=await shrinkForOcr(file);
      const {data}=await w.recognize(img);const text=(data.text||'').replace(/\s+/g,' ').trim();
      if(!text){st.textContent='لم أستطع قراءة نص في الصورة؛ قرّب الكاميرا من السطر واجعل الإضاءة جيدة.';return}
      const {words,pick}=pickTerms(text);
      st.innerHTML=`<div class="card pad ocrbox"><small>قرأتُ من الصورة:</small><p>${esc(text.slice(0,400))}</p>
        <small>اضغط كلمة لإضافتها أو حذفها من البحث:</small><div class="row">${words.map(w=>`<span class="chip ${pick.includes(w)?'on':''}" data-ow="${esc(w)}">${esc(w)}</span>`).join('')}</div></div>`;
      const apply=()=>{inp.value=$$('[data-ow].on',st).map(c=>c.dataset.ow).join(' ');inp.dispatchEvent(new Event('input'))};
      $$('[data-ow]',st).forEach(c=>c.onclick=()=>{c.classList.toggle('on');apply()});
      apply();if(!pick.length)toast('لم أجد كلمات مطابقة؛ اختر كلمة أو اكتب البحث');
    }catch(err){console.error(err);st.textContent='تعذّر تشغيل القارئ على هذا الجهاز.'}};
  f.click();
});
// تصغير الصورة الكبيرة (كاميرا الجوال) لتسريع القراءة
function shrinkForOcr(file){return new Promise((res,rej)=>{const fr=new FileReader();fr.onerror=rej;fr.onload=()=>{const im=new Image();im.onerror=rej;im.onload=()=>{
  const k=Math.min(1,2000/Math.max(im.width,im.height)),cv=document.createElement('canvas');cv.width=Math.round(im.width*k);cv.height=Math.round(im.height*k);
  const x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,cv.width,cv.height);x.drawImage(im,0,0,cv.width,cv.height);res(cv)};im.src=fr.result};fr.readAsDataURL(file)})}
document.head.insertAdjacentHTML('beforeend',`<style>
.search .cam{font-size:20px;margin-inline-start:4px}
.ocrbox{margin-top:8px;font-size:.9rem}.ocrbox p{margin:4px 0 10px;color:var(--text);max-height:110px;overflow:auto}
.ocrbox .chip.on{background:var(--gold);color:var(--ink)}
</style>`);
