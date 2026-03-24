# Personal Site (Developer README)

Scope: architecture, operations, configuration.

## Table of Contents
- [Stack](#stack)
- [Repository Structure](#repository-structure)
- [System Architecture](#system-architecture)
- [Recovery Checklist](#recovery-checklist)
- [Environment Variable Mapping](#environment-variable-mapping)
- [GitHub App Setup (Detailed)](#github-app-setup-detailed)
- [Installation ID Lookup](#installation-id-lookup)
- [Operational Flow](#operational-flow)
- [Local Development](#local-development)
- [Build and Preview](#build-and-preview)
- [Notes Content (Markdown)](#notes-content-markdown)
- [Notes List and Search](#notes-list-and-search)
- [Notes Detail Page](#notes-detail-page)
- [Notes Admin (Custom)](#notes-admin-custom)
- [GitHub App Setup](#github-app-setup)
- [Vercel Environment Variables](#vercel-environment-variables)
- [Deployment](#deployment)
- [Vercel Rebuild (From Scratch)](#vercel-rebuild-from-scratch)
- [Troubleshooting](#troubleshooting)
- [Style Sources](#style-sources)

## Stack
- Astro
- TypeScript (Astro endpoints)
- Markdown (Notes content)
- MathJax (math rendering)
- GitHub App (Notes Admin)

## Repository Structure
- Entry points
  - `src/pages/index.astro`: main page
  - `src/pages/notes/index.astro`: notes list + search
  - `src/pages/notes/[slug].astro`: notes detail
  - `src/pages/admin/index.astro`: custom Notes Admin UI
- Layout
  - `src/layouts/BaseLayout.astro`
  - `src/components/Header.astro`
  - `src/components/Footer.astro`
- Content
  - `src/content/notes/*.md`: notes entries
  - `src/content.config.ts`: content collection schema
- CMS backend (GitHub App)
  - `src/pages/api/cms/login.ts`
  - `src/pages/api/cms/callback.ts`
  - `src/pages/api/cms/logout.ts`
  - `src/pages/api/cms/me.ts`
  - `src/pages/api/cms/posts/index.ts` (GET/POST)
  - `src/pages/api/cms/posts/[slug].ts` (GET/PUT/DELETE)
  - `src/lib/githubApp.ts`
  - `src/lib/session.ts`
  - `src/lib/frontmatter.ts`
- Static assets
  - `public/`: images, CSS, fonts, favicon
- `public/style.css`: global styling

## System Architecture
```mermaid
flowchart TD
  User[User Browser] -->|HTTP| Vercel[Vercel Hosting]
  Vercel -->|Static pages| Astro[Astro Build Output]
  Astro --> NotesList[Notes List / Search]
  Astro --> NotesDetail[Notes Detail Pages]
  Astro --> AdminUI[Notes Admin UI]

  AdminUI -->|Login| CMSLogin[/api/cms/login/]
  CMSLogin --> GitHubOAuth[GitHub OAuth]
  GitHubOAuth --> CMSCallback[/api/cms/callback/]
  CMSCallback --> Session[Session Cookie]
  AdminUI -->|CRUD| CMSPosts[/api/cms/posts/]

  CMSPosts --> GitHubAPI[GitHub API]
  GitHubAPI --> Repo[GitHub Repository]
```

## Recovery Checklist

1) Access and accounts
   - Verify GitHub account access for the repo.
   - Verify Vercel account access for the project.
2) Local setup
   - Clone the repository.
   - `npm install`
   - `npm run dev`
3) Content sanity
   - Notes location: `src/content/notes/`.
   - Frontmatter uses `pubDate: YYYY-MM-DD` (no quotes).
4) Deploy sanity
   - Vercel project is connected to the repo `main`.
   - Required environment variables are set (see Env Mapping).
5) Admin sanity
   - `/admin/` loads.
   - GitHub App is installed on the repo.
   - Login succeeds and CRUD works.

## Environment Variable Mapping
Set in Vercel Project Settings.

| Env var | Source | Notes |
| --- | --- | --- |
| `GITHUB_REPO` | GitHub repo | `owner/name` (e.g. `kodai-utsunomiya-mdl/kodai-utsunomiya-mdl.github.io`) |
| `GITHUB_APP_ID` | GitHub App settings | App ID |
| `GITHUB_APP_PRIVATE_KEY` | GitHub App keys | Full key including `BEGIN/END` lines |
| `GITHUB_APP_INSTALLATION_ID` | GitHub App installation | Installation ID for this repo |
| `GITHUB_APP_CLIENT_ID` | GitHub App settings | Client ID |
| `GITHUB_APP_CLIENT_SECRET` | GitHub App settings | Client secret |
| `CMS_SESSION_SECRET` | Developer-provided | 32+ chars random string |
| `CMS_ALLOWED_USERS` | Developer-defined | Comma-separated GitHub logins |

## GitHub App Setup (Detailed)
1) Create a GitHub App.
2) Homepage URL: `https://kodai-utsunomiya.vercel.app`
3) Callback URL: `https://kodai-utsunomiya.vercel.app/api/cms/callback`
4) Permissions:
   - Repository contents: Read and write
   - Metadata: Read-only
5) Install the App on the repository.
6) Copy App ID, Client ID, Client secret, and generate a private key.
7) Obtain the installation ID for this repo.
8) Set env vars in Vercel using the mapping table above.

### Installation ID Lookup
1) Open the App settings page on GitHub.
2) Select the installed App for the target account.
3) Use the URL from the installation page:
   - `https://github.com/settings/installations/<INSTALLATION_ID>`
4) Copy the numeric ID and set it as `GITHUB_APP_INSTALLATION_ID`.

## Operational Flow
1) Author note locally or via `/admin/`.
2) Content is stored in `src/content/notes/` as Markdown.
3) Push or Admin updates GitHub contents API.
4) Vercel builds and publishes the static site.
5) `/notes/` list and detail pages reflect new content.

