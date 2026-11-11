'use strict';
/* إضافات مرشد النسك: حلّال الحالات، مقارنة مرجعين، مشاركة الحكم صورة، اختبار المرشدين.
   تعتمد على تعريفات index.html (route, view, topbar, RUL, MJ, BYID, ISS, mine, store…). */

const keyIssue=k=>{const b=k.replace(/-\d+$/,''),p=+k.slice(-3);return ISS.find(x=>x.book===b&&x.pages.includes(p))};
const keyPage=k=>+k.slice(-3);
const opinionsFor=(r,m,ci)=>{const out=[];r.cases.forEach((c,i)=>{if(ci!=null&&i!==ci)return;c.opinions.forEach(o=>{if(o.maraji.includes(m))out.push({c,o,note:(o.notes||{})[m]||''})})});
  (r.notes||[]).forEach(n=>{if(n.k===m&&ci==null)out.push({c:{label:n.t||'حاشية'},o:{ruling:n.x,tone:'detail',maraji:[m]},note:''})});return out};
const mjSelect=(id,val,all)=>`<select id="${id}" class="sel">${all?`<option value="">— اختر —</option>`:''}${window.MARAJI.map(m=>`<option value="${m.id}" ${m.id===val?'selected':''}>${esc(m.name)}</option>`).join('')}</select>`;

/* ============ 1) حلّال الحالات ============ */
route(/^\/solver$/,()=>{
  view(topbar('حلّال الحالات','/')+`<div class="card pad muted" style="font-size:.92rem">أجب عن أسئلة قصيرة عن الحالة، فيصلك الحكم بحسب مرجعك مباشرةً مع مصدره والمشجّرة الأصلية.</div>
  <div class="grid" style="margin-top:12px">${Object.entries(SOLVER).map(([k,s])=>tile('#/solver/'+k,s.icon,s.name,s.desc)).join('')}</div>`);
});
route(/^\/solver\/(\w+)(?:\/(.*))?$/,(k,path)=>{
  const S=SOLVER[k];if(!S)return go('/solver');
  const steps=path?path.split('.').map(Number):[];
  let node=S.nodes[S.start],trail=[],res=null;
  for(const i of steps){const o=node.options[i];if(!o)break;trail.push([node.q,o.label]);if(o.result){res=o.result;break}node=S.nodes[o.next]}
  const m=mine();
  view(topbar(S.name,'/solver')+`
  <div class="row" style="margin-bottom:10px;flex-wrap:nowrap"><span class="dim" style="white-space:nowrap">مرجعك:</span>${mjSelect('smj2',m||'',true)}</div>
  ${trail.map(([q,a],i)=>`<a class="card crumbq" href="#/solver/${k}/${steps.slice(0,i).join('.')}"><small>${esc(q)}</small><b>${esc(a)}</b><span class="dim">تعديل</span></a>`).join('')}
  ${res?solverResult(res,m):`<div class="card pad qnode fade"><div class="qq">${esc(node.q)}</div>${node.options.map((o,i)=>`<a class="btn ghost opt" href="#/solver/${k}/${[...steps,i].join('.')}">${esc(o.label)}</a>`).join('')}</div>`}
  ${steps.length?`<div class="row" style="margin-top:12px"><a class="btn sm ghost" href="#/solver/${k}">ابدأ من جديد</a></div>`:''}`);
  $('#smj2').onchange=e=>{store.set('marja',e.target.value||null);render()};
  bindShare($('#app'));
});
function solverResult(res,m){
  const r=RUL[res.key],it=keyIssue(res.key);if(!r||!it)return `<div class="card empty">لم تُفرَّغ هذه المشجّرة بعد.</div>`;
  const p=keyPage(res.key),c=res.c!=null?r.cases[res.c]:null;
  const mineOps=m?opinionsFor(r,m,res.c):[];
  return `<div class="card pad fade solved">
    <div class="dim">${esc(r.q)}${c&&c.label?` — ${esc(c.label)}`:''}</div>
    ${m?(mineOps.length?mineOps.map(x=>`<div class="answer ${x.o.tone}"><small>رأي ${mjName(m)}</small><b>${esc(x.o.ruling)}</b>${x.note?`<p>${esc(x.note)}</p>`:''}
      <button class="btn sm ghost share" data-k="${res.key}" data-m="${m}" data-r="${esc(x.o.ruling)}" data-n="${esc(x.note)}" data-l="${esc(x.c.label||'')}">${ico('share')} شارك صورةً</button></div>`).join('')
      :`<div class="note">لم يُذكر رأي ${mjName(m)} في هذه المشجّرة${c?' لهذه الحالة':''}. أقوال المراجع الآخرين أدناه.</div>`)
     :`<div class="note">اختر مرجعك في الأعلى ليظهر حكمه مباشرةً.</div>`}
    <div class="h2" style="margin-top:16px">كل الأقوال</div>
    ${treeHTML(c?{...r,cases:[c]}:r,p,it)}
    <a class="btn sm" href="#/issue/${it.id}">افتح المسألة كاملة</a></div>`;
}

