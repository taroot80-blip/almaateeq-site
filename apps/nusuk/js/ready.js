// اختبارات جاهزية الحاج: لكل منسك مسابقة من 14 بطاقة مقلوبة بأساليب متعددة،
// النجاح بنسبة 90٪ فأكثر → «تقبّل الله حجّك مقدّمًا»، وإلا → «لا تغامر بحجّتك».
'use strict';
(function(){
const N=14, PASS=90;
Object.assign(I,{ready:'<rect x="4" y="5" width="7" height="9" rx="1.5"/><rect x="13" y="5" width="7" height="9" rx="1.5"/><path d="M6.5 18.5l2 2 4-4"/>'});

const css=`.rgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(74px,1fr));gap:10px;margin-top:12px}
.rcard{aspect-ratio:3/4;perspective:700px;border:0;background:none;padding:0;cursor:pointer}
.rcard .in{display:block;position:relative;width:100%;height:100%;transition:transform .5s;transform-style:preserve-3d}
.rcard.flip .in{transform:rotateY(180deg)}
.rcard .f,.rcard .b{position:absolute;inset:0;border-radius:14px;display:grid;place-items:center;backface-visibility:hidden;font:800 1.3rem var(--head)}
.rcard .f{background:linear-gradient(160deg,#3a2a10,#1a120b);border:1.5px solid var(--line);color:var(--gold2);box-shadow:0 4px 0 #0005,inset 0 1px 0 #fff2}
.rcard .b{transform:rotateY(180deg);border:1.5px solid var(--line);background:#1a120b;font-size:1.6rem}
.rcard.ok .b{background:var(--no);color:#05240f}.rcard.bad .b{background:var(--yes);color:#fff}
.rq{margin-top:14px}.rq .tf{display:flex;gap:10px}.rq .tf .opt{justify-content:center}
.rord li{display:flex;gap:8px;align-items:center;margin:6px 0}.rord .t{flex:1;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:#ffffff08}
.rres{text-align:center}.rres .big{font:900 2.4rem var(--head)}.rres .verdict{font:900 1.5rem/1.6 var(--head);margin:10px 0}
.rres.pass .verdict{color:var(--gold2)}.rres.fail .verdict{color:#ff8a7a}`;
document.head.insertAdjacentHTML('beforeend','<style>'+css+'</style>');

const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const LV={m:'متوسط',s:'ثانوية',u:'جامعة',g:'دراسات عليا'};
const LVD={m:'أساسيات سهلة متفق عليها',s:'أحكام متفق عليها أوسع',u:'مسائل الأشجار المتفق عليها بين المراجع',g:'مسائل خلافية: اختر رأي مرجعك'};
const lvl=()=>store.get('readyLv','m');
// كل حالات الأشجار في المنسك: المتفق عليه (رأي واحد) والمختلف فيه (أكثر من رأي)
function cases(st){const out=[];
  for(const [k,r] of Object.entries(RUL)){const it=keyIssue(k);if(!it||it.station!==st)continue;
    r.cases.forEach(c=>{const ops=c.opinions.filter(o=>o.maraji.length&&o.ruling);if(!ops.length)return;
      const uniq=[...new Set(ops.map(o=>o.ruling))];out.push({k,r,c,it,ops,uniq})})}
  return shuffle(out)}
const head=x=>`${x.r.q}${x.c.label&&x.c.label!==x.r.q?' — '+x.c.label:''}`;
function questions(st,lv){
  if(lv==='m'||lv==='s'){const own=((window.READY_QUIZ||{})[st]||{})[lv]||[];
    return shuffle(own).slice(0,N).map(q=>q.t==='mcq'?{...q,opts:shuffle(q.opts.map((o,j)=>({o,ok:j===q.a})))}:q).map(q=>q.t==='mcq'?{...q,a:q.opts.findIndex(x=>x.ok),opts:q.opts.map(x=>x.o)}:q)}
  const all=cases(st),Q=[];
  if(lv==='u'){// المتفق عليه: حكم واحد عند كل المذكورين
    const agreed=all.filter(x=>x.uniq.length===1),others=all.map(x=>x.uniq[0]);
    agreed.forEach((x,i)=>{if(Q.length>=N)return;const right=x.uniq[0];
      const wrong=shuffle(others.filter(o=>o!==right)).filter((o,j,a)=>a.indexOf(o)===j).slice(0,3);if(wrong.length<2)return;
      if(i%3===2){const truth=Math.random()<.5,shown=truth?right:wrong[0];Q.push({t:'tf',q:`${head(x)}\nالحكم: «${shown}»`,a:truth,why:'الصواب: '+right,src:x})}
      else{const opts=shuffle([right,...wrong]);Q.push({t:'mcq',q:head(x)+'؟',opts,a:opts.indexOf(right),src:x})}});
    return Q}
  // دراسات عليا: المختلف فيه — الأقوال كلها خيارات، والفائز من اختار رأي مرجعه
  const m=mine();if(!m)return null;
  all.filter(x=>x.uniq.length>1).forEach(x=>{if(Q.length>=N)return;const o=x.ops.find(o=>o.maraji.includes(m));if(!o)return;
    const opts=shuffle(x.uniq).slice(0,5);if(!opts.includes(o.ruling))opts[0]=o.ruling;const fin=shuffle(opts);
    Q.push({t:'mcq',q:`${head(x)}؟\n(اختر رأي مرجعك: ${mjName(m)})`,opts:fin,a:fin.indexOf(o.ruling),why:(o.notes||{})[m]||'',src:x})});
  return Q}
const stList=()=>{const keys=[...new Set([...Object.keys(window.READY_QUIZ||{}),...Object.keys(RUL).map(k=>keyIssue(k)?.station).filter(Boolean)])];
  const order=Object.keys(STATIONS);return keys.filter(k=>STATIONS[k]).sort((a,b)=>order.indexOf(a)-order.indexOf(b))};

route(/^\/ready$/,()=>{
  const best=store.get('ready',{}),L=lvl();
  view(topbar('اختبارات جاهزية الحاج','/')+`<div class="card pad"><p class="muted" style="margin-top:0">لكل منسك مسابقة من ${AR(N)} بطاقة مقلوبة بأساليب متعددة. اقلب البطاقات وأجب عنها كلها؛ النجاح بـ${AR(PASS)}٪ فأكثر.</p>
    <div class="seg" id="lv">${Object.entries(LV).map(([k,n])=>`<button class="${k===L?'on':''}" data-l="${k}">${n}</button>`).join('')}</div>
    <p class="dim">${LVD[L]}${L==='g'?` — مرجعك: <b>${mine()?mjName(mine()):'لم يُحدَّد بعد (من «التخصيص»)'}</b>`:''}</p></div>
    <div class="grid">${stList().map(k=>{const s=STATIONS[k],b=best[k+':'+L];return tile('#/ready/'+k,s.icon,s.name,b!=null?(b>=PASS?'✅ ناجح ':'آخر نتيجة ')+AR(b)+'٪':'لم يُختبر بعد')}).join('')}</div>`);
  $$('#lv button').forEach(b=>b.onclick=()=>{store.set('readyLv',b.dataset.l);render()});
});

route(/^\/ready\/(\w+)$/,st=>{
  const s=STATIONS[st];if(!s)return location.hash='#/ready';
  const L=lvl(),Q=questions(st,L);
  if(Q===null){view(topbar('جاهزية: '+s.name,'/ready')+`<div class="card empty">مستوى «دراسات عليا» يسألك عن رأي مرجعك، فاختر مرجعك أولًا من <a href="#/settings">التخصيص</a>.</div>`);return}
  if(Q.length<N){view(topbar('جاهزية: '+s.name,'/ready')+`<div class="card empty">أسئلة هذا المنسك في مستوى «${LV[L]}» لم تكتمل بعد (${AR(Q.length)} من ${AR(N)})؛ تُضاف قريبًا بإذن الله. جرّب مستوى آخر.</div>`);return}
  const ans=Array(N).fill(null);
  view(topbar('جاهزية: '+s.name+' — '+LV[L],'/ready')+`<div class="card pad"><div class="prog"><i id="rp"></i></div><p class="dim" id="rc"></p>
    <div class="rgrid">${Q.map((q,i)=>`<button class="rcard" data-i="${i}"><span class="in"><span class="f">${AR(i+1)}</span><span class="b"></span></span></button>`).join('')}</div>
    <div class="rq" id="rq"></div></div>`);
  const prog=()=>{const n=ans.filter(x=>x!=null).length;$('#rp').style.width=n/N*100+'%';$('#rc').textContent=`أجبتَ عن ${AR(n)} من ${AR(N)} — اقلب بطاقة`};prog();
  $$('.rcard').forEach(c=>c.onclick=()=>{const i=+c.dataset.i;if(ans[i]!=null)return;$$('.rcard').forEach(x=>{if(ans[+x.dataset.i]==null)x.classList.remove('flip')});c.classList.add('flip');ask(i)});
  function settle(i,ok){ans[i]=ok;const c=$(`.rcard[data-i="${i}"]`);c.classList.add(ok?'ok':'bad');$('.b',c).textContent=ok?'✓':'✗';prog();
    navigator.vibrate&&navigator.vibrate(ok?20:[40,40,40]);SFX.play(ok?'right':'wrong');
    if(ans.every(x=>x!=null))setTimeout(done,700)}
  function ask(i){const q=Q[i],box=$('#rq');
    const why=q.why||q.src?`<div class="note" id="rw" hidden>${q.why?esc(q.why):''}${q.src?`<br><span class="dim">${esc(q.src.r.source||'المشجّرة')} | ${slideLbl(q.src.it,keyPage(q.src.k))}</span>`:''}</div>`:'';
    const qq=`<p class="dim">البطاقة ${AR(i+1)}</p><div class="qq" style="white-space:pre-line">${esc(q.q)}</div>`;
    if(q.t==='tf'){box.innerHTML=qq+`<div class="tf"><button class="btn ghost opt" data-v="1">صح</button><button class="btn ghost opt" data-v="0">خطأ</button></div>`+why;
      $$('.opt',box).forEach(b=>b.onclick=()=>{const ok=(b.dataset.v==='1')===q.a;$$('.opt',box).forEach(x=>{x.disabled=true;if((x.dataset.v==='1')===q.a)x.classList.add('right');else if(x===b)x.classList.add('wrong')});reveal();settle(i,ok)})}
    else if(q.t==='order'){let cur=shuffle(q.items);const draw=()=>{box.innerHTML=qq+`<ol class="rord">${cur.map((t,j)=>`<li><span class="t">${esc(t)}</span><button class="btn sm ghost" data-u="${j}">▲</button><button class="btn sm ghost" data-d="${j}">▼</button></li>`).join('')}</ol><button class="btn" id="rok">تأكيد الترتيب</button>`+why;
        $$('[data-u]',box).forEach(b=>b.onclick=()=>{const j=+b.dataset.u;if(j>0){[cur[j-1],cur[j]]=[cur[j],cur[j-1]];draw()}});
        $$('[data-d]',box).forEach(b=>b.onclick=()=>{const j=+b.dataset.d;if(j<cur.length-1){[cur[j+1],cur[j]]=[cur[j],cur[j+1]];draw()}});
        $('#rok').onclick=()=>{const ok=cur.every((t,j)=>t===q.items[j]);$('#rok').disabled=true;$$('[data-u],[data-d]',box).forEach(x=>x.disabled=true);
          if(!ok){const w=$('#rw')||box.appendChild(Object.assign(document.createElement('div'),{className:'note',id:'rw'}));w.innerHTML='<b>الترتيب الصحيح:</b> '+q.items.map(esc).join(' ← ')+(q.why?'<br>'+esc(q.why):'')}
          reveal();settle(i,ok)}};draw()}
    else{box.innerHTML=qq+q.opts.map((o,j)=>`<button class="btn ghost opt" data-j="${j}">${esc(o)}</button>`).join('')+why;
      $$('.opt',box).forEach(b=>b.onclick=()=>{const ok=+b.dataset.j===q.a;$$('.opt',box).forEach(x=>{x.disabled=true;if(+x.dataset.j===q.a)x.classList.add('right');else if(x===b)x.classList.add('wrong')});reveal();settle(i,ok)})}
    box.scrollIntoView({behavior:'smooth',block:'nearest'})}
  function reveal(){const w=$('#rw');if(w&&w.textContent.trim())w.hidden=false}
  function done(){const score=ans.filter(Boolean).length,pct=Math.round(score/N*100),pass=pct>=PASS;
    const best=store.get('ready',{});best[st+':'+L]=pct;store.set('ready',best);
    SFX.play(pass?'bell':'wrong');
    $('#rq').innerHTML=`<div class="card pad fade rres ${pass?'pass':'fail'}"><div class="big">${AR(pct)}٪</div><p>${AR(score)} من ${AR(N)} إجابة صحيحة</p>
      <div class="verdict">${pass?'تقبّل الله حجّك مقدّمًا 🤲':'لا تغامر بحجّتك ⚠️'}</div>
      ${pass?'':`<p class="muted">راجع مسائل «${esc(s.name)}» ثم أعد الاختبار؛ النجاح بـ${AR(PASS)}٪.</p>`}
      <div class="row" style="justify-content:center"><button class="btn" onclick="render()">إعادة الاختبار</button><a class="btn ghost" href="#/station/${st}">مسائل المنسك</a><a class="btn ghost" href="#/ready">المناسك</a></div></div>`;
    $('#rq').scrollIntoView({behavior:'smooth'})}
});
})();
