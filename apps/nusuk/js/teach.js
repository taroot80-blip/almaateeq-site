// وضع تدريس الحجاج: عرض تقديمي بملء الشاشة من أشجار الفتوى والشرائح الأصلية، يصلح للبروجكتر أو الشاشة الكبيرة أو الجوال.
// يتحكم فيه بالأسهم أو المسافة أو جهاز التقليب (Clicker) أو السحب، مع وضع «كشف الأقوال» واحدًا واحدًا للتشويق.
// دروس الباوربوينت: تُضاف في data/lessons.js على شكل صور شرائح حين تصل ملفاتها.
'use strict';
window.LESSONS=window.LESSONS||[];
const T={deck:[],i:0,step:0,reveal:true,orig:true,mj:null,t0:0};
const teachTopics=()=>{const out=[];Object.entries(STATIONS).forEach(([k,s])=>{const n=(s.topics||[k]).flatMap(t=>byStation(t)).filter(it=>rulingsOf(it).length).length;if(n)out.push([k,s.name,s.icon,n])});
  Object.entries(TOPICS).forEach(([k,s])=>{const n=byStation(k).filter(it=>rulingsOf(it).length).length;if(n&&!out.some(o=>o[0]===k))out.push([k,s.name,s.icon,n])});return out};

route(/^\/teach$/,()=>{
  const m=store.get('teachMj',mine()||'');
  view(topbar('تدريس الحجاج','/')+`
  <div class="card pad"><p class="muted" style="margin-top:0">اختر الباب فيتحوّل إلى عرض تقديمي: شريحة للمسألة، ثم أقوال المراجع تُكشف واحدًا واحدًا، ثم المشجّرة الأصلية. اعرضه على شاشة القاعة أو البروجكتر، وتنقّل بالأسهم أو جهاز التقليب أو السحب.</p>
    <div class="row" style="flex-wrap:nowrap"><span class="dim" style="white-space:nowrap">إبراز مرجع:</span><select id="tmj" class="sel"><option value="">— دون —</option>${window.MARAJI.map(x=>`<option value="${x.id}" ${x.id===m?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div>
    <div class="row" style="margin-top:10px"><label class="chip"><input type="checkbox" id="trev" ${store.get('teachRev',true)?'checked':''}> كشف الأقوال تدريجيًا</label>
      <label class="chip"><input type="checkbox" id="torig" ${store.get('teachOrig',true)?'checked':''}> إلحاق المشجّرة الأصلية</label></div></div>
  ${window.LESSONS.length?`<div class="h2">دروس الباوربوينت</div><div class="grid">${window.LESSONS.map((l,i)=>tile('#/teach/play/lesson/'+i,'book',l.title,AR(l.slides.length)+' شريحة')).join('')}</div>`
    :`<div class="note">دروس الباوربوينت تُضاف هنا حين تصل ملفاتها، وتُعرض بالطريقة نفسها.</div>`}
  <div class="h2">أبواب الأحكام</div>
  <div class="grid">${teachTopics().map(([k,n,ic,c])=>tile('#/teach/play/topic/'+k,ic,n,AR(c)+' مسألة مشجّرة')).join('')}</div>`);
  $('#tmj').onchange=()=>store.set('teachMj',$('#tmj').value);
  $('#trev').onchange=()=>store.set('teachRev',$('#trev').checked);$('#torig').onchange=()=>store.set('teachOrig',$('#torig').checked);
});

function buildDeck(kind,k){const D=[];
  if(kind==='lesson'){const L=window.LESSONS[+k];if(!L)return D;D.push({t:'title',title:L.title,sub:L.sub||''});L.slides.forEach(src=>D.push({t:'img',src}));return D}
  const s=STATIONS[k]||TOPICS[k];if(!s)return D;
  const list=(s.topics||[k]).flatMap(t=>byStation(t)).filter(it=>rulingsOf(it).length);
  D.push({t:'title',title:s.name,sub:`${AR(list.length)} مسألة | مرشد النسك`});
  list.forEach(it=>{rulingsOf(it).forEach(([p,r])=>{
    D.push({t:'q',it,q:r.q});
    r.cases.forEach(c=>D.push({t:'case',it,q:r.q,c,src:r.source||''}));
    if(T.orig&&!it.custom)D.push({t:'img',src:slideSrc(it.book,p),cap:r.q})})});
  D.push({t:'title',title:'والحمد لله رب العالمين',sub:'تقبّل الله أعمالكم'});return D}

route(/^\/teach\/play\/(topic|lesson)\/(\w+)$/,(kind,k)=>{
  T.mj=store.get('teachMj','')||null;T.reveal=store.get('teachRev',true);T.orig=store.get('teachOrig',true);
  T.deck=buildDeck(kind,k);if(!T.deck.length)return go('/teach');T.i=0;T.step=0;T.t0=Date.now();
  const old=$('#tstage');if(old)old.remove();
  document.body.insertAdjacentHTML('beforeend',`<div id="tstage" tabindex="0"><div id="sl"></div>
    <div class="tbar"><button class="tb" id="t_exit" title="خروج">✕</button><button class="tb" id="t_fs" title="ملء الشاشة">⛶</button>
      <button class="tb" id="t_black" title="شاشة سوداء (B)">⬛</button><span id="t_pos"></span><span id="t_clock"></span>
      <button class="tb" id="t_prev">‹ السابق</button><button class="tb main" id="t_next">التالي ›</button></div>
    <div class="tprog"><i id="t_pb"></i></div></div>`);
  document.body.classList.add('teaching');drawT();$('#tstage').focus();
  $('#t_next').onclick=()=>stepT(1);$('#t_prev').onclick=()=>stepT(-1);
  $('#t_exit').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();go('/teach')};
  $('#t_fs').onclick=()=>{const e=$('#tstage');document.fullscreenElement?document.exitFullscreen():(e.requestFullscreen&&e.requestFullscreen().catch(()=>{}))};
  $('#t_black').onclick=()=>$('#tstage').classList.toggle('black');
  let x0=null;$('#sl').addEventListener('touchstart',e=>x0=e.touches[0].clientX,{passive:true});
  $('#sl').addEventListener('touchend',e=>{if(x0==null)return;const dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>50)stepT(dx>0?1:-1);x0=null});
  $('#sl').onclick=e=>{if(!e.target.closest('a,button'))stepT(1)};
  clearInterval(T.clk);T.clk=setInterval(()=>{const c=$('#t_clock');if(!c){clearInterval(T.clk);return}const s=Math.floor((Date.now()-T.t0)/1000);c.textContent=AR(Math.floor(s/60))+':'+AR(String(s%60).padStart(2,'0'))},1000);
});
addEventListener('hashchange',()=>{if(!location.hash.startsWith('#/teach/play')){document.body.classList.remove('teaching');const st=$('#tstage');if(st)st.remove()}});
document.addEventListener('keydown',e=>{if(!$('#tstage'))return;
  if(['ArrowLeft','PageDown',' ','Enter','ArrowDown'].includes(e.key)){e.preventDefault();stepT(1)}
  else if(['ArrowRight','PageUp','ArrowUp','Backspace'].includes(e.key)){e.preventDefault();stepT(-1)}
  else if(e.key==='b'||e.key==='B'||e.key==='.')$('#tstage').classList.toggle('black');
  else if(e.key==='f'||e.key==='F')$('#t_fs').click();
  else if(e.key==='Escape'&&!document.fullscreenElement)$('#t_exit').click()});

const opsOf=s=>s.t==='case'?s.c.opinions.length:0;
function stepT(d){const s=T.deck[T.i];
  if(d>0&&T.reveal&&s.t==='case'&&T.step<opsOf(s)){T.step++;SFX.play('open');drawT(true);return}
  if(d<0&&T.reveal&&s.t==='case'&&T.step>0){T.step--;drawT(true);return}
  const n=T.i+d;if(n<0||n>=T.deck.length)return;T.i=n;
  const ns=T.deck[n];T.step=d<0&&T.reveal&&ns.t==='case'?opsOf(ns):0;SFX.play(ns.t==='img'?'bell':'tap');drawT()}
function drawT(keep){const s=T.deck[T.i],sl=$('#sl');if(!sl)return;
  const shown=T.reveal?T.step:99;
  let h='';
  if(s.t==='title')h=`<div class="ts-title"><div class="orn">✦</div><h1>${esc(s.title)}</h1><p>${esc(s.sub||'')}</p></div>`;
  else if(s.t==='q')h=`<div class="ts-q"><small>${esc(stationName(s.it.station))}</small><h2>${esc(s.q)}</h2><p class="hint">ما الحكم؟ ناقش الحجاج قبل كشف الأقوال</p></div>`;
  else if(s.t==='case')h=`<div class="ts-case"><div class="cq">${esc(s.q)}</div>${s.c.label?`<div class="cl">${esc(s.c.label)}</div>`:''}
    <div class="cops">${s.c.opinions.map((o,j)=>`<div class="cop ${o.tone} ${j<shown?'on':''} ${T.mj&&o.maraji.includes(T.mj)?'hl':''}"><div class="r">${esc(o.ruling)}</div>
      <div class="m">${o.maraji.map(k=>`<span class="${k===T.mj?'me':''}">${mjName(k)}</span>`).join('')}</div>
      ${T.mj&&(o.notes||{})[T.mj]?`<div class="n">${mjName(T.mj)}: ${esc(o.notes[T.mj])}</div>`:''}</div>`).join('')}</div>
    ${T.reveal&&shown<s.c.opinions.length?`<p class="hint">اضغط «التالي» لكشف القول ${AR(shown+1)} من ${AR(s.c.opinions.length)}</p>`:''}
    ${s.src?`<div class="csrc">المصدر: ${esc(s.src)}</div>`:''}</div>`;
  else if(s.t==='img')h=`<div class="ts-img"><img src="${s.src}" alt="${esc(s.cap||'شريحة')}">${s.cap?`<p>${esc(s.cap)}</p>`:''}</div>`;
  sl.innerHTML=h;if(!keep)sl.scrollTop=0;
  $('#t_pos').textContent=AR(T.i+1)+' / '+AR(T.deck.length);$('#t_pb').style.width=((T.i+1)/T.deck.length*100)+'%';
  $('#t_prev').disabled=T.i===0&&T.step===0;$('#t_next').disabled=T.i===T.deck.length-1}

document.head.insertAdjacentHTML('beforeend',`<style>
body.teaching .dock,body.teaching #sosfab,body.teaching .scenes{display:none!important}
#tstage{position:fixed;inset:0;z-index:40;background:radial-gradient(120% 80% at 50% 0%,#2a1d12,#0b0805 70%);display:flex;flex-direction:column;outline:none}
#tstage.black #sl,#tstage.black .tprog{visibility:hidden}#tstage.black{background:#000}
#sl{flex:1;overflow:auto;display:flex;align-items:center;justify-content:center;padding:max(16px,3vh) max(16px,4vw)}
#sl>div{width:100%;max-width:1200px;margin:auto}
.ts-title{text-align:center}.ts-title .orn{color:var(--gold);font-size:clamp(28px,5vw,60px)}
.ts-title h1{font:700 clamp(30px,6vw,84px)/1.3 var(--head);color:var(--gold2);margin:.2em 0}.ts-title p{color:var(--muted);font-size:clamp(16px,2.4vw,30px)}
.ts-q{text-align:center}.ts-q small{color:var(--teal);font-size:clamp(14px,2vw,24px)}
.ts-q h2{font:700 clamp(26px,4.6vw,64px)/1.5 var(--head);color:var(--text);margin:.4em 0;text-wrap:balance}
.hint{color:var(--dim);text-align:center;font-size:clamp(13px,1.6vw,20px)}
.ts-case .cq{font:700 clamp(18px,2.6vw,34px)/1.5 var(--head);color:var(--gold2);text-align:center}
.ts-case .cl{text-align:center;margin:.5em auto;padding:.3em 1em;border-radius:14px;background:rgba(56,189,248,.12);border:1px solid rgba(56,189,248,.4);font-size:clamp(15px,2vw,26px);width:fit-content;max-width:100%}
.cops{display:grid;gap:clamp(8px,1.4vw,18px);margin-top:clamp(10px,2vw,24px);grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))}
.cop{border-radius:18px;overflow:hidden;border:1px solid var(--line);background:var(--card2);opacity:.08;transform:translateY(12px);transition:opacity .45s,transform .45s}
.cop.on{opacity:1;transform:none}
.cop .r{padding:.6em .9em;font:700 clamp(17px,2.3vw,32px)/1.5 var(--body)}
.cop.yes .r{background:var(--yes);color:#fff}.cop.no .r{background:var(--no);color:#05240f}.cop.ihtiyat .r{background:var(--iht);color:var(--ink)}.cop.detail .r{background:var(--det);color:#04202e}
.cop .m{display:flex;flex-wrap:wrap;gap:.4em;padding:.6em .9em;font-size:clamp(14px,1.8vw,24px)}
.cop .m span{padding:.1em .6em;border-radius:999px;background:rgba(242,182,50,.12);border:1px solid var(--line)}
.cop .m span.me{background:var(--gold);color:var(--ink);font-weight:700}
.cop.hl{box-shadow:0 0 0 3px var(--gold),0 0 30px rgba(242,182,50,.35)}
.cop .n{padding:0 .9em .7em;color:var(--muted);font-size:clamp(13px,1.6vw,20px)}
.csrc{color:var(--dim);text-align:center;margin-top:1em;font-size:clamp(11px,1.3vw,16px)}
.ts-img{text-align:center}.ts-img img{max-height:calc(100vh - 140px);width:auto;max-width:100%;margin:auto;border-radius:12px;background:#fff}
.ts-img p{color:var(--muted);margin:.5em 0 0}
.tbar{display:flex;gap:8px;align-items:center;padding:8px max(12px,env(safe-area-inset-right)) calc(8px + var(--safe-b));background:rgba(0,0,0,.45)}
.tb{white-space:nowrap;min-height:44px;padding:0 14px;border-radius:12px;border:1px solid var(--line2);background:var(--card);color:var(--gold2);font-weight:700;cursor:pointer}
.tb.main{background:var(--gold);color:var(--ink)}.tb:disabled{opacity:.4}
@media (max-width:520px){#t_clock{display:none}.tb{padding:0 10px}}
#t_pos,#t_clock{color:var(--muted);font-variant-numeric:tabular-nums}#t_pos{margin-inline-start:auto}
.tprog{height:4px;background:rgba(255,255,255,.08)}.tprog i{display:block;height:100%;background:var(--gold);transition:width .3s}
</style>`);