/* ============ 2) مقارنة مرجعين ============
   العبارات المتطابقة تُعرض نتيجةً (اتفاق). والمختلفة لا تُحسم آليًا: تُترك فارغة مع الإحالة إلى المشجّرة. */
route(/^\/compare(?:\/(\w+)\/(\w+))?$/,(a,b)=>{
  a=a||store.get('cmpA',mine()||'sistani');b=b||store.get('cmpB','khamenei');store.set('cmpA',a);store.set('cmpB',b);
  const flt=store.get('cmpF','all'),st=store.get('cmpSt','');
  const sig=ops=>ops.map(x=>norm((x.c.label||'')+' '+x.o.ruling).replace(/[^ء-ي ]/g,'').replace(/\s+/g,' ').trim()).sort().join('|');
  const rows=[];let agree=0,open=0;
  for(const [k,r] of Object.entries(RUL)){const it=keyIssue(k);if(!it||(st&&it.station!==st))continue;
    const A=opinionsFor(r,a),B=opinionsFor(r,b);if(!A.length||!B.length)continue;   // يُقارَن ما ذُكر فيه المرجعان معًا
    const same=sig(A)===sig(B);same?agree++:open++;
    if((flt==='same'&&!same)||(flt==='open'&&same))continue;rows.push({k,r,it,A,B,same})}
  rows.sort((x,y)=>y.same-x.same);
  const stations=[...new Set(Object.keys(RUL).map(k=>keyIssue(k)?.station).filter(Boolean))];
  const notesOf=(L,m)=>L.filter(x=>x.note).map(x=>`<p><b>${mjName(m)}:</b> ${esc(x.note)}</p>`).join('');
  view(topbar('مقارنة مرجعين','/')+`
  <div class="card pad"><div class="row" style="flex-wrap:nowrap">${mjSelect('ca',a)}<span class="vs">مع</span>${mjSelect('cb',b)}</div>
   <div class="row" style="margin-top:10px;flex-wrap:nowrap"><select id="cst" class="sel"><option value="">كل الأبواب</option>${stations.map(s=>`<option value="${s}" ${s===st?'selected':''}>${esc(stationName(s))}</option>`).join('')}</select></div>
   <div class="row" style="margin-top:10px">${[['all','الكل'],['same',`متطابقة: ${AR(agree)}`],['open',`عبارات مختلفة: ${AR(open)}`]].map(([k,l])=>`<span class="chip ${flt===k?'on':''}" data-f="${k}">${l}</span>`).join('')}</div></div>
  ${rows.map(x=>x.same?`<div class="card cmp agree"><a class="cq" href="#/issue/${x.it.id}">${esc(x.r.q)} <span class="dim">| ${slideLbl(x.it,keyPage(x.k))}</span></a>
      <div class="res-h"><span class="badge tree">✓ عبارة متطابقة</span> <span class="dim">${mjName(a)} و${mjName(b)}</span></div>
      ${x.A.map(o=>`<div class="answer ${o.o.tone}">${o.c.label?`<small>${esc(o.c.label)}</small>`:''}<b>${esc(o.o.ruling)}</b></div>`).join('')}
      ${notesOf(x.A,a)+notesOf(x.B,b)?`<div class="dn">${notesOf(x.A,a)}${notesOf(x.B,b)}</div>`:''}
      ${x.r.source?`<div class="src">المصدر: ${esc(x.r.source)}</div>`:''}
      <div class="row" style="margin-top:8px"><button class="btn sm ghost share" data-k="${x.k}" data-m="${a}" data-r="${esc(x.A[0].o.ruling)}" data-n="" data-l="${esc(x.A[0].c.label||'')}">${ico('share')} شارك</button><button class="btn sm ghost mv" data-k="${x.k}">🔘 المشجّرة</button></div></div>`
    :`<div class="card cmp open"><a class="cq" href="#/issue/${x.it.id}">${esc(x.r.q)} <span class="dim">| ${slideLbl(x.it,keyPage(x.k))}</span></a>
      <div class="unres">العبارات مختلفة — راجع ${x.it.custom?'المسألة':`المشجّرة <button class="btn sm ghost mv" data-k="${x.k}">🔘 المشجّرة</button>`}</div></div>`).join('')
    ||'<div class="card empty">لا مسائل ذُكر فيها المرجعان معًا بهذا الشرط.</div>'}
  <div class="note">تُعرض نتيجةً فقط المسائل التي تطابقت فيها عبارة المرجعين في المشجّرة. أما اختلاف العبارة فلا يُحكم فيه آليًا باتفاق ولا اختلاف، ويُرجع فيه إلى المشجّرة.</div>`);
  const nav=()=>go(`/compare/${$('#ca').value}/${$('#cb').value}`);
  $('#ca').onchange=nav;$('#cb').onchange=nav;$('#cst').onchange=e=>{store.set('cmpSt',e.target.value);render()};
  $$('[data-f]').forEach(c=>c.onclick=()=>{store.set('cmpF',c.dataset.f);render()});
  $$('.mv').forEach(bt=>bt.onclick=()=>{const it=keyIssue(bt.dataset.k);openViewer(it,it.pages.indexOf(keyPage(bt.dataset.k)))});
  bindShare($('#app'));
});

