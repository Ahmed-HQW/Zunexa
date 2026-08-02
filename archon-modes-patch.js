/* ════════════════════════════════════════════════════════════
   ARCHON MODES — Cowork / Code / CLI router
   -----------------------------------------------------------------
   WHERE TO PASTE THIS: directly after archonSystemPrompt() in
   ai.html (around line 1878), so it can use archonBrain() and
   archonSystemPrompt() which are already defined above it.

   WHAT IT DOES: detects which "Archon" personality the user wants
   (Cowork / Code / CLI) either from an explicit slash command or
   from keyword intent in the message, and adjusts the system prompt
   + rendering style accordingly. It does NOT replace your existing
   local-KB-first, archonBrain-second pipeline — it only changes
   which system prompt archonBrain() is called with, and how the
   reply is displayed. Falls back to normal chat if no mode matches.
════════════════════════════════════════════════════════════ */

// Persisted across reloads, same pattern as zxModel/zxTheme.
let zxArchonMode = localStorage.getItem('zx_archon_mode') || 'chat'; // 'chat' | 'cowork' | 'code' | 'cli'

function setArchonMode(mode) {
  zxArchonMode = mode;
  localStorage.setItem('zx_archon_mode', mode);
  document.body.setAttribute('data-archon-mode', mode);
  const labels = { chat: 'Archon', cowork: 'Cowork Archon', code: 'Code Archon', cli: 'CLI Archon' };
  toast(`⚡ ${labels[mode] || 'Archon'} — تم التفعيل`);
}

// Explicit commands always win — typed by the user, zero ambiguity.
const ARCHON_MODE_COMMANDS = {
  '/cowork': 'cowork', '/COWORK': 'cowork',
  '/code':   'code',   '/CODE':   'code',
  '/cli':    'cli',    '/CLI':    'cli',
  '/chat':   'chat',   '/CHAT':   'chat',
};

// Keyword-based intent detection (case-insensitive), used only when
// no explicit command is present. Grouped by mode so it's easy to
// extend later without touching the router logic itself.
const ARCHON_MODE_KEYWORDS = {
  code: [
    'كود', 'اكتب لي كود', 'دالة', 'function', 'javascript', 'python',
    'html', 'css', 'sql', 'api', 'debug', 'error', 'خطأ برمجي',
    'رجع لي الكود', 'اصلح الكود', 'refactor', 'أصلح باغ', 'bug',
    'كومبايل', 'compile', 'اكتب سكريبت', 'script', 'مكتبة', 'library',
    'الگوريتم', 'algorithm', 'json', 'array', 'مصفوفة', 'class',
  ],
  cli: [
    '/git', '/GIT', '/github', 'git clone', 'git push', 'npm install',
    'terminal', 'طرفية', 'سطر الأوامر', 'bash', 'shell', 'command line',
    'sudo', 'apt install', 'pip install', 'chmod', 'ssh', 'curl',
    'wget', 'docker', '/repo', '/source', '/cli', '/pholinea',
  ],
  cowork: [
    'ساعدني في مشروعي', 'خطة عمل', 'project plan', 'برنامج عمل',
    'تعاون', 'workflow', 'خارطة طريق', 'roadmap', 'تنظيم المهام',
    'todo', 'قائمة مهام', 'اجتماع', 'meeting', 'استراتيجية', 'strategy',
  ],
};

function detectArchonMode(userText) {
  const cmd = userText.trim().split(/\s+/)[0];
  if (ARCHON_MODE_COMMANDS[cmd]) return ARCHON_MODE_COMMANDS[cmd];

  const l = userText.toLowerCase();
  for (const mode of ['code', 'cli', 'cowork']) {
    if (ARCHON_MODE_KEYWORDS[mode].some(kw => l.includes(kw.toLowerCase()))) {
      return mode;
    }
  }
  return null; // no strong signal — leave zxArchonMode as-is
}

// Mode-specific system-prompt suffixes, layered on top of the
// existing archonSystemPrompt() rather than replacing it — so the
// language/persona rules you already wrote still apply everywhere.
function archonModeSystemPrompt(mode) {
  const base = archonSystemPrompt();
  switch (mode) {
    case 'code':
      return base + '\n\nأنت الآن في وضع Code Archon: ركّز فقط على الكود. جاوب بكتلة كود واحدة منسّقة (code block) مع لغة البرمجة محددة، وشرح قصير جداً بعدها (سطر أو سطرين كحد أقصى). لا تشرح بإسهاب.';
    case 'cli':
      return base + '\n\nأنت الآن في وضع CLI Archon: جاوب فقط بأوامر طرفية (terminal commands) داخل كتلة كود bash/shell، بدون أي نص حواري قبلها أو بعدها إلا إذا كان ضرورياً لفهم الأمر (سطر تعليق # فوق كل أمر عند الحاجة).';
    case 'cowork':
      return base + '\n\nأنت الآن في وضع Cowork Archon: تصرف كشريك عمل تفاعلي — اطرح سؤال توضيحي واحد إذا كانت المهمة غامضة، ثم قدّم خطوات عملية مرقمة قابلة للتنفيذ مباشرة.';
    default:
      return base;
  }
}

// Wrap archonBrain() so every call in the file benefits from mode
// awareness without having to touch each existing call site — call
// this instead of building the messages array manually.
async function archonBrainWithMode(userText, kbContext, opts) {
  const detected = detectArchonMode(userText);
  if (detected && detected !== zxArchonMode) setArchonMode(detected);

  const sys = archonModeSystemPrompt(zxArchonMode);
  const messages = [
    { role: 'system', content: sys },
    ...(kbContext ? [{ role: 'system', content: `سياق من قاعدة المعرفة:\n${kbContext}` }] : []),
    { role: 'user', content: userText },
  ];
  return archonBrain(messages, opts);
}
