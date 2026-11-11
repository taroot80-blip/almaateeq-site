// الأصوات (مولَّدة بـ Web Audio، تعمل دون إنترنت ودون ملفات) + علامة الاتصال بالإنترنت 📶
'use strict';
Object.assign(I,{
  plus:'<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  wifi:'<path d="M2 8.5a15 15 0 0120 0"/><path d="M5 12a10 10 0 0114 0"/><path d="M8.5 15.5a5 5 0 017 0"/><circle cx="12" cy="19" r="1.2" fill="currentColor"/>',
  wifioff:'<path d="M2 8.5a15 15 0 0120 0"/><path d="M5 12a10 10 0 0114 0"/><path d="M8.5 15.5a5 5 0 017 0"/><circle cx="12" cy="19" r="1.2" fill="currentColor"/><path d="M3 3l18 18"/>',
  vol:'<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 010 6"/><path d="M18.5 6.5a8 8 0 010 11"/>',
  mute:'<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9l5 6M21 9l-5 6"/>',
});

/* ---------- محرّك الأصوات ---------- */
const SFX=(()=>{
  let ctx=null;
  const on=()=>store.get('sfx',true);
  const ac=()=>{if(!ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;ctx=new C()}if(ctx.state==='suspended')ctx.resume();return ctx};
  // نغمة واحدة: تردد، بداية، مدة، نوع الموجة، شدة، انزلاق تردد اختياري
  const tone=(f,t0,d,type='sine',g=.18,f2)=>{const c=ac();if(!c)return;const t=c.currentTime+t0,o=c.createOscillator(),v=c.createGain();
    o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);
    v.gain.setValueAtTime(0,t);v.gain.linearRampToValueAtTime(g,t+.008);v.gain.exponentialRampToValueAtTime(.0001,t+d);
    o.connect(v).connect(c.destination);o.start(t);o.stop(t+d+.02)};
  // نفحة هواء مرشَّحة (للانسدال والطيّ)
  const air=(t0,d,from,to,g=.10)=>{const c=ac();if(!c)return;const t=c.currentTime+t0,n=Math.floor(c.sampleRate*d),b=c.createBuffer(1,n,c.sampleRate),a=b.getChannelData(0);
    for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*(1-i/n);const s=c.createBufferSource(),f=c.createBiquadFilter(),v=c.createGain();
    s.buffer=b;f.type='bandpass';f.Q.value=1.4;f.frequency.setValueAtTime(from,t);f.frequency.exponentialRampToValueAtTime(to,t+d);
    v.gain.setValueAtTime(g,t);v.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(f).connect(v).connect(c.destination);s.start(t)};
  const P={
    tap:   ()=>tone(1400,0,.045,'triangle',.07),
    choice:()=>{tone(660,0,.07,'triangle',.14);tone(990,.055,.09,'triangle',.12)},          // اختيار من متعدد
    right: ()=>{tone(784,0,.12,'sine',.16);tone(988,.09,.12,'sine',.15);tone(1319,.18,.22,'sine',.15)},
    wrong: ()=>{tone(311,0,.16,'square',.06);tone(233,.13,.24,'square',.06)},
    open:  ()=>{air(0,.16,500,2600,.09);tone(520,0,.12,'sine',.07,880)},                     // انسدال
    close: ()=>{air(0,.14,2400,450,.08);tone(820,0,.1,'sine',.06,480)},                     // طيّ
    search:()=>{tone(1046,0,.06,'sine',.08);tone(1568,.05,.08,'sine',.06)},                 // نتائج البحث
    // غالق الكاميرا لزر البحث بالصورة 📷: نقرة ميكانيكية ثم انزلاق الستارة
    shutter:()=>{air(0,.035,3000,6000,.22);tone(2200,0,.03,'square',.05);air(.06,.09,4500,1500,.16);tone(900,.06,.05,'triangle',.06)},
    mic:   ()=>{tone(880,0,.08,'sine',.12);tone(1320,.08,.12,'sine',.12)},
    // صوت المشجّرة المميّز: جرس صغير بنغمتين وتوافقيات تذوب ببطء
    // صوت زر 🔘 الخاص: ثلاث نغمات صاعدة كأجراس صغيرة مع رنين معدني خفيف — لا يُستعمل لغيره
    orb:   ()=>{[[659.3,0],[987.8,.11],[1318.5,.22]].forEach(([f,t],i)=>{tone(f,t,.9-i*.15,'sine',.15);tone(f*3.01,t,.35,'triangle',.035)});tone(1975.5,.34,1.1,'sine',.06);air(.3,.5,6000,9000,.02)},
    bell:  ()=>{[[880,0],[1318.5,.16]].forEach(([f,t])=>{tone(f,t,1.3,'sine',.16);tone(f*2.76,t,.6,'sine',.05);tone(f*5.4,t,.25,'sine',.025)})},
    save:  ()=>{tone(523,0,.1,'triangle',.13);tone(659,.08,.1,'triangle',.13);tone(784,.16,.18,'triangle',.14)},
  };
  return {play(k){if(!on())return;try{P[k]&&P[k]()}catch(e){}},on,toggle(){store.set('sfx',!on());if(on())P.choice();return on()}};
})();
window.SFX=SFX;

