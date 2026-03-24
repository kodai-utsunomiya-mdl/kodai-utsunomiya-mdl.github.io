import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blogCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    pubDate: z.date(),
    draft: z.boolean().optional().default(false),
    tags: z.array(z.string()).optional().default([]),
  }),
});

export const collections = {
  blog: blogCollection,
};
