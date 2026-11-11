// طمس مراجع من العرض كله دون حذفهم من البيانات الأصلية.
// للإظهار من جديد: احذف المعرّف من القائمة HIDDEN أدناه.
(function(){
  const HIDDEN=['fadlallah'];
  // الأسماء كما تُكتب في النصوص (المصادر والملاحظات والعناوين)
  const NAMES={fadlallah:'فضل الله'};
  if(!HIDDEN.length)return;
  window.HIDDEN_MARAJI=HIDDEN;
  const hid=new Set(HIDDEN);

  // ===== تنقية النص من ذكر المرجع المطموس =====
  const SEP=/[،؛.]/;
  // ما يسبق الاسم: رابط قائمة ثم بادئة مصدر
  const PRE=/(\s*[،؛]\s*|\s*[–-]\s*|\s+و|^و|\s+)?((?:\(استفتاءات في الحج\)\s*|استفتاءات الحج ل|(?:دليل|مناسك|منسك|مكتب)\s+(?:السيد\s+)?|و?السيد\s+|و)?)\(?$/;
  // ما يلحق الاسم من أرقام المسائل والطبعات
  const CIT=/^(?:\s*(?:\(دليله[^)]*\)|[مسق]\s?\d+|م(?=[\s،؛.)]|$)|بعد\s*(?:مسألة\s*)?م?\s?\d*|و\s*م?\s?\d+|إلى\s*م?\s?\d+|ط\s?\d+(?:\s*المصححة)?|على الموقع الإلكتروني|واستفتاءاته[^،؛.]*|ق(?=\s))(?:\s*[….]{2,})?)+/;
  function stripName(s,name){
    let out=s, guard=0, i;
    while((i=findName(out,name))>=0 && guard++<40){
      const before=out.slice(0,i), after0=out.slice(i+name.length);
      const pm=before.match(PRE)||['','',''];
      const listJoin=!!(pm[1]&&/[،؛–-]|و/.test(pm[1]))&&!pm[2].replace(/^و/,'');
      let start=i-pm[0].length;
      let after=after0.replace(/^\s+الهاشمي/,'');
      const paren=/\($/.test(before)&&/^\)/.test(after);
      if(paren)after=after.slice(1);
      let end;
      const cm=after.match(CIT);
      if(/^\s*:/.test(after)&&!/^\s*:\s*لم\s/.test(after)||paren&&!/^\s*[:،؛.]/.test(after)&&/^\s*\S/.test(after)&&!cm){
        // «فضل الله: …» أو «(فضل الله) كتاب …» → حتى الفاصل التالي
        const rest=after.replace(/^\s*:/,'');
        const k=rest.search(SEP);
        end=out.length-(k<0?0:rest.length-k);
      }else if(/^\s*:\s*لم\s/.test(after)){
        end=out.length-after.length; // «الزنجاني، فضل الله: لم يتعرَّضا» → يبقى ما بعد النقطتين
      }else if(cm){
        end=out.length-after.length+cm[0].length;
      }else if(/^\s*($|[،؛.)»"']|[–-]|و)/.test(after)||listJoin){
        end=out.length-after.length;
      }else{
        // الاسم فاعل جملة: تُحذف الجملة كلها
        const b=before.search(/[^.]*$/); start=b<0?0:b;
        const k=after.search(/\./);
        end=k<0?out.length:out.length-after.length+k+1;
      }
      if(/\.\s*$/.test(out.slice(0,start)))while(out[end]==='.'||out[end]===' '&&out[end+1]==='.')end++;
      out=out.slice(0,start)+out.slice(end);
    }
    return tidy(out);
  }
  function findName(s,name){
    let from=0,i;
    while((i=s.indexOf(name,from))>=0){ if(i===0||s[i-1]!=='ب')return i; from=i+1; }
    return -1;
  }
  const tidy=s=>s.replace(/\(\s*[،–-]?\s*\)/g,'').replace(/\(\s*[،–-]\s*/g,'(').replace(/\s*[،–-]\s*\)/g,')')
    .replace(/([،؛])\s*[،؛]/g,'$1').replace(/(^|\.)\s*[،؛]\s*/g,'$1 ').replace(/\s*[،؛]\s*(\.|$)/g,'$1')
    .replace(/:\s*\./g,'.').replace(/\s{2,}/g,' ').replace(/^\s*[.،؛:]\s*/,'').trim();
  const clean=s=>{let o=s;for(const k of HIDDEN)if(findName(o,NAMES[k])>=0)o=stripName(o,NAMES[k]);return o};

  // ===== تنقية البُنى =====
  function walk(x){
    if(typeof x==='string')return clean(x);
    if(Array.isArray(x))return x.map(walk).filter(v=>v!==undefined);
    if(!x||typeof x!=='object')return x;
    if(Array.isArray(x.maraji)){
      const had=x.maraji.length;
      x.maraji=x.maraji.filter(m=>!hid.has(m));
      if(had&&!x.maraji.length&&('ruling' in x))return undefined; // قول خاص بالمطموس
    }
    if(x.notes&&typeof x.notes==='object')for(const k of HIDDEN)delete x.notes[k];
    for(const k of Object.keys(x)){
      if(k==='maraji'||k==='id'||k==='book'||k==='station')continue;
      const v=walk(x[k]);
      if(v===undefined||v===''&&typeof x[k]==='string'&&x[k]!=='')delete x[k]; else x[k]=v;
    }
    if(Array.isArray(x.opinions)&&!x.opinions.length)return undefined; // حالة لم يبق فيها قول
    return x;
  }

  window.MARAJI=window.MARAJI.filter(m=>!hid.has(m.id));
  (window.ISSUES||[]).forEach(walk);
  if(window.RULINGS)for(const id of Object.keys(window.RULINGS))walk(window.RULINGS[id]);
  window.cleanHiddenMaraji=clean;
  try{ const m=JSON.parse(localStorage.getItem('nusk:marja')||'null'); if(hid.has(m))localStorage.removeItem('nusk:marja'); }catch(e){}
})();
