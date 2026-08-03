function mergeKB(local, cloud) {
  const map = new Map();
  [...local, ...cloud].forEach(item => {
    const key = item.id || ('q:' + (norm(item.q) || norm(item.kw.join(' '))));
    const ex  = map.get(key);
    if (!ex) {
      map.set(key, item);
    } else if (item.w > ex.w) {
      console.log(`Zunexa KB: merge collision on key "${key}" — keeping higher-weight entry (${item.w} > ${ex.w})`);
      map.set(key, item);
    }
  });
  return Array.from(map.values());
}

/* ════════════════════════════════════════════════════════════
   TEXT ENGINE — Normalize / Tokenize
════════════════════════════════════════════════════════════ */
function norm(t) {
  if (!t) return '';
  return t.toLowerCase()
    .replace(/[أإآاى]/g,'ا').replace(/[ةه]/g,'ه').replace(/[يى]/g,'ي')
    .replace(/[^\u0621-\u064Aa-z0-9\s]/g,' ')
    .replace(/\s+/g,' ').trim();
}

const STOP = new Set([
  'في','من','على','إلى','هو','هي','هل','ما','كيف','لماذا','متى','أين','و','أو','لا',
  'نعم','هذا','هذه','ذلك','التي','الذي','عن','مع','بين','قد','كان','ان','إن','له',
  'the','is','are','a','an','to','of','and','or','in','it','that','this'
]);

/* ════════════════════════════════════════════════════════════
   SYNONYM EXPANSION — Darija / Arabic (فصحى + خليجي) / Franco / French /
   English variants of the same domain concept collapse onto one
   canonical tag, so the matching engine effectively has far more
   "keywords" to work with than what's literally written in the KB.
   e.g. "بغيت", "نبغي", "عايز", "want", "veux" → __want__
════════════════════════════════════════════════════════════ */
const SYN_GROUPS = [
  ['__want__',    'بغيت','بغيتي','نبغي','بغى','عايز','عاوز','اريد','أريد','want','veux','souhaite'],
  ['__price__',   'فلوس','ثمن','سعر','تمن','اسعار','أسعار','تكلفة','price','prix','cost','tarif'],
  ['__plan__',    'خطة','اشتراك','باقة','plan','subscription','abonnement','forfait'],
  ['__free__',    'فابور','مجاني','مجانا','بلاش','gratuit','free','bla flous','bla3andi'],
  ['__ai__',      'ذكاء','اصطناعي','ai','intelligence','artificielle','archon','ذكاءاصطناعي'],
  ['__content__', 'محتوى','منشور','بوست','content','contenu','post'],
  ['__generator__','مولد','توليد','generator','generate','générateur','generateur'],
  ['__seo__',     'سيو','seo','تحسين','محركاتبحث','referencement'],
  ['__dashboard__','لوحة','تحكم','dashboard','tableau','bord'],
  ['__design__',  'تصميم','زليج','zalij','design','theme','ثيم'],
  ['__developer__','مطور','مبرمج','developer','dev','programmeur'],
  ['__help__',    'مساعدة','عاون','عاونني','ساعدني','help','aide','aidemoi'],
  ['__login__',   'دخول','تسجيل','دخل','login','connexion','signin'],
  ['__account__', 'حساب','account','compte'],
  ['__image__',   'صورة','صور','image','photo','picture'],
  ['__video__',   'فيديو','فيديوهات','video','clip'],
  ['__upgrade__', 'ترقية','رقي','upgrade','ameliorer','améliorer'],
  ['__platform__','منصة','موقع','app','application','platform','plateforme'],
  ['__weather__', 'طقس','جو','meteo','météo','weather'],
  ['__news__',    'اخبار','أخبار','news','actualites','actualités'],
  ['__search__',  'بحث','دور','ابحث','search','chercher','recherche'],
  ['__translate__','ترجم','ترجمة','translate','traduire','traduction'],
  ['__voice__',   'صوت','نطق','voice','audio','vocal'],
  ['__file__',    'ملف','وثيقة','file','document','fichier'],
  ['__thanks__',  'شكرا','شكراً','merci','thanks','thankyou'],
];
const SYN_MAP = (function(){
  const m = {};
  SYN_GROUPS.forEach(group => {
    const canon = group[0];
    group.slice(1).forEach(variant => { m[norm(variant)] = canon; });
  });
  return m;
})();

