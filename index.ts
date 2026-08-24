// ═══════════════════════════════════════════════════════════════════
// ZUNEXA — agent-planner Edge Function
// Powers the Project Intelligence Agent (Coder / Planner / Tasker /
// Tester / Info roles). Every request:
//   1) verifies the caller's Supabase JWT (real user, not spoofable)
//   2) resolves their REAL plan server-side (get_agent_plan RPC)
//   3) pre-checks their monthly token quota (check_agent_quota RPC)
//      BEFORE spending a single upstream token
//   4) calls the upstream provider (OpenRouter free tier / Gemini
//      free tier / DeepSeek free tier) with the service-role key,
//      never exposing provider keys to the browser
//   5) logs the exchange to agent_messages and increments usage via
//      increment_agent_usage (security definer) — server is always
//      the source of truth, the client can never fake this ledger
// ═══════════════════════════════════════════════════════════════════
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { agentJson, agentPreflight } from "../_shared/agent-cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") ?? "";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY") ?? "";

const AGENT_SYSTEM_PROMPTS: Record<string, string> = {
  coder:
    "أنت وكيل برمجي (Coder Agent) داخل Zunexa Project Intelligence Agent. " +
    "مهمتك كتابة كود إنتاجي كامل حسب الـ stack المختار للمشروع، بلا اختصارات أو placeholders. " +
    "جاوب بالدارجة أو الفصحى حسب لغة المستخدم، واشرح القرارات التقنية بإيجاز.",
  planner:
    "أنت وكيل تخطيط (Planner Agent) داخل Zunexa Project Intelligence Agent. " +
    "مهمتك تقسيم المشروع لمراحل وخطوات واضحة، وتحديد الأولويات، وربطها بمراحل المشروع (discovery → planning → in_progress → testing → delivered).",
  tasker:
    "أنت وكيل مهام (Tasker Agent) داخل Zunexa Project Intelligence Agent. " +
    "مهمتك تحويل الأهداف لمهام قابلة للتنفيذ (actionable tasks) بأولوية وتاريخ استحقاق عند الإمكان.",
  tester:
    "أنت وكيل اختبار (Tester Agent) داخل Zunexa Project Intelligence Agent. " +
    "مهمتك مراجعة الكود أو الخطة المقترحة، وكشف الثغرات المحتملة، وحالات الحافة (edge cases)، واقتراح اختبارات محددة.",
  info:
    "أنت وكيل معلومات وملخصات (Info/Resume Agent) داخل Zunexa Project Intelligence Agent. " +
    "مهمتك تلخيص حالة المشروع الحالية بدقة ووضوح، بصيغة يمكن حفظها كسجل تقدم (resume).",
};

const PROVIDER_MODEL: Record<string, string> = {
  openrouter: "meta-llama/llama-3.1-8b-instruct:free",
  gemini: "gemini-1.5-flash",
  deepseek: "deepseek-chat",
};

function estimateTokens(text: string): number {
  // Cheap, provider-agnostic estimate (~4 chars/token) used only as a
  // pre-flight guard; the authoritative count for billing comes back
  // from the provider response when available.
  return Math.ceil((text || "").length / 4);
}

