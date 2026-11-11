// الواجهة ثنائية اللغة: العربية أساسًا، وتحت كل زر وعنوان ترجمته الإنجليزية بخط أصغر وواضح.
// لا تُترجَم الأحكام نفسها (نص الفتوى)، بل الواجهة: الأزرار والعناوين والأبواب والقوائم.
'use strict';
const EN={
'مرشد النسك':'Murshid al-Nusuk','العمرة المفردة':'Umrah Mufradah','حج التمتع':'Hajj al-Tamattu‘','ابدأ رحلة النسك':'Start the journey',
'أبواب الدليل':'Guide sections','رحلة النسك':'Pilgrimage journey','المحطات بالترتيب من الميقات إلى الإحلال':'Stations in order, from Miqat to release',
'الفهرس الكامل':'Full index','شجرة الفتوى':'Fatwa tree','خريطة المواقيت':'Miqat map','المواقيت الخمسة وأدنى الحل':'The five Miqats & Adna al-Hill',
'خريطة المشاعر':'Holy sites map','مكة ومنى ومزدلفة وعرفات':'Makkah, Mina, Muzdalifah, Arafat','العدّادات':'Counters','الطواف والسعي ورمي الجمار':'Tawaf, Sa‘i & stoning',
'حلّال الحالات':'Case solver','أسئلة قصيرة توصلك إلى الحكم':'Short questions lead to the ruling','مقارنة مرجعين':'Compare two Marja‘s','الأقوال متقابلة ومواضع الخلاف':'Side by side, with differences',
'اختبار المرشدين':'Guides’ quiz','اختبارات جاهزية الحاج':'Pilgrim readiness tests','بطاقات مقلوبة لكل منسك، النجاح بـ٩٠٪':'Flip cards per rite, pass at 90%','أسئلة تدريبية من المشجّرات':'Practice questions from the trees','الباحث':'Search','كتابة، صوت، وتصوير السؤال':'Text, voice & photo search',
'تدريس الحجاج':'Teach pilgrims','عرض تقديمي بملء الشاشة للقاعة':'Full-screen presentation','عرض تقديمي للقاعة':'Classroom presentation','تواصل مستعجل':'Urgent contact',
'المرشد، الفقيه، والطوارئ':'Guide, scholar & emergency','المرشد والطوارئ':'Guide & emergency','التخصيص':'Personalize','المرجع، النسك، حجم الخط':'Marja‘, rite, text size',
'المسائل المستجدة':'New issues','أضف مسألة وتُدمج فورًا':'Add an issue, merged instantly','أضف مسألة واحفظها':'Add & save an issue','أبواب عامة':'General topics',
'أنواع العمرة وأحكامها العامة':'Types of Umrah & general rules','النيابة':'Proxy (Niyabah)','الحائض والمستحاضة':'Menstruation & Istihadah','الصبي وغير البالغ':'Children',
'المحصور والمصدود':'The prevented (Muhsar & Masdud)','الأدعية والآداب':'Supplications & etiquette','صنّاع الدليل':'Made by','الرئيسية':'Home','الرحلة':'Journey','الأدوات':'Tools','مرجعي':'My Marja‘',
'التالية':'Next','السابقة':'Previous','التالي':'Next','السابق':'Previous','البحث':'Search','نغمات الأزرار':'Button sounds','مقاس الشاشة':'Screen size','مقاس العرض':'Display size',
'الميقات والإحرام':'Miqat & Ihram','محرّمات الإحرام':'Ihram prohibitions','محرمات الإحرام':'Ihram prohibitions','دخول الحرم ومكة':'Entering the Haram & Makkah','الطواف':'Tawaf','صلاة الطواف':'Tawaf prayer',
'السعي':'Sa‘i','التقصير':'Taqsir (trimming)','طواف النساء وصلاته':'Tawaf al-Nisa’ & its prayer','طواف الحج وسعيه وطواف النساء':'Hajj Tawaf, Sa‘i & Tawaf al-Nisa’',
'العدّادات والأدوات':'Counters & tools','عدّاد الطواف':'Tawaf counter','سبعة أشواط حول الكعبة':'Seven rounds of the Ka‘bah','عدّاد السعي':'Sa‘i counter','من الصفا إلى المروة':'From Safa to Marwah',
'رمي الجمار':'Stoning the Jamarat','الحصيات والجمرات بالترتيب':'Pebbles & Jamarat in order','مخطط تقريبي':'Approximate diagram','العمل دون إنترنت':'Work offline',
'الأحكام والمراجع':'Rulings & Marja‘s','نص الشرائح':'Slide text','موضوعي':'By topic','صلاة الطواف والسعي والتقصير':'Tawaf prayer, Sa‘i & Taqsir','الإحرام والميقات':'Ihram & Miqat',
'محرمات الإحرام والكفارات':'Prohibitions & expiations','المسائل المفرّعة':'Branched issues','كفارات محرمات الإحرام':'Expiations of Ihram violations','قطع الطواف':'Interrupting Tawaf',
'الشك في الأشواط':'Doubt in the rounds','مسائل السعي':'Sa‘i issues','الحيض والاستحاضة في الطواف':'Menstruation during Tawaf','الطهارة والنجاسة في الطواف':'Purity & impurity in Tawaf',
'شارك':'Share','المشجّرة':'Original chart','أضف مسألة مستجدة':'Add a new issue','المحفوظة':'Saved','الدمج في النسخة العامة':'Merge into public version','صدّر الملف':'Export file',
'أرسل':'Send','استورد':'Import','مسألة مستجدة':'New issue','توثيق المسألة من مصدرها':'Document the source','المصدر':'Source','رقم الصفحة أو المسألة':'Page or issue no.',
'صورة العبارة من مصدرها':'Photo of the text from the source','تابع إلى كتابة المسألة':'Continue to write the issue','إلغاء':'Cancel','نص المسألة وأقوال المراجع':'Issue text & opinions',
'سؤال شرعي مستعجل':'Urgent religious question','السؤال':'Question','المرجع':'Marja‘','أضف جهة شرعية':'Add a religious contact','ابحث في الأحكام أولًا':'Search the rulings first',
'أرقام الطوارئ في السعودية':'Emergency numbers in Saudi Arabia','الطوارئ الموحد':'Unified emergency','الإسعاف (الهلال الأحمر)':'Ambulance (Red Crescent)','الشرطة':'Police',
'الدفاع المدني':'Civil defense','المرور':'Traffic','أمن الطرق':'Highway patrol','الطوارئ الدولي':'International emergency','بطاقة الحاج للمسعفين':'Pilgrim card for paramedics',
'الإعدادات ورمز الحملة':'Settings & group code','إعدادات التواصل':'Contact settings','رمز الحملة':'Group code','الصق رمز الحملة':'Paste group code','طبّق الرمز':'Apply code',
'انسخ رمز حملتي':'Copy my group code','أرقام الحملة':'Group numbers','اسم المرشد':'Guide name','هاتف المرشد (مع رمز الدولة)':'Guide phone (with country code)',
'رابط مجموعة واتساب للحملة':'Group WhatsApp link','هاتف السفارة أو القنصلية':'Embassy / consulate phone','الجهات الشرعية للتواصل المستعجل':'Religious contacts for urgent questions',
'أضف الجهة':'Add contact','بطاقة الحاج':'Pilgrim card','الاسم':'Name','الجنسية':'Nationality','فصيلة الدم':'Blood type','أمراض مزمنة':'Chronic conditions','أدوية يتناولها':'Medications',
'حساسية':'Allergies','الحملة':'Hajj group','السكن في مكة / المدينة':'Accommodation','رقم أهله في البلد':'Family contact at home','احفظ':'Save','رجوع':'Back','أبواب الأحكام':'Ruling sections',
'نوع النسك':'Type of rite','مرجع تقليدك':'Your Marja‘','حجم الخط':'Text size','صغير':'Small','متوسط':'Medium','كبير':'Large','أكبر':'Larger','أعد عرض الترحيب':'Replay welcome','تم':'Done',
'عن الدليل':'About','نزّل كل الشرائح':'Download all slides','افتح العدّاد':'Open counter','المسائل':'Issues','النص':'Text','احفظ وادمج الآن':'Save & merge now','محفوظة':'Saved',
'مسائل المواقيت':'Miqat issues','تسلسل أيام الحج':'Hajj days in order','شوط':'Round','تراجع':'Undo','من جديد':'Restart','حصاة':'Pebble','تصفير اليوم':'Reset day',
'اتصل بالمرشد':'Call the guide','أرسل موقعي للمرشد':'Send my location','مجموعة الحملة':'Group chat','السفارة / القنصلية':'Embassy / consulate','إيميل':'Email','واتساب':'WhatsApp','اتصال':'Call',
'تلقائي':'Auto','هاتف':'Phone','آيباد / تابلت':'iPad / tablet','لابتوب':'Laptop','سطح المكتب':'Desktop','تلفاز ذكي':'Smart TV','إغلاق':'Close','تخطَّ':'Skip','ابدأ':'Start',
'خصّص الدليل':'Personalize the guide','الحالة':'Case','القول':'Opinion','أضف قولًا':'Add an opinion','أضف حالة أخرى':'Add another case','الباب':'Section','نص المسألة':'Issue text',
'ملاحظة عامة (اختياري)':'General note (optional)','افتح المسألة كاملة':'Open full issue','افتح الشجرة':'Open tree','ابدأ من جديد':'Start over','اختبار جديد':'New quiz','النتيجة':'Result',
'المراجع':'Marja‘s','إحرام الحج':'Hajj Ihram','الوقوف بعرفات':'Standing at Arafat','المشعر الحرام':'Al-Mash‘ar al-Haram','رمي جمرة العقبة':'Stoning Jamrat al-‘Aqabah',
'الهدي':'Sacrifice (Hady)','الحلق أو التقصير':'Shaving or trimming','المبيت بمنى':'Overnight in Mina','رمي الجمار الثلاث':'Stoning the three Jamarat',
'المواقيت':'The Miqats','من الإحرام إلى الإحلال':'From Ihram to release','الحرم المكي':'The Makkan Haram','المطاف':'Mataf','خلف مقام إبراهيم':'Behind Maqam Ibrahim','بين الصفا والمروة':'Between Safa & Marwah',
'بعد السعي':'After Sa‘i','مكة المكرمة':'Makkah','عرفات':'Arafat','مزدلفة':'Muzdalifah','منى':'Mina','العمرة':'Umrah','الحج':'Hajj','مسائل يُذكر فيها':'Issues mentioning','أدوات':'Tools','خروج':'Exit','دروس الباوربوينت':'PowerPoint lessons','إبراز مرجع':'Highlight a Marja‘',
};
const EN_RX=[[/^([\d٠-٩]+) مسألة مشجّرة$/,'$1 issues with trees'],[/^([\d٠-٩]+) مسألة$/,'$1 issues'],[/^([\d٠-٩]+) أسئلة$/,'$1 questions'],[/^([\d٠-٩]+) مسألة في ([\d٠-٩]+) كتب$/,'$1 issues in $2 books'],
  [/^أقوال المراجع مفرّعة \| ([\d٠-٩]+) مسألة حتى الآن$/,'Marja‘ opinions branched | $1 issues so far'],[/^محلّ خلاف: (.+)$/,'Disputed'],[/^محلّ اتفاق/,'Agreed'],[/^شارك رأي (.+)$/,'Share opinion'],
  [/^شارك صورةً$/,'Share as image'],[/^يوم ([\d٠-٩]+)$/,'Day $1']];
