// زر 🔘 العائم: البحث، وإطفاء نغمات الأزرار، واختيار مقاس العرض بحسب الجهاز
// (هاتف، آيباد/تابلت أندرويد، لابتوب، سطح المكتب، تلفاز ذكي) أو تلقائيًا بحسب عرض الشاشة.
'use strict';
const DEVICES=[['auto','تلقائي','🔄','بحسب عرض الشاشة'],['phone','هاتف','📱','مريح لليد الواحدة'],['tablet','آيباد / تابلت','📲','iPad وتابلت أندرويد'],
  ['laptop','لابتوب','💻','شاشة 13–15 بوصة'],['desktop','سطح المكتب','🖥️','شاشة كبيرة'],['tv','تلفاز ذكي','📺','خط كبير وتحكّم بالريموت']];
const DEV_CFG={phone:{w:520,s:1,c:2},tablet:{w:980,s:1.08,c:3},laptop:{w:1120,s:1,c:4},desktop:{w:1320,s:1.05,c:5},tv:{w:1680,s:1.45,c:5}};
function devAuto(){const w=innerWidth;return w<600?'phone':w<1024?'tablet':w<1440?'laptop':w<1920?'desktop':'tv'}
function devNow(){const d=store.get('device','auto');return d==='auto'?devAuto():d}
function applyDevice(){const d=devNow(),c=DEV_CFG[d],r=document.documentElement;
  r.dataset.dev=d;r.style.setProperty('--appw',c.w+'px');r.style.setProperty('--cols',c.c);
  const base={s:14,m:16,l:18,xl:20}[store.get('fs','m')]||16;const px=Math.round(base*c.s);
  r.style.fontSize=px+'px';document.body.style.fontSize=px+'px'}
window.applyFs=applyDevice;applyDevice();
addEventListener('resize',()=>{clearTimeout(applyDevice.t);applyDevice.t=setTimeout(()=>{if(store.get('device','auto')==='auto')applyDevice()},150)});

function orbMenu(){if($('#orbwrap'))return;
  document.body.insertAdjacentHTML('beforeend',`<div id="orbwrap"><div id="orbmenu" hidden>
      <a class="om" href="#/search" data-om="search">🔍<span>البحث</span></a>
      <button class="om" data-om="snd"><b id="om_snd"></b><span>نغمات الأزرار</span></button>
      <button class="om" data-om="dev">🖥️<span>مقاس الشاشة</span></button>
    </div><button id="orb" aria-label="البحث والإعدادات السريعة" aria-expanded="false">🔘</button></div>`);
  const m=$('#orbmenu'),b=$('#orb');
  const sync=()=>{$('#om_snd').textContent=SFX.on()?'🎵':'🔇'};sync();
  b.onclick=e=>{e.stopPropagation();m.hidden=!m.hidden;b.setAttribute('aria-expanded',String(!m.hidden));sync()};
  document.addEventListener('click',e=>{if(!e.target.closest('#orbwrap'))m.hidden=true});
  m.querySelector('[data-om=search]').onclick=()=>{m.hidden=true;setTimeout(()=>{const q=$('#q');q&&q.focus()},300)};
  m.querySelector('[data-om=snd]').onclick=()=>{const v=SFX.toggle();sync();toast(v?'نغمات الأزرار مفعّلة 🎵':'نغمات الأزرار مطفأة 🔇');typeof decorate==='function'&&decorate()};
  m.querySelector('[data-om=dev]').onclick=()=>{m.hidden=true;devSheet()};
}
function devSheet(){const o=document.createElement('div');o.id='devsheet';const cur=store.get('device','auto');
  o.innerHTML=`<div class="dvc"><h3>مقاس العرض</h3><p class="dim">اختر جهازك، أو «تلقائي» ليتكيّف مع الشاشة (الحالي: ${DEVICES.find(d=>d[0]===devNow())[1]}).</p>
    <div class="dvg">${DEVICES.map(([k,l,i,s])=>`<button class="dvb ${k===cur?'on':''}" data-dv="${k}"><span class="i">${i}</span><b>${l}</b><small>${s}</small></button>`).join('')}</div>
    <button class="btn ghost" id="dv_x">إغلاق</button></div>`;
  document.body.appendChild(o);
  $$('[data-dv]',o).forEach(b=>b.onclick=()=>{store.set('device',b.dataset.dv);applyDevice();$$('[data-dv]',o).forEach(x=>x.classList.toggle('on',x===b));SFX.play('choice');toast('المقاس: '+b.querySelector('b').textContent)});
  o.onclick=e=>{if(e.target===o||e.target.id==='dv_x')o.remove()}}
