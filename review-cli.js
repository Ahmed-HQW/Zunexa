/**
 * Zunexa — أداة مراجعة سطر الأوامر (بديل عن auto-bot.js القديم)
 *
 * الفرق الجوهري عن السكربت القديم:
 *  1. المفتاح يُقرأ من متغير بيئة (SUPABASE_ANON_KEY) — ماشي مكتوب فالكود.
 *  2. السكربت لا يفعّل أي شيء تلقائياً. فقط يعرض قائمة الإدخالات
 *     المعلقة (pending_review) حتى تراجعها بعينك وتقرر أنت.
 *  3. الاعتماد الفعلي يتم إدخال بإدخال عبر --approve <id> أو --reject <id>،
 *     ماشي بالجملة.
 *
 * الاستعمال:
 *   export SUPABASE_URL="https://xxxx.supabase.co"
 *   export SUPABASE_ANON_KEY="your-anon-key"
 *
 *   node review-cli.js --list                  # يعرض القائمة المعلقة
 *   node review-cli.js --approve <entry_id>     # يعتمد إدخال واحد بعد مراجعتك
 *   node review-cli.js --reject <entry_id>      # يرفض إدخال واحد
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    'خطأ: خاصك تضبط SUPABASE_URL و SUPABASE_ANON_KEY كمتغيرات بيئة قبل تشغيل السكربت.\n' +
      'مثال:\n' +
      '  export SUPABASE_URL="https://xxxx.supabase.co"\n' +
      '  export SUPABASE_ANON_KEY="your-anon-key"'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function listPending() {
  const { data, error } = await supabase
    .from('ai_knowledge')
    .select('id, question, answer, category, created_at')
    .eq('review_status', 'pending_review')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('خطأ فجلب القائمة:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('لا توجد إدخالات بانتظار المراجعة.');
    return;
  }

  console.log(`\n${data.length} إدخال بانتظار المراجعة:\n`);
  for (const entry of data) {
    console.log(`ID: ${entry.id}`);
    console.log(`التصنيف: ${entry.category ?? '—'}`);
    console.log(`السؤال: ${entry.question}`);
    console.log(`الجواب: ${entry.answer}`);
    console.log(`تاريخ الإضافة: ${entry.created_at}`);
    console.log('─'.repeat(50));
  }
  console.log(
    `\nلاعتماد إدخال بعد مراجعته: node review-cli.js --approve <ID>` +
      `\nلرفض إدخال: node review-cli.js --reject <ID>`
  );
}

async function reviewOne(entryId, decision) {
  const { error } = await supabase
    .from('ai_knowledge')
    .update({
      is_active: decision === 'approve',
      review_status: decision === 'approve' ? 'approved' : 'rejected',
      weight: decision === 'approve' ? 1.0 : 0,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', entryId)
    .eq('review_status', 'pending_review'); // ضمان: لا يمس إدخال سبق مراجعته

  if (error) {
    console.error('خطأ فتسجيل القرار:', error.message);
    process.exit(1);
  }

  console.log(
    decision === 'approve'
      ? `تم اعتماد الإدخال ${entryId}.`
      : `تم رفض الإدخال ${entryId}.`
  );
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--list') || args.length === 0) {
    await listPending();
    return;
  }

  const approveIdx = args.indexOf('--approve');
  if (approveIdx !== -1 && args[approveIdx + 1]) {
    await reviewOne(args[approveIdx + 1], 'approve');
    return;
  }

  const rejectIdx = args.indexOf('--reject');
  if (rejectIdx !== -1 && args[rejectIdx + 1]) {
    await reviewOne(args[rejectIdx + 1], 'reject');
    return;
  }

  console.log(
    'الاستعمال:\n' +
      '  node review-cli.js --list\n' +
      '  node review-cli.js --approve <entry_id>\n' +
      '  node review-cli.js --reject <entry_id>'
  );
}

main();
