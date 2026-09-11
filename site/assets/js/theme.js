/* Theme toggle — light/dark, stored in localStorage 'hm-theme', follows system when unset.
   The FOUC-prevention snippet in each page <head> applies the stored value before paint. */
(function () {
  var KEY = 'hm-theme';
  var root = document.documentElement;
  var mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function effective() {
    var s = stored();
    if (s === 'dark' || s === 'light') return s;
    return mql && mql.matches ? 'dark' : 'light';
  }
  function apply(theme, persist) {
    if (theme) root.setAttribute('data-theme', theme); else root.removeAttribute('data-theme');
    if (persist) { try { if (theme) localStorage.setItem(KEY, theme); else localStorage.removeItem(KEY); } catch (e) {} }
    updateButtons();
    updateMeta();
  }
  function updateButtons() {
    var eff = effective();
    var btns = document.querySelectorAll('.theme-toggle');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-pressed', eff === 'dark' ? 'true' : 'false');
      btns[i].setAttribute('aria-label', eff === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환');
      btns[i].setAttribute('title', eff === 'dark' ? '라이트 모드' : '다크 모드');
    }
  }
  function updateMeta() {
    var eff = effective();
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) {
      if (!metas[i].hasAttribute('media')) metas[i].setAttribute('content', eff === 'dark' ? '#15130F' : '#F7F4EE');
    }
  }
  function toggle() {
    var next = effective() === 'dark' ? 'light' : 'dark';
    apply(next, true);
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.theme-toggle');
    if (btn) { e.preventDefault(); toggle(); }
  });
  if (mql) {
    var onChange = function () { if (!stored()) apply(null, false); };
    if (mql.addEventListener) mql.addEventListener('change', onChange); else if (mql.addListener) mql.addListener(onChange);
  }
  updateButtons();
  updateMeta();
  window.HMTheme = { effective: effective, set: function (t) { apply(t, true); }, toggle: toggle };
})();
