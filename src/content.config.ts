import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blogCollection = defineCollection({
  type: "content",
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    pubDate: z.date(),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = {
  blog: blogCollection,
};
