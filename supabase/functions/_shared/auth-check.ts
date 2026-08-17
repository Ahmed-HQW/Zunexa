// _shared/auth-check.ts
// كتحقق من session ديال المستخدم عبر التوكن اللي بعث، وكترجع
// معلومات الخطة ديالو. هادشي كيمنع أي واحد بلا حساب (ولا بحساب
// مزور) يستعمل الـ Edge Function ويصرف الفلوس ديالك فالـ API.

import { createClient } from "npm:@supabase/supabase-js@2";

export interface AuthResult {
  ok: boolean;
  userId?: string;
  plan?: string;
  error?: string;
  status?: number;
}

export async function checkAuthAndPlan(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return { ok: false, error: "missing_authorization_header", status: 401 };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // عميل مربوط بالتوكن ديال المستخدم باش نتحققو منو عبر Supabase Auth
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: "invalid_or_expired_session", status: 401 };
  }

  const { data: planRow } = await supabase
    .from("user_plan")
    .select("plan, status, expires_at")
    .eq("user_id", user.id)
    .maybeSingle();

  let plan = "free";
  if (planRow) {
    const expired =
      planRow.expires_at && new Date(planRow.expires_at) < new Date();
    plan = expired || planRow.status !== "active" ? "free" : planRow.plan;
  }

  return { ok: true, userId: user.id, plan };
}

// حدود بسيطة على حسب الخطة (تقدر تبدلها كيفما بغيتي)
export const PLAN_LIMITS: Record<string, { maxTokens: number }> = {
  free: { maxTokens: 512 },
  pro: { maxTokens: 2048 },
  max: { maxTokens: 8192 },
  standard: { maxTokens: 2048 },
  premium: { maxTokens: 8192 },
};
