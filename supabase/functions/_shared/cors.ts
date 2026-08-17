// _shared/cors.ts — headers مشتركة لكل Edge Functions
// بدل "*" بالدومين الحقيقي ديالك (مثلا "https://zunexa.vercel.app")
// قبل الإنتاج باش تسد الباب على أي موقع آخر يستعمل الـ Edge Function ديالك.

export const corsHeaders = {
"Access-Control-Allow-Origin": "https://zunexa.vercel.app",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function handleOptions(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return null;
}
