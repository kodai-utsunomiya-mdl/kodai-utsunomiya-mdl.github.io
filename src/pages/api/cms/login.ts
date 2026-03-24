import { randomBytes } from "crypto";

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

export async function GET({ request }: { request: Request }) {
  const url = new URL(request.url);
  const clientId = import.meta.env.GITHUB_APP_CLIENT_ID;

  if (!clientId) {
    return new Response("Missing GITHUB_APP_CLIENT_ID", { status: 500 });
  }

  const state = randomBytes(16).toString("hex");
  const stateCookie = serializeCookie("cms_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 300,
  });

  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", `${url.origin}/api/cms/callback`);
  authorizeUrl.searchParams.set("scope", "read:user");
  authorizeUrl.searchParams.set("state", state);

  const headers = new Headers({ Location: authorizeUrl.toString() });
  headers.append("Set-Cookie", stateCookie);
  return new Response(null, { status: 302, headers });
}
