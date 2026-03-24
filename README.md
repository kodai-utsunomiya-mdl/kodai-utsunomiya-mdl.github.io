# Kodai Utsunomiya Website

This repository hosts the public website for Kodai Utsunomiya.

## Developer Notes

### Stack
- Astro

### Local Development
```sh
npm install
npm run dev
```

### Build
```sh
npm run build
npm run preview
```

### Content
- Main page: `src/pages/index.astro`
- Notes entries: `src/content/blog/*.md`
- Layout: `src/layouts/BaseLayout.astro`
- Assets: `public/`

### Notes Authoring
Notes entries live in `src/content/blog/` as Markdown files. The filename becomes the URL slug.

Steps:
1) Create a new file in `src/content/blog/` (e.g. `my-post.md`).
2) Add frontmatter and body.
3) Save and run the dev server to confirm rendering.

Frontmatter example:
```md
---
title: "記事タイトル"
description: "概要文．"
pubDate: 2026-03-24
draft: false
---
```

Notes:
- `draft: true` will hide the post from the list and from static generation.
- Use a blank line to separate paragraphs. Paragraph spacing comes from `.blog-content p` in `public/style.css`.
- Headings use standard Markdown (`##`, `###`) and are styled in `public/style.css`.
- Inline math uses `$...$` and is rendered by MathJax.
- Images can be added with Markdown, files should live in `public/`:
  `![説明](/mt_1.png)`
- Inline color can be applied with HTML:
  `<span class="text-color" style="--inline-text-color:#b45309;">強調</span>`

### GUI Editor (Decap CMS)
The site includes a GUI editor at `/admin/` using Decap CMS. It commits directly to GitHub.

Setup:
1) Create a GitHub OAuth App.
2) Set the callback URL to `https://kodai-utsunomiya.vercel.app/admin/`.
3) Add the client id/secret as Vercel environment variables:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
4) Deploy, then open `/admin/` and log in with GitHub.

Config lives at `public/admin/config.yml` and the auth handler is `src/pages/api/auth/index.ts`.
