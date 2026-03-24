export async function GET({ request }: { request: Request }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const clientId = import.meta.env.GITHUB_CLIENT_ID;
  const clientSecret = import.meta.env.GITHUB_CLIENT_SECRET;

  if (!code) {
    return new Response("Missing code", { status: 400 });
  }
  if (!clientId || !clientSecret) {
    return new Response("Missing GitHub OAuth env", { status: 500 });
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
      window.opener && window.opener.postMessage('authorization:${token}', '*');
      window.close();
    </script>
  </body>
</html>`;

  return new Response(body, {
    headers: { "Content-Type": "text/html" },
  });
}