async function callOpenRouter(
  systemPrompt: string,
  messages: { role: string; content: string }[],
  maxTokens: number,
) {
  if (!OPENROUTER_API_KEY) throw new Error("openrouter_key_missing");
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: PROVIDER_MODEL.openrouter,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      max_tokens: maxTokens,
      temperature: 0.6,
    }),
  });
  if (!res.ok) throw new Error(`openrouter_http_${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("openrouter_empty");
  const tokens = data?.usage?.total_tokens ?? estimateTokens(text);
  return { text, tokens };
}

async function callGemini(
  systemPrompt: string,
  messages: { role: string; content: string }[],
  maxTokens: number,
) {
  if (!GEMINI_API_KEY) throw new Error("gemini_key_missing");
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${PROVIDER_MODEL.gemini}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.6 },
      }),
    },
  );
  if (!res.ok) throw new Error(`gemini_http_${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("").trim();
  if (!text) throw new Error("gemini_empty");
  const tokens = data?.usageMetadata?.totalTokenCount ?? estimateTokens(text);
  return { text, tokens };
}

async function callDeepSeek(
  systemPrompt: string,
  messages: { role: string; content: string }[],
  maxTokens: number,
) {
  if (!DEEPSEEK_API_KEY) throw new Error("deepseek_key_missing");
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: PROVIDER_MODEL.deepseek,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      max_tokens: maxTokens,
      temperature: 0.6,
    }),
  });
  if (!res.ok) throw new Error(`deepseek_http_${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("deepseek_empty");
  const tokens = data?.usage?.total_tokens ?? estimateTokens(text);
  return { text, tokens };
}

const PROVIDER_CHAIN: Array<
  (
    systemPrompt: string,
    messages: { role: string; content: string }[],
    maxTokens: number,
  ) => Promise<{ text: string; tokens: number }>
> = [callOpenRouter, callGemini, callDeepSeek];

Deno.serve(async (req) => {
  const pre = agentPreflight(req);
  if (pre) return pre;

  if (req.method !== "POST") {
    return agentJson({ error: "method_not_allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return agentJson({ error: "not_authenticated" }, 401);

  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
  if (userErr || !userData?.user) {
    return agentJson({ error: "invalid_session" }, 401);
  }
  const uid = userData.user.id;

  let body: {
    project_id?: string;
    agent_role?: string;
    message?: string;
    history?: { role: string; content: string }[];
  };
  try {
    body = await req.json();
  } catch {
    return agentJson({ error: "invalid_json" }, 400);
  }

  const projectId = body.project_id;
  const agentRole = (body.agent_role || "planner").toLowerCase();
  const userMessage = (body.message || "").trim();
  const history = Array.isArray(body.history) ? body.history.slice(-16) : [];

  if (!projectId) return agentJson({ error: "project_id_required" }, 400);
  if (!userMessage) return agentJson({ error: "message_required" }, 400);
  if (!AGENT_SYSTEM_PROMPTS[agentRole]) {
    return agentJson({ error: "invalid_agent_role" }, 400);
  }

  // Ownership check — never trust project_id blindly, confirm this
  // caller actually owns it (RLS would also block it, but service-role
  // bypasses RLS, so this explicit check is required here).
  const { data: project, error: projErr } = await supabaseAdmin
    .from("agent_projects")
    .select("id, user_id, agents_enabled, pricing_tier")
    .eq("id", projectId)
    .maybeSingle();
  if (projErr || !project || project.user_id !== uid) {
    return agentJson({ error: "project_not_found_or_forbidden" }, 403);
  }

  const enabledRoles: string[] = Array.isArray(project.agents_enabled)
    ? project.agents_enabled
    : JSON.parse(project.agents_enabled || "[]");
  if (!enabledRoles.includes(agentRole)) {
    return agentJson({ error: "agent_role_not_enabled_for_plan" }, 403);
  }

  // Pre-flight quota check — server-side, authoritative, cannot be
  // skipped or spoofed from the client.
  const { data: quota, error: quotaErr } = await supabaseAdmin.rpc(
    "check_agent_quota",
    { p_uid: uid },
  );
  if (quotaErr) return agentJson({ error: "quota_check_failed" }, 500);
  if (!quota?.allowed) {
    return agentJson(
      { error: "quota_exceeded", plan: quota?.plan, remaining: quota?.remaining },
      402,
    );
  }

  const maxTokens = Math.min(quota.max_tokens_per_req ?? 1200, quota.remaining || 1200);
  if (maxTokens <= 0) {
    return agentJson({ error: "quota_exceeded", plan: quota?.plan }, 402);
  }

  const systemPrompt = AGENT_SYSTEM_PROMPTS[agentRole];
  const chatMessages = [...history, { role: "user", content: userMessage }];

  let result: { text: string; tokens: number } | null = null;
  let lastError = "unknown";
  for (const provider of PROVIDER_CHAIN) {
    try {
      result = await provider(systemPrompt, chatMessages, maxTokens);
      if (result) break;
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      continue;
    }
  }

  if (!result) {
    return agentJson({ error: "all_providers_failed", detail: lastError }, 502);
  }

  await supabaseAdmin.from("agent_messages").insert([
    {
      project_id: projectId,
      user_id: uid,
      agent_role: agentRole,
      role: "user",
      content: userMessage,
      tokens_used: 0,
    },
    {
      project_id: projectId,
      user_id: uid,
      agent_role: agentRole,
      role: "assistant",
      content: result.text,
      tokens_used: result.tokens,
    },
  ]);

  const { data: usage } = await supabaseAdmin.rpc("increment_agent_usage", {
    p_uid: uid,
    p_tokens: result.tokens,
  });

  return agentJson({
    ok: true,
    text: result.text,
    tokens_used: result.tokens,
    usage,
  });
});
