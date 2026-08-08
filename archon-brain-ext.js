/* ═══════════════════════════════════════════════════════════════════════
   ARCHON BRAIN EXTENSION — archon-brain-ext.js
   ───────────────────────────────────────────────────────────────────────
   واش هاد الملف: طبقة إضافية مستقلة كتزيد فوق ArchonBrain الأصلي بلا ما
   تكسر حتى دالة موجودة (norm, tok, rankKB, answerLocal, answer, THRESHOLDS
   كلهم باقيين خدامين — هاد الملف كيدير override ذكي لبعضهم فقط، محسوب،
   ومربوط بـ try/catch fallback فكل مكان حساس).

   صراحة تقنية (باش ما تبقاش عندك صورة غالطة): هاد الملف كيزيد retrieval
   محلي أقوى (BM25F, Jaccard, stemming, N-grams, inverted index), حساب
   رياضي آمن (Shunting-yard بلا eval), إدارة ذاكرة/سياق أذكى, و rule-based
   intent/sentiment/NER. ماشي "نموذج لغوي" حقيقي — بلا أوزان مدربة
   (model weights) ما كاين والو إسمو "فهم عميق" فـ Vanilla JS. كل دالة هنا
   إما رياضيات محضة (BM25, cosine, Levenshtein) أو قواعد صريحة (regex,
   قواميس). هاد الفرق مهم تعرفو باش ما تبنيش عليه توقعات غالطة.

   الترتيب: التحميل ديال هاد الملف خاصو يكون بعد ما يتحمل السكريبت
   الأصلي مباشرة (بعد إغلاق </script> اللي فيه tok/norm/rankKB/answerLocal/
   answer/THRESHOLDS/ctx), قبل استدعاء init().
   مثال:
     <script src="app.js"></script>          <!-- الأصلي -->
     <script src="archon-brain-ext.js"></script>  <!-- هادشي -->
     <script>init();</script>
═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const HAS_ORIGINAL = typeof window !== 'undefined' &&
    typeof window.tok === 'function' &&
    typeof window.norm === 'function';

  if (!HAS_ORIGINAL) {
    console.warn('[ArchonExt] السكريبت الأصلي (tok/norm) ماكاينش فـ window — الإضافة غادي تخدم بموارد ذاتية معزولة.');
  }

  /* ═══════════════════════════════════════════════════════════════════
     § 1 — TOKENIZER متقدم (يدعم عربي/إنجليزي/أرقام + علامات ترقيم)
     نسخة مستقلة، أدق فتصنيف الأرقام والرموز من tok() الأصلية، تُستعمل
     داخلياً فـ BM25F والـ Math Router.
  ═══════════════════════════════════════════════════════════════════ */
  const ArchonTokenizer = (function () {
    // نطاقات Unicode: عربي أساسي + ملحقات + أرقام هندية-عربية
    const ARABIC_RANGE = '\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF';
    const LATIN_RANGE  = 'a-zA-Z';
    const DIGIT_RANGE  = '0-9\u0660-\u0669'; // لاتيني + أرقام عربية-هندية

    const ARABIC_INDIC_DIGITS = { '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9' };

    function normalizeDigits(t) {
      return t.replace(/[٠-٩]/g, d => ARABIC_INDIC_DIGITS[d] || d);
    }

    // إزالة التشكيل (diacritics) + توحيد الألف/الياء/الهاء + تطبيع الأرقام
    function deepNormalize(text) {
      if (!text) return '';
      let t = text.toString();
      t = normalizeDigits(t);
      // إزالة التشكيل العربي (فتحة، ضمة، كسرة، سكون، تنوين، شدة)
      t = t.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
      t = t.toLowerCase();
      t = t.replace(/[أإآا]/g, 'ا').replace(/ة/g, 'ه').replace(/[يى]/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي');
      // إزالة أي حرف مش عربي/لاتيني/رقم/فراغ (يشمل كل علامات الترقيم بدقة)
      const keepPattern = new RegExp(`[^${ARABIC_RANGE}${LATIN_RANGE}${DIGIT_RANGE}\\s]`, 'g');
      t = t.replace(keepPattern, ' ');
      t = t.replace(/\s+/g, ' ').trim();
      return t;
    }

    // تصنيف الرمز: كلمة عربية / كلمة لاتينية / رقم
    function classify(token) {
      if (/^[0-9]+(\.[0-9]+)?$/.test(token)) return 'number';
      if (new RegExp(`^[${ARABIC_RANGE}]+$`).test(token)) return 'arabic';
      if (new RegExp(`^[${LATIN_RANGE}]+$`).test(token)) return 'latin';
      return 'mixed';
    }

    function tokenize(text, opts) {
      opts = opts || {};
      const clean = deepNormalize(text);
      if (!clean) return [];
      let parts = clean.split(/\s+/).filter(Boolean);
      if (!opts.keepShort) parts = parts.filter(p => p.length > 1 || /^[0-9]+$/.test(p));
      return parts.map(p => ({ text: p, type: classify(p) }));
    }

    return { deepNormalize, tokenize, classify, normalizeDigits };
  })();

  /* ═══════════════════════════════════════════════════════════════════
     § 2 — STOPWORDS (عربي فصحى + دارجة + إنجليزي + فرنسي)
     مجموعة أوسع من STOP الأصلية (اللي عندها فقط core فصحى/إنجليزي).
     مستعملة فقط داخل BM25F الجديدة، وما كتبدلش STOP الأصلية.
  ═══════════════════════════════════════════════════════════════════ */
  const STOPWORDS_AR_MSA = [
    'في','من','على','إلى','عن','مع','بين','هو','هي','هم','هن','أنت','أنتم','أنا','نحن',
    'هذا','هذه','هؤلاء','ذلك','تلك','التي','الذي','الذين','ما','ماذا','هل','كيف','لماذا',
    'متى','أين','كم','أي','لا','لن','لم','قد','كان','كانت','يكون','إن','أن','إذا','لكن',
    'أو','ثم','كل','بعض','غير','دون','عند','حتى','منذ','خلال','بعد','قبل','فوق','تحت',
  ];
  const STOPWORDS_AR_DARIJA = [
    'واش','بغيت','ديال','ديالي','ديالك','فين','علاش','كيفاش','دابا','غادي','باش','حيت',
    'بزاف','شوية','مزيان','ماشي','راه','هاد','هادي','هاكا','ليك','ليا','ليه','معاك','معايا',
    'كاين','كاينة','بحال','زعما','والو','شحال','وخا','يالله','خاصني','خاصك',
  ];
  const STOPWORDS_EN = [
    'the','is','are','a','an','to','of','and','or','in','it','that','this','was','were',
    'be','been','being','have','has','had','do','does','did','will','would','shall','should',
    'can','could','may','might','must','i','you','he','she','we','they','what','which','who',
    'whom','when','where','why','how','with','for','on','at','by','from','as','if','but',
  ];
  const STOPWORDS_FR = [
    'le','la','les','un','une','des','de','du','et','ou','à','au','aux','ce','cette','ces',
    'est','sont','était','être','avoir','ai','as','a','avons','avez','ont','que','qui','quoi',
    'où','quand','comment','pourquoi','pour','avec','par','sur','dans','sans','mais',
  ];
  const STOPWORDS_ALL = new Set([
    ...STOPWORDS_AR_MSA, ...STOPWORDS_AR_DARIJA, ...STOPWORDS_EN, ...STOPWORDS_FR
  ].map(w => ArchonTokenizer.deepNormalize(w)));

  function removeStopwords(tokens) {
    return tokens.filter(t => !STOPWORDS_ALL.has(typeof t === 'string' ? t : t.text));
  }

  /* ═══════════════════════════════════════════════════════════════════
     § 3 — STEMMER مبسط (عربي + إنجليزي)
     تنبيه صريح: هادي light stemmer بقواعد ثابتة (affix stripping)، ماشي
     root-extraction لغوي حقيقي (بحال ISRI أو Khoja stemmer الأكاديميين).
     كافية باش "يعملون"→"عمل"، "المطورين"→"طور"، لكن غادي تخطئ فحالات
     معقدة (الأفعال المعتلة، الجموع الغير قياسية). هدفها تحسين recall
     ديال البحث المحلي، ماشي تحليل صرفي دقيق 100%.
  ═══════════════════════════════════════════════════════════════════ */
  const ArabicStemmer = (function () {
    // بادئات شائعة (بالترتيب من الأطول للأقصر باش ما ناخدوش جزء غالط)
    const PREFIXES = [
      'وال','بال','كال','فال', // و/ب/ك/ف + ال
      'ال', 'وا','فا','با','كا',
      'است','مست',
      'سي','سا','سو',
      'ي','ت','ن','أ','ا','و','ف','ب','ك','ل',
    ];
    // لواحق شائعة (جموع، ضمائر متصلة، تصريف)
    const SUFFIXES = [
      'ياتهم','ياتكم','ياتنا',
      'ونها','ونهم','اتها','اتهم','اتكم','اتنا','انها','انهم',
      'تين','ين','ون','ات','ية','يه','ها','هم','هن','كم','كن','نا','ني','ك','ه',
      'ة','ه','ا','ي','ت','ن',
    ];

    function stem(word) {
      if (!word || word.length <= 3) return word; // كلمات قصيرة: ما نلمسوهاش
      let w = word;

      // إزالة بادئة واحدة أطول match (لا تكرر أكثر من مرة باش ما نخسروش الكلمة)
      for (const p of PREFIXES) {
        if (w.length - p.length >= 3 && w.startsWith(p)) {
          w = w.slice(p.length);
          break;
        }
      }
      // إزالة لاحقة واحدة أطول match
      for (const s of SUFFIXES) {
        if (w.length - s.length >= 3 && w.endsWith(s)) {
          w = w.slice(0, w.length - s.length);
          break;
        }
      }
      return w.length >= 2 ? w : word; // حماية: ما نرجعوش كلمة فاضية/حرف واحد
    }

    return { stem };
  })();

  const EnglishStemmer = (function () {
    // Porter-lite: قواعد أساسية فقط (step 1 من خوارزمية Porter الأصلية)
    const STEP1_RULES = [
      [/sses$/, 'ss'], [/ies$/, 'i'], [/ss$/, 'ss'], [/s$/, ''],
    ];
    const STEP2_RULES = [
      [/eed$/, 'ee'], [/ed$/, ''], [/ing$/, ''],
    ];
    const STEP3_RULES = [
      [/ational$/, 'ate'], [/tional$/, 'tion'], [/ization$/, 'ize'],
      [/fulness$/, 'ful'], [/ousness$/, 'ous'], [/iveness$/, 'ive'],
      [/aliti$/, 'al'], [/iviti$/, 'ive'], [/biliti$/, 'ble'],
    ];

    function stem(word) {
      if (!word || word.length <= 3) return word;
      let w = word.toLowerCase();
      for (const [re, rep] of STEP1_RULES) { if (re.test(w) && w.length - w.replace(re,rep).length <= 2) { w = w.replace(re, rep); break; } }
      for (const [re, rep] of STEP2_RULES) { if (re.test(w)) { w = w.replace(re, rep); break; } }
      for (const [re, rep] of STEP3_RULES) { if (re.test(w)) { w = w.replace(re, rep); break; } }
      return w.length >= 2 ? w : word;
    }
    return { stem };
  })();

  function stemToken(token) {
    if (!token) return token;
    if (/^[a-z]+$/i.test(token)) return EnglishStemmer.stem(token);
    if (/[\u0600-\u06FF]/.test(token)) return ArabicStemmer.stem(token);
    return token;
  }

  /* ═══════════════════════════════════════════════════════════════════
     § 4 — N-GRAMS (Bigrams / Trigrams)
     bigrams() ديال الأصلي كاينة وباقية خدامة — هادي زيادة تدعم trigrams
     وتشتغل على أي array of strings (ماشي مربوطة بـ tok() الأصلية).
  ═══════════════════════════════════════════════════════════════════ */
  function ngrams(tokens, n) {
    const out = [];
    if (!tokens || tokens.length < n) return out;
    for (let i = 0; i <= tokens.length - n; i++) {
      out.push(tokens.slice(i, i + n).join('_'));
    }
    return out;
  }
  function extractBigrams(tokens)  { return ngrams(tokens, 2); }
  function extractTrigrams(tokens) { return ngrams(tokens, 3); }

  /* ═══════════════════════════════════════════════════════════════════
     § 5 — LEVENSHTEIN + FUZZY MATCH (مستقل، Damerau-aware اختياري)
     levenshtein() الأصلية باقية موجودة فالكود الرئيسي وكتخدم فـ
     fuzzyTokenScore(). هادي نسخة بمساحة ذاكرة O(min(a,b)) بدل O(b) —
     تحسين بسيط للأداء على الجهاز الضعيف (i3, 8GB, HDD) عند نصوص طويلة.
  ═══════════════════════════════════════════════════════════════════ */
  function levenshteinFast(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    if (a.length > b.length) { const t = a; a = b; b = t; } // نضمنو a هي الأقصر
    let prev = new Array(a.length + 1);
    for (let i = 0; i <= a.length; i++) prev[i] = i;
    for (let j = 1; j <= b.length; j++) {
      let cur = [j];
      for (let i = 1; i <= a.length; i++) {
        cur[i] = a[i-1] === b[j-1] ? prev[i-1] : 1 + Math.min(prev[i-1], prev[i], cur[i-1]);
      }
      prev = cur;
    }
    return prev[a.length];
  }

  function fuzzyMatchWord(word, dictionary, maxDistance) {
    maxDistance = maxDistance || 2;
    let best = null, bestDist = Infinity;
    for (const cand of dictionary) {
      if (Math.abs(cand.length - word.length) > maxDistance) continue; // pruning سريع
      const d = levenshteinFast(word, cand);
      if (d < bestDist) { bestDist = d; best = cand; }
      if (bestDist === 0) break;
    }
    return bestDist <= maxDistance ? { match: best, distance: bestDist } : null;
  }

  /* ═══════════════════════════════════════════════════════════════════
     § 6 — INVERTED INDEX
     خريطة: token → [indices ديال عناصر KB اللي فيهم هاد التوكن].
     كتبنى مرة وحدة عند تحميل KB (buildInvertedIndex)، وكتُستعمل باش
     rankKB الجديدة ما تديرش scan على كل KB لكل سؤال — غير على المرشحين
     اللي فعلاً فيهم تقاطع مع كلمات السؤال. تسريع حقيقي فالبحث الكبير.
  ═══════════════════════════════════════════════════════════════════ */
  let INVERTED_INDEX = new Map();   // token -> Set<docIndex>
  let INDEXED_DOCS   = [];          // نسخة من KB وقت البناء (لاكتشاف التغيير)
  let DOC_LENGTHS    = [];          // طول كل وثيقة (بعدد التوكنات) — لـ BM25
  let AVG_DOC_LENGTH = 0;

  function tokenizeForIndex(text) {
    const raw = ArchonTokenizer.tokenize(text || '').map(t => t.text);
    const noStop = removeStopwords(raw);
    return noStop.map(stemToken);
  }

  function buildInvertedIndex(docs) {
    INVERTED_INDEX = new Map();
    DOC_LENGTHS = [];
    INDEXED_DOCS = docs;
    let totalLen = 0;

    docs.forEach((doc, idx) => {
      const text = (doc.q || '') + ' ' + (Array.isArray(doc.kw) ? doc.kw.join(' ') : '') + ' ' + (doc.a || '');
      const tokens = tokenizeForIndex(text);
      DOC_LENGTHS[idx] = tokens.length || 1;
      totalLen += DOC_LENGTHS[idx];

      const seen = new Set();
      tokens.forEach(t => {
        if (seen.has(t)) return;
        seen.add(t);
        if (!INVERTED_INDEX.has(t)) INVERTED_INDEX.set(t, new Set());
        INVERTED_INDEX.get(t).add(idx);
      });
    });

    AVG_DOC_LENGTH = docs.length ? totalLen / docs.length : 1;
    return { size: INVERTED_INDEX.size, docs: docs.length, avgLen: AVG_DOC_LENGTH };
  }

  // يرجع مجموعة indices ديال الوثائق اللي فيهم على الأقل توكن واحد مشترك
  // مع السؤال — هادي اللي كتخلي rankKB ما تفوتش على كل KB سطر بسطر.
  function candidateDocIndices(queryTokens) {
    const out = new Set();
    queryTokens.forEach(t => {
      const bucket = INVERTED_INDEX.get(t);
      if (bucket) bucket.forEach(i => out.add(i));
    });
    return out;
  }

  /* ═══════════════════════════════════════════════════════════════════
     § 7 — BM25F (multi-field: q له وزن أعلى من kw وأعلى من a)
     BM25F = BM25 مع دمج عدة حقول (fields) بأوزان مختلفة قبل حساب الـ
     term frequency، بدل ما ندمجو النص كامل فحقل واحد كيف TF-IDF الكلاسيكي.
  ═══════════════════════════════════════════════════════════════════ */
  const BM25_PARAMS = {
    k1: 1.5,   // تحكم فتشبع term frequency (كل ما زاد التكرار، الفائدة الإضافية كتقل)
    b: 0.75,   // تحكم فتطبيع طول الوثيقة (0 = بلا تطبيع، 1 = تطبيع كامل)
    fieldWeights: { q: 3.0, kw: 2.0, a: 1.0 }, // "F" فـ BM25F: وزن كل حقل
  };

  function bm25fScore(queryTokens, doc, idfMap) {
    if (!queryTokens.length) return 0;

    const fields = {
      q:  tokenizeForIndex(doc.q || ''),
      kw: tokenizeForIndex(Array.isArray(doc.kw) ? doc.kw.join(' ') : ''),
      a:  tokenizeForIndex((doc.a || '').slice(0, 300)), // نحدو الطول باش النص الطويل ما يخنقش الوزن
    };

    // pseudo-frequency مرجحة: كل ظهور فحقل معين كيتحسب بوزن الحقل
    const weightedTF = {};
    let weightedDocLen = 0;
    Object.keys(fields).forEach(fieldName => {
      const w = BM25_PARAMS.fieldWeights[fieldName] || 1;
      fields[fieldName].forEach(tk => { weightedTF[tk] = (weightedTF[tk] || 0) + w; });
      weightedDocLen += fields[fieldName].length * w;
    });

    const avgWeightedLen = AVG_DOC_LENGTH * ((BM25_PARAMS.fieldWeights.q + BM25_PARAMS.fieldWeights.kw + BM25_PARAMS.fieldWeights.a) / 3);
    const { k1, b } = BM25_PARAMS;

    let score = 0;
    queryTokens.forEach(qt => {
      const tf = weightedTF[qt] || 0;
      if (!tf) return;
      const idf = idfMap[qt] !== undefined ? idfMap[qt] : 0.5;
      const numerator = tf * (k1 + 1);
      const denominator = tf + k1 * (1 - b + b * (weightedDocLen / (avgWeightedLen || 1)));
      score += idf * (numerator / (denominator || 1));
    });
    return score;
  }

  function buildBM25IDF(docs) {
    const df = {}, N = docs.length || 1;
    docs.forEach(doc => {
      const text = (doc.q || '') + ' ' + (Array.isArray(doc.kw) ? doc.kw.join(' ') : '');
      const uniqTokens = new Set(tokenizeForIndex(text));
      uniqTokens.forEach(t => { df[t] = (df[t] || 0) + 1; });
    });
    const idf = {};
    // BM25 IDF classique (Robertson-Sparck Jones), مضمون موجب بـ +1
    Object.keys(df).forEach(t => {
      idf[t] = Math.log(1 + (N - df[t] + 0.5) / (df[t] + 0.5));
    });
    return idf;
  }

  /* ═══════════════════════════════════════════════════════════════════
     § 8 — JACCARD INDEX (fallback مباشر عند فشل/ضعف BM25/Cosine)
  ═══════════════════════════════════════════════════════════════════ */
  function jaccardIndex(setA, setB) {
    if (!setA.size && !setB.size) return 0;
    let inter = 0;
    setA.forEach(x => { if (setB.has(x)) inter++; });
    const union = setA.size + setB.size - inter;
    return union > 0 ? inter / union : 0;
  }

  /* ═══════════════════════════════════════════════════════════════════
     § 9 — SPARSE COSINE (مُحسّن للذاكرة — كيدور غير على المفاتيح
     المشتركة فعلاً بدل union ديال كل المفاتيح، مفيد مع BM25/TF-IDF
     vectors طويلة على جهاز بموارد محدودة)
  ═══════════════════════════════════════════════════════════════════ */
  function sparseCosine(vecA, vecB) {
    const keysA = Object.keys(vecA), keysB = Object.keys(vecB);
    if (!keysA.length || !keysB.length) return 0;
    // كنكررو غير على المفتاح الأقصر باش نقلصو التكرار
    const [small, big] = keysA.length <= keysB.length ? [vecA, vecB] : [vecB, vecA];
    let dot = 0;
    Object.keys(small).forEach(k => { if (big[k] !== undefined) dot += small[k] * big[k]; });
    let na = 0, nb = 0;
    Object.values(vecA).forEach(v => { na += v * v; });
    Object.values(vecB).forEach(v => { nb += v * v; });
    return (!na || !nb) ? 0 : dot / (Math.sqrt(na) * Math.sqrt(nb));
  }

  /* ═══════════════════════════════════════════════════════════════════
     § 10 — DYNAMIC THRESHOLDING
     العتبة (score لازم يفوتها الجواب باش يتقبل) كتتغير حسب:
       - طول السؤال (سؤال قصير = عتبة أعلى، لأن التطابق العرضي أسهل)
       - ندرة كلمات السؤال (كلمات نادرة = عتبة أخفض، لأن التطابق أدق)
  ═══════════════════════════════════════════════════════════════════ */
  function dynamicThreshold(baseThreshold, queryTokens, idfMap) {
    if (!queryTokens.length) return baseThreshold;

    // معامل الطول: سؤال من كلمة/كلمتين → عتبة أعلى بـ 40% (تجنب false positive)
    const lengthFactor = queryTokens.length <= 2 ? 1.4
                        : queryTokens.length <= 4 ? 1.15
                        : queryTokens.length >= 10 ? 0.9
                        : 1.0;

    // معامل الندرة: متوسط IDF كلمات السؤال — IDF عالي (كلمة نادرة) = عتبة أخفض
    const idfs = queryTokens.map(t => idfMap[t] !== undefined ? idfMap[t] : 0.5);
    const avgIdf = idfs.reduce((a, b) => a + b, 0) / idfs.length;
    const rarityFactor = avgIdf > 2.5 ? 0.85 : avgIdf > 1.5 ? 0.95 : 1.05;

    return baseThreshold * lengthFactor * rarityFactor;
  }

  /* ═══════════════════════════════════════════════════════════════════
     § 11 — HYBRID SCORING السطر النهائي: BM25F + Cosine + Jaccard + Fuzzy
     نسخة موسعة من rankKB الأصلية، بنفس بنية الإخراج (نفس shape ديال
     الكائنات) باش تبقى متوافقة 100% مع answerLocal() و answer() بلا ما
     نلمس حتى سطر فيهم.
  ═══════════════════════════════════════════════════════════════════ */
  let BM25_IDF = {};
  let LAST_KB_REF = null;

  function ensureIndexFresh(kb) {
    if (LAST_KB_REF !== kb || INDEXED_DOCS.length !== kb.length) {
      buildInvertedIndex(kb);
      BM25_IDF = buildBM25IDF(kb);
      LAST_KB_REF = kb;
    }
  }

  function hybridRankKB(userQ, kb, thresholds) {
    if (!kb || !kb.length) return [];
    ensureIndexFresh(kb);

    const qTokensRaw = ArchonTokenizer.tokenize(userQ).map(t => t.text);
    const qTokensNoStop = removeStopwords(qTokensRaw);
    const qTokensStemmed = qTokensNoStop.map(stemToken);
    if (!qTokensStemmed.length) return [];

    const qSet = new Set(qTokensStemmed);
    const qBi  = new Set(extractBigrams(qTokensStemmed));
    const qTri = new Set(extractTrigrams(qTokensStemmed));

    // TF-IDF vector خفيف باش نستعملو فـ cosine (مبني فوق نفس IDF ديال BM25)
    const qVec = {};
    qTokensStemmed.forEach(t => { qVec[t] = (qVec[t] || 0) + 1; });
    Object.keys(qVec).forEach(t => { qVec[t] = qVec[t] * (BM25_IDF[t] || 0.5); });

    const candidates = candidateDocIndices(qTokensStemmed);
    const minScore = dynamicThreshold(thresholds.MIN_CANDIDATE_SCORE, qTokensStemmed, BM25_IDF);
    const scored = [];

    candidates.forEach(idx => {
      const item = kb[idx];
      if (!item || !item.a) return;

      const docTextRaw = (item.q || '') + ' ' + (Array.isArray(item.kw) ? item.kw.join(' ') : '');
      const dTokensRaw = ArchonTokenizer.tokenize(docTextRaw).map(t => t.text);
      const dTokensStemmed = removeStopwords(dTokensRaw).map(stemToken);
      const dSet = new Set(dTokensStemmed);
      const dBi  = new Set(extractBigrams(dTokensStemmed));
      const dTri = new Set(extractTrigrams(dTokensStemmed));

      // 1) BM25F — العمود الفقري (وزن 0.45)
      const bm25Raw = bm25fScore(qTokensStemmed, item, BM25_IDF);
      const bm25Norm = 1 - Math.exp(-bm25Raw / 3); // ضغط لمجال [0,1) تقريبي (saturating)

      // 2) Cosine (sparse) — تقارب موضوعي عام (وزن 0.20)
      const dVec = {};
      dTokensStemmed.forEach(t => { dVec[t] = (dVec[t] || 0) + 1; });
      Object.keys(dVec).forEach(t => { dVec[t] = dVec[t] * (BM25_IDF[t] || 0.5); });
      const cosineScore = sparseCosine(qVec, dVec);

      // 3) Jaccard — fallback مباشر عند ما يكون Cosine ضعيف بزاف (وزن 0.15)
      const jaccScore = jaccardIndex(qSet, dSet);

      // 4) Bigram/Trigram overlap — مفاهيم مركبة (وزن 0.10)
      const biHits  = [...qBi].filter(b => dBi.has(b)).length;
      const triHits = [...qTri].filter(t => dTri.has(t)).length;
      const ngramScore = (qBi.size ? biHits / qBi.size : 0) * 0.7
                        + (qTri.size ? triHits / qTri.size : 0) * 0.3;

      // 5) Fuzzy typo-tolerance (وزن 0.10)
      let fuzzyHits = 0;
      qTokensStemmed.forEach(qt => {
        if (dSet.has(qt)) { fuzzyHits++; return; }
        const m = fuzzyMatchWord(qt, [...dSet], qt.length <= 6 ? 1 : 2);
        if (m) fuzzyHits += 0.6;
      });
      const fuzzyScore = fuzzyHits / qTokensStemmed.length;

      let finalScore =
          bm25Norm   * 0.45 +
          cosineScore* 0.20 +
          jaccScore  * 0.15 +
          ngramScore * 0.10 +
          fuzzyScore * 0.10;

      // Fallback صريح: إذا Cosine وBM25 تقريباً صفر لكن Jaccard قوي
      // (كلمات مشتركة صريحة)، منعطوش النتيجة تنغرق — نرفعوها بحدها الأدنى.
      if (bm25Norm < 0.05 && cosineScore < 0.05 && jaccScore > 0.3) {
        finalScore = Math.max(finalScore, jaccScore * 0.5);
      }

      // Weight boost (نفس منطق الأصلي بالضبط — التوافق محفوظ)
      finalScore *= (0.85 + 0.15 * Math.min(item.w || 1.0, 2) / 2);

      if (finalScore > minScore) {
        scored.push({ ...item, score: finalScore, _debug: { bm25Norm, cosineScore, jaccScore, ngramScore, fuzzyScore } });
      }
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 3);
  }

  /* ═══════════════════════════════════════════════════════════════════
     § 12 — MATH ENGINE — Shunting-yard (بلا eval() نهائياً)
     يدعم: + - * / ^ () أعداد عشرية وسالبة، أولوية العمليات، unary minus.
     المخرج: (1) النتيجة، (2) خطوات الحل بالتفصيل، (3) شجرة AST.
  ═══════════════════════════════════════════════════════════════════ */
  const MathEngine = (function () {
    const OPS = {
      '+': { prec: 1, assoc: 'L', fn: (a,b)=>a+b },
      '-': { prec: 1, assoc: 'L', fn: (a,b)=>a-b },
      '*': { prec: 2, assoc: 'L', fn: (a,b)=>a*b },
      '/': { prec: 2, assoc: 'L', fn: (a,b)=>{ if (b===0) throw new Error('DIV_BY_ZERO'); return a/b; } },
      '%': { prec: 2, assoc: 'L', fn: (a,b)=>{ if (b===0) throw new Error('DIV_BY_ZERO'); return a%b; } },
      '^': { prec: 3, assoc: 'R', fn: (a,b)=>Math.pow(a,b) },
    };

    // Regex كتكتشف واش النص كيحتوي على معادلة رياضية محتملة
    const MATH_DETECT_RE = /(-?\d+(\.\d+)?\s*[\+\-\*\/\^%]\s*-?\d+(\.\d+)?)|(\bsqrt\(|\bجذر\b)|(\d+\s*%\s*(من|of)\s*\d+)/i;

    function looksLikeMath(text) {
      if (!text) return false;
      const t = text.trim();
      // نتجنب false positive بحال "3-2-1 go" أو تواريخ (2024-01-01)
      if (/^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$/.test(t)) return false;
      return MATH_DETECT_RE.test(t);
    }

    // Tokenizer خاص بالرياضيات — يفصل الأرقام، العمليات، الأقواس
    function mathTokenize(expr) {
      const clean = ArchonTokenizer.normalizeDigits(expr)
        .replace(/[×✕]/g, '*').replace(/[÷]/g, '/')
        .replace(/جذر\s*\(/g, 'sqrt(')
        .replace(/\s+/g, '');
      const tokens = [];
      let i = 0;
      while (i < clean.length) {
        const c = clean[i];
        if (/[0-9.]/.test(c)) {
          let num = '';
          while (i < clean.length && /[0-9.]/.test(clean[i])) { num += clean[i]; i++; }
          tokens.push({ type: 'num', value: parseFloat(num) });
          continue;
        }
        if ('+-*/^%()'.includes(c)) {
          // Unary minus: إذا كان "-" فبداية التعبير أو بعد "(" أو بعد عملية أخرى
          if (c === '-' && (tokens.length === 0 || ['op','lparen'].includes(tokens[tokens.length-1].type))) {
            tokens.push({ type: 'unary_minus' });
          } else if (c === '(') {
            tokens.push({ type: 'lparen' });
          } else if (c === ')') {
            tokens.push({ type: 'rparen' });
          } else {
            tokens.push({ type: 'op', value: c });
          }
          i++;
          continue;
        }
        if (clean.slice(i, i+4) === 'sqrt') {
          tokens.push({ type: 'func', value: 'sqrt' });
          i += 4;
          continue;
        }
        // رمز غير معروف — نرمي خطأ صريح بدل ما نسكتو عليه
        throw new Error(`رمز غير مفهوم فالمعادلة: "${c}"`);
      }
      return tokens;
    }

    // Shunting-yard algorithm: تحويل infix → postfix (RPN)
    function toPostfix(tokens) {
      const output = [], opStack = [];
      tokens.forEach(t => {
        if (t.type === 'num') { output.push(t); return; }
        if (t.type === 'func') { opStack.push(t); return; }
        if (t.type === 'unary_minus') { opStack.push({ type: 'op', value: 'u-' }); return; }
        if (t.type === 'op') {
          while (opStack.length) {
            const top = opStack[opStack.length - 1];
            if (top.type === 'lparen') break;
            const topPrec = top.value === 'u-' ? 4 : OPS[top.value].prec;
            const curPrec = OPS[t.value].prec;
            const shouldPop = topPrec > curPrec || (topPrec === curPrec && OPS[t.value].assoc === 'L');
            if (!shouldPop) break;
            output.push(opStack.pop());
          }
          opStack.push(t);
          return;
        }
        if (t.type === 'lparen') { opStack.push(t); return; }
        if (t.type === 'rparen') {
          while (opStack.length && opStack[opStack.length-1].type !== 'lparen') output.push(opStack.pop());
          if (!opStack.length) throw new Error('أقواس غير متوازنة');
          opStack.pop(); // نطيحو الـ lparen
          if (opStack.length && opStack[opStack.length-1].type === 'func') output.push(opStack.pop());
          return;
        }
      });
      while (opStack.length) {
        const top = opStack.pop();
        if (top.type === 'lparen') throw new Error('أقواس غير متوازنة');
        output.push(top);
      }
      return output;
    }

    // تقييم RPN مع تسجيل كل خطوة (باش نعرضو "حل بالخطوات")
    function evalPostfix(postfix) {
      const stack = [];
      const steps = [];
      postfix.forEach(t => {
        if (t.type === 'num') { stack.push(t.value); return; }
        if (t.type === 'func' && t.value === 'sqrt') {
          const a = stack.pop();
          if (a < 0) throw new Error('لا يمكن حساب جذر عدد سالب');
          const r = Math.sqrt(a);
          stack.push(r);
          steps.push(`√${a} = ${round(r)}`);
          return;
        }
        if (t.type === 'op' && t.value === 'u-') {
          const a = stack.pop();
          stack.push(-a);
          steps.push(`سالب (${a}) = ${-a}`);
          return;
        }
        if (t.type === 'op') {
          const b = stack.pop(), a = stack.pop();
          const r = OPS[t.value].fn(a, b);
          stack.push(r);
          steps.push(`${round(a)} ${t.value} ${round(b)} = ${round(r)}`);
          return;
        }
      });
      if (stack.length !== 1) throw new Error('معادلة غير صحيحة');
      return { result: stack[0], steps };
    }

    function round(n) {
      return Math.abs(n - Math.round(n)) < 1e-9 ? Math.round(n) : Math.round(n * 1e6) / 1e6;
    }

    function solve(expr) {
      try {
        const tokens = mathTokenize(expr);
        if (!tokens.length) throw new Error('ماكاينش معادلة مفهومة');
        const postfix = toPostfix(tokens);
        const { result, steps } = evalPostfix(postfix);
        return { ok: true, result: round(result), steps, expr };
      } catch (e) {
        const msg = e.message === 'DIV_BY_ZERO' ? 'القسمة على صفر غير معرّفة رياضياً'
                  : (e.message || 'خطأ فحل المعادلة');
        return { ok: false, error: msg, expr };
      }
    }

    // استخراج أول معادلة صريحة من نص حر (مثال: "شحال هو 12 * 3 + 5 ؟")
    function extractExpression(text) {
      const m = text.match(/(-?\d+(\.\d+)?\s*[\+\-\*\/\^%]\s*)+-?\d+(\.\d+)?/);
      return m ? m[0] : null;
    }

    return { looksLikeMath, solve, extractExpression, mathTokenize, toPostfix, evalPostfix };
  })();

  /* ═══════════════════════════════════════════════════════════════════
     § 13 — UNIT CONVERSION (عملات تقريبية ثابتة محلياً، وزن، مسافة، حرارة)
     ملاحظة: أسعار الصرف هنا ثوابت تقريبية محلية (offline) — للتحويل
     الدقيق فاللحظة الحالية خاص API حي (الكود الأصلي فيه fetch tools).
  ═══════════════════════════════════════════════════════════════════ */
  const UnitConverter = (function () {
    const LENGTH_TO_M = { mm:0.001, cm:0.01, m:1, km:1000, mile:1609.34, ft:0.3048, inch:0.0254, yard:0.9144 };
    const WEIGHT_TO_KG = { mg:0.000001, g:0.001, kg:1, ton:1000, lb:0.453592, oz:0.0283495 };
    // تقريبي — للاستخدام العام بلا اتصال، ماشي لأغراض مالية دقيقة
    const CURRENCY_TO_USD_APPROX = { usd:1, mad:0.1, eur:1.08, gbp:1.27, sar:0.267, aed:0.272 };

    function convertLength(value, from, to) {
      if (!(from in LENGTH_TO_M) || !(to in LENGTH_TO_M)) return null;
      return (value * LENGTH_TO_M[from]) / LENGTH_TO_M[to];
    }
    function convertWeight(value, from, to) {
      if (!(from in WEIGHT_TO_KG) || !(to in WEIGHT_TO_KG)) return null;
      return (value * WEIGHT_TO_KG[from]) / WEIGHT_TO_KG[to];
    }
    function convertCurrency(value, from, to) {
      from = from.toLowerCase(); to = to.toLowerCase();
      if (!(from in CURRENCY_TO_USD_APPROX) || !(to in CURRENCY_TO_USD_APPROX)) return null;
      const usd = value * CURRENCY_TO_USD_APPROX[from];
      return usd / CURRENCY_TO_USD_APPROX[to];
    }
    function convertTemperature(value, from, to) {
      from = from.toLowerCase(); to = to.toLowerCase();
      let celsius;
      if (from === 'c') celsius = value;
      else if (from === 'f') celsius = (value - 32) * 5/9;
      else if (from === 'k') celsius = value - 273.15;
      else return null;
      if (to === 'c') return celsius;
      if (to === 'f') return celsius * 9/5 + 32;
      if (to === 'k') return celsius + 273.15;
      return null;
    }
    return { convertLength, convertWeight, convertCurrency, convertTemperature };
  })();

  /* ═══════════════════════════════════════════════════════════════════
     § 14 — DATE LOGIC
  ═══════════════════════════════════════════════════════════════════ */
  const DateEngine = (function () {
    const AR_DAYS = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    const AR_MONTHS = ['يناير','فبراير','مارس','أبريل','ماي','يونيو','يوليوز','غشت','شتنبر','أكتوبر','نونبر','دجنبر'];

    function todayString() {
      const d = new Date();
      return `${AR_DAYS[d.getDay()]}، ${d.getDate()} ${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    }
    function daysBetween(dateA, dateB) {
      const a = new Date(dateA), b = new Date(dateB);
      if (isNaN(a) || isNaN(b)) return null;
      return Math.round(Math.abs(b - a) / 86400000);
    }
    function isDateQuestion(text) {
      return /(شنو|ما)\s*(هو\s*)?(تاريخ|اليوم)|what\s*(is\s*)?(the\s*)?date|quelle\s*date|اليوم\s*شحال|كم\s*التاريخ/i.test(text || '');
    }
    return { todayString, daysBetween, isDateQuestion };
  })();

  /* ═══════════════════════════════════════════════════════════════════
     § 15 — INTENT & SENTIMENT DETECTION (rule-based صراحة، ماشي ML)
  ═══════════════════════════════════════════════════════════════════ */
  const IntentEngine = (function () {
    const ANGER_MARKERS = /(غاضب|زعفان|معصب|واعر|خايب|كارثة|فاشل|سيء جدا|مقرف|angry|frustrat|terrible|awful|worst|merde|nul)/i;
    const QUESTION_MARKERS = /[؟?]|^(هل|واش|كيفاش|علاش|شنو|أين|فين|متى|لماذا|what|how|why|where|when|who|est-ce)/i;
    const COMMAND_MARKERS = /^(دير|سوي|اعمل|أنشئ|اكتب|صنع|do|make|create|write|build|génère|crée)/i;
    const GRATITUDE_MARKERS = /(شكرا|شكراً|thanks|thank you|merci)/i;
    const POSITIVE_MARKERS = /(زوين|مزيان|رائع|ممتاز|top|great|excellent|parfait|جميل)/i;

    function detectSentiment(text) {
      if (!text) return 'neutral';
      if (ANGER_MARKERS.test(text)) return 'negative';
      if (GRATITUDE_MARKERS.test(text) || POSITIVE_MARKERS.test(text)) return 'positive';
      return 'neutral';
    }
    function detectIntent(text) {
      if (!text) return 'unknown';
      if (COMMAND_MARKERS.test(text.trim())) return 'command';
      if (QUESTION_MARKERS.test(text)) return 'question';
      if (GRATITUDE_MARKERS.test(text)) return 'gratitude';
      return 'statement';
    }
    return { detectSentiment, detectIntent };
  })();

  /* ═══════════════════════════════════════════════════════════════════
     § 16 — NER مبسطة (أرقام / تواريخ / أسماء محتملة بالحروف الكبيرة أو
     بعد مؤشرات معروفة). صراحة: هادي pattern-matching، ماشي NER model
     مدرب — دقتها محدودة، خصوصاً على الأسماء العربية (بلا Capitalization
     كإشارة بحال الإنجليزية).
  ═══════════════════════════════════════════════════════════════════ */
  const NEREngine = (function () {
    const DATE_RE = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b/g;
    const NUMBER_RE = /\b\d+(\.\d+)?\b/g;
    const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
    const URL_RE = /https?:\/\/[^\s]+/g;
    // أسماء أعلام إنجليزية: كلمة تبدا بحرف كبير (بعيداً عن بداية الجملة)
    const EN_PROPER_NAME_RE = /\b[A-Z][a-z]{2,}\b/g;
    // مؤشرات أسماء عربية: "اسمي X"، "يدعى X"، "السيد X"
    const AR_NAME_HINT_RE = /(اسمي|يدعى|السيد|السيدة|الأستاذ|مدعو)\s+([\u0600-\u06FF]{2,})/g;

    function extractEntities(text) {
      if (!text) return { dates: [], numbers: [], emails: [], urls: [], names: [] };
      const dates   = [...text.matchAll(DATE_RE)].map(m => m[0]);
      const numbers = [...text.matchAll(NUMBER_RE)].map(m => m[0]);
      const emails  = [...text.matchAll(EMAIL_RE)].map(m => m[0]);
      const urls    = [...text.matchAll(URL_RE)].map(m => m[0]);
      const namesEn = [...text.matchAll(EN_PROPER_NAME_RE)].map(m => m[0]);
      const namesAr = [...text.matchAll(AR_NAME_HINT_RE)].map(m => m[2]);
      return { dates, numbers, emails, urls, names: [...namesEn, ...namesAr] };
    }
    return { extractEntities };
  })();

  /* ═══════════════════════════════════════════════════════════════════
     § 17 — MEMORY & CONTEXT MANAGEMENT
     Sliding window (آخر N محادثات ذات صلة) + Topic-change flush +
     Semantic dedup (ما يكررش نفس الجواب) + تلخيص تلقائي للمحادثات
     الطويلة. مبنية باش تخدم فوق `ctx` الأصلية (array) بلا ما تبدلها —
     هي wrapper كيقرا/كيبدل ctx.length عبر splice, ماشي كيعوضها بمتغير آخر.
  ═══════════════════════════════════════════════════════════════════ */
  const ContextManager = (function () {
    const MAX_WINDOW = 5;          // القاعدة 21: آخر 5 محادثات ذات صلة قوية فقط
    const SIMILARITY_DEDUP_THRESHOLD = 0.90; // القاعدة 24

    // يحسب تشابه Jaccard بسيط بين نصين (خفيف، كافي لكشف التكرار)
    function textSimilarity(a, b) {
      const ta = new Set(tokenizeForIndex(a || ''));
      const tb = new Set(tokenizeForIndex(b || ''));
      return jaccardIndex(ta, tb);
    }

    // القاعدة 20: إذا الموضوع تبدل بشكل مفاجئ، نمسحو الذاكرة القديمة
    function detectTopicShift(ctxArr, newQuestion) {
      if (!ctxArr || ctxArr.length < 2) return false;
      const recentUserTurns = ctxArr.filter(c => c.role === 'user').slice(-3);
      if (!recentUserTurns.length) return false;
      const avgSim = recentUserTurns.reduce((sum, turn) => sum + textSimilarity(turn.text, newQuestion), 0) / recentUserTurns.length;
      return avgSim < 0.05; // تشابه شبه منعدم مع آخر 3 أسئلة = موضوع جديد كلياً
    }

    // كيطبق القص للـ sliding window مباشرة على المصفوفة المعطاة (in-place)
    function enforceSlidingWindow(ctxArr, maxTurns) {
      maxTurns = maxTurns || MAX_WINDOW;
      const keep = maxTurns * 2; // user+bot = دورة وحدة، فنحتفظو بـ maxTurns دورة
      if (ctxArr.length > keep) {
        ctxArr.splice(0, ctxArr.length - keep);
      }
      return ctxArr;
    }

    function flushContext(ctxArr) {
      ctxArr.splice(0, ctxArr.length);
      return ctxArr;
    }

    // القاعدة 24: مقارنة جواب جديد مع آخر 3 أجوبة — إذا التشابه عالي بزاف،
    // كنرجعو true (خاص المستدعي يصيغ الجواب بطريقة مختلفة / يزيد تنويع)
    function isDuplicateAnswer(newAnswer, ctxArr) {
      const lastBotAnswers = ctxArr.filter(c => c.role === 'bot').slice(-3).map(c => c.text);
      return lastBotAnswers.some(prev => textSimilarity(prev, newAnswer) >= SIMILARITY_DEDUP_THRESHOLD);
    }

    // تلخيص تلقائي مبسط: كيحتفظ بأول جملة من كل دور محادثة قديم بدل
    // النص الكامل، باش يقلص استهلاك الـ tokens دون ما يخسر الخيط العام.
    function summarizeOldTurns(ctxArr, keepRecentCount) {
      keepRecentCount = keepRecentCount || MAX_WINDOW * 2;
      if (ctxArr.length <= keepRecentCount) return ctxArr;
      const old = ctxArr.slice(0, ctxArr.length - keepRecentCount);
      const recent = ctxArr.slice(ctxArr.length - keepRecentCount);
      const summaryLines = old.map(c => {
        const firstSentence = (c.text || '').split(/[.!؟?\n]/)[0].slice(0, 80);
        return `${c.role === 'user' ? 'المستخدم' : 'الرد'}: ${firstSentence}`;
      });
      const summaryTurn = { role: 'system', text: 'ملخص محادثة سابقة:\n' + summaryLines.join('\n') };
      ctxArr.splice(0, ctxArr.length, summaryTurn, ...recent);
      return ctxArr;
    }

    // القاعدة 22: تخزين طويل الأمد لتفضيلات المستخدم عبر localStorage
    const LS_KEY = 'archon_user_prefs_v1';
    function saveUserPref(key, value) {
      try {
        const store = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
        store[key] = value;
        localStorage.setItem(LS_KEY, JSON.stringify(store));
        return true;
      } catch (e) { return false; }
    }
    function loadUserPref(key, fallback) {
      try {
        const store = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
        return key in store ? store[key] : fallback;
      } catch (e) { return fallback; }
    }
    function loadAllUserPrefs() {
      try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch (e) { return {}; }
    }

    return {
      textSimilarity, detectTopicShift, enforceSlidingWindow, flushContext,
      isDuplicateAnswer, summarizeOldTurns,
      saveUserPref, loadUserPref, loadAllUserPrefs,
      MAX_WINDOW,
    };
  })();

  /* ═══════════════════════════════════════════════════════════════════
     § 18 — CACHE (Memoization) + DEBOUNCE + GC-friendly cleanup
     LRU بسيط بحجم محدود (باش ما يتضخمش فالذاكرة على جهاز 8GB).
  ═══════════════════════════════════════════════════════════════════ */
  const ArchonCache = (function () {
    const MAX_ENTRIES = 100;
    const map = new Map(); // Map كتحافظ على ترتيب الإدخال = LRU سهلة بـ delete+re-set

    function keyFor(input) {
      return ArchonTokenizer.deepNormalize(String(input));
    }
    function get(input) {
      const k = keyFor(input);
      if (!map.has(k)) return null;
      const val = map.get(k);
      map.delete(k); map.set(k, val); // نرفعوها لأحدث استعمال (LRU touch)
      return val;
    }
    function set(input, value) {
      const k = keyFor(input);
      if (map.has(k)) map.delete(k);
      map.set(k, value);
      if (map.size > MAX_ENTRIES) {
        const oldestKey = map.keys().next().value;
        map.delete(oldestKey);
      }
    }
    function clear() { map.clear(); }
    function size() { return map.size; }
    return { get, set, clear, size };
  })();

  function debounce(fn, waitMs) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      return new Promise(resolve => {
        timer = setTimeout(() => resolve(fn.apply(this, args)), waitMs);
      });
    };
  }

  function throttle(fn, limitMs) {
    let lastCall = 0, lastResult;
    return function (...args) {
      const now = Date.now();
      if (now - lastCall >= limitMs) {
        lastCall = now;
        lastResult = fn.apply(this, args);
      }
      return lastResult;
    };
  }

  /* ═══════════════════════════════════════════════════════════════════
     § 19 — WEB WORKER: عزل BM25 / Tokenization / Cosine عن الـ main
     thread. كنبنيو الـ worker من Blob (بلا ملف خارجي منفصل) باش الملف
     يبقى قطعة وحدة self-contained. عند غياب دعم Worker (نادر لكن ممكن
     على متصفحات قديمة)، كيرجع fallback تلقائي للحساب المتزامن العادي.
  ═══════════════════════════════════════════════════════════════════ */
  const ArchonWorkerPool = (function () {
    let worker = null;
    let requestId = 0;
    const pending = new Map();
    let supported = typeof Worker !== 'undefined';

    // كود الـ worker: نسخة مستقلة (self-contained) من الدوال الثقيلة —
    // خاصها تكون مستقلة كاملة لأن Worker ما عندهوش access لـ window ديال
    // الصفحة الرئيسية.
    const WORKER_SRC = `
      self.onmessage = function(e) {
        const { id, task, payload } = e.data;
        try {
          let result;
          if (task === 'levenshtein') {
            result = levenshteinWorker(payload.a, payload.b);
          } else if (task === 'batchScore') {
            result = batchScoreWorker(payload.queryTokens, payload.docs, payload.idf);
          } else {
            throw new Error('مهمة غير معروفة فالـ worker: ' + task);
          }
          self.postMessage({ id, ok: true, result });
        } catch (err) {
          self.postMessage({ id, ok: false, error: err.message });
        }
      };

      function levenshteinWorker(a, b) {
        if (a === b) return 0;
        if (!a.length) return b.length;
        if (!b.length) return a.length;
        let prev = new Array(b.length + 1);
        for (let j = 0; j <= b.length; j++) prev[j] = j;
        for (let i = 1; i <= a.length; i++) {
          const cur = [i];
          for (let j = 1; j <= b.length; j++) {
            cur[j] = a[i-1] === b[j-1] ? prev[j-1] : 1 + Math.min(prev[j-1], prev[j], cur[j-1]);
          }
          prev = cur;
        }
        return prev[b.length];
      }

      // نسخة مبسطة من BM25 تُستعمل فالـ worker فقط لمعالجة دفعات كبيرة
      // (chunking — القاعدة 32) بعيداً عن الـ main thread.
      function batchScoreWorker(queryTokens, docs, idf) {
        const qSet = {};
        queryTokens.forEach(t => { qSet[t] = (qSet[t]||0) + 1; });
        return docs.map((doc, idx) => {
          let score = 0;
          const dTokens = (doc.tokens || []);
          const dSet = {};
          dTokens.forEach(t => { dSet[t] = (dSet[t]||0) + 1; });
          Object.keys(qSet).forEach(t => {
            if (dSet[t]) score += (idf[t] || 0.5) * Math.min(qSet[t], dSet[t]);
          });
          return { idx, score };
        });
      }
    `;

    function init() {
      if (!supported || worker) return;
      try {
        const blob = new Blob([WORKER_SRC], { type: 'application/javascript' });
        worker = new Worker(URL.createObjectURL(blob));
        worker.onmessage = (e) => {
          const { id, ok, result, error } = e.data;
          const cb = pending.get(id);
          if (!cb) return;
          pending.delete(id);
          ok ? cb.resolve(result) : cb.reject(new Error(error));
        };
        worker.onerror = () => { supported = false; worker = null; };
      } catch (e) {
        supported = false;
        worker = null;
      }
    }

    // القاعدة 31: تقسيم الدفعات الكبيرة (chunking) قبل الإرسال للـ worker
    // — يمنع تجميد الـ worker نفسه بدفعة ضخمة وحدة.
    function chunkArray(arr, chunkSize) {
      const chunks = [];
      for (let i = 0; i < arr.length; i += chunkSize) chunks.push(arr.slice(i, i + chunkSize));
      return chunks;
    }

    function run(task, payload) {
      init();
      if (!supported || !worker) {
        // Fallback: نديرو الحساب مباشرة فالـ main thread (بلا Worker)
        if (task === 'levenshtein') return Promise.resolve(levenshteinFast(payload.a, payload.b));
        return Promise.resolve(null);
      }
      return new Promise((resolve, reject) => {
        const id = ++requestId;
        pending.set(id, { resolve, reject });
        worker.postMessage({ id, task, payload });
        // Timeout حماية: إذا الـ worker تعلق، ما نبقاوش معلقين لأبد
        setTimeout(() => {
          if (pending.has(id)) { pending.delete(id); reject(new Error('Worker timeout')); }
        }, 8000);
      });
    }

    function isSupported() { return supported; }
    function terminate() { if (worker) { worker.terminate(); worker = null; } }

    return { run, chunkArray, isSupported, terminate };
  })();

  /* ═══════════════════════════════════════════════════════════════════
     § 20 — CODING MODE DETECTOR (القاعدة 26)
  ═══════════════════════════════════════════════════════════════════ */
  const CODE_SIGNAL_RE = /(```|function\s*\(|const\s+\w+\s*=|=>|\bclass\s+\w+|<\/?[a-z]+>|\bHTML\b|\bCSS\b|\bJS\b|javascript|python|كود|دالة|برمج|خطأ\s*برمجي|debug|console\.log|import\s+|def\s+\w+\()/i;
  function isCodingModeQuestion(text) {
    return CODE_SIGNAL_RE.test(text || '');
  }

  /* ═══════════════════════════════════════════════════════════════════
     § 21 — LITE MODE CACHE (القاعدة 27): أسئلة بسيطة متكررة، جواب فوري
     محلي بلا ما نديرو أي رحلة بحث ثقيلة.
  ═══════════════════════════════════════════════════════════════════ */
  const LITE_INSTANT_ANSWERS = [
    { patterns: ['كيف حالك','كيداير','لاباس','ça va','how are you'], reply: 'لاباس الحمد لله! أنا هنا، شنو نقدر نعاونك فيه؟' },
    { patterns: ['شكون نتا','شكون انت','who are you','qui es-tu'], reply: 'أنا Archon — المساعد الذكي ديال Zunexa. كيفاش نقدر نعاونك؟' },
    { patterns: ['شكرا','merci','thank you','thanks'], reply: 'العفو! نتسنى لأي حاجة أخرى تحتاجها.' },
  ];
  function tryLiteInstantAnswer(userQ) {
    const n = ArchonTokenizer.deepNormalize(userQ);
    for (const entry of LITE_INSTANT_ANSWERS) {
      if (entry.patterns.some(p => n.includes(ArchonTokenizer.deepNormalize(p)))) {
        return entry.reply;
      }
    }
    return null;
  }

  /* ═══════════════════════════════════════════════════════════════════
     § 22 — LATENCY TRACKING (القاعدة 34)
  ═══════════════════════════════════════════════════════════════════ */
  function createLatencyTracker() {
    const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const marks = [];
    return {
      mark(label) { marks.push({ label, t: (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0 }); },
      summary() {
        const total = marks.length ? marks[marks.length - 1].t : 0;
        return { totalMs: Math.round(total), marks: marks.map(m => ({ ...m, t: Math.round(m.t) })) };
      },
    };
  }

  /* ═══════════════════════════════════════════════════════════════════
     § 23 — ArchonDecide — عقدة القرار المركزية (القاعدة 25)
     كتقرر: نجاوبو من الذاكرة/lite cache؟ نحسبو معادلة؟ نستعملو hybrid
     KB search؟ نديرو fallback عام؟ — بلا ما تبدل تدفق answer()/answerLocal()
     الأصلي، هي دالة استشارية (advisory) تقدر تُستدعى قبل استدعاء الأصليين.
  ═══════════════════════════════════════════════════════════════════ */
  function archonDecide(userQ, ctxArr) {
    const tracker = createLatencyTracker();
    const decision = { route: null, meta: {} };

    tracker.mark('start');

    // 1) Lite instant cache
    const liteAnswer = tryLiteInstantAnswer(userQ);
    if (liteAnswer) {
      decision.route = 'lite_instant';
      decision.meta.reply = liteAnswer;
      tracker.mark('lite_instant_hit');
      decision.meta.latency = tracker.summary();
      return decision;
    }

    // 2) Cache (سؤال سبق وتجاوب عليه)
    const cached = ArchonCache.get(userQ);
    if (cached) {
      decision.route = 'cache';
      decision.meta.reply = cached;
      tracker.mark('cache_hit');
      decision.meta.latency = tracker.summary();
      return decision;
    }

    // 3) رياضيات
    if (MathEngine.looksLikeMath(userQ)) {
      decision.route = 'math';
      tracker.mark('math_detected');
      decision.meta.latency = tracker.summary();
      return decision;
    }

    // 4) تاريخ
    if (DateEngine.isDateQuestion(userQ)) {
      decision.route = 'date';
      tracker.mark('date_detected');
      decision.meta.latency = tracker.summary();
      return decision;
    }

    // 5) وضع الكود
    if (isCodingModeQuestion(userQ)) {
      decision.meta.codingMode = true;
    }

    // 6) نية/مشاعر (معلومة إضافية تنضاف للقرار، ماشي route وحدها)
    decision.meta.intent = IntentEngine.detectIntent(userQ);
    decision.meta.sentiment = IntentEngine.detectSentiment(userQ);
    decision.meta.entities = NEREngine.extractEntities(userQ);

    // 7) تحول الموضوع → تفريغ الذاكرة
    if (ctxArr && ContextManager.detectTopicShift(ctxArr, userQ)) {
      decision.meta.topicShift = true;
    }

    // 8) route افتراضي: البحث الهجين المحلي، وبعدها LLM إذا كان ضعيف
    decision.route = 'hybrid_search';
    tracker.mark('routed_hybrid_search');
    decision.meta.latency = tracker.summary();
    return decision;
  }

  /* ═══════════════════════════════════════════════════════════════════
     § 24 — DYNAMIC SYSTEM PROMPT ASSEMBLY (القواعد 28-31)
     كتبني إضافة (ماشي بديل) للـ prompt الأصلي archonSystemPrompt/
     archonModeSystemPrompt — كتحقن قواعد ضد الهلوسة + توجيه JSON/HTML
     + self-review، بناءً على حالة اللحظة (وقت، ذاكرة، نوع سؤال).
  ═══════════════════════════════════════════════════════════════════ */
  function buildDynamicPromptAddendum(userQ, decision, searchResults) {
    const parts = [];
    const now = new Date();

    parts.push(`[سياق زمني]: الوقت الحالي ${now.toLocaleString('ar-MA')}.`);

    if (decision && decision.meta && decision.meta.codingMode) {
      parts.push('[وضع المطور مفعّل]: التزم بصيغة Markdown لأي كود (```language ... ```). ممنوع الشروحات الفلسفية أو الإطناب — الكود مباشرة مع شرح تقني مختصر فقط إذا كان ضرورياً.');
    }

    if (decision && decision.meta && decision.meta.sentiment === 'negative') {
      parts.push('[حالة المستخدم]: يبدو منزعجاً — كن مباشراً، متعاطفاً بدون مبالغة، وركز على الحل فوراً.');
    }

    if (searchResults && searchResults.length) {
      parts.push(`[نتائج بحث محلية متوفرة]: عدد ${searchResults.length}، أعلى score = ${searchResults[0].score.toFixed(3)}.`);
    }

    // القاعدة 30 — حقن قواعد صارمة ضد الهلوسة
    parts.push('[قواعد صارمة]: لا تختلق معلومات غير موجودة فالسياق المُعطى. إذا ما كنتيش متأكد، قل ذلك صراحة بدل اختلاق جواب. لا تكرر نفس صياغة الجواب السابق حرفياً.');

    // القاعدة 32 — self-correction قبل الطباعة
    parts.push('[مراجعة ذاتية]: قبل ما تعطي الجواب النهائي، راجع داخلياً: هل الكود (إذا كاين) صحيح تركيبياً؟ هل الجواب يجاوب فعلاً على السؤال المطروح؟');

    return parts.join('\n');
  }

  /* ═══════════════════════════════════════════════════════════════════
     § 25 — التكامل الفعلي مع الكود الأصلي (Integration Layer)
     هنا كنديرو override محسوب لـ rankKB, answerLocal (اختيارياً) —
     بلا ما نلمسو الملف الأصلي. كل override فيه fallback للدالة
     الأصلية إذا صرا أي خطأ.
  ═══════════════════════════════════════════════════════════════════ */
  function integrateWithOriginal() {
    // ضمان وجود window.ArchonExt قبل أي استعمال ليها فهاد الدالة — قبل هذا
    // كانت كتتصرح غير فآخر الملف، وكانت كتسبب crash إذا integrateWithOriginal()
    // تلاقات (عبر DOMContentLoaded) قبل ما توصل تلك السطور.
    window.ArchonExt = window.ArchonExt || {};

    if (typeof window.THRESHOLDS === 'undefined' || typeof window.KB === 'undefined') {
      console.warn('[ArchonExt] THRESHOLDS أو KB ماكاينينش global — التكامل التلقائي متوقف، الدوال باقية متوفرة يدوياً عبر window.ArchonExt.');
      return false;
    }

    const originalRankKB = window.rankKB;

    window.rankKB = function (userQ) {
      try {
        const kb = window.KB;
        const result = hybridRankKB(userQ, kb, window.THRESHOLDS);
        // إذا الـ hybrid رجع نتيجة فارغة بينما فيه KB، نجربو الأصلي كـ safety net
        if ((!result || !result.length) && typeof originalRankKB === 'function') {
          return originalRankKB(userQ);
        }
        return result;
      } catch (e) {
        console.warn('[ArchonExt] hybridRankKB فشلت، رجعنا للأصلية:', e.message);
        return typeof originalRankKB === 'function' ? originalRankKB(userQ) : [];
      }
    };

    // Hook اختياري: إذا answerLocal الأصلية موجودة، نزيدو ليها معالجة رياضية
    // قبلية (math short-circuit) بلا ما نبدلو منطقها الداخلي.
    if (typeof window.answerLocal === 'function') {
      const originalAnswerLocal = window.answerLocal;
      window.answerLocal = async function (userQ) {
        try {
          if (MathEngine.looksLikeMath(userQ)) {
            const expr = MathEngine.extractExpression(userQ) || userQ;
            const solved = MathEngine.solve(expr);
            if (solved.ok) {
              const stepsText = solved.steps.length
                ? '\n\nخطوات الحل:\n' + solved.steps.map((s, i) => `${i+1}. ${s}`).join('\n')
                : '';
              return {
                text: `النتيجة: **${solved.result}**${stepsText}`,
                src: 'math-engine',
                score: 1.0,
              };
            }
            // إذا فشل الحل (مثلاً قسمة على صفر)، كنعطيو رسالة واضحة بدل ما نسقطو لـ KB
            return { text: `⚠ ${solved.error} (المعادلة: ${solved.expr})`, src: 'math-engine', score: 1.0 };
          }
        } catch (e) {
          console.warn('[ArchonExt] Math short-circuit فشل، كمّلنا للمسار العادي:', e.message);
        }
        return originalAnswerLocal(userQ);
      };
    }

    // Hook: sliding window + topic flush تلقائي على ctx بعد كل جواب،
    // إذا ctx global موجودة (مصفوفة).
    if (Array.isArray(window.ctx)) {
      const originalPushIfExists = true; // ctx كتتبدل بمكان آخر (saveThreadMsg على الأرجح) — هنا غير enforcement بعدي
      window.ArchonExt._enforceContextRules = function (userQ) {
        try {
          if (ContextManager.detectTopicShift(window.ctx, userQ)) {
            console.log('[ArchonExt] تحول موضوع مكتشف — تفريغ جزئي للسياق القديم.');
            ContextManager.summarizeOldTurns(window.ctx, ContextManager.MAX_WINDOW * 2);
          } else {
            ContextManager.enforceSlidingWindow(window.ctx, ContextManager.MAX_WINDOW);
          }
        } catch (e) { /* best-effort، ما نكسروش الدردشة */ }
      };
    }

    console.log('[ArchonExt] التكامل تم بنجاح — rankKB وanswerLocal مدعومين الآن بـ BM25F/Jaccard/Math Engine.');
    return true;
  }

  // نحاولو التكامل التلقائي فور تحميل هاد الملف. إذا الأصليين ماكاينش
  // بعد (ترتيب تحميل السكريبتات)، كنعاودو المحاولة عند DOMContentLoaded.
  const integratedNow = integrateWithOriginal();
  if (!integratedNow && typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => integrateWithOriginal());
  }

  window.ArchonExt = window.ArchonExt || {};
  Object.assign(window.ArchonExt, {
    Tokenizer: ArchonTokenizer,
    STOPWORDS_ALL, removeStopwords,
    stemToken, ArabicStemmer, EnglishStemmer,
    ngrams, extractBigrams, extractTrigrams,
    levenshteinFast, fuzzyMatchWord,
    buildInvertedIndex, tokenizeForIndex, candidateDocIndices,
    bm25fScore, buildBM25IDF,
    jaccardIndex, sparseCosine,
    dynamicThreshold,
    hybridRankKB,
    MathEngine, UnitConverter, DateEngine,
    IntentEngine, NEREngine,
    ContextManager, ArchonCache, debounce, throttle,
    ArchonWorkerPool,
    isCodingModeQuestion, tryLiteInstantAnswer,
    createLatencyTracker, archonDecide, buildDynamicPromptAddendum,
    integrateWithOriginal,
  });
})();