## Local Development
```sh
npm install
npm run dev
```

## Build and Preview
```sh
npm run build
npm run preview
```

## Notes Content (Markdown)
Notes location: `src/content/notes/`. The filename becomes the slug.

Frontmatter schema (see `src/content.config.ts`):
```md
---
title: "Sample Title"
description: "Short summary"
pubDate: 2026-03-24
draft: false
---
```

Authoring rules:
- `draft: true` hides the entry from the list and from static generation.
- `pubDate` must be a date (YYYY-MM-DD). Do not quote.
- Inline math: `$...$` (MathJax).
- Images: store files in `public/` and reference by root path.
  - Example: `![Figure](/mt_1.png)`
- Inline color: use HTML span.
  - Example: `<span class="text-color" style="--inline-text-color:#b45309;">Highlight</span>`

## Notes List and Search
Notes list location: `src/pages/notes/index.astro`.

Search behavior:
- Full-text search across `title`, `description`, and `body`.
- Search button or Enter cycles through matches.
- Active match is highlighted and scrolled into view.
- `Clear` resets results and the count.
- Search bar is sticky for visibility.

Styling:
- Notes list cards reuse `.card` styles from `public/style.css`.
- Search UI styles are under `.notes-search*` in `public/style.css`.

## Notes Detail Page
Notes detail route: `src/pages/notes/[slug].astro`.
Styling rules live under `.blog-content` in `public/style.css`.

Key styles:
- `h1/h2/h3` typography and separators
- lists (`ul/ol`)
- paragraph spacing
- inline strong text

## Notes Admin (Custom)
Admin UI is a custom page at `/admin/` that uses a GitHub App.

Auth flow:
1) `/admin/` calls `GET /api/cms/login`
2) The endpoint redirects to GitHub OAuth for the GitHub App
3) GitHub redirects to `/api/cms/callback`
4) Callback exchanges code for a user token, validates user, stores a session cookie
5) `/admin/` uses the session cookie to call CMS endpoints

CMS endpoints:
- `GET /api/cms/me`: returns current user
- `GET /api/cms/posts`: list notes (from repo)
- `POST /api/cms/posts`: create note
- `GET /api/cms/posts/[slug]`: get note
- `PUT /api/cms/posts/[slug]`: update note
- `DELETE /api/cms/posts/[slug]`: delete note

Session:
- Stored in signed cookie
- Session secret: `CMS_SESSION_SECRET`
- Allowed users: `CMS_ALLOWED_USERS` (comma-separated)

### GitHub App Setup
Create a GitHub App and install it on the repository.

Required settings:
- Callback URL: `https://kodai-utsunomiya.vercel.app/api/cms/callback`

Required permissions:
- Repository contents: Read and write
- Metadata: Read-only

### Vercel Environment Variables
Set these in Vercel Project Settings:
- `GITHUB_REPO` (e.g. `kodai-utsunomiya-mdl/kodai-utsunomiya-mdl.github.io`)
- `GITHUB_APP_ID`
- `GITHUB_APP_PRIVATE_KEY`
- `GITHUB_APP_INSTALLATION_ID`
- `GITHUB_APP_CLIENT_ID`
- `GITHUB_APP_CLIENT_SECRET`
- `CMS_SESSION_SECRET`
- `CMS_ALLOWED_USERS`

Private key:
- Use the full contents including `-----BEGIN RSA PRIVATE KEY-----` lines.

## Deployment
Deployment target is Vercel.

### Vercel Rebuild (From Scratch)
1) New Project → Import the GitHub repository.
2) Framework preset: Astro (auto-detected).
3) Set Environment Variables from the mapping table.
4) Deploy.

Notes:
- `npm run build` runs `astro build`
- Node version is defined in `package.json` engines
- Static output is generated into `dist/`

## Troubleshooting
Known pitfalls:
- `pubDate` must be a date (YYYY-MM-DD) without quotes.
- GitHub App callback URL must match exactly.
- `CMS_ALLOWED_USERS` must include your GitHub login.

Build errors:
- `pubDate` must be a date: ensure `pubDate: 2026-03-24` (no quotes)
- Content schema errors: check `src/content.config.ts`

Admin auth issues:
- Verify `GITHUB_APP_*` env vars match the GitHub App
- Verify the GitHub App is installed on the repo
- Confirm `CMS_ALLOWED_USERS` contains your GitHub username
- Verify the callback URL matches exactly

Preview vs live mismatch:
- Verify styles are defined both for `.blog-content` and `.admin-preview__body`
- MathJax is only loaded on the site pages; Admin preview uses its own render path

## Style Sources
Primary style file: `public/style.css`

Main areas:
- Base variables and resets
- Layout (`.container`, `.section`)
- Cards, timeline, tags
- Notes list and search
- Notes content typography
- Admin UI
- Dark mode overrides
