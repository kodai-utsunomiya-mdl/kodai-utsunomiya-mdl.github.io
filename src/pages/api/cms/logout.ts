import { getSessionCookieName } from "../../../lib/session";

export async function POST({ request, cookies }: { request: Request; cookies: any }) {
  const url = new URL(request.url);
  cookies.delete(getSessionCookieName(), { path: "/" });
  return Response.redirect(`${url.origin}/admin/`, 302);
}
