/* =====================================================================
   بيانات «الجامعة الحوزوية»
   ---------------------------------------------------------------------
   هذا هو الملف الوحيد الذي تحتاج إلى تعديله لإضافة الدروس والكتب.
   افتحه بأي محرر نصوص، وغيّر ما بين علامات التنصيص "..." فقط.

   كيف تضيف وصلة لدرس؟
     انسخ سطراً من سطور links والصقه تحته، ثم غيّر:
       name    : اسم الوصلة (مثل: الدورة الكاملة، شرح مختصر)
       teacher : اسم الأستاذ الذي يلقي الدرس في هذه الوصلة
       type    : نوعها، واحد من ثلاثة فقط: "صوتي" أو "فيديو" أو "كتابة"
       url     : الرابط الحقيقي (يوتيوب، تلغرام، ساوندكلاود، ملف PDF ...)
     ولكل عنوان حقل اختياري stage يظهر شارةً عليه، مثل: "مقدمات وسطوح".
     الرابط "#" يعني أن الوصلة تجريبية لم يُضف رابطها بعد.

   كيف تضيف عنواناً (درساً) جديداً؟
     انسخ كتلة { title: ..., links: [ ... ] } كاملة والصقها بعد فاصلة.

   كيف تضيف كتاباً؟
     أضف سطراً في books تحت القسم المناسب: مصادر أو متون أو شروح.

   مصدر الوصلات: «مقترح لمنهج الدراسة الحوزوية» إعداد الشيخ يعقوب ماليوسف
   (الكويت، ١٤٤١هـ). استُخرجت أسماء الأساتذة والكتب آلياً من ملف PDF، فإن
   وجدت اسماً فيه خطأ فصحّحه هنا.
   ===================================================================== */

