/* ================================================================
   নূরুল কোরআন — Website CMS
   ---------------------------------------------------------------
   এই ফাইলটি admin.html-এর পুরনো website panel-কে একটি পূর্ণাঙ্গ
   content editor-এ বদলে দেয়। ডেটা আগের generic store-এর একই key-তে
   যায়, তাই পুরনো ইনস্টলেশনের ডেটার সঙ্গেও backwards-compatible।
   ================================================================ */
(function () {
  'use strict';

  const DEFAULT_SITE = {
    brandName: 'নূরুল কোরআন মাদরাসা',
    logoUrl: './assets/receipt-header.png',
    seoTitle: 'নুরুল কোরআন মাদরাসা | কুরআন ও আধুনিক শিক্ষার সমন্বয়',
    seoDescription: 'নূরুল কোরআন মাদরাসা — হিফজুল কুরআন, নাজেরা ও আধুনিক নূরানি বিভাগে কুরআন-সুন্নাহ ভিত্তিক মানসম্মত শিক্ষা।',
    navHome: 'হোম',
    navCourses: 'কোর্সসমূহ',
    navSchedule: 'সময়সূচি',
    navTestimonials: 'মতামত',
    navContact: 'যোগাযোগ',
    navAdmission: 'এখনই ভর্তি হোন',
    whyTitle: 'কেন নূরুল কোরআন মাদরাসা?',
    coursesTitle: 'আমাদের কোর্সসমূহ',
    testimonialsTitle: 'পিতামাতা ও শিক্ষার্থীদের মতামত',
    whyItems: [
      'যোগ্য হাফেজ ও কারী দ্বারা পাঠদান',
      'অত্যাধুনিক প্রযুক্তি সম্পন্ন ও মাল্টিমিডিয়া ক্লাসরুম',
      'সঠিক তাজবিদ সহ কুরআন তেলাওয়াত চর্চা',
      'নিয়মিত মুখস্থ যাচাই ও মূল্যায়ন পরীক্ষা',
      'ইসলামিক শিষ্টাচার ও চরিত্র গঠনে বিশেষ মনোযোগ',
      'আধুনিক একাডেমিক শিক্ষার সাথে সমন্বয়',
      'নিরাপদ, শৃঙ্খলাপূর্ণ ও পরিচ্ছন্ন পরিবেশ',
      'প্রতিদিনের অগ্রগতি অভিভাবকদের কাছে পৌঁছে দেওয়া',
      'একাধিক ব্যাচ থাকায় সুবিধামত সময়ে ভর্তি',
    ],
    stats: [
      { count: 352, label: 'সক্রিয় শিক্ষার্থী' },
      { count: 31, label: 'যোগ্য শিক্ষক' },
      { count: 12, label: 'বিভিন্ন কোর্স' },
      { count: 15, label: 'বছরের অভিজ্ঞতা' },
      { count: 100, label: 'হিফজ সম্পন্নকারী শিক্ষার্থী' },
    ],
    courses: [
      { tag: 'hifz', fee: 'ভর্তি চলছে', title: 'কুরআন হিফজ', description: 'সঠিক তাজবিদ ও তাফসির সহ সকল বয়সের শিক্ষার্থীদের জন্য সম্পূর্ণ হিফজুল কুরআন প্রোগ্রাম।' },
      { tag: 'naz', fee: 'ভর্তি চলছে', title: 'নাজেরা ও নূরানী বিভাগ', description: 'শুদ্ধভাবে কুরআন তেলাওয়াত ও আরবি বর্ণ পরিচিতি সহ ইসলামিক স্টাডিজের ভিত্তি গঠন।' },
    ],
    scheduleTitle: 'ক্লাস সময়সূচি',
    scheduleHeaders: ['বিভাগ', 'ব্যাচ', 'দিন', 'সময়'],
    scheduleRows: [
      ['হিফজুল কুরআন', 'NQ 1A', 'শনিবার - সোমবার - বুধবার', 'ফজরের পর - ৮:০০'],
      ['হিফজুল কুরআন', 'NQ 1B', 'রবিবার - মঙ্গলবার - বৃহস্পতিবার', 'ফজরের পর - ৮:০০'],
      ['নাজেরা বিভাগ', 'NQ 2A', 'শনিবার - সোমবার - বুধবার', 'বিকাল ৪:০০ - ৫:৩০'],
      ['নাজেরা বিভাগ', 'NQ 2B', 'রবিবার - মঙ্গলবার - বৃহস্পতিবার', 'বিকাল ৪:০০ - ৫:৩০'],
      ['নূরানী বিভাগ', 'NQ 3A', 'শনি - রবি - সোম - মঙ্গল - বুধ', 'সকাল ৯:০০ - ১১:০০'],
      ['আরবি ভাষা', 'NQ 4A', 'শনিবার - সোমবার - বুধবার', 'সন্ধ্যা ৬:০০ - ৭:০০'],
      ['আরবি ভাষা', 'NQ 4B', 'রবিবার - মঙ্গলবার - বৃহস্পতিবার', 'সন্ধ্যা ৬:০০ - ৭:০০'],
      ['ইসলামিক স্টাডিজ', 'NQ 5A', 'শুক্রবার', 'বাদ জুমা - ২:০০'],
    ],
    testimonials: [
      { quote: 'নুরুল কোরআন মাদরাসা আমাদের পরিবারের জন্য একটি আশীর্বাদ। আমার সন্তানরা শুধু তাদের কুরআন তিলাওয়াতেই উন্নতি করেনি, বরং শক্তিশালী ইসলামিক মূল্যবোধও বিকাশ করেছে।', author: 'আহমেদ রহমান', role: 'অভিভাবক' },
      { quote: 'শিক্ষকরা জ্ঞানী এবং যত্নশীল। তারা একটি পোষণমূলক পরিবেশ তৈরি করেন যেখানে শিশুরা ইসলাম সম্পর্কে শিখতে ভালোবাসে।', author: 'ফাতিমা খান', role: 'অভিভাবক' },
      { quote: 'আমি প্রশংসা করি কিভাবে মাদরাসাটি ঐতিহ্যবাহী ইসলামিক শিক্ষাকে আধুনিক শিক্ষণ পদ্ধতির সাথে সামঞ্জস্য করে। আমার মেয়ে প্রতিদিন তার ক্লাসের জন্য উৎসাহিত হয়।', author: 'ইউসুফ আলী', role: 'অভিভাবক' },
    ],
    contactTitle: 'যোগাযোগের তথ্য',
    address: 'হরিপুর বোর্ডঘর, চাঁপাইনবাবগঞ্জ।',
    phone: '+৮৮০১৭৭০-০১৩৩৩',
    email: 'info@nqm.com',
    mapUrl: 'https://www.google.com/maps?q=Chapainawabganj,Bangladesh&output=embed',
    contactButton: 'কোর্স সমূহ দেখুন',
    footerText: '© ২০২৫ নূরুল কোরআন মাদরাসা। সকল অধিকার সংরক্ষিত।',
    formTitle: 'আমাদের সাথে যোগাযোগ করুন',
    formName: 'আপনার নাম',
    formEmail: 'ইমেইল',
    formPhone: 'মোবাইল নম্বর',
    formMessage: 'আপনার বার্তা',
    formSubmit: 'বার্তা পাঠান',
    intro: 'নূরুল কুরআন মাদ্রাসা ২০২৫ সালে প্রতিষ্ঠার পর থেকে কুরআন ও সুন্নাহ ভিত্তিক জ্ঞান বিতরণে নিরলস ভাবে কাজ করে আসছে।',
    verse: '',
    verseSrc: '',
    dirName: 'মাওলানা মোহ্যা আহাম বারী',
    dirTitle: 'প্রতিষ্ঠাতা, পরিচালক',
    dirMsg: '',
    dirPhoto: '',
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function value(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  }
  function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val == null ? '' : val;
  }
  function mergeDefaults() {
    siteInfo = Object.assign(clone(DEFAULT_SITE), siteInfo || {});
    siteInfo.whyItems = Array.isArray(siteInfo.whyItems) && siteInfo.whyItems.length ? siteInfo.whyItems : clone(DEFAULT_SITE.whyItems);
    siteInfo.stats = Array.isArray(siteInfo.stats) && siteInfo.stats.length ? siteInfo.stats : clone(DEFAULT_SITE.stats);
    siteInfo.courses = Array.isArray(siteInfo.courses) && siteInfo.courses.length ? siteInfo.courses : clone(DEFAULT_SITE.courses);
    siteInfo.scheduleRows = Array.isArray(siteInfo.scheduleRows) && siteInfo.scheduleRows.length ? siteInfo.scheduleRows : clone(DEFAULT_SITE.scheduleRows);
    siteInfo.testimonials = Array.isArray(siteInfo.testimonials) && siteInfo.testimonials.length ? siteInfo.testimonials : clone(DEFAULT_SITE.testimonials);
    siteInfo.scheduleHeaders = Array.isArray(siteInfo.scheduleHeaders) && siteInfo.scheduleHeaders.length ? siteInfo.scheduleHeaders : clone(DEFAULT_SITE.scheduleHeaders);
    siteSlides = (Array.isArray(siteSlides) && siteSlides.length ? siteSlides : [
      { id: 1, title: 'স্বাগতম নূরুল কোরআন মাদ্রাসায়', subtitle: 'কুরআন ও সুন্নাহ ভিত্তিক জ্ঞান বিতরণে নিরলস কাজ', image: '', alt: 'মাদরাসার শিক্ষা কার্যক্রম' },
    ]).map((slide, index) => Object.assign({ id: index + 1, title: '', subtitle: '', image: '', alt: 'মাদরাসার শিক্ষা কার্যক্রম', enabled: true }, slide));
    siteRules = Array.isArray(siteRules) && siteRules.length ? siteRules : [{ id: 1, text: 'ভর্তি ফরম সঠিকভাবে পূরণ করে প্রয়োজনীয় কাগজপত্রসহ জমা দিতে হবে।' }];
    siteProgs = Array.isArray(siteProgs) && siteProgs.length ? siteProgs : clone([
      { id: 1, name: 'নূরানি বিভাগ', note: 'প্লে থেকে পঞ্চম শ্রেণী পর্যন্ত' },
      { id: 2, name: 'বালিকা শাখা (আবাসিক)', note: 'হিফজুল কুরআন ও কিতাব বিভাগ' },
    ]);
  }

  function section(title, body) {
    return '<div class="desig-card nq-cms-card"><div class="leave-card-title">' + title + '</div>' + body + '</div>';
  }
  function field(label, id, val, type) {
    return '<div class="form-row"><label for="' + id + '">' + label + '</label>' +
      (type === 'textarea'
        ? '<textarea id="' + id + '" rows="3">' + esc(val) + '</textarea>'
        : '<input id="' + id + '" value="' + esc(val) + '">') + '</div>';
  }
  function lines(list) {
    return (list || []).map(function (item) { return Array.isArray(item) ? item.join('|') : item; }).join('\n');
  }
  function slideRows() {
    return siteSlides.map(function (slide, index) {
      return '<div class="nq-slide-row" data-index="' + index + '">' +
        '<div class="nq-slide-preview">' + (slide.image ? '<img src="' + esc(slide.image) + '" alt="">' : '🖼') + '</div>' +
        '<div class="nq-slide-fields">' +
        '<input placeholder="স্লাইডের শিরোনাম" value="' + esc(slide.title) + '" oninput="siteSlides[' + index + '].title=this.value">' +
        '<input placeholder="সাবটাইটেল" value="' + esc(slide.subtitle) + '" oninput="siteSlides[' + index + '].subtitle=this.value">' +
        '<input placeholder="ছবির URL (অথবা নিচে ফাইল বাছাই করুন)" value="' + esc(slide.image) + '" oninput="siteSlides[' + index + '].image=this.value">' +
        '<input placeholder="ছবির বিকল্প লেখা" value="' + esc(slide.alt) + '" oninput="siteSlides[' + index + '].alt=this.value">' +
        '<label class="nq-file-label">ছবি আপলোড <input type="file" accept="image/*" onchange="uploadSiteSlideImage(' + index + ', this)"></label>' +
        '</div><button class="ci-btn ci-del-a" title="মুছুন" onclick="removeSiteSlide(' + slide.id + ')">' + (typeof icoDelete === 'string' ? icoDelete : '×') + '</button>' +
        '</div>';
    }).join('');
  }

  function renderSiteCMS() {
    mergeDefaults();
    const el = document.getElementById('sp-siteList');
    if (!el) return;
    el.innerHTML =
      '<div class="nq-cms-intro"><strong>ওয়েবসাইট কনটেন্ট ম্যানেজমেন্ট</strong><span>এখানকার পরিবর্তন সেভ করলে ফ্রন্টএন্ড ওয়েবসাইটে প্রকাশ হবে। URL না থাকলে ছবির জন্য ফাইল আপলোড করুন।</span></div>' +
      section('🏷 ব্র্যান্ড, লোগো ও নেভিগেশন', '<div class="nq-cms-grid">' +
        field('প্রতিষ্ঠানের নাম', 'cmsBrandName', siteInfo.brandName) + field('SEO title', 'cmsSeoTitle', siteInfo.seoTitle) +
        field('SEO description', 'cmsSeoDescription', siteInfo.seoDescription, 'textarea') +
        field('লোগোর URL', 'cmsLogoUrl', siteInfo.logoUrl) +
        '<div class="form-row"><label>লোগো আপলোড</label><input type="file" accept="image/*" onchange="uploadSiteLogo(this)"></div>' +
        field('হোম মেনু', 'cmsNavHome', siteInfo.navHome) + field('কোর্স মেনু', 'cmsNavCourses', siteInfo.navCourses) +
        field('সময়সূচি মেনু', 'cmsNavSchedule', siteInfo.navSchedule) + field('মতামত মেনু', 'cmsNavTestimonials', siteInfo.navTestimonials) +
        field('যোগাযোগ মেনু', 'cmsNavContact', siteInfo.navContact) + field('ভর্তি বাটন', 'cmsNavAdmission', siteInfo.navAdmission) + '</div>') +
      section('🖼 হিরো / ক্যারোসেল স্লাইড', '<div id="nqCmsSlideList">' + slideRows() + '</div><button class="add-btn" style="background:#43a047;" onclick="addSiteSlide()">+ নতুন স্লাইড যোগ করুন</button>') +
      section('✅ কেন আমাদের বেছে নেবেন', field('শিরোনাম', 'cmsWhyTitle', siteInfo.whyTitle) + field('বুলেট তালিকা (প্রতি লাইনে একটি)', 'cmsWhyItems', siteInfo.whyItems.join('\n'), 'textarea')) +
      section('📊 পরিসংখ্যান', field('পরিসংখ্যান (প্রতি লাইনে: সংখ্যা|লেবেল)', 'cmsStats', lines(siteInfo.stats), 'textarea')) +
      section('🎓 কোর্সসমূহ', field('সেকশনের শিরোনাম', 'cmsCoursesTitle', siteInfo.coursesTitle) + field('কোর্স তালিকা (প্রতি লাইনে: ট্যাগ|ভর্তি স্ট্যাটাস|শিরোনাম|বিবরণ)', 'cmsCourses', lines(siteInfo.courses.map(function (c) { return [c.tag, c.fee, c.title, c.description]; })), 'textarea')) +
      section('🗓 ক্লাস সময়সূচি', field('সেকশনের শিরোনাম', 'cmsScheduleTitle', siteInfo.scheduleTitle) + field('কলামের নাম (৪টি, | দিয়ে আলাদা)', 'cmsScheduleHeaders', siteInfo.scheduleHeaders.join('|')) + field('সারির তথ্য (প্রতি লাইনে: বিভাগ|ব্যাচ|দিন|সময়)', 'cmsScheduleRows', lines(siteInfo.scheduleRows), 'textarea')) +
      section('💬 অভিভাবক ও শিক্ষার্থীদের মতামত', field('সেকশনের শিরোনাম', 'cmsTestimonialsTitle', siteInfo.testimonialsTitle) + field('মতামত (প্রতি লাইনে: মতামত|নাম|পরিচয়)', 'cmsTestimonials', lines(siteInfo.testimonials.map(function (t) { return [t.quote, t.author, t.role]; })), 'textarea')) +
      section('ℹ️ পরিচিতি ও পরিচালকের বাণী', field('প্রতিষ্ঠানের পরিচিতি', 'cmsIntro', siteInfo.intro, 'textarea') + field('আয়াত / উক্তি', 'cmsVerse', siteInfo.verse) + field('সূত্র', 'cmsVerseSrc', siteInfo.verseSrc) + '<div class="nq-cms-grid">' + field('পরিচালকের নাম', 'cmsDirName', siteInfo.dirName) + field('পদবী', 'cmsDirTitle', siteInfo.dirTitle) + '</div>' + field('পরিচালকের বাণী', 'cmsDirMsg', siteInfo.dirMsg, 'textarea') + '<div class="form-row"><label>পরিচালকের ছবি আপলোড</label><input type="file" accept="image/*" onchange="uploadSiteDirector(this)"></div>') +
      section('📚 ভর্তি তথ্য', field('ভর্তি নির্দেশিকা (প্রতি লাইনে একটি)', 'cmsRules', siteRules.map(function (r) { return r.text; }).join('\n'), 'textarea') + field('শাখা / বিভাগ (প্রতি লাইনে: নাম|বিবরণ)', 'cmsPrograms', lines(siteProgs.map(function (p) { return [p.name, p.note]; })), 'textarea')) +
      section('📍 যোগাযোগ, ম্যাপ ও ফুটার', '<div class="nq-cms-grid">' + field('যোগাযোগ শিরোনাম', 'cmsContactTitle', siteInfo.contactTitle) + field('ঠিকানা', 'cmsAddress', siteInfo.address) + field('ফোন', 'cmsPhone', siteInfo.phone) + field('ইমেইল', 'cmsEmail', siteInfo.email) + field('Google Map embed URL', 'cmsMapUrl', siteInfo.mapUrl) + field('যোগাযোগের বাটন', 'cmsContactButton', siteInfo.contactButton) + '</div>' + field('ফুটার কপিরাইট লেখা', 'cmsFooterText', siteInfo.footerText) + '<div class="nq-cms-grid">' + field('যোগাযোগ ফর্মের শিরোনাম', 'cmsFormTitle', siteInfo.formTitle) + field('নাম ফিল্ডের লেখা', 'cmsFormName', siteInfo.formName) + field('ইমেইল ফিল্ডের লেখা', 'cmsFormEmail', siteInfo.formEmail) + field('মোবাইল ফিল্ডের লেখা', 'cmsFormPhone', siteInfo.formPhone) + field('বার্তা ফিল্ডের লেখা', 'cmsFormMessage', siteInfo.formMessage) + field('সাবমিট বাটন', 'cmsFormSubmit', siteInfo.formSubmit) + '</div>') +
      '<button class="add-btn nq-cms-save" onclick="saveSiteInfo()">💾 সব ওয়েবসাইট তথ্য সেভ করুন</button>';
  }

  function parseRows(text, size) {
    return String(text || '').split(/\r?\n/).map(function (line) {
      return line.split('|').map(function (part) { return part.trim(); });
    }).filter(function (row) { return row.some(Boolean); }).map(function (row) {
      while (row.length < size) row.push('');
      return row.slice(0, size);
    });
  }

  window.initSitePanel = function () {
    renderSiteCMS();
  };
  window.saveSiteInfo = function () {
    mergeDefaults();
    Object.assign(siteInfo, {
      brandName: value('cmsBrandName'), logoUrl: value('cmsLogoUrl'), seoTitle: value('cmsSeoTitle'), seoDescription: value('cmsSeoDescription'),
      navHome: value('cmsNavHome'), navCourses: value('cmsNavCourses'), navSchedule: value('cmsNavSchedule'),
      navTestimonials: value('cmsNavTestimonials'), navContact: value('cmsNavContact'), navAdmission: value('cmsNavAdmission'),
      whyTitle: value('cmsWhyTitle'), coursesTitle: value('cmsCoursesTitle'), testimonialsTitle: value('cmsTestimonialsTitle'),
      whyItems: value('cmsWhyItems').split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean),
      stats: parseRows(value('cmsStats'), 2).map(function (r) { return { count: Math.max(0, parseInt(r[0], 10) || 0), label: r[1] }; }),
      courses: parseRows(value('cmsCourses'), 4).map(function (r) { return { tag: r[0], fee: r[1], title: r[2], description: r[3] }; }),
      scheduleTitle: value('cmsScheduleTitle'), scheduleHeaders: value('cmsScheduleHeaders').split('|').map(function (x) { return x.trim(); }).filter(Boolean),
      scheduleRows: parseRows(value('cmsScheduleRows'), 4),
      testimonials: parseRows(value('cmsTestimonials'), 3).map(function (r) { return { quote: r[0], author: r[1], role: r[2] }; }),
      intro: value('cmsIntro'), verse: value('cmsVerse'), verseSrc: value('cmsVerseSrc'), dirName: value('cmsDirName'),
      dirTitle: value('cmsDirTitle'), dirMsg: value('cmsDirMsg'),
      contactTitle: value('cmsContactTitle'), address: value('cmsAddress'), phone: value('cmsPhone'),
      email: value('cmsEmail'), mapUrl: value('cmsMapUrl'), contactButton: value('cmsContactButton'), footerText: value('cmsFooterText'),
      formTitle: value('cmsFormTitle'), formName: value('cmsFormName'), formEmail: value('cmsFormEmail'), formPhone: value('cmsFormPhone'),
      formMessage: value('cmsFormMessage'), formSubmit: value('cmsFormSubmit'),
    });
    siteRules = parseRows(value('cmsRules'), 1).map(function (r, i) { return { id: i + 1, text: r[0] }; });
    siteProgs = parseRows(value('cmsPrograms'), 2).map(function (r, i) { return { id: i + 1, name: r[0], note: r[1] }; });
    if (typeof nqSaveStateNow === 'function') nqSaveStateNow();
    showToast('ওয়েবসাইটের সব তথ্য সফলভাবে সংরক্ষণ করা হয়েছে');
  };

  window.addSiteSlide = function () {
    const id = siteSlides.reduce(function (max, item) { return Math.max(max, Number(item.id) || 0); }, 0) + 1;
    siteSlides.push({ id: id, title: '', subtitle: '', image: '', alt: 'মাদরাসার শিক্ষা কার্যক্রম', enabled: true });
    renderSiteCMS();
  };
  window.removeSiteSlide = function (id) {
    siteSlides = siteSlides.filter(function (item) { return item.id !== id; });
    renderSiteCMS();
  };

  async function uploadImage(file, folder) {
    if (!file || !window.NQAuth || !NQAuth.isLoggedIn()) throw new Error('ছবি আপলোডের জন্য লগইন প্রয়োজন');
    const fd = new FormData();
    fd.append('image', file);
    fd.append('folder', folder);
    const response = await NQAuth.authFetch('/api/upload', { method: 'POST', body: fd });
    const data = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(data.message || 'ছবি আপলোড ব্যর্থ');
    return data.url || '';
  }
  async function handleImage(input, callback) {
    if (!input.files || !input.files[0]) return;
    try {
      const url = await uploadImage(input.files[0], 'nurulquran/website');
      callback(url);
      renderSiteCMS();
      showToast('ছবি আপলোড হয়েছে — সবশেষে সেভ করুন');
    } catch (error) {
      showErrorPopup('ছবি আপলোড ব্যর্থ হয়েছে', error.message);
    }
  }
  window.uploadSiteLogo = function (input) {
    handleImage(input, function (url) { siteInfo.logoUrl = url; });
  };
  window.uploadSiteDirector = function (input) {
    handleImage(input, function (url) { siteInfo.dirPhoto = url; });
  };
  window.uploadSiteSlideImage = function (index, input) {
    handleImage(input, function (url) { if (siteSlides[index]) siteSlides[index].image = url; });
  };

  const style = document.createElement('style');
  style.textContent = '.nq-cms-intro{display:flex;flex-direction:column;gap:4px;background:#e8f5e9;border-left:4px solid #43a047;padding:14px 16px;border-radius:8px;margin:14px 0;color:#1b5e20}.nq-cms-intro span{font-size:13px;color:#47704a}.nq-cms-card{margin-top:16px}.nq-cms-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 12px}.nq-cms-save{width:100%;background:#1565c0;margin:18px 0 30px}.nq-slide-row{display:flex;align-items:flex-start;gap:10px;border:1px solid #e5e7eb;border-radius:9px;padding:10px;margin-bottom:9px}.nq-slide-preview{width:94px;height:68px;display:flex;align-items:center;justify-content:center;background:#f3f4f6;border-radius:6px;overflow:hidden;font-size:24px;flex:none}.nq-slide-preview img{width:100%;height:100%;object-fit:cover}.nq-slide-fields{display:flex;flex-direction:column;gap:6px;flex:1}.nq-file-label{font-size:12px;color:#1565c0}.nq-file-label input{margin-left:8px}@media(max-width:650px){.nq-cms-grid{grid-template-columns:1fr}.nq-slide-row{flex-wrap:wrap}.nq-slide-fields{min-width:calc(100% - 105px)}}';
  document.head.appendChild(style);
})();