/*
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  ZUNEXA — ARCHON AI · SEO KEYWORDS ENGINE                        ║
 * ║  الهدف: حقن meta keywords + JSON-LD + Open Graph ديناميكياً     ║
 * ║  للرفع من ظهور الموقع فـ Google / Bing / محركات البحث           ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */
(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════════
     § 1 — بنك الكلمات المفتاحية (عربي / دارجة / فرنسي / إنجليزي)
  ═══════════════════════════════════════════════════════════════ */
  const KEYWORDS_AR = [
    'زونيكسا', 'زونيكسا AI', 'ذكاء اصطناعي مغربي', 'شات بوت عربي',
    'مساعد ذكاء اصطناعي مجاني', 'دردشة ذكاء اصطناعي', 'روبوت محادثة عربي',
    'ذكاء اصطناعي بدون مفتاح API', 'أرشون AI', 'محرك زونيكسا العصبي',
    'ذكاء اصطناعي مجاني بالعربية', 'مساعد افتراضي مغربي', 'شات جي بي تي عربي بديل',
    'أداة ذكاء اصطناعي مجانية', 'ذكاء اصطناعي للطلاب', 'مساعد كتابة بالعربية',
    'ذكاء اصطناعي بدون تسجيل', 'روبوت دردشة مغربي', 'تطبيق ذكاء اصطناعي مغربي',
    'ذكاء اصطناعي حل المسائل الرياضية', 'مساعد ذكي للمبرمجين', 'ذكاء اصطناعي للبرمجة',
    'تحليل ملفات PDF بالذكاء الاصطناعي', 'تحليل ملفات Word بالذكاء الاصطناعي',
    'ذكاء اصطناعي يحلل الاكسل', 'أفضل بديل شات جي بي تي مجاني', 'ذكاء اصطناعي 2026',
  ];

  const KEYWORDS_DARIJA = [
    'zwin ai maghribi', 'chat ai bla flouss', 'dial ai maghribi',
    'assistant dyal chat b darija', 'ai machi khassha internet',
    'zunexa chat bot maghribi', 'ai kayjaweb b darija', 'app dial ai mjania',
    'khdem b ai bla ma tsajel', 'archon ai maghrib', 'ai kayhel massail',
  ];

  const KEYWORDS_FR = [
    'intelligence artificielle marocaine', 'chatbot IA gratuit', 'assistant IA en arabe',
    'IA sans clé API', 'alternative gratuite à ChatGPT', 'IA pour étudiants',
    'assistant virtuel marocain', 'moteur neuronal Zunexa', 'IA conversationnelle',
    'chatbot en ligne gratuit', 'IA pour rédaction', 'analyse de documents par IA',
    'IA pour programmeurs', 'intelligence artificielle 2026', 'assistant IA Maroc',
  ];

  const KEYWORDS_EN = [
    'free AI chatbot', 'Zunexa AI', 'Archon AI engine', 'Moroccan AI assistant',
    'keyless AI', 'AI without API key', 'free ChatGPT alternative', 'AI for students',
    'AI for developers', 'AI code assistant', 'AI document analysis', 'AI PDF reader',
    'conversational AI 2026', 'Arabic AI chatbot', 'neural search engine',
    'hybrid AI search', 'BM25 semantic search AI', 'offline-first AI assistant',
    'AI math solver', 'AI writing assistant', 'free virtual assistant',
    'no signup AI chat', 'AI app Morocco', 'best free AI tool 2026',
    'privacy friendly AI chatbot', 'AI powered PWA app',
  ];

  const KEYWORDS_LONGTAIL = [
    'أفضل ذكاء اصطناعي مجاني بالعربية 2026',
    'كيفاش نستعمل زونيكسا الذكاء الاصطناعي',
    'ذكاء اصطناعي بلا تسجيل ولا حساب',
    'meilleur chatbot IA gratuit en arabe 2026',
    'free AI chatbot no login required 2026',
    'best Arabic AI assistant for students',
    'ذكاء اصطناعي يحل الواجبات المدرسية',
    'AI tool to analyze Word Excel PDF files free',
  ];

  const ALL_KEYWORDS = [].concat(
    KEYWORDS_AR, KEYWORDS_DARIJA, KEYWORDS_FR, KEYWORDS_EN, KEYWORDS_LONGTAIL
  );

  /* ═══════════════════════════════════════════════════════════════
     § 2 — حقن / تحديث meta keywords
  ═══════════════════════════════════════════════════════════════ */
  function injectMetaKeywords() {
    let tag = document.querySelector('meta[name="keywords"]');
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('name', 'keywords');
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', ALL_KEYWORDS.join(', '));
  }

  function injectMetaDescription() {
    let tag = document.querySelector('meta[name="description"]');
    const desc =
      'Zunexa Archon AI — مساعد ذكاء اصطناعي مغربي مجاني وبدون تسجيل، ' +
      'يجاوب بالعربية والدارجة والفرنسية والإنجليزية، يحلل ملفات PDF وWord وExcel، ' +
      'يحل المسائل الرياضية، ويساعدك فالبرمجة. جرب أفضل بديل مجاني لـ ChatGPT.';
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('name', 'description');
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', desc);
  }

  function injectRobots() {
    let tag = document.querySelector('meta[name="robots"]');
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('name', 'robots');
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', 'index, follow, max-image-preview:large, max-snippet:-1');
  }

  /* ═══════════════════════════════════════════════════════════════
     § 3 — Open Graph + Twitter Cards
  ═══════════════════════════════════════════════════════════════ */
  function injectSocialMeta() {
    const og = {
      'og:title': 'Zunexa — Archon AI | ذكاء اصطناعي مغربي مجاني',
      'og:description': 'مساعد ذكاء اصطناعي مجاني بدون تسجيل، يجاوب بالعربية والدارجة، يحلل الملفات ويحل المسائل.',
      'og:type': 'website',
      'og:url': 'https://zunexa.vercel.app/ai.html',
      'og:site_name': 'Zunexa AI',
      'og:locale': 'ar_MA',
      'twitter:card': 'summary_large_image',
      'twitter:title': 'Zunexa — Archon AI',
      'twitter:description': 'ذكاء اصطناعي مغربي مجاني، بدون تسجيل، بدون مفتاح API.',
    };
    Object.keys(og).forEach(function (key) {
      const isTwitter = key.indexOf('twitter:') === 0;
      const selector = isTwitter
        ? 'meta[name="' + key + '"]'
        : 'meta[property="' + key + '"]';
      let tag = document.querySelector(selector);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(isTwitter ? 'name' : 'property', key);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', og[key]);
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     § 4 — JSON-LD Structured Data (Schema.org)
  ═══════════════════════════════════════════════════════════════ */
  function injectJsonLd() {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Zunexa — Archon AI',
      applicationCategory: 'ChatApplication, ArtificialIntelligenceApplication',
      operatingSystem: 'Web, Android, iOS, Windows, Linux',
      description:
        'مساعد ذكاء اصطناعي مغربي مجاني، يدعم العربية والدارجة والفرنسية والإنجليزية، ' +
        'بدون تسجيل وبدون مفتاح API، يحلل الملفات ويحل المسائل الرياضية.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      keywords: ALL_KEYWORDS.join(', '),
      inLanguage: ['ar', 'fr', 'en'],
      url: 'https://zunexa.vercel.app/ai.html',
      author: { '@type': 'Organization', name: 'Zunexa' },
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  /* ═══════════════════════════════════════════════════════════════
     § 5 — Canonical + hreflang (اختياري إذا عندك نسخ لغوية)
  ═══════════════════════════════════════════════════════════════ */
  function injectCanonical() {
    let tag = document.querySelector('link[rel="canonical"]');
    if (!tag) {
      tag = document.createElement('link');
      tag.setAttribute('rel', 'canonical');
      document.head.appendChild(tag);
    }
    tag.setAttribute('href', 'https://zunexa.vercel.app/ai.html');
  }

  /* ═══════════════════════════════════════════════════════════════
     § 6 — التشغيل التلقائي
  ═══════════════════════════════════════════════════════════════ */
  function run() {
    try { injectMetaKeywords(); } catch (e) { console.warn('[SEO] keywords fail', e); }
    try { injectMetaDescription(); } catch (e) { console.warn('[SEO] description fail', e); }
    try { injectRobots(); } catch (e) { console.warn('[SEO] robots fail', e); }
    try { injectSocialMeta(); } catch (e) { console.warn('[SEO] social fail', e); }
    try { injectJsonLd(); } catch (e) { console.warn('[SEO] json-ld fail', e); }
    try { injectCanonical(); } catch (e) { console.warn('[SEO] canonical fail', e); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  window.ZunexaSEO = { KEYWORDS: ALL_KEYWORDS, run: run };
})();
