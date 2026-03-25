(() => {
  const form = document.getElementById("notes-search-form");
  const input = document.getElementById("notes-search-input");
  const list = document.getElementById("notes-list");
  const count = document.getElementById("notes-search-count");
  const dataEl = document.getElementById("notes-data");
  const clearButton = document.getElementById("notes-search-clear");
  let posts = [];
  if (dataEl) {
    try {
      posts = JSON.parse(dataEl.textContent || "[]");
    } catch (error) {
      console.error("Failed to parse notes data.", error);
    }
  }

  const normalize = (value) => value.toLowerCase();
  const escapeHtml = (value) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  const highlightText = (text, query) => {
    if (!query) return escapeHtml(text);
    const escaped = escapeHtml(text);
    const pattern = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
    return escaped.replace(pattern, '<mark class="notes-match">$1</mark>');
  };
  const getBodySnippet = (body, query) => {
    if (!query || !body) return "";
    const lower = body.toLowerCase();
    const idx = lower.indexOf(query);
    if (idx === -1) return "";
    const start = Math.max(0, idx - 60);
    const end = Math.min(body.length, idx + query.length + 60);
    const snippet = body.slice(start, end).replace(/\s+/g, " ").trim();
    const prefix = start > 0 ? "…" : "";
    const suffix = end < body.length ? "…" : "";
    return `${prefix}${snippet}${suffix}`;
  };
  const formatCount = (value) => `${value} note${value === 1 ? "" : "s"}`;
  const render = (items, query = "") => {
    if (!list) return;
    list.innerHTML = "";
    if (count) {
      count.textContent = query
        ? `${formatCount(items.length)} / ${formatCount(posts.length)}`
        : "";
    }
    if (items.length === 0) {
      const empty = document.createElement("p");
      empty.className = "c-text";
      empty.textContent = "No matching notes.";
      list.appendChild(empty);
      return;
    }
    const cards = [];
    items.forEach((post) => {
      const card = document.createElement("div");
      card.className = "c-card";
      const title = document.createElement("h3");
      title.className = "c-card__title";
      const link = document.createElement("a");
      link.href = `/notes/${post.slug}/`;
      const titleMatch = query
        ? normalize(post.title).includes(query)
        : false;
      const descMatch = query
        ? normalize(post.description || "").includes(query)
        : false;
      link.innerHTML = titleMatch
        ? highlightText(post.title, query)
        : escapeHtml(post.title);
      title.appendChild(link);
      card.appendChild(title);
      if (post.description && (!query || descMatch)) {
        const desc = document.createElement("p");
        desc.className = "c-text";
        desc.innerHTML = descMatch
          ? highlightText(post.description, query)
          : escapeHtml(post.description);
        card.appendChild(desc);
      } else {
        const snippet = getBodySnippet(post.body || "", query);
        if (snippet) {
          const desc = document.createElement("p");
          desc.className = "c-text";
          desc.innerHTML = highlightText(snippet, query);
          card.appendChild(desc);
        }
      }
      const date = document.createElement("p");
      date.className = "timeline__date";
      date.textContent = post.pubDate;
      card.appendChild(date);
      list.appendChild(card);
      cards.push(card);
    });
    return cards;
  };

  const filterPosts = (term) => {
    const query = normalize(term);
    if (!query) return posts;
    return posts.filter((post) => {
      const haystack = normalize(
        `${post.title} ${post.description} ${post.body}`
      );
      return haystack.includes(query);
    });
  };

  let lastQuery = "";
  let currentIndex = 0;
  let currentMatches = [];

  const updateCount = (query) => {
    if (!count) return;
    if (!query) {
      count.textContent = "";
      return;
    }
    const total = currentMatches.length;
    if (total === 0) {
      count.textContent = "0 notes";
      return;
    }
    count.textContent = `${currentIndex + 1} / ${formatCount(total)}`;
  };

  const setClearVisible = (visible) => {
    if (!clearButton) return;
    clearButton.classList.toggle("is-hidden", !visible);
  };

  const resetSearch = () => {
    if (input) input.value = "";
    lastQuery = "";
    currentIndex = 0;
    currentMatches = render(posts) || [];
    updateCount("");
    setClearVisible(false);
  };

  const runSearch = (query) => {
    const normalized = normalize(query);
    const items = filterPosts(query);
    currentMatches = render(items, normalized) || [];
    currentIndex = 0;
    updateCount(normalized);
    if (currentMatches.length > 0) {
      currentMatches[0].classList.add("notes-search__active");
      currentMatches[0].scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setClearVisible(true);
  };

  const advanceMatch = () => {
    if (currentMatches.length === 0) return;
    currentMatches[currentIndex]?.classList.remove("notes-search__active");
    currentIndex = (currentIndex + 1) % currentMatches.length;
    updateCount(lastQuery);
    currentMatches[currentIndex]?.classList.add("notes-search__active");
    currentMatches[currentIndex].scrollIntoView({ behavior: "smooth", block: "center" });
  };

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = input?.value || "";
    const normalized = normalize(value);
    if (!normalized) {
      resetSearch();
      return;
    }
    if (normalized === lastQuery && currentMatches.length > 0) {
      advanceMatch();
      return;
    }
    lastQuery = normalized;
    runSearch(value);
  });

  clearButton?.addEventListener("click", () => {
    resetSearch();
    input?.focus();
  });

  input?.addEventListener("input", () => {
    const value = input.value.trim();
    setClearVisible(value.length > 0 || lastQuery.length > 0);
  });

  input?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      resetSearch();
    }
  });

  if (count) count.textContent = "";
  render(posts);
})();
