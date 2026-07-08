/* 黃芳誼 Fang-Yi Huang — 互動：導覽列、行動選單、捲動揭露 */

(function () {
  'use strict';

  /* ---- 導覽列：捲動後加細線 ---- */
  var nav = document.getElementById('nav');
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('is-scrolled', window.scrollY > 12);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- 行動版選單 ---- */
  var toggle = document.getElementById('navToggle');
  var links  = document.getElementById('navlinks');

  if (toggle && links) {
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      links.classList.toggle('is-open', open);
    };

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // 點連結後收合
    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    // Esc 收合
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });

    // 放大到桌機寬度時，清掉行動版狀態
    window.addEventListener('resize', function () {
      if (window.innerWidth > 760) setOpen(false);
    });
  }

  /* ---- 捲動揭露 ---- */
  var targets = document.querySelectorAll('.reveal');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced || !('IntersectionObserver' in window)) {
    // 不做動畫就直接顯示，避免內容永遠隱形
    targets.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);   // 只揭露一次
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---- 首頁：捲動時同步 nav 目前區塊 ---- */
  var sections = document.querySelectorAll('main section[id], main header[id]');
  var navAnchors = links ? links.querySelectorAll('a[href^="#"]') : [];

  if (sections.length && navAnchors.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        navAnchors.forEach(function (a) {
          a.classList.toggle('is-current', a.getAttribute('href') === '#' + id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (s) { spy.observe(s); });
  }
})();
