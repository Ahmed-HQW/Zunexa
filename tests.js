#!/usr/bin/env node
/**
 * Zunexa AI — core logic test suite (item 35).
 *
 * IMPORTANT: this does NOT reimplement tok()/rankKB()/mergeKB()/
 * detectArchonMode()/fmt() from scratch — extract_core.py pulls the exact
 * function bodies out of ai.html by line range and this file requires
 * that extracted copy, so a passing test here means the real shipped
 * code passes, not a lookalike. If you edit any of these functions in
 * ai.html, re-run `python3 extract_core.py` before re-running tests, or
 * the two files will drift apart silently.
 *
 * Run: node extract_core.py (regenerates extracted_core.js) && node tests.js
 */
const assert = require('assert');

// ---- minimal shims for the few globals the extracted code touches ----
global.localStorage = {
  _d: {},
  getItem(k) { return this._d[k] ?? null; },
  setItem(k, v) { this._d[k] = String(v); },
};
global.KB = [];
global.IDF = {};

const core = require('./extracted_core.js');
// The extracted block is plain top-level `function`/`const` statements,
// not a module — load it into this process's global scope via vm so the
// declared names become callable here.
const vm = require('vm');
const fs = require('fs');
const src = fs.readFileSync('./extracted_core.js', 'utf8');
const sandbox = { localStorage: global.localStorage, KB: global.KB, IDF: global.IDF, console };
vm.createContext(sandbox);
vm.runInContext(src, sandbox);

let pass = 0, fail = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    pass++;
  } catch (e) {
    console.log(`  ✗ ${name}\n      ${e.message}`);
    fail++;
  }
}

console.log('\n── tok() ──');
test('splits and drops stopwords/single chars', () => {
  const out = sandbox.tok('السعر عندي و انا');
  assert.ok(out.includes('السعر'));
  assert.ok(!out.includes('و')); // stopword, len 1
});
test('applies synonym expansion (بغيت → __want__)', () => {
  const out = sandbox.tok('بغيت نتعلم');
  assert.ok(out.includes('__want__'), `expected __want__ in ${JSON.stringify(out)}`);
});
test('empty/undefined input never throws', () => {
  assert.strictEqual(sandbox.tok('').length, 0);
  assert.strictEqual(sandbox.tok(undefined).length, 0);
});

console.log('\n── mergeKB() ──');
test('dedupes on id, keeps higher-weight entry on collision', () => {
  const local = [{ id: 'a1', q: 'q1', a: 'ans1', kw: [], w: 1.0 }];
  const cloud = [{ id: 'a1', q: 'q1-variant', a: 'ans1-updated', kw: [], w: 1.5 }];
  const merged = sandbox.mergeKB(local, cloud);
  assert.strictEqual(merged.length, 1);
  assert.strictEqual(merged[0].a, 'ans1-updated');
});
test('keeps two entries with different ids even if q text is identical', () => {
  const local = [{ id: 'a1', q: 'same question text here', a: 'ans1', kw: [], w: 1.0 }];
  const cloud = [{ id: 'a2', q: 'same question text here', a: 'ans2', kw: [], w: 1.0 }];
  const merged = sandbox.mergeKB(local, cloud);
  assert.strictEqual(merged.length, 2, 'id-based key must not collide same-text different-id entries');
});
test('falls back to normalized-question key only when id is missing', () => {
  const local = [{ id: null, q: 'no id here', a: 'ans1', kw: [], w: 1.0 }];
  const cloud = [{ id: null, q: 'no id here', a: 'ans2', kw: [], w: 2.0 }];
  const merged = sandbox.mergeKB(local, cloud);
  assert.strictEqual(merged.length, 1);
  assert.strictEqual(merged[0].a, 'ans2');
});

console.log('\n── rankKB() ──');
test('returns [] when KB is empty', () => {
  sandbox.KB = [];
  assert.strictEqual(sandbox.rankKB('أي سؤال').length, 0);
});
test('ranks a topically-relevant entry above an unrelated one', () => {
  sandbox.KB = [
    { id: '1', q: 'كيف اسجل الدخول تسجيل دخول login', a: 'من صفحة الدخول', kw: ['login','دخول'], w: 1.0 },
    { id: '2', q: 'وصفة كيك بالشوكولاطة', a: 'مكونات الكيك', kw: ['كيك'], w: 1.0 },
  ];
  sandbox.buildIDF(sandbox.KB); // mutates sandbox.IDF in place, matches real ai.html behavior
  const top = sandbox.rankKB('كيفاش نسجل الدخول ديالي');
  assert.ok(top.length > 0, 'expected at least one match');
  assert.strictEqual(top[0].id, '1', `expected login entry to rank first, got ${JSON.stringify(top[0] && top[0].id)}`);
});
test('a high-weight but irrelevant entry cannot outrank a relevant low-weight one (item 15)', () => {
  sandbox.KB = [
    { id: 'relevant', q: 'كيف اغير كلمة المرور', a: 'من الإعدادات', kw: ['كلمة المرور','تغيير'], w: 1.0 },
    { id: 'popular-irrelevant', q: 'وصفة طاجين مغربي', a: 'ضعو اللحم', kw: ['طاجين'], w: 2.0 },
  ];
  sandbox.buildIDF(sandbox.KB);
  const top = sandbox.rankKB('بغيت نبدل كلمة السر ديالي');
  assert.ok(top.length > 0);
  assert.strictEqual(top[0].id, 'relevant',
    `weight must not let an irrelevant entry win — got top=${JSON.stringify(top[0] && top[0].id)}`);
});

console.log('\n── detectArchonMode() ──');
test('/code, /Code, /CODE all resolve identically (item A.3)', () => {
  const a = sandbox.detectArchonMode('/code اكتب لي دالة');
  const b = sandbox.detectArchonMode('/Code اكتب لي دالة');
  const c = sandbox.detectArchonMode('/CODE اكتب لي دالة');
  assert.strictEqual(a, 'code');
  assert.strictEqual(a, b);
  assert.strictEqual(b, c);
});
test('keyword-based detection: git/npm → cli', () => {
  assert.strictEqual(sandbox.detectArchonMode('كيفاش ندير git push للمشروع ديالي'), 'cli');
});
test('no strong signal → null (leaves mode unchanged)', () => {
  assert.strictEqual(sandbox.detectArchonMode('واش الجو زوين اليوم'), null);
});

console.log('\n── fmt() ──');
test('escapes HTML before applying markdown-lite formatting', () => {
  const out = sandbox.fmt('<script>alert(1)</script> **bold**');
  assert.ok(!out.includes('<script>'), 'raw <script> must be escaped');
  assert.ok(out.includes('&lt;script&gt;'));
  assert.ok(out.includes('<strong>bold</strong>'));
});
test('newlines become <br>', () => {
  assert.strictEqual(sandbox.fmt('line1\nline2'), 'line1<br>line2');
});

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
