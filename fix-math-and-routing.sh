#!/usr/bin/env bash
set -euo pipefail
cd "${ZUNEXA_ROOT:-$HOME/Zunexa}"
mkdir -p .backups; TS="$(date +%Y%m%d-%H%M%S)"
cp ai.html ".backups/ai-$TS.html"; cp archon-brain-ext.js ".backups/ext-$TS.js"

python3 - <<'PY'
import re,sys
NEW_LOOKS = r'''function looksLikeMath(text) {
      if (!text) return false;
      const t = ZunexaTokenizer.normalizeDigits(String(text)).trim();
      /* ZX_MATH_GUARD: الرسالة كلها يجب أن تكون تعبيراً رياضياً صرفاً */
      if (t.length > 60 || /[\r\n]/.test(t)) return false;
      if (!/^[\d\s.+\-*\/^%()×÷]+$/.test(t.replace(/(sqrt|جذر)/gi, ''))) return false;
      if (!/\d\s*[+\-*\/^%×÷]\s*[\d(]/.test(t)) return false;
      if (/^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$/.test(t)) return false;
      return true;
    }'''
pat = re.compile(r'function looksLikeMath\(text\) \{[\s\S]*?\n    \}', re.M)

for p in ('archon-brain-ext.js','ai.html'):
    s = open(p,encoding='utf-8').read()
    if 'ZX_MATH_GUARD' in s: print('=',p,'math مُطبَّق'); continue
    s2,n = pat.subn(lambda m: NEW_LOOKS, s)
    if n == 0: print('✗ looksLikeMath غير موجودة فـ',p); sys.exit(1)
    open(p,'w',encoding='utf-8').write(s2); print('✓',p,'math x'+str(n))

# routing: أمر صريح + حجة قصيرة
p='ai.html'; s=open(p,encoding='utf-8').read()
if 'ZX_ARG_GUARD' not in s:
    a="  if (/[\\r\\n]/.test(q) || q.length > 80 || q.trim().split(/\\s+/).length > 10) return null;"
    b="  if (/^\\s*\\//.test(q)) return null; /* ZX_ARG_GUARD: أمر صريح — لا تحويل */\n"+a
    if a not in s: print('✗ guard السابق غير موجود — شغّل fix-tool-routing.sh أولاً'); sys.exit(1)
    s=s.replace(a,b,1)
    c="      case 'weather':   return rest ? `/طقس ${rest}` : null; // needs a city"
    d="      case 'weather':   return zxToolArgOk(rest) ? `/طقس ${rest}` : null;"
    if c not in s: print('✗ case weather غير موجود'); sys.exit(1)
    s=s.replace(c,d,1)
    for k,cmd in (('map','/خريطة'),('git','/جيت'),('image','/صورة'),('search','/بحث')):
        s=re.sub(r"(case '%s':\s*return )rest \? (`%s \$\{rest\}`) : null;"%(k,re.escape(cmd)), r"\1zxToolArgOk(rest) ? \2 : null;", s)
    helper='''const ZX_STOP_ARGS = /^(how|is|the|what|whats|are|a|an|to|of|in|today|now|كيفاش|واش|شنو|هل|ما|هو|هي|كيف|اليوم|دابا)$/i;
function zxToolArgOk(rest) {
  const w = (rest || '').trim().split(/\\s+/).filter(Boolean);
  return w.length >= 1 && w.length <= 3 && !w.some(x => ZX_STOP_ARGS.test(x));
}
'''
    s=s.replace("function rewriteAsToolCommand(q) {",helper+"function rewriteAsToolCommand(q) {",1)
    open(p,'w',encoding='utf-8').write(s); print('✓ ai.html routing')

c=open('CHANGELOG.md',encoding='utf-8').read()
if 'math hijack' not in c:
    e="""## [Unreleased] — 2026-11-05 (math hijack + tool arg guard)

### 🐛 Fixed
- `MathEngine.looksLikeMath` كانت تلتقط `10:00+01:00` / `Test 1 : ...` فتحل `0 + 1` وتمنع وصول الرسالة للنموذج. الآن الرسالة كلها يجب أن تكون تعبيراً رياضياً صرفاً (`archon-brain-ext.js` + النسخة المضمّنة فـ `ai.html`).
- `rewriteAsToolCommand`: الأوامر الصريحة `/map ...` لم تعد تُحوَّل (كانت تنتج `/خريطة / X`)، وحجة الأداة محدودة بـ1–3 كلمات بلا كلمات استفهام (كانت `how is the weather` → `/طقس how is the`).

"""
    open('CHANGELOG.md','w',encoding='utf-8').write(e+c); print('✓ CHANGELOG')
PY

python3 - <<'PY'
import re,subprocess,tempfile,sys
bad=0
s=open('ai.html',encoding='utf-8').read()
blocks=re.findall(r'<script>([\s\S]*?)</script>',s)
for i,b in enumerate(blocks):
    f=tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8');f.write(b);f.close()
    r=subprocess.run(['node','--check',f.name],capture_output=True,text=True)
    if r.returncode: bad+=1;print('✗ ai.html script',i,r.stderr[:200])
r=subprocess.run(['node','--check','archon-brain-ext.js'],capture_output=True,text=True)
if r.returncode: bad+=1;print('✗ ext',r.stderr[:200])
print('✓ node --check OK' if not bad else '✗ syntax'); sys.exit(bad)
PY
echo "تم. git add -A && git commit -m 'fix: math + routing guards' && vercel --prod"
