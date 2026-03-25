(() => {
  const authStatus = document.getElementById("auth-status");
  const authActions = document.getElementById("auth-actions");
  const authUser = document.getElementById("auth-user");
  const authUserName = document.getElementById("auth-user-name");
  const logoutBtn = document.getElementById("logout-btn");
  const editorCard = document.getElementById("editor-card");
  const listCard = document.getElementById("list-card");
  const postsList = document.getElementById("posts-list");
  const form = document.getElementById("post-form");
  const formStatus = document.getElementById("form-status");
  const titleInput = document.getElementById("post-title");
  const slugInput = document.getElementById("post-slug");
  const descriptionInput = document.getElementById("post-description");
  const dateInput = document.getElementById("post-date");
  const draftInput = document.getElementById("post-draft");
  const bodyInput = document.getElementById("post-body");
  const preview = document.getElementById("post-preview");
  const newBtn = document.getElementById("new-btn");
  const deleteBtn = document.getElementById("delete-btn");
  const uploadInput = document.getElementById("upload-file");
  const uploadBtn = document.getElementById("upload-btn");
  const uploadStatus = document.getElementById("upload-status");

  let editingSlug = null;

  const setHidden = (el, hidden) => {
    if (!el) return;
    el.classList.toggle("is-hidden", hidden);
  };

  const resetForm = () => {
    editingSlug = null;
    form?.reset();
    slugInput?.removeAttribute("disabled");
    if (formStatus) formStatus.textContent = "";
    if (deleteBtn) deleteBtn.classList.add("is-hidden");
    if (preview) preview.innerHTML = "";
  };

  const loadPosts = async () => {
    if (!postsList) return;
    postsList.innerHTML = "";
    const response = await fetch("/api/cms/posts");
    if (!response.ok) {
      postsList.textContent = "Failed to load posts.";
      return;
    }
    const data = await response.json();
    if (!data.posts || data.posts.length === 0) {
      postsList.textContent = "No posts yet.";
      return;
    }
    data.posts.forEach((post) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "admin__list-item";
      item.textContent = `${post.title} (${post.slug})`;
      item.addEventListener("click", async () => {
        const detailResponse = await fetch(`/api/cms/posts/${post.slug}`);
        if (!detailResponse.ok) {
          if (formStatus) formStatus.textContent = "Failed to load post.";
          return;
        }
        const payload = await detailResponse.json();
        editingSlug = post.slug;
        if (titleInput) titleInput.value = payload.title || "";
        if (slugInput) {
          slugInput.value = payload.slug || "";
          slugInput.setAttribute("disabled", "disabled");
        }
        if (descriptionInput) descriptionInput.value = payload.description || "";
        if (dateInput) {
          dateInput.value = payload.pubDate ? payload.pubDate.slice(0, 10) : "";
        }
        if (draftInput) draftInput.checked = Boolean(payload.draft);
        if (bodyInput) bodyInput.value = payload.body || "";
        renderPreview();
        if (formStatus) formStatus.textContent = "";
        if (deleteBtn) deleteBtn.classList.remove("is-hidden");
      });
      postsList.appendChild(item);
    });
  };

  const renderPreview = () => {
    if (!preview || !bodyInput) return;
    const content = bodyInput.value || "";
    if (window.marked) {
      const raw = window.marked.parse(content);
      if (window.DOMPurify?.sanitize) {
        preview.innerHTML = window.DOMPurify.sanitize(raw);
      } else {
        preview.textContent = content;
      }
    } else {
      preview.textContent = content;
    }
    if (window.MathJax?.typesetPromise) {
      window.MathJax.typesetPromise([preview]).catch(() => {});
    }
  };

  const checkSession = async () => {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (isLocalhost) {
      if (authStatus) authStatus.textContent = "Authenticated (local dev).";
      if (authUserName) authUserName.textContent = "@local";
      setHidden(authActions, true);
      setHidden(authUser, false);
      setHidden(editorCard, false);
      setHidden(listCard, false);
      return;
    }
    const response = await fetch("/api/cms/me");
    if (!response.ok) {
      if (authStatus) authStatus.textContent = "Not authenticated.";
      setHidden(authActions, false);
      setHidden(authUser, true);
      setHidden(editorCard, true);
      setHidden(listCard, true);
      return;
    }
    const data = await response.json();
    if (authStatus) authStatus.textContent = "Authenticated.";
    if (authUserName) authUserName.textContent = `@${data.login}`;
    setHidden(authActions, true);
    setHidden(authUser, false);
    setHidden(editorCard, false);
    setHidden(listCard, false);
    await loadPosts();
  };

  logoutBtn?.addEventListener("click", async () => {
    await fetch("/api/cms/logout", { method: "POST" });
    await checkSession();
  });

  bodyInput?.addEventListener("input", renderPreview);

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (formStatus) formStatus.textContent = "Saving...";
    const normalizedDate = dateInput?.value.replaceAll("/", "-");
    if (!normalizedDate) {
      if (formStatus) formStatus.textContent = "Publish Date is required (YYYY-MM-DD).";
      return;
    }
    const payload = {
      title: titleInput?.value.trim(),
      slug: slugInput?.value.trim(),
      description: descriptionInput?.value.trim(),
      pubDate: normalizedDate,
      draft: Boolean(draftInput?.checked),
      body: bodyInput?.value,
    };
    const isEditing = Boolean(editingSlug);
    const url = isEditing ? `/api/cms/posts/${editingSlug}` : "/api/cms/posts";
    const method = isEditing ? "PUT" : "POST";
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      if (formStatus) formStatus.textContent = error.error || "Failed to save.";
      return;
    }
    if (formStatus) formStatus.textContent = "Saved.";
    await loadPosts();
    if (!isEditing) {
      resetForm();
    } else {
      renderPreview();
    }
  });

  newBtn?.addEventListener("click", resetForm);

  deleteBtn?.addEventListener("click", async () => {
    if (!editingSlug) return;
    const confirmed = window.confirm("Delete this note? This cannot be undone.");
    if (!confirmed) return;
    if (formStatus) formStatus.textContent = "Deleting...";
    const response = await fetch(`/api/cms/posts/${editingSlug}`, { method: "DELETE" });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      if (formStatus) formStatus.textContent = error.error || "Failed to delete.";
      return;
    }
    if (formStatus) formStatus.textContent = "Deleted.";
    resetForm();
    await loadPosts();
  });

  uploadBtn?.addEventListener("click", async () => {
    if (!uploadInput?.files || uploadInput.files.length === 0) {
      if (uploadStatus) uploadStatus.textContent = "Select an image first.";
      return;
    }
    const file = uploadInput.files[0];
    if (uploadStatus) uploadStatus.textContent = "Uploading...";
    uploadBtn?.setAttribute("disabled", "disabled");
    try {
      const data = new FormData();
      data.append("file", file);
      const response = await fetch("/api/cms/uploads", {
        method: "POST",
        body: data,
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (uploadStatus) uploadStatus.textContent = error.error || "Upload failed.";
        return;
      }
      const payload = await response.json();
      const url = payload.url;
      if (uploadStatus) uploadStatus.textContent = `Uploaded: ${url}`;
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(url).catch(() => {});
      }
    } catch (error) {
      if (uploadStatus) uploadStatus.textContent = "Upload failed.";
    } finally {
      uploadBtn?.removeAttribute("disabled");
    }
  });

  checkSession();
})();
