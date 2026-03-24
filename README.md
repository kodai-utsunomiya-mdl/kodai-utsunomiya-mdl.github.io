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
title: "Sample Title"
description: "Short summary"
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
  `![Figure]( /mt_1.png )`
- Inline color can be applied with HTML:
  `<span class="text-color" style="--inline-text-color:#b45309;">Highlight</span>`

### Notes Admin (Custom)
The site uses a custom admin at `/admin/` backed by a GitHub App.

Setup:
1) Create a GitHub App.
2) Set "Callback URL" to `https://kodai-utsunomiya.vercel.app/api/cms/callback`.
3) Install the App on the repository.
4) Add these Vercel environment variables:
   - `GITHUB_REPO` (e.g. `kodai-utsunomiya-mdl/kodai-utsunomiya-mdl.github.io`)
   - `GITHUB_APP_ID`
   - `GITHUB_APP_PRIVATE_KEY`
   - `GITHUB_APP_INSTALLATION_ID`
   - `GITHUB_APP_CLIENT_ID`
   - `GITHUB_APP_CLIENT_SECRET`
   - `CMS_SESSION_SECRET`
   - `CMS_ALLOWED_USERS` (comma-separated GitHub logins)
5) Deploy, then open `/admin/` and log in.

Required App permissions:
- Repository contents: Read and write
- Metadata: Read-only
