const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---\n?/;

const normalizeLine = (value: string) => value.replace(/\r/g, "");

const parseValue = (raw: string) => {
  const trimmed = raw.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^".*"$/.test(trimmed) || /^'.*'$/.test(trimmed)) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

export const parseFrontmatter = (content: string) => {
  const match = normalizeLine(content).match(FRONTMATTER_REGEX);
  if (!match) return { data: {}, body: content };

  const lines = match[1].split("\n");
  const data: Record<string, string | boolean> = {};
  for (const line of lines) {
    const [key, ...rest] = line.split(":");
    if (!key || rest.length === 0) continue;
    data[key.trim()] = parseValue(rest.join(":"));
  }
  const body = normalizeLine(content).slice(match[0].length);
  return { data, body };
};

const escapeYaml = (value: string) => {
  return `"${value.replace(/"/g, '\\"')}"`;
};

export const formatFrontmatter = (data: {
  title: string;
  description?: string;
  pubDate: string;
  draft?: boolean;
}) => {
  const lines = [
    `title: ${escapeYaml(data.title)}`,
    ...(data.description ? [`description: ${escapeYaml(data.description)}`] : []),
    `pubDate: ${escapeYaml(data.pubDate)}`,
    `draft: ${data.draft ? "true" : "false"}`,
  ];
  return `---\n${lines.join("\n")}\n---\n`;
};
