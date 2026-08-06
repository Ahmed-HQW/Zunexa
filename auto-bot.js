import { createClient } from '@supabase/supabase-js'

const _SB = createClient(
  'https://xrldhfsytysznyyhwjlr.supabase.co',
  'sb_publishable_qtZyzLSPVYjH0yB0BJY8yg_2r2ct35F'
);

async function runTask() {
  console.log("جاري تشغيل محرك المعرفة التلقائي...");

  // 1. إضافة أو تحديث المعرفة (يمكنك وضع مصفوفة الأسئلة هنا)
  // أو جعل السكربت يقبل ويُفعل كل المدخلات المعلقة مباشرة في قاعدة البيانات بضغطة واحدة سحابية
  const { error } = await _SB
    .from('ai_knowledge')
    .update({
      is_active: true,
      review_status: 'approved',
      weight: 1.0
    })
    .eq('review_status', 'pending_review');

  if (error) {
    console.error('خطأ:', error.message);
  } else {
    console.log('تم قبول وتفعيل جميع المدخلات المعلقة بنجاح في الخلفية!');
  }
}

runTask();
