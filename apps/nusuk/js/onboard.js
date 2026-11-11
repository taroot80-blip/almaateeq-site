// الترحيب أول مرة، والتخصيص: المسار والمرجع وحجم الخط. ويُطبَّق حجم الخط عند كل فتح.
'use strict';
const FS={s:14,m:16,l:18,xl:20};
function applyFs(){document.documentElement.style.fontSize=FS[store.get('fs','m')]+'px';document.body.style.fontSize=FS[store.get('fs','m')]+'px'}
applyFs();
function prefsHTML(){const m=mine(),fs=store.get('fs','m'),p=store.get('path','umrah');return `
  <div class="obs"><b>نوع النسك</b><div class="seg">${[['umrah','العمرة المفردة'],['tamattu','حج التمتع']].map(([k,l])=>`<button data-path="${k}" class="${p===k?'on':''}">${l}</button>`).join('')}</div></div>
  <div class="obs"><b>مرجع تقليدك</b><small class="dim">يُبرز رأيه في كل شجرة وفي حلّال الحالات</small>
    <div class="mjgrid">${window.MARAJI.filter(x=>!['y_usfur'].includes(x.id)).map(x=>`<button class="chip ${x.id===m?'on':''}" data-mjp="${x.id}">${esc(x.name)}</button>`).join('')}</div></div>
  <div class="obs"><b>حجم الخط</b><div class="seg four">${[['s','صغير'],['m','متوسط'],['l','كبير'],['xl','أكبر']].map(([k,l])=>`<button data-fs="${k}" class="${fs===k?'on':''}" style="font-size:${FS[k]}px">${l}</button>`).join('')}</div></div>`}
function bindPrefs(root,after){
  $$('[data-path]',root).forEach(b=>b.onclick=()=>{store.set('path',b.dataset.path);$$('[data-path]',root).forEach(x=>x.classList.toggle('on',x===b))});
  $$('[data-mjp]',root).forEach(b=>b.onclick=()=>{store.set('marja',b.dataset.mjp);$$('[data-mjp]',root).forEach(x=>x.classList.toggle('on',x===b))});
  $$('[data-fs]',root).forEach(b=>b.onclick=()=>{store.set('fs',b.dataset.fs);applyFs();$$('[data-fs]',root).forEach(x=>x.classList.toggle('on',x===b));after&&after()})}

route(/^\/settings$/,()=>{
  view(topbar('التخصيص','/')+`<div class="card pad">${prefsHTML()}</div>
  <div class="row" style="margin-top:12px"><button class="btn ghost" id="replay">أعد عرض الترحيب</button><a class="btn" href="#/">تم</a></div>`);
  bindPrefs($('#app'));$('#replay').onclick=()=>{store.set('onboarded',0);showOnboard()};
});

function showOnboard(){if($('#onb'))return;
  document.body.insertAdjacentHTML('beforeend',`<div id="onb"><div class="onc">
    <div class="op" data-p="0"><div class="obicon">🕋</div><h2>أهلًا بك في «مرشد النسك»</h2>
      <p>دليل المرشد إلى أحكام الحج والعمرة على مذهب أهل البيت عليهم السلام، بأقوال المراجع العظام مفرّعةً في أشجار فتوى، مع المشجّرات الأصلية.</p>
      <ul><li>🔎 ابحث بالكتابة أو بالصوت أو بتصوير السؤال</li><li>🧭 حلّال الحالات يوصلك إلى الحكم بأسئلة قصيرة</li><li>🎓 اعرض الأحكام درسًا للحجاج على الشاشة</li><li>🆘 زر الطوارئ للتواصل المستعجل في أي وقت</li></ul></div>
    <div class="op" data-p="1" hidden><h2>خصّص الدليل</h2>${prefsHTML()}</div>
    <div class="obnav"><span class="dots"><i class="on"></i><i></i></span><button class="btn ghost sm" id="ob_skip">تخطَّ</button><button class="btn" id="ob_next">التالي</button></div>
  </div></div>`);
  const o=$('#onb');let pg=0;bindPrefs(o);
  const show=()=>{$$('.op',o).forEach(x=>x.hidden=+x.dataset.p!==pg);$$('.dots i',o).forEach((d,j)=>d.classList.toggle('on',j===pg));$('#ob_next').textContent=pg?'ابدأ':'التالي'};
  const done=()=>{store.set('onboarded',1);o.classList.add('out');setTimeout(()=>{o.remove();render()},300);SFX.play('save')};
  $('#ob_next').onclick=()=>{if(pg<1){pg++;show();SFX.play('choice')}else done()};$('#ob_skip').onclick=done;
}
addEventListener('DOMContentLoaded',()=>{if(!store.get('onboarded',0)&&!location.hash.startsWith('#/teach/play'))setTimeout(showOnboard,250)});

document.head.insertAdjacentHTML('beforeend',`<style>
#onb{position:fixed;inset:0;z-index:70;background:rgba(5,4,2,.88);backdrop-filter:blur(6px);display:grid;place-items:center;padding:16px;animation:obin .35s ease}
#onb.out{opacity:0;transition:opacity .3s}@keyframes obin{from{opacity:0}}
.onc{width:100%;max-width:520px;max-height:92vh;overflow:auto;background:linear-gradient(170deg,#2a1d12,#140d07);border:1px solid var(--line2);border-radius:24px;padding:22px 18px;box-shadow:0 20px 60px rgba(0,0,0,.6)}
.onc h2{font:700 1.45rem var(--head);color:var(--gold2);margin:.2em 0 .4em;text-align:center}
.onc p{color:var(--muted);text-align:center}.onc ul{list-style:none;padding:0;margin:14px 0}.onc li{padding:8px 10px;margin:6px 0;border-radius:12px;background:rgba(242,182,50,.07);border:1px solid var(--line)}
.obicon{font-size:56px;text-align:center;filter:drop-shadow(0 6px 18px rgba(242,182,50,.35))}
.obs{margin:14px 0}.obs>b{display:block;color:var(--gold2);font-family:var(--head);margin-bottom:6px}.obs .seg{margin:6px 0 0;max-width:none}
.seg.four{grid-template-columns:repeat(4,1fr)}
.mjgrid{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;max-height:200px;overflow:auto}
.obnav{display:flex;align-items:center;gap:8px;margin-top:14px}.obnav .dots{margin-inline-end:auto;display:flex;gap:6px}
.dots i{width:9px;height:9px;border-radius:50%;background:var(--line2)}.dots i.on{background:var(--gold);width:22px;border-radius:6px}
</style>`);
