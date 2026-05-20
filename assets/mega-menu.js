/**
 * MegaMenu — Motion19 Store
 * Mobile-first · Vanilla JS · No dependencies
 * Pointer-trajectory safe zone · Body scroll lock · Full a11y
 */
(function () {
  'use strict';

  /* ── Config ───────────────────────────────────────────────── */
  var CFG = {
    openDelay:   80,    // ms before opening on hover (anti-flicker)
    closeDelay:  220,   // ms before closing after leave
    safeZoneH:   28,    // px below nav link considered safe trajectory zone
    breakpoint:  1200,  // px — desktop threshold
  };

  /* ── State ────────────────────────────────────────────────── */
  var state = {
    activeItem:   null,
    openTimer:    null,
    closeTimer:   null,
    lastMouseY:   0,
    lastMouseX:   0,
    isDesktop:    false,
    mobileOpen:   false,
    mobileL2Cat:  null,
  };

  /* ── DOM refs (populated in init) ────────────────────────── */
  var dom = {
    root:        null,
    backdrop:    null,
    panels:      {},   // { categoryId: panelEl }
    navItems:    [],
    mobilePanel: null,
    mobileL1:    null,
    mobileL2:    null,
    mobileClose: null,
    mobileBack:  null,
    mobileTitle: null,
    hamburger:   null,
  };

  /* ================================================================
     UTILITY
  ================================================================= */
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  function mq() { return window.innerWidth >= CFG.breakpoint; }

  /* ================================================================
     BODY SCROLL LOCK  (mobile only)
  ================================================================= */
  var scrollY = 0;
  function lockBody() {
    scrollY = window.scrollY;
    document.body.style.cssText +=
      '; position: fixed; top: -' + scrollY + 'px; left: 0; right: 0; overflow-y: scroll;';
  }
  function unlockBody() {
    document.body.style.cssText = document.body.style.cssText
      .replace(/position:\s*fixed[^;]*;?/gi, '')
      .replace(/top:\s*-?\d+px[^;]*;?/gi, '')
      .replace(/left:\s*0[^;]*;?/gi, '')
      .replace(/right:\s*0[^;]*;?/gi, '')
      .replace(/overflow-y:\s*scroll[^;]*;?/gi, '');
    window.scrollTo(0, scrollY);
  }

  /* ================================================================
     PANEL HEIGHT — sets --mm-panel-top from header actual height
  ================================================================= */
  function syncPanelTop() {
    var header = qs('.header-wrapper');
    if (!header) return;
    var h = header.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--mm-panel-top', h + 'px');
  }

  /* ================================================================
     DESKTOP — OPEN / CLOSE
  ================================================================= */
  function clearTimers() {
    clearTimeout(state.openTimer);
    clearTimeout(state.closeTimer);
  }

  function openPanel(item) {
    var catId = item.dataset.mmCat;
    if (!catId) return;
    var panel = dom.panels[catId];
    if (!panel) return;

    /* close any other open panel instantly */
    if (state.activeItem && state.activeItem !== item) {
      deactivateItem(state.activeItem, true);
    }

    state.activeItem = item;
    item.classList.add('is-active');
    item.querySelector('.mm-nav__link').setAttribute('aria-expanded', 'true');

    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');

    dom.backdrop.classList.add('is-visible');
    syncPanelTop();
  }

  function closePanel(immediate) {
    clearTimers();
    if (immediate) {
      _doClose();
    } else {
      state.closeTimer = setTimeout(_doClose, CFG.closeDelay);
    }
  }

  function _doClose() {
    if (!state.activeItem) return;
    deactivateItem(state.activeItem, false);
    dom.backdrop.classList.remove('is-visible');
    state.activeItem = null;
  }

  function deactivateItem(item, immediate) {
    if (!item) return;
    var catId = item.dataset.mmCat;
    item.classList.remove('is-active');
    var link = item.querySelector('.mm-nav__link');
    if (link) link.setAttribute('aria-expanded', 'false');
    var panel = catId ? dom.panels[catId] : null;
    if (panel) {
      panel.classList.remove('is-open');
      panel.setAttribute('aria-hidden', 'true');
    }
  }

  /* Pointer trajectory — safe zone below nav link prevents flicker
     when cursor moves from link down into the panel */
  function isMovingTowardPanel(e) {
    var dy = e.clientY - state.lastMouseY;
    state.lastMouseY = e.clientY;
    state.lastMouseX = e.clientX;
    return dy >= 0; /* moving downward = toward panel */
  }

  function bindDesktopItem(item) {
    var link = item.querySelector('.mm-nav__link');
    if (!link) return;
    var catId = item.dataset.mmCat;
    var hasPanel = !!(catId && dom.panels[catId]);

    /* set ARIA if panel exists */
    if (hasPanel) {
      link.setAttribute('aria-haspopup', 'true');
      link.setAttribute('aria-expanded', 'false');
      link.setAttribute('aria-controls', 'mm-panel-' + catId);
    }

    item.addEventListener('mouseenter', function (e) {
      if (!mq()) return;
      clearTimers();
      state.lastMouseY = e.clientY;
      if (hasPanel) {
        state.openTimer = setTimeout(function () {
          openPanel(item);
        }, CFG.openDelay);
      } else {
        /* regular link: close any open panel with delay */
        state.closeTimer = setTimeout(_doClose, CFG.closeDelay);
      }
    });

    item.addEventListener('mouseleave', function () {
      if (!mq()) return;
      clearTimers();
      if (hasPanel) {
        state.closeTimer = setTimeout(_doClose, CFG.closeDelay);
      }
    });

    /* keyboard: Enter/Space opens panel; Escape closes */
    link.addEventListener('keydown', function (e) {
      if (!mq()) return;
      if (!hasPanel) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (item.classList.contains('is-active')) {
          closePanel(true);
        } else {
          openPanel(item);
        }
      }
      if (e.key === 'Escape') closePanel(true);
    });
  }

  /* Keep panel open while mouse is inside it */
  function bindPanel(panel) {
    panel.addEventListener('mouseenter', function () {
      if (!mq()) return;
      clearTimers();
    });
    panel.addEventListener('mouseleave', function () {
      if (!mq()) return;
      clearTimers();
      state.closeTimer = setTimeout(_doClose, CFG.closeDelay);
    });

    /* Sidebar sub-nav hover: filter visible cards */
    var sideLinks = qsa('.mm-sidebar-nav__link', panel);
    sideLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        /* If data-mm-filter, filter cards instead of navigating */
        var filter = link.dataset.mmFilter;
        if (!filter) return;
        e.preventDefault();
        sideLinks.forEach(function (l) { l.classList.remove('is-active'); });
        link.classList.add('is-active');
        filterCards(panel, filter);
      });
    });
  }

  function filterCards(panel, filter) {
    var cards = qsa('.mm-card', panel);
    cards.forEach(function (card) {
      var match = !filter || filter === 'all' || card.dataset.mmFilter === filter;
      card.style.display = match ? '' : 'none';
    });
  }

  /* ================================================================
     MOBILE — OPEN / CLOSE
  ================================================================= */
  function openMobile() {
    if (!dom.mobilePanel) return;
    state.mobileOpen = true;
    dom.mobilePanel.classList.add('is-open');
    dom.mobilePanel.setAttribute('aria-hidden', 'false');
    if (dom.hamburger) {
      dom.hamburger.classList.add('is-active');
      dom.hamburger.setAttribute('aria-expanded', 'true');
    }
    lockBody();
    /* focus first focusable */
    var first = dom.mobilePanel.querySelector('button, a, input');
    if (first) setTimeout(function () { first.focus(); }, 50);
  }

  function closeMobile() {
    if (!dom.mobilePanel) return;
    state.mobileOpen = false;
    closeL2(true);
    dom.mobilePanel.classList.remove('is-open');
    dom.mobilePanel.setAttribute('aria-hidden', 'true');
    if (dom.hamburger) {
      dom.hamburger.classList.remove('is-active');
      dom.hamburger.setAttribute('aria-expanded', 'false');
    }
    unlockBody();
    if (dom.hamburger) dom.hamburger.focus();
  }

  function openL2(catId, title) {
    if (!dom.mobilePanel || !dom.mobileL2) return;
    state.mobileL2Cat = catId;

    /* Load content into L2 */
    var srcPanel = dom.panels[catId];
    if (srcPanel) {
      var cardsZone = qs('.mm-mobile-l2-cards', dom.mobileL2);
      var crossZone = qs('.mm-mobile-l2-crossnav', dom.mobileL2);
      if (cardsZone) {
        /* clone card grid from desktop panel */
        var grid = qs('.mm-grid', srcPanel);
        if (grid) {
          cardsZone.innerHTML = grid.innerHTML;
          /* re-apply lazy class on cloned imgs */
          qsa('img[loading="lazy"]', cardsZone).forEach(function (img) {
            if (img.dataset.src) { img.src = img.dataset.src; }
          });
        }
      }
      if (crossZone) {
        /* build cross-nav from sidebar links */
        var sideLinks = qsa('.mm-sidebar-nav__link', srcPanel);
        if (sideLinks.length) {
          var ul = document.createElement('ul');
          ul.className = 'mm-mobile-crossnav__list';
          ul.setAttribute('role', 'list');
          sideLinks.forEach(function (sl) {
            var li = document.createElement('li');
            li.setAttribute('role', 'listitem');
            var a = document.createElement('a');
            a.href = sl.href || '#';
            a.className = 'mm-mobile-crossnav__link';
            a.innerHTML = sl.textContent.trim() +
              '<svg class="mm-mobile-crossnav__link-arrow" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/></svg>';
            li.appendChild(a);
            ul.appendChild(li);
          });
          crossZone.innerHTML = '';
          if (sideLinks.length) {
            var h = document.createElement('p');
            h.className = 'mm-mobile-crossnav__title';
            h.textContent = 'Explorer';
            crossZone.appendChild(h);
            crossZone.appendChild(ul);
          }
        }
      }
    }

    /* update title */
    if (dom.mobileTitle) dom.mobileTitle.textContent = title || '';

    dom.mobilePanel.classList.add('l2-open');
    dom.mobileL2.setAttribute('aria-hidden', 'false');

    /* focus back button */
    if (dom.mobileBack) setTimeout(function () { dom.mobileBack.focus(); }, 60);
  }

  function closeL2(instant) {
    if (!dom.mobilePanel) return;
    dom.mobilePanel.classList.remove('l2-open');
    if (dom.mobileL2) dom.mobileL2.setAttribute('aria-hidden', 'true');
    state.mobileL2Cat = null;
  }

  /* ================================================================
     INIT
  ================================================================= */
  function init() {
    dom.root = qs('.mega-menu-root');
    if (!dom.root) return;

    dom.backdrop  = qs('.mm-backdrop');
    dom.mobilePanel = qs('.mm-mobile-panel');
    dom.mobileL1  = dom.mobilePanel ? qs('.mm-mobile-l1', dom.mobilePanel) : null;
    dom.mobileL2  = dom.mobilePanel ? qs('.mm-mobile-l2', dom.mobilePanel) : null;
    dom.mobileClose = dom.mobilePanel ? qs('.mm-mobile-close', dom.mobilePanel) : null;
    dom.mobileBack  = dom.mobileL2   ? qs('.mm-mobile-back', dom.mobileL2) : null;
    dom.mobileTitle = dom.mobileL2   ? qs('.mm-mobile-header__center', dom.mobileL2) : null;
    dom.hamburger = qs('[data-mm-hamburger]') || qs('#hamburgerBtn');

    /* collect panels */
    qsa('.mm-panel', document).forEach(function (p) {
      var id = p.dataset.mmPanel;
      if (id) dom.panels[id] = p;
    });

    /* collect nav items */
    dom.navItems = qsa('.mm-nav__item[data-mm-cat]', dom.root);

    /* bind desktop items */
    dom.navItems.forEach(bindDesktopItem);

    /* bind panels */
    Object.keys(dom.panels).forEach(function (id) {
      bindPanel(dom.panels[id]);
    });

    /* backdrop click */
    if (dom.backdrop) {
      dom.backdrop.addEventListener('click', function () { closePanel(true); });
    }

    /* hamburger opens mobile panel */
    if (dom.hamburger) {
      dom.hamburger.addEventListener('click', function () {
        if (!mq()) {
          state.mobileOpen ? closeMobile() : openMobile();
        }
      });
    }

    /* mobile close */
    if (dom.mobileClose) {
      dom.mobileClose.addEventListener('click', closeMobile);
    }

    /* mobile back */
    if (dom.mobileBack) {
      dom.mobileBack.addEventListener('click', function () { closeL2(); });
    }

    /* mobile L1 items with sub-panel */
    var mobileNavBtns = qsa('[data-mm-mobile-cat]', document);
    mobileNavBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var catId = btn.dataset.mmMobileCat;
        var title = btn.dataset.mmMobileTitle || btn.textContent.trim();
        openL2(catId, title);
      });
    });

    /* global Escape */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (mq() && state.activeItem) closePanel(true);
        if (!mq() && state.mobileOpen) {
          if (state.mobileL2Cat) closeL2();
          else closeMobile();
        }
      }
    });

    /* focus trap inside mobile panel */
    if (dom.mobilePanel) {
      dom.mobilePanel.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab') return;
        var focusable = qsa(
          'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
          dom.mobilePanel
        ).filter(function (el) {
          return el.offsetParent !== null;
        });
        if (!focusable.length) return;
        var first = focusable[0];
        var last  = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      });
    }

    /* responsive resize */
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        syncPanelTop();
        if (mq() && state.mobileOpen) closeMobile();
      }, 120);
    }, { passive: true });

    /* scroll: update panel top */
    window.addEventListener('scroll', syncPanelTop, { passive: true });

    syncPanelTop();
  }

  /* Run after DOM ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
