/* carousel.js — Motion19 shared Embla controller */
(function () {
  'use strict';

  /* ── Safely read a data attribute as a number ── */
  function num(el, attr, fallback) {
    var v = parseFloat(el.dataset[attr]);
    return isNaN(v) ? fallback : v;
  }

  /* ── Build dot buttons for a carousel ── */
  function buildDots(dotsWrap, embla, prefix) {
    if (!dotsWrap) return [];
    dotsWrap.innerHTML = '';
    var snaps = embla.scrollSnapList();
    return snaps.map(function (_, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = prefix + '__dot' + (i === 0 ? ' ' + prefix + '__dot--active' : '');
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-label', 'Page ' + (i + 1));
      btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      btn.addEventListener('click', function () { embla.scrollTo(i); });
      dotsWrap.appendChild(btn);
      return btn;
    });
  }

  /* ── Sync active dot to current snap ── */
  function syncDots(dots, embla, prefix) {
    if (!dots.length) return;
    var idx = embla.selectedScrollSnap();
    dots.forEach(function (d, i) {
      var active = i === idx;
      d.classList.toggle(d.className.split(' ')[0].replace('__dot', '__dot--active').split(' ')[0].split('__dot')[0] + '__dot--active', active);
      /* simpler approach: toggle the --active modifier class */
      var base = d.className.replace(/\s*\S+--active/g, '').trim();
      d.className = active ? base + ' ' + base + '--active' : base;
      d.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  /* ── Intersection observer fade-in for cards ── */
  function observeCards(root) {
    if (!('IntersectionObserver' in window)) {
      root.querySelectorAll('.m19-card, .np__sc, .sp__item').forEach(function (c) {
        c.classList.add('is-visible');
      });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-visible');
        obs.unobserve(e.target);
      });
    }, { threshold: 0.07 });
    root.querySelectorAll('.m19-card, .np__sc, .sp__item').forEach(function (c) {
      obs.observe(c);
    });
  }

  /* ── Shopify section:load reinit ── */
  function onSectionLoad(sectionId, initFn) {
    document.addEventListener('shopify:section:load', function (e) {
      if (e.detail && e.detail.sectionId === sectionId) initFn();
    });
  }

  /* ══════════════════════════════════════════════════════════
     initProductCarousel
     Used by: featured-carousel, best-offers
     ══════════════════════════════════════════════════════════ */
  window.M19Carousel = window.M19Carousel || {};

  window.M19Carousel.initProductCarousel = function (opts) {
    /*
      opts: {
        sectionEl, viewportEl, trackEl, prevEl, nextEl, dotsEl,
        prefix,        // CSS class prefix e.g. 'fc' or 'bo'
        loop,          // bool
        autoScroll,    // bool
        autoSpeed,     // number (embla auto-scroll speed)
        autoDelay,     // number ms
        stopOnHover,   // bool
        stopOnInteraction, // bool
        align,         // 'start'|'center'|'end'
        slidesToScroll,
        dragFree
      }
    */
    if (!opts.trackEl || !opts.viewportEl) return null;

    var plugins = [];
    if (opts.autoScroll && window.EmblaCarouselAutoScroll) {
      plugins.push(
        window.EmblaCarouselAutoScroll({
          direction: 'forward',
          speed: opts.autoSpeed || 2,
          startDelay: opts.autoDelay || 1000,
          playOnInit: true,
          stopOnMouseEnter: !!opts.stopOnHover,
          stopOnInteraction: opts.stopOnInteraction !== false,
          stopOnFocusIn: true
        })
      );
    }

    var embla = window.EmblaCarousel(
      opts.viewportEl,
      {
        loop: opts.loop !== false,
        align: opts.align || 'start',
        slidesToScroll: opts.slidesToScroll || 1,
        dragFree: !!opts.dragFree,
        containScroll: opts.loop !== false ? false : 'trimSnaps'
      },
      plugins
    );

    var dots = buildDots(opts.dotsEl, embla, opts.prefix);

    function updateDots() {
      if (!dots.length) return;
      var idx = embla.selectedScrollSnap();
      dots.forEach(function (d, i) {
        var active = i === idx;
        var cls = opts.prefix + '__dot';
        d.className = cls + (active ? ' ' + cls + '--active' : '');
        d.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    }

    embla.on('select', updateDots);
    embla.on('reInit', function () {
      dots = buildDots(opts.dotsEl, embla, opts.prefix);
      updateDots();
    });

    if (opts.prevEl) opts.prevEl.addEventListener('click', function () { embla.scrollPrev(); });
    if (opts.nextEl) opts.nextEl.addEventListener('click', function () { embla.scrollNext(); });

    observeCards(opts.sectionEl);

    return embla;
  };

  /* ══════════════════════════════════════════════════════════
     initSimpleCarousel
     Used by: header dd slider, mobile carousel
     ══════════════════════════════════════════════════════════ */
  window.M19Carousel.initSimpleCarousel = function (opts) {
    /*
      opts: { viewportEl, prevEl, nextEl, dotsEl, prefix, loop, align, slidesToScroll }
    */
    if (!opts.viewportEl) return null;

    var embla = window.EmblaCarousel(opts.viewportEl, {
      loop: !!opts.loop,
      align: opts.align || 'start',
      slidesToScroll: opts.slidesToScroll || 1,
      containScroll: opts.loop ? false : 'trimSnaps'
    });

    var dots = buildDots(opts.dotsEl, embla, opts.prefix || 'c');

    function updateDots() {
      if (!dots.length) return;
      var idx = embla.selectedScrollSnap();
      var pfx = opts.prefix || 'c';
      dots.forEach(function (d, i) {
        var active = i === idx;
        var cls = pfx + '__dot';
        d.className = cls + (active ? ' ' + cls + '--active' : '');
        d.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    }

    embla.on('select', updateDots);

    if (opts.prevEl) opts.prevEl.addEventListener('click', function () { embla.scrollPrev(); });
    if (opts.nextEl) opts.nextEl.addEventListener('click', function () { embla.scrollNext(); });

    return embla;
  };

})();
