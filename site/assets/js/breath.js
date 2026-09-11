/* 6-second breath timer (01-plan §5-c)
   - cycle: inhale 3s → exhale 3s = 6s per round; rounds 5 / 10 / 15 (default 5)
   - modes: inline (HMBreath.create(container, opts)) and modal (HMBreath.openModal(opts))
   - opts: { rounds: 5, selectable: false, size: 'md'|'sm', sound: false, onComplete: fn, onStop: fn, autoFocus: false }
   - a11y: role="timer", phase text announced via aria-live="polite" (count is aria-hidden)
   - keyboard: Space = start/pause (when focus is inside the timer and not on a control), Esc = close (modal)
   - reduced-motion: no scale animation; progress ring + text only
   - sound: WebAudio sine 200ms at each phase change (off by default); haptic navigator.vibrate(30) on completion */
(function () {
  var INHALE = 3000, EXHALE = 3000, ROUND = INHALE + EXHALE;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SVG_NS = 'http://www.w3.org/2000/svg';

  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function btn(label, cls) {
    var b = el('button', cls || 'btn btn--secondary btn--small', label);
    b.type = 'button';
    return b;
  }

  function beep() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      var ctx = beep.ctx || (beep.ctx = new Ctx());
      if (ctx.state === 'suspended') ctx.resume();
      var osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = 528;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.21);
    } catch (e) {}
  }

  function create(container, opts) {
    opts = opts || {};
    var rounds = opts.rounds || 5;
    var total = rounds * ROUND;
    var sound = !!opts.sound;
    var state = 'idle'; // idle | running | paused | done
    var startAt = 0, pausedAt = 0, pausedTotal = 0, raf = 0, lastPhase = '', lastRound = -1;
    var listeners = {};

    var root = el('div', 'breath' + (opts.size === 'sm' ? ' breath--sm' : ''));
    root.setAttribute('role', 'timer');
    root.setAttribute('aria-label', '6초 호흡 타이머');
    root.tabIndex = -1;

    var stage = el('div', 'breath__stage');
    var ring = document.createElementNS(SVG_NS, 'svg');
    ring.setAttribute('class', 'breath__ring'); ring.setAttribute('viewBox', '0 0 100 100'); ring.setAttribute('aria-hidden', 'true');
    var track = document.createElementNS(SVG_NS, 'circle');
    track.setAttribute('class', 'ring-track'); track.setAttribute('cx', '50'); track.setAttribute('cy', '50'); track.setAttribute('r', '48');
    var prog = document.createElementNS(SVG_NS, 'circle');
    prog.setAttribute('class', 'ring-progress'); prog.setAttribute('cx', '50'); prog.setAttribute('cy', '50'); prog.setAttribute('r', '48');
    var C = 2 * Math.PI * 48;
    prog.setAttribute('stroke-dasharray', C.toFixed(2)); prog.setAttribute('stroke-dashoffset', C.toFixed(2));
    ring.appendChild(track); ring.appendChild(prog);
    var circle = el('div', 'breath__circle');
    var phase = el('span', 'breath__phase', '준비');
    phase.setAttribute('aria-live', 'polite');
    var count = el('span', 'breath__count', '3초 들숨 · 3초 날숨');
    count.setAttribute('aria-hidden', 'true');
    circle.appendChild(phase); circle.appendChild(count);
    stage.appendChild(ring); stage.appendChild(circle);

    var roundLbl = el('div', 'breath__round', '0 / ' + rounds);
    var done = el('div', 'breath__done', '');
    done.hidden = true;

    var roundsWrap = null;
    if (opts.selectable) {
      roundsWrap = el('div', 'breath__rounds');
      roundsWrap.setAttribute('role', 'group'); roundsWrap.setAttribute('aria-label', '라운드 수');
      [5, 10, 15].forEach(function (n) {
        var b = btn(n + '회 · ' + (n * 6) + '초', '');
        b.setAttribute('aria-pressed', n === rounds ? 'true' : 'false');
        b.addEventListener('click', function () {
          if (state === 'running') return;
          rounds = n; total = rounds * ROUND;
          Array.prototype.forEach.call(roundsWrap.children, function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
          reset();
        });
        roundsWrap.appendChild(b);
      });
    }

    var controls = el('div', 'breath__controls');
    var startBtn = btn('시작', 'btn btn--primary btn--small');
    var pauseBtn = btn('일시정지'); var stopBtn = btn('중단');
    var againBtn = btn('한 번 더', 'btn btn--primary btn--small'); var closeBtn = btn('닫기');
    startBtn.setAttribute('data-breath', 'start'); pauseBtn.setAttribute('data-breath', 'pause');
    stopBtn.setAttribute('data-breath', 'stop'); againBtn.setAttribute('data-breath', 'again'); closeBtn.setAttribute('data-breath', 'close');
    controls.appendChild(startBtn); controls.appendChild(pauseBtn); controls.appendChild(stopBtn); controls.appendChild(againBtn);
    if (opts.onClose) controls.appendChild(closeBtn);

    var optsRow = el('div', 'breath__opts');
    var soundLbl = el('label', '');
    var soundChk = document.createElement('input'); soundChk.type = 'checkbox'; soundChk.checked = sound;
    soundChk.addEventListener('change', function () { sound = soundChk.checked; if (sound) beep(); });
    soundLbl.appendChild(soundChk); soundLbl.appendChild(document.createTextNode(' 소리 (기본 꺼짐)'));
    optsRow.appendChild(soundLbl);

    root.appendChild(stage); root.appendChild(roundLbl); root.appendChild(done);
    if (roundsWrap) root.appendChild(roundsWrap);
    root.appendChild(controls); root.appendChild(optsRow);
    container.appendChild(root);

    function setControls() {
      startBtn.hidden = state !== 'idle' && state !== 'paused';
      startBtn.textContent = state === 'paused' ? '다시 시작' : '시작';
      pauseBtn.hidden = state !== 'running';
      stopBtn.hidden = state !== 'running' && state !== 'paused';
      againBtn.hidden = state !== 'done';
      closeBtn.hidden = state !== 'done';
      if (roundsWrap) Array.prototype.forEach.call(roundsWrap.children, function (c) { c.disabled = state === 'running' || state === 'paused'; });
    }
    function setScale(s) {
      if (reduce) return;
      circle.style.transform = 'scale(' + s.toFixed(4) + ')';
    }
    function setRing(p) { prog.setAttribute('stroke-dashoffset', (C * (1 - p)).toFixed(2)); }

    function render(elapsed) {
      var r = Math.min(rounds - 1, Math.floor(elapsed / ROUND));
      var inRound = elapsed - r * ROUND;
      var inhale = inRound < INHALE;
      var p = inhale ? inRound / INHALE : (inRound - INHALE) / EXHALE;
      var ph = inhale ? '들이쉬세요' : '내쉬세요';
      if (ph !== lastPhase) { phase.textContent = ph; lastPhase = ph; if (sound) beep(); }
      var remain = Math.ceil(((inhale ? INHALE : EXHALE) - (inhale ? inRound : inRound - INHALE)) / 1000);
      count.textContent = String(Math.max(1, Math.min(3, remain)));
      if (r !== lastRound) { roundLbl.textContent = (r + 1) + ' / ' + rounds; lastRound = r; }
      setScale(1 + 0.35 * easeInOut(inhale ? p : 1 - p));
      setRing(inRound / ROUND);
    }
    function tick() {
      if (state !== 'running') return;
      var elapsed = performance.now() - startAt - pausedTotal;
      if (elapsed >= total) { complete(); return; }
      render(elapsed);
      raf = requestAnimationFrame(tick);
    }
    function start() {
      if (state === 'running' || state === 'done') return;
      if (state === 'paused') { pausedTotal += performance.now() - pausedAt; }
      else { startAt = performance.now(); pausedTotal = 0; lastPhase = ''; lastRound = -1; done.hidden = true; }
      state = 'running'; setControls(); emit('start');
      raf = requestAnimationFrame(tick);
    }
    function pause() {
      if (state !== 'running') return;
      state = 'paused'; pausedAt = performance.now(); cancelAnimationFrame(raf);
      phase.textContent = '일시정지'; setControls(); emit('pause');
    }
    function stop() {
      if (state !== 'running' && state !== 'paused') return;
      cancelAnimationFrame(raf); state = 'idle'; reset(); emit('stop');
      if (opts.onStop) opts.onStop();
    }
    function reset() {
      state = 'idle'; lastPhase = ''; lastRound = -1;
      phase.textContent = '준비'; count.textContent = '3초 들숨 · 3초 날숨'; roundLbl.textContent = '0 / ' + rounds;
      setScale(1); setRing(0); done.hidden = true; setControls();
    }
    function complete() {
      cancelAnimationFrame(raf); state = 'done';
      setScale(1); setRing(1);
      phase.textContent = '완료'; count.textContent = '';
      roundLbl.textContent = rounds + ' / ' + rounds;
      done.textContent = rounds + '라운드 완료 · ' + (rounds * 6) + '초'; done.hidden = false;
      setControls();
      try { if (navigator.vibrate) navigator.vibrate(30); } catch (e) {}
      emit('complete');
      if (opts.onComplete) opts.onComplete({ rounds: rounds, seconds: rounds * 6 });
    }
    function again() { state = 'idle'; reset(); start(); }
    function emit(name) { (listeners[name] || []).forEach(function (fn) { fn(); }); }

    startBtn.addEventListener('click', start);
    pauseBtn.addEventListener('click', pause);
    stopBtn.addEventListener('click', stop);
    againBtn.addEventListener('click', again);
    closeBtn.addEventListener('click', function () { if (opts.onClose) opts.onClose(); });
    root.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.code === 'Space') {
        var t = e.target;
        if (t && (t.tagName === 'BUTTON' || t.tagName === 'INPUT')) return;
        e.preventDefault();
        if (state === 'running') pause(); else if (state !== 'done') start();
      }
    });

    setControls();
    if (opts.autoFocus) startBtn.focus();

    return {
      el: root, start: start, pause: pause, stop: stop, reset: reset,
      getState: function () { return state; },
      on: function (name, fn) { (listeners[name] = listeners[name] || []).push(fn); return this; },
      destroy: function () { cancelAnimationFrame(raf); if (root.parentNode) root.parentNode.removeChild(root); }
    };
  }

  /* ---------- Modal ---------- */
  var modal = null, modalOpener = null, modalTimer = null;
  var FOCUSABLE = 'a[href], button:not([disabled]):not([hidden]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
  function openModal(opts) {
    opts = opts || {};
    if (modal) closeModal();
    modalOpener = document.activeElement;
    modal = el('div', 'modal');
    modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-labelledby', 'breath-modal-title');
    var backdrop = el('div', 'modal__backdrop');
    var panel = el('div', 'modal__panel');
    var close = btn('', 'icon-btn modal__close');
    close.setAttribute('aria-label', '닫기');
    close.innerHTML = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    var title = el('h2', 'modal__title', '6초 호흡'); title.id = 'breath-modal-title';
    var sub = el('p', 'modal__sub', '3초 들이쉬고, 3초 내쉽니다. 원이 커지면 들이쉬고, 작아지면 내쉬세요.');
    var host = el('div', '');
    panel.appendChild(close); panel.appendChild(title); panel.appendChild(sub); panel.appendChild(host);
    modal.appendChild(backdrop); modal.appendChild(panel);
    document.body.appendChild(modal);
    document.body.classList.add('is-locked');
    modalTimer = create(host, { rounds: opts.rounds || 5, selectable: opts.selectable !== false, onClose: closeModal, onComplete: opts.onComplete });
    backdrop.addEventListener('click', closeModal);
    close.addEventListener('click', closeModal);
    modal.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); closeModal(); return; }
      if (e.key !== 'Tab') return;
      var items = modal.querySelectorAll(FOCUSABLE);
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    var startBtn = host.querySelector('[data-breath="start"]');
    if (startBtn) startBtn.focus(); else close.focus();
    return modalTimer;
  }
  function closeModal() {
    if (!modal) return;
    if (modalTimer) modalTimer.destroy();
    modal.parentNode.removeChild(modal);
    modal = null; modalTimer = null;
    document.body.classList.remove('is-locked');
    if (modalOpener && modalOpener.focus) modalOpener.focus();
  }

  /* Any element with [data-breath-open] opens the modal */
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-breath-open]');
    if (t) { e.preventDefault(); openModal({ rounds: parseInt(t.getAttribute('data-breath-open'), 10) || 5 }); }
  });

  window.HMBreath = { create: create, openModal: openModal, closeModal: closeModal, ROUND_MS: ROUND };
})();
