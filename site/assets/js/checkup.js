/* 마음근력 자가진단 (01-plan §5-b)
   - 관계 R1~R8 / 머니 M1~M8, 5점 리커트, 역채점 없음
   - S = 합계(8~40). 안정 8~17 / 주의 18~28 / 훈련 필요 29~40
   - 지수 = round((40-S)/32*100). 게이지 경계: 안정 ≥72, 주의 38~71, 훈련 필요 ≤37
   - 보조 묶음(알아차림/안정/선택) 최고점 = 먼저 훈련할 단계, 동점 시 알아차림→안정→선택
   - 공유 해시 #result=R-23 (트랙-점수만). 서버 전송 없음. */
(function () {
  var DATA = {
    relation: {
      code: 'R', label: '관계 마음근력', tint: 'relation',
      questions: [
        '배우자나 자녀의 한마디에 순식간에 화가 치밀어 오른다.',
        '화가 나면 나중에 후회할 말을 먼저 내뱉는다.',
        '갈등이 생기면 대화 대신 입을 닫거나 자리를 피한다.',
        '상대가 나를 무시한다고 느끼면 억울함이 오래 간다.',
        '내가 무엇을 느끼는지보다 상대의 잘못이 먼저 떠오른다.',
        '감정이 격해질 때 몸(호흡·심장·손)의 변화를 알아차리지 못한다.',
        '상대에게 내 감정과 바람을 비난 없이 말하기가 어렵다.',
        '같은 패턴의 싸움이 반복되는데 멈추는 방법을 모르겠다.'
      ],
      groups: { '알아차림': [5, 6], '안정': [1, 4, 8], '선택': [2, 3, 7] },
      results: {
        stable: { head: '감정과 행동 사이에 이미 틈이 있습니다.', body: '갈등 상황에서도 멈추고 말하는 힘이 작동하고 있어요. 지금의 방식을 언어로 정리해 두면, 흔들리는 날에도 꺼내 쓸 수 있습니다.', program: 'AI 마음브레이크 코치(주 1회 점검) · 필요 시 단회 코칭' },
        caution: { head: '특정 장면에서 틈이 사라집니다.', body: "평소에는 괜찮지만 '그 말', '그 표정' 앞에서 감정이 행동을 앞지릅니다. 가장 높게 나온 '{group}' 단계부터 훈련하면 반복되는 싸움의 고리를 끊을 수 있어요.", program: '"마음잇기"(부모자녀) 또는 "다시, 우리"(부부) 단기 코칭 [교체: 회기]' },
        train: { head: '지금은 감정이 행동을 대신 고르고 있습니다.', body: '상처 → 폭발 → 공격·회피가 거의 자동으로 이어지고 있어요. 의지의 문제가 아니라 훈련이 비어 있는 상태입니다. 마음브레이크 4단계를 코치와 함께 몸에 익히는 것을 권합니다.', program: '관계 마음근력 개인 코칭 + 커플/가족 세션 [교체: 회기] · 상담 신청 우선' }
      }
    },
    money: {
      code: 'M', label: '머니 마음근력', tint: 'money',
      questions: [
        '손실이 나면 "빨리 복구해야 한다"는 생각이 머리를 떠나지 않는다.',
        '손실 직후 계획에 없던 추가 매수나 베팅을 한 적이 있다.',
        '미리 정한 손절선이나 한도를 지키지 못한다.',
        '수익이 나면 흥분해서 규모를 갑자기 키운다.',
        '시세를 확인하지 않으면 불안해서 다른 일에 집중하기 어렵다.',
        '손실을 가족이나 가까운 사람에게 숨긴다.',
        '"이번에는 될 거야"라는 생각으로 근거 없이 다시 들어간다.',
        '돈 문제로 인한 조급함·억울함을 낮추는 나만의 방법이 없다.'
      ],
      groups: { '알아차림': [1, 5, 7], '안정': [4, 8], '선택': [2, 3, 6] },
      results: {
        stable: { head: '마음의 손절선이 서 있습니다.', body: '손실 뒤에도 규칙이 감정보다 앞서고 있어요. 흥분·조급함이 커지는 장세에서 이 규칙을 유지하는 것이 다음 과제입니다.', program: 'AI 마음브레이크 코치(거래 전 루틴) · 필요 시 단회 코칭' },
        caution: { head: '손실 직후, 틈이 좁아집니다.', body: "평소 규칙은 있지만 손실 직후 \"빨리 복구해야 해\"가 규칙을 밀어냅니다. '{group}' 단계부터 훈련하면 추격매매의 고리를 끊을 수 있어요.", program: '머니 마음근력 단기 코칭 [교체: 회기]' },
        train: { head: '지금은 손실이 다음 행동을 결정하고 있습니다.', body: '손실 → 조급함 → 충동행동 → 추가 손실이 반복되고 있어요. 수익률보다 먼저 마음의 손절선을 세우는 훈련이 필요합니다. 혼자 버티기보다 코치와 함께 시작하세요.', program: '머니 마음근력 개인 코칭 [교체: 회기] · 상담 신청 우선' }
      }
    }
  };
  var BANDS = { stable: '안정', caution: '주의', train: '훈련 필요' };
  /* R2 E봇 P1: "오늘 할 것 1개" — AI 코치 CHOOSE 선택지(coach-data)에서 트랙·구간별로 1개 */
  var TODAY = {
    relation: { stable: '먼저 아이(배우자)의 말을 한 번 그대로 되풀이해 주기', caution: '지금은 말하지 않고, 20분 뒤 다시 이야기하자고 알리기', train: '내가 받은 상처를 한 줄로 적어 두고 오늘은 여기까지' },
    money: { stable: "매수/베팅 전 '이번에는 될 거야'가 자동생각인지 30초 점검하기", caution: '미리 정한 손절선·투자 한도를 지금 적어 두기', train: '오늘 거래 앱을 닫고 24시간 뒤에 열기' }
  };
  var SCALE = ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'];
  var GROUP_ORDER = ['알아차림', '안정', '선택'];

  /* ---------- pure scoring (exposed for tests) ---------- */
  function band(S) { return S <= 17 ? 'stable' : S <= 28 ? 'caution' : 'train'; }
  function index(S) { return Math.round((40 - S) / 32 * 100); }
  function topGroup(track, answers) {
    var g = DATA[track].groups, best = null, bestVal = -1;
    GROUP_ORDER.forEach(function (name) {
      var sum = g[name].reduce(function (a, q) { return a + (answers[q - 1] || 0); }, 0);
      var avg = sum / g[name].length;
      if (avg > bestVal) { bestVal = avg; best = name; }
    });
    return best;
  }
  function score(track, answers) {
    if (!DATA[track] || !answers || answers.length !== 8) return null;
    var S = answers.reduce(function (a, b) { return a + b; }, 0);
    return { track: track, sum: S, band: band(S), bandLabel: BANDS[band(S)], index: index(S), group: topGroup(track, answers), code: DATA[track].code + '-' + S };
  }

  /* ---------- UI ---------- */
  var root = document.getElementById('checkup');
  if (!root) return;
  var pick = root.querySelector('[data-pick]');
  var quiz = root.querySelector('[data-quiz]');
  var resultEl = root.querySelector('[data-result]');
  var track = null, answers = [], current = 0, pointerPick = false;

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

  function selectTrack(t, opts) {
    track = t; answers = new Array(8).fill(0); current = 0;
    Array.prototype.forEach.call(pick.querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-track') === t ? 'true' : 'false'); });
    renderQuiz();
    pick.hidden = true; resultEl.hidden = true; quiz.hidden = false;
    if (!(opts && opts.silent)) history.replaceState(null, '', '#' + t);
    var first = quiz.querySelector('.qcard:not([hidden]) input');
    if (first && !(opts && opts.silent)) quiz.querySelector('[data-progress-label]').focus();
  }

  function renderQuiz() {
    var d = DATA[track];
    quiz.innerHTML = '';
    var head = el('div', 'stack');
    var prog = el('div', 'progress'); var bar = el('div', 'progress__bar'); prog.appendChild(bar);
    var plabel = el('p', 'eyebrow eyebrow--' + d.tint); plabel.setAttribute('data-progress-label', ''); plabel.tabIndex = -1;
    head.appendChild(prog); head.appendChild(plabel);
    quiz.appendChild(head);
    var cards = [];
    d.questions.forEach(function (q, i) {
      var card = el('section', 'qcard'); card.setAttribute('aria-labelledby', 'q-' + i); card.hidden = i !== 0;
      card.appendChild(el('p', 'mono faint', d.code + (i + 1) + ' / 08'));
      var qt = el('h2', 'qcard__q', q); qt.id = 'q-' + i; card.appendChild(qt);
      var fs = el('fieldset', 'likert'); var lg = el('legend', 'visually-hidden', q); fs.appendChild(lg);
      var scale = el('div', 'likert__scale');
      for (var v = 1; v <= 5; v++) (function (v) {
        var lab = el('label', 'likert__opt');
        var inp = document.createElement('input'); inp.type = 'radio'; inp.name = 'q' + i; inp.value = String(v); inp.setAttribute('aria-label', v + ' — ' + SCALE[v - 1]);
        /* R2 Q-05: 키보드 선택은 절대 자동 진행하지 않음('다음' 활성화만). 포인터 클릭일 때만 짧은 지연 후 자동 진행 */
        lab.addEventListener('pointerdown', function () { pointerPick = true; setTimeout(function () { pointerPick = false; }, 400); });
        inp.addEventListener('change', function () {
          answers[i] = v; updateProgress();
          if (i < 7 && pointerPick) { pointerPick = false; setTimeout(function () { if (current === i) goTo(i + 1); }, 220); }
        });
        var span = el('span', '', String(v));
        lab.appendChild(inp); lab.appendChild(span); scale.appendChild(lab);
      })(v);
      fs.appendChild(scale);
      var ends = el('div', 'likert__ends'); ends.appendChild(el('span', '', '전혀 아니다')); ends.appendChild(el('span', '', '매우 그렇다')); fs.appendChild(ends);
      card.appendChild(fs);
      var nav = el('div', 'qnav');
      var prev = el('button', 'btn btn--secondary btn--small', '이전'); prev.type = 'button'; prev.disabled = i === 0; prev.addEventListener('click', function () { goTo(i - 1); });
      nav.appendChild(prev);
      if (i < 7) { var next = el('button', 'btn btn--secondary btn--small', '다음'); next.type = 'button'; next.setAttribute('data-next', ''); next.disabled = true; next.addEventListener('click', function () { goTo(i + 1); }); nav.appendChild(next); }
      else {
        var fin = el('button', 'btn btn--primary btn--small', '결과 보기'); fin.type = 'button'; fin.setAttribute('data-finish', ''); fin.disabled = true;
        fin.addEventListener('click', showResult); nav.appendChild(fin);
        var err = el('p', 'qerror'); err.setAttribute('data-qerror', ''); err.setAttribute('aria-live', 'polite'); err.hidden = true; card.appendChild(err);
      }
      card.appendChild(nav);
      quiz.appendChild(card); cards.push(card);
    });
    quiz._cards = cards; quiz._bar = bar; quiz._plabel = plabel;
    updateProgress();
  }
  function firstUnanswered() { for (var i = 0; i < 8; i++) if (!answers[i]) return i; return -1; }
  function updateProgress() {
    var done = answers.filter(Boolean).length;
    quiz._bar.style.width = (done / 8 * 100) + '%';
    quiz._plabel.textContent = DATA[track].label + ' · ' + (current + 1) + ' / 8 · 응답 ' + done + '/8';
    var fin = quiz.querySelector('[data-finish]'); if (fin) fin.disabled = done < 8;
    var nextBtn = quiz._cards[current].querySelector('[data-next]'); if (nextBtn) nextBtn.disabled = !answers[current];
    var err = quiz.querySelector('[data-qerror]');
    if (!err) return;
    var miss = firstUnanswered();
    if (done === 8 || current !== 7 || miss < 0) { err.hidden = true; return; }
    err.textContent = '';
    err.appendChild(document.createTextNode((miss + 1) + '번 문항에 응답이 없습니다. '));
    var jump = el('button', 'text-link', '해당 문항으로 이동'); jump.type = 'button'; jump.setAttribute('data-jump', '');
    jump.addEventListener('click', function () { goTo(miss); });
    err.appendChild(jump); err.hidden = false;
  }
  function goTo(i) {
    if (i < 0 || i > 7) return;
    quiz._cards[current].hidden = true; current = i; quiz._cards[i].hidden = false;
    updateProgress();
    var focusTarget = quiz._cards[i].querySelector('input:checked') || quiz._cards[i].querySelector('h2');
    if (focusTarget) { if (focusTarget.tagName === 'H2') focusTarget.tabIndex = -1; focusTarget.focus({ preventScroll: false }); }
    quiz._cards[i].scrollIntoView({ block: 'nearest' });
  }
  function showResult() {
    var miss = firstUnanswered();
    if (miss > -1) { var err = quiz.querySelector('[data-qerror]'); err.textContent = (miss + 1) + '번 문항에 응답이 없습니다.'; err.hidden = false; goTo(miss); return; }
    var r = score(track, answers);
    renderResult(r, false);
    history.replaceState(null, '', '#result=' + r.code);
  }

  function gaugeSVG(idx, bandKey) {
    // half circle: r=100, center (120,120), from 180deg to 0deg, thick arc 12px
    var cx = 120, cy = 120, r = 100;
    function pt(p) { var a = Math.PI - p * Math.PI; return [cx + r * Math.cos(a), cy - r * Math.sin(a)]; }
    function arc(p0, p1, color, w) {
      var a = pt(p0), b = pt(p1);
      return '<path d="M' + a[0].toFixed(2) + ' ' + a[1].toFixed(2) + ' A' + r + ' ' + r + ' 0 ' + ((p1 - p0) > 0.5 ? 1 : 0) + ' 1 ' + b[0].toFixed(2) + ' ' + b[1].toFixed(2) + '" fill="none" stroke="' + color + '" stroke-width="' + w + '" stroke-linecap="butt"/>';
    }
    var colors = { train: 'var(--relation)', caution: 'var(--amber)', stable: 'var(--accent)' };
    var s = '<svg viewBox="0 0 240 132" role="img" aria-label="마음근력 지수 ' + idx + ', ' + BANDS[bandKey] + ' 구간">';
    s += arc(0, 0.375, colors.train, 3) + arc(0.38, 0.715, colors.caution, 3) + arc(0.72, 1, colors.stable, 3);
    s += arc(0, Math.max(0.005, idx / 100), colors[bandKey], 12);
    s += '</svg>';
    return s;
  }
  function renderResult(r, shared) {
    var d = DATA[r.track], txt = d.results[r.band];
    resultEl.innerHTML = '';
    var wrap = el('div', 'result');
    var g = el('div', 'gauge'); g.innerHTML = gaugeSVG(r.index, r.band);
    g.appendChild(el('div', 'gauge__value', String(r.index)));
    g.appendChild(el('div', 'gauge__label', '마음근력 지수 · ' + r.bandLabel));
    var legend = el('div', 'gauge__legend');
    [['stable', '안정 ≥ 72', 'var(--accent)'], ['caution', '주의 38–71', 'var(--amber)'], ['train', '훈련 필요 ≤ 37', 'var(--relation)']].forEach(function (L) {
      var sp = el('span', ''); var dot = el('i', ''); dot.style.background = L[2]; sp.appendChild(dot); sp.appendChild(document.createTextNode(L[1])); legend.appendChild(sp);
    });
    g.appendChild(legend);
    wrap.appendChild(g);
    var body = el('div', 'stack');
    body.appendChild(el('p', 'result__band result__band--' + r.band, d.label + ' · ' + r.bandLabel + ' · 합계 ' + r.sum + ' / 40'));
    var h = el('h2', 't-h2', txt.head); h.setAttribute('data-result-head', ''); body.appendChild(h);
    var bodyText = r.group ? txt.body.replace('{group}', r.group) : txt.body.replace(/(가장 높게 나온 )?'\{group\}' 단계부터/, '먼저 훈련할 단계부터'); /* R2 Q-11 */
    body.appendChild(el('p', 'lead', bodyText));
    if (r.group) body.appendChild(el('p', 'small', '먼저 훈련할 단계: ' + r.group + ' (알아차림 → 안정 → 선택 중 가장 높게 나온 묶음)'));
    else if (shared) body.appendChild(el('p', 'small faint', '공유된 결과에는 개별 응답이 포함되지 않아, 먼저 훈련할 단계는 표시되지 않습니다.'));
    var prog = el('div', 'card card--flat');
    prog.appendChild(el('p', 'eyebrow eyebrow--accent', '추천 프로그램'));
    prog.appendChild(el('p', 'strong', txt.program));
    body.appendChild(prog);
    var today = el('div', 'result__today');
    today.appendChild(el('p', 'eyebrow eyebrow--accent', '오늘 할 것 1개'));
    today.appendChild(el('p', 'serif', TODAY[r.track][r.band]));
    today.appendChild(el('p', 'small muted', 'AI 마음브레이크 코치의 선택 단계에서 고를 수 있는 행동입니다. 큰 행동일 필요는 없습니다.'));
    body.appendChild(today);
    if (r.track === 'money' && r.band === 'train') {
      var cn = el('p', 'crisis-note'); cn.innerHTML = '도박 문제 상담: 한국도박문제예방치유원 헬프라인 <a href="tel:1336">1336</a> (24시간)'; body.appendChild(cn);
    }
    var actions = el('div', 'cluster mt-2');
    var stable = r.band === 'stable'; /* R2 E봇: 안정 구간은 AI 코치를 주 CTA 로 */
    var a1 = el('a', 'btn btn--small ' + (stable ? 'btn--primary' : 'btn--secondary'), stable ? 'AI 코치로 주 1회 점검하기' : 'AI 코치 해보기'); a1.href = 'ai-coach.html?track=' + r.track;
    var a2 = el('a', 'btn btn--small ' + (stable ? 'btn--secondary' : 'btn--primary'), '상담 신청'); a2.href = 'contact.html?result=' + r.code + '#counsel';
    var share = el('button', 'btn btn--secondary btn--small', '결과 링크 복사'); share.type = 'button';
    share.addEventListener('click', function () {
      var url = location.origin + location.pathname + '#result=' + r.code;
      var done = function () { share.textContent = '복사됨'; setTimeout(function () { share.textContent = '결과 링크 복사'; }, 1500); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, done); else done();
    });
    var again = el('button', 'btn btn--secondary btn--small', '다시 하기'); again.type = 'button';
    again.addEventListener('click', function () { resultEl.hidden = true; pick.hidden = false; history.replaceState(null, '', location.pathname); pick.querySelector('button').focus(); });
    actions.appendChild(a1); actions.appendChild(a2); actions.appendChild(share); actions.appendChild(again);
    body.appendChild(actions);
    body.appendChild(el('p', 'small faint', '이 진단은 자기 이해를 돕는 도구이며 의학적 진단이 아닙니다.'));
    wrap.appendChild(body);
    resultEl.appendChild(wrap);
    try { sessionStorage.setItem('hm-checkup-result', r.code); } catch (e) {}
    quiz.hidden = true; pick.hidden = true; resultEl.hidden = false;
    h.tabIndex = -1; h.focus();
    resultEl.scrollIntoView({ block: 'start' });
  }

  Array.prototype.forEach.call(pick.querySelectorAll('button[data-track]'), function (b) {
    b.addEventListener('click', function () { selectTrack(b.getAttribute('data-track')); });
  });

  function fromHash() {
    var h = location.hash.replace('#', '');
    var m = /^result=([RM])-(\d{1,2})$/.exec(h);
    if (m) {
      var t = m[1] === 'R' ? 'relation' : 'money', S = parseInt(m[2], 10);
      if (S >= 8 && S <= 40) { renderResult({ track: t, sum: S, band: band(S), bandLabel: BANDS[band(S)], index: index(S), group: null, code: m[1] + '-' + S }, true); return; }
    }
    if (h === 'relation' || h === 'money') selectTrack(h, { silent: true });
  }
  fromHash();
  window.addEventListener('hashchange', function () {
    if (/^#result=/.test(location.hash)) { fromHash(); return; }
    if (/^#(relation|money)$/.test(location.hash) && quiz.hidden) fromHash();
  });

  window.HMCheckup = { score: score, band: band, index: index, DATA: DATA, select: selectTrack };
})();
