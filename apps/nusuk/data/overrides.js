// تصحيحات يدوية فوق البيانات المولَّدة آلياً (لا يمسّها المولِّد).
// titles: تصحيح عنوان مسألة.  station: نقل مسألة إلى محطة أخرى.  hide: إخفاء مسألة.
window.OVERRIDES = {
  titles: {
    'umrah_mufrada-047': 'رسم توضيحي لأحكام المواقيت (من إبداع اللجنة التبليغية)',
    'umrah_mufrada-040': 'إحرام الحائض في ميقات ذي الحليفة',
    'umrah_mufrada-059': 'النذر المطلق (نذر التبرع) صحيح كالمعلّق',
  },
  station: {
    // العمرة المفردة: تصحيح التوزيع الآلي
    'umrah_mufrada-011':'general','umrah_mufrada-019':'general','umrah_mufrada-063':'miqat','umrah_mufrada-076':'niyaba','umrah_mufrada-082':'niyaba',
    'umrah_mufrada-100':'ihram','umrah_mufrada-114':'ihram','umrah_mufrada-115':'ihram','umrah_mufrada-117':'ihram','umrah_mufrada-152':'haram',
    'umrah_mufrada-143':'haram','umrah_mufrada-144':'haram','umrah_mufrada-145':'haram','umrah_mufrada-146':'haram','umrah_mufrada-148':'haram','umrah_mufrada-149':'haram',
    'umrah_mufrada-153':'miqat','umrah_mufrada-154':'miqat','umrah_mufrada-156':'miqat','umrah_mufrada-036':'miqat','umrah_mufrada-037':'adab','umrah_mufrada-177':'ihsar',
    'aamal_umrah-119': 'salat',
  },
  hide: [],
  // أسماء المراجع الكاملة للعرض (الاختصار كما في الشرائح يبقى للبحث)
  marajiFull: {
    sistani:'السيد علي السيستاني', khoei:'السيد أبو القاسم الخوئي', khomeini:'السيد روح الله الخميني',
    khamenei:'السيد علي الخامنئي', fayyadh:'الشيخ محمد إسحاق الفياض', hakim:'السيد محمد سعيد الحكيم',
    wahid:'الشيخ حسين الوحيد الخراساني', zanjani:'السيد موسى الشبيري الزنجاني', modarresi:'السيد محمد تقي المدرسي',
    s_shirazi:'السيد صادق الشيرازي', m_shirazi:'السيد محمد الحسيني الشيرازي', makarem:'الشيخ ناصر مكارم الشيرازي',
    fadlallah:'السيد محمد حسين فضل الله', zayn:'الشيخ محمد أمين زين الدين', usfur:'العلامة الشيخ حسين العصفور', sobhani:'الشيخ جعفر السبحاني',
    bashir:'الشيخ بشير النجفي', ihqaqi:'الشيخ حسن الإحقاقي',
    rouhani:'السيد محمد صادق الحسيني الروحاني', sadr:'السيد محمد باقر الصدر', bahjat:'بهجت', haeri:'السيد كاظم الحسيني الحائري', tabrizi:'التبريزي', sanad:'الشيخ محمد السند', sitri:'الشيخ عبد الله الستري', y_usfur:'الشيخ يوسف العصفور صاحب الحدائق',
  },
  // أسماء معتمدة مبدئيًا بانتظار تأكيد المرشد (يشترك غيرهم في اللقب نفسه)
  marajiPending: [],
};