/* ============ 3) مشاركة الحكم صورةً ============ */
function bindShare(root){$$('.share',root).forEach(b=>b.onclick=e=>{e.stopPropagation();shareRuling(b.dataset)})}
async function shareRuling(d){
  const r=RUL[d.k],it=keyIssue(d.k);if(!r)return;
  try{await Promise.all(['700 40px "El Messiri"','500 30px Tajawal','700 30px Tajawal'].map(f=>document.fonts.load(f)))}catch(e){}
  const W=1080,pad=70,cv=document.createElement('canvas'),x=cv.getContext('2d');
  const wrap=(t,font,maxW)=>{x.font=font;const words=String(t).split(/\s+/),L=[];let line='';for(const w of words){const tt=line?line+' '+w:w;if(x.measureText(tt).width>maxW&&line){L.push(line);line=w}else line=tt}if(line)L.push(line);return L};
  const fQ='700 44px "El Messiri"',fL='500 30px Tajawal',fR='700 46px Tajawal',fN='500 32px Tajawal',fS='500 24px Tajawal';
  const inner=W-pad*2-40;
  const Lq=wrap(r.q,fQ,inner),Ll=d.l?wrap(d.l,fL,inner):[],Lr=wrap(d.r,fR,inner-30),Ln=d.n?wrap(d.n,fN,inner-30):[],Ls=wrap('المصدر: '+(r.source||'مشجرات الحدائق الناضرة')+' | الشريحة '+AR(keyPage(d.k)),fS,inner);
  const H=260+Lq.length*62+Ll.length*44+60+Lr.length*64+Ln.length*48+110+Ls.length*36+150;
  cv.width=W;cv.height=H;x.direction='rtl';x.textAlign='right';
  const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0b0805');g.addColorStop(.55,'#2a1d12');g.addColorStop(1,'#1a120b');x.fillStyle=g;x.fillRect(0,0,W,H);
  x.globalAlpha=.06;x.strokeStyle='#F2B632';x.lineWidth=2;for(let yy=0;yy<H;yy+=120)for(let xx=0;xx<W;xx+=120){x.strokeRect(xx+30,yy+30,60,60);x.save();x.translate(xx+60,yy+60);x.rotate(Math.PI/4);x.strokeRect(-30,-30,60,60);x.restore()}x.globalAlpha=1;
  x.strokeStyle='rgba(242,182,50,.7)';x.lineWidth=3;x.strokeRect(28,28,W-56,H-56);
  const R=W-pad;let y=120;
  x.fillStyle='#ffd36e';x.font='700 36px "El Messiri"';x.fillText('مرشد النسك',R,y);x.textAlign='left';x.fillStyle='#bfae93';x.font=fS;x.fillText(stationName(it.station),pad,y);x.textAlign='right';
  y+=40;x.fillStyle='rgba(242,182,50,.35)';x.fillRect(pad,y,W-pad*2,2);y+=70;
  x.fillStyle='#f4ead8';x.font=fQ;Lq.forEach(l=>{x.fillText(l,R,y);y+=62});
  x.fillStyle='#38BDF8';x.font=fL;Ll.forEach(l=>{x.fillText(l,R,y);y+=44});y+=24;
  const tone={no:'#22C55E',yes:'#EF4444',ihtiyat:'#F2B632',detail:'#38BDF8'}[(r.cases.flatMap(c=>c.opinions).find(o=>o.ruling===d.r)||{}).tone]||'#F2B632';
  const boxTop=y-10,boxH=Lr.length*64+Ln.length*48+110;x.fillStyle='rgba(20,14,9,.85)';x.fillRect(pad,boxTop,W-pad*2,boxH);x.fillStyle=tone;x.fillRect(W-pad-10,boxTop,10,boxH);
  y+=50;x.fillStyle='#ffd36e';x.font='700 30px Tajawal';x.fillText('رأي '+(MJ[d.m]?.name||''),R-30,y);y+=56;
  x.fillStyle='#ffffff';x.font=fR;Lr.forEach(l=>{x.fillText(l,R-30,y);y+=64});x.fillStyle='#d9ccb4';x.font=fN;Ln.forEach(l=>{x.fillText(l,R-30,y);y+=48});
  y=boxTop+boxH+50;x.fillStyle='#8a7a62';x.font=fS;Ls.forEach(l=>{x.fillText(l,R,y);y+=36});
  y=H-70;x.fillStyle='#bfae93';x.font=fS;x.fillText('المحتوى: مشجرات «الحدائق الناضرة» — إعداد حسين الجزيري',R,y);x.fillText('التصميم: محمد علي المعاتيق',R,y+34);
  const blob=await new Promise(res=>cv.toBlob(res,'image/png'));const name='حكم-'+(MJ[d.m]?.name||'')+'.png';
  const file=new File([blob],name,{type:'image/png'});
  if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:r.q});return}catch(e){if(e.name==='AbortError')return}}
  if(window.NUSK_PACKED){const fr=new FileReader();fr.onload=()=>showSaveSheet('<img src="'+fr.result+'" alt="'+esc(name)+'" style="border-radius:12px">','اضغط مطولًا على الصورة لحفظها أو مشاركتها.');fr.readAsDataURL(blob);return}
  if(window.NuskAndroid){const fr=new FileReader();fr.onload=()=>NuskAndroid.shareFile(name,'image/png',String(fr.result).split(',')[1],r.q);fr.readAsDataURL(blob);return}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();toast('حُفظت الصورة');
}