function tok(text) {
  const base = norm(text).split(/\s+/).filter(t => t.length > 1 && !STOP.has(t));
  const out = [];
  base.forEach(t => {
    out.push(t);
    if (SYN_MAP[t]) out.push(SYN_MAP[t]);
  });
  return out;
}

// Adjacent-word phrases — catches multi-word concepts ("ai content", "محتوى ذكي")
function bigrams(tokens) {
  const out = [];
  for (let i = 0; i < tokens.length - 1; i++) out.push(tokens[i] + '_' + tokens[i+1]);
  return out;
}

// Edit-distance — lets the engine survive typos / Darija spelling drift
function levenshtein(a, b) {
  if (a === b) return 0;
  const al = a.length, bl = b.length;
  if (!al) return bl;
  if (!bl) return al;
  let prev = new Array(bl + 1);
  for (let j = 0; j <= bl; j++) prev[j] = j;
  for (let i = 1; i <= al; i++) {
    const cur = [i];
    for (let j = 1; j <= bl; j++) {
      cur[j] = a[i-1] === b[j-1]
        ? prev[j-1]
        : 1 + Math.min(prev[j-1], prev[j], cur[j-1]);
    }
    prev = cur;
  }
  return prev[bl];
}

// % of query tokens that have a "close enough" (typo-tolerant) match in the doc
function fuzzyTokenScore(qToks, dToks) {
  if (!qToks.length || !dToks.length) return 0;
  let hits = 0;
  qToks.forEach(qt => {
    if (dToks.includes(qt)) { hits++; return; }
    const close = dToks.some(dt => {
      const maxLen = Math.max(qt.length, dt.length);
      if (maxLen < 4) return false; // too short to fuzz safely
      return levenshtein(qt, dt) <= (maxLen <= 6 ? 1 : 2);
    });
    if (close) hits += 0.7;
  });
  return hits / qToks.length;
}

/* ════════════════════════════════════════════════════════════
   DECISION THRESHOLDS — item 19: every magic number the ranking/
   answer pipeline uses to decide "confident / synthesize / unknown"
   lives here, in one place, with the reasoning behind each value.
   Run eval_set.json (see eval.js) after changing any of these to
   confirm accuracy didn't regress.
════════════════════════════════════════════════════════════ */
const THRESHOLDS = {
  // rankKB(): a scored candidate below this is not even considered a
  // weak match — filters pure noise out of the top-3 before answerLocal
  // has to reason about it.
  MIN_CANDIDATE_SCORE: 0.02,

  // answerLocal(): top match scores >= this → confident, direct lookup,
  // returned as-is with src:'qa'/'learned'.
  CONFIDENT_MATCH: 0.14,

  // answerLocal(): top match scores >= this (but < CONFIDENT_MATCH) →
  // "synthesis" tier, blended with the runner-up and flagged to the user
  // as a partial/composed answer rather than a clean lookup.
  SYNTHESIS_MATCH: 0.06,

  // answerLocal(): the runner-up is only blended in if it clears this bar
  // — otherwise a near-zero second result would dilute an already-weak
  // first result instead of adding signal.
  SYNTHESIS_SECOND_MATCH: 0.045,

  // autoLearn(): local KB score below this is treated as "genuinely
  // didn't know it" and is eligible to be queued for learning. Above
  // this, the KB already had a decent answer — nothing new to learn.
  AUTOLEARN_WEAK_LOCAL: 0.35,
};

