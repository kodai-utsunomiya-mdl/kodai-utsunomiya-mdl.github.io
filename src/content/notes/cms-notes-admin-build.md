---
title: "GitHub AppとAstroでCMSを組んだ (自身の勉強用)"
description: "GitHub App + Vercel + Astro APIでCMSを自作する手順や設計判断について．"
pubDate: 2026-03-25
draft: false
---
Decap CMSを用いた運用が想定通りに安定せず，最終的にGitHub App + Astro API + Vercelで自作のCMSを構築した．本稿はその設計判断，構成，実装の詳細を記録したもの．リポジトリは <https://github.com/kodai-utsunomiya-mdl/kodai-utsunomiya-mdl.github.io> に置いてある．

# 目的と要件
- 無料枠で運用可能
- Markdownで運用 (記事はGitHubに保存)
- 管理画面から記事作成/更新/削除
- 管理画面で記事のプレビューが可能
- 管理画面から画像をアップロード可能

# 全体構成
フロントはAstro，データはGitHub，管理画面はAstroのページとして静的に用意し，認証とCRUDだけをAPIで実装．

- フロント: Astro
- 管理画面: `/admin/`
- 認証: GitHub App OAuth
- データ保存: `src/content/notes/*.md`
- 公開: Vercel

概念フロー:
1) 管理画面からログイン
2) GitHub OAuthで認可
3) コールバックでセッション発行
4) 管理画面がAPI経由でCRUD
5) GitHub APIでMarkdownを更新
6) Vercelがビルドして公開

# 主要なディレクトリ構成
機能単位で分離．特にAPIとセッション関連は `src/lib` に寄せる．

- `src/pages/admin/index.astro` 管理画面UI
- `src/pages/api/cms/login.ts` OAuth開始
- `src/pages/api/cms/callback.ts` OAuth完了
- `src/pages/api/cms/me.ts` 現在のユーザー取得
- `src/pages/api/cms/posts/index.ts` 一覧/作成
- `src/pages/api/cms/posts/[slug].ts` 取得/更新/削除
- `src/lib/githubApp.ts` GitHub APIラッパ
- `src/lib/session.ts` セッション署名/検証
- `src/lib/frontmatter.ts` frontmatter生成/解析
- `src/content/notes/` 記事Markdown

# GitHub Appの作成手順
権限の付与は最小限に抑え，Repository Contentsのみ書き込みを許可した．

1) GitHub → Settings → Developer settings → GitHub Apps → New
2) App名: `Kodai Utsunomiya Notes Admin` (任意)
3) Homepage URL: `https://kodai-utsunomiya.vercel.app`
4) Callback URL: `https://kodai-utsunomiya.vercel.app/api/cms/callback`
5) Permissions:
   - Repository contents: Read & Write
   - Metadata: Read-only
6) Appを作成後，Private Keyを生成 (PEM)
7) Appをリポジトリへインストール

# Installation IDの取得
Appのインストール詳細ページのURLから取得する．

`https://github.com/settings/installations/<INSTALLATION_ID>`

この数字を `GITHUB_APP_INSTALLATION_ID` に入れる．

# Vercel環境変数
Vercelに以下の環境変数を設定する．

- `GITHUB_REPO`: `owner/name`
- `GITHUB_APP_ID`: GitHub AppのApp ID
- `GITHUB_APP_PRIVATE_KEY`: PEMの全文 (BEGIN/END含む)
- `GITHUB_APP_INSTALLATION_ID`: インストールID
- `GITHUB_APP_CLIENT_ID`: Client ID
- `GITHUB_APP_CLIENT_SECRET`: Client secret
- `CMS_SESSION_SECRET`: 32文字以上のランダム
- `CMS_ALLOWED_USERS`: `kodai-utsunomiya-mdl` のようにGitHubユーザー名

# 認証フローの詳細
ログインはOAuthの標準フローに沿うが，セッションの扱いは独自の実装．

## /api/cms/login
- GitHub OAuthの認可URLを組み立て
- `client_id`, `redirect_uri` などを付与してリダイレクト

## /api/cms/callback
- GitHubから `code` を受け取る
- `client_id` と `client_secret` でアクセストークン取得
- トークンでユーザー情報取得
- `CMS_ALLOWED_USERS` に含まれていればセッション発行
- Cookieをセットして `/admin/` に戻す

# セッション設計
セッションはCookieに署名トークンを保存する方式にした．API側は常に署名の検証を行い，未認証なら401を返す．

- Cookieに署名トークンを保存
- `/api/cms/me` で現在ユーザーを返す
- 各APIで `verifySessionToken` をチェック

# 記事取得/更新の実装
MarkdownはGitHub Contents APIを直接叩いてCRUDする．DBは持たない．

## 一覧取得
- GitHub Contents APIで `src/content/notes` を取得
- 各ファイルを読み出し，frontmatterをパース
- `title`, `description`, `pubDate`, `draft` を抽出

## 新規作成
- frontmatter生成 → Markdown本文と連結
- GitHub Contents API `PUT` で作成

## 更新
- 既存ファイルを取得して `sha` を入手
- 更新内容で `PUT` (`sha` 付き)

## 削除
- `DELETE` で対象ファイル削除

# frontmatterの注意
AstroのContent Collectionが厳密な型チェックを行うため，formatを誤るとビルドが失敗する．

- `pubDate` は `YYYY-MM-DD` 形式，必ず無引用
- `draft` を `true` にすると一覧に出ない

# 管理画面のUI
左に編集フォーム，右にプレビューを置き，保存ボタンでGitHubに反映する．

- 左: 編集フォーム (Title/Slug/Description/Date/Draft/Body)
- 右: Preview
- 画像アップロード機能 (/uploads に保存)
- PreviewはMarkdownをHTMLに変換して表示
- MathJaxを読み込んで数式レンダリング
- Previewと本番の差は `public/style.css` の `.admin__preview-body` で調整

![Notes Admin UI](/uploads/2026-03-24T18-57-57-623Z-admin_image.jpeg)

# プレビューの調整
プレビュー側にも本番と同じCSSを適用．

- 見出しのスタイル
- 箇条書きのビュレット表示
- 画像のサイズ自動調整
- 強調表示の太さ
- 行間と余白

# Notes一覧と検索
一覧ページは `/notes/` で，本文も含めた全文検索に対応させた．

- タイトル/概要/本文の全文検索
- Searchボタン連打で一致を順番に巡回
- 一致箇所をハイライト
- Search barをsticky化

# 運用フロー
1) `/admin/` でログイン
2) Markdownを編集し保存 (必要なら画像をアップロードしURLを挿入)
3) GitHubにコミットされる
4) Vercelが自動ビルド
5) `/notes/` と個別ページに反映
