import type { APIContext, APIRoute } from "astro";
import { getSessionCookieName, verifySessionToken } from "../../../../lib/session";
import { formatFrontmatter, parseFrontmatter } from "../../../../lib/frontmatter";
import { getRepoInfoEnv, getRepoPath, githubRequest } from "../../../../lib/githubApp";

const NOTES_DIR = "src/content/notes";

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

const isValidSlug = (slug: string) => /^[a-z0-9-]+$/i.test(slug);

const toBase64 = (input: string) => Buffer.from(input, "utf-8").toString("base64");

const fetchFileContent = async (path: string) => {
  const response = await githubRequest(getRepoPath(path));
  if (!response.ok) {
    throw new Error(`Failed to fetch content for ${path}`);
  }
  const data = await response.json();
  const content = Buffer.from(data.content, "base64").toString("utf-8");
  return { content, sha: data.sha };
};

export const GET: APIRoute = async ({ cookies }) => {
  const session = requireSession(cookies);
  if (session instanceof Response) return session;

  const response = await githubRequest(getRepoPath(NOTES_DIR));
  if (!response.ok) {
    return jsonResponse({ error: "Failed to list posts." }, response.status);
  }
  const entries = await response.json();
  const posts = await Promise.all(
    entries
      .filter((entry: any) => entry.type === "file" && entry.name.endsWith(".md"))
      .map(async (entry: any) => {
        const { content } = await fetchFileContent(entry.path);
        const { data } = parseFrontmatter(content);
        return {
          slug: entry.name.replace(/\.md$/, ""),
          title: data.title ?? entry.name,
          description: data.description ?? "",
          pubDate: data.pubDate ?? "",
          draft: Boolean(data.draft),
        };
      })
  );

  return jsonResponse({ posts });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = requireSession(cookies);
  if (session instanceof Response) return session;
  const body = await request.json();
  const slug = (body.slug || "").trim();
  const title = (body.title || "").trim();
  const description = (body.description || "").trim();
  const pubDate = (body.pubDate || "").trim();
  const draft = Boolean(body.draft);
  const contentBody = (body.body || "").trim();

  if (!slug || !title || !pubDate) {
    return jsonResponse({ error: "slug, title, pubDate are required." }, 400);
  }
  if (!isValidSlug(slug)) {
    return jsonResponse({ error: "Invalid slug format." }, 400);
  }

  const frontmatter = formatFrontmatter({
    title,
    description: description || undefined,
    pubDate,
    draft,
  });
  const content = `${frontmatter}${contentBody}\n`;
  const path = `${NOTES_DIR}/${slug}.md`;
  const { owner, name } = getRepoInfoEnv();

  const response = await githubRequest(`/repos/${owner}/${name}/contents/${path}`, {
    method: "PUT",
    body: JSON.stringify({
      message: `Add note: ${slug}`,
      content: toBase64(content),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return jsonResponse({ error: text }, response.status);
  }

  return jsonResponse({ ok: true });
};
