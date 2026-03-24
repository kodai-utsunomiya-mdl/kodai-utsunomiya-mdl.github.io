export async function GET({ request }: { request: Request }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const debug = url.searchParams.get("debug");
  const clientId = import.meta.env.GITHUB_CLIENT_ID;
  const clientSecret = import.meta.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    const debugInfo = {
      hasClientId: Boolean(clientId),
      hasClientSecret: Boolean(clientSecret),
      host: url.host,
      origin: url.origin,
      hasCode: Boolean(code),
    };
    return new Response(JSON.stringify(debugInfo), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!code) {
    const redirectUriUrl = new URL(`${url.origin}/api/auth`);
    if (debug) {
      redirectUriUrl.searchParams.set("debug", "1");
    }
    const redirectUri = redirectUriUrl.toString();
    const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
    authorizeUrl.searchParams.set("client_id", clientId);
    authorizeUrl.searchParams.set("redirect_uri", redirectUri);
    authorizeUrl.searchParams.set("scope", "public_repo");
    if (state) authorizeUrl.searchParams.set("state", state);
    return new Response(null, {
      status: 302,
      headers: { Location: authorizeUrl.toString() },
    });
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

  const token = tokenData.access_token;
  const body = `<!doctype html>
<html>
  <body>
    <script>
      const message = 'authorization:${token}';
      if (window.opener) {
        window.opener.postMessage(message, window.location.origin);
      }
      try {
        window.localStorage.setItem('decap_auth_token', message);
      } catch (e) {}
      ${debug ? "document.body.innerText = 'auth ok';" : "window.close();"}
    </script>
  </body>
</html>`;

  return new Response(body, {
    headers: { "Content-Type": "text/html" },
  });
}
