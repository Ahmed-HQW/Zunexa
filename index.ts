// supabase/functions/confirm-payment/index.ts
//
// يستقبل { order_ref } من admin.html، ويستدعي الدالة الآمنة
// public.confirm_payment(order_ref) بواسطة توكن الأدمن نفسه (الجلسة
// المُرسَلة فـ Authorization header) — مش service_role — باش
// auth.uid() جوّج الدالة يبقى هو UID ديال الأدمن الحقيقي، ونفس
// التحقق role='admin' يبقى صالح كما فـ redeem_plan_code.
//
// CORS مفتوح على نفس نطاق التطبيق فقط — عدّل ALLOWED_ORIGIN حسب
// دومين الإنتاج ديالك.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGIN = '*'; // TODO: بدّلها بـ 'https://zunexa.vercel.app' فالإنتاج

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'method_not_allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'missing_auth' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { order_ref } = await req.json();
    if (!order_ref || typeof order_ref !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'missing_order_ref' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // عميل Supabase مُهيّأ بتوكن المستخدم المستدعي (الأدمن) نفسه —
    // وليس service_role — باش الـ RLS و auth.uid() جوّج الدالة
    // الآمنة يعكسو هويته الحقيقية.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // الدالة confirm_payment (security definer) هي اللي كتدير كل
    // التحقق: role='admin'؟ الطلب موجود؟ ماشي مؤكد من قبل؟ ثم كتفعّل
    // الخطة للمستخدم مباشرة فـ profiles.
    const { data, error } = await supabase.rpc('confirm_payment', { order_ref });
    if (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
