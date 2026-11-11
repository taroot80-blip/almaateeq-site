// الطبقة الجرافيكية للأقسام: بروز، وإضاءات إشراقية، وضوء يعبر، وحافة ليزرية منطلقة،
// وأيقونات حيّة تعبّر عن نوع كل قسم، وأيقونة القسم المتحركة في رأس صفحته، وانفجار ضوئي عند اللمس.
'use strict';
(function(){
/* ---------- هوية كل قسم: لون الإضاءة ودرجة الأهمية ---------- */
const C={gold:['#F2B632','rgba(242,182,50,.5)'],green:['#22C55E','rgba(34,197,94,.5)'],teal:['#14B8A6','rgba(20,184,166,.5)'],
  sky:['#38BDF8','rgba(56,189,248,.5)'],red:['#EF4444','rgba(239,68,68,.5)'],amber:['#FB923C','rgba(251,146,60,.5)'],violet:['#A78BFA','rgba(167,139,250,.5)']};
const ICOL={route:'gold',book:'amber',tree:'green',map:'sky',mount:'teal',tools:'gold',hands:'teal',compare:'sky',quiz:'violet',
  ready:'green',search:'sky',user:'red',plus:'teal',download:'sky',tawaf:'gold',tawaf2:'gold',sai:'teal',pebbles:'amber',miqat:'sky',
  shield:'green',gate:'gold',salat:'teal',scissors:'amber',moon:'violet',drop:'sky',hady:'amber',tent:'amber',child:'teal',lock:'red',star:'gold',home:'gold'};
const IMP=['#/journey','#/trees','#/search','#/sos','#/ready','#/tools/tawaf','#/tools/sai'];
window.fxStyle=(ic,n,href)=>{const c=C[ICOL[ic]||'gold'];return `--acc:${c[0]};--acc2:${c[1]};--n:${n};--e:-${(n*0.73%4.5).toFixed(2)}s`};
window.fxOf=href=>IMP.includes(href)?' fx-imp':'';

/* ---------- أيقونة القسم الحيّة في رأس صفحته ---------- */
const HICON=[[/^\/journey/,'route'],[/^\/topics/,'book'],[/^\/trees/,'tree'],[/^\/maps\/mawaqit/,'map'],[/^\/maps\/mashaer/,'mount'],
  [/^\/tools\/tawaf/,'tawaf'],[/^\/tools\/sai/,'sai'],[/^\/tools\/jamarat/,'pebbles'],[/^\/tools/,'tools'],[/^\/solver/,'hands'],[/^\/compare/,'compare'],
  [/^\/quiz/,'quiz'],[/^\/ready/,'ready'],[/^\/search/,'search'],[/^\/teach/,'book'],[/^\/sos/,'user'],[/^\/settings/,'tools'],[/^\/new/,'plus'],
  [/^\/maraji/,'user'],[/^\/about/,'download'],[/^\/issue\//,'tree']];
function headIcon(){
  const h=$('header.top h1');if(!h||$('.hic',h.parentElement))return;
  const r=decodeURIComponent(location.hash.slice(1));let k=null;
  const st=r.match(/^\/station\/(\w+)/);if(st){const s=(window.STATIONS||{})[st[1]]||(window.TOPICS||{})[st[1]];k=s&&s.icon}
  if(!k){const m=HICON.find(([re])=>re.test(r));k=m&&m[1]}
  if(!k)return;
  h.insertAdjacentHTML('beforebegin',`<span class="ic hic" style="${fxStyle(k,0)}"><i class="fx-rays"></i>${ico(k)}</span>`);
}

/* ---------- إيقاف الحركة خارج الشاشة (سلاسة على الهواتف) ---------- */
const io='IntersectionObserver' in window?new IntersectionObserver(es=>es.forEach(e=>e.target.classList.toggle('fx-off',!e.isIntersecting)),{rootMargin:'80px'}):null;
function watch(){if(!io)return;$$('.tile.fx:not([data-w]),.mj button:not([data-w])').forEach(t=>{t.dataset.w=1;io.observe(t)})}

/* ---------- انفجار ضوئي عند اللمس ---------- */
document.addEventListener('pointerdown',e=>{
  const t=e.target.closest('.tile.fx,.mj button,.stn .node');if(!t)return;
  const r=t.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
  const b=document.createElement('i');b.className='fx-burst';b.style.left=x+'px';b.style.top=y+'px';
  b.innerHTML='<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>';
  t.appendChild(b);setTimeout(()=>b.remove(),700);
},{passive:true});

/* ---------- خطوط ليزر تعبر الخلفية ---------- */
if(!$('.fx-lasers'))document.body.insertAdjacentHTML('afterbegin','<div class="fx-lasers" aria-hidden="true"><i></i><i></i><i></i><i></i></div>');

const tick=()=>{headIcon();watch()};
new MutationObserver(()=>{if(tick.t)return;tick.t=setTimeout(()=>{tick.t=0;tick()},16)}).observe($('#app'),{childList:true,subtree:true});
addEventListener('hashchange',()=>setTimeout(tick,30));

/* ---------- الأنماط ---------- */
document.head.insertAdjacentHTML('beforeend',`<style id="fxcss">
@property --fxa{syntax:'<angle>';inherits:false;initial-value:0deg}
.tile.fx,.mj button{position:relative;isolation:isolate;overflow:hidden}
/* البروز: سطح مقبّب بحافة علوية لامعة وظل عميق */
.tile.fx{background:
  radial-gradient(120% 70% at 85% 0%,color-mix(in srgb,var(--acc) 16%,transparent),transparent 60%),
  linear-gradient(165deg,rgba(58,41,23,.94),rgba(16,11,7,.92));
  border-color:color-mix(in srgb,var(--acc) 55%,transparent);
  box-shadow:inset 0 1px 0 rgba(255,236,190,.28),inset 0 -3px 0 rgba(0,0,0,.4),0 5px 0 rgba(8,5,2,.92),0 12px 24px rgba(0,0,0,.5),0 0 22px -6px var(--acc2);
  animation:fxin .62s cubic-bezier(.34,1.56,.64,1) backwards;animation-delay:calc(var(--n)*55ms)}
@keyframes fxin{from{opacity:0;transform:translateY(22px) scale(.94)}}
.tile.fx b{position:relative;z-index:2}.tile.fx>span:not(.ic){position:relative;z-index:2}
/* الحافة الليزرية المنطلقة: شعاع يدور حول المربع */
.fx-edge{position:absolute;inset:0;border-radius:inherit;padding:1.6px;z-index:1;pointer-events:none;
  background:conic-gradient(from var(--fxa),transparent 0 60%,var(--acc2) 68%,var(--acc) 73%,#fff8e1 75%,var(--acc) 77%,transparent 86%);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;
  animation:fxspin 4.5s linear infinite;animation-delay:var(--e)}
@keyframes fxspin{to{--fxa:360deg}}
/* الضوء الذي يعبر: موجة تمر على المربعات بالتتابع */
.fx-sweep{position:absolute;inset:0;border-radius:inherit;overflow:hidden;z-index:1;pointer-events:none}
.fx-sweep::before{content:"";position:absolute;top:-30%;bottom:-30%;width:45%;right:-60%;
  background:linear-gradient(100deg,transparent 10%,rgba(255,240,200,.07) 35%,rgba(255,244,214,.34) 50%,rgba(255,240,200,.07) 65%,transparent 90%);
  transform:translateX(0) skewX(-18deg);animation:fxsweep 6s cubic-bezier(.65,0,.35,1) infinite;animation-delay:calc(var(--n)*90ms + .35s)}
@keyframes fxsweep{0%{transform:translateX(0) skewX(-18deg)}28%,100%{transform:translateX(-390%) skewX(-18deg)}}
/* الجزيئات اللامعة */
.fx-sp{position:absolute;inset:0;z-index:1;pointer-events:none}
.fx-sp i{position:absolute;width:3px;height:3px;border-radius:50%;background:#fff6dc;box-shadow:0 0 6px 1px var(--acc);opacity:0;animation:fxspark 3.6s ease-in-out infinite}
.fx-sp i:nth-child(1){left:18%;bottom:14%;animation-delay:calc(var(--n)*.3s)}
.fx-sp i:nth-child(2){left:62%;bottom:22%;animation-delay:calc(var(--n)*.3s + 1.2s)}
.fx-sp i:nth-child(3){left:40%;bottom:8%;animation-delay:calc(var(--n)*.3s + 2.4s)}
@keyframes fxspark{0%{opacity:0;transform:translateY(0) scale(.5)}20%{opacity:1}70%{opacity:.8}100%{opacity:0;transform:translateY(-58px) scale(1.2)}}
/* الأيقونة الإشراقية: أشعة تدور وهالة تنبض */
.tile.fx .ic,.hic{position:relative;z-index:2;overflow:visible;color:var(--acc);
  background:radial-gradient(circle at 35% 30%,color-mix(in srgb,var(--acc) 34%,#2a1d12),#120c07 75%);
  box-shadow:inset 0 1px 0 rgba(255,236,190,.35),0 0 0 1px color-mix(in srgb,var(--acc) 60%,transparent),0 4px 12px rgba(0,0,0,.5),0 0 18px -2px var(--acc2)}
.tile.fx .ic svg,.hic svg{filter:drop-shadow(0 0 5px var(--acc2));overflow:visible}
.fx-rays{position:absolute;inset:-16px;border-radius:50%;z-index:-1;pointer-events:none;opacity:.6;
  background:repeating-conic-gradient(from 0deg,var(--acc2) 0 5deg,transparent 5deg 22.5deg);
  -webkit-mask:radial-gradient(circle,#000 28%,transparent 70%);mask:radial-gradient(circle,#000 28%,transparent 70%);
  animation:fxrot 16s linear infinite}
@keyframes fxrot{to{transform:rotate(360deg)}}
.tile.fx .ic::after,.hic::after,.stn .node::after{content:"";position:absolute;inset:-1px;border-radius:inherit;border:2px solid var(--acc,#F2B632);
  opacity:0;animation:fxhalo 2.8s cubic-bezier(.22,1,.36,1) infinite;animation-delay:calc(var(--n,0)*.2s);pointer-events:none}
@keyframes fxhalo{0%{opacity:.85;transform:scale(1)}100%{opacity:0;transform:scale(1.75)}}
/* الأقسام المهمة: توهج يتنفّس وتاج من الضوء */
.fx-imp{box-shadow:inset 0 1px 0 rgba(255,236,190,.3),inset 0 -3px 0 rgba(0,0,0,.4),0 5px 0 rgba(8,5,2,.92),0 12px 24px rgba(0,0,0,.5),0 0 30px -4px var(--acc2)}
.fx-imp .fx-glow{position:absolute;inset:0;border-radius:inherit;z-index:0;pointer-events:none;
  background:radial-gradient(90% 60% at 50% 0%,var(--acc2),transparent 70%);animation:fxbreath 3.2s ease-in-out infinite}
@keyframes fxbreath{0%,100%{opacity:.15}50%{opacity:.55}}
.fx-imp .fx-edge{animation-duration:3s}
/* إيقاف ما خرج عن الشاشة */
.fx-off,.fx-off *,.fx-off::before,.fx-off::after{animation-play-state:paused!important}
/* انفجار ضوئي عند اللمس */
.fx-burst{position:absolute;width:0;height:0;z-index:5;pointer-events:none}
.fx-burst::before{content:"";position:absolute;left:-40px;top:-40px;width:80px;height:80px;border-radius:50%;
  background:radial-gradient(circle,rgba(255,244,214,.75),var(--acc2,rgba(242,182,50,.5)) 40%,transparent 70%);animation:fxboom .55s ease-out forwards}
@keyframes fxboom{from{transform:scale(.2);opacity:1}to{transform:scale(2.4);opacity:0}}
.fx-burst i{position:absolute;left:-2px;top:-2px;width:4px;height:4px;border-radius:50%;background:#fff6dc;box-shadow:0 0 8px 2px var(--acc,#F2B632);animation:fxshard .6s cubic-bezier(.22,1,.36,1) forwards}
${[0,1,2,3,4,5,6,7].map(k=>{const a=k*45*Math.PI/180;return `.fx-burst i:nth-child(${k+1}){--x:${(Math.cos(a)*46).toFixed(0)}px;--y:${(Math.sin(a)*46).toFixed(0)}px}`}).join('')}
@keyframes fxshard{to{transform:translate(var(--x),var(--y)) scale(.3);opacity:0}}
/* أيقونة القسم في رأس صفحته */
header.top .hic{flex:none;width:46px;height:46px;border-radius:14px;display:grid;place-items:center;animation:fxpop .5s cubic-bezier(.34,1.56,.64,1) both}
header.top .hic svg{width:26px;height:26px}
@keyframes fxpop{from{opacity:0;transform:scale(.6) rotate(-12deg)}}
header.top h1{position:relative}
/* العناوين: شعاع يجري تحت العنوان */
.h2{position:relative;padding-bottom:6px}
.h2::after{content:"";position:absolute;inset-inline:0;bottom:0;height:2px;border-radius:2px;
  background:linear-gradient(90deg,transparent,rgba(242,182,50,.15) 20%,#ffd36e 50%,rgba(242,182,50,.15) 80%,transparent) 0 0/300% 100%;
  animation:fxline 4s linear infinite}
@keyframes fxline{from{background-position:150% 0}to{background-position:-150% 0}}
/* محطات الرحلة: أشعة وهالة */
.stn .node::before{content:"";position:absolute;inset:-14px;border-radius:50%;z-index:-1;opacity:.55;
  background:repeating-conic-gradient(rgba(242,182,50,.55) 0 5deg,transparent 5deg 22.5deg);
  -webkit-mask:radial-gradient(circle,#000 35%,transparent 70%);mask:radial-gradient(circle,#000 35%,transparent 70%);animation:fxrot 18s linear infinite}
.stn.pending .node::before,.stn.pending .node::after{display:none}
.stn{animation:fxin .6s cubic-bezier(.34,1.56,.64,1) backwards}
/* أزرار المراجع: لمعة تعبر */
.mj button::before{content:"";position:absolute;top:-30%;bottom:-30%;width:40%;right:-60%;pointer-events:none;
  background:linear-gradient(100deg,transparent,rgba(255,244,214,.22),transparent);transform:skewX(-18deg);animation:fxsweep 7s cubic-bezier(.65,0,.35,1) infinite}
.mj button:nth-child(3n+2)::before{animation-delay:.5s}.mj button:nth-child(3n)::before{animation-delay:1s}
/* الشريط السفلي: أيقونة القسم الفعّال تقفز */
.dock a.on svg{animation:fxbob 1.8s ease-in-out infinite}
@keyframes fxbob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
/* خطوط الليزر في الخلفية */
.fx-lasers{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden}
.fx-lasers i{position:absolute;left:-30%;width:160%;height:1.5px;opacity:.0;
  background:linear-gradient(90deg,transparent,rgba(242,182,50,.0) 30%,rgba(255,211,110,.55) 50%,rgba(242,182,50,0) 70%,transparent);animation:fxlaser 11s linear infinite}
.fx-lasers i:nth-child(1){top:18%;transform:rotate(-14deg)}
.fx-lasers i:nth-child(2){top:46%;transform:rotate(9deg);animation-delay:-3.5s;background:linear-gradient(90deg,transparent,rgba(20,184,166,.5) 50%,transparent)}
.fx-lasers i:nth-child(3){top:72%;transform:rotate(-6deg);animation-delay:-7s}
.fx-lasers i:nth-child(4){top:90%;transform:rotate(16deg);animation-delay:-9s;background:linear-gradient(90deg,transparent,rgba(56,189,248,.45) 50%,transparent)}
@keyframes fxlaser{0%{opacity:0;translate:60% 0}15%{opacity:.7}45%{opacity:.5}60%,100%{opacity:0;translate:-60% 0}}

/* ---------- الأيقونات الحيّة: لكل قسم حركته ---------- */
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i] *{transform-box:fill-box;transform-origin:center}
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i]{animation:fxfloat 3.4s ease-in-out infinite}
@keyframes fxfloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
/* رحلة النسك: المسار يجري بين المحطتين */
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=route]{animation:none}
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=route] path{stroke-dasharray:3 2.2;animation:fxdash 1.2s linear infinite}
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=route] circle{animation:fxbeat 1.6s ease-in-out infinite}:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=route] circle+circle{animation-delay:.8s}
@keyframes fxdash{to{stroke-dashoffset:-5.2}}
@keyframes fxbeat{0%,100%{transform:scale(1)}50%{transform:scale(1.35)}}
/* الكتاب: صفحة تُقلَّب */
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=book]{animation:fxflip 3.6s ease-in-out infinite;transform-origin:50% 50%}
@keyframes fxflip{0%,60%,100%{transform:perspective(60px) rotateY(0)}75%{transform:perspective(60px) rotateY(-28deg)}85%{transform:perspective(60px) rotateY(10deg)}}
/* شجرة الفتوى: الفروع تنمو والثمار تنبثق */
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=tree]{animation:none}
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=tree] circle{animation:fxbeat 2.4s ease-in-out infinite}
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=tree] circle:nth-child(2){animation-delay:.3s}:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=tree] circle:nth-child(3){animation-delay:.6s}:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=tree] circle:nth-child(4){animation-delay:.9s}
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=tree] path{stroke-dasharray:30;animation:fxdraw 3.2s ease-in-out infinite}
@keyframes fxdraw{0%{stroke-dashoffset:30}40%,80%{stroke-dashoffset:0}100%{stroke-dashoffset:-30}}
/* الخرائط: الخريطة تنبسط والدبوس يهبط */
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=map]{animation:fxsway 3s ease-in-out infinite}
@keyframes fxsway{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=mount]{animation:fxhop 2.4s cubic-bezier(.34,1.56,.64,1) infinite}
@keyframes fxhop{0%,70%,100%{transform:translateY(0) scale(1)}80%{transform:translateY(-4px) scale(1.06)}90%{transform:translateY(0) scale(.97,1.03)}}
/* العدّادات والساعة: العقرب يدور */
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=tools]{animation:none}
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=tools] path{transform-box:view-box;transform-origin:12px 12px;animation:fxrot 5s linear infinite}
/* حلّال الحالات: اليد ترتفع بالسؤال */
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=hands]{animation:fxlift 2.2s ease-in-out infinite}
@keyframes fxlift{0%,100%{transform:translateY(1px) rotate(0)}40%{transform:translateY(-3px) rotate(-8deg)}60%{transform:translateY(-3px) rotate(6deg)}}
/* مقارنة مرجعين: الميزان يتأرجح */
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=compare]{animation:fxscale 2.6s ease-in-out infinite;transform-origin:50% 15%}
@keyframes fxscale{0%,100%{transform:rotate(-9deg)}50%{transform:rotate(9deg)}}
/* الاختبار: علامة السؤال تهتز */
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=quiz]{animation:fxwob 2.4s ease-in-out infinite}
@keyframes fxwob{0%,55%,100%{transform:rotate(0) scale(1)}65%{transform:rotate(-16deg) scale(1.1)}75%{transform:rotate(14deg) scale(1.1)}85%{transform:rotate(-6deg)}}
/* جاهزية الحاج: البطاقة تنقلب */
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=ready]{animation:fxcard 3.4s ease-in-out infinite}
@keyframes fxcard{0%,55%,100%{transform:perspective(50px) rotateY(0)}70%{transform:perspective(50px) rotateY(180deg)}85%{transform:perspective(50px) rotateY(360deg)}}
/* الباحث: العدسة تمسح */
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=search]{animation:fxscan 3s ease-in-out infinite}
@keyframes fxscan{0%,100%{transform:translate(0,0)}25%{transform:translate(-2.5px,-1.5px)}50%{transform:translate(1.5px,-2.5px)}75%{transform:translate(2px,1.5px)}}
/* التواصل المستعجل ومرجعي: نبض القلب */
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=user]{animation:fxheart 1.6s ease-in-out infinite}
@keyframes fxheart{0%,40%,100%{transform:scale(1)}10%{transform:scale(1.14)}20%{transform:scale(1)}30%{transform:scale(1.1)}}
/* المسائل المستجدة: علامة الإضافة تدور */
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=plus]{animation:fxplus 3s cubic-bezier(.34,1.56,.64,1) infinite}
@keyframes fxplus{0%,60%{transform:rotate(0)}80%,100%{transform:rotate(180deg)}}
/* التنزيل: السهم يهبط */
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=download]{animation:none}
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=download] path:first-child{animation:fxdrop 1.6s cubic-bezier(.5,0,.5,1) infinite}
@keyframes fxdrop{0%{transform:translateY(-3px);opacity:0}30%{opacity:1}70%{transform:translateY(1px);opacity:1}100%{transform:translateY(2px);opacity:0}}
/* الطواف: الدوران عكس عقارب الساعة حول الكعبة */
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=tawaf],:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=tawaf2]{animation:none}
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=tawaf] path,:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=tawaf2] circle{transform-box:view-box;transform-origin:12px 12px;animation:fxccw 4s linear infinite}
@keyframes fxccw{to{transform:rotate(-360deg)}}
/* السعي: ذهاب وإياب بين الصفا والمروة */
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=sai] path:last-child{animation:fxwalk 2.4s ease-in-out infinite}
@keyframes fxwalk{0%,100%{transform:translateX(-3px)}50%{transform:translateX(3px)}}
/* رمي الجمار: الحصيات تقفز */
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=pebbles]{animation:none}
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=pebbles] circle{animation:fxtoss 1.8s cubic-bezier(.34,1.56,.64,1) infinite}
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=pebbles] circle:nth-child(2){animation-delay:.25s}:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=pebbles] circle:nth-child(3){animation-delay:.5s}
@keyframes fxtoss{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}
/* الميقات: الراية ترفرف */
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=miqat] path:nth-child(2){animation:fxflag 1.8s ease-in-out infinite;transform-origin:left center}
@keyframes fxflag{0%,100%{transform:scaleY(1) skewY(0)}50%{transform:scaleY(.7) skewY(-6deg)}}
/* الحماية والمحرمات: علامة الصح تُرسم */
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=shield] path:nth-child(2){stroke-dasharray:12;animation:fxdraw2 2.6s ease-in-out infinite}
@keyframes fxdraw2{0%{stroke-dashoffset:12}40%,85%{stroke-dashoffset:0}100%{stroke-dashoffset:12}}
/* باب المسجد: إشراقة من الداخل */
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=gate] path:nth-child(2){animation:fxshine 2.4s ease-in-out infinite}
@keyframes fxshine{0%,100%{opacity:.5}50%{opacity:1;transform:scale(1.08)}}
/* الصلاة: ركوع خاشع */
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=salat]{animation:fxbow 3.6s ease-in-out infinite;transform-origin:50% 100%}
@keyframes fxbow{0%,40%,100%{transform:scaleY(1)}55%,75%{transform:scaleY(.86)}}
/* التقصير: المقص يقص */
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=scissors]{animation:fxsnip 1.4s ease-in-out infinite}
@keyframes fxsnip{0%,100%{transform:rotate(0)}50%{transform:rotate(-12deg)}}
/* الهلال: يتمايل ويشرق */
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=moon]{animation:fxmoon 4s ease-in-out infinite}
@keyframes fxmoon{0%,100%{transform:rotate(-10deg);opacity:.85}50%{transform:rotate(8deg);opacity:1}}
/* الطهارة: قطرة تسقط */
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=drop]{animation:fxdrip 2s cubic-bezier(.5,0,.5,1) infinite}
@keyframes fxdrip{0%{transform:translateY(-3px) scale(.9,1.1);opacity:.4}50%{transform:translateY(1px) scale(1);opacity:1}80%{transform:translateY(2px) scale(1.12,.86)}100%{transform:translateY(-3px) scale(.9,1.1);opacity:.4}}
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=tent],:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=hady]{animation:fxsway 3.4s ease-in-out infinite}
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=lock]{animation:fxwob 3s ease-in-out infinite}
:is(.tile.fx .ic,.hic,.stn .node) svg[data-i=star]{animation:fxrot 8s linear infinite}
</style>`);
})();
