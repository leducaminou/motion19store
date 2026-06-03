/**
 * bundle.js — Motion19 Store
 * Swiper : chargé en lazy (script tag injecté) dès qu'un .swiper
 * entre dans le viewport. Embla bundlé directement (utilisé moins
 * souvent et déjà tree-shaken par Vite).
 */

import EmblaCarousel   from 'embla-carousel';
import EmblaAutoScroll from 'embla-carousel-auto-scroll';

window.EmblaCarousel   = EmblaCarousel;
window.EmblaAutoScroll = EmblaAutoScroll;

/* ── Swiper — injecté en lazy via <script> ── */
(function () {
  var swiperLoaded  = false;
  var SWIPER_JS  = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js';

  function loadSwiper() {
    if (swiperLoaded) return;
    swiperLoaded = true;
    var s = document.createElement('script');
    s.src = SWIPER_JS;
    s.onload = function () {
      document.dispatchEvent(new CustomEvent('m19:swiper-ready'));
    };
    document.head.appendChild(s);
  }

  /* Charge immédiatement si déjà visible (ex: hero au-dessus de la fold) */
  function checkVisible() {
    var els = document.querySelectorAll('.swiper');
    if (!els.length) return;

    if (!('IntersectionObserver' in window)) {
      loadSwiper();
      return;
    }

    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        obs.disconnect();
        loadSwiper();
      });
    }, { rootMargin: '200px' });

    els.forEach(function (el) { io.observe(el); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkVisible);
  } else {
    checkVisible();
  }
}());
