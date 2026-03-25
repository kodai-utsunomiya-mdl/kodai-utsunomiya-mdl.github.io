import YAML from "yaml";

const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---\n?/;

const normalizeLine = (value: string) => value.replace(/\r/g, "");

type FrontmatterData = Record<string, string | boolean | number | null | undefined>;

export const parseFrontmatter = (content: string) => {
  const normalized = normalizeLine(content);
  const match = normalized.match(FRONTMATTER_REGEX);
  if (!match) return { data: {}, body: content };

  let data: FrontmatterData = {};
  try {
    const parsed = YAML.parse(match[1]);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      data = parsed as FrontmatterData;
    }
  } catch {
    data = {};
  }
  const body = normalized.slice(match[0].length);
  return { data, body };
};

export const formatFrontmatter = (data: {
  title: string;
  description?: string;
  pubDate: string;
  draft?: boolean;
}) => {
  const payload = {
    title: data.title,
    ...(data.description ? { description: data.description } : {}),
    pubDate: data.pubDate,
    draft: Boolean(data.draft),
  };
  const yaml = YAML.stringify(payload).trimEnd();
  return `---\n${yaml}\n---\n`;
};
