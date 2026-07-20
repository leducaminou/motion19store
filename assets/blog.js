(function () {
  'use strict';

  /* ──────────────────────────────────────────────────────────
     BLOG.JS — Motion19 Blog System v1.0
     Fonctions : temps de lecture · progression scroll · animations cartes
     Chargé uniquement sur : page_type == 'blog' | 'article'
  ────────────────────────────────────────────────────────── */

  /* 1. Temps de lecture estimé */
  function initReadingTime() {
    var target = document.querySelector('[data-reading-time]');
    if (!target) return;
    var bodyEl = document.querySelector('[data-article-body]');
    if (!bodyEl) return;
    var inner = bodyEl.querySelector('.arb__inner');
    if (!inner) return;
    var text = inner.innerText || inner.textContent || '';
    var words = text.split(/\s+/).filter(Boolean).length;
    var minutes = Math.max(1, Math.ceil(words / 200));
    target.textContent = minutes + ' min de lecture';
  }

  /* 2. Barre de progression lecture */
  function initProgressBar() {
    var bar = document.querySelector('.arb__progress-bar');
    if (!bar) return;
    var bodyEl = document.querySelector('[data-article-body]');
    if (!bodyEl) return;

    function onScroll() {
      var rect  = bodyEl.getBoundingClientRect();
      var start = rect.top + window.scrollY;
      var total = bodyEl.offsetHeight - window.innerHeight;
      if (total <= 0) { bar.style.width = '100%'; return; }
      var progress = ((window.scrollY - start) / total) * 100;
      bar.style.width = Math.min(100, Math.max(0, progress)) + '%';
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* 3. Animations d'apparition des cartes (IntersectionObserver) */
  function initCardEntrance() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.bjg__grid .m19-card').forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.bjg__grid .m19-card').forEach(function (el) {
      obs.observe(el);
    });
  }

  /* 4. Hero blog — déclencher les animations d'entrée */
  function initBlogHero() {
    var hero = document.querySelector('.bhr');
    if (!hero) return;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        hero.classList.add('bhr--ready');
      });
    });
  }

  /* ── Init ── */
  function initBlog() {
    initBlogHero();
    if (document.querySelector('[data-reading-time]')) {
      initReadingTime();
      initProgressBar();
    }
    initCardEntrance();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBlog);
  } else {
    initBlog();
  }

  document.addEventListener('shopify:section:load', initBlog);

})();
