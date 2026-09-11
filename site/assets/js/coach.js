/* AI 마음브레이크 코치 — v1 규칙 기반 상태머신 (네트워크 없음)
   v2: COACH_ENDPOINT 를 서버리스 함수 URL('/api/coach' 등)로 설정하면 봇 발화를 LLM이 생성한다.
       실패·8초 타임아웃 시 v1 스크립트로 자동 폴백 + "오프라인 가이드로 계속합니다" 1줄 안내.
       흐름·버튼 구조는 항상 코드(v1)가 담당하고, LLM은 '말'만 담당한다. */
(function () {
  var COACH_ENDPOINT = ''; // [교체: v2 활성화 시 '/api/coach' 또는 '/.netlify/functions/coach']
  var TIMEOUT_MS = 8000;
  var MAX_CALLS = 12;

  var D = window.HM_COACH_DATA;
  var root = document.getElementById('coach');
  if (!root || !D) return;

  var chat = root.querySelector('.chat');
  var stepper = root.querySelector('.stepper');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var params = new URLSearchParams(location.search);
  var callCount = 0, offlineNoticed = false;
  var seq = 0; // R2 Q-01/02: 세션 토큰 — 재시작 시 증가, 이전 세션의 지연 콜백은 모두 무시
  var interacted = false; // R2 Q-18: 사용자가 한 번 조작한 뒤부터 새 블록의 첫 컨트롤로 포커스 이동

  var S; // session state
  function fresh() {
    return { track: null, action: null, emotions: [], intensity0: null, intensityNow: null, need: null, freeText: '',
      choice: null, choiceDetail: null, breaths: 0, highStreak: 0, safetyShown: false, paused: false, startedAt: new Date() };
  }

  /* ---------- helpers ---------- */
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function fmt(t, map) { return t.replace(/\{(\w+)\}/g, function (_, k) { return map[k] != null ? map[k] : ''; }); }
  function setStep(name) {
    root.setAttribute('data-step', name);
    var order = ['STOP', 'FEEL', 'CALM', 'CHOOSE'];
    var idx = { entry: -1, stop: 0, feel: 1, calm: 2, choose: 3, summary: 4 }[name.split('-')[0]];
    if (!stepper) return;
    Array.prototype.forEach.call(stepper.children, function (c, i) {
      c.classList.toggle('is-active', i === idx);
      c.classList.toggle('is-done', i < idx);
      if (i === idx) c.setAttribute('aria-current', 'step'); else c.removeAttribute('aria-current');
    });
  }
  function scrollLast() {
    var last = chat.lastElementChild;
    if (last && last.scrollIntoView) last.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    /* R2 Q-18: 칩 제거로 포커스가 body 로 빠졌으면 마지막 블록의 첫 인터랙티브 요소로 복귀 */
    if (interacted && (document.activeElement === document.body || !chat.contains(document.activeElement))) {
      var blocks = chat.querySelectorAll('.chat__block:not([hidden])');
      var target = blocks.length ? blocks[blocks.length - 1].querySelector('button, a[href], input, textarea') : chat.querySelector('.chat__safety a');
      if (target) target.focus({ preventScroll: true });
    }
  }
  function userBubble(text) { var b = el('div', 'bubble bubble--user', text); chat.appendChild(b); }
  function botBubble(text) { var b = el('div', 'bubble bubble--bot'); b.textContent = text; chat.appendChild(b); scrollLast(); return b; }
  function block() { var b = el('div', 'chat__block'); if (S.paused) b.hidden = true; chat.appendChild(b); return b; }
  function clearBlocks() { Array.prototype.forEach.call(chat.querySelectorAll('.chat__block'), function (b) { b.parentNode.removeChild(b); }); }

  /* Bot speech with typing indicator (400–700ms). Optionally personalised via v2 endpoint. */
  function say(stepId, text, userText) {
    var session = seq;
    return new Promise(function (resolve) {
      var typing = el('div', 'bubble bubble--bot bubble--typing');
      typing.setAttribute('aria-hidden', 'true');
      typing.innerHTML = '<i></i><i></i><i></i>';
      chat.appendChild(typing); scrollLast();
      var delay = reduce ? 0 : 400 + Math.random() * 300;
      var v2 = COACH_ENDPOINT ? fetchV2(stepId, userText) : Promise.resolve(null);
      Promise.all([v2, new Promise(function (r) { setTimeout(r, delay); })]).then(function (res) {
        var r = res[0];
        if (typing.parentNode) typing.parentNode.removeChild(typing);
        if (session !== seq) return; // 재시작된 세션: 이전 발화는 버리고 체인을 멈춘다(resolve 하지 않음)
        var finalText = r && r.say ? r.say : text;
        botBubble(finalText);
        if (r && r.safety_flag) showSafety();
        resolve(r || null);
      });
    });
  }
  function fetchV2(stepId, userText) {
    if (callCount >= MAX_CALLS) return Promise.resolve(null);
    callCount++;
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, TIMEOUT_MS);
    var payload = { track: S.track || 'general', step: stepId, state: {
      action: S.action, emotions: S.emotions, intensity0: S.intensity0, intensityNow: S.intensityNow, need: S.need, choice: S.choice
    }, userText: (userText || '').slice(0, 500) };
    return fetch(COACH_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: ctrl ? ctrl.signal : undefined })
      .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
      .then(function (json) { clearTimeout(timer); if (!json || typeof json.say !== 'string') throw new Error('bad shape'); return json; })
      .catch(function () {
        clearTimeout(timer);
        if (!offlineNoticed) { offlineNoticed = true; var n = el('p', 'notice', D.offline); chat.appendChild(n); }
        return null;
      });
  }

  function choices(items, onPick, opts) {
    opts = opts || {};
    var wrap = el('div', 'choices'); wrap.setAttribute('role', 'group');
    items.forEach(function (it, i) {
      var label = typeof it === 'string' ? it : it.label;
      var node;
      if (it && it.href) {
        node = el('a', 'chip chip--link', label); node.href = it.href;
        node.addEventListener('click', function () { onPick(it, i, true); });
      } else {
        node = el('button', 'chip', label); node.type = 'button';
        node.addEventListener('click', function () { onPick(it, i, false); });
      }
      node.setAttribute('data-opt', String(i));
      node.setAttribute('data-value', typeof it === 'string' ? it : (it.value || it.label));
      wrap.appendChild(node);
    });
    return wrap;
  }
  function cta(label, fn, cls) {
    var b = el('button', cls || 'btn btn--primary btn--small', label); b.type = 'button';
    b.setAttribute('data-cta', ''); b.addEventListener('click', fn); return b;
  }
  function slider(id, initial) {
    var wrap = el('div', 'field-inline');
    var lbl = el('label', 'small', '0 = 거의 없음 · 10 = 견디기 힘듦'); lbl.htmlFor = id;
    var row = el('div', 'slider-row');
    var input = document.createElement('input'); input.type = 'range'; input.min = '0'; input.max = '10'; input.step = '1'; input.value = String(initial); input.id = id; input.className = 'slider';
    var out = el('output', '', String(initial)); out.setAttribute('for', id);
    input.addEventListener('input', function () { out.textContent = input.value; });
    row.appendChild(input); row.appendChild(out);
    wrap.appendChild(lbl); wrap.appendChild(row);
    return { el: wrap, input: input };
  }

  /* ---------- Safety card ---------- */
  function hasKeyword(text) {
    if (!text) return false;
    return D.safety.keywords.some(function (k) { return text.indexOf(k) !== -1; });
  }
  function showSafety() {
    var card = el('div', 'safety-card chat__safety'); card.setAttribute('role', 'alert');
    card.appendChild(el('p', 'strong', D.safety.say));
    card.appendChild(el('p', 'small', D.safety.lines.common));
    if (S.track === 'money') card.appendChild(el('p', 'small', D.safety.lines.money));
    if (S.track === 'relation') card.appendChild(el('p', 'small', D.safety.lines.relation));
    var row = el('div', 'chat__actions');
    D.safety.calls.forEach(function (c) { var a = el('a', 'btn btn--secondary btn--small', c.label); a.href = 'tel:' + c.tel; row.appendChild(a); });
    card.appendChild(row);
    var cont = el('a', 'safety-card__continue', D.safety.resume); cont.href = '#'; cont.setAttribute('data-safety-continue', '');
    cont.addEventListener('click', function (e) {
      e.preventDefault(); S.paused = false; card.classList.add('is-ack');
      Array.prototype.forEach.call(chat.querySelectorAll('.chat__block'), function (b) { b.hidden = false; });
      scrollLast();
    });
    card.appendChild(cont);
    chat.appendChild(card);
    S.safetyShown = true; S.paused = true;
    Array.prototype.forEach.call(chat.querySelectorAll('.chat__block'), function (b) { b.hidden = true; });
    scrollLast();
    return card;
  }

  /* ---------- Steps ---------- */
  function start() {
    seq++;
    if (root._breath) { root._breath.destroy(); root._breath = null; } // R2 Q-01: 진행 중 타이머 파괴
    S = fresh(); chat.innerHTML = ''; callCount = 0;
    var t = params.get('track');
    if (t === 'relation' || t === 'money') { S.track = t; setStep('stop'); stepStop(); return; }
    setStep('entry');
    say('entry', D.entry.say).then(function () {
      var b = block();
      b.appendChild(choices(D.entry.options, function (opt) {
        clearBlocks(); userBubble(opt.label); S.track = opt.value; setStep('stop'); stepStop();
      }));
      scrollLast();
    });
  }

  function stepStop() {
    say('stop-intro', D.stop.intro[S.track]).then(function () { return say('stop-ask', D.stop.ask); }).then(function () {
      var b = block();
      b.appendChild(choices(D.stop.actions[S.track], function (opt) {
        clearBlocks(); userBubble(opt); S.action = opt;
        say('stop-ack', fmt(D.stop.ack, { action: opt }), opt).then(function () {
          var b2 = block(); b2.appendChild(cta(D.stop.next, function () { clearBlocks(); setStep('feel'); stepFeel(); })); scrollLast();
        });
      }));
      scrollLast();
    });
  }

  function stepFeel() {
    say('feel-intro', D.feel.intro).then(function () {
      var b = block();
      var selected = [];
      var chips = el('div', 'choices'); chips.setAttribute('role', 'group'); chips.setAttribute('aria-label', '감정 선택 (최대 3개)');
      D.feel.emotions.forEach(function (em, i) {
        var c = el('button', 'chip', em); c.type = 'button'; c.setAttribute('aria-pressed', 'false'); c.setAttribute('data-emotion', em); c.setAttribute('data-opt', String(i));
        c.addEventListener('click', function () {
          var idx = selected.indexOf(em);
          if (idx > -1) { selected.splice(idx, 1); c.setAttribute('aria-pressed', 'false'); }
          else if (selected.length < D.feel.maxEmotions) { selected.push(em); c.setAttribute('aria-pressed', 'true'); }
          go.disabled = selected.length === 0;
        });
        chips.appendChild(c);
      });
      b.appendChild(chips);
      b.appendChild(el('p', 'small mt-2', D.feel.intensityAsk));
      var sl = slider('coach-intensity', D.feel.intensityDefault);
      b.appendChild(sl.el);
      var inWrap = el('div', 'chat__input mt-2');
      var ta = document.createElement('textarea'); ta.id = 'coach-free'; ta.maxLength = 500; ta.placeholder = D.feel.freeAsk; ta.setAttribute('aria-label', '한 문장으로 적기 (선택)');
      inWrap.appendChild(ta); b.appendChild(inWrap);
      var go = cta('감정 확인', function () {
        if (!selected.length) return;
        S.emotions = selected.slice(); S.intensity0 = parseInt(sl.input.value, 10); S.intensityNow = S.intensity0; S.freeText = ta.value.trim();
        clearBlocks();
        userBubble(selected.join(', ') + ' · 세기 ' + S.intensity0 + (S.freeText ? ' · "' + S.freeText + '"' : ''));
        if (hasKeyword(S.freeText)) { showSafety(); }
        var first = S.emotions[0];
        say('feel-ack', D.feel.ack[first], S.freeText).then(function () {
          var combo = D.safety.comboEmotions.every(function (e) { return S.emotions.indexOf(e) > -1; });
          if (combo && !S.safetyShown) showSafety();
          return say('feel-need', D.feel.needAsk);
        }).then(function () {
          var b2 = block();
          b2.appendChild(choices(D.feel.needs[S.track], function (need) {
            clearBlocks(); userBubble(need); S.need = need;
            say('feel-need-ack', fmt(D.feel.needAck, { emotion: S.emotions[0], need: need })).then(function () {
              var b3 = block(); b3.appendChild(cta(D.feel.next, function () { clearBlocks(); setStep('calm'); stepCalm(); })); scrollLast();
            });
          }));
          scrollLast();
        });
      });
      go.disabled = true;
      var row = el('div', 'chat__actions mt-2'); row.appendChild(go); b.appendChild(row);
      scrollLast();
    });
  }

  function stepCalm() {
    say('calm-intro', D.calm.intro).then(function () { renderBreath(); });
  }
  function renderBreath() {
    var b = block();
    var host = el('div', ''); b.appendChild(host);
    var session = seq;
    var timer = window.HMBreath.create(host, {
      rounds: D.calm.rounds, size: 'sm', autoFocus: true,
      onComplete: function () { if (session !== seq) return; S.breaths++; clearBlocks(); userBubble('호흡 ' + D.calm.rounds + '라운드 완료'); afterBreath(); },
      onStop: function () { if (session !== seq) return; clearBlocks(); userBubble('호흡 중단'); say('calm-stopped', D.calm.stopped).then(afterBreath); }
    });
    root._breath = timer;
    scrollLast();
  }
  function afterBreath() {
    say('calm-after', D.calm.after).then(function () {
      var b = block();
      b.appendChild(choices(D.calm.afterOptions, function (opt, i) {
        clearBlocks(); userBubble(opt);
        if (i === 0) renderBreath(); else stepEft();
      }));
      scrollLast();
    });
  }
  function stepEft() {
    var emotion = S.emotions[0];
    say('calm-eft', D.calm.eftGuide).then(function () {
      var bubble = el('div', 'bubble bubble--bot');
      bubble.appendChild(el('p', 'eft-line', fmt(D.calm.eftTemplate, { emotion: emotion })));
      bubble.appendChild(el('p', 'small faint', D.calm.eftNote));
      chat.appendChild(bubble);
      var b = block(); b.appendChild(cta(D.calm.eftNext, function () { clearBlocks(); remeasure(); })); scrollLast();
    });
  }
  function remeasure() {
    say('calm-remeasure', D.calm.remeasureAsk).then(function () {
      var b = block();
      var sl = slider('coach-intensity-2', S.intensityNow);
      b.appendChild(sl.el);
      var row = el('div', 'chat__actions mt-2');
      row.appendChild(cta('확인', function () {
        var before = S.intensityNow, after = parseInt(sl.input.value, 10);
        S.intensityNow = after; clearBlocks(); userBubble('세기 ' + after);
        S.highStreak = after >= D.safety.highThreshold ? S.highStreak + 1 : 0;
        var trigger = S.highStreak >= D.safety.highRepeat;
        if (after < before) {
          say('calm-lower', fmt(D.calm.lower, { before: before, after: after })).then(function () {
            if (trigger) showSafety();
            var b2 = block(); b2.appendChild(cta(D.calm.next, function () { clearBlocks(); setStep('choose'); stepChoose(); })); scrollLast();
          });
        } else {
          say('calm-same', D.calm.same).then(function () {
            if (trigger) showSafety();
            var b2 = block();
            b2.appendChild(choices(D.calm.sameOptions, function (opt, i) {
              clearBlocks(); userBubble(opt);
              if (i === 0) renderBreath(); else { setStep('choose'); stepChoose(); }
            }));
            scrollLast();
          });
        }
      }));
      b.appendChild(row); scrollLast();
    });
  }

  function stepChoose() {
    say('choose-intro', D.choose.intro).then(function () {
      var b = block();
      b.appendChild(choices(D.choose.actions[S.track], function (opt, i, isLink) {
        S.choice = opt.label;
        if (isLink) { try { sessionStorage.setItem('hm-coach-summary', JSON.stringify(summaryData())); } catch (e) {} return; }
        clearBlocks(); userBubble(opt.label);
        if (opt.detail) renderDetail(opt); else finish();
      }));
      scrollLast();
    });
  }
  function renderDetail(opt) {
    var bubble = el('div', 'bubble bubble--bot');
    var b = block();
    var confirm = cta(D.choose.detailNext, function () { clearBlocks(); finish(); });
    if (opt.detail === 'example') {
      bubble.appendChild(el('p', '', '이런 문장으로 알려도 좋아요.'));
      bubble.appendChild(el('p', 'eft-line', '"' + opt.example + '"'));
    } else if (opt.detail === 'nvc') {
      bubble.appendChild(el('p', '', '네 칸을 채우면 한 문장이 됩니다.'));
      var nvc = el('div', 'nvc'); opt.cells.forEach(function (c) { nvc.appendChild(el('span', '', c)); }); bubble.appendChild(nvc);
    } else if (opt.detail === 'limits') {
      bubble.appendChild(el('p', '', '적어 두는 것만으로 기준이 생깁니다. 저장하지 않으며 화면에만 남습니다.'));
      var form = el('div', 'field-inline mt-2');
      var inputs = {};
      opt.fields.forEach(function (f) {
        var lbl = el('label', 'small', f.label); lbl.htmlFor = 'lim-' + f.key;
        var inp = document.createElement('input'); inp.type = 'text'; inp.id = 'lim-' + f.key; inp.placeholder = f.placeholder; inp.className = 'chat__field';
        form.appendChild(lbl); form.appendChild(inp); inputs[f.key] = inp;
      });
      b.appendChild(form);
      confirm.addEventListener('click', function () { S.choiceDetail = '손절선 ' + (inputs.stop.value || '—') + ' · 최대 ' + (inputs.max.value || '—'); }, true);
    } else if (opt.detail === 'check') {
      bubble.appendChild(el('p', '', '30초, 세 가지만 점검합니다.'));
      var list = el('div', 'nvc');
      opt.checks.forEach(function (c, i) {
        var lab = el('label', ''); var cb = document.createElement('input'); cb.type = 'checkbox'; cb.id = 'chk-' + i;
        lab.appendChild(cb); lab.appendChild(document.createTextNode(c)); list.appendChild(lab);
      });
      bubble.appendChild(list);
      confirm.addEventListener('click', function () {
        var checked = Array.prototype.filter.call(bubble.querySelectorAll('input:checked'), function () { return true; }).length;
        S.choiceDetail = '점검 ' + checked + ' / ' + opt.checks.length;
      }, true);
    }
    chat.insertBefore(bubble, b);
    b.appendChild(confirm); scrollLast();
  }

  function summaryData() {
    return { track: D.tracks[S.track].name, emotions: S.emotions.join(', '), intensity: S.intensity0 + ' → ' + S.intensityNow, need: S.need,
      choice: S.choice + (S.choiceDetail ? ' (' + S.choiceDetail + ')' : ''), when: new Date().toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }) };
  }
  function finish() {
    setStep('summary');
    say('closing', fmt(D.choose.closing, { choice: S.choice, emotion: S.emotions[0] })).then(function () {
      var data = summaryData();
      try { sessionStorage.setItem('hm-coach-summary', JSON.stringify(data)); } catch (e) {}
      var card = el('div', 'summary-card chat__summary'); card.setAttribute('data-summary', '');
      card.appendChild(el('p', 'eyebrow eyebrow--accent', D.summary.title));
      var dl = el('dl', '');
      [['트랙', data.track], ['감정', data.emotions], ['강도 변화', data.intensity], ['바람', data.need], ['선택한 행동', data.choice], ['날짜·시간', data.when]].forEach(function (p) {
        dl.appendChild(el('dt', '', p[0])); dl.appendChild(el('dd', '', p[1]));
      });
      card.appendChild(dl);
      var row = el('div', 'chat__actions');
      var copyBtn = cta(D.summary.copy, function () {
        var text = ['[마음브레이크 요약]', '트랙: ' + data.track, '감정: ' + data.emotions, '강도 변화: ' + data.intensity, '바람: ' + data.need, '선택한 행동: ' + data.choice, '날짜·시간: ' + data.when].join('\n');
        var done = function () { copyBtn.textContent = D.summary.copied; setTimeout(function () { copyBtn.textContent = D.summary.copy; }, 1500); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
        else { fallbackCopy(text); done(); }
      }, 'btn btn--secondary btn--small');
      row.appendChild(copyBtn);
      row.appendChild(cta(D.summary.restart, function () { start(); }, 'btn btn--secondary btn--small'));
      var a1 = el('a', 'btn btn--secondary btn--small', D.summary.checkup); a1.href = 'checkup.html' + (S.track !== 'general' ? '#' + S.track : '');
      var a2 = el('a', 'btn btn--primary btn--small', D.summary.counsel); a2.href = 'contact.html#counsel';
      row.appendChild(a1); row.appendChild(a2);
      card.appendChild(row);
      chat.appendChild(card); scrollLast();
    });
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.left = '-9999px';
    document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(ta);
  }

  chat.addEventListener('click', function () { interacted = true; });
  chat.addEventListener('keydown', function () { interacted = true; });
  var restartBtn = root.querySelector('[data-coach-restart]');
  if (restartBtn) restartBtn.addEventListener('click', function () { start(); });

  window.HMCoach = { start: start, state: function () { return S; }, hasKeyword: hasKeyword, endpoint: COACH_ENDPOINT, session: function () { return seq; } };
  start();
})();
