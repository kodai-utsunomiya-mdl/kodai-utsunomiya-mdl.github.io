import type { APIRoute } from "astro";
import { serializeCookie } from "../../../lib/cookies";
import { createSessionToken, getSessionCookieName, getSessionTtlSeconds } from "../../../lib/session";

const getAllowedUsers = () => {
  const raw = import.meta.env.CMS_ALLOWED_USERS || "";
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const GET: APIRoute = async ({ request, cookies }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = cookies.get("cms_oauth_state")?.value;

  if (!code || !state || !storedState || state !== storedState) {
    return new Response("Invalid OAuth state.", { status: 400 });
  }

  const clientId = import.meta.env.GITHUB_APP_CLIENT_ID;
  const clientSecret = import.meta.env.GITHUB_APP_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return new Response("Missing OAuth client credentials.", { status: 500 });
  }

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  const tokenData = await tokenResponse.json();
  if (tokenData.error) {
    return new Response(JSON.stringify(tokenData), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const accessToken = tokenData.access_token as string;
  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "notes-admin",
    },
  });

  if (!userResponse.ok) {
    return new Response("Failed to fetch user info.", { status: 401 });
  }

  const user = await userResponse.json();
  const allowedUsers = getAllowedUsers();
  if (allowedUsers.length > 0 && !allowedUsers.includes(user.login)) {
    return new Response("User not allowed.", { status: 403 });
  }

  const sessionToken = createSessionToken(user.login);
  const sessionCookie = serializeCookie(getSessionCookieName(), sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: getSessionTtlSeconds(),
  });
  const clearState = serializeCookie("cms_oauth_state", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  const headers = new Headers({ Location: `${url.origin}/admin/` });
  headers.append("Set-Cookie", sessionCookie);
  headers.append("Set-Cookie", clearState);
  return new Response(null, { status: 302, headers });
};
