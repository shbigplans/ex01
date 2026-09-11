/* Home: inline breath timer inside the S6 tool card */
(function () {
  var host = document.getElementById('home-breath');
  if (host && window.HMBreath) window.HMBreath.create(host, { rounds: 5, size: 'sm' });
})();
