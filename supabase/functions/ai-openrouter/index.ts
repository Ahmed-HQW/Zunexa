// supabase/functions/ai-openrouter/index.ts
// Proxy آمن لـ OpenRouter. المفتاح كيتقرا من env (OPENROUTER_API_KEY)
// وما كيوصلش أبداً للمتصفح ديال المستخدم.

import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { checkAuthAndPlan, PLAN_LIMITS } from "../_shared/auth-check.ts";

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

  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "server_missing_openrouter_key" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
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

  try {
    const upstream = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://zunexa.vercel.app",
          "X-Title": "Zunexa AI",
        },
        body: JSON.stringify({
          model: body.model || "openai/gpt-4o-mini",
          messages: body.messages,
          temperature: body.temperature ?? 0.7,
          max_tokens: limit.maxTokens,
        }),
      }
    );

    const data = await upstream.json();

    if (!upstream.ok) {
      return new Response(
        JSON.stringify({ error: "upstream_error", detail: data }),
        {
          status: upstream.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "proxy_failed", detail: String(err) }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
