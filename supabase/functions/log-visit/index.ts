import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ??
  "https://fabriciodiaxxx-netizen.github.io").split(",").map((origin) => origin.trim()).filter(Boolean);

function corsHeaders(origin: string | null) {
  const allowed = origin !== null && allowedOrigins.includes(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin : allowedOrigins[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "apikey, content-type",
    "Vary": "Origin",
  };
}

function clientIp(request: Request): string | null {
  // These headers are set by the trusted hosting proxy. Never take an IP from JSON.
  const raw = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for");
  if (!raw) return null;
  const ip = raw.split(",")[0].trim().replace(/^\[|\]$/g, "");
  return /^[0-9a-fA-F:.]+$/.test(ip) ? ip : null;
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST" || !origin || !allowedOrigins.includes(origin)) {
    return new Response(null, { status: 403, headers });
  }

  const ip = clientIp(request);
  if (!ip) return new Response(null, { status: 204, headers });

  let body: { path?: unknown };
  try { body = await request.json(); } catch { return new Response(null, { status: 400, headers }); }
  const path = typeof body.path === "string" ? body.path : "";
  if (!path.startsWith("/") || path.length > 2048 || path.includes("?") || path.includes("#")) {
    return new Response(null, { status: 400, headers });
  }

  const userAgent = (request.headers.get("user-agent") ?? "").slice(0, 512);
  const country = request.headers.get("cf-ipcountry");
  const countryCode = country && /^[A-Z]{2}$/.test(country) ? country : null;
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } });

  // Limit repeated page loads from the same IP and route to one stored event per 10 minutes.
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: recent, error: recentError } = await admin.from("visit_events").select("id")
    .eq("ip_address", ip).eq("path", path).gte("visited_at", since).limit(1);
  if (recentError) { console.error("visit lookup failed", recentError.message); return new Response(null, { status: 500, headers }); }
  if (recent?.length) return new Response(null, { status: 204, headers });

  const { error } = await admin.from("visit_events").insert({
    ip_address: ip, user_agent: userAgent, path, country_code: countryCode,
  });
  if (error) { console.error("visit insert failed", error.message); return new Response(null, { status: 500, headers }); }
  return new Response(null, { status: 204, headers });
});