/* ════════════════════════════════════════════════════════════
   SEMANTIC MATCH ENGINE
════════════════════════════════════════════════════════════ */
function buildIDF(docs) {
  const df = {}, N = docs.length || 1;
  docs.forEach(d => {
    const tokens = new Set(tok(d.q + ' ' + d.kw.join(' ')));
    tokens.forEach(t => { df[t] = (df[t]||0) + 1; });
  });
  IDF = {};
  Object.keys(df).forEach(t => {
    IDF[t] = Math.log((N + 1) / (df[t] + 1)) + 1;
  });
}

function tfidfVec(text) {
  const words = tok(text);
  if (!words.length) return {};
  const tf = {};
  words.forEach(w => { tf[w] = (tf[w]||0) + 1; });
  const vec = {};
  words.forEach(w => { vec[w] = (tf[w] / words.length) * (IDF[w] || 0.5); });
  return vec;
}

function cosine(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dot=0, na=0, nb=0;
  keys.forEach(k => {
    const av=a[k]||0, bv=b[k]||0;
    dot+=av*bv; na+=av*av; nb+=bv*bv;
  });
  return (!na||!nb) ? 0 : dot / (Math.sqrt(na)*Math.sqrt(nb));
}

/* ════════════════════════════════════════════════════════════
   SEARCH — Find Best Answer(s)
   Returns the top match PLUS the runner-up, so answer() can blend
   them into a synthesized reply instead of a flat lookup.
════════════════════════════════════════════════════════════ */
function rankKB(userQ) {
  if (!KB.length) return [];
  const qVec   = tfidfVec(userQ);
  const qToks  = tok(userQ);
  const qSet   = new Set(qToks);
  const qBi    = new Set(bigrams(qToks));
  const scored = [];

  KB.forEach(item => {
    if (!item.a) return;
    const docText = item.q + ' ' + item.kw.join(' ');
    const dVec    = tfidfVec(docText);
    const dToks   = tok(docText);
    const dSet    = new Set(dToks);

    // 1) TF-IDF cosine — overall topical closeness
    let score = cosine(qVec, dVec) * 0.40;

    // 2) Jaccard on tokens — raw word overlap
    const inter = [...qSet].filter(t => dSet.has(t)).length;
    const jacc  = inter / (qSet.size + dSet.size - inter + 0.001);
    score += jacc * 0.25;

    // 3) Bigram overlap — rewards matching 2-word concepts, not just loose words
    const dBi = new Set(bigrams(dToks));
    const biHits = [...qBi].filter(b => dBi.has(b)).length;
    if (qBi.size) score += (biHits / qBi.size) * 0.15;

    // 4) Fuzzy token match — typo / dialect-spelling tolerance
    score += fuzzyTokenScore(qToks, dToks) * 0.12;

    // 5) Keyword exact-substring bonus
    const kwBonus = item.kw.filter(k => norm(userQ).includes(norm(k))).length;
    score += kwBonus * 0.08;

    // 6) Weight boost (learned / frequently-confirmed answers rank higher)
    // — item 15: bounded to a 0.85–1.0 multiplier (capped at w=2) instead
    // of an unbounded free multiplier, so a heavily-used entry can nudge
    // ahead of an equally-relevant one but can never drag an off-topic
    // entry to the top purely on popularity.
    score *= (0.85 + 0.15 * Math.min(item.w || 1.0, 2) / 2);

    if (score > THRESHOLDS.MIN_CANDIDATE_SCORE) scored.push({ ...item, score });
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3);
}
// item 20 — the old flat top-1 search() had zero callers anywhere in the
// codebase (answer()/answerLocal() both call rankKB() directly and reason
// over the top-3), so it was removed rather than kept as unreachable code.

/* ════════════════════════════════════════════════════════════
   INTELLIGENCE — Build Response
   3-tier brain: confident lookup → synthesized blend of close
   matches → guided "I'm learning this" reply. This is what makes
   Archon feel like it's reasoning instead of just doing a lookup.
════════════════════════════════════════════════════════════ */
async function answerLocal(userQ) {
  const enriched = buildCtxQ(userQ);
  const top = rankKB(enriched);
  const best = top[0] || null;

  if (best && best.score >= THRESHOLDS.CONFIDENT_MATCH) {
    incrWeight(best.q);
    await logMsg(userQ, best.a, 'qa', best.score);
    return { text: best.a, src: best.src==='learned'?'learned':'qa', score: best.score };
  }

  // Synthesis tier — two weak-ish signals together are often a real answer.
  // Blend them with a connective phrase instead of returning a raw "maybe".
  if (best && best.score >= THRESHOLDS.SYNTHESIS_MATCH) {
    const second = top[1] && top[1].score >= THRESHOLDS.SYNTHESIS_SECOND_MATCH ? top[1] : null;
    let txt = best.a;
    if (second && second.q !== best.q) {
      txt += `\n\n${pickConnector()} ${second.a}`;
    }
    txt += '\n\n_💡 إجابة مُركّبة من أقرب المعلومات المتوفرة — صيغ سؤالك بدقة أكبر لإجابة أوضح._';
    incrWeight(best.q);
    await logMsg(userQ, txt, 'fallback', best.score);
    return { text: txt, src: 'partial', score: best.score };
  }

  // Truly unknown — learn it
  await learnQ(userQ);
  const txt = buildUnknown(userQ);
  await logMsg(userQ, txt, 'system', 0);
  return { text: txt, src: 'learning', score: 0 };
}

/* ════════════════════════════════════════════════════════════
   ARCHON BRAIN — free, keyless LLM layer (Pollinations text API)
   Pollinations' text.pollinations.ai endpoint is a public, keyless,
   OpenAI-compatible completion API. It's what actually makes
   "Archon Pro" / "Archon Max" reason and write instead of only doing
   a KB lookup. No account, no API key, no cost — if it's unreachable
   (network/CORS hiccup) everything falls back to the local KB engine
   automatically, so the assistant never breaks.
════════════════════════════════════════════════════════════ */
// item 23 — lightweight sanitation layer for text that flows into
// archonBrain, particularly attachedFile.textContent (uploaded files are
// the most likely injection vector, since the user typing the chat
// message is already trusted at the level this app trusts anyone).
// This is pattern-flagging + neutralizing, not a guarantee — a
// determined attacker can still obfuscate around fixed patterns. It
// raises the bar for casual injection attempts, it doesn't eliminate
// the risk class.
const PROMPT_INJECTION_PATTERNS = [
  /تجاهل\s+(كل\s+)?(ال)?تعليمات/gi,
  /system\s*prompt/gi,
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/gi,
  /you\s+are\s+now/gi,
  /act\s+as\s+(a\s+)?(new|different)/gi,
  /من\s+الآن\s+(فصاعدا\s+)?انت/gi,
];
function sanitizeForPrompt(text) {
  if (!text) return { text: '', flagged: false };
  let flagged = false;
  let out = text;
  PROMPT_INJECTION_PATTERNS.forEach(p => {
    if (p.test(out)) {
      flagged = true;
      out = out.replace(p, '[محتوى محذوف — نمط تعليمات مشبوه]');
    }
  });
  return { text: out, flagged };
}

// item 25 — simple sliding-window rate limit per device, stored in
// localStorage. Client-side only: it protects the free Pollinations
// endpoint from accidental runaway use on this device, it is NOT a
// security boundary (anyone can clear localStorage) — same caveat as
// getDeviceId() above.
const ARCHON_BRAIN_RATE_LIMIT = { maxCalls: 30, windowMs: 10 * 60 * 1000 }; // 30 calls / 10 min
function archonBrainRateLimitOk() {
  try {
    const key = 'zx_brain_calls';
    const now = Date.now();
    let calls = JSON.parse(localStorage.getItem(key) || '[]');
    calls = calls.filter(t => now - t < ARCHON_BRAIN_RATE_LIMIT.windowMs);
    if (calls.length >= ARCHON_BRAIN_RATE_LIMIT.maxCalls) {
      localStorage.setItem(key, JSON.stringify(calls));
      return false;
    }
    calls.push(now);
    localStorage.setItem(key, JSON.stringify(calls));
    return true;
  } catch (e) {
    return true; // fail open — a broken localStorage shouldn't break the chat
  }
}

// item 24 — Pollinations (text.pollinations.ai) is a free, public, keyless
// third-party completion API. Every message sent through Archon Pro/Max —
// the user's question, recent conversation turns, and any KB/RAG context
// injected above — is transmitted to that external service, which is
// outside Zunexa's/Supabase's data-handling agreement. This should also
// be stated in the product's privacy policy in plain language. If any of
// this ever carries commercially sensitive content, evaluate migrating to
// a provider with a clear data-usage agreement instead of a public free
// endpoint.
async function archonBrain(messages, opts) {
  opts = opts || {};
  try {
    const res = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: opts.model || 'openai',
        messages,
        max_tokens: opts.maxTokens || 500,
        temperature: opts.temperature || 0.6
      })
    });
    if (!res.ok) throw new Error('archonBrain http ' + res.status);
    const data = await res.json();
    const txt = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    return txt ? txt.trim() : null;
  } catch (e) {
    console.warn('Archon Brain unreachable, staying on local KB', e);
    return null;
  }
}

