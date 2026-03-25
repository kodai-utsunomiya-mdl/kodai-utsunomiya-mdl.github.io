import type { APIRoute } from "astro";
import { serializeCookie } from "../../../lib/cookies";
import { getSessionCookieName } from "../../../lib/session";

export const POST: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const clearSession = serializeCookie(getSessionCookieName(), "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  const headers = new Headers({ Location: `${url.origin}/admin/` });
  headers.append("Set-Cookie", clearSession);
  return new Response(null, { status: 302, headers });
};
