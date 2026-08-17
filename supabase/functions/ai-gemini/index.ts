// supabase/functions/ai-gemini/index.ts
// Proxy آمن لـ Google Gemini. المفتاح كيتقرا من env (GEMINI_API_KEY).
// كيدعم rotation بسيط بين عدة مفاتيح إلا عندك بزاف (GEMINI_API_KEY_2, _3...)

import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { checkAuthAndPlan, PLAN_LIMITS } from "../_shared/auth-check.ts";

function getGeminiKeys(): string[] {
  const keys: string[] = [];
  const primary = Deno.env.get("GEMINI_API_KEY");
  if (primary) keys.push(primary);
  for (let i = 2; i <= 5; i++) {
    const k = Deno.env.get(`GEMINI_API_KEY_${i}`);
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

  const keys = getGeminiKeys();
  if (keys.length === 0) {
    return new Response(
      JSON.stringify({ error: "server_missing_gemini_key" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  let body: {
    messages?: { role: string; content: string }[];
    model?: string;
    temperature?: number;
  };
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
  const model = body.model || "gemini-1.5-flash";

  // تحويل صيغة الرسائل لصيغة Gemini (contents/parts)
  const contents = body.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const systemMsg = body.messages.find((m) => m.role === "system");

  let lastError: unknown = null;

  // نجربو المفاتيح واحد بواحد، إلا وحد فشل (rate limit مثلا) نمشيو للي بعدو
  for (const apiKey of keys) {
    try {
      const upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            systemInstruction: systemMsg
              ? { parts: [{ text: systemMsg.content }] }
              : undefined,
            generationConfig: {
              temperature: body.temperature ?? 0.7,
              maxOutputTokens: limit.maxTokens,
            },
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

      // إلا كان quota/rate-limit، جرب المفتاح اللي بعدو
      if (upstream.status === 429 || upstream.status === 403) {
        lastError = data;
        continue;
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
    JSON.stringify({
      error: "all_gemini_keys_failed",
      detail: String(lastError),
    }),
    {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
