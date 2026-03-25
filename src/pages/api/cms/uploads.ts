import type { APIContext, APIRoute } from "astro";
import { getSessionCookieName, verifySessionToken } from "../../../lib/session";
import { getRepoInfoEnv, githubRequest } from "../../../lib/githubApp";

const UPLOAD_DIR = "public/uploads";

const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const requireSession = (cookies: APIContext["cookies"]) => {
  const token = cookies.get(getSessionCookieName())?.value;
  const session = verifySessionToken(token);
  if (!session) {
    return new Response(null, { status: 401 });
  }
  return session;
};

const toBase64 = (input: ArrayBuffer) =>
  Buffer.from(new Uint8Array(input)).toString("base64");

const sanitizeName = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "");

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = requireSession(cookies);
  if (session instanceof Response) return session;

  const form = await request.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") {
    return jsonResponse({ error: "File is required." }, 400);
  }
  if (!file.type.startsWith("image/")) {
    return jsonResponse({ error: "Only image uploads are supported." }, 400);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const originalName = sanitizeName(file.name || "upload");
  const filename = `${timestamp}-${originalName || "image"}`;
  const path = `${UPLOAD_DIR}/${filename}`;

  const buffer = await file.arrayBuffer();
  const { owner, name } = getRepoInfoEnv();
  const response = await githubRequest(`/repos/${owner}/${name}/contents/${path}`, {
    method: "PUT",
    body: JSON.stringify({
      message: `Upload image: ${filename}`,
      content: toBase64(buffer),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return jsonResponse({ error: text }, response.status);
  }

  return jsonResponse({ url: `/uploads/${filename}` });
};
