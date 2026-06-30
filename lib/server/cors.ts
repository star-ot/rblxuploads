import { getAllowedOrigins } from "@/lib/server/config";

export function corsPreflightResponse(request: Request): Response | null {
  const allowed = getAllowedOrigins();
  if (!allowed) {
    return null;
  }

  const origin = request.headers.get("origin");
  if (!origin || !allowed.includes(origin)) {
    return new Response(null, { status: 403 });
  }

  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export function applyCorsHeaders(request: Request, response: Response): Response {
  const allowed = getAllowedOrigins();
  if (!allowed) {
    return response;
  }

  const origin = request.headers.get("origin");
  if (!origin || !allowed.includes(origin)) {
    return response;
  }

  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders(origin))) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function rejectDisallowedOrigin(request: Request): Response | null {
  const allowed = getAllowedOrigins();
  if (!allowed) {
    return null;
  }

  const origin = request.headers.get("origin");
  if (origin && !allowed.includes(origin)) {
    return Response.json(
      { ok: false, error: "Origin not allowed by server CORS policy." },
      { status: 403 },
    );
  }

  return null;
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}
