/* Contact forms (01-plan §6): tabs (#counsel / #lecture), validation, honeypot,
   endpoint POST when data-endpoint is set, otherwise mailto fallback (or guidance when email is still a placeholder),
   checkup result auto-fill (?result=R-23 or sessionStorage 'hm-checkup-result'). */
(function () {
  var tabs = document.querySelector('[data-tabs]');
  if (tabs) {
    var buttons = tabs.querySelectorAll('[role="tab"]');
    var panels = document.querySelectorAll('[role="tabpanel"]');
    function activate(id, focus) {
      Array.prototype.forEach.call(buttons, function (b) {
        var on = b.getAttribute('aria-controls') === id;
        b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
        if (on && focus) b.focus();
      });
      Array.prototype.forEach.call(panels, function (p) { p.hidden = p.id !== id; });
    }
    Array.prototype.forEach.call(buttons, function (b, i) {
      b.addEventListener('click', function () { activate(b.getAttribute('aria-controls'), false); history.replaceState(null, '', '#' + b.getAttribute('aria-controls')); });
      b.addEventListener('keydown', function (e) {
        var j = i;
        if (e.key === 'ArrowRight') j = (i + 1) % buttons.length; else if (e.key === 'ArrowLeft') j = (i - 1 + buttons.length) % buttons.length; else return;
        e.preventDefault(); activate(buttons[j].getAttribute('aria-controls'), true);
      });
    });
    function fromHash() { var h = location.hash.replace('#', ''); activate(h === 'lecture' ? 'lecture' : 'counsel', false); }
    fromHash(); window.addEventListener('hashchange', fromHash);
  }

  /* Checkup result auto-fill */
  var q = new URLSearchParams(location.search);
  var code = q.get('result');
  if (!code) { try { code = sessionStorage.getItem('hm-checkup-result'); } catch (e) {} }
  var resField = document.getElementById('counsel-result');
  if (resField && code && /^[RM]-\d{1,2}$/.test(code)) { resField.value = code; var w = resField.closest('.form__row'); if (w) w.hidden = false; }

  var TEL = /^01[016789]-\d{3,4}-\d{4}$/;
  function setError(field, msg) {
    var row = field.closest('.form__row, fieldset') || field.parentNode;
    var err = row.querySelector('.error');
    if (!err) { err = document.createElement('p'); err.className = 'error'; err.setAttribute('aria-live', 'polite'); row.appendChild(err); }
    err.textContent = msg; err.hidden = !msg;
    if (field.tagName === 'FIELDSET') { if (msg) field.setAttribute('aria-invalid', 'true'); else field.removeAttribute('aria-invalid'); }
    else { if (msg) { field.setAttribute('aria-invalid', 'true'); field.setAttribute('aria-describedby', err.id || (err.id = field.id + '-err')); } else { field.removeAttribute('aria-invalid'); } }
  }
  function validate(form) {
    var ok = true, first = null;
    Array.prototype.forEach.call(form.querySelectorAll('[data-required]'), function (f) {
      var msg = '';
      if (f.tagName === 'FIELDSET') {
        if (!f.querySelector('input:checked')) msg = '하나를 선택해 주세요.';
      } else if (f.type === 'checkbox') {
        if (!f.checked) msg = '동의가 필요합니다.';
      } else if (!f.value.trim()) msg = '필수 항목입니다.';
      else if (f.type === 'tel' && !TEL.test(f.value.trim())) msg = '010-0000-0000 형식으로 입력해 주세요.';
      else if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value.trim())) msg = '이메일 형식을 확인해 주세요.';
      setError(f, msg);
      if (msg) { ok = false; if (!first) first = f; }
    });
    var optEmail = form.querySelector('input[type="email"]:not([data-required])');
    if (optEmail && optEmail.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(optEmail.value.trim())) { setError(optEmail, '이메일 형식을 확인해 주세요.'); ok = false; if (!first) first = optEmail; }
    if (first) { var target = first.tagName === 'FIELDSET' ? first.querySelector('input') : first; target.focus(); }
    return ok;
  }
  function serialize(form) {
    var out = {}, fd = new FormData(form);
    fd.forEach(function (v, k) { if (k === 'website') return; if (out[k]) out[k] = [].concat(out[k], v); else out[k] = v; });
    return out;
  }
  function toText(form, data) {
    var lines = [];
    Object.keys(data).forEach(function (k) {
      var label = form.querySelector('[name="' + k + '"]');
      var lab = label && label.closest('.form__row, fieldset');
      var name = lab ? (lab.querySelector('label, legend') || {}).textContent || k : k;
      lines.push(name.replace(/\*|필수/g, '').trim() + ': ' + [].concat(data[k]).join(', '));
    });
    return lines.join('\n');
  }
  function status(form, kind, html) {
    var box = form.parentNode.querySelector('.form__status');
    if (!box) { box = document.createElement('div'); box.className = 'form__status'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); form.parentNode.insertBefore(box, form.nextSibling); }
    box.className = 'form__status form__status--' + kind; box.innerHTML = html; box.hidden = false; box.tabIndex = -1; box.focus();
  }

  Array.prototype.forEach.call(document.querySelectorAll('form[data-form]'), function (form) {
    form.setAttribute('novalidate', '');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var hp = form.querySelector('input[name="website"]');
      if (hp && hp.value) { status(form, 'ok', '<p>' + form.getAttribute('data-success') + '</p>'); form.reset(); return; } // honeypot: silent
      if (!validate(form)) return;
      var data = serialize(form);
      var endpoint = (form.getAttribute('data-endpoint') || '').trim();
      var mailto = (form.getAttribute('data-mailto') || '').trim();
      var subject = form.getAttribute('data-subject') || '문의';
      var success = form.getAttribute('data-success') || '접수되었습니다.';
      var submit = form.querySelector('[type="submit"]');
      if (endpoint) {
        submit.disabled = true;
        fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(data) })
          .then(function (r) { if (!r.ok) throw new Error(r.status); status(form, 'ok', '<p>' + success + '</p>'); form.reset(); })
          .catch(function () { status(form, 'warn', '<p>전송에 실패했습니다. 잠시 후 다시 시도하거나 아래 연락처로 직접 문의해 주세요.</p>'); })
          .then(function () { submit.disabled = false; });
        return;
      }
      var body = toText(form, data);
      if (mailto && mailto.indexOf('[교체') === -1 && mailto.indexOf('@') > 0) {
        location.href = 'mailto:' + mailto + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        status(form, 'ok', '<p>메일 앱이 열립니다. 전송 후 아래 안내를 확인해 주세요.</p><p>' + success + '</p>');
        return;
      }
      // Neither endpoint nor a real email is configured yet: show guidance + copy button instead of an empty mailto:
      status(form, 'warn',
        '<p><strong>폼 전송 경로가 아직 설정되지 않았습니다.</strong> <span class="replace">[교체: 폼 엔드포인트 또는 이메일]</span></p>' +
        '<p class="small">아래 내용을 복사해 <span class="replace">[교체: 이메일]</span>로 보내 주시면 접수됩니다.</p>' +
        '<pre class="small" style="white-space:pre-wrap;font-family:var(--font-mono);font-size:12px;border:1px solid var(--line);padding:12px;border-radius:4px;background:var(--bg-2)"></pre>' +
        '<button type="button" class="btn btn--secondary btn--small" data-copy>내용 복사</button>');
      var box = form.parentNode.querySelector('.form__status');
      box.querySelector('pre').textContent = body;
      box.querySelector('[data-copy]').addEventListener('click', function () {
        var b = this; var done = function () { b.textContent = '복사됨'; setTimeout(function () { b.textContent = '내용 복사'; }, 1500); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(body).then(done, done); else done();
      });
    });
    form.addEventListener('input', function (e) { var f = e.target; if (f.getAttribute && f.hasAttribute('data-required') && f.getAttribute('aria-invalid')) setError(f, ''); });
    form.addEventListener('change', function (e) { var fs = e.target.closest && e.target.closest('fieldset[data-required]'); if (fs && fs.getAttribute('aria-invalid')) setError(fs, ''); });
  });
})();
