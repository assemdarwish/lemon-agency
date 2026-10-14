/* =====================================================================
   SITE CONTENT — every piece of work lives here, one line per item.
   Media files are prepared by optimize-media.ps1 (see the usage at the top of that file),
   which writes them into assets/media/<category>/ and prints the line to paste below.
   Empty lists show "coming soon" placeholders on the site.
   ===================================================================== */

/* ---- 01 · SOCIAL MEDIA DESIGNS ----
   image: assets/media/social/ID.webp   (thumb: assets/media/social/thumb/ID.webp) */
const SOCIAL = [
  { id:'landmark-chess',        client:'99 LANDMARK',  title:{en:'The right move',           ar:'قبل ما تختار الوحدة'} },
  { id:'andrea-dessert',        client:'ANDREA',       title:{en:'Dessert & coffee',         ar:'خذ لك حلا'} },
  { id:'cloud-plan',            client:'CLOUD',        title:{en:'It starts with a plan',    ar:'كل حاجة بتبدأ بخطة'} },
  { id:'mousa-brewed',          client:'MOUSA COFFEE', title:{en:'Brewed to power you',      ar:'قهوة تشحنك'} },
  { id:'nice-together',         client:'NICE CHIPS',   title:{en:'Nice brings us together',  ar:'نايس يجمعنا'} },
  { id:'grazia-family',         client:'PIZZA GRAZIA', title:{en:'Family deal',              ar:'عرض العيلة'} },
  { id:'superior-protein',      client:'SUPERIOR 14',  title:{en:'Pure protein',             ar:'بروتين نقي'} },
  { id:'landmark-30',           client:'99 LANDMARK',  title:{en:'Up to 30% return',         ar:'عائد يصل لـ 30%'} },
  { id:'andrea-pizza',          client:'ANDREA',       title:{en:'The Italian taste',        ar:'الطعم الإيطالي'} },
  { id:'cloud-burgers',         client:'CLOUD',        title:{en:'Burgers',                  ar:'برجر'} },
  { id:'mousa-can',             client:'MOUSA COFFEE', title:{en:'Long day? No problem',     ar:'يوم طويل؟'} },
  { id:'nice-mood',             client:'NICE CHIPS',   title:{en:'Nice completes the mood',  ar:'نايس يكمل المود'} },
  { id:'grazia-twins',          client:'PIZZA GRAZIA', title:{en:'Twins deal',               ar:'عرض التوينز'} },
  { id:'superior-multivitamin', client:'SUPERIOR 14',  title:{en:'Replace the stack',        ar:'كل العناصر في جرعة واحدة'} },
  { id:'landmark-hourglass',    client:'99 LANDMARK',  title:{en:'Every moment counts',      ar:'كل لحظة استثمارك بيزيد'} },
  { id:'andrea-grill',          client:'ANDREA',       title:{en:'Mixed grill',              ar:'طبق المشاوي'} },
  { id:'cloud-workmode',        client:'CLOUD',        title:{en:'Work mode on',             ar:'وضع الشغل'} },
  { id:'mousa-coffee-time',     client:'MOUSA COFFEE', title:{en:"It's coffee time",         ar:'وقت القهوة'} },
  { id:'nice-beach',            client:'NICE CHIPS',   title:{en:'Its place is the hangout', ar:'مكانه في اللمة'} },
  { id:'grazia-empty',          client:'PIZZA GRAZIA', title:{en:'Gone too soon',            ar:'خلصت بدري بدري'} },
];

/* ---- 02 · AI VIDEOS (the wheel) ----
   assets/media/ai/full/ID.mp4 · preview/ID.mp4 · poster/ID.jpg */
