/* ================================================================
   নূরুল কোরআন — public website renderer
   ---------------------------------------------------------------
   Public page-টি একটি static fallback দিয়ে দ্রুত দেখায়, তারপর
   /api/public/site থেকে CMS-এর সর্বশেষ content নিয়ে একই DOM আপডেট করে।
   ================================================================ */
(function () {
  'use strict';

  var FALLBACK_IMAGES = [
    'https://quran-kids.com/wp-content/uploads/2025/12/Kids_-10.jpg',
    'https://quran-kids.com/wp-content/uploads/2025/12/Kids-copy-8.jpg',
    'https://quran-kids.com/wp-content/uploads/2026/02/Kids-Kids_-6.jpg',
    'https://cdn.britannica.com/48/144348-050-FBB629CB/Madrasah-Jami-Masjid-Shrirangapattana-India-Karnataka.jpg'
  ];
  var DEFAULT = {
    brandName: 'নূরুল কোরআন মাদরাসা', seoTitle: 'নুরুল কোরআন মাদরাসা | কুরআন ও আধুনিক শিক্ষার সমন্বয়',
    seoDescription: 'নূরুল কোরআন মাদরাসা — হিফজুল কুরআন, নাজেরা ও আধুনিক নূরানি বিভাগে কুরআন-সুন্নাহ ভিত্তিক মানসম্মত শিক্ষা।',
    logoUrl: './assets/receipt-header.png',
    navHome: 'হোম', navCourses: 'কোর্সসমূহ', navSchedule: 'সময়সূচি',
    navTestimonials: 'মতামত', navContact: 'যোগাযোগ', navAdmission: 'এখনই ভর্তি হোন',
    whyTitle: 'কেন নূরুল কোরআন মাদরাসা?', coursesTitle: 'আমাদের কোর্সসমূহ', testimonialsTitle: 'পিতামাতা ও শিক্ষার্থীদের মতামত',
    whyItems: ['যোগ্য হাফেজ ও কারী দ্বারা পাঠদান', 'অত্যাধুনিক প্রযুক্তি সম্পন্ন ও মাল্টিমিডিয়া ক্লাসরুম', 'সঠিক তাজবিদ সহ কুরআন তেলাওয়াত চর্চা', 'নিয়মিত মুখস্থ যাচাই ও মূল্যায়ন পরীক্ষা', 'ইসলামিক শিষ্টাচার ও চরিত্র গঠনে বিশেষ মনোযোগ', 'আধুনিক একাডেমিক শিক্ষার সাথে সমন্বয়', 'নিরাপদ, শৃঙ্খলাপূর্ণ ও পরিচ্ছন্ন পরিবেশ', 'প্রতিদিনের অগ্রগতি অভিভাবকদের কাছে পৌঁছে দেওয়া', 'একাধিক ব্যাচ থাকায় সুবিধামত সময়ে ভর্তি'],
    stats: [{ count: 352, label: 'সক্রিয় শিক্ষার্থী' }, { count: 31, label: 'যোগ্য শিক্ষক' }, { count: 12, label: 'বিভিন্ন কোর্স' }, { count: 15, label: 'বছরের অভিজ্ঞতা' }, { count: 100, label: 'হিফজ সম্পন্নকারী শিক্ষার্থী' }],
    courses: [
      { tag: 'hifz', fee: 'ভর্তি চলছে', title: 'কুরআন হিফজ', description: 'সঠিক তাজবিদ ও তাফসির সহ সকল বয়সের শিক্ষার্থীদের জন্য সম্পূর্ণ হিফজুল কুরআন প্রোগ্রাম।' },
      { tag: 'naz', fee: 'ভর্তি চলছে', title: 'নাজেরা ও নূরানী বিভাগ', description: 'শুদ্ধভাবে কুরআন তেলাওয়াত ও আরবি বর্ণ পরিচিতি সহ ইসলামিক স্টাডিজের ভিত্তি গঠন।' }
    ],
    scheduleTitle: 'ক্লাস সময়সূচি',
    scheduleHeaders: ['বিভাগ', 'ব্যাচ', 'দিন', 'সময়'],
    scheduleRows: [['হিফজুল কুরআন', 'NQ 1A', 'শনিবার - সোমবার - বুধবার', 'ফজরের পর - ৮:০০'], ['হিফজুল কুরআন', 'NQ 1B', 'রবিবার - মঙ্গলবার - বৃহস্পতিবার', 'ফজরের পর - ৮:০০'], ['নাজেরা বিভাগ', 'NQ 2A', 'শনিবার - সোমবার - বুধবার', 'বিকাল ৪:০০ - ৫:৩০'], ['নাজেরা বিভাগ', 'NQ 2B', 'রবিবার - মঙ্গলবার - বৃহস্পতিবার', 'বিকাল ৪:০০ - ৫:৩০'], ['নূরানী বিভাগ', 'NQ 3A', 'শনি - রবি - সোম - মঙ্গল - বুধ', 'সকাল ৯:০০ - ১১:০০'], ['আরবি ভাষা', 'NQ 4A', 'শনিবার - সোমবার - বুধবার', 'সন্ধ্যা ৬:০০ - ৭:০০'], ['আরবি ভাষা', 'NQ 4B', 'রবিবার - মঙ্গলবার - বৃহস্পতিবার', 'সন্ধ্যা ৬:০০ - ৭:০০'], ['ইসলামিক স্টাডিজ', 'NQ 5A', 'শুক্রবার', 'বাদ জুমা - ২:০০']],
    testimonials: [
      { quote: 'নুরুল কোরআন মাদরাসা আমাদের পরিবারের জন্য একটি আশীর্বাদ। আমার সন্তানরা শুধু তাদের কুরআন তিলাওয়াতেই উন্নতি করেনি, বরং শক্তিশালী ইসলামিক মূল্যবোধও বিকাশ করেছে।', author: 'আহমেদ রহমান', role: 'অভিভাবক' },
      { quote: 'শিক্ষকরা জ্ঞানী এবং যত্নশীল। তারা একটি পোষণমূলক পরিবেশ তৈরি করেন যেখানে শিশুরা ইসলাম সম্পর্কে শিখতে ভালোবাসে।', author: 'ফাতিমা খান', role: 'অভিভাবক' },
      { quote: 'আমি প্রশংসা করি কিভাবে মাদরাসাটি ঐতিহ্যবাহী ইসলামিক শিক্ষাকে আধুনিক শিক্ষণ পদ্ধতির সাথে সামঞ্জস্য করে। আমার মেয়ে প্রতিদিন তার ক্লাসের জন্য উৎসাহিত হয়।', author: 'ইউসুফ আলী', role: 'অভিভাবক' }
    ],
    contactTitle: 'যোগাযোগের তথ্য', address: 'হরিপুর বোর্ডঘর, চাঁপাইনবাবগঞ্জ।', phone: '+৮৮০১৭৭০-০১৩৩৩', email: 'info@nqm.com',
    mapUrl: 'https://www.google.com/maps?q=Chapainawabganj,Bangladesh&output=embed', contactButton: 'কোর্স সমূহ দেখুন',
    footerText: '© ২০২৫ নূরুল কোরআন মাদরাসা। সকল অধিকার সংরক্ষিত।',
    formTitle: 'আমাদের সাথে যোগাযোগ করুন', formName: 'আপনার নাম', formEmail: 'ইমেইল', formPhone: 'মোবাইল নম্বর', formMessage: 'আপনার বার্তা', formSubmit: 'বার্তা পাঠান',
    intro: '', verse: '', verseSrc: '', dirName: '', dirTitle: '', dirMsg: '', dirPhoto: ''
  };

  function esc(value) {
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function toEnglishDigits(value) {
    return String(value == null ? '' : value)
      .replace(/[০-৯]/g, function (digit) { return String('০১২৩৪৫৬৭৮৯'.indexOf(digit)); })
      .replace(/[٠-٩]/g, function (digit) { return String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)); });
  }
  function safeUrl(value, fallback) {
    var url = String(value || '').trim();
    return /^(https?:\/\/|\/|\.\/|data:image\/)/i.test(url) ? url : (fallback || '');
  }
  function delimitedRows(value) {
    var rows = Array.isArray(value) ? value : [String(value == null ? '' : value)];
    return rows.reduce(function (out, item) {
      if (Array.isArray(item)) {
        if (item.some(function (part) { return String(part == null ? '' : part).trim(); })) {
          out.push(item.map(function (part) { return String(part == null ? '' : part).trim(); }));
        }
        return out;
      }
      if (item && typeof item === 'object') {
        out.push(item);
        return out;
      }
      // পুরোনো CMS-এ একই লাইনে "2026hifz" জোড়া লেগে গেলে পরের
      // কোর্সটিকেও আলাদা রেকর্ড হিসেবে উদ্ধার করি।
      String(item == null ? '' : item)
        .replace(/(\d{4})(?=(?:hifz|naz)\s*\|)/gi, '$1\n')
        .split(/\r?\n/)
        .forEach(function (line) {
          if (line.trim()) out.push(line.split('|').map(function (part) { return part.trim(); }));
        });
      return out;
    }, []);
  }
  function partsOf(item) {
    return Array.isArray(item) ? item : null;
  }
  function validStats(value) {
    var rows = delimitedRows(value);
    if (!rows.length) return null;
    var list = rows.map(function (item) {
      item = item || {};
      var parts = partsOf(item);
      var count = parts ? parts[0] : item.count;
      var label = parts ? (parts[1] || '') : item.label;
      var rawCount = toEnglishDigits(count).replace(/[^\d]/g, '');
      return { count: rawCount === '' ? null : Math.max(0, parseInt(rawCount, 10)), label: String(label || '').trim() };
    }).filter(function (item) { return item.count !== null && item.label; });
    return list.length ? list : null;
  }
  function validCourses(value) {
    var rows = delimitedRows(value);
    if (!rows.length) return null;
    var list = rows.map(function (item) {
      item = item || {};
      var parts = partsOf(item);
      return {
        tag: String(parts ? (parts[0] || '') : (item.tag || item.code || '')).trim(),
        fee: String(parts ? (parts[1] || '') : (item.fee || item.status || '')).trim(),
        title: String(parts ? (parts[2] || '') : (item.title || item.name || item.courseName || '')).trim(),
        description: String(parts ? parts.slice(3).join(' | ') : (item.description || item.desc || item.details || '')).trim()
      };
    }).filter(function (item) { return item.title || item.description; });
    return list.length ? list : null;
  }
  function validTestimonials(value) {
    var rows = delimitedRows(value);
    if (!rows.length) return null;
    var list = rows.map(function (item) {
      item = item || {};
      var parts = partsOf(item);
      return {
        quote: String(parts ? (parts[0] || '') : (item.quote || item.message || item.text || '')).trim(),
        author: String(parts ? (parts[1] || '') : (item.author || item.name || '')).trim(),
        role: String(parts ? (parts[2] || '') : (item.role || item.relation || '')).trim()
      };
    }).filter(function (item) { return item.quote; });
    return list.length ? list : null;
  }
  function validRules(value) {
    return delimitedRows(value).map(function (item, index) {
      var parts = partsOf(item);
      var text = parts ? parts.join(' | ') : item.text;
      return { id: item.id || index + 1, text: String(text || '').trim() };
    }).filter(function (item) { return item.text; });
  }
  function validPrograms(value) {
    return delimitedRows(value).map(function (item, index) {
      var parts = partsOf(item);
      return {
        id: item.id || index + 1,
        name: String(parts ? (parts[0] || '') : (item.name || item.title || '')).trim(),
        note: String(parts ? parts.slice(1).join(' | ') : (item.note || item.description || '')).trim()
      };
    }).filter(function (item) { return item.name || item.note; });
  }
  function merged(info) {
    var out = Object.assign({}, DEFAULT, info || {});
    var normalizedStats = validStats(out.stats);
    var normalizedCourses = validCourses(out.courses);
    var normalizedTestimonials = validTestimonials(out.testimonials);
    out.stats = normalizedStats || JSON.parse(JSON.stringify(DEFAULT.stats));
    out.courses = normalizedCourses || JSON.parse(JSON.stringify(DEFAULT.courses));
    out.testimonials = normalizedTestimonials || JSON.parse(JSON.stringify(DEFAULT.testimonials));
    ['whyItems', 'scheduleRows', 'scheduleHeaders'].forEach(function (key) {
      if (!Array.isArray(out[key]) || !out[key].length) out[key] = JSON.parse(JSON.stringify(DEFAULT[key]));
    });
    if (!String(out.coursesTitle || '').trim()) out.coursesTitle = DEFAULT.coursesTitle;
    if (!String(out.testimonialsTitle || '').trim()) out.testimonialsTitle = DEFAULT.testimonialsTitle;
    return out;
  }
  function setText(selector, text) {
    var el = document.querySelector(selector);
    if (el) el.textContent = text == null ? '' : text;
  }
  function setHrefText(selector, text) {
    var el = document.querySelector(selector);
    if (el) { el.textContent = text == null ? '' : text; el.href = '#' + selector.replace('#', ''); }
  }
  function heading(section, text) {
    var el = document.querySelector(section + ' .heading h2');
    if (el) el.textContent = text || '';
  }
  function revealRendered(container) {
    if (!container) return;
    // API response-এর পরে inject হওয়া card-গুলোকে observer callback-এর
    // জন্য অপেক্ষা করিয়ে অদৃশ্য রাখা যাবে না। Observer পরে থাকলেও
    // content সঙ্গে সঙ্গে দেখা যাবে।
    container.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('in');
    });
  }

  function renderHero(slides) {
    var banner = document.getElementById('home');
    if (!banner) return;
    var list = (Array.isArray(slides) && slides.length ? slides : FALLBACK_IMAGES.map(function (image, i) { return { image: image, title: '', subtitle: '', alt: 'মাদরাসার শিক্ষা কার্যক্রম ' + (i + 1) }; }))
      .filter(function (s) { return s && s.enabled !== false; });
    if (!list.length) list = [{ image: FALLBACK_IMAGES[0], alt: 'মাদরাসার শিক্ষা কার্যক্রম' }];
    banner.innerHTML = list.map(function (slide, i) {
      var image = safeUrl(slide.image, FALLBACK_IMAGES[i % FALLBACK_IMAGES.length]);
      return '<div class="hero-slide' + (i === 0 ? ' active' : '') + '">' +
        '<img src="' + esc(image) + '" alt="' + esc(slide.alt || 'মাদরাসার শিক্ষা কার্যক্রম') + '" loading="' + (i ? 'lazy' : 'eager') + '">' +
        ((slide.title || slide.subtitle) ? '<div class="nq-hero-copy"><strong>' + esc(slide.title) + '</strong><span>' + esc(slide.subtitle) + '</span></div>' : '') +
        '</div>';
    }).join('') + '<div class="hero-dots" id="heroDots">' + list.map(function (_, i) {
      return '<button class="hero-dot' + (i === 0 ? ' active' : '') + '" data-slide="' + i + '" aria-label="স্লাইড ' + (i + 1) + '"></button>';
    }).join('') + '</div>';
    var active = 0;
    var heroSlides = banner.querySelectorAll('.hero-slide');
    var dots = banner.querySelectorAll('.hero-dot');
    function goTo(index) {
      heroSlides[active].classList.remove('active'); dots[active].classList.remove('active');
      active = (index + heroSlides.length) % heroSlides.length;
      heroSlides[active].classList.add('active'); dots[active].classList.add('active');
    }
    dots.forEach(function (dot, i) { dot.addEventListener('click', function () { goTo(i); }); });
    if (heroSlides.length > 1) setInterval(function () { goTo(active + 1); }, 5000);
  }

  function renderExtras(info, rules, programs) {
    var old = document.getElementById('nqCmsExtras');
    if (old) old.remove();
    if (!info.intro && !info.dirMsg && !(rules && rules.length) && !(programs && programs.length)) return;
    var wrap = document.createElement('section');
    wrap.id = 'nqCmsExtras'; wrap.className = 'nq-cms-extras';
    var html = '';
    if (info.intro) html += '<article><h2>আমাদের পরিচিতি</h2><p>' + esc(info.intro).replace(/\n/g, '<br>') + '</p>' + (info.verse ? '<blockquote>“' + esc(info.verse) + '”<small>' + esc(info.verseSrc) + '</small></blockquote>' : '') + '</article>';
    if (info.dirMsg) html += '<article class="nq-director">' + (info.dirPhoto ? '<img src="' + esc(safeUrl(info.dirPhoto)) + '" alt="' + esc(info.dirName) + '">' : '') + '<div><h2>' + esc(info.dirName || 'পরিচালকের বাণী') + '</h2><small>' + esc(info.dirTitle) + '</small><p>' + esc(info.dirMsg).replace(/\n/g, '<br>') + '</p></div></article>';
    if ((rules && rules.length) || (programs && programs.length)) html += '<article><h2>ভর্তি তথ্য</h2><div class="nq-admission-grid">' + (rules && rules.length ? '<div><h3>ভর্তি নির্দেশিকা</h3><ul>' + rules.map(function (r) { return '<li>' + esc(r.text || r) + '</li>'; }).join('') + '</ul></div>' : '') + (programs && programs.length ? '<div><h3>শাখা / বিভাগ</h3><ul>' + programs.map(function (p) { return '<li><strong>' + esc(p.name) + '</strong><span>' + esc(p.note) + '</span></li>'; }).join('') + '</ul></div>' : '') + '</div></article>';
    wrap.innerHTML = html;
    var hero = document.getElementById('home');
    if (hero) hero.parentNode.insertBefore(wrap, hero.nextSibling);
  }

  function renderContactForm(info) {
    var contactInfo = document.querySelector('#contact .contact-info');
    if (!contactInfo || !info.formTitle) return;
    var old = document.getElementById('nqContactForm');
    if (old) old.remove();
    var form = document.createElement('form');
    form.id = 'nqContactForm'; form.className = 'nq-contact-form';
    form.innerHTML = '<h3>' + esc(info.formTitle) + '</h3><input name="name" required placeholder="' + esc(info.formName) + '"><input name="email" type="email" placeholder="' + esc(info.formEmail) + '"><input name="phone" placeholder="' + esc(info.formPhone) + '"><textarea name="message" required rows="4" placeholder="' + esc(info.formMessage) + '"></textarea><button class="btn btn-grad" type="submit">' + esc(info.formSubmit) + '</button><div class="nq-form-status" aria-live="polite"></div>';
    contactInfo.appendChild(form);
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var status = form.querySelector('.nq-form-status');
      status.textContent = 'পাঠানো হচ্ছে...';
      var body = Object.fromEntries(new FormData(form).entries());
      var api = (window.APP_CONFIG && window.APP_CONFIG.API_BASE) || '';
      fetch(api + '/api/public/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(function (response) { return response.json().catch(function () { return {}; }).then(function (data) { if (!response.ok) throw new Error(data.message || 'বার্তা পাঠানো যায়নি'); return data; }); })
        .then(function () { status.textContent = 'আপনার বার্তা পাঠানো হয়েছে। ধন্যবাদ।'; form.reset(); })
        .catch(function (error) { status.textContent = error.message || 'বার্তা পাঠানো যায়নি।'; });
    });
  }

  function render(info, slides, rules, programs) {
    info = merged(info);
    rules = validRules(rules);
    programs = validPrograms(programs);
    document.title = info.seoTitle || (info.brandName + ' | কুরআন ও আধুনিক শিক্ষার সমন্বয়');
    var description = document.querySelector('meta[name="description"]');
    if (description && info.seoDescription) description.setAttribute('content', info.seoDescription);
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', document.title);
    var ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription && info.seoDescription) ogDescription.setAttribute('content', info.seoDescription);
    var logo = document.querySelector('.nav-logo img');
    if (logo) { logo.src = safeUrl(info.logoUrl, './icons/icon-192.png'); logo.alt = info.brandName; }
    setText('.nav-links a[href="#home"]', info.navHome); setText('.nav-links a[href="#courses"]', info.navCourses);
    setText('.nav-links a[href="#schedule"]', info.navSchedule); setText('.nav-links a[href="#testimonials"]', info.navTestimonials);
    setText('.nav-links a[href="#contact"]', info.navContact); setText('.nav-btn-admit', info.navAdmission);
    heading('#why', info.whyTitle); heading('#courses', info.coursesTitle); heading('#schedule', info.scheduleTitle); heading('#testimonials', info.testimonialsTitle);
    var whyList = document.querySelector('#why .check-list');
    if (whyList) whyList.innerHTML = info.whyItems.map(function (item) { return '<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 13l4 4L19 7"/></svg>' + esc(item) + '</li>'; }).join('');
    var stats = document.querySelector('#why .stat-grid');
    if (stats) stats.innerHTML = info.stats.map(function (item, i) { return '<div class="stat-card' + (i === info.stats.length - 1 && i > 3 ? ' wide' : '') + '"><div class="num" data-count="' + (parseInt(item.count, 10) || 0) + '">' + (parseInt(item.count, 10) || 0) + '</div><div class="label">' + esc(item.label) + '</div></div>'; }).join('');
     var courses = document.querySelector('#courses .course-grid');
     if (courses) {
       courses.innerHTML = info.courses.map(function (course) { return '<div class="course-card reveal"><div class="course-top"><span class="course-tag">' + esc(course.tag) + '</span><span class="course-fee">' + esc(course.fee) + '</span></div><h3>' + esc(course.title) + '</h3><p>' + esc(course.description) + '</p></div>'; }).join('');
       revealRendered(courses);
     }
    var table = document.querySelector('#schedule table');
    if (table) table.innerHTML = '<thead><tr>' + info.scheduleHeaders.slice(0, 4).map(function (head) { return '<th>' + esc(head) + '</th>'; }).join('') + '</tr></thead><tbody>' + info.scheduleRows.map(function (row) { return '<tr>' + row.slice(0, 4).map(function (cell, i) { return '<td' + (i === 1 ? ' class="batch"' : '') + '>' + esc(cell) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody>';
     var testimonials = document.querySelector('#testimonials .testi-grid');
     if (testimonials) {
       testimonials.innerHTML = info.testimonials.map(function (item) { return '<div class="testi-card reveal"><span class="quote">“' + esc(item.quote) + '”</span><span class="author">' + esc(item.author) + '</span><span class="role">' + esc(item.role) + '</span></div>'; }).join('');
       revealRendered(testimonials);
     }
    setText('#contact .contact-info h3', info.contactTitle);
    var lines = document.querySelectorAll('#contact .contact-info .info-line span');
    if (lines[0]) lines[0].textContent = 'ঠিকানা: ' + info.address;
    if (lines[1]) lines[1].textContent = 'ফোন: ' + info.phone;
    if (lines[2]) lines[2].textContent = 'ইমেইল: ' + info.email;
    var map = document.querySelector('#contact .map-frame iframe');
    if (map) map.src = safeUrl(info.mapUrl, DEFAULT.mapUrl);
    setText('#contact .contact-info > div a.btn', info.contactButton); setText('#contact .copyright', info.footerText);
    renderHero(slides); renderExtras(info, rules, programs); renderContactForm(info);
    // CMS থেকে নতুন elements inject হলে counter ও reveal observer পুনরায় চালু করা
    reinitObservers();
  }

  function animateCounter(el) {
    if (!el || el.dataset.counterDone === 'true') return;
    el.dataset.counterDone = 'true';
    var target = parseInt(toEnglishDigits(el.dataset.count), 10) || 0;
    var cur = 0;
    var step = Math.max(1, Math.round(target / 50));
    var frame = window.requestAnimationFrame || function (callback) { return window.setTimeout(callback, 16); };
    function tick() {
      cur += step;
      if (cur >= target) { el.textContent = target; return; }
      el.textContent = cur;
      frame(tick);
    }
    el.textContent = target === 0 ? '0' : '0';
    tick();
  }
  function reinitObservers() {
    // Render-এর পরে নতুন করে তৈরি হওয়া counter-গুলোও চালু হবে। পুরনো
    // inline observer-এর উপর নির্ভর করা হয় না, তাই API response এলেও সংখ্যা
    // আর ০-তে আটকে থাকে না।
    var counters = document.querySelectorAll('.stat-card .num');
    if (counters.length && 'IntersectionObserver' in window) {
      var cObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            cObs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      counters.forEach(function (c) { cObs.observe(c); });
    } else {
      counters.forEach(animateCounter);
    }
    // reveal animation
    var reveals = document.querySelectorAll('.reveal:not(.in)');
    if (reveals.length && 'IntersectionObserver' in window) {
      var rObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            rObs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      reveals.forEach(function (el) { rObs.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add('in'); });
    }
  }

  function load() {
    var api = (window.APP_CONFIG && window.APP_CONFIG.API_BASE) || '';
    var request = window.NQ_API && window.NQ_API.fetch ? window.NQ_API.fetch('/api/public/site', { cache: 'no-store' }, { retries: 1, timeout: 20000 }) : fetch(api + '/api/public/site', { cache: 'no-store' });
    request.then(function (response) { if (!response.ok) throw new Error('content unavailable'); return response.json(); })
      .then(function (data) { render(data.siteInfo, data.siteSlides, data.siteRules, data.siteProgs); })
      .catch(function () { /* static HTML fallback remains usable */ });
  }
  var cmsStyle = document.createElement('style');
  cmsStyle.textContent = '.nq-hero-copy{position:absolute;left:7%;bottom:52px;z-index:4;display:flex;flex-direction:column;gap:4px;color:#fff;text-shadow:0 2px 8px #000}.nq-hero-copy strong{font-size:clamp(1.2rem,3vw,2.3rem)}.nq-hero-copy span{font-size:clamp(.85rem,1.6vw,1.1rem)}.nq-cms-extras{background:#0e0e11;color:#fff;padding:54px max(24px,calc((100% - 1240px)/2));display:grid;gap:18px}.nq-cms-extras article{background:#111114;border:1px solid rgba(236,26,110,.35);border-radius:12px;padding:24px}.nq-cms-extras h2{color:#ffd21a;margin:0 0 12px}.nq-cms-extras h3{color:#ff8a2b;margin:0 0 8px}.nq-cms-extras p{color:#ddd;line-height:1.9;white-space:normal}.nq-cms-extras blockquote{border-left:3px solid #ff2d55;padding:8px 14px;color:#ffd21a;margin:18px 0 0}.nq-cms-extras blockquote small{display:block;color:#aaa;margin-top:5px}.nq-director{display:flex;gap:22px;align-items:flex-start}.nq-director img{width:110px;height:110px;object-fit:cover;border-radius:50%;border:2px solid #ff2d55}.nq-director small{color:#aaa}.nq-admission-grid{display:grid;grid-template-columns:1fr 1fr;gap:26px}.nq-admission-grid ul{margin:0;padding-left:20px;color:#ddd;line-height:1.9}.nq-admission-grid li span{display:block;color:#aaa;font-size:.9em}.nq-contact-form{display:grid;gap:10px;margin-top:28px;max-width:520px}.nq-contact-form h3{margin:0 0 4px}.nq-contact-form input,.nq-contact-form textarea{background:#111114;color:#fff;border:1px solid rgba(236,26,110,.35);border-radius:7px;padding:11px 12px;font:inherit}.nq-form-status{color:#ffd21a;font-size:.9rem;min-height:20px}@media(max-width:650px){.nq-director{flex-direction:column}.nq-admission-grid{grid-template-columns:1fr}}';
  document.head.appendChild(cmsStyle);
  load();
})();