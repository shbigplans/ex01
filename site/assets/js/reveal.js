/* Scroll reveal — IntersectionObserver, threshold .15, respects prefers-reduced-motion. */
(function () {
  var els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    for (var i = 0; i < els.length; i++) els[i].classList.add('is-visible');
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
  for (var j = 0; j < els.length; j++) io.observe(els[j]);
})();