window.devSheet=devSheet;
addEventListener('hashchange',()=>{const w=$('#orbwrap');if(w)w.style.display=location.hash.startsWith('#/teach/play')?'none':''});

// قسم المقاس في صفحة التخصيص
addEventListener('hashchange',()=>setTimeout(addDevToSettings,0));addEventListener('DOMContentLoaded',()=>setTimeout(addDevToSettings,50));
function addDevToSettings(){if(!location.hash.startsWith('#/settings')||$('#devpick'))return;const card=$('#app .card.pad');if(!card)return;
  card.insertAdjacentHTML('beforeend',`<div class="obs" id="devpick"><b>مقاس العرض</b><div class="mjgrid">${DEVICES.map(([k,l,i])=>`<button class="chip ${k===store.get('device','auto')?'on':''}" data-dvp="${k}">${i} ${l}</button>`).join('')}</div></div>`);
  $$('[data-dvp]').forEach(b=>b.onclick=()=>{store.set('device',b.dataset.dvp);applyDevice();$$('[data-dvp]').forEach(x=>x.classList.toggle('on',x===b))})}

document.head.insertAdjacentHTML('beforeend',`<style>
.app{max-width:var(--appw,760px)}
.grid{grid-template-columns:repeat(var(--cols,2),minmax(0,1fr))}
html[data-dev=phone] .grid{grid-template-columns:repeat(2,minmax(0,1fr))}
html[data-dev=tablet] .sosgrid,html[data-dev=laptop] .sosgrid{grid-template-columns:repeat(3,minmax(0,1fr))}
html[data-dev=desktop] .sosgrid,html[data-dev=tv] .sosgrid{grid-template-columns:repeat(4,minmax(0,1fr))}
html[data-dev=tv] :focus-visible{outline:4px solid var(--gold);outline-offset:3px}
html[data-dev=tv] .btn,html[data-dev=tv] .tabs button{min-height:56px}
@media (max-width:420px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
#orbwrap{position:fixed;right:14px;bottom:calc(84px + var(--safe-b));z-index:21;display:flex;flex-direction:column;align-items:flex-end;gap:8px}
#orb{width:58px;height:58px;border-radius:50%;border:0;cursor:pointer;font-size:28px;display:grid;place-items:center;
  background:radial-gradient(circle at 35% 30%,#ffe7a3,#F2B632 55%,#b97f12);box-shadow:inset 0 2px 0 rgba(255,255,255,.55),0 4px 0 #8a5a0a,0 8px 18px rgba(0,0,0,.5)}
#orb:active{transform:translateY(3px);box-shadow:inset 0 2px 0 rgba(255,255,255,.4),0 1px 0 #8a5a0a}
#orbmenu{display:flex;flex-direction:column;gap:8px;animation:obin .2s ease}#orbmenu[hidden]{display:none}
.om{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:16px;border:1px solid var(--line2);background:linear-gradient(180deg,rgba(64,45,24,.97),rgba(24,17,10,.97));
  color:var(--gold2);font:700 .92rem var(--body);text-decoration:none;cursor:pointer;box-shadow:0 3px 0 #0a0603,0 6px 14px rgba(0,0,0,.5);white-space:nowrap}
.om b{font-weight:400}
#devsheet{position:fixed;inset:0;z-index:65;background:rgba(5,4,2,.85);display:grid;place-items:center;padding:16px}
.dvc{width:100%;max-width:620px;background:linear-gradient(170deg,#2a1d12,#140d07);border:1px solid var(--line2);border-radius:22px;padding:18px}
.dvc h3{font:700 1.3rem var(--head);color:var(--gold2);margin:0 0 4px}
.dvg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0}
@media (max-width:480px){.dvg{grid-template-columns:repeat(2,minmax(0,1fr))}}
.dvb{display:flex;flex-direction:column;align-items:center;gap:2px;padding:12px 6px;border-radius:16px;border:1px solid var(--line2);cursor:pointer;color:var(--text);
  background:linear-gradient(180deg,rgba(58,41,22,.95),rgba(22,16,10,.95));box-shadow:0 3px 0 #0a0603}
.dvb .i{font-size:30px}.dvb small{color:var(--dim);font-size:.72rem;text-align:center}
.dvb.on{background:linear-gradient(180deg,#ffd36e,#F2B632 60%,#d99a1c);color:var(--ink)}.dvb.on small{color:#3a2a10}
</style>`);
orbMenu();
