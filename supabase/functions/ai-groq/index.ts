// supabase/functions/ai-groq/index.ts
// Proxy آمن لـ Groq. المفتاح كيتقرا من env (GROQ_API_KEY، GROQ_API_KEY_2...)
// نفس منطق الـ fallback بين المفاتيح بحال Gemini.

import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { checkAuthAndPlan, PLAN_LIMITS } from "../_shared/auth-check.ts";

function getGroqKeys(): string[] {
  const keys: string[] = [];
  const primary = Deno.env.get("GROQ_API_KEY");
  if (primary) keys.push(primary);
  for (let i = 2; i <= 5; i++) {
    const k = Deno.env.get(`GROQ_API_KEY_${i}`);
    if (k) keys.push(k);
  }
  return keys;
}

Deno.serve(async (req: Request) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const auth = await checkAuthAndPlan(req);
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status ?? 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const keys = getGroqKeys();
  if (keys.length === 0) {
    return new Response(JSON.stringify({ error: "server_missing_groq_key" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { messages?: unknown[]; model?: string; temperature?: number };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json_body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response(JSON.stringify({ error: "messages_required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const limit = PLAN_LIMITS[auth.plan ?? "free"] ?? PLAN_LIMITS.free;
  const model = body.model || "llama-3.3-70b-versatile";

  let lastError: unknown = null;

  for (const apiKey of keys) {
    try {
      const upstream = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: body.messages,
            temperature: body.temperature ?? 0.7,
            max_tokens: limit.maxTokens,
          }),
        }
      );

      const data = await upstream.json();

      if (upstream.ok) {
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (upstream.status === 429) {
        lastError = data;
        continue; // نجرب مفتاح آخر
      }

      return new Response(
        JSON.stringify({ error: "upstream_error", detail: data }),
        {
          status: upstream.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  return new Response(
    JSON.stringify({ error: "all_groq_keys_failed", detail: String(lastError) }),
    {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