const toLat=s=>s.replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
function enOf(t){t=t.replace(/[\u{1F300}-\u{1FAFF}☀-➿️🔘＋+⬇⬆☆★←→✕]/gu,'').replace(/\s+/g,' ').replace(/\s*\*$/,'').trim();if(!t)return '';
  if(EN[t])return EN[t];for(const [rx,r] of EN_RX)if(rx.test(t))return toLat(t.replace(rx,r));
  return ''}
const EN_SEL='.tile b, .tile>span:last-child, .dock a span:not(.en), header.top h1, .h2, .tabs button, .btn:not(.sosbig), .seg button, .om span, .sosbig b, .gh b, .obs>b, .dvb b, .tb, .cform label, .stn b, .hero h2, .verdict .badge, .chip[data-path], .dvc h3, .onc h2, .cbox legend';
function addEN(root=document){if(!store.get('en',true))return;
  $$(EN_SEL,root).forEach(el=>{if(el.querySelector(':scope > .en')||el.closest('#tstage .cops')||el.classList.contains('en'))return;
    const c=el.cloneNode(true);c.querySelectorAll('svg,small,.netmark,.num,input,select,textarea,.upl,.mjs,.tones,button,img').forEach(x=>x.remove());
    const e=enOf(c.textContent);if(!e)return;
    const tag=el.matches('label,.cform label')?'span':'small';
    const firstCtl=el.matches('label')?el.querySelector('input,select,textarea,.upl,div'):null;
    const s=document.createElement(tag);s.className='en';s.lang='en';s.dir='ltr';s.textContent=e;
    firstCtl?el.insertBefore(s,firstCtl):el.appendChild(s)})}
