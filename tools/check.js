#!/usr/bin/env node
/* 자동 검증 — Playwright(전역) + 로컬 정적 서버
   node tools/check.js [--port 8123] [--shots DIR] [--quick]
   1) 8페이지 × 4폭(400/768/1024/1440): 콘솔 에러 0, pageerror 0, 동일 출처 4xx 0, scrollWidth ≤ innerWidth, h1 1개, 위기 연락처(109·1577-0199) 존재
   2) 스크린샷(페이지별·폭별, index 는 fullPage)
   3) AI 코치 3트랙 완주(관계 트랙은 실제 30초 호흡, 나머지는 중단 경로) + 안전 키워드 위기 카드
   4) 자가진단 경계값(17/18, 28/29) + 6개 결과 문구 + UI 완주 + 미응답 차단
   5) 호흡 타이머 5라운드 = 30초 ±0.5초, 일시정지/중단, reduced-motion, CALM 완료 콜백
   6) 다크/라이트 토글 저장, 모바일 오버레이 메뉴(포커스 트랩·Esc), 폼 검증·honeypot·mailto 폴백 */
process.env.PLAYWRIGHT_BROWSERS_PATH = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i > -1 ? args[i + 1] : d; };
const PORT = parseInt(arg('--port', '8123'), 10);
const SHOTS = arg('--shots', path.resolve(__dirname, '../.shots'));
const QUICK = args.includes('--quick');
const ALLOW_EXTERNAL = args.includes('--external'); // 기본: 외부(Google Fonts) 요청 차단 → 네트워크 의존 없이 검증. --external 로 허용.
const ROOT = path.resolve(__dirname, '../site');
const BASE = `http://127.0.0.1:${PORT}`;
const PAGES = ['index.html', 'relation.html', 'money.html', 'ai-coach.html', 'checkup.html', 'about.html', 'contact.html', '404.html'];
const WIDTHS = [400, 768, 1024, 1440];

