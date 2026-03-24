import { randomBytes } from "crypto";

export async function GET({ request, cookies }: { request: Request; cookies: any }) {
  const url = new URL(request.url);
  const clientId = import.meta.env.GITHUB_APP_CLIENT_ID;

  if (!clientId) {
    return new Response("Missing GITHUB_APP_CLIENT_ID", { status: 500 });
  }

  const state = randomBytes(16).toString("hex");
  cookies.set("cms_oauth_state", state, {
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

  return Response.redirect(authorizeUrl.toString(), 302);
}
