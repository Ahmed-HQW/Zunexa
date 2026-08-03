#!/usr/bin/env node
/**
 * Item 36/19 — quantitative accuracy check for rankKB() against a fixed
 * golden set, so a change to THRESHOLDS or the scoring formula gets
 * measured instead of eyeballed. Run after any edit to rankKB(),
 * buildIDF(), tfidfVec(), cosine(), or THRESHOLDS.
 *
 * Run: python3 extract_core.py && node eval.js
 */
const fs = require('fs');
const vm = require('vm');

const kb = JSON.parse(fs.readFileSync('./zunexa_qa_final.json', 'utf8'));
const evalSet = JSON.parse(fs.readFileSync('./eval_set.json', 'utf8'));

const sandbox = {
  localStorage: { _d:{}, getItem(k){return this._d[k]??null;}, setItem(k,v){this._d[k]=String(v);} },
  KB: kb.map(e => ({ id: e.id, q: e.q, a: e.a, kw: e.kw || [], w: e.w || 1.0, cat: e.category })),
  IDF: {},
  console,
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('./extracted_core.js', 'utf8'), sandbox);
sandbox.buildIDF(sandbox.KB);

let hits = 0, misses = [];
for (const c of evalSet) {
  const top = sandbox.rankKB(c.question);
  const gotId = top[0] && top[0].id;
  if (gotId === c.expected_id) {
    hits++;
  } else {
    misses.push({ question: c.question, expected: c.expected_id, got: gotId || '(none)', gotScore: top[0] && top[0].score });
  }
}

const accuracy = (100 * hits / evalSet.length).toFixed(1);
console.log(`\nEval accuracy: ${hits}/${evalSet.length} (${accuracy}%)\n`);
if (misses.length) {
  console.log('Misses:');
  misses.forEach(m => console.log(`  - "${m.question}" → expected ${m.expected}, got ${m.got}${m.gotScore ? ` (score ${m.gotScore.toFixed(3)})` : ''}`));
}
// This is a floor, not a target to game — 40 questions drawn straight from
// the KB's own text should be close to 100% almost by construction; the
// real value of this script is catching a REGRESSION (a future change
// that drops this number), not proving the matcher is good in the
// abstract. A separate, harder eval set with paraphrased/real user
// questions (not lifted from the KB's own wording) would be a better
// long-term measure — this one is a fast regression tripwire.
process.exit(hits === evalSet.length ? 0 : 1);