function clearEN(){$$('.en').forEach(x=>x.remove())}
new MutationObserver(()=>{if(addEN.t)return;addEN.t=setTimeout(()=>{addEN.t=0;addEN()},40)}).observe(document.body,{childList:true,subtree:true});
addEventListener('DOMContentLoaded',()=>addEN());
// تبديل الترجمة من صفحة التخصيص
addEventListener('hashchange',()=>setTimeout(enToggle,60));addEventListener('DOMContentLoaded',()=>setTimeout(enToggle,80));
function enToggle(){if(!location.hash.startsWith('#/settings')||$('#enpick'))return;const card=$('#app .card.pad');if(!card)return;
  card.insertAdjacentHTML('beforeend',`<div class="obs" id="enpick"><b>الترجمة الإنجليزية</b><div class="seg"><button data-en="1" class="${store.get('en',true)?'on':''}">إظهار English</button><button data-en="0" class="${store.get('en',true)?'':'on'}">العربية فقط</button></div></div>`);
  $$('[data-en]').forEach(b=>b.onclick=()=>{store.set('en',b.dataset.en==='1');$$('[data-en]').forEach(x=>x.classList.toggle('on',x===b));store.get('en',true)?addEN():clearEN()})}
document.head.insertAdjacentHTML('beforeend',`<style>
.en{display:block;font:600 .68em/1.25 'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;letter-spacing:.2px;opacity:.82;margin-top:2px;text-transform:none;font-style:normal}
.btn .en,.seg button .en,.tabs button .en,.tb .en,.om .en{font-size:.62em}
.btn{flex-wrap:wrap;row-gap:0}.btn>.en{flex-basis:100%;text-align:center;margin-top:0}
.dock a .en{font-size:.55rem;opacity:.75;margin:0}
header.top h1 .en,.h2 .en,.hero h2 .en,.gh b .en,.dvc h3 .en,.onc h2 .en{font-size:.5em;color:var(--muted);font-family:'Segoe UI',Roboto,Arial,sans-serif}
.h2,.top h1{flex-wrap:wrap}.h2>.en,.top h1>.en{flex-basis:100%;order:9;margin-top:-2px}
.cform label>select,.cform .sel{display:block;max-width:100%}
.tile>span .en{display:none}
.sosbig b{display:block;max-width:100%;align-self:stretch}.en{white-space:normal;overflow-wrap:anywhere}.tile b .en{font-size:.62em;color:var(--gold);opacity:.9}
.cform label>.en{display:inline;margin-inline-start:6px;font-size:.72em;color:var(--muted)}
.verdict .badge .en{display:inline;margin-inline-start:4px}
.seg button .en{color:inherit}
</style>`);
