/* Header: sticky compaction on scroll. Mobile: full-screen overlay menu with focus trap + Esc. */
(function () {
  var header = document.getElementById('site-header');
  var overlay = document.getElementById('nav-overlay');
  var openBtn = document.querySelector('.nav-toggle');
  var closeBtn = overlay ? overlay.querySelector('.nav-overlay__close') : null;
  var lastFocus = null;
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  /* Compact header */
  if (header) {
    var ticking = false;
    var update = function () {
      header.classList.toggle('is-compact', window.scrollY > 24);
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  function trap(e) {
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;
    var items = overlay.querySelectorAll(FOCUSABLE);
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function open() {
    if (!overlay) return;
    lastFocus = document.activeElement;
    overlay.hidden = false;
    document.body.classList.add('is-locked');
    openBtn && openBtn.setAttribute('aria-expanded', 'true');
    document.addEventListener('keydown', trap);
    var first = overlay.querySelector(FOCUSABLE);
    if (first) first.focus();
  }
  function close() {
    if (!overlay || overlay.hidden) return;
    overlay.hidden = true;
    document.body.classList.remove('is-locked');
    openBtn && openBtn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', trap);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  if (openBtn) openBtn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target.closest('a')) close();
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 900) close(); });
  }
  window.HMNav = { open: open, close: close };
})();