// item 38 — the "fluent in 30+ languages" claim below is inherited from
// the underlying model (Pollinations' 'openai' backend) and has NOT been
// verified language-by-language against a real sample in this pass —
// that needs a native/fluent speaker (or at least a sampled automated
// check) for each listed language before shipping this claim as-is.
// Flagged rather than silently trimmed, since removing languages without
// checking them first could just as easily under-claim real capability.
function archonSystemPrompt(uiLangHint) {
  // item 39 — zx_page_lang (the UI language toggle) and "the language
  // Archon replies in" (which strictly follows the last user message,
  // per the line below) are two different things and can visibly
  // disagree — e.g. UI set to French, user types one Arabic message.
  // Rather than leaving that undocumented, the UI language is now passed
  // in as an explicit default-when-ambiguous hint instead of being
  // silently ignored by the brain.
  const langHintLine = uiLangHint
    ? `\n\nتفضيل لغة الواجهة عند المستخدم هو "${uiLangHint}" — استعملها كخيار افتراضي فقط إذا كانت لغة رسالة المستخدم غامضة أو مختلطة، وإلا فالقاعدة الأساسية تبقى: جاوب بلغة آخر رسالة من المستخدم.`
    : '';
  return 'أنت Archon، المساعد الذكي لمنصة Zunexa (منصة مغربية لتوليد المحتوى بالذكاء الاصطناعي لصناع المحتوى في المنطقة العربية/المغاربية والعالم). '
       + 'تتحدث بطلاقة أكثر من 30 لغة، من بينها: العربية الفصحى، الدارجة المغربية، العربية الخليجية، الفرنسية، الإنجليزية، الإسبانية، الألمانية، الإيطالية، البرتغالية، الهولندية، التركية، الروسية، الصينية، اليابانية، الكورية، الهندية، الأردية، الفارسية، الإندونيسية، الملايوية، التايلاندية، الفيتنامية، البولندية، الأوكرانية، السويدية، النرويجية، الدنماركية، الفنلندية، اليونانية، العبرية، الرومانية، والسواحلية. '
       + 'جاوب دائماً بنفس اللغة أو اللهجة اللي كتب بيها المستخدم، بشكل طبيعي وسليم ومهني ومختصر. استعمل المعلومة التالية من قاعدة معرفة Zunexa كسياق أساسي إذا كانت متوفرة، ولا تختلق معلومات عن الشركة أو الأسعار غير موجودة في السياق. '
       + 'إذا كان الملف المرفق يحتوي على كود من مشروع (ملف .html/.js/.py أو أرشيف .zip)، ولا تُعِد كتابة الكود المصدري الكامل له حرفياً حتى لو طُلب منك ذلك — أعطِ فقط بنية عامة (template/skeleton) أو نمطاً (pattern) موضّحاً، مع شرح المنطق العام، دون نسخ السطور كما هي.'
       + langHintLine;
}

