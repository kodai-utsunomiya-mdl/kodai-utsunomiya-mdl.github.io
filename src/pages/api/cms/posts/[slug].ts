import { getSessionCookieName, verifySessionToken } from "../../../../lib/session";
import { formatFrontmatter, parseFrontmatter } from "../../../../lib/frontmatter";
import { getRepoInfoEnv, getRepoPath, githubRequest } from "../../../../lib/githubApp";

const BLOG_DIR = "src/content/blog";

const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const requireSession = (cookies: any) => {
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

export async function GET({ params, cookies }: { params: any; cookies: any }) {
  const session = requireSession(cookies);
  if (session instanceof Response) return session;
  const slug = params.slug;
  if (!slug || !isValidSlug(slug)) {
    return jsonResponse({ error: "Invalid slug." }, 400);
  }

  const path = `${BLOG_DIR}/${slug}.md`;
  const { content } = await fetchFileContent(path);
  const { data, body } = parseFrontmatter(content);

  return jsonResponse({
    slug,
    title: data.title ?? "",
    description: data.description ?? "",
    pubDate: data.pubDate ?? "",
    draft: Boolean(data.draft),
    body,
  });
}

export async function PUT({
  params,
  request,
  cookies,
}: {
  params: any;
  request: Request;
  cookies: any;
}) {
  const session = requireSession(cookies);
  if (session instanceof Response) return session;
  const slug = params.slug;
  if (!slug || !isValidSlug(slug)) {
    return jsonResponse({ error: "Invalid slug." }, 400);
  }

  const body = await request.json();
  const title = (body.title || "").trim();
  const description = (body.description || "").trim();
  const pubDate = (body.pubDate || "").trim();
  const draft = Boolean(body.draft);
  const contentBody = (body.body || "").trim();

  if (!title || !pubDate) {
    return jsonResponse({ error: "title and pubDate are required." }, 400);
  }

  const frontmatter = formatFrontmatter({
    title,
    description: description || undefined,
    pubDate,
    draft,
  });
  const content = `${frontmatter}${contentBody}\n`;
  const path = `${BLOG_DIR}/${slug}.md`;

  const { sha } = await fetchFileContent(path);
  const { owner, name } = getRepoInfoEnv();
  const response = await githubRequest(`/repos/${owner}/${name}/contents/${path}`, {
    method: "PUT",
    body: JSON.stringify({
      message: `Update note: ${slug}`,
      content: toBase64(content),
      sha,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return jsonResponse({ error: text }, response.status);
  }

  return jsonResponse({ ok: true });
}

export async function DELETE({ params, cookies }: { params: any; cookies: any }) {
  const session = requireSession(cookies);
  if (session instanceof Response) return session;

  const slug = params.slug;
  if (!slug || !isValidSlug(slug)) {
    return jsonResponse({ error: "Invalid slug." }, 400);
  }

  const path = `${BLOG_DIR}/${slug}.md`;
  const { sha } = await fetchFileContent(path);
  const { owner, name } = getRepoInfoEnv();
  const response = await githubRequest(`/repos/${owner}/${name}/contents/${path}`, {
    method: "DELETE",
    body: JSON.stringify({
      message: `Delete note: ${slug}`,
      sha,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return jsonResponse({ error: text }, response.status);
  }

  return jsonResponse({ ok: true });
}