const AI_VIDEOS = [
  { id:'99-landmark', dur:'0:33',   brand:'99 LANDMARK',  title:{en:'99 Landmark',          ar:'99 لاندمارك'} },
  { id:'nice-1', dur:'0:37',        brand:'NICE',         title:{en:'NICE — Part 1',        ar:'NICE — الجزء الأول'} },
  { id:'nice-2', dur:'0:49',        brand:'NICE',         title:{en:'NICE — Part 2',        ar:'NICE — الجزء التاني'} },
  { id:'nice-outro', dur:'0:20',    brand:'NICE',         title:{en:'NICE — Outro',         ar:'NICE — الختام'} },
  { id:'xtrano-1', dur:'0:48',      brand:'XTRANO',       title:{en:'Xtrano — Part 1',      ar:'Xtrano — الجزء الأول'} },
  { id:'xtrano-2', dur:'0:42',      brand:'XTRANO',       title:{en:'Xtrano — Part 2',      ar:'Xtrano — الجزء التاني'} },
  { id:'xtrano-outro', dur:'0:16',  brand:'XTRANO',       title:{en:'Xtrano — Outro',       ar:'Xtrano — الختام'} },
  { id:'cpc-1', dur:'0:24',         brand:'CPC',          title:{en:'CPC — Part 1',         ar:'CPC — الجزء الأول'} },
  { id:'cpc-2', dur:'0:25',         brand:'CPC',          title:{en:'CPC — Part 2',         ar:'CPC — الجزء التاني'} },
  { id:'cpc-3', dur:'0:31',         brand:'CPC',          title:{en:'CPC — Part 3',         ar:'CPC — الجزء التالت'} },
  { id:'supplements-1', dur:'0:10', brand:'SUPPLEMENTS',  title:{en:'Supplements — Part 1', ar:'Supplements — الجزء الأول'} },
  { id:'supplements-2', dur:'0:08', brand:'SUPPLEMENTS',  title:{en:'Supplements — Part 2', ar:'Supplements — الجزء التاني'} },
];

/* ---- 03 · VIDEO EDITING — one stacking card per project ----
   each video: assets/media/editing/full/ID.mp4 · preview/ID.mp4 · poster/ID.jpg
   ratio: '9:16' (vertical) or '16:9' (horizontal) */
const EDITING = [
  { client:'iHELP', title:{en:'Weekly reels — week 2', ar:'ريلز الأسبوع التاني'},
    desc:{en:'Edited short-form videos for iHelp: pacing, captions and sound for social.', ar:'مونتاج فيديوهات قصيرة لـ iHelp: إيقاع وكابشن وصوت مناسبين للسوشيال.'},
    videos:[ { id:'ihelp-1', dur:'0:50', ratio:'9:16' }, { id:'ihelp-2', dur:'0:58', ratio:'9:16' },
             { id:'ihelp-4', dur:'0:25', ratio:'9:16' }, { id:'ihelp-6', dur:'1:17', ratio:'9:16' } ] },
  // { client:'BRAND', title:{en:'Reels campaign', ar:'حملة ريلز'}, desc:{en:'…', ar:'…'},
  //   videos:[ { id:'brand-reel-1', dur:'0:30', ratio:'9:16' } ] },
];

/* ---- 04 · GIFS ----
   assets/media/gifs/ID.mp4 + ID.jpg (GIFs are converted to tiny looping videos)
   size: 's' normal · 'w' wide · 't' tall · 'b' big */
const GIFS = [
  { id:'gif-1' }, { id:'gif-2' }, { id:'gif-3' }, { id:'gif-4' },
  // { id:'sticker-1', size:'s' },
];

/* ---- 05 · PRINT ----
   image: assets/media/print/ID.webp   (thumb: assets/media/print/thumb/ID.webp) */
const PRINT = [
  // book: multi-page piece shown as a page-turning flipbook (pages in assets/media/print/ID/pNN.webp)
  // model: interactive 3D piece (truck wrap) + its mockup shots in assets/media/print/ID/shots/sN.webp
  { id:'hyper-techno', client:'HYPER TECHNO', title:{en:'Truck Branding', ar:'براندنج عربية النقل'}, model:'truck', shots:6 },
  { id:'hamada', client:'HAMADA GROUP', title:{en:'Company Profile', ar:'بروفايل الشركة'}, book:{ pages:18, ratio:680/454 } },
  // { id:'menu-andrea', client:'Andrea', title:{en:'Restaurant menu', ar:'منيو مطعم'} },
];

/* ---- TESTIMONIALS ----
   NOT SHOWN: the owner removed the testimonials section from the site (kept here in case it comes back).
   Placeholders — replace `text` with real client quotes.
   logo = number of the file in assets/media/clients/client-N.webp */
const TESTIMONIALS = [
  { logo:15, name:'NICE Chips' }, { logo:3, name:'Xtrano Chips' }, { logo:12, name:'Nutrabolics & Superior14' },
  { logo:9, name:'Mousa Coffee' }, { logo:10, name:'Cloud Cafe' }, { logo:13, name:'Andrea Restaurant' },
  { logo:5, name:'Hamada Group' }, { logo:4, name:'Free Foods' }, { logo:7, name:'Iteration' }, { logo:14, name:'Sahla' },
].map(q => ({ ...q, text: q.text || { en:'Client testimonial goes here — replace this text in content.js.', ar:'رأي العميل هنا — غيّر النص ده من content.js.' } }));