window.HAWZA = {
  levels: [
    {
      id: "muqaddimat",
      order: "المستوى الأول",
      name: "المقدمات الحوزوية",
      intro: "علوم الآلة التي يبدأ بها الطالب: النحو والصرف والمنطق والبلاغة، مع العقائد والأحكام.",
      subjects: [
        {
          name: "الفقه",
          lessons: [
            {
              title: "الرسالة العملية",
              author: "",
              links: [
                { name: "متن الكتاب", teacher: "شبكة السراج", type: "كتابة", url: "http://almaareftv.com/alseraj/archives/177" }
              ]
            },
            {
              title: "تبصرة المتعلمين في أحكام الدين",
              author: "العلامة الحلي",
              links: [
                { name: "متن الكتاب", teacher: "شبكة الفكر", type: "كتابة", url: "https://alfeker.net/library.php?id=3783" },
                { name: "غير كامل", teacher: "الشيخ معين دقيق", type: "صوتي", url: "http://shiavoice.com/cat-11170" },
                { name: "غير كامل", teacher: "الشيخ معين دقيق", type: "فيديو", url: "https://www.youtube.com/watch?v=-PMvr69yxZU&list=PLAF63581F9A1F309D" },
                { name: "يوتيوب", teacher: "الشيخ عيسى حوري", type: "فيديو", url: "https://www.youtube.com/watch?v=Z-rpK0VoC24&list=PLmSZ3cJVRFNy_dqYG7utoAEwy8Wo6QnnN" }
              ]
            },
            {
              title: "المختصر النافع في فقه الإمامية",
              author: "المحقق الحلي",
              links: [
                { name: "متن الكتاب", teacher: "مكتبة شيعة بوكس", type: "كتابة", url: "http://www.shiabooks.net/library.php?id=10178" },
                { name: "صوت الشيعة", teacher: "الشيخ أحمد حسين الشريفي", type: "صوتي", url: "https://shiavoice.com/cat-762" },
                { name: "يوتيوب", teacher: "الشيخ احمد حسين الشريف", type: "فيديو", url: "https://www.youtube.com/watch?v=o0riMOajm5Y&list=PLOgvqwiMBeHP47QQrk_DdcKmfcwqpTk8L" }
              ]
            },
            {
              title: "شرائع الإسلام في مسائل الحلال والحرام",
              author: "المحقق الحلي",
              links: [
                { name: "متن الكتاب", teacher: "شبكة السراج", type: "كتابة", url: "http://www.alseraj.net/maktaba/kotob/feqh/shareealislam1/html/ara/books/sharaea/fehrest-3.html" },
                { name: "متن الكتاب · ج2", teacher: "شبكة السراج", type: "كتابة", url: "http://www.alseraj.net/maktaba/kotob/feqh/shareealislam2/html/ara/books/sharaea/fehrest-1.html" },
                { name: "دائرة المعارف الحوزوية", teacher: "متنوع", type: "صوتي", url: "https://howza.net/index.php/archives/category/%d8%aa%d8%b5%d9%86%d9%8a%d9%81-%d8%a8%d8%ad%d8%b3%d8%a8-%d8%a7%d8%b3%d9%85%d8%a7%d8%a1-%d8%a7%d9%84%d9%83%d8%aa%d8%a8/%d8%b4%d8%b1%d8%a7%d8%a6%d8%b9-%d8%a7%d9%84%d8%a7%d8%b3%d9%84%d8%a7%d9%85-%d8%aa%d8%b5%d9%86%d9%8a%d9%81-%d8%a8%d8%ad%d8%b3%d8%a8-%d8%a7%d8%b3%d9%85%d8%a7%d8%a1-%d8%a7%d9%84%d9%83%d8%aa%d8%a8" },
                { name: "الدورة كاملة", teacher: "الشيخ علي آل محسن", type: "صوتي", url: "https://shiavoice.com/cat-4940" },
                { name: "الإرث", teacher: "الشيخ علي العبود", type: "صوتي", url: "https://shiavoice.com/cat-2353" },
                { name: "الدورة كاملة", teacher: "الشيخ محمد جعفر السعيد", type: "صوتي", url: "https://shiavoice.com/cat-5206" },
                { name: "66 درس", teacher: "الشيخ محمد الإيرواني", type: "فيديو", url: "https://www.youtube.com/watch?v=LkoufuDJd8Q&list=PLXNQQLzru0ZFci0DKtr4ubqJZX5e0O3wV" },
                { name: "الزكاة · الدرس الأول", teacher: "الشيخ أسامة آل بلال النجفي", type: "فيديو", url: "https://www.youtube.com/watch?v=gZoVFgi2yEQ" }
              ]
            }
          ]
        },
        {
          name: "الأصول",
          lessons: [
            {
              title: "مبادئ أصول الفقه",
              author: "العلامة عبدالهادي الفضلي",
              links: [
                { name: "متن الكتاب", teacher: "شبكة الفكر", type: "كتابة", url: "http://alfeker.net/library.php?id=3202" },
                { name: "صوت الشيعة", teacher: "الشيخ علي الفدائي", type: "صوتي", url: "http://shiavoice.com/cat-773" }
              ]
            },
            {
              title: "الموجز في أصول الفقه",
              author: "الشيخ جعفر السبحاني",
              links: [
                { name: "متن الكتاب", teacher: "شبكة الفكر", type: "كتابة", url: "http://alfeker.net/library.php?id=2184" },
                { name: "صوت الشيعة", teacher: "الشيخ حسين الأميري", type: "صوتي", url: "https://shiavoice.com/cat-10799" },
                { name: "صوت الشيعة", teacher: "الشيخ نجاح النويني", type: "صوتي", url: "https://shiavoice.com/cat-2932" },
                { name: "صوت الشيعة", teacher: "السيد محمد علي العلوي", type: "صوتي", url: "https://shiavoice.com/cat-11172" }
              ]
            },
            {
              title: "معالم الأصول (معالم الدين وملاذ المجتهدين)",
              author: "الشيخ حسن بن زين الدين العاملي",
              links: [
                { name: "متن الكتاب", teacher: "شبكة الفكر", type: "كتابة", url: "http://alfeker.net/library.php?id=3266" },
                { name: "متن الكتاب · ج1", teacher: "mediafire.com", type: "كتابة", url: "http://www.mediafire.com/download/1yqyv88416k2tla/%D9%85%D8%B9%D8%A7%D9%84%D9%85+%D8%A7%D9%84%D8%AF%DB%8C%D9%86+%D9%88+%D9%85%D9%84%D8%A7%D8%B0+%D8%A7%D9%84%D9%85%D8%AC%D8%AA%D9%87%D8%AF%DB%8C%D9%86+%28%D9%82%D8%B3%D9%85+%D8%A7%D9%84%D9%81%D9%82%D9%87%29+-+%D8%A7%D9%84%D8%B4%D9%8A%D8%AE+%D8%AD%D8%B3%D9%86+%D8%A8%D9%86+%D8%B2%D9%8A%D9%86+%D8%A7%D9%84%D8%AF%D9%8A%D9%86+%D8%A7%D9%84%D8%B9%D8%A7%D9%85%D9%84%D9%8A+1.pdf" },
                { name: "متن الكتاب · ج2", teacher: "mediafire.com", type: "كتابة", url: "http://www.mediafire.com/download/ln9oblm4kzbtv2m/%D9%85%D8%B9%D8%A7%D9%84%D9%85+%D8%A7%D9%84%D8%AF%DB%8C%D9%86+%D9%88+%D9%85%D9%84%D8%A7%D8%B0+%D8%A7%D9%84%D9%85%D8%AC%D8%AA%D9%87%D8%AF%DB%8C%D9%86+%28%D9%82%D8%B3%D9%85+%D8%A7%D9%84%D9%81%D9%82%D9%87%29+-+%D8%A7%D9%84%D8%B4%D9%8A%D8%AE+%D8%AD%D8%B3%D9%86+%D8%A8%D9%86+%D8%B2%D9%8A%D9%86+%D8%A7%D9%84%D8%AF%D9%8A%D9%86+%D8%A7%D9%84%D8%B9%D8%A7%D9%85%D9%84%D9%8A+2.pdf" },
                { name: "صوت الشيعة", teacher: "الشيخ محمد باقر الإيرواني", type: "صوتي", url: "https://shiavoice.com/cat-160" }
              ]
            },
            {
              title: "أصول الاستنباط",
              author: "السيد علي نقي الحيدري",
              links: [
                { name: "متن الكتاب", teacher: "شبكة الفكر", type: "كتابة", url: "http://alfeker.net/library.php?id=3809" }
              ]
            }
          ]
        },
        {
          name: "النحو",
          lessons: [
            {
              title: "متن الآجرومية",
              author: "محمد بن آجروم",
              links: [
                { name: "متن الكتاب", teacher: "أرشيف الإنترنت", type: "كتابة", url: "https://ia800202.us.archive.org/29/items/waqmamme/mamme.pdf" },
                { name: "صوت الشيعة", teacher: "الشيخ محمد جعفر آل سعيد", type: "صوتي", url: "https://shiavoice.com/cat-5260" },
                { name: "dro-s.com", teacher: "الشيخ سالم الطويل", type: "صوتي", url: "https://dro-s.com/2018/09/%D8%A7%D9%84%D8%AA%D8%B9%D9%84%D9%8A%D9%82-%D8%B9%D9%84%D9%89-%D9%83%D8%AA%D8%A7%D8%A8-%D8%A7%D9%84%D8%AA%D8%AD%D9%81%D8%A9-%D8%A7%D9%84%D8%B3%D9%86%D9%8A%D8%A9-%D8%A8%D8%B4%D8%B1%D8%AD-%D8%A7%D9%84-2/" },
                { name: "يوتيوب", teacher: "الشيخ بيت غانم", type: "فيديو", url: "https://www.youtube.com/watch?v=Y_-KVZSN31o&list=PLXNQQLzru0ZGddGChZLIvGay6LEnVe40O" },
                { name: "يوتيوب", teacher: "الشيخ محمد حسن عثمان (من العامة)", type: "فيديو", url: "https://www.youtube.com/watch?v=AqY4kx0zzEE&list=PLWm4dKqqpJBwW6NhOayPNZjJYEnOeey9o" },
                { name: "يوتيوب", teacher: "الشيخ بن عثيمين (من العامة)", type: "فيديو", url: "https://www.youtube.com/watch?v=oG6RNsy8x6I&list=PLastiFN-1Q4cUMQecn50Ihp_mLP0RXWoT" },
                { name: "يوتيوب", teacher: "الشيخ سالم الطويل (من العامة)", type: "فيديو", url: "https://www.youtube.com/watch?v=cnPuTB0Ounw&list=PLV7gXkcc0tfM0uK6K1jEfh4r8ssGDzNhB" }
              ]
            },
            {
              title: "قطر الندى وبل الصدى",
              author: "ابن هشام الأنصاري",
              links: [
                { name: "متن الكتاب", teacher: "أرشيف الإنترنت", type: "كتابة", url: "https://archive.org/download/WAQ40733/40733.pdf" },
                { name: "دائرة المعارف الحوزوية", teacher: "متنوع", type: "صوتي", url: "https://howza.net/archives/category/%d8%aa%d8%b5%d9%86%d9%8a%d9%81-%d8%ad%d8%b3%d8%a8-%d8%a7%d9%84%d9%85%d8%b1%d8%a7%d8%ad%d9%84-%d8%a7%d9%84%d8%af%d8%b1%d8%a7%d8%b3%d9%8a%d8%a9/moqademat/%d8%a7%d9%84%d9%86%d8%ad%d9%88/%d9%82%d8%b7%d8%b1-%d8%a7%d9%84%d9%86%d8%af%d9%89" },
                { name: "صوت الشيعة", teacher: "الشيخ علي آل محسن", type: "صوتي", url: "https://shiavoice.com/cat-5038" },
                { name: "صوت الشيعة", teacher: "الشيخ محمد حسين بيت غانم", type: "صوتي", url: "http://shiavoice.com/cat-11098" },
                { name: "صوت الشيعة", teacher: "الشيخ حسين السندي", type: "صوتي", url: "http://shiavoice.com/cat-156" },
                { name: "صوت الشيعة", teacher: "الشيخ حسين الأميري", type: "صوتي", url: "http://shiavoice.com/cat-11179" },
                { name: "صوت الشيعة", teacher: "الشيخ عبدالرضا البهادلي", type: "صوتي", url: "http://shiavoice.com/cat-6198" },
                { name: "يوتيوب", teacher: "متنوع", type: "فيديو", url: "https://www.youtube.com/results?search_query=%D8%B4%D8%B1%D8%AD+%D9%82%D8%B7%D8%B1+%D8%A7%D9%84%D9%86%D8%AF%D9%89&sp=EgIQAw%253D%253D" }
              ]
            },
            {
              title: "ألفية ابن مالك",
              author: "محمد بن عبد الله بن مالك الأندلسي",
              links: [
                { name: "متن الكتاب", teacher: "أرشيف الإنترنت", type: "كتابة", url: "http://www.archive.org/download/waq37284/37284.pdf" },
                { name: "صوت الشيعة", teacher: "الشيخ علي آل محسن", type: "صوتي", url: "https://shiavoice.com/cat-4867" },
                { name: "صوت الشيعة", teacher: "الشيخ حسين الأميري", type: "صوتي", url: "http://shiavoice.com/cat-10701" },
                { name: "صوت الشيعة", teacher: "الشيخ علي محسن العاملي", type: "صوتي", url: "https://shiavoice.com/cat-3124" },
                { name: "يوتيوب", teacher: "الشيخ محمد حسن عثمان (من العامة)", type: "فيديو", url: "https://www.youtube.com/watch?v=vLp5Zo45eDA&list=PLWm4dKqqpJBzXaJ2P0qYdJM5BD8I9ODUm" },
                { name: "يوتيوب", teacher: "الشيخ احمد بن عمر الحازمي(من العامة)", type: "فيديو", url: "https://www.youtube.com/watch?v=t59gNHkPh8w&list=PLS4Urq5_pzn27SOP0AUy7RYkwFA2GEUDb" },
                { name: "يوتيوب", teacher: "الشيخ ابن عثيمين (من العامة)", type: "فيديو", url: "https://www.youtube.com/watch?v=pKkdDR4MDuQ&list=PLiTKQO5a7ZXktA5IX84ZnKjnh25aU1xfS" }
              ]
            },
            {
              title: "مغني اللبيب عن كتب الأعاريب",
              author: "ابن هشام الأنصاري",
              links: [
                { name: "متن الكتاب", teacher: "أرشيف الإنترنت", type: "كتابة", url: "https://archive.org/download/FP129509/129509.pdf" },
                { name: "صوت الشيعة", teacher: "متنوع", type: "صوتي", url: "http://shiavoice.com/cat-298" },
                { name: "دائرة المعارف الحوزوية", teacher: "متنوع", type: "صوتي", url: "https://howza.net/archives/category/%d8%aa%d8%b5%d9%86%d9%8a%d9%81-%d8%ad%d8%b3%d8%a8-%d8%a7%d9%84%d9%85%d8%b1%d8%a7%d8%ad%d9%84-%d8%a7%d9%84%d8%af%d8%b1%d8%a7%d8%b3%d9%8a%d8%a9/moqademat/%d8%a7%d9%84%d9%86%d8%ad%d9%88/%d9%85%d8%ba%d9%86%d9%8a-%d8%a7%d9%84%d9%84%d8%a8%d9%8a%d8%a8" },
                { name: "باب4", teacher: "الشيخ محمد حسين بيت غانم", type: "صوتي", url: "http://shiavoice.com/cat-2040" },
                { name: "صوت الشيعة", teacher: "الشيخ علي آل محسن", type: "صوتي", url: "https://shiavoice.com/cat-6707" },
                { name: "الباب 4", teacher: "الشيخ حسين السندي", type: "فيديو", url: "https://www.youtube.com/watch?v=LXcuDBnuO1A&list=PLeRn5qa2myu0s1qq9qm1xm4AfIgOGRH2s" }
              ]
            }
          ]
        },
        {
          name: "الصرف",
          lessons: [
            {
              title: "علم التصريف",
              author: "عبد الوهاب الزنجاني",
              links: [
                { name: "متن الكتاب", teacher: "أرشيف الإنترنت", type: "كتابة", url: "https://archive.org/download/20191020_20191020_1305/%D8%B9%D9%84%D9%85%20%D8%A7%D9%84%D8%AA%D8%B5%D8%B1%D9%8A%D9%81%20%D8%A7%D9%84%D9%85%D8%AC%D9%85%D8%B9%20%D8%A7%D9%84%D8%B9%D9%84%D9%85%D9%8A.pdf" },
                { name: "صوت الشيعة", teacher: "الشيخ عبد الكريم الحائري", type: "صوتي", url: "http://shiavoice.com/cat-154" },
                { name: "صوت الشيعة", teacher: "الشيخ ميثم البحراني", type: "صوتي", url: "http://shiavoice.com/cat-265" }
              ]
            },
            {
              title: "شذا العرف في فن الصرف",
              author: "أحمد بن محمد الحملاوي",
              links: [
                { name: "متن الكتاب", teacher: "أرشيف الإنترنت", type: "كتابة", url: "http://www.archive.org/download/waq0161/0161.pdf" },
                { name: "صوت الشيعة", teacher: "الشيخ علي الحسن", type: "صوتي", url: "http://shiavoice.com/cat-10652" },
                { name: "صوت الشيعة", teacher: "الشيخ أحمد سلمان", type: "صوتي", url: "http://shiavoice.com/cat-9485" },
                { name: "dro-s.com", teacher: "الشيخ عبد الغني عبد الجليل", type: "صوتي", url: "https://dro-s.com/2011/05/%d8%b4%d8%b1%d8%ad-%d8%b4%d8%b0%d8%a7-%d8%a7%d9%84%d8%b9%d8%b1%d9%81-%d9%81%d9%8a-%d9%81%d9%86-%d8%a7%d9%84%d8%b5%d8%b1%d9%81-%d8%b4%d8%b1%d8%ad-%d8%a7%d9%84%d8%b4%d9%8a%d8%ae-%d8%b9%d8%a8%d8%af/" },
                { name: "يوتيوب", teacher: "الشيخ علي الحسن", type: "فيديو", url: "https://www.youtube.com/watch?v=XPgKISRdK_c&list=PLXNQQLzru0ZEtZLIT6R7s2yUw2Z1su_re" },
                { name: "يوتيوب", teacher: "الشيخ محمد حسن عثمان (من العامة)", type: "فيديو", url: "https://www.youtube.com/watch?v=KkqnYcYb6WQ&list=PLs7fjUsRonbMUw8t_26_IiSdhgTcz5hhu" }
              ]
            }
          ]
        },
        {
          name: "البلاغة",
          lessons: [
            {
              title: "جواهر البلاغة",
              author: "أحمد الهاشمي",
              links: [
                { name: "متن الكتاب", teacher: "شبكة الفكر", type: "كتابة", url: "https://alfeker.net/library.php?id=4150" },
                { name: "صوت الشيعة", teacher: "الشيخ عبدالله الدقاق", type: "صوتي", url: "https://shiavoice.com/cat-3954" },
                { name: "صوت الشيعة", teacher: "الشيخ حسين السندي", type: "صوتي", url: "https://shiavoice.com/cat-206" },
                { name: "صوت الشيعة", teacher: "الشيخ محمد جعفر آل سعيد", type: "صوتي", url: "https://shiavoice.com/cat-5329" },
                { name: "dro-s.com", teacher: "الشيخ عبد الله بن بريك (من العامة)", type: "صوتي", url: "https://dro-s.com/2011/02/%d8%ac%d9%88%d8%a7%d9%87%d8%b1-%d8%a7%d9%84%d8%a8%d9%84%d8%a7%d8%ba%d8%a9-%d9%81%d9%8a-%d8%a7%d9%84%d9%85%d8%b9%d8%a7%d9%86%d9%8a-%d9%88%d8%a7%d9%84%d8%a8%d9%8a%d8%a7%d9%86-%d9%88%d8%a7%d9%84%d8%a8/" },
                { name: "يوتيوب", teacher: "الشيخ علي عيديبي", type: "فيديو", url: "https://www.youtube.com/watch?v=oJ5fUYiKpTU&list=PLyRnLkQ1p8FOOM_hYI-mEmft4MDhpeFrZ" },
                { name: "يوتيوب", teacher: "الشيخ سعد القاسمي", type: "فيديو", url: "https://www.youtube.com/watch?v=HU9wXGiRH8k&list=PLTQDF5DuIa-N0_ToNjgJNBl-mET9Fw7O6" },
                { name: "يوتيوب", teacher: "الشيخ عبدالله بن مرعي العدني (من العامة)", type: "فيديو", url: "https://www.youtube.com/watch?v=S6XREt9mxYg&list=PLWXMkOq-EqURR4ubnkQnPpNhb5EDi5Xh1" }
              ]
            },
            {
              title: "البلاغة الواضحة ودليلها",
              author: "علي الجارم ومصطفى أمين",
              links: [
                { name: "متن الكتاب", teacher: "أرشيف الإنترنت", type: "كتابة", url: "https://archive.org/download/WAQblwa/blwa.pdf" },
                { name: "متن الكتاب · نسخة ٢", teacher: "أرشيف الإنترنت", type: "كتابة", url: "https://archive.org/download/WAQblwa/dablwa.pdf" },
                { name: "يوتيوب", teacher: "علي هاني العقرباوي (من العامة)", type: "فيديو", url: "https://www.youtube.com/watch?v=3R7sb6J57PQ&list=PLED4Dj-T43rMaGE9BEXqxiiCdlSArWnRh" },
                { name: "يوتيوب", teacher: "الشيخ محمد سعيد رسلان (من العامة)", type: "فيديو", url: "https://www.youtube.com/watch?v=WJQ4Z5bbfzQ&list=PLZxLjMxnMpsojVQpjlSimTvbwpRgrtcKl" }
              ]
            }
          ]
        },
        {
          name: "المنطق",
          lessons: [
            {
              title: "خلاصة المنطق",
              author: "العلامة عبدالهادي الفضلي",
              links: [
                { name: "متن الكتاب", teacher: "شبكة الفكر", type: "كتابة", url: "http://alfeker.net/library.php?id=3243" },
                { name: "صوت الشيعة", teacher: "الشيخ علي العبود", type: "صوتي", url: "https://shiavoice.com/cat-3874" },
                { name: "صوت الشيعة", teacher: "الشيخ محسن المحمدي", type: "صوتي", url: "https://shiavoice.com/cat-767" },
                { name: "صوت الشيعة", teacher: "السيد محمد علي العلوي", type: "صوتي", url: "https://shiavoice.com/cat-8951" },
                { name: "صوت الشيعة", teacher: "الشيخ جابر جوير", type: "صوتي", url: "http://shiavoice.com/cat-6400" },
                { name: "يوتيوب", teacher: "عبدالهادي الفضلي", type: "فيديو", url: "https://www.youtube.com/watch?v=zLeHS6ZS0tY&list=PLXNQQLzru0ZFgFj7zZGeteQgBB9-XA9qR" },
                { name: "يوتيوب", teacher: "الشيخ علي العبود", type: "فيديو", url: "https://www.youtube.com/watch?v=ZlJQaKRrXoQ&list=PLCAD4C89C32F0DEAD" },
                { name: "يوتيوب", teacher: "الشيخ علي عيديبي", type: "فيديو", url: "https://www.youtube.com/watch?v=HheBeYIMJ3c&list=PLyRnLkQ1p8FPVYkzyj_Ai6BuZHor9bXli" },
                { name: "يوتيوب", teacher: "معهد تراث الأنبياء", type: "فيديو", url: "https://www.youtube.com/watch?v=REW_P6TUoRg&list=PLKxikzZNxA6Gl249RCpLDiO4QLvtmRJ90" }
              ]
            },
            {
              title: "المنطق",
              author: "الشيخ محمد رضا المظفر",
              links: [
                { name: "متن الكتاب", teacher: "شبكة الفكر", type: "كتابة", url: "http://alfeker.net/library.php?id=1501" },
                { name: "دائرة المعارف الحوزوية", teacher: "متنوع", type: "صوتي", url: "https://howza.net/archives/category/%d8%aa%d8%b5%d9%86%d9%8a%d9%81-%d8%ad%d8%b3%d8%a8-%d8%a7%d9%84%d9%85%d8%b1%d8%a7%d8%ad%d9%84-%d8%a7%d9%84%d8%af%d8%b1%d8%a7%d8%b3%d9%8a%d8%a9/moqademat/%d8%a7%d9%84%d9%85%d9%86%d8%b7%d9%82/%d9%85%d9%86%d8%b7%d9%82-%d8%a7%d9%84%d9%85%d8%b8%d9%81%d8%b1" },
                { name: "صوت الشيعة", teacher: "السيد كمال الحيدري", type: "صوتي", url: "https://shiavoice.com/cat-174" },
                { name: "صوت الشيعة", teacher: "الشيخ علي آل محسن", type: "صوتي", url: "https://shiavoice.com/cat-6768" },
                { name: "صوت الشيعة", teacher: "الشيخ شاكر الفردان البحريني", type: "صوتي", url: "https://shiavoice.com/cat-159" },
                { name: "صوت الشيعة", teacher: "الشيخ علي العبود", type: "صوتي", url: "https://shiavoice.com/cat-2263" },
                { name: "يوتيوب", teacher: "الشيخ علي العبود", type: "فيديو", url: "https://www.youtube.com/watch?v=9oCwQAe7psw&list=PLiIrs7HpUzDtzfTvfwHyCwDjecvk41SdQ" },
                { name: "الجزء 1", teacher: "الشيخ فارس شريف الجبوري", type: "فيديو", url: "https://www.youtube.com/watch?v=-pT44lubwgs&list=PLmLr5xnc3E1mgdv7FHl6H5K4Cdfd4K3tw" },
                { name: "الجزء 2", teacher: "الشيخ فارس شريف الجبوري", type: "فيديو", url: "https://www.youtube.com/watch?v=Dyfkve7NZV4&list=PLmLr5xnc3E1njWhQsZvrm69oss9LcoFL_" }
              ]
            },
            {
              title: "حاشية ملا عبد الله على التهذيب",
              author: "ملا عبد الله اليزدي",
              links: [
                { name: "متن الكتاب", teacher: "مكتبة شيعة بوكس", type: "كتابة", url: "http://shiabooks.net/library.php?id=10396" },
                { name: "يوتيوب", teacher: "الشيخ محمد المرهون الأحسائي", type: "فيديو", url: "https://www.youtube.com/watch?v=zRdgp05aZEQ&list=PLVC2GYrMkVFidyv1PkKlx0re252QcbDSt" },
                { name: "يوتيوب", teacher: "الشيخ فارس شريف الجبوري", type: "فيديو", url: "https://www.youtube.com/watch?v=ZqGkb_C2xs4&list=PLmLr5xnc3E1ltm_E6Rb6H8U_Wno7ksPeD" }
              ]
            }
          ]
        },
        {
          name: "الأخلاق",
          lessons: [
            {
              title: "آداب المتعلمين",
              author: "الخواجة نصير الدين الطوسي",
              links: [
                { name: "متن الكتاب", teacher: "مدرسة الفقاهة", type: "كتابة", url: "http://ar.lib.eshia.ir/15001/1/62" },
                { name: "صوت الشيعة", teacher: "الشيخ حسين الأميري", type: "صوتي", url: "http://www.shiavoice.com/cat-10797" },
                { name: "يوتيوب", teacher: "معهد تراث الأنبياء", type: "فيديو", url: "https://www.youtube.com/watch?v=EA081Odw3qA&list=PLKxikzZNxA6EvvpU8PXAjVfPWjZF7D-lZ" }
              ]
            },
            {
              title: "منية المريد في أدب المفيد والمستفيد",
              author: "الشهيد الثاني",
              links: [
                { name: "متن الكتاب", teacher: "شبكة الفكر", type: "كتابة", url: "http://alfeker.net/library.php?id=2124" },
                { name: "صوت الشيعة", teacher: "الشيخ حسين الأميري", type: "صوتي", url: "https://www.shiavoice.com/cat-10798" },
                { name: "صوت الشيعة", teacher: "السيد سامي خضرة", type: "صوتي", url: "https://shiavoice.com/cat-6093" }
              ]
            },
            {
              title: "جامع السعادات",
              author: "المولى محمد مهدي النراقي",
              links: [
                { name: "متن الكتاب", teacher: "شبكة الفكر", type: "كتابة", url: "http://alfeker.net/library.php?id=1329" },
                { name: "دائرة المعارف الحوزوية", teacher: "السيد علي الصافي", type: "صوتي", url: "https://howza.net/%d8%ac%d8%a7%d9%85%d8%b9-%d8%a7%d9%84%d8%b3%d8%b9%d8%a7%d8%af%d8%a7%d8%aa-%d8%a7%d9%84%d8%b3%d9%8a%d8%af-%d8%b9%d9%84%d9%8a-%d8%a7%d9%84%d8%b5%d8%a7%d9%81%d9%8a/" },
                { name: "يوتيوب", teacher: "الشيخ أحمد الصافي", type: "فيديو", url: "https://www.youtube.com/watch?v=o1g4YGyHxxM&list=PLy8LBVgSc6KV0tFSTPJpUElYmeScfPf60" },
                { name: "يوتيوب", teacher: "الشيخ عبدالله الدقاق", type: "فيديو", url: "https://www.youtube.com/watch?v=7fjch60vi6o&list=PLobv2fKAk3r29VaFeEIbuKtDJVmMeJ4Tj" }
              ]
            }
          ]
        },
        {
          name: "العقائد والكلام",
          lessons: [
            {
              title: "عقائد الإمامية",
              author: "الشيخ محمد رضا المظفر",
              links: [
                { name: "متن الكتاب", teacher: "شبكة الفكر", type: "كتابة", url: "http://alfeker.net/library.php?id=1041" },
                { name: "يوتيوب", teacher: "الشيخ علي المظفر", type: "فيديو", url: "https://www.youtube.com/watch?v=xFtRW8WvLQs&list=PL9Ax12r50OLHEMOSRfW7S29hWadXM3-Te" },
                { name: "يوتيوب", teacher: "الشيخ محمد الأسدي", type: "فيديو", url: "https://www.youtube.com/watch?v=FpTRcJMyGC0&list=PLbVBjQP1gRMUn7lCH5Yrj6Jxy70kA6dk3" },
                { name: "يوتيوب", teacher: "معهد تراث الأنبياء", type: "فيديو", url: "https://www.youtube.com/watch?v=BQrmgO2qFCk&list=PLKxikzZNxA6ES8BYmQ1usMlJs4V52BYAe" }
              ]
            },
            {
              title: "بداية المعرفة",
              author: "الشيخ حسن مكي العاملي",
              links: [
                { name: "متن الكتاب", teacher: "شبكة الفكر", type: "كتابة", url: "http://alfeker.net/library.php?id=3903" },
                { name: "صوت الشيعة", teacher: "الشيخ علي العبود", type: "صوتي", url: "http://shiavoice.com/cat-2287" },
                { name: "صوت الشيعة", teacher: "السيد حسن النمر", type: "صوتي", url: "https://shiavoice.com/cat-8339" },
                { name: "دائرة المعارف الحوزوية", teacher: "الشيخ عبدالعزيز الثويني", type: "صوتي", url: "https://howza.net/%d8%a8%d8%af%d8%a7%d9%8a%d8%a9-%d8%a7%d9%84%d9%85%d8%b9%d8%b1%d9%81%d8%a9-%d8%a7%d9%84%d8%b4%d9%8a%d8%ae-%d8%b9%d8%a8%d8%af-%d8%a7%d9%84%d8%b9%d8%b2%d9%8a%d8%b2-%d8%a7%d9%84%d8%ab%d9%88%d9%8a%d9%86/" },
                { name: "يوتيوب", teacher: "الشيخ علي عيديبي", type: "فيديو", url: "https://www.youtube.com/watch?v=OjX9n6cTEJA&list=PLyRnLkQ1p8FOyQ382V1DMXNQ7_s_8oWxw" },
                { name: "يوتيوب", teacher: "الشيخ علي المظفر", type: "فيديو", url: "https://www.youtube.com/watch?v=-l6esRRBYoc&list=PLdjrPKXqLQ9kZFG1RPX5P7ou6PwSb2GbO" },
                { name: "يوتيوب", teacher: "السيد أحمد الغالبي", type: "فيديو", url: "https://www.youtube.com/watch?v=NAZ3MVcfOTg&list=PLy8LBVgSc6KUlIeQRXk_SNCFUyCQFySYW" }
              ]
            },
            {
              title: "تلخيص محاضرات في الإلهيات",
              author: "الشيخ جعفر السبحاني",
              links: [
                { name: "متن الكتاب", teacher: "شبكة الفكر", type: "كتابة", url: "http://alfeker.net/library.php?id=3156" },
                { name: "صوت الشيعة", teacher: "الشيخ جميل مانع البزوني", type: "صوتي", url: "https://shiavoice.com/cat-8989" }
              ]
            },
            {
              title: "الباب الحادي عشر",
              author: "العلامة الحلي",
              links: [
                { name: "متن الكتاب", teacher: "شبكة الفكر", type: "كتابة", url: "http://alfeker.net/library.php?id=1725" },
                { name: "دائرة المعارف الحوزوية", teacher: "متنوع", type: "صوتي", url: "https://howza.net/category/%d8%aa%d8%b5%d9%86%d9%8a%d9%81-%d8%a8%d8%ad%d8%b3%d8%a8-%d8%a7%d8%b3%d9%85%d8%a7%d8%a1-%d8%a7%d9%84%d9%83%d8%aa%d8%a8/%d8%a7%d9%84%d8%a8%d8%a7%d8%a8-%d8%a7%d9%84%d8%ad%d8%a7%d8%af%d9%8a-%d8%b9%d8%b4%d8%b1/" },
                { name: "صوت الشيعة", teacher: "السيد كمال الحيدري", type: "صوتي", url: "http://shiavoice.com/cat-170" },
                { name: "صوت الشيعة", teacher: "الشيخ كاظم الخاقاني", type: "صوتي", url: "http://shiavoice.com/cat-766" },
                { name: "صوت الشيعة", teacher: "الشيخ نجاح النويني", type: "صوتي", url: "http://shiavoice.com/cat-2941" },
                { name: "صوت الشيعة", teacher: "الشيخ جابر جوير", type: "صوتي", url: "https://shiavoice.com/cat-5425" },
                { name: "صوت الشيعة", teacher: "الشيخ محمد العبيدان", type: "صوتي", url: "https://shiavoice.com/cat-10991" },
                { name: "صوت الشيعة", teacher: "الشيخ محمد جعفر آل سعيد", type: "صوتي", url: "https://shiavoice.com/cat-5358" },
                { name: "يوتيوب", teacher: "الشيخ علي عيديبي", type: "فيديو", url: "https://www.youtube.com/watch?v=CGEVOVxX1WA&list=PLyRnLkQ1p8FO1usJyEStFLdwfMO8T0DLy" },
                { name: "يوتيوب", teacher: "معهد تراث الأنبياء", type: "فيديو", url: "https://www.youtube.com/watch?v=WAbjOLYxa4U&list=PLKxikzZNxA6FSThHW8azml00bQ7KVWbxW" },
                { name: "يوتيوب", teacher: "الشيخ محمد كاظم الخاقاني", type: "فيديو", url: "https://www.youtube.com/watch?v=SSpF_qWxfJA&list=PLlSNfN-CQJY5StK4Dpbq2ut4YheVEogCL" },
                { name: "يوتيوب", teacher: "الشيخ أسامة آل بلال", type: "فيديو", url: "https://www.youtube.com/watch?v=f_xFS0HEoGI&list=PLKyv80g-gWXp4OPU5oAfRjODqqSR8JfNd" }
              ]
            }
          ]
        },
        {
          name: "الحديث والدراية",
          lessons: [
            {
              title: "البداية في علم الدراية",
              author: "الشهيد الثاني",
              links: [
                { name: "متن الكتاب", teacher: "مكتبة شيعة بوكس", type: "كتابة", url: "http://www.shiabooks.net/library.php?id=10219" },
                { name: "درس من كتب", teacher: "الشيخ أحمد سلمان", type: "صوتي", url: "https://shiavoice.com/cat-9468" }
              ]
            },
            {
              title: "أصول الحديث",
              author: "العلامة عبدالهادي الفضلي",
              links: [
                { name: "متن الكتاب", teacher: "شبكة الفكر", type: "كتابة", url: "http://alfeker.net/library.php?id=3216" }
              ]
            },
            {
              title: "أصول الحديث وأحكامه في علم الدراية",
              author: "الشيخ جعفر السبحاني",
              links: [
                { name: "متن الكتاب", teacher: "شبكة الفكر", type: "كتابة", url: "http://alfeker.net/library.php?id=1672" },
                { name: "صوت الشيعة", teacher: "الشيخ عبدالله الدقاق", type: "صوتي", url: "https://shiavoice.com/cat-3956" }
              ]
            }
          ]
        },
        {
          name: "الرجال",
          lessons: [
            {
              title: "دروس موجزة في علمي الرجال والدراية",
              author: "الشيخ جعفر السبحاني",
              links: [
                { name: "متن الكتاب", teacher: "مدرسة الفقاهة", type: "كتابة", url: "http://lib.eshia.ir/27179/1/1" },
                { name: "يوتيوب", teacher: "الشيخ علي آل محسن", type: "فيديو", url: "https://www.youtube.com/watch?v=xaF_3jlkGAs&list=PLHNhFObzjUqW6b7WDfWua8LJgnnbr9icb" }
              ]
            },
            {
              title: "دروس تمهيدية في القواعد الرجالية",
              author: "الشيخ محمد باقر الإيرواني",
              links: [
                { name: "متن الكتاب", teacher: "شبكة الفكر", type: "كتابة", url: "http://alfeker.net/library.php?id=1899" },
                { name: "صوت الشيعة", teacher: "الشيخ عبدالله الدقاق", type: "صوتي", url: "https://shiavoice.com/cat-2244" },
                { name: "دائرة المعارف الحوزوية", teacher: "الشيخ حيدر البلداوي", type: "صوتي", url: "https://howza.net/index.php/%d8%af%d8%b1%d9%88%d8%b3-%d8%aa%d9%85%d9%87%d9%8a%d8%af%d9%8a%d8%a9-%d9%81%d9%8a-%d8%a7%d9%84%d9%82%d9%88%d8%a7%d8%b9%d8%af-%d8%a7%d9%84%d8%b1%d8%ac%d8%a7%d9%84%d9%8a%d8%a9-%d8%a7%d9%84%d8%b4%d9%8a-2/" },
                { name: "يوتيوب", teacher: "السيد ابو عبد الله الجابري", type: "صوتي", url: "https://www.youtube.com/watch?v=711orfbsxh0&list=PLuoTIrEo8dSAn2xL4tSoZg1vCS7PqvDSi" }
              ]
            },
            {
              title: "كليات في علم الرجال",
              author: "الشيخ جعفر السبحاني",
              links: [
                { name: "متن الكتاب", teacher: "شبكة الفكر", type: "كتابة", url: "http://alfeker.net/library.php?id=2044" },
                { name: "صوت الشيعة", teacher: "الشيخ عبدالله الدقاق", type: "صوتي", url: "https://shiavoice.com/cat-2255" }
              ]
            }
          ]
        },
        {
          name: "الفلسفة",
          lessons: [
            {
              title: "أصول الفلسفة والمنهج الواقعي",
              author: "السيد محمد حسين الطباطبائي",
              links: [
                { name: "متن الكتاب", teacher: "شبكة الفكر", type: "كتابة", url: "http://alfeker.net/library.php?id=2570" }
              ]
            },
            {
              title: "المنهج الجديد في تعليم الفلسفة",
              author: "الشيخ محمد تقي مصباح اليزدي",
              links: [
                { name: "متن الكتاب", teacher: "شبكة الفكر", type: "كتابة", url: "http://alfeker.net/library.php?id=2633" },
                { name: "صوت الشيعة", teacher: "السيد كمال الحيدري", type: "صوتي", url: "https://shiavoice.com/cat-9346" }
              ]
            }
          ]
        }
      ]
    },
    {
      id: "sutuh",
      order: "المستوى الثاني",
      name: "السطوح الوسطى",
      intro: "قراءة الكتب الدراسية في الفقه والأصول والنحو والمنطق والكلام والفلسفة قراءةً معمّقة.",
      subjects: [
        {
          name: "الفقه",
          lessons: [
            {
              title: "دروس تمهيدية في الفقه الاستدلالي",
              author: "الشيخ محمد باقر الإيرواني",
              links: [
                { name: "متن الكتاب", teacher: "شبكة الفكر", type: "كتابة", url: "http://alfeker.net/library.php?id=2824" },
                { name: "صوت الشيعة", teacher: "الشيخ حسن عطوان", type: "صوتي", url: "https://shiavoice.com/cat-7978" },
                { name: "صوت الشيعة", teacher: "الشيخ علي الإيرواني", type: "صوتي", url: "https://shiavoice.com/cat-8418" },
                { name: "دائرة المعارف الحوزوية", teacher: "متنوع", type: "صوتي", url: "https://howza.net/archives/category/%d8%aa%d8%b5%d9%86%d9%8a%d9%81-%d8%ad%d8%b3%d8%a8-%d8%a7%d9%84%d9%85%d8%b1%d8%a7%d8%ad%d9%84-%d8%a7%d9%84%d8%af%d8%b1%d8%a7%d8%b3%d9%8a%d8%a9/sotoh/%d8%a7%d9%84%d9%81%d9%82%d9%87-sotoh/%d8%af%d8%b1%d9%88%d8%b3-%d8%aa%d9%85%d9%87%d9%8a%d8%af%d9%8a%d8%a9-%d9%81%d9%8a-%d8%a7%d9%84%d9%81%d9%82%d9%87-%d8%a7%d9%84%d8%a7%d8%b3%d8%aa%d8%af%d9%84%d8%a7%d9%84%d9%8a" },
                { name: "يوتيوب", teacher: "متنوع", type: "فيديو", url: "https://www.youtube.com/results?search_query=%D8%AF%D8%B1%D9%88%D8%B3+%D8%AA%D9%85%D9%87%D9%8A%D8%AF%D9%8A%D8%A9+%D9%81%D9%8A+%D8%A7%D9%84%D9%81%D9%82%D9%87+%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D8%AF%D9%84%D8%A7%D9%84%D9%8A&sp=EgIQAw%253D%253D" },
                { name: "الجزء 1", teacher: "السيد حسين القزويني", type: "فيديو", url: "https://www.youtube.com/watch?v=DHtlfsAsdfw&list=PLN2QEZj6NfbjR30vzSKsW_hHsMUOxzs1E" },
                { name: "الجزء 2", teacher: "السيد حسين القزويني", type: "فيديو", url: "https://www.youtube.com/watch?v=6hyb8LdCB7o&list=PLN2QEZj6NfbjbXUrIoUzOfdv4jfbEnkAR&index=27" }
              ]
            },
            {
              title: "اللمعة الدمشقية وشرحها الروضة البهية",
              author: "الشهيد الأول، والشهيد الثاني",
              links: [
                { name: "متن الكتاب", teacher: "شبكة الفكر", type: "كتابة", url: "https://alfeker.net/library.php?id=4422" },
                { name: "صوت الشيعة", teacher: "متنوع", type: "صوتي", url: "http://shiavoice.com/cat-2775" },
                { name: "دائرة المعارف الحوزوية", teacher: "متنوع", type: "صوتي", url: "https://howza.net/index.php/archives/category/%d8%aa%d8%b5%d9%86%d9%8a%d9%81-%d8%a8%d8%ad%d8%b3%d8%a8-%d8%a7%d8%b3%d9%85%d8%a7%d8%a1-%d8%a7%d9%84%d9%83%d8%aa%d8%a8/%d8%a7%d9%84%d9%84%d9%85%d8%b9%d8%a9-%d8%a7%d9%84%d8%af%d9%85%d8%b4%d9%82%d9%8a%d9%80%d8%a9" }
              ]
            }
          ]
        },
        {
          name: "الأصول",
          lessons: [
            {
              title: "أصول الفقه",
              author: "الشيخ محمد رضا المظفر",
              links: [
                { name: "متن الكتاب", teacher: "شبكة الفكر", type: "كتابة", url: "http://alfeker.net/library.php?id=1641" },
                { name: "متن الكتاب · نسخة مؤسسة النشر الإسلامي", teacher: "شبكة الفكر", type: "كتابة", url: "http://alfeker.net/library.php?id=3194" },
                { name: "دائرة المعارف الحوزوية", teacher: "متنوع", type: "صوتي", url: "https://howza.net/index.php/archives/category/%d8%aa%d8%b5%d9%86%d9%8a%d9%81-%d8%a8%d8%ad%d8%b3%d8%a8-%d8%a7%d8%b3%d9%85%d8%a7%d8%a1-%d8%a7%d9%84%d9%83%d8%aa%d8%a8/%d8%a7%d8%b5%d9%88%d9%84-%d8%a7%d9%84%d9%85%d8%b8%d9%81%d8%b1-%d8%aa%d8%b5%d9%86%d9%8a%d9%81-%d8%a8%d8%ad%d8%b3%d8%a8-%d8%a7%d8%b3%d9%85%d8%a7%d8%a1-%d8%a7%d9%84%d9%83%d8%aa%d8%a8" },
                { name: "صوت الشيعة", teacher: "متنوع", type: "صوتي", url: "https://shiavoice.com/cat-2776" },
                { name: "صوت الشيعة", teacher: "السيد الترحيني العاملي", type: "صوتي", url: "http://shiavoice.com/cat-1957" },
                { name: "صوت الشيعة", teacher: "الشيخ علي الفدائي", type: "صوتي", url: "https://shiavoice.com/cat-11181" },
                { name: "صوت الشيعة", teacher: "الشيخ عمار الخزعلي", type: "صوتي", url: "https://shiavoice.com/cat-7896" },
                { name: "صوت الشيعة", teacher: "الشيخ إبراهيم بدوي", type: "صوتي", url: "https://shiavoice.com/cat-11391" },
                { name: "يوتيوب", teacher: "الشيخ علي الفدائي", type: "فيديو", url: "https://www.youtube.com/watch?v=_vibVAjUlXA&list=PLOgvqwiMBeHOPuDMDQWryNxvxWzuulo6e" },
                { name: "يوتيوب", teacher: "الشيخ حسين البهادلي", type: "فيديو", url: "https://www.youtube.com/watch?v=hU7UU-kn0Bg&list=PLOgvqwiMBeHMCB0dSE0lo3scL1PnekaoN" },
                { name: "يوتيوب", teacher: "الشيخ علي الغراوي", type: "فيديو", url: "https://www.youtube.com/watch?v=SE2OY7IHM_c&list=PLMCjehJvL5iC3MrjhPwERA1qBGtW8RcRL" },
                { name: "يوتيوب", teacher: "الشيخ عماد المشهدي", type: "فيديو", url: "https://www.youtube.com/watch?v=3rrMjn6X3M4&list=PLGmRlC2NSJwAiwB6Hxdp61bMK-83biA3L" }
              ]
            },
            {
              title: "دروس في علم الأصول (الحلقات الثلاث)",
              author: "السيد الشهيد محمد باقر الصدر",
              stage: "مقدمات وسطوح",
              links: [
                { name: "متن الكتاب", teacher: "شبكة الفكر", type: "كتابة", url: "http://alfeker.net/library.php?id=4806" },
                { name: "الحلقة 1", teacher: "السيد كمال الحيدري", type: "صوتي", url: "https://shiavoice.com/cat-171" },
                { name: "الحلقة 2", teacher: "السيد كمال الحيدري", type: "صوتي", url: "https://shiavoice.com/cat-172" },
                { name: "الحلقة 3", teacher: "السيد كمال الحيدري", type: "صوتي", url: "https://shiavoice.com/cat-201" },
                { name: "الحلقة 2", teacher: "الشيخ عبدالرضا الرويمي", type: "صوتي", url: "https://shiavoice.com/cat-8128" },
                { name: "صوت الشيعة", teacher: "الشيخ عبدالرضا الرويمي", type: "صوتي", url: "https://shiavoice.com/cat-8149" },
                { name: "صوت الشيعة", teacher: "الشيخ عبدالرضا الرويمي", type: "صوتي", url: "https://shiavoice.com/cat-8167" },
                { name: "الحلقة 1", teacher: "الشيخ محمد أشكناني", type: "فيديو", url: "https://www.youtube.com/watch?v=_jtGQNFKG34&list=PLWJ0XjdVWQj6QApQ-01FNyhzI66deo80I" },
                { name: "الحلقة 2", teacher: "الشيخ محمد أشكناني", type: "فيديو", url: "https://www.youtube.com/watch?v=VkOYAac9s4c&list=PLWJ0XjdVWQj4F8arsKg7LpdHh3lRFoVp5" },
                { name: "الحلقة 3", teacher: "الشيخ محمد أشكناني", type: "فيديو", url: "https://www.youtube.com/watch?v=53ynjgDrIsw&list=PLWJ0XjdVWQj7MrGbdldYw8-Jas2-U5Ugw" },
                { name: "الحلقة 1", teacher: "الشيخ علي العبود", type: "فيديو", url: "https://www.youtube.com/watch?v=avlLqMqMrZE&list=PLB9E8E60E6BEA9DBA" },
                { name: "الحلقة 2", teacher: "الشيخ علي العبود", type: "فيديو", url: "https://www.youtube.com/watch?v=KTKkGA2c64o&list=PLXNQQLzru0ZEppXbArSC4NCXAVTdbZhNa" },
                { name: "الحلقة 1", teacher: "الشيخ أسامه آل بلال النجفي", type: "فيديو", url: "https://www.youtube.com/watch?v=SMjNi67NsMQ&list=PLc4StI_9asx8nIcUCBrPtanj7K15HvxqV" },
                { name: "الحلقة 2", teacher: "الشيخ أسامه آل بلال النجفي", type: "فيديو", url: "https://www.youtube.com/watch?v=peBBuL13nwo&list=PLkMNbQN-jBOqCLTj0rViA5K6AUvCvDsRj" },
                { name: "الحلقة 3", teacher: "الشيخ عبدالله الدقاق", type: "فيديو", url: "https://www.youtube.com/watch?v=HotmESEQ9o4&list=PLXNQQLzru0ZG_QeOP_KxUY0-_XUlsNHvr" },
                { name: "الحلقة 3", teacher: "الشيخ معين دقيق", type: "فيديو", url: "https://www.youtube.com/watch?v=d-51JTqDbTU&list=PLXNQQLzru0ZFrSdMP-7XP4ilYJfKezL2T" },
                { name: "الحلقة 2", teacher: "الشيخ جعفر الربيعي", type: "فيديو", url: "https://www.youtube.com/watch?v=BFjXS4mV3y0&list=PLaOFZDjF_xT5bF6Q2ybW-_uqIqHHUqTVP" }
              ]
            },
            {
              title: "القوانين المحكمة في الأصول",
              author: "الميرزا أبو القاسم القمي",
              links: [
                { name: "متن الكتاب", teacher: "شبكة الفكر", type: "كتابة", url: "https://alfeker.net/library.php?id=3957" }
              ]
            }
          ]
        },
        {
          name: "النحو",
          lessons: [
            {
              title: "شرح ابن عقيل، ومعه منحة الجليل",
              author: "بهاء الدين عبد الله بن عقيل",
              links: [
                { name: "متن الكتاب", teacher: "waqfeya.com", type: "كتابة", url: "https://waqfeya.com/book.php?bid=3511" },
                { name: "دائرة المعارف الحوزوية", teacher: "الشيخ علي الكركي", type: "صوتي", url: "https://howza.net/category/%d8%aa%d8%b5%d9%86%d9%8a%d9%81-%d8%a8%d8%ad%d8%b3%d8%a8-%d8%a7%d8%b3%d9%85%d8%a7%d8%a1-%d8%a7%d9%84%d9%83%d8%aa%d8%a8/%d8%b4%d8%b1%d8%ad-%d8%a7%d9%84%d8%a7%d9%84%d9%81%d9%8a%d8%a9/" },
                { name: "صوت الشيعة", teacher: "الشيخ محمد حسين بيت غانم", type: "صوتي", url: "http://shiavoice.com/cat-2059" },
                { name: "يوتيوب", teacher: "الشيخ خالد الجباوي (من العامة)", type: "فيديو", url: "https://www.youtube.com/watch?v=tCdbg6FY5yc&list=PLv8TLjRnMBYf5sCBiTfRtbjzBKNCH8Yg_" }
              ]
            },
            {
              title: "شرح الكافية الشافية",
              author: "ابن مالك الأندلسي",
              links: [
                { name: "متن الكتاب", teacher: "أرشيف الإنترنت", type: "كتابة", url: "https://ia800403.us.archive.org/12/items/ShafyaKafyaIbnMalik/12-IbnMalikKafiya.pdf" }
              ]
            }
          ]
        },
        {
          name: "الصرف",
          lessons: [
            {
              title: "شرح النظام على شافية ابن الحاجب",
              author: "نظام الدين النيسابوري",
              links: [
                { name: "متن الكتاب", teacher: "مدرسة الفقاهة", type: "كتابة", url: "http://ar.lib.eshia.ir/72021/1/2" },
                { name: "صوت الشيعة", teacher: "الشيخ محمد حسين بيت غانم", type: "صوتي", url: "http://shiavoice.com/cat-3293" },
                { name: "صوت الشيعة", teacher: "الشيخ علي آل محسن", type: "صوتي", url: "http://shiavoice.com/cat-6606" }
              ]
            }
          ]
        },
        {
          name: "البلاغة",
          lessons: [
            {
              title: "مختصر المعاني",
              author: "سعد الدين التفتازاني",
              links: [
                { name: "متن الكتاب", teacher: "مكتبة شيعة بوكس", type: "كتابة", url: "http://shiabooks.net/library.php?id=9590" },
                { name: "دائرة المعارف الحوزوية", teacher: "الشيخ جعفر آل طوق", type: "صوتي", url: "https://howza.net/category/%d8%aa%d8%b5%d9%86%d9%8a%d9%81-%d8%a8%d8%ad%d8%b3%d8%a8-%d8%a7%d8%b3%d9%85%d8%a7%d8%a1-%d8%a7%d9%84%d9%83%d8%aa%d8%a8/%d9%85%d8%ae%d8%aa%d8%b5%d8%b1-%d8%a7%d9%84%d9%85%d8%b9%d8%a7%d9%86%d9%8a/" },
                { name: "صوت الشيعة", teacher: "الشيخ معين دقيق العاملي", type: "صوتي", url: "https://shiavoice.com/cat-2275" },
                { name: "صوت الشيعة", teacher: "الشيخ علي آل محسن", type: "صوتي", url: "https://shiavoice.com/cat-6678" },
                { name: "صوت الشيعة", teacher: "الشيخ حسين السندي", type: "صوتي", url: "https://shiavoice.com/cat-157" },
                { name: "يوتيوب", teacher: "الشيخ معين دقيق العاملي", type: "فيديو", url: "https://www.youtube.com/watch?v=PYzEIvBcq7s&list=PLXNQQLzru0ZER7I8SfSw3M2Ftkdi0CuO_" },
                { name: "يوتيوب", teacher: "أ.د. محمد ذنون يونس الفتحي (من العامة)", type: "فيديو", url: "https://www.youtube.com/watch?v=glpDZA3-sNg&list=PLlQGKXR9nKrt_n3pwbMzkAaWIXLONJWqf" },
                { name: "يوتيوب", teacher: "أ.د. محمد سالم أبو عاصي (من العامة)", type: "فيديو", url: "https://www.youtube.com/watch?v=HI1grGEOEMI&list=PLrTL2Q1-ESJAHXNoTbaOrwCUXqFG-z_Rp" }
              ]
            },
            {
              title: "المطول في شرح تلخيص المفتاح",
              author: "سعد الدين التفتازاني",
              links: [
                { name: "متن الكتاب", teacher: "أرشيف الإنترنت", type: "كتابة", url: "https://archive.org/download/Mutawal/Mutawal.pdf" }
              ]
            }
          ]
        },
        {
          name: "المنطق",
          lessons: [
            {
              title: "القواعد الجلية في شرح الرسالة الشمسية",
              author: "العلامة الحلي",
              links: [
                { name: "متن الكتاب", teacher: "مكتبة شيعة بوكس", type: "كتابة", url: "https://shiabooks.net/library.php?id=9295" },
                { name: "صوت الشيعة", teacher: "الشيخ شاكر الفردان البحريني", type: "صوتي", url: "https://shiavoice.com/cat-158" },
                { name: "صوت الشيعة", teacher: "الشيخ علي العبود", type: "صوتي", url: "https://shiavoice.com/cat-1975" }
              ]
            },
            {
              title: "القوانين",
              author: "أفلاطون",
              links: [
                { name: "متن الكتاب", teacher: "شبكة الفكر", type: "كتابة", url: "https://alfeker.net/library.php?id=3957" }
              ]
            },
            {
              title: "لوامع الأسرار في شرح مطالع الأنوار",
              author: "قطب الدين الرازي",
              links: [
                { name: "متن الكتاب", teacher: "مكتبة شيعة بوكس", type: "كتابة", url: "http://shiabooks.net/library.php?id=9006" }
              ]
            },
            {
              title: "شرح المنظومة (قسم المنطق)",
              author: "الحكيم السبزواري، بشرح الشيخ محمد علي گرامي",
              links: [
                { name: "متن الكتاب", teacher: "موقع مكتبة", type: "كتابة", url: "http://mktba.net/library.php?id=8282" },
                { name: "دائرة المعارف الحوزوية", teacher: "متنوع", type: "صوتي", url: "https://howza.net/index.php/archives/category/%d8%aa%d8%b5%d9%86%d9%8a%d9%81-%d8%a8%d8%ad%d8%b3%d8%a8-%d8%a7%d8%b3%d9%85%d8%a7%d8%a1-%d8%a7%d9%84%d9%83%d8%aa%d8%a8/%d8%a7%d9%84%d9%85%d9%86%d8%b8%d9%88%d9%85%d8%a9-%d9%84%d9%84%d8%b3%d8%a8%d8%b2%d9%88%d8%b1%d8%a7%d9%8a" },
                { name: "صوت الشيعة", teacher: "السيد كمال الحيدري", type: "صوتي", url: "https://shiavoice.com/cat-611" },
                { name: "آخر", teacher: "السيد جعفر النمر الصايغ", type: "صوتي", url: "https://shiavoice.com/cat-3612" },
                { name: "رابط آخر", teacher: "السيد جعفر النمر الصايغ", type: "صوتي", url: "https://shiavoice.com/cat-5685" },
                { name: "صوت الشيعة", teacher: "الشيخ محمد كاظم الخاقاني", type: "صوتي", url: "https://shiavoice.com/cat-779" }
              ]
            }
          ]
        },
        {
          name: "العقائد والكلام",
          lessons: [
            {
              title: "كشف المراد في شرح تجريد الاعتقاد",
              author: "العلامة الحلي",
              links: [
                { name: "متن الكتاب", teacher: "شبكة الفكر", type: "كتابة", url: "http://alfeker.net/library.php?id=2289" },
                { name: "دائرة المعارف الحوزوية", teacher: "متنوع", type: "صوتي", url: "https://howza.net/archives/category/%d8%aa%d8%b5%d9%86%d9%8a%d9%81-%d8%ad%d8%b3%d8%a8-%d8%a7%d9%84%d9%85%d8%b1%d8%a7%d8%ad%d9%84-%d8%a7%d9%84%d8%af%d8%b1%d8%a7%d8%b3%d9%8a%d8%a9/hi-sotoh/%d8%aa%d8%ac%d8%b1%d9%8a%d8%af-%d8%a7%d9%84%d8%a7%d8%b9%d8%aa%d9%82%d8%a7%d8%af" },
                { name: "صوت الشيعة", teacher: "السيد كمال الحيدري", type: "صوتي", url: "https://shiavoice.com/cat-2963" },
                { name: "صوت الشيعة", teacher: "الشيخ محمدي البامياني", type: "صوتي", url: "https://shiavoice.com/cat-2964" },
                { name: "صوت الشيعة", teacher: "الشيخ حبيب حمادة", type: "صوتي", url: "https://shiavoice.com/cat-5057" },
                { name: "صوت الشيعة", teacher: "الشيخ فضيل الجزائري", type: "صوتي", url: "https://shiavoice.com/cat-2360" }
              ]
            }
          ]
        },
        {
          name: "الفلسفة",
          lessons: [
            {
              title: "فلسفتنا",
              author: "السيد الشهيد محمد باقر الصدر",
              links: [
                { name: "متن الكتاب", teacher: "شبكة الفكر", type: "كتابة", url: "http://alfeker.net/library.php?id=1446" }
              ]
            },
            {
              title: "بداية الحكمة",
              author: "السيد محمد حسين الطباطبائي",
              links: [
                { name: "متن الكتاب", teacher: "شبكة الفكر", type: "كتابة", url: "http://alfeker.net/library.php?id=1848" },
                { name: "دائرة المعارف الحوزوية", teacher: "السيد أحمد البطاط", type: "صوتي", url: "https://howza.net/category/%d8%aa%d8%b5%d9%86%d9%8a%d9%81-%d8%a8%d8%ad%d8%b3%d8%a8-%d8%a7%d8%b3%d9%85%d8%a7%d8%a1-%d8%a7%d9%84%d9%83%d8%aa%d8%a8/%d8%a8%d8%af%d8%a7%d9%8a%d8%a9-%d8%a7%d9%84%d8%ad%d9%83%d9%85%d8%a9/" },
                { name: "صوت الشيعة", teacher: "السيد كمال الحيدري", type: "صوتي", url: "http://shiavoice.com/cat-165" },
                { name: "صوت الشيعة", teacher: "الشيخ علي العبود", type: "صوتي", url: "http://shiavoice.com/cat-2310" },
                { name: "صوت الشيعة", teacher: "الشيخ حبيب حمادة", type: "صوتي", url: "http://shiavoice.com/cat-5213" },
                { name: "صوت الشيعة", teacher: "الشيخ عمار الخزعلي", type: "صوتي", url: "http://shiavoice.com/cat-7654" },
                { name: "يوتيوب", teacher: "الشيخ علي العبود", type: "فيديو", url: "https://www.youtube.com/watch?v=kIceG8C2thw&list=PLXNQQLzru0ZH8U294RmxU_jDMtwx7JTVA" },
                { name: "يوتيوب", teacher: "الشيخ محمد الأسدي", type: "فيديو", url: "https://www.youtube.com/watch?v=DdXY7wGmi2w&list=PLbVBjQP1gRMXE-YB9K0nBQyEKoIj3OVcb" },
                { name: "يوتيوب", teacher: "الشيخ محمد الحجي", type: "فيديو", url: "https://www.youtube.com/watch?v=k6cxUiQOzIM&list=PLXNQQLzru0ZEGOu9WVrQwbKclIflJ12Eu" },
                { name: "يوتيوب", teacher: "أبو حسن العبيدي", type: "فيديو", url: "https://www.youtube.com/watch?v=CYIorajiGdU&list=PL4iJHdLG8FgYZea6m0maUbxuhksj9uQoO" }
              ]
            },
            {
              title: "نهاية الحكمة",
              author: "السيد محمد حسين الطباطبائي",
              links: [
                { name: "متن الكتاب", teacher: "شبكة الفكر", type: "كتابة", url: "http://alfeker.net/library.php?id=2599" },
                { name: "دائرة المعارف الحوزوية", teacher: "متنوع", type: "صوتي", url: "https://howza.net/category/%d8%aa%d8%b5%d9%86%d9%8a%d9%81-%d8%a8%d8%ad%d8%b3%d8%a8-%d8%a7%d8%b3%d9%85%d8%a7%d8%a1-%d8%a7%d9%84%d9%83%d8%aa%d8%a8/%d9%86%d9%87%d8%a7%d9%8a%d8%a9-%d8%a7%d9%84%d8%ad%d9%83%d9%85%d8%a9/" },
                { name: "صوت الشيعة", teacher: "السيد كمال الحيدري", type: "صوتي", url: "http://shiavoice.com/cat-6330" },
                { name: "صوت الشيعة", teacher: "الشيخ فضيل الجزائري", type: "صوتي", url: "http://shiavoice.com/cat-6331" },
                { name: "صوت الشيعة", teacher: "الشيخ معين دقيق العاملي", type: "صوتي", url: "https://shiavoice.com/cat-11168" },
                { name: "صوت الشيعة", teacher: "السيد محمد رضا الشيرازي", type: "صوتي", url: "https://shiavoice.com/cat-8389" },
                { name: "يوتيوب", teacher: "الشيخ علي محسن", type: "فيديو", url: "https://www.youtube.com/watch?v=fMC2N9uUO-U&list=PLD575247CCFA4700F" },
                { name: "يوتيوب", teacher: "الشيخ مرتضى المياحي", type: "فيديو", url: "https://www.youtube.com/watch?v=WAzurNviYZk&list=PLUi5XZQMheDQoZPGBuqAvE2Fqn_CESsWf" }
              ]
            }
          ]
        }
      ]
    },
    {
      id: "kharij",
      order: "المستوى الثالث",
      name: "السطوح العليا (بحث الخارج)",
      intro: "كتب السطوح العليا (المكاسب والرسائل والكفاية)، ثم دروس البحث الخارج في الفقه والأصول لكبار الأساتذة.",
      subjects: [
        {
          name: "الفقه",
          lessons: [
            {
              title: "المكاسب",
              author: "الشيخ مرتضى الأنصاري",
              links: [
                { name: "متن الكتاب", teacher: "شبكة الفكر", type: "كتابة", url: "http://alfeker.net/library.php?id=4322" },
                { name: "متن الكتاب · نسخة ٢", teacher: "شبكة الفكر", type: "كتابة", url: "http://alfeker.net/library.php?id=4792" },
                { name: "صوت الشيعة", teacher: "الشيخ محمد باقر الإيرواني", type: "صوتي", url: "http://shiavoice.com/cat-2783" },
                { name: "البيع", teacher: "متنوع", type: "صوتي", url: "https://howza.net/category/%d8%aa%d8%b5%d9%86%d9%8a%d9%81-%d8%a8%d8%ad%d8%b3%d8%a8-%d8%a7%d8%b3%d9%85%d8%a7%d8%a1-%d8%a7%d9%84%d9%83%d8%aa%d8%a8/%d8%a7%d9%84%d9%85%d9%83%d8%a7%d8%b3%d8%a8-%d8%a7%d9%84%d8%a8%d9%8a%d8%b9/" },
                { name: "الخيارات", teacher: "متنوع", type: "صوتي", url: "https://howza.net/category/%d8%aa%d8%b5%d9%86%d9%8a%d9%81-%d8%a8%d8%ad%d8%b3%d8%a8-%d8%a7%d8%b3%d9%85%d8%a7%d8%a1-%d8%a7%d9%84%d9%83%d8%aa%d8%a8/%d8%a7%d9%84%d9%85%d9%83%d8%a7%d8%b3%d8%a8-%d8%a7%d9%84%d8%ae%d9%8a%d8%a7%d8%b1%d8%a7%d8%aa/" },
                { name: "المكاسب المحرمة", teacher: "متنوع", type: "صوتي", url: "https://howza.net/category/%d8%aa%d8%b5%d9%86%d9%8a%d9%81-%d8%a8%d8%ad%d8%b3%d8%a8-%d8%a7%d8%b3%d9%85%d8%a7%d8%a1-%d8%a7%d9%84%d9%83%d8%aa%d8%a8/%d8%a7%d9%84%d9%85%d9%83%d8%a7%d8%b3%d8%a8-%d8%a7%d9%84%d9%85%d8%ad%d8%b1%d9%85%d8%a9/" },
                { name: "يوتيوب", teacher: "الشيخ علي الإيرواني", type: "فيديو", url: "https://www.youtube.com/watch?v=UO7XwP-LmJo&list=PLXNQQLzru0ZEpbQcyr5oheQgl5Mc6OcKV" },
                { name: "يوتيوب", teacher: "الشيخ عبدالله الدقاق", type: "فيديو", url: "https://www.youtube.com/watch?v=N40FNBQoxmk&list=PLXNQQLzru0ZHcbtLHZORBIYpS6zzUuyoe" }
              ]
            },
            {
              title: "دروس بحث الخارج في الفقه",
              author: "تسجيلات أساتذة البحث الخارج في الحوزات العلمية",
              links: [
                { name: "مسجلة ومباشر", teacher: "دروس مدرسة الفقاهة", type: "صوتي", url: "http://eshia.ir/Ar/Default.htm" },
                { name: "holynajaf.net", teacher: "مركز آل البيت العلامي للمعلومات (النجف)", type: "صوتي", url: "http://holynajaf.net/ar/howzah/drasty-hoze" },
                { name: "صوت الشيعة", teacher: "السيد محمود الهاشمي الشاهرودي", type: "صوتي", url: "https://shiavoice.com/cat-193" },
                { name: "صوت الشيعة", teacher: "الشيخ محمد باقر الإيرواني", type: "صوتي", url: "https://shiavoice.com/cat-150" },
                { name: "صوت الشيعة", teacher: "الشيخ محمد علي الفاضلي", type: "صوتي", url: "https://shiavoice.com/cat-790" },
                { name: "صوت الشيعة", teacher: "الشيخ عبدالكريم الحائري", type: "صوتي", url: "https://shiavoice.com/cat-788" },
                { name: "صوت الشيعة", teacher: "السيد حيدر الموسوي", type: "صوتي", url: "https://shiavoice.com/cat-10177" },
                { name: "صوت الشيعة", teacher: "السيد علي السبزواري", type: "صوتي", url: "https://shiavoice.com/cat-11106" },
                { name: "صوت الشيعة", teacher: "السيد علي مكي", type: "صوتي", url: "https://shiavoice.com/cat-10210" },
                { name: "صوت الشيعة", teacher: "السيد كاظم الحائري", type: "صوتي", url: "https://shiavoice.com/cat-9634" },
                { name: "m-alshirazi.com", teacher: "السيد مرتضى الحسيني الشيرازي", type: "صوتي", url: "http://www.m-alshirazi.com/part.php?id=6" },
                { name: "صوت الشيعة", teacher: "السيد منير الخباز", type: "صوتي", url: "https://shiavoice.com/cat-3861" },
                { name: "صوت الشيعة", teacher: "الشيخ إبراهيم الدماوندي", type: "صوتي", url: "https://shiavoice.com/cat-10196" },
                { name: "صوت الشيعة", teacher: "الشيخ بشير النجفي", type: "صوتي", url: "https://shiavoice.com/cat-6322" },
                { name: "صوت الشيعة", teacher: "الشيخ حسان سويدان العاملي", type: "صوتي", url: "https://shiavoice.com/cat-9601" },
                { name: "صوت الشيعة", teacher: "الشيخ حسن الجواهري", type: "صوتي", url: "https://shiavoice.com/cat-7641" },
                { name: "صوت الشيعة", teacher: "الشيخ حسن الرميثي", type: "صوتي", url: "https://shiavoice.com/cat-9825" },
                { name: "صوت الشيعة", teacher: "الشيخ محمد اسحاق الفياض", type: "صوتي", url: "https://shiavoice.com/cat-9599" },
                { name: "صوت الشيعة", teacher: "الشيخ محمد السند", type: "صوتي", url: "https://shiavoice.com/cat-6549" },
                { name: "صوت الشيعة", teacher: "الشيخ محمد تقي شهيدي پور", type: "صوتي", url: "https://shiavoice.com/cat-9683" },
                { name: "صوت الشيعة", teacher: "الشيخ هادي آل راضي", type: "صوتي", url: "https://shiavoice.com/cat-151" }
              ]
            }
          ]
        },
        {
          name: "الأصول",
          lessons: [
            {
              title: "فرائد الأصول (الرسائل)",
              author: "الشيخ مرتضى الأنصاري",
              links: [
                { name: "متن الكتاب", teacher: "شبكة الفكر", type: "كتابة", url: "https://alfeker.net/library.php?id=4529" },
                { name: "متن الكتاب · نسخة أخرى", teacher: "مكتبة شيعة بوكس", type: "كتابة", url: "http://shiabooks.net/library.php?id=9018" },
                { name: "صوت الشيعة", teacher: "الشيخ محمد باقر الإيرواني", type: "صوتي", url: "https://shiavoice.com/cat-208" },
                { name: "صوت الشيعة", teacher: "السيد كمال الحيدري", type: "صوتي", url: "https://shiavoice.com/cat-613" },
                { name: "القطع", teacher: "الشيخ صالح الفقيه", type: "فيديو", url: "https://www.youtube.com/watch?v=xUGAwxXSzx0&list=PLKyv80g-gWXpfeAmcmocabEcPuptwWF2v" },
                { name: "يوتيوب", teacher: "السيد حسين القزويني", type: "فيديو", url: "https://www.youtube.com/watch?v=V1EWLLcVu0Q&list=PLN2QEZj6NfbgyH8ue_a60xZtvG4rZuYTl" },
                { name: "دائرة المعارف الحوزوية", teacher: "متنوع", type: "صوتي", url: "https://howza.net/archives/category/%d8%aa%d8%b5%d9%86%d9%8a%d9%81-%d8%ad%d8%b3%d8%a8-%d8%a7%d9%84%d9%85%d8%b1%d8%a7%d8%ad%d9%84-%d8%a7%d9%84%d8%af%d8%b1%d8%a7%d8%b3%d9%8a%d8%a9/hi-sotoh/%d9%81%d8%b1%d8%a7%d8%a6%d8%af-%d8%a7%d9%84%d8%a7%d8%b5%d9%88%d9%84" },
                { name: "صوت الشيعة", teacher: "الشيخ محمد باقر الإيرواني", type: "صوتي", url: "https://shiavoice.com/cat-162" },
                { name: "صوت الشيعة", teacher: "الشيخ علي الصددي", type: "صوتي", url: "https://shiavoice.com/cat-7475" },
                { name: "يوتيوب", teacher: "السيد عادل الحكيم", type: "فيديو", url: "https://www.youtube.com/watch?v=RKkJT64bhWM&list=PLXYLftvtiy7cGvlqwY03V3ElLBGErCi_C" },
                { name: "يوتيوب", teacher: "الشيخ معين شرارة", type: "فيديو", url: "https://www.youtube.com/watch?v=NW6nKkFZ9mE&list=PLXNQQLzru0ZH18uPYjRjtvRfNUVQHH_fZ" },
                { name: "يوتيوب", teacher: "الشيخ جعفر آل طوق", type: "فيديو", url: "https://www.youtube.com/watch?v=0PxsKJ86jvc&list=PLXNQQLzru0ZGYRZGteGtbhFtqhxEzp18A" }
              ]
            },
            {
              title: "كفاية الأصول",
              author: "الآخوند الخراساني",
              links: [
                { name: "صوت الشيعة", teacher: "متنوع", type: "صوتي", url: "https://shiavoice.com/cat-780" },
                { name: "دائرة المعارف الحوزوية", teacher: "متنوع", type: "صوتي", url: "https://howza.net/archives/category/%d8%aa%d8%b5%d9%86%d9%8a%d9%81-%d8%ad%d8%b3%d8%a8-%d8%a7%d9%84%d9%85%d8%b1%d8%a7%d8%ad%d9%84-%d8%a7%d9%84%d8%af%d8%b1%d8%a7%d8%b3%d9%8a%d8%a9/hi-sotoh/%d9%83%d9%81%d8%a7%d9%8a%d8%a9-%d8%a7%d9%84%d8%a7%d8%b5%d9%88%d9%84" },
                { name: "الجزء 1", teacher: "الشيخ عبدالرضا الرويمي", type: "صوتي", url: "https://shiavoice.com/cat-8072" },
                { name: "الجزء 2", teacher: "الشيخ عبدالرضا الرويمي", type: "صوتي", url: "https://shiavoice.com/cat-8112" },
                { name: "صوت الشيعة", teacher: "السيد محمد صادق الصدر", type: "صوتي", url: "http://shiavoice.com/cat-4577" },
                { name: "صوت الشيعة", teacher: "الشيخ محمد باقر الإيرواني", type: "صوتي", url: "http://shiavoice.com/cat-207" },
                { name: "يوتيوب", teacher: "السيد صباح شبر", type: "فيديو", url: "https://www.youtube.com/watch?v=lMqO1Kxd664&list=PLqFyop8j4Ei8YROME8DHuxARP5_uPm4aJ" },
                { name: "يوتيوب", teacher: "السيد حسين القزويني", type: "فيديو", url: "https://www.youtube.com/watch?v=9fnKs3vMegg&list=PLN2QEZj6Nfbj6Dw59xOY-AGWxHmKUa3cO" },
                { name: "الجزء 1", teacher: "الشيخ معين دقيق", type: "فيديو", url: "https://www.youtube.com/watch?v=oOdSceSKeFg&list=PLXNQQLzru0ZHmYL9tIQDcG8X56DhAKSO1" },
                { name: "الجزء 2", teacher: "الشيخ معين دقيق", type: "فيديو", url: "https://www.youtube.com/watch?v=EAfyutXU-8s&list=PLXNQQLzru0ZE-i9PAFQAwwQrVDIpewbKZ" },
                { name: "الجزء 1", teacher: "الشيخ محمد كاظم الخاقاني", type: "فيديو", url: "https://www.youtube.com/watch?v=OnJtkDZLLkw&list=PLlSNfN-CQJY6yiOpL8kFhjxm-sNOK3_1u" },
                { name: "يوتيوب", teacher: "الشيخ محمد كاظم الخاقاني", type: "فيديو", url: "https://www.youtube.com/watch?v=zHSeq6l0anQ&list=PLlSNfN-CQJY6ORmUHaJn1rljQhhpTt6a6" },
                { name: "الجزء 2", teacher: "الشيخ محمد كاظم الخاقاني", type: "فيديو", url: "https://www.youtube.com/watch?v=d2Qyy4RXzgc&list=PLlSNfN-CQJY51LwLL9B3lrKOJ4sdoYC4n" },
                { name: "يوتيوب", teacher: "الشيخ فاضل الصفار", type: "فيديو", url: "https://www.youtube.com/watch?v=D-ttpo5ZiBk&list=PLKyv80g-gWXpbLi-4ak7ZN4epUBJquOwQ" },
                { name: "يوتيوب", teacher: "الشيخ عبدالله الدقاق", type: "فيديو", url: "https://www.youtube.com/watch?v=XyESJzpK_Tk&list=PLsHMs9A5BgSFmj2Ip1NpCAGIfphMeQpzB" }
              ]
            },
            {
              title: "دروس بحث الخارج في الأصول",
              author: "تسجيلات أساتذة البحث الخارج في الحوزات العلمية",
              links: [
                { name: "مسجلة ومباشر", teacher: "دروس مدرسة الفقاهة", type: "صوتي", url: "http://eshia.ir/Ar/Default.htm" },
                { name: "holynajaf.net", teacher: "مركز آل البيت العلامي للمعلومات (النجف)", type: "صوتي", url: "http://holynajaf.net/ar/howzah/drasty-hoze" },
                { name: "صوت الشيعة", teacher: "السيد ابو القاسم الموسوي الخوئي (قده)", type: "صوتي", url: "https://shiavoice.com/cat-260" },
                { name: "صوت الشيعة", teacher: "السيد محمود الهاشمي الشاهرودي", type: "صوتي", url: "https://shiavoice.com/cat-193" },
                { name: "صوت الشيعة", teacher: "الشيخ محمد باقر الإيرواني", type: "صوتي", url: "https://shiavoice.com/cat-150" },
                { name: "صوت الشيعة", teacher: "السيد صادق الحسيني الشيرازي", type: "صوتي", url: "https://shiavoice.com/cat-2388" },
                { name: "صوت الشيعة", teacher: "الشيخ فاضل الصفار", type: "صوتي", url: "https://shiavoice.com/cat-785" },
                { name: "صوت الشيعة", teacher: "السيد حيدر الموسوي", type: "صوتي", url: "https://shiavoice.com/cat-10177" },
                { name: "صوت الشيعة", teacher: "السيد علي السبزواري", type: "صوتي", url: "https://shiavoice.com/cat-11106" },
                { name: "صوت الشيعة", teacher: "السيد علي رضا الحائري", type: "صوتي", url: "https://shiavoice.com/cat-6522" },
                { name: "صوت الشيعة", teacher: "السيد علي مكي", type: "صوتي", url: "https://shiavoice.com/cat-10210" },
                { name: "صوت الشيعة", teacher: "السيد كاظم الحائري", type: "صوتي", url: "https://shiavoice.com/cat-9634" },
                { name: "صوت الشيعة", teacher: "السيد محمد رضا التبريزي (قده)", type: "صوتي", url: "https://shiavoice.com/cat-9713" },
                { name: "m-alshirazi.com", teacher: "السيد مرتضى الحسيني الشيرازي", type: "صوتي", url: "http://www.m-alshirazi.com/part.php?id=7" },
                { name: "صوت الشيعة", teacher: "السيد منير الخباز", type: "صوتي", url: "https://shiavoice.com/cat-3861" },
                { name: "صوت الشيعة", teacher: "الشيخ الأحمدي", type: "صوتي", url: "https://shiavoice.com/cat-9711" },
                { name: "صوت الشيعة", teacher: "الشيخ الشهابي", type: "صوتي", url: "https://shiavoice.com/cat-9715" },
                { name: "صوت الشيعة", teacher: "الشيخ بشير النجفي", type: "صوتي", url: "https://shiavoice.com/cat-6322" },
                { name: "صوت الشيعة", teacher: "الشيخ حسان سويدان العاملي", type: "صوتي", url: "https://shiavoice.com/cat-9601" },
                { name: "صوت الشيعة", teacher: "الشيخ حسن الجواهري", type: "صوتي", url: "https://shiavoice.com/cat-7641" },
                { name: "صوت الشيعة", teacher: "الشيخ حسن الرميثي", type: "صوتي", url: "https://shiavoice.com/cat-9825" },
                { name: "صوت الشيعة", teacher: "الشيخ محمد اسحاق الفياض", type: "صوتي", url: "https://shiavoice.com/cat-9599" },
                { name: "صوت الشيعة", teacher: "الشيخ محمد السند", type: "صوتي", url: "https://shiavoice.com/cat-6549" },
                { name: "صوت الشيعة", teacher: "الشيخ هادي آل راضي", type: "صوتي", url: "https://shiavoice.com/cat-151" }
              ]
            }
          ]
        }
      ]
    }
  ],

  /* ---------------- خزانة الكتب الحوزوية ----------------
     كل كتاب يُفتح في قارئ تُقلَّب صفحاته باليد. حقوله:
     title   : اسم الكتاب            author : مؤلفه
     on      : (للشروح فقط) الكتاب المشروح
     about   : سطر تعريفي يظهر في بطاقة الكتاب (اختياري)
     sources : روابط قراءته في المكتبات: مدرسة الفقاهة، شبكة الفكر، مكتبة أهل البيت
     pages   : (اختياري) نصوص صفحات تُعرض داخل القارئ، كل نص صفحة              */
  books: {
    "مصادر": [
      {
        title: "الكافي", author: "الشيخ الكليني",
        about: "أول الكتب الأربعة وأجمعها، في الأصول والفروع والروضة.",
        sources: [
          { site: "مدرسة الفقاهة", url: "https://ar.lib.eshia.ir/11005/1/1" },
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=1443" },
          { site: "مكتبة أهل البيت", url: "https://ablibrary.net/book_content/b/3252/1" }
        ]
      },
      {
        title: "من لا يحضره الفقيه", author: "الشيخ الصدوق",
        about: "ثاني الكتب الأربعة، جمع فيه الصدوق أحاديث الأحكام.",
        sources: [
          { site: "مدرسة الفقاهة", url: "https://ar.lib.eshia.ir/11021/1/1" }
        ]
      },
      {
        title: "تهذيب الأحكام", author: "الشيخ الطوسي",
        about: "من الكتب الأربعة، شرح فيه الطوسي كتاب المقنعة بالأحاديث.",
        sources: [
          { site: "مدرسة الفقاهة", url: "https://ar.lib.eshia.ir/10083/1/1" }
        ]
      },
      {
        title: "الاستبصار", author: "الشيخ الطوسي",
        about: "من الكتب الأربعة، فيما اختلف من الأخبار.",
        sources: [
          { site: "مدرسة الفقاهة", url: "https://ar.lib.eshia.ir/11002/1/1" }
        ]
      },
      {
        title: "وسائل الشيعة", author: "الحر العاملي",
        about: "الجامع الأشهر لأحاديث الأحكام، مرتّب على أبواب الفقه.",
        sources: [
          { site: "مدرسة الفقاهة", url: "https://ar.lib.eshia.ir/11025/1/1" },
          { site: "مكتبة أهل البيت", url: "https://ablibrary.net/book_content/b/6603/1" }
        ]
      },
      {
        title: "بحار الأنوار", author: "العلامة المجلسي",
        about: "الموسوعة الحديثية الكبرى.",
        sources: [
          { site: "مدرسة الفقاهة", url: "https://ar.lib.eshia.ir/11008/1/1" }
        ]
      },
      {
        title: "نهج البلاغة", author: "جمع الشريف الرضي",
        about: "مختار خطب أمير المؤمنين عليه السلام ورسائله وحِكَمه.",
        pages: ["الحمد لله الذي لا يبلغ مدحته القائلون، ولا يُحصي نعماءه العادّون، ولا يؤدّي حقّه المجتهدون، الذي لا يُدركه بُعد الهمم، ولا يناله غوص الفطن.","الذي ليس لصفته حدٌّ محدود، ولا نعتٌ موجود، ولا وقتٌ معدود، ولا أجلٌ ممدود. فطر الخلائق بقدرته، ونشر الرياح برحمته، ووتّد بالصخور ميدان أرضه."],
        sources: [
          { site: "مدرسة الفقاهة", url: "https://ar.lib.eshia.ir/12092/1/1" },
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=4910" },
          { site: "مكتبة أهل البيت", url: "https://ablibrary.net/book_content/3555/1" }
        ]
      },
      {
        title: "اللمعات النيرة في شرح تكملة التبصرة (2 جزء)", author: "الآخوند الشيخ محمد كاظم الخراساني",
        about: "من الكتب المقترحة للعرض مع «تبصرة المتعلمين في أحكام الدين».",
        sources: [
          { site: "مكتبة المساحة", url: "https://www.masaha.org/group_books/1905-%D8%A7%D9%84%D9%84%D9%85%D8%B9%D8%A7%D8%AA-%D8%A7%D9%84%D9%86%D9%8A%D8%B1%D8%A9-%D9%81%D9%8A-%D8%B4%D8%B1%D8%AD-%D8%AA%D9%83%D9%85%D9%84%D8%A9-%D8%A7%D9%84%D8%AA%D8%A8%D8%B5%D8%B1%D8%A9" }
        ]
      },
      {
        title: "المعتبر في شرح المختصر", author: "2 جزء المحقق الحلي الشيخ جعفر بن الحسن",
        about: "من الكتب المقترحة للعرض مع «المختصر النافع في فقه الإمامية».",
        sources: [
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=4524" }
        ]
      },
      {
        title: "نهاية المرام في شرح مختصر شرائع الإسلام (2 جزء)", author: "السيد محمد بن علي الموسوي العاملي مصباح الفقيه في شرح شرائع الإسلام، حاج آقا رضا الهمداني",
        about: "من الكتب المقترحة للعرض مع «شرائع الإسلام في مسائل الحلال والحرام».",
        sources: [
          { site: "مكتبة المنتظر", url: "http://almontdr.blogspot.com/2016/03/blog-post_91.html" }
        ]
      },
      {
        title: "مصادر الفقه الإسلامي ومنابعه الشيخ جعفر السبحاني", author: "",
        about: "من الكتب المقترحة للعرض مع «الموجز في أصول الفقه».",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "https://shiabooks.net/library.php?id=8303" }
        ]
      },
      {
        title: "تتميم كتاب أصول الفقه للمظفر الشيخ غلام رضا عرفانيان التستري", author: "",
        about: "من الكتب المقترحة للعرض مع «أصول الفقه».",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/book/2708-%D8%AA%D8%AA%D9%85%D9%8A%D9%85-%D9%83%D8%AA%D8%A7%D8%A8-%D8%A3%D8%B5%D9%88%D9%84-%D8%A7%D9%84%D9%81%D9%82%D9%87-%D9%84%D9%84%D9%85%D8%B8%D9%81%D8%B1" }
        ]
      },
      {
        title: "الحلقة الثالثة أسئلة وأجوبة (2 جزء)", author: "علي حسن المطر",
        about: "من الكتب المقترحة للعرض مع «دروس في علم الأصول (الحلقات الثلاث)».",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/group_books/1270-%D8%A7%D9%84%D8%AD%D9%84%D9%82%D8%A9-%D8%A7%D9%84%D8%AB%D8%A7%D9%84%D8%AB%D8%A9-%D8%A3%D8%B3%D8%A6%D9%84%D8%A9-%D9%88%D8%A3%D8%AC%D9%88%D8%A8%D8%A9" }
        ]
      },
      {
        title: "مطارح الأنظار", author: "تقريرات الشيخ الأنصاري",
        about: "من الكتب المقترحة للعرض مع «فرائد الأصول (الرسائل)».",
        sources: [
          { site: "مكتبة المنتظر", url: "http://almontdr.blogspot.com/2016/10/blog-post_9.html" }
        ]
      },
      {
        title: "كفاية الأصول، في أسلوبها الثاني 5 أجزاء", author: "الشيخ محمد باقر الإيرواني",
        about: "من الكتب المقترحة للعرض مع «كفاية الأصول».",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=3351" }
        ]
      },
      {
        title: "الكواكب الدرية في شرح متممة الآجرومية", author: "الشيخ محمد بن أحمد بن عبد الباري الأهدل",
        about: "من الكتب المقترحة للعرض مع «متن الآجرومية».",
        sources: [
          { site: "أرشيف الإنترنت", url: "http://www.archive.org/download/Hassouni_460/KawakibDorria.pdf" }
        ]
      },
      {
        title: "المطلع شرح إيساغوجي", author: "زكريا بن محمد بن أحمد بن زكريا الأنصاري",
        about: "من الكتب المقترحة للعرض مع «المنطق».",
        sources: [
          { site: "أرشيف الإنترنت", url: "https://archive.org/download/mashesmashes/mashes.pdf" },
          { site: "أرشيف الإنترنت · منطق أرسطو (تحقيق بدوي) ج1", url: "https://archive.org/download/ali95_1_20161008/%D9%85%D9%86%D8%B7%D9%82%20%D8%A3%D8%B1%D8%B3%D8%B7%D9%88%20-%20%D8%AA%D8%AD%D9%82%D9%8A%D9%82%20%D8%A7%D9%84%D8%AF%D9%83%D8%AA%D9%88%D8%B1%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D8%B1%D8%AD%D9%85%D9%86%20%D8%A8%D8%AF%D9%88%D9%8A%201.pdf" },
          { site: "أرشيف الإنترنت · منطق أرسطو (تحقيق بدوي) ج2", url: "https://archive.org/download/ali95_2_20161008/%D9%85%D9%86%D8%B7%D9%82%20%D8%A3%D8%B1%D8%B3%D8%B7%D9%88%20-%20%D8%AA%D8%AD%D9%82%D9%8A%D9%82%20%D8%A7%D9%84%D8%AF%D9%83%D8%AA%D9%88%D8%B1%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D8%B1%D8%AD%D9%85%D9%86%20%D8%A8%D8%AF%D9%88%D9%8A%202.pdf" },
          { site: "أرشيف الإنترنت · منطق أرسطو (تحقيق بدوي) ج3", url: "https://archive.org/download/ali95_3_201610/%D9%85%D9%86%D8%B7%D9%82%20%D8%A3%D8%B1%D8%B3%D8%B7%D9%88%20-%20%D8%AA%D8%AD%D9%82%D9%8A%D9%82%20%D8%A7%D9%84%D8%AF%D9%83%D8%AA%D9%88%D8%B1%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D8%B1%D8%AD%D9%85%D9%86%20%D8%A8%D8%AF%D9%88%D9%8A%203.pdf" }
        ]
      },
      {
        title: "أرسطو عند العرب، دراسة نصوص غير منشورة", author: "د عبدالرحمن بدوي",
        about: "من الكتب المقترحة للعرض مع «المنطق».",
        sources: [
          { site: "أرشيف الإنترنت", url: "https://archive.org/download/almoataz2006_yahoo_04_201808/04%20-%20%D8%A3%D8%B1%D8%B3%D8%B7%D9%88%20%D8%B9%D9%86%D8%AF%20%D8%A7%D9%84%D8%B9%D8%B1%D8%A8.pdf" }
        ]
      },
      {
        title: "نقد الآراء المنطقية وحل مشكلاتها 2 جزء", author: "الشيخ علي كاشف الغطاء",
        about: "من الكتب المقترحة للعرض مع «حاشية ملا عبد الله على التهذيب».",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=3661" }
        ]
      },
      {
        title: "تجريد المنطق", author: "الخواجة نصير الدين محمد بن الحسن الطوسي",
        about: "من الكتب المقترحة للعرض مع «شرح المنظومة (قسم المنطق)».",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=1648" }
        ]
      },
      {
        title: "الإشارات و التنبيهات", author: "الشيخ الرئيس ابن سينا، تحقيق مجتبى الزارعي",
        about: "من الكتب المقترحة للعرض مع «شرح المنظومة (قسم المنطق)».",
        sources: [
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=4020" }
        ]
      },
      {
        title: "الإشارات والتنبيهات،مع شرح الخواجة نصير الدين الطوسي والمحاكمات لقطب الدين الرازي ابو علي سينا 3 أجزاء", author: "",
        about: "من الكتب المقترحة للعرض مع «شرح المنظومة (قسم المنطق)».",
        sources: [
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=3667" }
        ]
      },
      {
        title: "آداب المتعلمين والمسترشدين الميرزا جواد التبريزي", author: "",
        about: "من الكتب المقترحة للعرض مع «آداب المتعلمين».",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=3128" }
        ]
      },
      {
        title: "تهذيب الأخلاق أو كتاب الطهارة في تهذيب الأخلاق", author: "أحمد بن محمد بن مسكويه",
        about: "من الكتب المقترحة للعرض مع «جامع السعادات».",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=5009" }
        ]
      },
      {
        title: "أخلاق ناصري", author: "الخواجة نصير الدين الطوسي",
        about: "من الكتب المقترحة للعرض مع «جامع السعادات».",
        sources: [
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=4341" }
        ]
      },
      {
        title: "مصباح الشريعة", author: "المنسوب للإمام الصادق ع",
        about: "من الكتب المقترحة للعرض مع «جامع السعادات».",
        sources: [
          { site: "alfeker.mediafire.com", url: "http://alfeker.mediafire.com/?j42gd7f0m9ignfu" }
        ]
      },
      {
        title: "جامع الأخبار أو معارج اليقين و أصول الدين", author: "الشيخ محمد بن محمد السبزواري",
        about: "من الكتب المقترحة للعرض مع «جامع السعادات».",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=2396" }
        ]
      },
      {
        title: "أصول العقيدة", author: "السيد محمد سعيد الطباطبائي الحكيم",
        about: "من الكتب المقترحة للعرض مع «عقائد الإمامية».",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "http://shiabooks.net/library.php?id=10813" }
        ]
      },
      {
        title: "الإلهيات 4 أجزاء", author: "الشيخ جعفر السبحاني",
        about: "من الكتب المقترحة للعرض مع «تلخيص محاضرات في الإلهيات».",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=1434" }
        ]
      },
      {
        title: "دروس في العقيدة الإسلامية الشيخ محمد تقي المصباح التستري", author: "",
        about: "من الكتب المقترحة للعرض مع «تلخيص محاضرات في الإلهيات».",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=1831" }
        ]
      },
      {
        title: "في رحاب العقيدة 3 أجزاء", author: "السيد محمد سعيد الحكيم",
        about: "من الكتب المقترحة للعرض مع «الباب الحادي عشر».",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=2277" }
        ]
      },
      {
        title: "حق اليقين في معرفة أصول الدين السيد عبدالله شبر نتائج الفكر في شرح الباب الحادي عشر ج1 ج2 ج3 ج4", author: "الشيخ الكرمي",
        about: "من الكتب المقترحة للعرض مع «الباب الحادي عشر».",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=1691" },
          { site: "أرشيف الإنترنت · ج1", url: "https://archive.org/download/moamenquraish_gmail_1_201508/%D9%86%D8%AA%D8%A7%D8%A6%D8%AC%20%D8%A7%D9%84%D9%81%D9%83%D8%B1%20%D9%81%D9%8A%20%D8%B4%D8%B1%D8%AD%20%D8%A7%D9%84%D8%A8%D8%A7%D8%A8%20%D8%A7%D9%84%D8%AD%D8%A7%D8%AF%D9%8A%20%D8%B9%D8%B4%D8%B1%20%D9%80%20%D8%AC1%20%D9%80%20%D8%A7%D9%84%D8%B4%D9%8A%D8%AE%20%D8%A7%D9%84%D9%83%D8%B1%D9%85%D9%8A.pdf" },
          { site: "أرشيف الإنترنت · ج2", url: "https://archive.org/download/moamenquraish_gmail_2_201508/%D9%86%D8%AA%D8%A7%D8%A6%D8%AC%20%D8%A7%D9%84%D9%81%D9%83%D8%B1%20%D9%81%D9%8A%20%D8%B4%D8%B1%D8%AD%20%D8%A7%D9%84%D8%A8%D8%A7%D8%A8%20%D8%A7%D9%84%D8%AD%D8%A7%D8%AF%D9%8A%20%D8%B9%D8%B4%D8%B1%20%D9%80%20%D8%AC2%20%D9%80%20%D8%A7%D9%84%D8%B4%D9%8A%D8%AE%20%D8%A7%D9%84%D9%83%D8%B1%D9%85%D9%8A.pdf" },
          { site: "أرشيف الإنترنت · ج3", url: "https://archive.org/download/moamenquraish_gmail_3_201508/%D9%86%D8%AA%D8%A7%D8%A6%D8%AC%20%D8%A7%D9%84%D9%81%D9%83%D8%B1%20%D9%81%D9%8A%20%D8%B4%D8%B1%D8%AD%20%D8%A7%D9%84%D8%A8%D8%A7%D8%A8%20%D8%A7%D9%84%D8%AD%D8%A7%D8%AF%D9%8A%20%D8%B9%D8%B4%D8%B1%20%D9%80%20%D8%AC3%20%D9%80%20%D8%A7%D9%84%D8%B4%D9%8A%D8%AE%20%D8%A7%D9%84%D9%83%D8%B1%D9%85%D9%8A.pdf" },
          { site: "أرشيف الإنترنت · ج4", url: "https://archive.org/download/moamenquraish_gmail_4_201508/%D9%86%D8%AA%D8%A7%D8%A6%D8%AC%20%D8%A7%D9%84%D9%81%D9%83%D8%B1%20%D9%81%D9%8A%20%D8%B4%D8%B1%D8%AD%20%D8%A7%D9%84%D8%A8%D8%A7%D8%A8%20%D8%A7%D9%84%D8%AD%D8%A7%D8%AF%D9%8A%20%D8%B9%D8%B4%D8%B1%20%D9%80%20%D8%AC4%D9%80%20%D8%A7%D9%84%D8%B4%D9%8A%D8%AE%20%D8%A7%D9%84%D9%83%D8%B1%D9%85%D9%8A.pdf" }
        ]
      },
      {
        title: "الإلهيات من كتاب الشفاء", author: "الشيخ الرئيس ابن سينا",
        about: "من الكتب المقترحة للعرض مع «كشف المراد في شرح تجريد الاعتقاد».",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=2802" }
        ]
      },
      {
        title: "دروس في علم الدراية", author: "الشيخ أكرم",
        about: "من الكتب المقترحة للعرض مع «البداية في علم الدراية».",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=2291" }
        ]
      },
      {
        title: "بركات العاملي", author: "[شرح: الشيخ علي المظفر ]",
        about: "من الكتب المقترحة للعرض مع «البداية في علم الدراية».",
        sources: [
          { site: "يوتيوب", url: "https://www.youtube.com/watch?v=QMUFLAkz534&list=PL9Ax12r50OLF6z8YgafDw-LDSLNej3JoG" }
        ]
      },
      {
        title: "دروس في علم الدراية", author: "دكتور السيد رضا مؤدب، ترجمة قاسم البيضاني",
        about: "من الكتب المقترحة للعرض مع «البداية في علم الدراية».",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=4095" }
        ]
      },
      {
        title: "بحوث في علم الدراية والرواية شرح وجيز الشيخ البهاني", author: "الشيخ مالك مصطفى وهن العاملي",
        about: "من الكتب المقترحة للعرض مع «البداية في علم الدراية».",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=1591" }
        ]
      },
      {
        title: "مقباس الهداية في علم الدراية 2 جزء", author: "الشيخ عبدالله المامقاني",
        about: "من الكتب المقترحة للعرض مع «البداية في علم الدراية».",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=2600" }
        ]
      },
      {
        title: "توضيح دروس موجزة في علمي الرجال والدراية للشيخ جعفر السبحاني", author: "عمار محمد كاظم الساعدي",
        about: "من الكتب المقترحة للعرض مع «أصول الحديث وأحكامه في علم الدراية».",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=4683" }
        ]
      },
      {
        title: "المبادئ العامة لعلم مصطلح الحديث المقارن", author: "الدكتور علي خضير حجي",
        about: "من الكتب المقترحة للعرض مع «أصول الحديث وأحكامه في علم الدراية».",
        sources: [
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=4374" }
        ]
      },
      {
        title: "أصول علم الرجال", author: "العلامة عبدالهادي الفضلي",
        about: "من الكتب المقترحة للعرض مع «دروس موجزة في علمي الرجال والدراية».",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=3217" }
        ]
      },
      {
        title: "اختيار معرفة الرجال المعروف رجال الكسار (3 أجزاء)", author: "شيخ الطائفة أبي جعفر محمد بن الحسن الطوسي",
        about: "من الكتب المقترحة للعرض مع «دروس تمهيدية في القواعد الرجالية».",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=4960" }
        ]
      },
      {
        title: "رجال الطوسي", author: "شيخ الطائفة محمد بن الحسن الطوسي",
        about: "من الكتب المقترحة للعرض مع «دروس تمهيدية في القواعد الرجالية».",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=3391" }
        ]
      },
      {
        title: "الفهرست", author: "شيخ الطائفة محمد بن الحسن الطوسي",
        about: "من الكتب المقترحة للعرض مع «دروس تمهيدية في القواعد الرجالية».",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=5140" }
        ]
      },
      {
        title: "أطيب المقال في بيان كليات علم الرجال", author: "الشيخ حسن فوزي فواز",
        about: "من الكتب المقترحة للعرض مع «كليات في علم الرجال».",
        sources: [
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=4492" }
        ]
      },
      {
        title: "بحوث في علم الرجال", author: "الشيخ محمد آصف المحسني",
        about: "من الكتب المقترحة للعرض مع «كليات في علم الرجال».",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "http://shiabooks.net/library.php?id=9273" }
        ]
      },
      {
        title: "مبادىء الفلسفة الإسلامية 2 جزء عبدالجبار الرفاعي", author: "",
        about: "من الكتب المقترحة للعرض مع «أصول الفلسفة والمنهج الواقعي».",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=1460" }
        ]
      },
      {
        title: "نظرية المعرفة، علي ضوء كتاب فلسفتنا", author: "الشيخ حسن الراضي",
        about: "من الكتب المقترحة للعرض مع «فلسفتنا».",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=1649" }
        ]
      },
      {
        title: "قراءات نقدية جادة، حول كتاب فلسفتنا", author: "السيد عمار أبو رغيف",
        about: "من الكتب المقترحة للعرض مع «فلسفتنا».",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=1832" }
        ]
      },
      {
        title: "من وحي فلسفتنا", author: "كاظم الحلفي",
        about: "من الكتب المقترحة للعرض مع «فلسفتنا».",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "http://shiabooks.net/library.php?id=11023" }
        ]
      },
      {
        title: "ماذا جاء حول كتاب فلسفتنا ل الشهيد الصدر", author: "حيدر آل حيدر",
        about: "من الكتب المقترحة للعرض مع «فلسفتنا».",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "http://www.shiabooks.net/library.php?id=11611" }
        ]
      },
      {
        title: "تاريخ الفلسفة الغربية 3 جزء برتراند راسل", author: "",
        about: "من الكتب المقترحة للعرض مع «فلسفتنا».",
        sources: [
          { site: "أرشيف الإنترنت", url: "https://archive.org/compress/falsfa2/formats=TEXT%20PDF,IMAGE%20CONTAINER%20PDF&file=/falsfa2.zip" }
        ]
      },
      {
        title: "تاريخ فلاسفة الإسلام في المشرق والمغرب", author: "محمد لطفي جمعة",
        about: "من الكتب المقترحة للعرض مع «فلسفتنا».",
        sources: [
          { site: "أرشيف الإنترنت", url: "https://archive.org/download/kaoikaprophe_20180120_2102/AC109%20%D8%A7%D9%84%D9%85%D8%B1%D9%83%D8%B2%20%D8%A7%D9%84%D8%B9%D8%B1%D8%A8%D9%8A%20-%20%D9%85%D8%AD%D9%85%D8%AF%20%D9%84%D8%B7%D9%81%D9%8A%20%D8%AC%D9%85%D8%B9%D8%A9%20-%20%D8%AA%D8%A7%D8%B1%D9%8A%D8%AE%20%D9%81%D9%84%D8%A7%D8%B3%D9%81%D8%A9%20%D8%A7%D9%84%D8%A7%D8%B3%D9%84%D8%A7%D9%85%20%D9%81%D9%8A%20%D8%A7%D9%84%D9%85%D8%B4%D8%B1%D9%82%20%D9%88%D8%A7%D9%84%D9%85%D8%BA%D8%B1%D8%A8.pdf" }
        ]
      },
      {
        title: "نشأة الفكر الفلسفي في الإسلام 3 جزء", author: "د. علي سامي النشار",
        about: "من الكتب المقترحة للعرض مع «فلسفتنا».",
        sources: [
          { site: "أرشيف الإنترنت", url: "https://archive.org/compress/nshah-alfkr-alflsfy1/formats=IMAGE%20CONTAINER%20PDF&file=/nshah-alfkr-alflsfy1.zip" }
        ]
      }
    ],
    "متون": [
      {
        title: "الآجرومية", author: "ابن آجروم",
        about: "أول متن يحفظه الطالب في النحو.",
        pages: ["باب الكلام: الكلام هو اللفظ المركب المفيد بالوضع، وأقسامه ثلاثة: اسم، وفعل، وحرف جاء لمعنى.","فالاسم يُعرف بالخفض والتنوين ودخول الألف واللام وحروف الخفض، وهي: مِن، وإلى، وعن، وعلى، وفي، ورُبَّ، والباء، والكاف، واللام، وحروف القسم، وهي: الواو والباء والتاء.","والفعل يُعرف بقد، والسين، وسوف، وتاء التأنيث الساكنة. والحرف ما لا يصلح معه دليل الاسم ولا دليل الفعل."],
        sources: [
          { site: "أرشيف الإنترنت", url: "https://ia800202.us.archive.org/29/items/waqmamme/mamme.pdf" },
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=1625" }
        ]
      },
      {
        title: "ألفية ابن مالك", author: "ابن مالك",
        about: "منظومة النحو والصرف في نحو ألف بيت.",
        sources: [
          { site: "أرشيف الإنترنت", url: "http://www.archive.org/download/waq37284/37284.pdf" }
        ]
      },
      {
        title: "شرائع الإسلام", author: "المحقق الحلي",
        about: "متن فقهي جامع، عليه أشهر الشروح.",
        sources: [
          { site: "شبكة السراج", url: "http://www.alseraj.net/maktaba/kotob/feqh/shareealislam1/html/ara/books/sharaea/fehrest-3.html" },
          { site: "شبكة السراج · ج2", url: "http://www.alseraj.net/maktaba/kotob/feqh/shareealislam2/html/ara/books/sharaea/fehrest-1.html" },
          { site: "مدرسة الفقاهة", url: "https://ar.lib.eshia.ir/10099/1/1" },
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=2344" }
        ]
      },
      {
        title: "اللمعة الدمشقية", author: "الشهيد الأول",
        about: "متن فقهي مختصر، يُدرس بشرح الروضة البهية.",
        sources: [
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=4422" },
          { site: "مدرسة الفقاهة", url: "https://ar.lib.eshia.ir/10034/1/1" }
        ]
      },
      {
        title: "العروة الوثقى", author: "السيد محمد كاظم اليزدي",
        about: "الرسالة الفقهية التي يعلّق عليها الفقهاء.",
        sources: [
          { site: "مدرسة الفقاهة", url: "https://ar.lib.eshia.ir/10027/1/1" }
        ]
      },
      {
        title: "كفاية الأصول", author: "الآخوند الخراساني",
        about: "آخر كتب السطوح في الأصول ومدار بحث الخارج.",
        sources: [
          { site: "مدرسة الفقاهة", url: "https://ar.lib.eshia.ir/27004/1/1" },
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=5321" }
        ]
      },
      {
        title: "الباب الحادي عشر", author: "العلامة الحلي",
        about: "مختصر في أصول الدين.",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=1725" },
          { site: "مدرسة الفقاهة", url: "https://ar.lib.eshia.ir/12178/1/1" }
        ]
      },
      {
        title: "الرسالة العملية", author: "",
        about: "الفقه · المقدمات",
        sources: [
          { site: "شبكة السراج", url: "http://almaareftv.com/alseraj/archives/177" }
        ]
      },
      {
        title: "تبصرة المتعلمين في أحكام الدين", author: "العلامة الحلي",
        about: "الفقه · المقدمات",
        sources: [
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=3783" }
        ]
      },
      {
        title: "المختصر النافع في فقه الإمامية", author: "المحقق الحلي",
        about: "الفقه · المقدمات",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "http://www.shiabooks.net/library.php?id=10178" }
        ]
      },
      {
        title: "دروس تمهيدية في الفقه الاستدلالي", author: "الشيخ محمد باقر الإيرواني",
        about: "الفقه · السطوح الوسطى",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=2824" }
        ]
      },
      {
        title: "المكاسب", author: "الشيخ مرتضى الأنصاري",
        about: "الفقه · السطوح العليا",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=4322" },
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=4792" }
        ]
      },
      {
        title: "مبادئ أصول الفقه", author: "العلامة عبدالهادي الفضلي",
        about: "الأصول · المقدمات",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=1641" },
          { site: "شبكة الفكر · نسخة مؤسسة النشر الإسلامي", url: "http://alfeker.net/library.php?id=3194" },
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=3202" }
        ]
      },
      {
        title: "الموجز في أصول الفقه", author: "الشيخ جعفر السبحاني",
        about: "الأصول · المقدمات",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=2184" }
        ]
      },
      {
        title: "معالم الأصول (معالم الدين وملاذ المجتهدين)", author: "الشيخ حسن بن زين الدين العاملي",
        about: "الأصول · المقدمات",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=3266" },
          { site: "mediafire.com · ج1", url: "http://www.mediafire.com/download/1yqyv88416k2tla/%D9%85%D8%B9%D8%A7%D9%84%D9%85+%D8%A7%D9%84%D8%AF%DB%8C%D9%86+%D9%88+%D9%85%D9%84%D8%A7%D8%B0+%D8%A7%D9%84%D9%85%D8%AC%D8%AA%D9%87%D8%AF%DB%8C%D9%86+%28%D9%82%D8%B3%D9%85+%D8%A7%D9%84%D9%81%D9%82%D9%87%29+-+%D8%A7%D9%84%D8%B4%D9%8A%D8%AE+%D8%AD%D8%B3%D9%86+%D8%A8%D9%86+%D8%B2%D9%8A%D9%86+%D8%A7%D9%84%D8%AF%D9%8A%D9%86+%D8%A7%D9%84%D8%B9%D8%A7%D9%85%D9%84%D9%8A+1.pdf" },
          { site: "mediafire.com · ج2", url: "http://www.mediafire.com/download/ln9oblm4kzbtv2m/%D9%85%D8%B9%D8%A7%D9%84%D9%85+%D8%A7%D9%84%D8%AF%DB%8C%D9%86+%D9%88+%D9%85%D9%84%D8%A7%D8%B0+%D8%A7%D9%84%D9%85%D8%AC%D8%AA%D9%87%D8%AF%DB%8C%D9%86+%28%D9%82%D8%B3%D9%85+%D8%A7%D9%84%D9%81%D9%82%D9%87%29+-+%D8%A7%D9%84%D8%B4%D9%8A%D8%AE+%D8%AD%D8%B3%D9%86+%D8%A8%D9%86+%D8%B2%D9%8A%D9%86+%D8%A7%D9%84%D8%AF%D9%8A%D9%86+%D8%A7%D9%84%D8%B9%D8%A7%D9%85%D9%84%D9%8A+2.pdf" }
        ]
      },
      {
        title: "أصول الاستنباط", author: "السيد علي نقي الحيدري",
        about: "الأصول · المقدمات",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=3809" }
        ]
      },
      {
        title: "دروس في علم الأصول (الحلقات الثلاث)", author: "السيد الشهيد محمد باقر الصدر",
        about: "الأصول · السطوح الوسطى · مقدمات وسطوح",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=4806" }
        ]
      },
      {
        title: "القوانين المحكمة في الأصول", author: "الميرزا أبو القاسم القمي",
        about: "الأصول · السطوح الوسطى",
        sources: [
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=3957" },
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=3957" }
        ]
      },
      {
        title: "فرائد الأصول (الرسائل)", author: "الشيخ مرتضى الأنصاري",
        about: "الأصول · السطوح العليا",
        sources: [
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=4529" },
          { site: "مكتبة شيعة بوكس · نسخة أخرى", url: "http://shiabooks.net/library.php?id=9018" }
        ]
      },
      {
        title: "قطر الندى وبل الصدى", author: "ابن هشام الأنصاري",
        about: "النحو · المقدمات",
        sources: [
          { site: "أرشيف الإنترنت", url: "https://archive.org/download/WAQ40733/40733.pdf" }
        ]
      },
      {
        title: "مغني اللبيب عن كتب الأعاريب", author: "ابن هشام الأنصاري",
        about: "النحو · المقدمات",
        sources: [
          { site: "أرشيف الإنترنت", url: "https://archive.org/download/FP129509/129509.pdf" }
        ]
      },
      {
        title: "شرح ابن عقيل، ومعه منحة الجليل", author: "بهاء الدين عبد الله بن عقيل",
        about: "النحو · السطوح الوسطى",
        sources: [
          { site: "waqfeya.com", url: "https://waqfeya.com/book.php?bid=3511" }
        ]
      },
      {
        title: "شرح الكافية الشافية", author: "ابن مالك الأندلسي",
        about: "النحو · السطوح الوسطى",
        sources: [
          { site: "أرشيف الإنترنت", url: "https://ia800403.us.archive.org/12/items/ShafyaKafyaIbnMalik/12-IbnMalikKafiya.pdf" }
        ]
      },
      {
        title: "علم التصريف", author: "عبد الوهاب الزنجاني",
        about: "الصرف · المقدمات",
        sources: [
          { site: "أرشيف الإنترنت", url: "https://archive.org/download/20191020_20191020_1305/%D8%B9%D9%84%D9%85%20%D8%A7%D9%84%D8%AA%D8%B5%D8%B1%D9%8A%D9%81%20%D8%A7%D9%84%D9%85%D8%AC%D9%85%D8%B9%20%D8%A7%D9%84%D8%B9%D9%84%D9%85%D9%8A.pdf" }
        ]
      },
      {
        title: "شذا العرف في فن الصرف", author: "أحمد بن محمد الحملاوي",
        about: "الصرف · المقدمات",
        sources: [
          { site: "أرشيف الإنترنت", url: "http://www.archive.org/download/waq0161/0161.pdf" }
        ]
      },
      {
        title: "شرح النظام على شافية ابن الحاجب", author: "نظام الدين النيسابوري",
        about: "الصرف · السطوح الوسطى",
        sources: [
          { site: "مدرسة الفقاهة", url: "http://ar.lib.eshia.ir/72021/1/2" }
        ]
      },
      {
        title: "جواهر البلاغة", author: "أحمد الهاشمي",
        about: "البلاغة · المقدمات",
        sources: [
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=4150" }
        ]
      },
      {
        title: "البلاغة الواضحة ودليلها", author: "علي الجارم ومصطفى أمين",
        about: "البلاغة · المقدمات",
        sources: [
          { site: "أرشيف الإنترنت", url: "https://archive.org/download/WAQblwa/blwa.pdf" },
          { site: "أرشيف الإنترنت", url: "https://archive.org/download/WAQblwa/dablwa.pdf" }
        ]
      },
      {
        title: "مختصر المعاني", author: "سعد الدين التفتازاني",
        about: "البلاغة · السطوح الوسطى",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "http://shiabooks.net/library.php?id=9590" }
        ]
      },
      {
        title: "المطول في شرح تلخيص المفتاح", author: "سعد الدين التفتازاني",
        about: "البلاغة · السطوح الوسطى",
        sources: [
          { site: "أرشيف الإنترنت", url: "https://archive.org/download/Mutawal/Mutawal.pdf" }
        ]
      },
      {
        title: "خلاصة المنطق", author: "العلامة عبدالهادي الفضلي",
        about: "المنطق · المقدمات",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=1501" },
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=3243" }
        ]
      },
      {
        title: "حاشية ملا عبد الله على التهذيب", author: "ملا عبد الله اليزدي",
        about: "المنطق · المقدمات",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "http://shiabooks.net/library.php?id=10396" }
        ]
      },
      {
        title: "القواعد الجلية في شرح الرسالة الشمسية", author: "العلامة الحلي",
        about: "المنطق · السطوح الوسطى",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "https://shiabooks.net/library.php?id=9295" }
        ]
      },
      {
        title: "لوامع الأسرار في شرح مطالع الأنوار", author: "قطب الدين الرازي",
        about: "المنطق · السطوح الوسطى",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "http://shiabooks.net/library.php?id=9006" }
        ]
      },
      {
        title: "شرح المنظومة (قسم المنطق)", author: "الحكيم السبزواري، بشرح الشيخ محمد علي گرامي",
        about: "المنطق · السطوح الوسطى",
        sources: [
          { site: "موقع مكتبة", url: "http://mktba.net/library.php?id=8282" }
        ]
      },
      {
        title: "آداب المتعلمين", author: "الخواجة نصير الدين الطوسي",
        about: "الأخلاق · المقدمات",
        sources: [
          { site: "مدرسة الفقاهة", url: "http://ar.lib.eshia.ir/15001/1/62" }
        ]
      },
      {
        title: "منية المريد في أدب المفيد والمستفيد", author: "الشهيد الثاني",
        about: "الأخلاق · المقدمات",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=2124" }
        ]
      },
      {
        title: "جامع السعادات", author: "المولى محمد مهدي النراقي",
        about: "الأخلاق · المقدمات",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=1329" }
        ]
      },
      {
        title: "عقائد الإمامية", author: "الشيخ محمد رضا المظفر",
        about: "العقائد والكلام · المقدمات",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=1041" }
        ]
      },
      {
        title: "بداية المعرفة", author: "الشيخ حسن مكي العاملي",
        about: "العقائد والكلام · المقدمات",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=3903" }
        ]
      },
      {
        title: "تلخيص محاضرات في الإلهيات", author: "الشيخ جعفر السبحاني",
        about: "العقائد والكلام · المقدمات",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=3156" }
        ]
      },
      {
        title: "كشف المراد في شرح تجريد الاعتقاد", author: "العلامة الحلي",
        about: "العقائد والكلام · السطوح الوسطى",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=2289" }
        ]
      },
      {
        title: "البداية في علم الدراية", author: "الشهيد الثاني",
        about: "الحديث والدراية · المقدمات",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "http://www.shiabooks.net/library.php?id=10219" }
        ]
      },
      {
        title: "أصول الحديث", author: "العلامة عبدالهادي الفضلي",
        about: "الحديث والدراية · المقدمات",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=1672" },
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=3216" }
        ]
      },
      {
        title: "دروس موجزة في علمي الرجال والدراية", author: "الشيخ جعفر السبحاني",
        about: "الرجال · المقدمات",
        sources: [
          { site: "مدرسة الفقاهة", url: "http://lib.eshia.ir/27179/1/1" }
        ]
      },
      {
        title: "دروس تمهيدية في القواعد الرجالية", author: "الشيخ محمد باقر الإيرواني",
        about: "الرجال · المقدمات",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=1899" }
        ]
      },
      {
        title: "كليات في علم الرجال", author: "الشيخ جعفر السبحاني",
        about: "الرجال · المقدمات",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=2044" }
        ]
      },
      {
        title: "أصول الفلسفة والمنهج الواقعي", author: "السيد محمد حسين الطباطبائي",
        about: "الفلسفة · المقدمات",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=2570" }
        ]
      },
      {
        title: "المنهج الجديد في تعليم الفلسفة", author: "الشيخ محمد تقي مصباح اليزدي",
        about: "الفلسفة · المقدمات",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=2633" }
        ]
      },
      {
        title: "فلسفتنا", author: "السيد الشهيد محمد باقر الصدر",
        about: "الفلسفة · السطوح الوسطى",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=1446" }
        ]
      },
      {
        title: "بداية الحكمة", author: "السيد محمد حسين الطباطبائي",
        about: "الفلسفة · السطوح الوسطى",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=1848" }
        ]
      },
      {
        title: "نهاية الحكمة", author: "السيد محمد حسين الطباطبائي",
        about: "الفلسفة · السطوح الوسطى",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=2599" }
        ]
      }
    ],
    "شروح": [
      {
        title: "شرح ابن عقيل", author: "ابن عقيل", on: "ألفية ابن مالك",
        sources: [
          { site: "مدرسة الفقاهة", url: "https://ar.lib.eshia.ir/72018/1/1" },
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=2276" }
        ]
      },
      {
        title: "البهجة المرضية في شرح الألفية ج1ج.2", author: "جلال الدين السيوطي", on: "ألفية ابن مالك",
        sources: [
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=3932" }
        ]
      },
      {
        title: "شرح الأشموني علي ألفية مالك المسم منهج السالك إلى ألفية ابن مالك", author: "", on: "ألفية ابن مالك",
        sources: [
          { site: "أرشيف الإنترنت", url: "http://www.archive.org/download/waq104752/104752.pdf" }
        ]
      },
      {
        title: "حاشية الصبان علي شرح الأشموني علي", author: "", on: "ألفية ابن مالك",
        sources: [
          { site: "أرشيف الإنترنت", url: "https://archive.org/download/IbnMalikHasyatSaban/08-IbnMalikHasyatSaban.pdf" }
        ]
      },
      {
        title: "ألفية ابن مالك الأشموني [حاشية الصبان شرح الأشموني علي الألفية ومعه شواهد العين 4 أجزاء ]", author: "", on: "ألفية ابن مالك",
        sources: [
          { site: "أرشيف الإنترنت", url: "https://archive.org/compress/ashmounyHashiyaAlfiyyah/formats=IMAGE%20CONTAINER%20PDF&file=/ashmounyHashiyaAlfiyyah.zip" }
        ]
      },
      {
        title: "شرح المكودي علي الألفية في علمي الصرف والنحو", author: "عبد الرحمن بن علي بن صالح المكودي", on: "ألفية ابن مالك",
        sources: [
          { site: "أرشيف الإنترنت", url: "https://archive.org/download/shmkalshmkal/shmkal.pdf" }
        ]
      },
      {
        title: "المقاصد النحوية في شرح شواهد شروح الألفية المشهور بشرح الشواهد الكبير", author: "محمود بن أحمد بن موس العين بدر الدين", on: "ألفية ابن مالك",
        sources: [
          { site: "أرشيف الإنترنت", url: "https://archive.org/download/FP127301/127301.pdf" }
        ]
      },
      {
        title: "توضيح المقاصد والمسالك بشرح ألفية ابن مالك", author: "ابن أم قاسم المرادي", on: "ألفية ابن مالك",
        sources: [
          { site: "أرشيف الإنترنت", url: "http://www.archive.org/download/tmmsaim/tmmsaim.pdf" }
        ]
      },
      {
        title: "الروضة البهية", author: "الشهيد الثاني", on: "اللمعة الدمشقية وشرحها الروضة البهية",
        sources: [
          { site: "مدرسة الفقاهة", url: "https://ar.lib.eshia.ir/10102/1/1" },
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=4477" },
          { site: "مكتبة أهل البيت", url: "https://ablibrary.net/book_content/b/5215/1" }
        ]
      },
      {
        title: "الروضة البهية في شرح اللمعة الدمشقية – 3 مجلدات", author: "الشهيد الثاني مع حاشية سلطان العلماء", on: "اللمعة الدمشقية وشرحها الروضة البهية",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "http://www.shiabooks.net/library.php?id=8931" }
        ]
      },
      {
        title: "الروضة البهيّة في شرح اللمعة الدمشقية – 10 مجلدات", author: "دار التعارف", on: "اللمعة الدمشقية وشرحها الروضة البهية",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "http://www.shiabooks.net/library.php?id=10465" }
        ]
      },
      {
        title: "الجواهر الفخرية في شرح الروضة البهية 16 مجلد", author: "وجداني فخر", on: "اللمعة الدمشقية وشرحها الروضة البهية",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "http://www.shiabooks.net/library.php?id=10736" }
        ]
      },
      {
        title: "الجواهر الفقهية في شرح الروضة البهية 20 جزء", author: "السيد عبدالله فضل الله فحص الحسين", on: "اللمعة الدمشقية وشرحها الروضة البهية",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=3888" }
        ]
      },
      {
        title: "النجعة في شرح اللمعة – 11مجلد", author: "الشيخ محمد تقي التستري", on: "اللمعة الدمشقية وشرحها الروضة البهية",
        sources: [
          { site: "مكتبة المنتظر", url: "http://almontdr.blogspot.com/2015/06/blog-post_95.html" }
        ]
      },
      {
        title: "مسالك الأفهام", author: "الشهيد الثاني", on: "شرائع الإسلام في مسائل الحلال والحرام",
        sources: [
          { site: "مدرسة الفقاهة", url: "https://ar.lib.eshia.ir/10151/1/1" }
        ]
      },
      {
        title: "جواهر الكلام", author: "الشيخ محمد حسن النجفي", on: "شرائع الإسلام في مسائل الحلال والحرام",
        sources: [
          { site: "مدرسة الفقاهة", url: "https://ar.lib.eshia.ir/10088/1/1" }
        ]
      },
      {
        title: "شرائع الإسلام، في مسائل الحلال والحرام – 4 أجزاء", author: "السيد صادق الشيرازي", on: "شرائع الإسلام في مسائل الحلال والحرام",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=2344" }
        ]
      },
      {
        title: "التنقيح الرائع لمختصر الشرائع (4 أجزاء)", author: "جمال الدين مقداد بن عبد الله السيوري الحلي", on: "شرائع الإسلام في مسائل الحلال والحرام",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "http://www.shiabooks.net/library.php?id=9160" }
        ]
      },
      {
        title: "مدارك الأحكام في شرح شرائع الإسلام 9 أجزاء", author: "السيد محمد بن علي الموسوي العاملي", on: "شرائع الإسلام في مسائل الحلال والحرام",
        sources: [
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=4197" }
        ]
      },
      {
        title: "مسالك الأفهام في تنقيح شرائع الإسلام 16 جزء", author: "الشهيد الثاني الشيخ زين الدين العاملي", on: "شرائع الإسلام في مسائل الحلال والحرام",
        sources: [
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=4518" }
        ]
      },
      {
        title: "الدر الباهر في مقتنيات الجواهر مختصر جواهر الكلام في شرح شرائع الإسلام", author: "جمال الدين دين پرور", on: "شرائع الإسلام في مسائل الحلال والحرام",
        sources: [
          { site: "أرشيف الإنترنت", url: "https://ia803003.us.archive.org/9/items/ktp2019-bgh7064/ktp2019-bgh7064.pdf" }
        ]
      },
      {
        title: "منهل الغمام في شرح شرائع الإسلام 3 أجزاء", author: "الشيخ عباس بن حسن كاشف الغطاء", on: "شرائع الإسلام في مسائل الحلال والحرام",
        sources: [
          { site: "مكتبة المساحة", url: "https://www.masaha.org/group_books/1928-%D9%85%D9%86%D9%87%D9%84-%D8%A7%D9%84%D8%BA%D9%85%D8%A7%D9%85-%D9%81%D9%8A-%D8%B4%D8%B1%D8%AD-%D8%B4%D8%B1%D8%A7%D8%A6%D8%B9-%D8%A7%D9%84%D8%A5%D8%B3%D9%84%D8%A7%D9%85" }
        ]
      },
      {
        title: "مورد الأنام في شرح شرائع الإسلام (4 أجزاء)", author: "الشيخ مهدي كاشف الغطاء", on: "شرائع الإسلام في مسائل الحلال والحرام",
        sources: [
          { site: "مكتبة المساحة", url: "https://www.masaha.org/group_books/750-%D9%85%D9%88%D8%B1%D8%AF-%D8%A7%D9%84%D8%A3%D9%86%D8%A7%D9%85-%D9%81%D9%8A-%D8%B4%D8%B1%D8%AD-%D8%B4%D8%B1%D8%A7%D8%A6%D8%B9-%D8%A7%D9%84%D8%A5%D8%B3%D9%84%D8%A7%D9%85" }
        ]
      },
      {
        title: "غاية المرام في شرح شرائع الإسلام –4 أجزاء", author: "المفلح بن حسن الصيمري", on: "شرائع الإسلام في مسائل الحلال والحرام",
        sources: [
          { site: "موقع مكتبة", url: "http://mktba.net/library.php?id=11396" }
        ]
      },
      {
        title: "إيضاح ترددات الشرائع", author: "للفقيه نجم الدين جعفر بن الزهدري الحلي", on: "شرائع الإسلام في مسائل الحلال والحرام",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=3438" }
        ]
      },
      {
        title: "مستمسك العروة الوثقى", author: "السيد محسن الحكيم", on: "العروة الوثقى",
        sources: [
          { site: "مدرسة الفقاهة", url: "https://ar.lib.eshia.ir/10152/1/1" }
        ]
      },
      {
        title: "حقائق الأصول", author: "السيد محسن الحكيم", on: "كفاية الأصول",
        sources: [
          { site: "مدرسة الفقاهة", url: "https://ar.lib.eshia.ir/13029/1/1" }
        ]
      },
      {
        title: "منتهى الدراية في توضيح الكفاية – 10 أجزاء", author: "السيد محمد جعفر الجزائري المروج", on: "كفاية الأصول",
        sources: [
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=4004" }
        ]
      },
      {
        title: "دروس في الكفاية – سبعة أجزاء", author: "الشيخ غلام علي المحمدي البامياني", on: "كفاية الأصول",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=3083" }
        ]
      },
      {
        title: "نهاية الدراية في شرح الكفاية – 6 أجزاء", author: "الشيخ محمد حسين الأصفهاني", on: "كفاية الأصول",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=3140" }
        ]
      },
      {
        title: "البداية في توضيح الكفاية – 5 مجلدات", author: "علي العارفي الپىس", on: "كفاية الأصول",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "http://www.shiabooks.net/library.php?id=9500" }
        ]
      },
      {
        title: "الهداية في أسرار الكفاية – مجلدين", author: "الشيخ مصطفى الاعتمادي", on: "كفاية الأصول",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "http://shiabooks.net/library.php?id=9596" }
        ]
      },
      {
        title: "عناية الأصول في شرح كفاية الأصول 6 مجلدات", author: "السيد مرتضى الحسين الفيروزآبادي", on: "كفاية الأصول",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "http://shiabooks.net/library.php?id=8167" }
        ]
      },
      {
        title: "كفاية الأصول مع حواشي المحقق المشكين (5 أجزاء)", author: "", on: "كفاية الأصول",
        sources: [
          { site: "مكتبة المنتظر", url: "http://almontdr.blogspot.com/2015/04/blog-post_4.html" }
        ]
      },
      {
        title: "الحاشية علي كفاية الأصول – 7 مجلدات", author: "الشيخ محمد سلطان العلماء الأراكي", on: "كفاية الأصول",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "https://shiabooks.net/library.php?id=11697" },
          { site: "شبكة الفكر · نسخة اخرى", url: "http://alfeker.net/library.php?id=5105" }
        ]
      },
      {
        title: "هداية الأصول في شرح كفاية الأصول", author: "إفادات الشيخ صدرا", on: "كفاية الأصول",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "http://www.shiabooks.net/library.php?id=10557" },
          { site: "مكتبة المساحة · نسخة أخرى", url: "http://www.masaha.org/group_books/1743-%D9%87%D8%AF%D8%A7%D9%8A%D8%A9-%D8%A7%D9%84%D8%A3%D8%B5%D9%88%D9%84-%D9%81%D9%8A-%D8%B4%D8%B1%D8%AD-%D9%83%D9%81%D8%A7%D9%8A%D8%A9-%D8%A7%D9%84%D8%A3%D8%B5%D9%88%D9%84" }
        ]
      },
      {
        title: "بداية الوصول في شرح كفاية الأصول 9 أجزاء", author: "الشيخ محمد طاهر آل شيخ راض", on: "كفاية الأصول",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=4816" }
        ]
      },
      {
        title: "كفاية الأصول، دروس في مسائل علم الأصول – 6 أجزاء", author: "الميرزا جواد التبريزي", on: "كفاية الأصول",
        sources: [
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=4853" }
        ]
      },
      {
        title: "الوصول إلى كفاية الأصول 5 أجزاء السيد محمد الحسيني الشيرازي", author: "", on: "كفاية الأصول",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=5099" }
        ]
      },
      {
        title: "منتهى الوصول إلى غوامض كفاية الأصول", author: "إفادات السيد أبو الحسن الأصفهاني", on: "كفاية الأصول",
        sources: [
          { site: "موقع مكتبة", url: "http://mktba.net/library.php?id=11625" }
        ]
      },
      {
        title: "نهاية المأمول في شرح كفاية الأصول 3 مجلدات", author: "الشيخ محمد علي الاجتهادي", on: "كفاية الأصول",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "https://shiabooks.net/library.php?id=10282" },
          { site: "موقع مكتبة · نسخة أخرى", url: "https://mktba.net/library.php?id=10282" }
        ]
      },
      {
        title: "نهاية الوصول إلى كفاية الأصول السيد مصطفى الموسوي الحائري", author: "", on: "كفاية الأصول",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/book/4797-%D9%86%D9%87%D8%A7%D9%8A%D8%A9-%D8%A7%D9%84%D9%88%D8%B5%D9%88%D9%84-%D8%A5%D9%84%D9%89-%D9%83%D9%81%D8%A7%D9%8A%D8%A9-%D8%A7%D9%84%D8%A3%D8%B5%D9%88%D9%84" }
        ]
      },
      {
        title: "شرح كفاية الأصول 3- أجزاء", author: "علي محمدي خراساني", on: "كفاية الأصول",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=4794" }
        ]
      },
      {
        title: "هداية العقول في شرح كفاية الأصول 6 أجزاء", author: "السيد محمد علي الموسوي الحمامي", on: "كفاية الأصول",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "http://www.shiabooks.net/library.php?id=10975" }
        ]
      },
      {
        title: "نهاية النهاية في شرح الكفاية", author: "2 جزء الشيخ علي الإيرواني", on: "كفاية الأصول",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/group_books/1769-%D9%86%D9%87%D8%A7%D9%8A%D8%A9-%D8%A7%D9%84%D9%86%D9%87%D8%A7%D9%8A%D8%A9-%D9%81%D9%8A-%D8%B4%D8%B1%D8%AD-%D8%A7%D9%84%D9%83%D9%81%D8%A7%D9%8A%D8%A9" }
        ]
      },
      {
        title: "منتهى العناية في شرح الكفاية", author: "السيد محمد الحسين الفيروزآبادي", on: "كفاية الأصول",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/book/4593-%D9%85%D9%86%D8%AA%D9%87%D9%89-%D8%A7%D9%84%D8%B9%D9%86%D8%A7%D9%8A%D8%A9-%D9%81%D9%8A-%D8%B4%D8%B1%D8%AD-%D8%A7%D9%84%D9%83%D9%81%D8%A7%D9%8A%D8%A9" }
        ]
      },
      {
        title: "كفاية الأصول", author: "مع حواشي المحقق الميرزا أبو الحسن المشكين", on: "كفاية الأصول",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "https://shiabooks.net/library.php?id=11763" },
          { site: "مكتبة المساحة · نسخة أخرى", url: "http://www.masaha.org/group_books/1525-%D9%83%D9%81%D8%A7%D9%8A%D8%A9-%D8%A7%D9%84%D8%A3%D8%B5%D9%88%D9%84-%D9%85%D8%B9-%D8%AA%D8%B9%D9%84%D9%8A%D9%82%D8%A9-%D8%A7%D9%84%D8%B2%D8%A7%D8%B1%D8%B9%D9%8A-%D8%A7%D9%84%D8%B3%D8%A8%D8%B2%D9%88%D8%A7%D8%B1%D9%8A" }
        ]
      },
      {
        title: "غاية الأصول في شرح كفاية الأصول الشيخ علي آغا مير الدزفولي", author: "", on: "كفاية الأصول",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/book/4018-%D8%BA%D8%A7%D9%8A%D8%A9-%D8%A7%D9%84%D8%A3%D8%B5%D9%88%D9%84-%D9%81%D9%8A-%D8%B4%D8%B1%D8%AD-%D9%83%D9%81%D8%A7%D9%8A%D8%A9-%D8%A7%D9%84%D8%A3%D8%B5%D9%88%D9%84" }
        ]
      },
      {
        title: "طريق الوصول إلى تحقيق الأصول (4 أجزاء)", author: "الشيخ محمد الكرمي", on: "كفاية الأصول",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/group_books/1437-%D8%B7%D8%B1%D9%8A%D9%82-%D8%A7%D9%84%D9%88%D8%B5%D9%88%D9%84-%D8%A5%D9%84%D9%89-%D8%AA%D8%AD%D9%82%D9%8A%D9%82-%D8%A7%D9%84%D8%A3%D8%B5%D9%88%D9%84" }
        ]
      },
      {
        title: "شرح كفاية الأصول", author: "الشيخ عبد الحسين الرشتي", on: "كفاية الأصول",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/book/3994-%D8%B4%D8%B1%D8%AD-%D9%83%D9%81%D8%A7%D9%8A%D8%A9-%D8%A7%D9%84%D8%A3%D8%B5%D9%88%D9%84" }
        ]
      },
      {
        title: "حاشية علي كفاية الأصول", author: "3 جزء السيد محمد حسين الطباطبائي", on: "كفاية الأصول",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/group_books/1350-%D8%AD%D8%A7%D8%B4%D9%8A%D8%A9-%D8%B9%D9%84%D9%89-%D9%83%D9%81%D8%A7%D9%8A%D8%A9-%D8%A7%D9%84%D8%A3%D8%B5%D9%88%D9%84" }
        ]
      },
      {
        title: "الهداية في شرح الكفاية", author: "الشيخ عبد الحسين التستري الكاظميني", on: "كفاية الأصول",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/book/3594-%D8%A7%D9%84%D9%87%D8%AF%D8%A7%D9%8A%D8%A9-%D9%81%D9%8A-%D8%B4%D8%B1%D8%AD-%D8%A7%D9%84%D9%83%D9%81%D8%A7%D9%8A%D8%A9" }
        ]
      },
      {
        title: "الهداية إلى غوامض الكفاية 3- أجزاء محمد حسين الميرسجادي", author: "", on: "كفاية الأصول",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/group_books/1336-%D8%A7%D9%84%D9%87%D8%AF%D8%A7%D9%8A%D8%A9-%D8%A5%D9%84%D9%89-%D8%BA%D9%88%D8%A7%D9%85%D8%B6-%D8%A7%D9%84%D9%83%D9%81%D8%A7%D9%8A%D8%A9" }
        ]
      },
      {
        title: "الحاشية علي كفاية الأصول", author: "2 جزء السيد حسين البروجردي", on: "كفاية الأصول",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/group_books/1249-%D8%A7%D9%84%D8%AD%D8%A7%D8%B4%D9%8A%D8%A9-%D8%B9%D9%84%D9%89-%D9%83%D9%81%D8%A7%D9%8A%D8%A9-%D8%A7%D9%84%D8%A3%D8%B5%D9%88%D9%84" }
        ]
      },
      {
        title: "تعليقة القوچاني علي كفاية الأصول (2 جزء)", author: "الشيخ علي القوچاني", on: "كفاية الأصول",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/group_books/1221-%D8%AA%D8%B9%D9%84%D9%8A%D9%82%D8%A9-%D8%A7%D9%84%D9%82%D9%88%DA%86%D8%A7%D9%86%D9%8A-%D8%B9%D9%84%D9%89-%D9%83%D9%81%D8%A7%D9%8A%D8%A9-%D8%A7%D9%84%D8%A3%D8%B5%D9%88%D9%84" }
        ]
      },
      {
        title: "أنوار الهداية في التعليقة علي الكفاية 2 جزء", author: "السيد روح الله الموسوي الخميني", on: "كفاية الأصول",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/group_books/1184-%D8%A3%D9%86%D9%88%D8%A7%D8%B1-%D8%A7%D9%84%D9%87%D8%AF%D8%A7%D9%8A%D8%A9-%D9%81%D9%8A-%D8%A7%D9%84%D8%AA%D8%B9%D9%84%D9%8A%D9%82%D8%A9-%D8%B9%D9%84%D9%89-%D8%A7%D9%84%D9%83%D9%81%D8%A7%D9%8A%D8%A9" }
        ]
      },
      {
        title: "النافع يوم الحشر", author: "الفاضل المقداد", on: "الباب الحادي عشر",
        sources: [
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=6392" }
        ]
      },
      {
        title: "مطارح النظر، في شرح الباب الحادي عشر", author: "الشيخ صفي الدين الطريحي", on: "الباب الحادي عشر",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=2292" }
        ]
      },
      {
        title: "بيان النافع يوم الحشر في شرح الباب الحادي عشر", author: "حسين علي الحسين", on: "الباب الحادي عشر",
        sources: [
          { site: "dr-s-elhusseini.com", url: "https://dr-s-elhusseini.com/pic/bayanalnafe3.doc" }
        ]
      },
      {
        title: "إرشاد البشر في شرح الباب الحادي عشر الشيخ سليمان بن أحمد آل عبدالجبار القطيفي", author: "", on: "الباب الحادي عشر",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=3620" }
        ]
      },
      {
        title: "أضواء علي النافع يوم الحشر، في شرح الباب الحادي عشر حيدر الوكيل", author: "", on: "الباب الحادي عشر",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=2950" }
        ]
      },
      {
        title: "شرح الباب الحادي عشر الشيخ محمد كاظم آل شبير الخاقاني", author: "", on: "الباب الحادي عشر",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=3545" }
        ]
      },
      {
        title: "شرح تبصرة المتعلمين في أحكام الدين ج1ج2", author: "السيد صادق الشيرازي", on: "تبصرة المتعلمين في أحكام الدين",
        sources: [
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=3153" }
        ]
      },
      {
        title: "صراط اليقين في شرح تبصرة المتعلمين ج1ج2", author: "الشيخ أحمد بن زين الدين الأحسائي", on: "تبصرة المتعلمين في أحكام الدين",
        sources: [
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=3989" }
        ]
      },
      {
        title: "شرح تبصرة المتعلمين – 5 أجزاء", author: "الشيخ ضياء الدين العراقي", on: "تبصرة المتعلمين في أحكام الدين",
        sources: [
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=4582" }
        ]
      },
      {
        title: "الشرح الصغير، في شرح المختصر النافع 3 أجزاء", author: "المير السيد علي محمد علي الطباطبائي الحائري", on: "المختصر النافع في فقه الإمامية",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=4943" }
        ]
      },
      {
        title: "شرح ترددات المختصر النافع", author: "الشيخ علي بن إبراهيم القطيفي", on: "المختصر النافع في فقه الإمامية",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=4507" }
        ]
      },
      {
        title: "المهذب البارع في شرح المختصر النافع", author: "جمال الدين أبي العباس احمد بن محمد بن فهد الحلي", on: "المختصر النافع في فقه الإمامية",
        sources: [
          { site: "مكتبة المنتظر", url: "http://almontdr.blogspot.com/2015/07/blog-post_432.html" }
        ]
      },
      {
        title: "جامع المدارك في شرح المختصر النافع 6 مجلدات، 7 أجزاء", author: "السيد أحمد الخوانساري", on: "المختصر النافع في فقه الإمامية",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=3181" }
        ]
      },
      {
        title: "كشف الرموز في شرح مختصر النافع 2 جزء", author: "الحسن بن أبي طالب اليوسفي", on: "المختصر النافع في فقه الإمامية",
        sources: [
          { site: "مكتبة المساحة", url: "https://www.masaha.org/group_books/589-%D9%83%D8%B4%D9%81-%D8%A7%D9%84%D8%B1%D9%85%D9%88%D8%B2-%D9%81%D9%8A-%D8%B4%D8%B1%D8%AD-%D9%85%D8%AE%D8%AA%D8%B5%D8%B1-%D8%A7%D9%84%D9%86%D8%A7%D9%81%D8%B9" }
        ]
      },
      {
        title: "المدرس الأفضل، لكتاب دروس تمهيدية في الفقه الاستدلالي – ج1،ج2", author: "الشيخ عمار الخزعلي", on: "دروس تمهيدية في الفقه الاستدلالي",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=3862" }
        ]
      },
      {
        title: "التنقيح في شرح المكاسب", author: "تقريرات السيد الخوئي", on: "المكاسب",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "https://shiabooks.net/library.php?id=9985" }
        ]
      },
      {
        title: "منهاج الفقاهة – التعليق علي مكاسب الشيخ الأعظم – 6 أجزاء", author: "السيد محمد صادق الروحانيي", on: "المكاسب",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=4819" }
        ]
      },
      {
        title: "إيصال الطالب إلى المكاسب – 16 جزء", author: "السيد محمد الحسيني الشيرازي", on: "المكاسب",
        sources: [
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=4291" }
        ]
      },
      {
        title: "إرشاد الطالب في شرح المكاسب – 7 أجزاء", author: "الميرزا جواد التبريزي", on: "المكاسب",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=4866" }
        ]
      },
      {
        title: "هدى الطالب إلى شرح المكاسب – 7 أجزاء", author: "السيد محمد جعفر الجزائري المروج", on: "المكاسب",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=3160" }
        ]
      },
      {
        title: "منية الطالب في شرح المكاسب (3 أجزاء)", author: "تقريرات الميرزا محمد حسين النائيني", on: "المكاسب",
        sources: [
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=3949" }
        ]
      },
      {
        title: "عمدة الطالب في التعليق علي المكاسب 4 أجزاء", author: "السيد تقي الطباطبائي القمي", on: "المكاسب",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=4949" }
        ]
      },
      {
        title: "هداية الطالب إلى أسرار المكاسب – 5 أجزاء", author: "الميرزا فتاح الشهيدي التبريزي", on: "المكاسب",
        sources: [
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=4333" }
        ]
      },
      {
        title: "بغية الراغب في مباني المكاسب، تقرير لأبحاث آية الله العظمى الشيخ الوحيد الخراساني في الخيارات – 4 أجزاء", author: "الشيخ نزار آل سنبل القطيفي", on: "المكاسب",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=2688" }
        ]
      },
      {
        title: "حاشية كتاب المكاسب – 3 أجزاء", author: "الفقيه ميرزا علي الإيرواني الغروي", on: "المكاسب",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=3353" }
        ]
      },
      {
        title: "الآراء الفقهية", author: "المكاسب المحرّمة و البيع", on: "المكاسب",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "https://shiabooks.net/library.php?id=8567" }
        ]
      },
      {
        title: "التعليقة علي المكاسب المحرّمة الشيخ محمد رضا نكونام", author: "", on: "المكاسب",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "https://shiabooks.net/library.php?id=10547" }
        ]
      },
      {
        title: "التعليقة علي المكاسب", author: "2 جزء السيد عبد الحسين اللاري", on: "المكاسب",
        sources: [
          { site: "مكتبة المساحة", url: "https://www.masaha.org/group_books/1886-%D8%A7%D9%84%D8%AA%D8%B9%D9%84%D9%8A%D9%82%D8%A9-%D8%B9%D9%84%D9%89-%D8%A7%D9%84%D9%85%D9%83%D8%A7%D8%B3%D8%A8" }
        ]
      },
      {
        title: "حاشية المظفر علي المكاسب", author: "العلامة محمد رضا المظفر", on: "المكاسب",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=3294" }
        ]
      },
      {
        title: "غاية الآمال في شرح كتاب المكاسب 3 أجزاء", author: "الشيخ محمد حسن المامقاني", on: "المكاسب",
        sources: [
          { site: "مكتبة المساحة", url: "https://www.masaha.org/group_books/748-%D8%BA%D8%A7%D9%8A%D8%A9-%D8%A7%D9%84%D8%A2%D9%85%D8%A7%D9%84-%D9%81%D9%8A-%D8%B4%D8%B1%D8%AD-%D9%83%D8%AA%D8%A7%D8%A8-%D8%A7%D9%84%D9%85%D9%83%D8%A7%D8%B3%D8%A8" }
        ]
      },
      {
        title: "حاشية كتاب المكاسب", author: "للأصفهاني", on: "المكاسب",
        sources: [
          { site: "مكتبة المساحة", url: "https://www.masaha.org/group_books/497-%D8%AD%D8%A7%D8%B4%D9%8A%D8%A9-%D9%83%D8%AA%D8%A7%D8%A8-%D8%A7%D9%84%D9%85%D9%83%D8%A7%D8%B3%D8%A8-%D9%84%D9%84%D8%A3%D8%B5%D9%81%D9%87%D8%A7%D9%86%D9%8A" },
          { site: "مكتبة المساحة · نسخة أخرى", url: "https://www.masaha.org/book/765-%D8%AD%D8%A7%D8%B4%D9%8A%D8%A9-%D9%83%D8%AA%D8%A7%D8%A8-%D8%A7%D9%84%D9%85%D9%83%D8%A7%D8%B3%D8%A8-%D9%84%D9%84%D9%87%D9%85%D8%AF%D8%A7%D9%86%D9%8A" }
        ]
      },
      {
        title: "أجود الشروح في شرح معالم الدين في الأصول", author: "الميرزا محسن الدوزدوزان التبريزي", on: "معالم الأصول (معالم الدين وملاذ المجتهدين)",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "http://shiabooks.net/library.php?id=9474" }
        ]
      },
      {
        title: "هداية المسترشدين، في شرح أصول معالم الدين – 3 أجزاء", author: "الشيخ محمد تقي الرازي النجفي الإصفهاني", on: "معالم الأصول (معالم الدين وملاذ المجتهدين)",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=4800" }
        ]
      },
      {
        title: "حاشية معالم الدين", author: "الشيخ محمد صالح المازندراني", on: "معالم الأصول (معالم الدين وملاذ المجتهدين)",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/book/3638-%D8%AD%D8%A7%D8%B4%D9%8A%D8%A9-%D9%85%D8%B9%D8%A7%D9%84%D9%85-%D8%A7%D9%84%D8%AF%D9%8A%D9%86" }
        ]
      },
      {
        title: "تحرير المعالم في أصول الفقه", author: "الشيخ علي المشكين", on: "معالم الأصول (معالم الدين وملاذ المجتهدين)",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/book/3204-%D8%AA%D8%AD%D8%B1%D9%8A%D8%B1-%D8%A7%D9%84%D9%85%D8%B9%D8%A7%D9%84%D9%85-%D9%81%D9%8A-%D8%A3%D8%B5%D9%88%D9%84-%D8%A7%D9%84%D9%81%D9%82%D9%87" }
        ]
      },
      {
        title: "هدى الفكر إلى أصول الفقه", author: "شرح مفصل لأصول المظفر", on: "أصول الفقه",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/blog/?page_id=405" }
        ]
      },
      {
        title: "الروض الزاهر المطهّر في شرح اصول فقه المظفّر – مجلدين", author: "السيد طعان خليل العاملي", on: "أصول الفقه",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "http://www.shiabooks.net/library.php?id=8452" }
        ]
      },
      {
        title: "المقدمات والتنبيهات، في شرح أصول الفقه – 8 أجزاء", author: "الشيخ محمود قانصو الشهابي العاملي", on: "أصول الفقه",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=3270" }
        ]
      },
      {
        title: "شرح حلقات الأصول – 20 مجلد", author: "السيد كمال الحيدري", on: "دروس في علم الأصول (الحلقات الثلاث)",
        sources: [
          { site: "موقع السيد كمال الحيدري", url: "http://alhaydari.com/ar/2016/11/58742/" }
        ]
      },
      {
        title: "دروس أصولية، شرح كتاب الحلقة الأولى للسيد الصدر", author: "الشيخ علي عبدالله العبود", on: "دروس في علم الأصول (الحلقات الثلاث)",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=2151" }
        ]
      },
      {
        title: "الصدر ج1 ج2", author: "محمود العيداني", on: "دروس في علم الأصول (الحلقات الثلاث)",
        sources: [
          { site: "المصادر الإسلامية", url: "https://ar.islamic-sources.com/Books/%D8%A7%D9%84%D8%A8%D8%B1%D9%86%D8%A7%D9%85%D8%AC-%D8%A7%D9%84%D8%AA%D8%AF%D8%B1%D9%8A%D8%B3%D9%8A-%D9%84%D9%84%D8%AD%D9%84%D9%82%D8%A9-%D8%A7%D9%84%D8%AB%D8%A7%D9%86%D9%8A%D8%A9-%D9%85%D9%86-%D8%AD-2" },
          { site: "مكتبة المساحة · البيان المفيد (المنصوري) ج1", url: "http://www.masaha.org/book/3328-%D8%A7%D9%84%D8%A8%D9%8A%D8%A7%D9%86-%D8%A7%D9%84%D9%85%D9%81%D9%8A%D8%AF-%D9%81%D9%8A-%D8%B4%D8%B1%D8%AD-%D8%A7%D9%84%D8%AD%D9%84%D9%82%D8%A9-%D8%A7%D9%84%D8%AB%D8%A7%D9%84%D8%AB%D8%A9" },
          { site: "مكتبة المساحة · البيان المفيد (المنصوري) ج2", url: "http://www.masaha.org/book/3329-%D8%A7%D9%84%D8%A8%D9%8A%D8%A7%D9%86-%D8%A7%D9%84%D9%85%D9%81%D9%8A%D8%AF-%D9%81%D9%8A-%D8%B4%D8%B1%D8%AD-%D8%A7%D9%84%D8%AD%D9%84%D9%82%D8%A9-%D8%A7%D9%84%D8%AB%D8%A7%D9%84%D8%AB%D8%A9" },
          { site: "مكتبة المساحة · البيان المفيد (المنصوري) ج3", url: "http://www.masaha.org/book/3330-%D8%A7%D9%84%D8%A8%D9%8A%D8%A7%D9%86-%D8%A7%D9%84%D9%85%D9%81%D9%8A%D8%AF-%D9%81%D9%8A-%D8%B4%D8%B1%D8%AD-%D8%A7%D9%84%D8%AD%D9%84%D9%82%D8%A9-%D8%A7%D9%84%D8%AB%D8%A7%D9%84%D8%AB%D8%A9" },
          { site: "مكتبة المساحة · البيان المفيد (المنصوري) ج4", url: "http://www.masaha.org/book/3331-%D8%A7%D9%84%D8%A8%D9%8A%D8%A7%D9%86-%D8%A7%D9%84%D9%85%D9%81%D9%8A%D8%AF-%D9%81%D9%8A-%D8%B4%D8%B1%D8%AD-%D8%A7%D9%84%D8%AD%D9%84%D9%82%D8%A9-%D8%A7%D9%84%D8%AB%D8%A7%D9%84%D8%AB%D8%A9" }
        ]
      },
      {
        title: "دروس في علم الأصول", author: "خلاصة الحلقة الأولى", on: "دروس في علم الأصول (الحلقات الثلاث)",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/book/3802-%D8%AF%D8%B1%D9%88%D8%B3-%D9%81%D9%8A-%D8%B9%D9%84%D9%85-%D8%A7%D9%84%D8%A3%D8%B5%D9%88%D9%84-%D8%AE%D9%84%D8%A7%D8%B5%D8%A9-%D8%A7%D9%84%D8%AD%D9%84%D9%82%D8%A9-%D8%A7%D9%84%D8%A3%D9%88%D9%84%D9%89" },
          { site: "مكتبة المساحة · نسخة أخرى", url: "http://www.masaha.org/group_books/1400-%D8%AF%D8%B1%D9%88%D8%B3-%D9%81%D9%8A-%D8%B9%D9%84%D9%85-%D8%A7%D9%84%D8%A3%D8%B5%D9%88%D9%84-%D8%B4%D8%B1%D8%AD-%D8%A7%D9%84%D8%AD%D9%84%D9%82%D8%A9-%D8%A7%D9%84%D8%AB%D8%A7%D9%84%D8%AB%D8%A9" }
        ]
      },
      {
        title: "دروس في أصول الفقه", author: "الحلقة الثانية", on: "دروس في علم الأصول (الحلقات الثلاث)",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/group_books/1393-%D8%AF%D8%B1%D9%88%D8%B3-%D9%81%D9%8A-%D8%A3%D8%B5%D9%88%D9%84-%D8%A7%D9%84%D9%81%D9%82%D9%87-%D8%A7%D9%84%D8%AD%D9%84%D9%82%D8%A9-%D8%A7%D9%84%D8%AB%D8%A7%D9%86%D9%8A%D8%A9" },
          { site: "مكتبة المساحة · نسخة أخرى", url: "http://www.masaha.org/book/3786-%D8%AF%D8%B1%D9%88%D8%B3-%D9%81%D9%8A-%D8%A3%D8%B5%D9%88%D9%84-%D8%A7%D9%84%D9%81%D9%82%D9%87-%D8%A7%D9%84%D8%AD%D9%84%D9%82%D8%A9-%D8%A7%D9%84%D8%AB%D8%A7%D9%84%D8%AB%D8%A9" }
        ]
      },
      {
        title: "شرح الحلقة الأولى (2 جزء)", author: "ناج طالب آل فقيه العاملي", on: "دروس في علم الأصول (الحلقات الثلاث)",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/group_books/1430-%D8%B4%D8%B1%D8%AD-%D8%A7%D9%84%D8%AD%D9%84%D9%82%D8%A9-%D8%A7%D9%84%D8%A3%D9%88%D9%84%D9%89" }
        ]
      },
      {
        title: "التعليق والشرح المفيد للحلقة الأولى 2 جزء", author: "السيد محمد علي الحسين", on: "دروس في علم الأصول (الحلقات الثلاث)",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/group_books/1044-%D8%A7%D9%84%D8%AA%D8%B9%D9%84%D9%8A%D9%82-%D9%88%D8%A7%D9%84%D8%B4%D8%B1%D8%AD-%D8%A7%D9%84%D9%85%D9%81%D9%8A%D8%AF-%D9%84%D9%84%D8%AD%D9%84%D9%82%D8%A9-%D8%A7%D9%84%D8%A3%D9%88%D9%84%D9%89" }
        ]
      },
      {
        title: "شرح الحلقة الثانية", author: "ناجي طالب آل فقيه العاملي", on: "دروس في علم الأصول (الحلقات الثلاث)",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/book/3984-%D8%B4%D8%B1%D8%AD-%D8%A7%D9%84%D8%AD%D9%84%D9%82%D8%A9-%D8%A7%D9%84%D8%AB%D8%A7%D9%86%D9%8A%D8%A9" }
        ]
      },
      {
        title: "تحقيق الحلقة الثانية", author: "السيد علي أكبر الحائري", on: "دروس في علم الأصول (الحلقات الثلاث)",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/book/2728-%D8%AA%D8%AD%D9%82%D9%8A%D9%82-%D8%A7%D9%84%D8%AD%D9%84%D9%82%D8%A9-%D8%A7%D9%84%D8%AB%D8%A7%D9%86%D9%8A%D8%A9" }
        ]
      },
      {
        title: "شرح الأصول من الحلقة الثانية (2 جزء)", author: "الشيخ محمد صنقو البحراني", on: "دروس في علم الأصول (الحلقات الثلاث)",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/group_books/1429-%D8%B4%D8%B1%D8%AD-%D8%A7%D9%84%D8%A3%D8%B5%D9%88%D9%84-%D9%85%D9%86-%D8%A7%D9%84%D8%AD%D9%84%D9%82%D8%A9-%D8%A7%D9%84%D8%AB%D8%A7%D9%86%D9%8A%D8%A9" }
        ]
      },
      {
        title: "شرح الحلقة الثالثة (6 أجزاء)", author: "الشيخ حسن الفياض العاملي", on: "دروس في علم الأصول (الحلقات الثلاث)",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/group_books/1432-%D8%B4%D8%B1%D8%AD-%D8%A7%D9%84%D8%AD%D9%84%D9%82%D8%A9-%D8%A7%D9%84%D8%AB%D8%A7%D9%84%D8%AB%D8%A9" }
        ]
      },
      {
        title: "منهاج الوصول إلى دروس في علم الأصول؛ شرح الحلقة الثالثة", author: "2 جزء الشيخ محمد رضا الأحمدي البهسودي", on: "دروس في علم الأصول (الحلقات الثلاث)",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/group_books/1676-%D9%85%D9%86%D9%87%D8%A7%D8%AC-%D8%A7%D9%84%D9%88%D8%B5%D9%88%D9%84-%D8%A5%D9%84%D9%89-%D8%AF%D8%B1%D9%88%D8%B3-%D9%81%D9%8A-%D8%B9%D9%84%D9%85-%D8%A7%D9%84%D8%A3%D8%B5%D9%88%D9%84-%D8%B4%D8%B1%D8%AD-%D8%A7%D9%84%D8%AD%D9%84%D9%82%D8%A9-%D8%A7%D9%84%D8%AB%D8%A7%D9%84%D8%AB%D8%A9" }
        ]
      },
      {
        title: "مذاكرة الأصول في كتاب الحلقة الأولى والثانية (2 جزء)", author: "ناصر محمد المسباع", on: "دروس في علم الأصول (الحلقات الثلاث)",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/book/4307-%D9%85%D8%B0%D8%A7%D9%83%D8%B1%D8%A9-%D8%A7%D9%84%D8%A3%D8%B5%D9%88%D9%84-%D9%81%D9%8A-%D9%83%D8%AA%D8%A7%D8%A8-%D8%A7%D9%84%D8%AD%D9%84%D9%82%D8%A9-%D8%A7%D9%84%D8%A3%D9%88%D9%84%D9%89-%D9%88%D8%A7%D9%84%D8%AB%D8%A7%D9%86%D9%8A%D8%A9" }
        ]
      },
      {
        title: "البيان المفيد في شرح الحلقة الثالثة ج1 ج2 ج3 ج4", author: "الشيخ أياد المنصوري", on: "دروس في علم الأصول (الحلقات الثلاث)",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/group_books/1243-%D8%A7%D9%84%D8%A8%D9%8A%D8%A7%D9%86-%D8%A7%D9%84%D9%85%D9%81%D9%8A%D8%AF-%D9%81%D9%8A-%D8%B4%D8%B1%D8%AD-%D8%A7%D9%84%D8%AD%D9%84%D9%82%D8%A9-%D8%A7%D9%84%D8%AB%D8%A7%D9%84%D8%AB%D8%A9" }
        ]
      },
      {
        title: "توضيح القوانين", author: "محمد حسين بن محمد القمي", on: "القوانين المحكمة في الأصول",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/group_books/1346-%D8%AA%D9%88%D8%B6%D9%8A%D8%AD-%D8%A7%D9%84%D9%82%D9%88%D8%A7%D9%86%D9%8A%D9%86" },
          { site: "مدرسة الفقاهة · نسخة أخرى", url: "http://ar.lib.eshia.ir/86710/1/0" }
        ]
      },
      {
        title: "حاشية علي القوانين", author: "الشيخ الأنصاري", on: "القوانين المحكمة في الأصول",
        sources: [
          { site: "المكتبة الشيعية", url: "http://shiaonlinelibrary.com/%D8%A7%D9%84%D9%83%D8%AA%D8%A8/2765_%D8%AD%D8%A7%D8%B4%D9%8A%D8%A9-%D8%B9%D9%84%D9%89-%D8%A7%D9%84%D9%82%D9%88%D8%A7%D9%86%D9%8A%D9%86-%D8%A7%D9%84%D8%B4%D9%8A%D8%AE-%D8%A7%D9%84%D8%A3%D9%86%D8%B5%D8%A7%D8%B1%D9%8A" },
          { site: "مدرسة الفقاهة · نسخة اخرى", url: "http://ar.lib.eshia.ir/13027/1/1" }
        ]
      },
      {
        title: "موضح القوانين", author: "مصطفى الاعتمادي", on: "القوانين المحكمة في الأصول",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/book/4618-%D9%85%D9%88%D8%B6%D8%AD-%D8%A7%D9%84%D9%82%D9%88%D8%A7%D9%86%D9%8A%D9%86" }
        ]
      },
      {
        title: "خلاصة القوانين", author: "أحمد الأنصاري", on: "القوانين المحكمة في الأصول",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/book/3767-%D8%AE%D9%84%D8%A7%D8%B5%D8%A9-%D8%A7%D9%84%D9%82%D9%88%D8%A7%D9%86%D9%8A%D9%86" }
        ]
      },
      {
        title: "الحاشية علي قوانين الأصول", author: "4 أجزاء الشيخ جواد الطارمي", on: "القوانين المحكمة في الأصول",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/group_books/1248-%D8%A7%D9%84%D8%AD%D8%A7%D8%B4%D9%8A%D8%A9-%D8%B9%D9%84%D9%89-%D9%82%D9%88%D8%A7%D9%86%D9%8A%D9%86-%D8%A7%D9%84%D8%A3%D8%B5%D9%88%D9%84" }
        ]
      },
      {
        title: "دروس في الرسائل – ستة أجزاء", author: "الشيخ غلام علي المحمدي البامياني", on: "فرائد الأصول (الرسائل)",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=3082" }
        ]
      },
      {
        title: "شرح الرسائل – 3 أجزاء", author: "الشيخ مصطفى الاعتمادي التبريزي الخواجوني", on: "فرائد الأصول (الرسائل)",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=3066" }
        ]
      },
      {
        title: "الوصائل إلى الرسائل – 15 مجلد", author: "السيد محمد الشيرازي", on: "فرائد الأصول (الرسائل)",
        sources: [
          { site: "مكتبة المنتظر", url: "http://almontdr.blogspot.com/2015/08/blog-post_23.html" }
        ]
      },
      {
        title: "تمهيد الوسائل في شرح الرسائل 12 جزء", author: "الشيخ علي المروج", on: "فرائد الأصول (الرسائل)",
        sources: [
          { site: "مدرسة الفقاهة", url: "http://ar.lib.eshia.ir/86706/1/4" }
        ]
      },
      {
        title: "عمدة الوسائل في الحاشية علي الرسائل 3 أجزاء", author: "السيد عبد الله الشيرازي", on: "فرائد الأصول (الرسائل)",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/group_books/1441-%D8%B9%D9%85%D8%AF%D8%A9-%D8%A7%D9%84%D9%88%D8%B3%D8%A7%D8%A6%D9%84-%D9%81%D9%8A-%D8%A7%D9%84%D8%AD%D8%A7%D8%B4%D9%8A%D8%A9-%D8%B9%D9%84%D9%89-%D8%A7%D9%84%D8%B1%D8%B3%D8%A7%D8%A6%D9%84" }
        ]
      },
      {
        title: "الوسائل إلى غوامض الرسائل", author: "السيد رسول الموسوي الطهراني", on: "فرائد الأصول (الرسائل)",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/book/3596-%D8%A7%D9%84%D9%88%D8%B3%D8%A7%D8%A6%D9%84-%D8%A5%D9%84%D9%89-%D8%BA%D9%88%D8%A7%D9%85%D8%B6-%D8%A7%D9%84%D8%B1%D8%B3%D8%A7%D8%A6%D9%84" }
        ]
      },
      {
        title: "تعليقة للسيد الكماري علي رسائل المحقق الأنصاري", author: "محمد بن أحمد قرجه داغي الكماري", on: "فرائد الأصول (الرسائل)",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/book/3275-%D8%AA%D8%B9%D9%84%D9%8A%D9%82%D8%A9-%D9%84%D9%84%D8%B3%D9%8A%D8%AF-%D8%A7%D9%84%D9%83%D9%85%D8%A7%D8%B1%D9%8A-%D8%B9%D9%84%D9%89-%D8%B1%D8%B3%D8%A7%D8%A6%D9%84-%D8%A7%D9%84%D9%85%D8%AD%D9%82%D9%82-%D8%A7%D9%84%D8%A3%D9%86%D8%B5%D8%A7%D8%B1%D9%8A" }
        ]
      },
      {
        title: "أوثق الوسائل في شرح الرسائل (6 أجزاء)", author: "الميرزا موسى التبريزي", on: "فرائد الأصول (الرسائل)",
        sources: [
          { site: "مكتبة المنتظر", url: "http://almontdr.blogspot.com/2015/05/blog-post_694.html" }
        ]
      },
      {
        title: "درر الفوائد في الحاشية علي الفرائد", author: "الآخوند الشيخ محمد كاظم الخراساني", on: "فرائد الأصول (الرسائل)",
        sources: [
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=3627" }
        ]
      },
      {
        title: "حاشية فرائد الأصول", author: "الشيخ آقا رضا الهمداني", on: "فرائد الأصول (الرسائل)",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/book/3637-%D8%AD%D8%A7%D8%B4%D9%8A%D8%A9-%D9%81%D8%B1%D8%A7%D8%A6%D8%AF-%D8%A7%D9%84%D8%A3%D8%B5%D9%88%D9%84" },
          { site: "مكتبة المساحة · ج1", url: "https://www.masaha.org/book/3634-%D8%AD%D8%A7%D8%B4%D9%8A%D8%A9-%D9%81%D8%B1%D8%A7%D8%A6%D8%AF-%D8%A7%D9%84%D8%A3%D8%B5%D9%88%D9%84-%D8%AA%D9%82%D8%B1%D9%8A%D8%B1%D8%A7%D8%AA" },
          { site: "مكتبة المساحة · ج2", url: "https://www.masaha.org/book/3635-%D8%AD%D8%A7%D8%B4%D9%8A%D8%A9-%D9%81%D8%B1%D8%A7%D8%A6%D8%AF-%D8%A7%D9%84%D8%A3%D8%B5%D9%88%D9%84-%D8%AA%D9%82%D8%B1%D9%8A%D8%B1%D8%A7%D8%AA" },
          { site: "مكتبة المساحة · ج3", url: "https://www.masaha.org/book/3636-%D8%AD%D8%A7%D8%B4%D9%8A%D8%A9-%D9%81%D8%B1%D8%A7%D8%A6%D8%AF-%D8%A7%D9%84%D8%A3%D8%B5%D9%88%D9%84-%D8%AA%D9%82%D8%B1%D9%8A%D8%B1%D8%A7%D8%AA" }
        ]
      },
      {
        title: "التعليقة علي فرائد الأصول – 2جزء", author: "محمد بن أحمد قرجه داغ الكماري", on: "فرائد الأصول (الرسائل)",
        sources: [
          { site: "مدرسة الفقاهة", url: "http://ar.lib.eshia.ir/%D9%82%D8%B1%D8%AC%D9%87_%D8%AF%D8%A7%D8%BA%D9%8A_%D8%A7%D9%84%D9%83%D9%85%D8%A7%D8%B1%D9%8A%D8%8C_%D9%85%D8%AD%D9%85%D8%AF_%D8%A8%D9%86_%D8%A3%D8%AD%D9%85%D8%AF" }
        ]
      },
      {
        title: "بحر الفوائد في شرح الفرائد في شرح الفرائد (8 أجزاء)", author: "آية الله محمد حسن الرازي", on: "فرائد الأصول (الرسائل)",
        sources: [
          { site: "مكتبة المنتظر", url: "http://almontdr.blogspot.com/2015/05/blog-post_181.html" }
        ]
      },
      {
        title: "جواهر العقول في شرح فرائد الأصول", author: "محمد رضا الناصري القوچاني", on: "فرائد الأصول (الرسائل)",
        sources: [
          { site: "مكتبة المنتظر", url: "https://almontdr.blogspot.com/2015/05/blog-post_95.html" }
        ]
      },
      {
        title: "الرسائل الجديدة و الفرائد الحديثة", author: "تلخيص لفرائد الشيخ مرتضى الأنصاري", on: "فرائد الأصول (الرسائل)",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "http://shiabooks.net/library.php?id=10196" }
        ]
      },
      {
        title: "درر الفوائد في شرح الفرائد – 6 مجلدات", author: "السيد يوسف المدن التبريزي", on: "فرائد الأصول (الرسائل)",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "http://shiabooks.net/library.php?id=11063" }
        ]
      },
      {
        title: "التعليقة علي فرائد الأصول – مجلدين", author: "السيد عبد الحسين اللاري", on: "فرائد الأصول (الرسائل)",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "http://shiabooks.net/library.php?id=9965" }
        ]
      },
      {
        title: "التنقيح", author: "تعليقة موسّعة علي فرائد الأصول للشيخ الأنصاري", on: "فرائد الأصول (الرسائل)",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "http://shiabooks.net/library.php?id=9902" }
        ]
      },
      {
        title: "قلائد الفرائد (2 جزء)", author: "الآخوند الشيخ غلام رضا القمي", on: "فرائد الأصول (الرسائل)",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/group_books/1452-%D9%82%D9%84%D8%A7%D8%A6%D8%AF-%D8%A7%D9%84%D9%81%D8%B1%D8%A7%D8%A6%D8%AF" }
        ]
      },
      {
        title: "فرائد الأصول", author: "حواشي أوثق الوسائل", on: "فرائد الأصول (الرسائل)",
        sources: [
          { site: "مكتبة المنتظر", url: "http://almontdr.blogspot.com/2015/05/blog-post_694.html" }
        ]
      },
      {
        title: "تعليقة علي فرائد الأصول", author: "علي الشيرازي", on: "فرائد الأصول (الرسائل)",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/book/3266-%D8%AA%D8%B9%D9%84%D9%8A%D9%82%D8%A9-%D8%B9%D9%84%D9%89-%D9%81%D8%B1%D8%A7%D8%A6%D8%AF-%D8%A7%D9%84%D8%A3%D8%B5%D9%88%D9%84" }
        ]
      },
      {
        title: "تسديد القواعد في حاشية الفرائد محمد الإمامي الخوانساري", author: "", on: "فرائد الأصول (الرسائل)",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/book/3257-%D8%AA%D8%B3%D8%AF%D9%8A%D8%AF-%D8%A7%D9%84%D9%82%D9%88%D8%A7%D8%B9%D8%AF-%D9%81%D9%8A-%D8%AD%D8%A7%D8%B4%D9%8A%D8%A9-%D8%A7%D9%84%D9%81%D8%B1%D8%A7%D8%A6%D8%AF" }
        ]
      },
      {
        title: "إيضاح الفرائد (2 جزء)", author: "السيد محمد التنكابني", on: "فرائد الأصول (الرسائل)",
        sources: [
          { site: "مكتبة المساحة", url: "http://www.masaha.org/group_books/1186-%D8%A5%D9%8A%D8%B6%D8%A7%D8%AD-%D8%A7%D9%84%D9%81%D8%B1%D8%A7%D8%A6%D8%AF" }
        ]
      },
      {
        title: "التحفة السنية بشرح المقدمة الآجرومية.", author: "محمد محي الدين عبدالحميد", on: "متن الآجرومية",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=1638" }
        ]
      },
      {
        title: "التحف النحوية في شرح الآجرومية", author: "الشيخ عبدالله بن أحمد آل طعان", on: "متن الآجرومية",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=3751" }
        ]
      },
      {
        title: "شرح قطر الندى وبل الصدى، ومعه كتاب نهج التف بتحقيق وإعراب شواهد قطر الندى", author: "الشيخ محمد جعفر الشيخ إبراهيم الكرباسي", on: "قطر الندى وبل الصدى",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=2275" }
        ]
      },
      {
        title: "شرح قطر الندى وبلّ الصدى", author: "جمال الدين بن هشام الأنصاري", on: "قطر الندى وبل الصدى",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=1489" }
        ]
      },
      {
        title: "القطر الشافي مع هوامش شاملة لإعراب شواهد كتاب قطر الندى", author: "محمد حسين أشكناني", on: "قطر الندى وبل الصدى",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=4987" }
        ]
      },
      {
        title: "شجرة النحو، بحسب قطر الندى", author: "حسين فضل الله", on: "قطر الندى وبل الصدى",
        sources: [
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=3960" }
        ]
      },
      {
        title: "مجيب الندا في شرح قطر الندى العلامة جمال الدين عبد الله بن أحمد المكي الفاكىهي", author: "", on: "قطر الندى وبل الصدى",
        sources: [
          { site: "أرشيف الإنترنت", url: "https://archive.org/download/4964pdf./4964%20%D9%83%D8%AA%D8%A7%D8%A8%20%D8%A7%D9%82%D8%B1%D8%A7%20%D8%A7%D9%88%D9%86%D9%84%D8%A7%D9%8A%D9%86%20%20%20%20pdf%20%20%20%D9%85%D8%AC%D9%8A%D8%A8%20%D8%A7%D9%84%D9%86%D8%AF%D8%A7%20%D9%81%D9%8A%20%D8%B4%D8%B1%D8%AD%20%D9%82%D8%B7%D8%B1%20%D8%A7%D9%84%D9%86%D8%AF%D9%89%20%D8%8C%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D9%84%D9%87%20%D8%A7%D9%84%D9%81%D8%A7%D9%83%D9%87%D9%8A%20%D8%8C%20%D8%AA%20%D8%AF.%20%D9%85%D8%A4%D9%85%D9%86%20%D8%A7%D9%84%D8%A8%D8%AF%D8%A7%D8%B1%D9%8A%D9%86.pdf" }
        ]
      },
      {
        title: "شرح الدماميني علي مغني اللبيب", author: "محمد بن أبي بكر الدماميني", on: "مغني اللبيب عن كتب الأعاريب",
        sources: [
          { site: "waqfeya.com", url: "https://waqfeya.com/book.php?bid=6142" }
        ]
      },
      {
        title: "فتح القريب المجيب إعراب شواهد مغني اللبيب", author: "محمد علي طه الدرة", on: "مغني اللبيب عن كتب الأعاريب",
        sources: [
          { site: "waqfeya.com", url: "https://waqfeya.com/book.php?bid=9854" }
        ]
      },
      {
        title: "شرح ابن عقيل علي ألفية ابن مالك وب هامشه كتاب إعراب الشواهد القرآنية – ج1ج 2", author: "الشيخ محمد جعفر إبراهيم الكرباسي النجفي", on: "شرح ابن عقيل، ومعه منحة الجليل",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=2276" }
        ]
      },
      {
        title: "حاشية الخضري علي شرح ابن عقيل علي ألفية ابن مالك", author: "", on: "شرح ابن عقيل، ومعه منحة الجليل",
        sources: [
          { site: "أرشيف الإنترنت", url: "https://archive.org/download/khalidabdallateefjomhour_gmail_201801/%D8%AD%D8%A7%D8%B4%D9%8A%D8%A9%20%D8%A7%D9%84%D8%AE%D8%B6%D8%B1%D9%8A%20%D8%B9%D9%84%D9%89%20%D8%B4%D8%B1%D8%AD%20%D8%A7%D8%A8%D9%86%20%D8%B9%D9%82%D9%8A%D9%84%20%D8%B7%D8%A8%D8%B9%D8%A9%20%D8%AC%D8%AF%D9%8A%D8%AF%D8%A9%20%D9%88%D8%A7%D8%B6%D8%AD%D8%A9.pdf" }
        ]
      },
      {
        title: "مصطفى عقاب ج1 ج2 شرح شافية ابن الحاجب", author: "رضي الدين محمد بن الحسن الأستراباذي النحوي", on: "شرح النظام على شافية ابن الحاجب",
        sources: [
          { site: "أرشيف الإنترنت", url: "https://archive.org/download/NETHAM/1.pdf" },
          { site: "أرشيف الإنترنت · ج2", url: "https://archive.org/download/NETHAM/2.pdf" },
          { site: "أرشيف الإنترنت · ج1", url: "http://www.archive.org/download/shfeh/ahfeh001.pdf" },
          { site: "أرشيف الإنترنت · ج2", url: "http://www.archive.org/download/shfeh/ahfeh002.pdf" },
          { site: "أرشيف الإنترنت · ج3", url: "http://www.archive.org/download/shfeh/ahfeh003.pdf" },
          { site: "أرشيف الإنترنت · ج4", url: "http://www.archive.org/download/shfeh/ahfeh004.pdf" }
        ]
      },
      {
        title: "شرح الرضي لكافية ابن الحاجب", author: "محمد بن الحسن الأستراباذي السمنان النجفي الرض", on: "شرح النظام على شافية ابن الحاجب",
        sources: [
          { site: "waqfeya.com", url: "https://waqfeya.com/book.php?bid=6584" }
        ]
      },
      {
        title: "دروس في البلاغة، شرح مختصر المعاني للتفتازاني 4 أجزاء", author: "الشيخ محمدي البامياني", on: "مختصر المعاني",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=3399" }
        ]
      },
      {
        title: "المدرس الأفضل، فيما يرمز ويشار اليه في المطول 4 أجزاء", author: "الشيخ محمد علي الملقب المدرس الأفغاني", on: "المطول في شرح تلخيص المفتاح",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=3883" }
        ]
      },
      {
        title: "الإصباح في شرح تلخيص المفتاح المعروف بالمطول 4 أجزاء", author: "محمد زكي الجعفري الأديب درة صوفي", on: "المطول في شرح تلخيص المفتاح",
        sources: [
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=3994" }
        ]
      },
      {
        title: "الحاشية علي المطول شرح تلخيص مفتاح العلوم", author: "الشريف الجرحاني", on: "المطول في شرح تلخيص المفتاح",
        sources: [
          { site: "أرشيف الإنترنت", url: "http://www.archive.org/download/waq88647/88647.pdf" }
        ]
      },
      {
        title: "عروس الأفراح في شرح تلخيص المفتاح المؤلف: بهاء الدين السبكي", author: "ت 773هـ", on: "المطول في شرح تلخيص المفتاح",
        sources: [
          { site: "أرشيف الإنترنت", url: "https://archive.org/compress/ArawshtamoArawshtamo/formats=IMAGE%20CONTAINER%20PDF&file=/ArawshtamoArawshtamo.zip" }
        ]
      },
      {
        title: "ملخص تلخيص المفتاح في علوم البلاغة – المؤلف: أبو يحي زكريا الأنصاري", author: "ت 926ـه", on: "المطول في شرح تلخيص المفتاح",
        sources: [
          { site: "أرشيف الإنترنت", url: "https://archive.org/download/brahimmd56_gmail_20180215_2054/%D9%85%D9%84%D8%AE%D8%B5%20%D8%AA%D9%84%D8%AE%D9%8A%D8%B5%20%D8%A7%D9%84%D9%85%D9%81%D8%AA%D8%A7%D8%AD.pdf" }
        ]
      },
      {
        title: "توضيح منطق الشيخ المظفر – 3 أجزاء", author: "عمار محمد كاظم الساعدي", on: "المنطق",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=3469" }
        ]
      },
      {
        title: "المقرر في شرح منطق المظفر، مع متنه المصحح", author: "السيد رائد الحيدري", on: "المنطق",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=3367" }
        ]
      },
      {
        title: "الإجابة علي تمرينات منطق المظفر", author: "محسن غرويان", on: "المنطق",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=2107" }
        ]
      },
      {
        title: "المنطق، تعليق الشيخ الفياض", author: "", on: "المنطق",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=3872" }
        ]
      },
      {
        title: "حاشية علي التهذيب", author: "الملا عبد الله التستري، نسخة اخرى", on: "حاشية ملا عبد الله على التهذيب",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=3191" },
          { site: "شبكة الفكر · نسخة اخرى", url: "http://alfeker.net/library.php?id=3524" }
        ]
      },
      {
        title: "محاضرات في المنطق، شرحاً لحاشية ملا عبد الله 3 أجزاء", author: "محمد علي محراب علي الرحيمي، نسخة اخرى", on: "حاشية ملا عبد الله على التهذيب",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=3064" },
          { site: "شبكة الفكر · نسخة اخرى", url: "https://alfeker.net/library.php?id=4380" }
        ]
      },
      {
        title: "تحرير القواعد المنطقية لقطب الدين الرازي في شرح الرسالة الشمسية لنجم الدين علي الكاتنالقزوين", author: "", on: "القواعد الجلية في شرح الرسالة الشمسية",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "http://shiabooks.net/library.php?id=9158" }
        ]
      },
      {
        title: "تعليقة رشيقة – في المنطق", author: "شرح منظومة السبزواري", on: "شرح المنظومة (قسم المنطق)",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "http://shiabooks.net/library.php?id=9798" }
        ]
      },
      {
        title: "شرح المنظومة", author: "الشهيد مرتضى مطهري", on: "شرح المنظومة (قسم المنطق)",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=1720" }
        ]
      },
      {
        title: "بغية الطالبين في شرح آداب المتعلمين محمد البنداوي الكعن", author: "", on: "آداب المتعلمين",
        sources: [
          { site: "alfeker.mediafire.com", url: "http://alfeker.mediafire.com/file/d08fbrq6o81bydo" }
        ]
      },
      {
        title: "المراد من منية المريد", author: "السيد محمد رضا الطباطبائي", on: "منية المريد في أدب المفيد والمستفيد",
        sources: [
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=3933" }
        ]
      },
      {
        title: "بداية المعارف الإلهية في شرح عقائد الإمامية", author: "السيد محسن الخرازي", on: "عقائد الإمامية",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=1855" }
        ]
      },
      {
        title: "الدراية في علم مصطلح الحديث", author: "زين الدين العاملي الشهيد الثاني", on: "البداية في علم الدراية",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "http://shiabooks.net/library.php?id=9766" }
        ]
      },
      {
        title: "شرح البداية في علم الدراية", author: "الشهيد الثاني العاملي، ضبط نصه السيد محمد رضا الحسين الجلالي", on: "البداية في علم الدراية",
        sources: [
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=4077" }
        ]
      },
      {
        title: "تحرير المقال في كليات علم الرجال الشيخ مهدي الهادوي الطهراني", author: "", on: "كليات في علم الرجال",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "http://shiabooks.net/library.php?id=8924" }
        ]
      },
      {
        title: "شرح بداية الحكمة، للعلامة الطباطبائي شرح وتحقيق الشيخ محمد مهدي المؤمن", author: "", on: "بداية الحكمة",
        sources: [
          { site: "شبكة الفكر", url: "http://alfeker.net/library.php?id=2735" }
        ]
      },
      {
        title: "بداية الحكمة، مع تعاليق نقدية مختصرة", author: "حيدر الوكيل", on: "بداية الحكمة",
        sources: [
          { site: "شبكة الفكر", url: "https://alfeker.net/library.php?id=4011" }
        ]
      },
      {
        title: "دروس فلسفية في شرح بداية الحكمة للعلامة الطباطبائي", author: "الشيخ علي الشيرواني", on: "بداية الحكمة",
        sources: [
          { site: "dl.aldhiaa.com", url: "http://dl.aldhiaa.com/arabic/almanteg-va-alfalsafa/%D8%AF%D8%B1%D9%88%D8%B3%20%D9%81%D9%84%D8%B3%D9%81%D9%8A%D8%A9%20%D9%81%D9%8A%20%D8%B4%D8%B1%D8%AD%20%D8%A8%D8%AF%D8%A7%D9%8A%D8%A9%20%D8%A7%D9%84%D8%AD%D9%83%D9%85%D8%A9%20%D9%84%D9%84%D8%B9%D9%84%D8%A7%D9%85%D8%A9%20%D8%A7%D9%84%D8%B7%D8%A8%D8%A7%D8%B7%D8%A8%D8%A7%D8%A6%D9%8A%20-%20%D8%A7%D9%84%D8%B4%D9%8A%D8%AE%20%D8%B9%D9%84%D9%8A%20%D8%B4%D9%8A%D8%B1%D9%88%D8%A7%D9%86%D9%8A.pdf" }
        ]
      },
      {
        title: "نهاية الحكمة", author: "تعليقات غلامرضا الفيّاض", on: "نهاية الحكمة",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "https://shiabooks.net/library.php?id=9642" }
        ]
      },
      {
        title: "نهاية الحكمة 2 جزء", author: "تحقيق الشيخ عبّاس علي الزارع السبزواري", on: "نهاية الحكمة",
        sources: [
          { site: "مكتبة شيعة بوكس", url: "http://shiabooks.net/library.php?id=10333" }
        ]
      }
    ]
  }
};
