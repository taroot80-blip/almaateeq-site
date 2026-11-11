// حلّال الحالات: مسارات أسئلة يدوية تنتهي بشجرة فتوى (مفتاحها في RULINGS) وحالة منها اختيارًا.
// result: {key:'<book>-<NNN>', c: رقم الحالة (اختياري، يبدأ من 0)}
window.SOLVER = {
  miqat: { name:'الميقات والإحرام', icon:'miqat', desc:'من أين يُحرم؟ تجاوز الميقات؟ النذر قبل الميقات؟ أجب عن سؤال لتصل إلى الحكم.',
    start:'kind', nodes:{
      kind:{ q:'ما المسألة؟', options:[
        {label:'سيصل بالطائرة إلى جدة', next:'jedda'},
        {label:'تجاوز الميقات بلا إحرام', next:'tajawuz'},
        {label:'النذر بالإحرام قبل الميقات', next:'nadhr'},
        {label:'الحائض وإحرامها', next:'hayd'},
        {label:'المحصور (مرض) أو المصدود (منع)', next:'hasr'},
      ]},
      jedda:{ q:'ما الذي تريد معرفته؟', options:[
        {label:'هل يصح الإحرام من جدة؟', result:{key:'umrah_mufrada-041', c:3}},
        {label:'أقوال وظيفة النازل في جدة', result:{key:'umrah_mufrada-045'}},
        {label:'الإحرام من الطائرة بمحاذاة الميقات', result:{key:'umrah_mufrada-054'}},
      ]},
      tajawuz:{ q:'كيف تجاوزه؟', options:[
        {label:'عالمًا عامدًا', result:{key:'umrah_mufrada-063', c:4}},
        {label:'نسيانًا أو جهلًا', result:{key:'umrah_mufrada-063', c:9}},
        {label:'أحرم قبل الميقات أو بعده', result:{key:'umrah_mufrada-063', c:1}},
      ]},
      nadhr:{ q:'ما المسألة في النذر؟', options:[
        {label:'النذر في الطائرة أثناء الطيران', result:{key:'umrah_mufrada-055'}},
        {label:'إذا استلزم التظليل', result:{key:'umrah_mufrada-056'}},
        {label:'صيغة النذر', result:{key:'umrah_mufrada-057'}},
        {label:'إذن الزوج في نذر الزوجة', result:{key:'umrah_mufrada-060'}},
      ]},
      hayd:{ q:'ما الحالة؟', options:[
        {label:'إحرامها في مسجد الشجرة', result:{key:'umrah_mufrada-040'}},
        {label:'تعلم أن الحيض سيمنعها من الطواف', result:{key:'umrah_mufrada-063'}},
      ]},
      hasr:{ q:'ما الحالة؟', options:[
        {label:'المصدود: وظيفته في العمرة', result:{key:'umrah_mufrada-167', c:7}},
        {label:'منعت من صعود الطائرة بعد الإحرام', result:{key:'umrah_mufrada-167', c:12}},
        {label:'المحصور: خطوات التحلل', result:{key:'umrah_mufrada-175'}},
        {label:'مرض في مكة ونُقل إلى بلده', result:{key:'umrah_mufrada-177'}},
      ]},
    }},
  kaffara: { name:'كفارات محرمات الإحرام', icon:'drop', desc:'ارتكب الحاج محظورًا من محظورات الإحرام؟ اختر نوعه لتصل إلى الكفارة.',
    start:'kind', nodes:{
      kind:{ q:'ما الذي ارتكبه؟', options:[
        {label:'فعله جهلًا أو نسيانًا', result:{key:'muharramat-106'}},
        {label:'شعرٌ: حلق، نتف، تساقط بالعبث', next:'shaar'},
        {label:'طيب أو ادِّهان', next:'tib'},
        {label:'تزيُّن (حناء، خاتم، حلي، كحل، مرآة)', result:{key:'muharramat-080'}},
        {label:'تقليم الأظفار', result:{key:'muharramat-112'}},
        {label:'إخراج الدم أو قلع الضرس', next:'dam'},
        {label:'تغطية المرأة وجهها', result:{key:'muharramat-104'}},
        {label:'الفسوق أو الجدال', next:'lisan'},
        {label:'قتل هوام الجسد', result:{key:'muharramat-109'}},
      ]},
      shaar:{ q:'ما الذي حدث للشعر؟', options:[
        {label:'سقطت شعرة أو أكثر بالعبث', result:{key:'muharramat-076'}},
        {label:'حلق شعر الرأس', result:{key:'muharramat-110'}},
        {label:'نتف الإبط أو اللحية، أو سقط الشعر في الطهارة', result:{key:'muharramat-111'}},
      ]},
      tib:{ q:'ما نوعه؟', options:[
        {label:'استعمال الطيب (أكلًا أو لبسًا أو شمًّا)', result:{key:'muharramat-093'}},
        {label:'ادِّهان عن علم وعمد', result:{key:'muharramat-084'}},
        {label:'ادِّهان عن جهل', result:{key:'muharramat-085'}},
      ]},
      dam:{ q:'ما الحالة؟', options:[
        {label:'إخراج الدم (حكّ، سواك…)', result:{key:'muharramat-113'}},
        {label:'قلع الضرس', result:{key:'muharramat-115'}},
      ]},
      lisan:{ q:'ما الذي صدر منه؟', options:[
        {label:'كذب أو سباب أو مفاخرة', result:{key:'muharramat-117'}},
        {label:'جدال (حلف: لا والله، بلى والله)', result:{key:'muharramat-118'}},
      ]},
    }},
  qat: { name:'قطع الطواف', icon:'tawaf', desc:'قطعتَ الطواف أو قطعه حاجٌّ معك؟ أجب عن سؤالين لتصل إلى الحكم.',
    start:'cause', nodes:{
      cause:{ q:'ما سبب قطع الطواف؟', options:[
        {label:'حدثٌ أصغر (بول، نوم، ريح…)', next:'hadath'},
        {label:'قضاء حاجة مؤمن أو عيادة مريض', next:'haja'},
        {label:'مرضٌ ألجأه فخرج من المطاف', next:'marad'},
        {label:'صلاة الفريضة أو الجماعة', next:'salat'},
        {label:'الاستراحة', next:'rest'},
        {label:'بلا عذر', next:'noexcuse'},
        {label:'طروء الحيض', result:{key:'aamal_umrah-071'}},
      ]},
      hadath:{ q:'متى أحدث؟', options:[
        {label:'قبل بلوغ النصف (3.5 أشواط)', result:{key:'aamal_umrah-066'}},
        {label:'بعد النصف وقبل إتمام الرابع', result:{key:'aamal_umrah-067'}},
        {label:'بعد إتمام الرابع، باختياره', result:{key:'aamal_umrah-068'}},
        {label:'بعد إتمام الرابع، بغير اختياره', result:{key:'aamal_umrah-069'}},
      ]},
      haja:{ q:'كم أتمّ من الطواف حين قطعه؟', options:[
        {label:'أقل من ثلاثة أشواط', result:{key:'aamal_umrah-083', c:0}},
        {label:'بعد الثلاثة وقبل النصف', result:{key:'aamal_umrah-084'}},
        {label:'بعد النصف وقبل إتمام الرابع', result:{key:'aamal_umrah-085'}},
        {label:'بعد إتمام الرابع', result:{key:'aamal_umrah-086'}},
      ]},
      marad:{ q:'كم أتمّ من الطواف حين خرج؟', options:[
        {label:'قبل بلوغ النصف', result:{key:'aamal_umrah-088'}},
        {label:'بعد النصف وقبل إتمام الرابع', result:{key:'aamal_umrah-089'}},
        {label:'بعد إتمام الرابع', result:{key:'aamal_umrah-090'}},
      ]},
      salat:{ q:'كم أتمّ من الطواف حين قطعه للصلاة؟', options:[
        {label:'قبل بلوغ النصف', result:{key:'aamal_umrah-096'}},
        {label:'بعد النصف وقبل إتمام الرابع', result:{key:'aamal_umrah-097'}},
        {label:'بعد إتمام الرابع', result:{key:'aamal_umrah-098'}},
        {label:'اضطر للخروج من المطاف مع قيام الجماعة', result:{key:'aamal_umrah-093'}},
      ]},
      rest:{ q:'هل فاتت الموالاة أو خرج من المطاف؟', options:[
        {label:'لم تفت الموالاة', result:{key:'aamal_umrah-100'}},
        {label:'فاتت الموالاة', result:{key:'aamal_umrah-101', c:0}},
        {label:'خرج عن المطاف (رأي السيد الحكيم)', result:{key:'aamal_umrah-102'}},
      ]},
      noexcuse:{ q:'ماذا تريد أن تعرف؟', options:[
        {label:'هل يجوز قطع الطواف الواجب بلا عذر؟', result:{key:'aamal_umrah-059', c:0}},
        {label:'قطعه ولم يأت بمنافٍ ولم تفت الموالاة', result:{key:'aamal_umrah-060'}},
        {label:'يريد إعادة الطواف قبل زوال الموالاة', result:{key:'aamal_umrah-061'}},
      ]},
    }},
  shak: { name:'الشك في الأشواط', icon:'tawaf2', desc:'شكٌّ في عدد الأشواط أو زيادة أو نقص.',
    start:'when', nodes:{
      when:{ q:'متى وقع الشك أو السهو؟', options:[
        {label:'أثناء الطواف', next:'during'},
        {label:'بعد الانصراف من الطواف', result:{key:'aamal_umrah-042'}},
        {label:'زاد في الطواف سهوًا', next:'zyada'},
      ]},
      during:{ q:'بين أيّ الأشواط شكّ؟', options:[
        {label:'بين السادس والسابع', result:{key:'aamal_umrah-039', c:0}},
        {label:'بين الخامس والسادس أو أقل', result:{key:'aamal_umrah-039', c:1}},
        {label:'بين السابع والثامن قبل الوصول للحجر', result:{key:'aamal_umrah-040', c:0}},
        {label:'بين السابع والثامن بعد الوصول للحجر', result:{key:'aamal_umrah-040', c:1}},
        {label:'استمر في الطواف حتى يتذكّر العدد', result:{key:'aamal_umrah-041'}},
      ]},
      zyada:{ q:'متى تذكّر الزيادة؟', options:[
        {label:'قبل بلوغ الركن العراقي', result:{key:'aamal_umrah-043', c:0}},
        {label:'قبل إكمال شوط زائد كامل', result:{key:'aamal_umrah-043', c:1}},
        {label:'بعد بلوغ الركن العراقي', result:{key:'aamal_umrah-044', c:0}},
        {label:'بعد إكمال شوط زائد', result:{key:'aamal_umrah-044', c:1}},
      ]},
    }},
  sai: { name:'مسائل السعي', icon:'sai', desc:'شكٌّ في أشواط السعي، أو خطأ في البدء، أو موضع السعي.',
    start:'kind', nodes:{
      kind:{ q:'ما نوع المسألة؟', options:[
        {label:'شكٌّ في عدد الأشواط', next:'shak'},
        {label:'بدأ بالمروة جهلًا أو خطأ', result:{key:'aamal_umrah-176'}},
        {label:'زاد في السعي سهوًا أو جهلًا', result:{key:'aamal_umrah-181'}},
        {label:'قطع السعي أو اختلّت الموالاة', next:'qat'},
        {label:'مكان السعي (التوسعة، الطابق الثاني، العربة)', next:'place'},
      ]},
      shak:{ q:'متى وقع الشك؟', options:[
        {label:'أثناء السعي', result:{key:'aamal_umrah-182', c:0}},
        {label:'بعد الفراغ من السعي وقبل التقصير', result:{key:'aamal_umrah-184'}},
        {label:'بعد التقصير', result:{key:'aamal_umrah-183'}},
      ]},
      qat:{ q:'ما الذي حدث؟', options:[
        {label:'قطعته صلاة الجماعة', result:{key:'aamal_umrah-162'}},
        {label:'قطعه ليشرع من جديد', result:{key:'aamal_umrah-165'}},
        {label:'هل تشترط الموالاة بين الأشواط؟', result:{key:'aamal_umrah-161'}},
        {label:'أخّر السعي إلى الليل أو اليوم التالي', result:{key:'aamal_umrah-167'}},
      ]},
      place:{ q:'أين سعى؟', options:[
        {label:'في التوسعة العرضية (المسعى الجديد)', result:{key:'aamal_umrah-168'}},
        {label:'في الطابق الثاني', result:{key:'aamal_umrah-173'}},
        {label:'في السرداب', result:{key:'aamal_umrah-172'}},
        {label:'على عربة يحركها غيره', result:{key:'aamal_umrah-174', c:0}},
      ]},
    }},
  hayd: { name:'الحيض والاستحاضة في الطواف', icon:'drop', desc:'طروء الحيض، أو أحكام المستحاضة للطواف وصلاته.',
    start:'kind', nodes:{
      kind:{ q:'ما الحالة؟', options:[
        {label:'طرأ الحيض أثناء الطواف', result:{key:'aamal_umrah-071'}},
        {label:'طرأ الحيض بعد الطواف وقبل صلاته', result:{key:'aamal_umrah-146'}},
        {label:'مستحاضة: ما وظيفتها للطواف وصلاته؟', next:'istihada'},
        {label:'دم متقطع إثر تناول الحبوب', result:{key:'aamal_umrah-138'}},
        {label:'استنابت للطواف ثم طهرت', result:{key:'aamal_umrah-151'}},
      ]},
      istihada:{ q:'ما نوع الاستحاضة؟', options:[
        {label:'قليلة', result:{key:'aamal_umrah-128'}},
        {label:'متوسطة', result:{key:'aamal_umrah-130'}},
        {label:'كثيرة', result:{key:'aamal_umrah-131'}},
      ]},
    }},
  salat: { name:'صلاة الطواف', icon:'salat', desc:'مكانها، ونسيانها، والخطأ فيها.',
    start:'kind', nodes:{
      kind:{ q:'ما المسألة؟', options:[
        {label:'أين تُصلّى صلاة الطواف؟', result:{key:'aamal_umrah-109'}},
        {label:'لم يتمكن من الصلاة خلف المقام', result:{key:'aamal_umrah-110'}},
        {label:'نسي صلاة الطواف', next:'nisyan'},
        {label:'صلّاها في غير موضعها', result:{key:'aamal_umrah-118'}},
        {label:'لم يبادر إليها بعد الطواف', result:{key:'aamal_umrah-105'}},
      ]},
      nisyan:{ q:'متى تذكّر؟', options:[
        {label:'أثناء السعي أو بعد الأعمال وهو في مكة', result:{key:'aamal_umrah-121'}},
        {label:'بعد خروجه من مكة', result:{key:'aamal_umrah-122'}},
      ]},
    }},
  tahara: { name:'الطهارة والنجاسة في الطواف', icon:'drop', desc:'شكٌّ في الوضوء، أو نجاسة في البدن أو الثوب.',
    start:'kind', nodes:{
      kind:{ q:'ما نوع المسألة؟', options:[
        {label:'شكٌّ في الوضوء', next:'wudu'},
        {label:'نجاسة في البدن أو الثوب', next:'najasa'},
        {label:'دمٌ يُعفى عنه؟', next:'dam'},
      ]},
      wudu:{ q:'متى وقع الشك؟', options:[
        {label:'أثناء الطواف: هل كان على وضوء؟', result:{key:'aamal_umrah-051', c:0}},
        {label:'قبل الطواف أو أثناءه وهو مسبوق بالطهارة', result:{key:'aamal_umrah-052', c:0}},
        {label:'قبل الطواف أو أثناءه وغير مسبوق بالطهارة', result:{key:'aamal_umrah-052', c:1}},
        {label:'علم ببطلان الوضوء بعد التقصير', result:{key:'aamal_umrah-054'}},
      ]},
      najasa:{ q:'متى علم بالنجاسة؟', options:[
        {label:'علم بعد الطواف بنجاسة كانت حاله', result:{key:'aamal_umrah-018'}},
        {label:'نسيها فتذكّرها بعد الطواف', result:{key:'aamal_umrah-019'}},
        {label:'نسيها فتذكّرها بعد صلاة الطواف', result:{key:'aamal_umrah-020'}},
        {label:'حصلت أو علم بها أثناء الطواف', result:{key:'aamal_umrah-021'}},
        {label:'يحمل شيئًا متنجسًا', result:{key:'aamal_umrah-016', c:0}},
      ]},
      dam:{ q:'ما نوع الدم؟', options:[
        {label:'أقل من الدرهم', result:{key:'aamal_umrah-010'}},
        {label:'دم القروح والجروح', result:{key:'aamal_umrah-011', c:0}},
        {label:'دم البواسير', result:{key:'aamal_umrah-013'}},
      ]},
    }},
};
