// Vercel Serverless Function — GET /api/geo
// Reads the geo headers Vercel injects at the edge. Same-origin => no CORS problem,
// no third-party API, no rate limit, no extra latency.
export default function handler(req, res) {
  const h = req.headers;
  const countryCode = (h['x-vercel-ip-country'] || '').toUpperCase() || null;
  let city = null;
  try { city = h['x-vercel-ip-city'] ? decodeURIComponent(h['x-vercel-ip-city']) : null; } catch (e) {}

  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.status(200).json({
    countryCode,
    city,
    region: h['x-vercel-ip-country-region'] || null
  });
}
