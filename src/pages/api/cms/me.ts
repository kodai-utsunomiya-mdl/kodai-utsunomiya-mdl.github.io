import { getSessionCookieName, verifySessionToken } from "../../../lib/session";

export async function GET({ cookies }: { cookies: any }) {
  const token = cookies.get(getSessionCookieName())?.value;
  const session = verifySessionToken(token);
  if (!session) {
    return new Response(null, { status: 401 });
  }

  return new Response(JSON.stringify({ login: session.login }), {
    headers: { "Content-Type": "application/json" },
  });
}
