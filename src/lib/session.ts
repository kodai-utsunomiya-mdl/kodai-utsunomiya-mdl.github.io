import crypto from "crypto";

const SESSION_COOKIE = "cms_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

const base64Url = (input: Buffer | string) => {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buffer
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

const base64UrlDecode = (input: string) => {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${pad}`, "base64").toString("utf-8");
};

const signPayload = (payload: string, secret: string) => {
  return base64Url(crypto.createHmac("sha256", secret).update(payload).digest());
};

export const createSessionToken = (login: string) => {
  const secret = import.meta.env.CMS_SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing CMS_SESSION_SECRET");
  }

  const payload = {
    login,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encoded = base64Url(JSON.stringify(payload));
  const signature = signPayload(encoded, secret);
  return `${encoded}.${signature}`;
};

export const verifySessionToken = (token: string | undefined) => {
  if (!token) return null;
  const secret = import.meta.env.CMS_SESSION_SECRET;
  if (!secret) return null;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = signPayload(encoded, secret);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encoded));
    if (typeof payload.exp !== "number" || payload.exp < Date.now() / 1000) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
};

export const getSessionCookieName = () => SESSION_COOKIE;

export const getSessionTtlSeconds = () => SESSION_TTL_SECONDS;
