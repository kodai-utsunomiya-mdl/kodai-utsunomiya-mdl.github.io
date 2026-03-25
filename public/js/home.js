document.addEventListener('DOMContentLoaded', () => {
  if (window.GitHubCalendar) {
    GitHubCalendar(".calendar", "kodai-utsunomiya-mdl", {
      responsive: true,
      global_stats: false
    }).then(() => {
      const links = document.querySelectorAll('.calendar a');
      links.forEach((link) => {
        if (link.textContent.includes('Skip to contributions')) {
          link.style.display = 'none';
          link.style.visibility = 'hidden';
        }
      });

      const srElements = document.querySelectorAll('.calendar .sr-only');
      srElements.forEach((el) => {
        el.style.display = 'none';
      });
    });
  }

  const anchors = document.querySelectorAll('a[href^="#"]');
  anchors.forEach((anchor) => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();

      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetElement = document.querySelector(targetId);
      if (!targetElement) return;

      const headerOffset = 90;
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    });
  });
});