/* ════════════════════════════════════════════════════════════
   ARCHON MODES — Cowork / Code / CLI router
   Detects which "Archon" personality the user wants (explicit
   /command, or keyword intent) and layers a mode-specific system
   prompt on top of archonSystemPrompt() — it doesn't replace your
   language/persona rules, just adds to them. answer() below calls
   archonModeSystemPrompt() instead of archonSystemPrompt() directly.
════════════════════════════════════════════════════════════ */
let zxArchonMode = localStorage.getItem('zx_archon_mode') || 'chat'; // 'chat' | 'cowork' | 'code' | 'cli'

function setArchonMode(mode) {
  if (mode === zxArchonMode) return;
  zxArchonMode = mode;
  localStorage.setItem('zx_archon_mode', mode);
  document.body.setAttribute('data-archon-mode', mode);
  const labels = { chat: 'Archon', cowork: 'Cowork Archon', code: 'Code Archon', cli: 'CLI Archon' };
  toast(`⚡ ${labels[mode] || 'Archon'} — تم التفعيل`);
}

const ARCHON_MODE_COMMANDS = {
  '/cowork': 'cowork', '/code': 'code', '/cli': 'cli', '/chat': 'chat',
};

const ARCHON_MODE_KEYWORDS = {
  code: [
    'كود', 'اكتب لي كود', 'دالة', 'function', 'javascript', 'python',
    'html', 'css', 'sql', 'api', 'debug', 'error', 'خطأ برمجي',
    'رجع لي الكود', 'اصلح الكود', 'refactor', 'أصلح باغ', 'bug',
    'كومبايل', 'compile', 'اكتب سكريبت', 'script', 'مكتبة', 'library',
    'الگوريتم', 'algorithm', 'json', 'array', 'مصفوفة', 'class',
  ],
  cli: [
    'git clone', 'git push', 'npm install', 'terminal', 'طرفية',
    'سطر الأوامر', 'bash', 'shell', 'command line', 'sudo',
    'apt install', 'pip install', 'chmod', 'ssh', 'curl', 'wget',
    'docker', '/repo', '/source', '/cli', 'github',
  ],
  cowork: [
    'ساعدني في مشروعي', 'خطة عمل', 'project plan', 'برنامج عمل',
    'تعاون', 'workflow', 'خارطة طريق', 'roadmap', 'تنظيم المهام',
    'todo', 'قائمة مهام', 'اجتماع', 'meeting', 'استراتيجية', 'strategy',
  ],
};

function detectArchonMode(userText) {
  const firstWord = userText.trim().split(/\s+/)[0].toLowerCase();
  if (ARCHON_MODE_COMMANDS[firstWord]) return ARCHON_MODE_COMMANDS[firstWord];
  const l = userText.toLowerCase();
  for (const mode of ['code', 'cli', 'cowork']) {
    if (ARCHON_MODE_KEYWORDS[mode].some(kw => l.includes(kw.toLowerCase()))) return mode;
  }
  return null; // no strong signal — leave zxArchonMode as-is
}

function fmt(text) {
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
    .replace(/_(.*?)_/g,'<em>$1</em>')
    .replace(/`([^`]+)`/g,'<code>$1</code>')
    .replace(/\n/g,'<br>');
}

function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