const results = { pages: [], coach: {}, checkup: {}, breath: {}, misc: {}, failures: [] };
const fail = (m) => { results.failures.push(m); console.log('  FAIL', m); };
const ok = (m) => console.log('  ok  ', m);
const assert = (c, m) => (c ? ok(m) : fail(m));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function blockExternal(ctx) {
  if (ALLOW_EXTERNAL) return;
  await ctx.route((url) => !url.href.startsWith(BASE), (route) => route.fulfill({ status: 200, contentType: 'text/css', body: '/* external blocked in test */' })); // 빈 CSS 로 응답 → 콘솔 에러 없이 네트워크 무관 검증
}
async function main() {
  fs.mkdirSync(SHOTS, { recursive: true });
  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
  await sleep(800);
  const browser = await chromium.launch();
  try {
    /* ---------- 1+2. pages × widths ---------- */
    for (const width of WIDTHS) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 }, locale: 'ko-KR', deviceScaleFactor: 1 });
      await blockExternal(ctx);
      for (const file of PAGES) {
        const page = await ctx.newPage();
        const errors = [], failed = [];
        page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
        page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
        page.on('response', (r) => { if (r.url().startsWith(BASE) && r.status() >= 400) failed.push(r.status() + ' ' + r.url()); });
        page.on('requestfailed', (r) => { if (r.url().startsWith(BASE)) failed.push('failed ' + r.url()); });
        await page.goto(`${BASE}/${file}`, { waitUntil: 'domcontentloaded' });
        await sleep(400);
        const m = await page.evaluate(() => ({
          sw: document.documentElement.scrollWidth, iw: window.innerWidth,
          h1: document.querySelectorAll('h1').length,
          crisis: /109/.test(document.body.innerText) && /1577-0199/.test(document.body.innerText),
          title: document.title, canonical: !!document.querySelector('link[rel=canonical]'), og: !!document.querySelector('meta[property="og:image"]')
        }));
        const rec = { file, width, errors, failed, ...m };
        results.pages.push(rec);
        const pass = errors.length === 0 && failed.length === 0 && m.sw <= m.iw && m.h1 === 1 && m.crisis;
        console.log(`${pass ? 'PASS' : 'FAIL'} ${file} @${width}  errors=${errors.length} failed=${failed.length} scroll=${m.sw}/${m.iw} h1=${m.h1} crisis=${m.crisis}`);
        if (!pass) fail(`${file}@${width}: ${JSON.stringify({ errors, failed, sw: m.sw, iw: m.iw, h1: m.h1, crisis: m.crisis })}`);
        await page.evaluate(() => document.querySelectorAll('[data-reveal]').forEach((e) => e.classList.add('is-visible'))); // 스크린샷용: 스크롤 리빌 강제 표시
        await sleep(650);
        await page.screenshot({ path: path.join(SHOTS, `${file.replace('.html', '')}-${width}.png`), fullPage: file === 'index.html' });
        await page.close();
      }
      await ctx.close();
    }

    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'ko-KR' });
    await blockExternal(ctx);
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });

    /* ---------- 5. breath timer ---------- */
    console.log('\n[breath]');
    await page.goto(`${BASE}/index.html`);
    await page.evaluate(() => { window.__b = {}; const host = document.createElement('div'); document.body.appendChild(host);
      window.__t = HMBreath.create(host, { rounds: 5, onComplete: () => { window.__b.end = performance.now(); } }); window.__b.start = performance.now(); window.__t.start(); });
    await sleep(1500);
    await page.evaluate(() => window.__t.pause());
    const stPaused = await page.evaluate(() => window.__t.getState());
    assert(stPaused === 'paused', 'pause works');
    await sleep(700);
    await page.evaluate(() => { window.__t.start(); });
    await page.waitForFunction(() => window.__b.end, null, { timeout: 40000 });
    const dur = await page.evaluate(() => (window.__b.end - window.__b.start) / 1000);
    results.breath.fiveRoundsSeconds = +(dur - 0.7).toFixed(3); // minus paused time
    assert(Math.abs(dur - 0.7 - 30) <= 0.5, `5 rounds = ${(dur - 0.7).toFixed(2)}s (30±0.5, pause excluded)`);
    const stopped = await page.evaluate(() => { const h = document.createElement('div'); document.body.appendChild(h); const t = HMBreath.create(h, { rounds: 5 }); t.start(); t.stop(); return t.getState() + '|' + h.querySelector('.breath__round').textContent; });
    assert(stopped === 'idle|0 / 5', 'stop resets to idle');
    // modal + Esc
    await page.click('#site-header [data-breath-open]');
    assert(await page.isVisible('.modal[role=dialog]'), 'breath modal opens from header');
    await page.keyboard.press('Escape');
    assert((await page.$('.modal')) === null, 'Esc closes breath modal');
    // reduced motion
    const rctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    await blockExternal(rctx);
    const rp = await rctx.newPage(); await rp.goto(`${BASE}/index.html`);
    const noScale = await rp.evaluate(async () => { const h = document.createElement('div'); document.body.appendChild(h); const t = HMBreath.create(h, { rounds: 5 }); t.start(); await new Promise((r) => setTimeout(r, 1500)); const tr = h.querySelector('.breath__circle').style.transform; const ring = h.querySelector('.ring-progress').getAttribute('stroke-dashoffset'); t.stop(); return { tr, ring }; });
    assert(!noScale.tr, 'reduced-motion: no scale transform (ring only)');
    await rctx.close();

    /* ---------- 4. checkup ---------- */
    console.log('\n[checkup]');
    await page.goto(`${BASE}/checkup.html`);
    const bands = await page.evaluate(() => {
      const mk = (S) => { const a = new Array(8).fill(Math.floor(S / 8)); let rem = S - a.reduce((x, y) => x + y, 0); for (let i = 0; rem > 0; i++, rem--) a[i]++; return a; };
      return [17, 18, 28, 29, 8, 40].map((S) => { const r = HMCheckup.score('relation', mk(S)); return { S, band: r.band, index: r.index }; });
    });
    results.checkup.bands = bands;
    const expect = { 17: 'stable', 18: 'caution', 28: 'caution', 29: 'train', 8: 'stable', 40: 'train' };
    for (const b of bands) assert(b.band === expect[b.S], `S=${b.S} → ${b.band} (index ${b.index})`);
    const tie = await page.evaluate(() => HMCheckup.score('relation', [5, 1, 1, 5, 5, 5, 1, 5]).group + '|' + HMCheckup.score('money', [1, 5, 5, 1, 1, 5, 1, 1]).group);
    assert(tie === '알아차림|선택', `group tie-break/order: ${tie}`);
    // 6 result copies via hash
    const heads = [];
    for (const code of ['R-10', 'R-20', 'R-35', 'M-10', 'M-20', 'M-35']) {
      await page.goto(`${BASE}/checkup.html#result=${code}`);
      heads.push(code + ': ' + (await page.textContent('[data-result-head]')));
    }
    results.checkup.heads = heads;
    assert(new Set(heads.map((h) => h.split(': ')[1])).size === 6, '6 distinct result headlines rendered');
    // UI run: money — skip q1 via 다음, answer q2..q8 → finish disabled + missing hint; then answer q1 → S=32 → train
    await page.goto(`${BASE}/checkup.html`);
    await page.click('[data-track="money"]');
    await page.waitForSelector('[data-quiz]:not([hidden])');
    await page.click('.qcard:not([hidden]) .qnav button:nth-child(2)'); // 다음 (q1 unanswered)
    for (let i = 1; i < 8; i++) { await page.check(`input[name="q${i}"][value="4"]`, { force: true }); await sleep(260); }
    const finDisabled = await page.evaluate(() => document.querySelector('[data-finish]').disabled);
    assert(finDisabled, 'result button disabled while a question is unanswered');
    assert((await page.textContent('[data-qerror]')).includes('1번 문항'), 'missing-question hint names q1');
    await page.click('[data-jump]');
    assert(await page.isVisible('input[name="q0"][value="4"]'), 'jump moves to the unanswered question');
    await page.check('input[name="q0"][value="4"]', { force: true }); await sleep(300);
    for (let i = 1; i < 7; i++) { await page.click('.qcard:not([hidden]) .qnav button:nth-child(2)'); await sleep(60); }
    await page.click('[data-finish]');
    const head = await page.textContent('[data-result-head]');
    assert(head.includes('손실이 다음 행동을 결정'), `UI run money S=32 → train: ${head}`);
    assert((await page.evaluate(() => location.hash)) === '#result=M-32', 'hash #result=M-32');
    assert((await page.textContent('[data-result]')).includes('1336'), 'money train shows 1336');
    // hash preselect
    await page.goto(`${BASE}/checkup.html#relation`);
    assert(await page.isVisible('[data-quiz]'), '#relation preselects track');

    /* ---------- 3. coach ---------- */
    console.log('\n[coach]');
    async function pick(sel) { await page.waitForSelector(sel, { timeout: 15000 }); await page.click(sel); await sleep(150); }
    async function runTrack(track, realBreath) {
      await page.goto(`${BASE}/ai-coach.html${track === 'general' ? '' : '?track=' + track}`);
      if (track === 'general') await pick('.chat__block [data-value="general"]');
      await pick('.chat__block .chip[data-opt="0"]');            // action
      await pick('.chat__block [data-cta]');                    // 다음: 감정 찾기
      await pick('.chat__block [data-emotion="분노"]'); await pick('.chat__block [data-emotion="조급함"]');
      await page.waitForSelector('.chat__block [data-cta]:not([disabled])');
      await pick('.chat__block [data-cta]');                    // 감정 확인
      await pick('.chat__block .chip[data-opt="0"]');            // need
      await pick('.chat__block [data-cta]');                    // 다음: 마음 낮추기
      await pick('.chat__block [data-breath="start"]');
      if (realBreath) {
        const t0 = Date.now();
        await page.waitForSelector('.chat__block .chip[data-value="EFT 문장으로"]', { timeout: 40000 });
        results.coach.calmCallbackSeconds = +((Date.now() - t0) / 1000).toFixed(2);
        assert(Math.abs(results.coach.calmCallbackSeconds - 30) < 1.5, `CALM onComplete opened next bubble after ${results.coach.calmCallbackSeconds}s`);
      } else {
        await sleep(800); await pick('.chat__block [data-breath="stop"]');
      }
      await pick('.chat__block .chip[data-value="EFT 문장으로"]');
      await pick('.chat__block [data-cta]');                    // 다음: 세기 다시 재기
      await page.waitForSelector('#coach-intensity-2');
      await page.evaluate(() => { const s = document.getElementById('coach-intensity-2'); s.value = '4'; s.dispatchEvent(new Event('input', { bubbles: true })); });
      await pick('.chat__block [data-cta]');                    // 확인
      await pick('.chat__block [data-cta]');                    // 다음: 행동 선택
      await pick('.chat__block .chip[data-opt="1"]');            // choice with detail (relation nvc / money limits / general plain)
      const hasDetailCta = await page.$('.chat__block [data-cta]');
      if (hasDetailCta) await pick('.chat__block [data-cta]');
      await page.waitForSelector('[data-summary]', { timeout: 15000 });
      const txt = await page.textContent('[data-summary]');
      assert(txt.includes('7 → 4') && txt.includes('분노'), `${track}: summary card (7 → 4, 분노)`);
      const closing = await page.evaluate(() => [...document.querySelectorAll('.bubble--bot')].pop().textContent);
      assert(closing.includes('이것이 마음브레이크입니다'), `${track}: closing line`);
      return txt;
    }
    results.coach.relation = !!(await runTrack('relation', !QUICK));
    results.coach.money = !!(await runTrack('money', false));
    results.coach.general = !!(await runTrack('general', false));
    // copy button
    await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.click('[data-summary] button');
    await sleep(200);
    assert((await page.textContent('[data-summary] button')).includes('복사됨'), 'summary copy feedback');
    // safety keyword
    await page.goto(`${BASE}/ai-coach.html?track=relation`);
    await pick('.chat__block .chip[data-opt="0"]'); await pick('.chat__block [data-cta]');
    await pick('.chat__block [data-emotion="무력감"]');
    await page.fill('#coach-free', '다 끝내고 싶어요');
    await pick('.chat__block [data-cta]');
    await page.waitForSelector('.safety-card', { timeout: 5000 });
    const safety = await page.evaluate(() => ({ text: document.querySelector('.safety-card').textContent, tel: [...document.querySelectorAll('.safety-card a[href^="tel:"]')].map((a) => a.getAttribute('href')), blocks: [...document.querySelectorAll('.chat__block')].every((b) => b.hidden) }));
    assert(safety.text.includes('사람과 연결되는 것이 먼저') && safety.tel.includes('tel:109') && safety.tel.includes('tel:1577-0199'), 'safety card with tel links on keyword');
    assert(safety.text.includes('1366'), 'relation track safety includes 1366');
    await sleep(2500);
    assert(await page.evaluate(() => [...document.querySelectorAll('.chat__block')].every((b) => b.hidden)), 'flow paused until 계속 진행하기');
    await page.click('[data-safety-continue]');
    assert(await page.evaluate(() => [...document.querySelectorAll('.chat__block')].some((b) => !b.hidden)), '계속 진행하기 resumes');
    // combo (무력감+두려움) trigger
    await page.goto(`${BASE}/ai-coach.html?track=money`);
    await pick('.chat__block .chip[data-opt="0"]'); await pick('.chat__block [data-cta]');
    await pick('.chat__block [data-emotion="무력감"]'); await pick('.chat__block [data-emotion="두려움"]'); await pick('.chat__block [data-cta]');
    await page.waitForSelector('.safety-card', { timeout: 5000 });
    assert((await page.textContent('.safety-card')).includes('1336'), 'money track safety includes 1336 (emotion combo trigger)');

    /* ---------- 6. misc: theme, mobile nav, forms ---------- */
    console.log('\n[misc]');
    await page.goto(`${BASE}/index.html`);
    await page.click('#site-header .theme-toggle');
    const theme = await page.evaluate(() => [document.documentElement.getAttribute('data-theme'), localStorage.getItem('hm-theme')]);
    assert(theme[0] === 'dark' && theme[1] === 'dark', 'theme toggle → dark, stored');
    await page.reload();
    assert((await page.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'dark', 'theme persists across reload');
    await page.evaluate(() => document.querySelectorAll('[data-reveal]').forEach((e) => e.classList.add('is-visible')));
    await sleep(650);
    await page.screenshot({ path: path.join(SHOTS, 'index-1280-dark.png'), fullPage: true });
    await page.evaluate(() => localStorage.removeItem('hm-theme'));
    const mctx = await browser.newContext({ viewport: { width: 400, height: 800 } });
    await blockExternal(mctx);
    const mp = await mctx.newPage(); await mp.goto(`${BASE}/index.html`);
    await mp.click('.nav-toggle');
    assert(await mp.isVisible('#nav-overlay'), 'mobile overlay opens');
    const focusIn = await mp.evaluate(() => document.getElementById('nav-overlay').contains(document.activeElement));
    assert(focusIn, 'focus moved into overlay');
    for (let i = 0; i < 14; i++) await mp.keyboard.press('Tab');
    assert(await mp.evaluate(() => document.getElementById('nav-overlay').contains(document.activeElement)), 'focus trapped after 14 tabs');
    await mp.screenshot({ path: path.join(SHOTS, 'index-400-menu.png') });
    await mp.keyboard.press('Escape');
    assert(await mp.evaluate(() => document.getElementById('nav-overlay').hidden && document.activeElement.classList.contains('nav-toggle')), 'Esc closes overlay and restores focus');
    await mctx.close();
    // forms
    await page.goto(`${BASE}/contact.html?result=R-23#counsel`);
    assert((await page.inputValue('#counsel-result')) === 'R-23', 'checkup result auto-filled');
    await page.click('#counsel button[type=submit]');
    const errCount = await page.evaluate(() => document.querySelectorAll('#counsel .error:not([hidden])').length);
    assert(errCount >= 4, `inline errors on empty submit (${errCount})`);
    await page.fill('#c-name', '테스트'); await page.fill('#c-tel', '01012345678');
    await page.click('#counsel button[type=submit]');
    assert((await page.getAttribute('#c-tel', 'aria-invalid')) === 'true', 'tel pattern rejects 01012345678');
    await page.fill('#c-tel', '010-1234-5678');
    await page.check('input[name="track"][value="관계 마음근력"]', { force: true }); await page.check('input[name="target"][value="본인"]', { force: true }); await page.check('#counsel input[name="consent"]', { force: true });
    await page.click('#counsel button[type=submit]');
    const st = await page.textContent('#counsel .form__status');
    assert(st.includes('전송 경로가 아직 설정되지 않았습니다') && st.includes('R-23'), 'no-endpoint fallback shows guidance with copied content');
    await page.fill('#c-website', 'spam');
    await page.click('#counsel button[type=submit]');
    assert((await page.textContent('#counsel .form__status')).includes('신청이 접수되었습니다'), 'honeypot: silent fake success');
    await page.goto(`${BASE}/contact.html#lecture`);
    assert(await page.isVisible('#lecture') && !(await page.isVisible('#counsel')), '#lecture hash opens lecture tab');
    await page.screenshot({ path: path.join(SHOTS, 'contact-1280-lecture.png'), fullPage: true });

    results.misc.pageErrorsDuringFlows = errs;
    assert(errs.length === 0, `no console/page errors during flows (${errs.length})`);
    await ctx.close();
  } finally {
    await browser.close();
    server.kill();
  }
  fs.writeFileSync(path.join(SHOTS, 'check-results.json'), JSON.stringify(results, null, 2));
  const pagePass = results.pages.filter((p) => p.errors.length === 0 && p.failed.length === 0 && p.sw <= p.iw && p.h1 === 1 && p.crisis).length;
  console.log(`\nSUMMARY: pages ${pagePass}/${results.pages.length} pass · failures ${results.failures.length} · breath ${results.breath.fiveRoundsSeconds}s · coach calm cb ${results.coach.calmCallbackSeconds}s`);
  process.exit(results.failures.length ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