/* ============ 4) اختبار المرشدين ============ */
function buildQuiz(n,m,st){
  const pool=[];
  for(const [k,r] of Object.entries(RUL)){const it=keyIssue(k);if(!it||(st&&it.station!==st))continue;
    r.cases.forEach((c,ci)=>{const ops=c.opinions.filter(o=>o.maraji.length);const uniq=[...new Set(ops.map(o=>o.ruling))];if(uniq.length<2)return;
      ops.forEach(o=>o.maraji.forEach(mj=>{if(m&&mj!==m)return;pool.push({k,r,c,o,mj,it,uniq})}))})}
  for(let i=pool.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[pool[i],pool[j]]=[pool[j],pool[i]]}
  const seen=new Set(),Q=[];
  for(const p of pool){const id=p.k+p.c.label;if(seen.has(id))continue;seen.add(id);
    const wrong=p.uniq.filter(u=>u!==p.o.ruling&&!(p.c.opinions.find(o=>o.ruling===u)?.maraji.includes(p.mj))).slice(0,3);if(!wrong.length)continue;
    const opts=[p.o.ruling,...wrong].sort(()=>Math.random()-.5);Q.push({...p,opts});if(Q.length>=n)break}
  return Q;
}
route(/^\/quiz$/,()=>{
  const m=store.get('qzM',mine()||''),st=store.get('qzSt','');
  const stations=[...new Set(Object.keys(RUL).map(k=>keyIssue(k)?.station).filter(Boolean))];
  const best=store.get('qzBest',null);
  view(topbar('اختبار المرشدين','/')+`<div class="card pad"><p class="muted" style="margin-top:0">أسئلة تدريبية من أشجار الفتوى المفرّغة: «ما رأي المرجع في هذه المسألة؟» مع المصدر والمشجّرة بعد كل إجابة.</p>
   <div class="row" style="flex-wrap:nowrap"><select id="qm" class="sel"><option value="">كل المراجع</option>${window.MARAJI.map(x=>`<option value="${x.id}" ${x.id===m?'selected':''}>${esc(x.name)}</option>`).join('')}</select>
   <select id="qs" class="sel"><option value="">كل الأبواب</option>${stations.map(s=>`<option value="${s}" ${s===st?'selected':''}>${esc(stationName(s))}</option>`).join('')}</select></div>
   <div class="row" style="margin-top:12px">${[5,10,20].map(n=>`<button class="btn ${n===10?'':'ghost'}" data-n="${n}">${AR(n)} أسئلة</button>`).join('')}</div>
   ${best?`<p class="dim">أفضل نتيجة: ${AR(best)}٪</p>`:''}</div><div id="qz"></div>`);
  $('#qm').onchange=e=>store.set('qzM',e.target.value);$('#qs').onchange=e=>store.set('qzSt',e.target.value);
  $$('[data-n]').forEach(b=>b.onclick=()=>runQuiz(buildQuiz(+b.dataset.n,$('#qm').value,$('#qs').value)));
});
function runQuiz(Q){
  const box=$('#qz');if(!Q.length){box.innerHTML='<div class="card empty">لا تكفي الأشجار المفرّغة لهذا الاختيار بعد؛ جرّب «كل المراجع».</div>';return}
  let i=0,score=0;
  const show=()=>{const q=Q[i];
    box.innerHTML=`<div class="card pad fade quiz"><div class="prog"><i style="width:${i/Q.length*100}%"></i></div>
      <p class="dim">السؤال ${AR(i+1)} من ${AR(Q.length)} | ${esc(stationName(q.it.station))}</p>
      <div class="qq">ما رأي <b style="color:var(--gold2)">${mjName(q.mj)}</b> في: ${esc(q.r.q)}${q.c.label?` <span class="muted">— ${esc(q.c.label)}</span>`:''}؟</div>
      ${q.opts.map((o,j)=>`<button class="btn ghost opt" data-j="${j}">${esc(o)}</button>`).join('')}<div id="qe"></div></div>`;
    $$('.opt',box).forEach(b=>b.onclick=()=>{const ok=q.opts[+b.dataset.j]===q.o.ruling;if(ok)score++;
      $$('.opt',box).forEach(x=>{x.disabled=true;const t=q.opts[+x.dataset.j];if(t===q.o.ruling)x.classList.add('right');else if(x===b)x.classList.add('wrong')});
      const nt=(q.o.notes||{})[q.mj];
      $('#qe').innerHTML=`<div class="note"><b>${ok?'أحسنت ✓':'الصواب:'}</b> ${esc(q.o.ruling)}${nt?` — ${esc(nt)}`:''}<br><span class="dim">المصدر: ${esc(q.r.source||'المشجّرة')} | ${slideLbl(q.it,keyPage(q.k))}</span></div>
        <div class="row" style="margin-top:10px"><button class="btn" id="qn">${i+1<Q.length?'التالي':'النتيجة'}</button><button class="btn ghost sm" id="qv">🔘 المشجّرة</button></div>`;
      $('#qv')&&($('#qv').onclick=()=>openViewer(q.it,q.it.pages.indexOf(keyPage(q.k))));
      $('#qn').onclick=()=>{i++;i<Q.length?show():done()};navigator.vibrate&&navigator.vibrate(ok?20:[40,40,40])})};
  const done=()=>{const pct=Math.round(score/Q.length*100);if(pct>(store.get('qzBest',0)))store.set('qzBest',pct);
    box.innerHTML=`<div class="card pad fade" style="text-align:center"><div class="counter"><div class="big">${AR(pct)}٪</div></div><p>${AR(score)} من ${AR(Q.length)} إجابة صحيحة</p>
      <p class="muted">${pct>=80?'ممتاز، أنت مرشد متمكّن بإذن الله.':pct>=50?'جيد، راجع المسائل التي أخطأتَ فيها.':'تحتاج إلى مراجعة هذا الباب من المشجّرات.'}</p>
      <button class="btn" onclick="render()">اختبار جديد</button></div>`};
  show();box.scrollIntoView({behavior:'smooth'});
}

// نسخة العرض على الويب (رابط claude.ai): لا تنزيل ولا مشاركة مباشرة، فيُعرض المحتوى في لوح يُحفظ منه يدويًا
function showSaveSheet(html,hint){let o=$('#savesheet');if(!o){document.body.insertAdjacentHTML('beforeend','<div id="savesheet" style="position:fixed;inset:0;z-index:60;background:rgba(5,4,2,.92);display:grid;place-items:center;padding:16px"><div class="card pad" style="max-width:520px;width:100%;max-height:90vh;overflow:auto"><div id="ssb"></div><p class="dim" id="ssh"></p><button class="btn" id="ssx">إغلاق</button></div></div>');o=$('#savesheet');$('#ssx').onclick=()=>o.remove()}
  $('#ssb').innerHTML=html;$('#ssh').textContent=hint}
