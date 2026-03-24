import { getSessionCookieName } from "../../../lib/session";

const serializeCookie = (
  name: string,
  value: string,
  options: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "lax" | "strict" | "none";
    path?: string;
    maxAge?: number;
  }
) => {
  const parts = [`${name}=${value}`];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.path) parts.push(`Path=${options.path}`);
  return parts.join("; ");
};

export async function POST({ request }: { request: Request }) {
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
}
