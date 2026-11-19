---
title: Local TeX Web Editor の作成
pubDate: 2026-11-19
draft: false
---
Edit TeX documents in your browser on Windows or macOS, and compile them with TeX Live on your computer. The editor and PDF preview appear in the same window. Launching the app opens a localhost page in your default browser. Markdown editing and preview are also supported.

- https://kodai-utsunomiya-mdl.github.io/Local-TeX-Web-Editor/

- https://github.com/kodai-utsunomiya-mdl/Local-TeX-Web-Editor

- https://apps.microsoft.com/detail/9P6QF32N19HG


![Notes Admin UI](/uploads/2026-11-19T11-43-58-491Z-editor-tex-dark.png)

![Notes Admin UI](/uploads/2026-11-19T11-45-38-271Z-editor-markdown-light.png)

# Why this editor exists

Local TeX Web Editor brings a browser editing workflow to the TeX Live installation on your computer.

Long documents can reach Overleaf's compilation time limit. Compiling on the computer allows work to continue with the available local resources. Multiline search also makes it possible to paste a block of prose or TeX code directly into the search field.

VS Code provides a broad set of development features. For editing TeX documents, starting a full desktop development environment can add more features and memory use than the task needs. This editor brings document editing, compilation, and preview together in a browser window.

Continuous PDF scrolling, SyncTeX, and Markdown preview support writing and reviewing documents while using the project files and TeX installation already on the computer.


# Libraries

- [CodeMirror](https://codemirror.net/): editor (MIT)
- [PDF.js](https://mozilla.github.io/pdf.js/): PDF display (Apache-2.0)
- [markdown-it](https://github.com/markdown-it/markdown-it): Markdown rendering (MIT)
- [KaTeX](https://katex.org/): mathematics in Markdown (MIT)
- [DOMPurify](https://github.com/cure53/DOMPurify): preview HTML processing (Apache-2.0 or MPL-2.0)
- [Go](https://go.dev/): HTTP server and TeX execution