/* ---------- ربط الأصوات بالواجهة (تفويض أحداث، فلا حاجة لتعديل كل صفحة) ---------- */
document.addEventListener('click',e=>{
  const el=e.target.closest('button,a,summary,.chip,.slide,.thumbs img');if(!el)return;
  if(el.matches('.mushajjara,.mv,#qv,.tabs [data-t="slides"],#orb'))return SFX.play('orb');
  if(el.matches('.slide,.thumbs img'))return SFX.play('bell');
  if(el.matches('.opt')){
    const box=el.closest('.quiz');
    if(box)return setTimeout(()=>SFX.play(el.classList.contains('right')?'right':'wrong'),10);
    return SFX.play('choice');
  }
  if(el.matches('.op>button'))return SFX.play(el.parentElement.classList.contains('openn')?'close':'open');
  if(el.matches('summary'))return SFX.play(el.parentElement.open?'close':'open');
  if(el.matches('#mic'))return SFX.play('mic');
  if(el.matches('#cam'))return SFX.play('shutter');
  if(el.matches('[data-w]'))return SFX.play('search');
  if(el.matches('.sndbtn'))return;
  if(el.matches('.seg button,.tabs button,[data-f],[data-n],.chip'))return SFX.play('tap');
},true);
// البحث: نغمة خفيفة حين تتجدّد النتائج بعد الكتابة
document.addEventListener('input',e=>{if(e.target.id!=='q')return;clearTimeout(SFX.st);SFX.st=setTimeout(()=>SFX.play('search'),260)},true);
document.addEventListener('change',e=>{if(e.target.matches('select.sel'))SFX.play('tap')},true);

/* ---------- علامة الإنترنت 📶 ---------- */
// ما يحتاج الإنترنت في الدليل:
//  - البحث الصوتي (التعرّف على الكلام يتم على خوادم المتصفح)
//  - تنزيل الشرائح كلها للعمل دون اتصال
//  - فتح المشجّرة (صورة الشريحة) إن لم تكن نُزّلت أو فُتحت من قبل
// في تطبيق أندرويد الشرائح كلها مضمّنة، فلا يحتاج فتحها إنترنت
const netNeeded=()=>!window.NuskAndroid&&!window.NUSK_INLINE&&!store.get('slidesAll',0);
const wifiMark=title=>`<span class="netmark" title="${title}" aria-label="${title}">${ico('wifi')}</span>`;
function decorate(root=document){
  const h=$('header.top')||$('.hero');
  if(h&&!$('.hdrx',h))h.insertAdjacentHTML('beforeend',`<span class="hdrx"><span class="netstate" title=""></span><button class="iconbtn sndbtn" aria-label="الأصوات"></button></span>`);
  $$('.netstate').forEach(x=>{const ok=navigator.onLine;x.className='netstate '+(ok?'ok':'off');x.innerHTML=ico(ok?'wifi':'wifioff');x.title=ok?'متصل بالإنترنت':'دون إنترنت — الأحكام والأشجار متاحة، وبعض الخدمات المعلَّمة بـ📶 لا تعمل';});
  $$('.sndbtn').forEach(b=>{b.innerHTML=ico(SFX.on()?'vol':'mute');b.onclick=()=>{const v=SFX.toggle();toast(v?'الأصوات مفعّلة':'الأصوات مكتومة');decorate()}});
  const marks=[['#mic','البحث الصوتي يحتاج إنترنت'],['#dl','التنزيل يحتاج إنترنت']];
  if(netNeeded())marks.push(['.mushajjara','الشريحة الأصلية قد تحتاج إنترنت إن لم تُنزَّل'],['.tabs [data-t="slides"]','الشرائح قد تحتاج إنترنت إن لم تُنزَّل'],['.mv','الشريحة الأصلية قد تحتاج إنترنت'],['#qv','الشريحة الأصلية قد تحتاج إنترنت']);
  else $$('.netmark.sl').forEach(m=>m.remove());
  marks.forEach(([sel,t])=>$$(sel).forEach(el=>{if(!$('.netmark',el))el.insertAdjacentHTML('beforeend',wifiMark(t).replace('netmark','netmark'+(sel==='#mic'||sel==='#dl'?'':' sl')))}));
  $$('.tile').forEach(a=>{if(a.getAttribute('href')==='#/about'&&a.textContent.includes('دون إنترنت')&&!$('.netmark',a))a.insertAdjacentHTML('beforeend',wifiMark('يحتاج إنترنت للتنزيل'))});
}
new MutationObserver(()=>{clearTimeout(decorate.t);decorate.t=setTimeout(decorate,0)}).observe($('#app'),{childList:true,subtree:true});
addEventListener('online',()=>{decorate();toast('عاد الاتصال بالإنترنت')});
addEventListener('offline',()=>{decorate();toast('انقطع الإنترنت — الدليل يعمل بما حُفظ')});
document.addEventListener('nusk:net',decorate);

/* ---------- الأنماط ---------- */
document.head.insertAdjacentHTML('beforeend',`<style>
.hdrx{display:flex;gap:6px;align-items:center;margin-inline-start:auto}
.hero{position:relative}.hero>.hdrx{position:absolute;top:10px;inset-inline-end:10px;z-index:2}
.top{display:flex;align-items:center;gap:10px}
.netstate{display:grid;place-items:center;width:30px;height:30px;border-radius:10px}
.netstate svg{width:20px;height:20px}
.netstate.ok{color:var(--no)} .netstate.off{color:var(--yes);background:rgba(239,68,68,.12)}
.sndbtn svg{width:20px;height:20px;color:var(--gold2)}
.netmark{display:inline-grid;place-items:center;width:18px;height:18px;margin-inline-start:4px;border-radius:6px;background:rgba(56,189,248,.16);color:var(--det);vertical-align:middle}
.netmark svg{width:13px;height:13px}
.tile .netmark{position:absolute;top:8px;inset-inline-end:8px}
.tile{position:relative}
.mic .netmark{position:absolute;top:-4px;inset-inline-end:-4px;width:16px;height:16px}
.mic{position:relative}
.badge.new{background:rgba(56,189,248,.16);color:#7dd3fc;border:1px solid rgba(56,189,248,.45)}
</style>`);
decorate();
