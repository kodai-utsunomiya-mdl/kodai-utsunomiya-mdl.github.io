import crypto from "crypto";

const base64Url = (input: Buffer | string) => {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buffer
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

const getRepoInfo = () => {
  const repo = import.meta.env.GITHUB_REPO;
  if (!repo || !repo.includes("/")) {
    throw new Error("Missing GITHUB_REPO (owner/repo)");
  }
  const [owner, name] = repo.split("/");
  return { owner, name };
};

const getPrivateKey = () => {
  const raw = import.meta.env.GITHUB_APP_PRIVATE_KEY;
  if (!raw) {
    throw new Error("Missing GITHUB_APP_PRIVATE_KEY");
  }
  return raw.replace(/\\n/g, "\n");
};

const getAppJwt = () => {
  const appId = import.meta.env.GITHUB_APP_ID;
  if (!appId) {
    throw new Error("Missing GITHUB_APP_ID");
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 30,
    exp: now + 9 * 60,
    iss: appId,
  };
  const header = { alg: "RS256", typ: "JWT" };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(data);
  const signature = sign.sign(getPrivateKey());
  return `${data}.${base64Url(signature)}`;
};

const getInstallationId = () => {
  const installationId = import.meta.env.GITHUB_APP_INSTALLATION_ID;
  if (!installationId) {
    throw new Error("Missing GITHUB_APP_INSTALLATION_ID");
  }
  return installationId;
};

export const getInstallationToken = async () => {
  const jwt = getAppJwt();
  const installationId = getInstallationId();
  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "notes-admin",
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to create installation token: ${text}`);
  }

  const data = await response.json();
  return data.token as string;
};

export const githubRequest = async (path: string, init: RequestInit = {}) => {
  const token = await getInstallationToken();
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `token ${token}`);
  headers.set("Accept", "application/vnd.github+json");
  headers.set("User-Agent", "notes-admin");
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers,
  });
  return response;
};

export const getRepoPath = (path: string) => {
  const { owner, name } = getRepoInfo();
  return `/repos/${owner}/${name}/contents/${path}`;
};

export const getRepoInfoEnv = () => getRepoInfo();
