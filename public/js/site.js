(() => {
  const htmlElement = document.documentElement;
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    htmlElement.setAttribute('data-theme', 'dark');
  }

  const updateIcon = (theme) => {
    const toggleButton = document.getElementById('theme-toggle');
    const icon = toggleButton?.querySelector('i');
    if (!icon) return;
    if (theme === 'dark') {
      icon.classList.remove('fa-moon');
      icon.classList.add('fa-sun');
    } else {
      icon.classList.remove('fa-sun');
      icon.classList.add('fa-moon');
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('theme-toggle');
    if (!toggleButton) return;

    const currentTheme = htmlElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    updateIcon(currentTheme);

    toggleButton.addEventListener('click', () => {
      const newTheme = htmlElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      htmlElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateIcon(newTheme);
    });
  });

  document.addEventListener('DOMContentLoaded', () => {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.lightbox-close');
    if (!lightbox || !lightboxImg || !closeBtn) return;

    document.querySelectorAll('.notes-content img, img.zoomable').forEach((img) => {
      img.classList.add('zoomable');
      img.addEventListener('click', function() {
        lightbox.style.display = "flex";
        lightboxImg.src = this.src;
        document.body.style.overflow = "hidden";
      });
    });

    const closeLightbox = () => {
      lightbox.style.display = "none";
      document.body.style.overflow = "auto";
    };

    closeBtn.addEventListener('click', closeLightbox);

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === "Escape" && lightbox.style.display === "flex") {
        closeLightbox();
      }
    });
  });
})();
