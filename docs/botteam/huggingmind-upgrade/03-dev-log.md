# 03. 개발 로그 — C봇(개발)

작성: C봇 · 2026-09-11 · 근거: `00-brief.md`, `01-plan.md`, `02-design.md`
브랜치: `claude/peaceful-darwin-73qyba` (커밋은 오케스트레이터가 수행)

---

## 1. 구현 요약

- **정적 사이트 9페이지** (`site/`): index · relation · money · ai-coach · checkup · about · contact · 404 · privacy. 순수 HTML/CSS/JS(ES2020), 빌드 도구·프레임워크·npm 없음. 외부 의존성은 Google Fonts 링크 1개.
- **디자인 시스템**: 02-design.md 토큰을 그대로 `tokens.css` CSS 변수로 이식(라이트 `:root` / 다크 `prefers-color-scheme` + `[data-theme]`). "Warm Editorial" — 세리프 디스플레이 헤드라인, 모노 오버라인·인덱스 라벨(`01 — 문제`), 1px 라인, 4px 카드, 필 버튼, 종이 노이즈(히어로, opacity .04/.06), 호흡 원 라디얼. 그라데이션 히어로·좌측 컬러바·아이콘 나열·이모지 없음. 인라인 SVG stroke 1.5px 아이콘만.
- **공통 컴포넌트**: 스티키 헤더(76→60px 축소, blur), 모바일 전체화면 오버레이(포커스 트랩·Esc·포커스 복귀), 스킵 링크, `aria-current`, 푸터 4열 + 위기 안내 바(109·1577-0199·1336·1366·112/119 tel 링크), 다크/라이트 토글(`hm-theme`, FOUC 방지 인라인 스니펫), 스크롤 리빌(IO threshold .15, reduced-motion 즉시 표시), 히어로 120ms 스태거.
- **6초 호흡 타이머** `breath.js`: 3초 들숨/3초 날숨, 5·10·15 라운드, 인라인/모달 두 모드, 시작·일시정지·중단·한 번 더·닫기, WebAudio 사인파 200ms(기본 off), 완료 시 `navigator.vibrate(30)`, `role="timer"` + 단계 텍스트만 `aria-live="polite"`, Space/Esc, reduced-motion 시 스케일 대신 진행 링, `onComplete` 콜백. 타이밍은 `performance.now()` 기준(일시정지 시간 제외)으로 5라운드 = 30.0초.
- **AI 마음브레이크 코치 v1** `coach.js` + `coach-data.js`: 01-plan §5-a 스크립트를 데이터로 분리한 상태머신. 진입→STOP→FEEL(감정 칩 최대 3·강도 슬라이더·선택 자유입력)→CALM(인라인 호흡 5라운드 → 한 번 더/EFT → EFT 문장 → 재측정 → 낮아짐/그대로 분기)→CHOOSE(트랙별 행동 + 예시 문장/비폭력대화 4칸/손절선 입력/30초 3문항 점검 서브 템플릿)→마무리 발화 + 요약 카드(복사·다시 시작·자가진단·상담 신청, sessionStorage). `?track=relation|money` 지원, 3트랙(relation/money/general) 완주, 4점 스텝퍼, 400~700ms 타이핑 인디케이터. 안전: 키워드 6종 매칭·재측정 9 이상 2회 연속·무력감+두려움 동시 선택 → 위기 카드(109/1577-0199 tel 버튼, 트랙별 1336/1366 병기, 카드 표시 중 흐름 일시정지, `계속 진행하기` 소형 링크).
- **AI 코치 v2** `functions/coach.js`: `claude-api` 스킬 확인 후 작성. `@anthropic-ai/sdk`, 모델 `claude-opus-5`, adaptive thinking, `output_config.effort:"low"`, 구조화 출력 `output_config.format:{type:"json_schema"}` → `{say, options?, safety_flag}`, `max_tokens 1024`, `timeout 8000ms`(SDK ms 단위)·`maxRetries 0`, 키워드 사전 검사, 입력 500자, IP당 분당 10회 인메모리 레이트리밋, `stop_reason:"refusal"` 처리, `fallbacks:"default"`(+`server-side-fallback-2026-07-01` 베타 헤더) 옵션 포함. Netlify `handler` export + Vercel 어댑터 주석. 클라이언트 `COACH_ENDPOINT`(기본 `''`) 설정 시 v2 호출, 실패/타임아웃 시 v1 폴백 + "오프라인 가이드로 계속합니다" 1회 표시, 세션당 12회 제한.
- **자가진단** `checkup.js`: R1~R8 / M1~M8 원문, 1문항씩 카드 + 2px 진행 바 + 자동 진행, 채점 S(8~40) → 안정 8~17 / 주의 18~28 / 훈련 필요 29~40, 지수 `round((40-S)/32*100)`, 반원 SVG 게이지(3구간 색 + 12px 호), 보조 묶음(평균 기준 최고, 동점 시 알아차림→안정→선택), 6개 결과 문구 원문, 머니 훈련 필요 시 1336 병기, 미응답 시 버튼 비활성 + 미응답 문항 안내·이동, `#relation/#money` 프리셋, `#result=R-23` 공유(개별 응답 미포함), 면책 문구. `window.HMCheckup.score()` 순수 함수 노출(테스트용).
- **폼** `forms.js`: 01-plan §6 필드 그대로 2개 폼(탭 `#counsel`/`#lecture`, 화살표 키 이동), 필수 검증·인라인 오류·`aria-invalid`, 전화 `01X-XXXX-XXXX` 패턴, honeypot(`website`, 채워지면 조용히 성공 표시), `data-endpoint` 있으면 JSON POST, 없으면 `data-mailto` → mailto, 둘 다 없으면(현재) "전송 경로 미설정" 안내 + 내용 복사 버튼, 자가진단 결과 자동 채움(`?result=R-23` 또는 sessionStorage).
- **메타/SEO**: 페이지별 title/description/canonical(`https://huggingmind.kr/…`)/OG(og:image = `/assets/img/og-image.png` 1200×630)/twitter card/favicon(SVG + PNG 192/512)/theme-color(라이트·다크)/JSON-LD `@graph`(Organization BLISS MIND FIT, Person 나영채, WebPage, about.html에 Book 『상처를 넘어설 용기』 — 연락처 등 없는 값은 미포함). `sitemap.xml`(7 URL) · `robots.txt`(404/privacy 제외). 404/privacy는 `noindex`.
- **이미지**: `favicon.svg`(초록 원 + 1px 흰 세로 틈), `og-image.svg` → `tools/make-images.js`(Playwright)로 `og-image.png`, `favicon-192/512.png` 생성. 인물·저서 자리는 3:4 / 2:3 플레이스홀더(모노 라벨 `PORTRAIT / 3:4`, `[교체:]` 노출).
- **S9 후기 섹션**: index.html에 HTML 주석으로만 존재, 렌더링 안 함(가짜 후기·로고 없음).

## 2. 파일 목록

```
site/
  index.html relation.html money.html ai-coach.html checkup.html about.html contact.html 404.html privacy.html
  README.md sitemap.xml robots.txt
  assets/css/tokens.css base.css components.css pages.css
  assets/js/theme.js nav.js reveal.js breath.js coach-data.js coach.js checkup.js forms.js index.js
  assets/img/favicon.svg favicon-192.png favicon-512.png og-image.svg og-image.png
functions/coach.js  functions/.env.example
tools/check.js      (Playwright 자동 검증)   tools/make-images.js (SVG→PNG)
docs/botteam/huggingmind-upgrade/03-dev-log.md (이 문서)
```

## 3. 검증 결과 (`node tools/check.js`, Chromium/Playwright, 로컬 `python3 -m http.server`)

외부(Google Fonts) 요청은 테스트에서 빈 CSS로 대체해 네트워크 무관하게 검증(`--external` 플래그로 허용 가능). 스크린샷: `scratchpad/shots/` 에 8페이지 × 4폭(index 는 fullPage) + `index-1280-dark.png`, `index-400-menu.png`, `contact-1280-lecture.png`.

| 항목 | 결과 |
|---|---|
| 8페이지 × 400/768/1024/1440 | **32/32 PASS** — 콘솔 에러 0, pageerror 0, 동일 출처 4xx 0, `scrollWidth ≤ innerWidth` 전부 충족, h1 정확히 1개, 위기 연락처(109·1577-0199) 본문 존재 |
| 호흡 타이머 5라운드 | **30.02초**(일시정지 0.7초 제외, 허용 ±0.5) · 일시정지/재개/중단 정상 · 헤더 모달 열기·Esc 닫기 · reduced-motion에서 `transform` 미적용(링만) |
| 자가진단 경계값 | S=17→안정(지수 72), 18→주의(69), 28→주의(38), 29→훈련 필요(34), 8→안정(100), 40→훈련 필요(0) — 모두 정확. 묶음 동점 우선순위(알아차림→안정→선택) 확인 |
| 자가진단 UI | 6개 결과 헤드라인 전부 렌더(`#result=` 해시), 미응답 시 결과 버튼 비활성 + "1번 문항 응답 없음" 안내·이동, 머니 8×4=32 → 훈련 필요 + 1336 병기, 해시 `#result=M-32`, `#relation` 프리셋 |
| AI 코치 | 관계(실제 30초 호흡, CALM `onComplete` → 다음 말풍선 30.57초) · 머니 · 일반 3트랙 완주, 요약 카드(7 → 4, 감정) 및 마무리 발화, 요약 복사 피드백. 키워드("끝내고 싶") → 위기 카드 즉시(tel:109·1577-0199, 관계 트랙 1366), 흐름 일시정지 → `계속 진행하기` 재개. 무력감+두려움 동시 선택 → 위기 카드(머니 트랙 1336) |
| 테마 | 토글 → `data-theme="dark"` + localStorage 저장, 새로고침 후 유지 |
| 모바일 메뉴(400px) | 오버레이 열림, 포커스 이동, Tab 14회 후에도 포커스 트랩 유지, Esc 닫기 + 햄버거로 포커스 복귀 |
| 폼 | 빈 제출 시 인라인 오류 5개, `01012345678` 거부·`010-1234-5678` 통과, 엔드포인트 미설정 안내 + 복사(R-23 자동 채움 포함), honeypot 조용한 성공, `#lecture` 탭 진입 |
| 흐름 중 콘솔/페이지 에러 | 0 |

## 4. 기획/디자인 문서와 다르게 결정한 것과 이유

1. **general 트랙의 STOP 발화·행동 선택지·욕구 선택지**: 기획서에 관계/머니 문구만 있어 general 은 중립 문구("무엇이든 — 아직 하지 않아도 괜찮습니다")와 축약 선택지(행동 4개, 욕구 4개: 존중/안전/되돌리기/통제감)를 추가. CHOOSE 는 기획서 공통 세트 그대로.
2. **호흡 중단(中斷) 시 CALM 흐름**: 기획서는 완료 콜백만 정의. 중단하면 "괜찮아요. 준비되면 언제든 다시 할 수 있어요." 후 동일하게 `[한 번 더 호흡] [EFT 문장으로]` 분기로 이어지도록 해 막다른 길을 없앰.
3. **위기 카드 표시 시 흐름 일시정지**: "이 대화는 여기서 멈추고"를 실제 동작으로 — 카드 아래 선택지를 숨기고 `계속 진행하기` 소형 링크로만 재개.
4. **자가진단 공유 결과(`#result=R-23`)의 '{묶음}'**: 해시에 개별 응답이 없어 묶음을 계산할 수 없으므로 주의 구간 본문의 '{묶음}'을 "먼저 훈련할 단계부터"로 대체하고 "공유된 결과에는 개별 응답이 포함되지 않아…" 안내 1줄 추가.
5. **보조 묶음 판정 기준을 '평균'으로**: 묶음 크기가 2·3으로 다르므로 합계 비교는 큰 묶음이 유리해 평균 사용(동점 규칙은 그대로).
6. **미응답 안내**: 1문항씩 진행 구조에서 "스크롤" 대신 마지막 카드에서 미응답 문항 번호 + "해당 문항으로 이동" 버튼으로 구현.
7. **관계 페이지 사례 탭 스크립트**: `forms.js` 가 contact 전용이라 relation.html 에 8줄 인라인 탭 스크립트 사용(파일 수 최소화).
8. **폼 mailto 폴백**: 이메일이 `[교체: 이메일]` 상태라 빈 `mailto:` 를 열지 않고, 안내 메시지 + 입력 내용 복사 버튼을 제공(지시대로). 실제 이메일을 `data-mailto` 에 넣으면 mailto 동작.
9. **v2 함수의 `fallbacks:"default"`**: 기획서에 없는 옵션이나 `claude-api` 스킬 권고(안전 분류기 거절 시 서버측 폴백)에 따라 포함, 주석으로 제거 방법 명시.
10. **다크 모드 최종 CTA 배경**: 라이트에서는 `--ink` 반전 블록, 다크에서는 `--bg-2` 로 전환(잉크 반전이 다크에서 밝은 블록이 되어 어색함).
11. **컨테이너 좌우 패딩 최소 20px 유지**: 400px 에서 가로 스크롤 0 확인.

## 5. 남은 이슈

- **Google Fonts**: 세션 네트워크 정책상 폰트 로드가 불안정해 스크린샷은 시스템 폰트(세리프 대체 포함)로 렌더됨. 실제 배포 환경에서 Noto Serif KR/Noto Sans KR/IBM Plex Mono 로드 시 헤드라인 인상이 달라지므로 D봇 QA 시 실기기 확인 필요. `og-image.png` 도 같은 이유로 세리프 미적용 상태 → 폰트 로드 환경에서 `node tools/make-images.js` 재실행 권장.
- **Lighthouse 접근성/대비 수치**: 이 환경에 Lighthouse 미설치. 토큰 대비는 설계 기준(본문 ink/bg 라이트 ≈ 14:1, 다크 ≈ 13:1, ink-3 캡션 라이트 ≈ 3.9:1 — 12~13px 캡션·플레이스홀더에만 사용)이며 D봇 측정 필요.
- **`[교체:]` 항목 미반영 상태**로 배포하면 화면에 그대로 노출됨(의도). 폼은 엔드포인트/이메일 설정 전까지 "미설정 안내" 모드.
- **v2 함수는 미배포·미실행**(키 없음). SDK 시그니처는 `claude-api` 스킬 문서 기준으로 작성했고 실제 호출 검증은 배포 후 필요.
- **위기 연락처 최신 여부**(109·1577-0199·1336·1366)는 QA 항목(기획서 §5-a).
- **`tools/check.js` 실행 시간 ≈ 4~5분**(실제 30초 호흡 2회 포함). `--quick` 으로 코치 CALM 실측을 생략 가능.
- 관계/머니 서브페이지 히어로 우측 흐름도는 ≤900px 에서 가로 줄바꿈 배치로 전환(세로 스택 대비 공간 절약) — 스크린샷 재확인 완료.

## 6. `[교체:]` 지점 전체 목록

| 파일 | 항목 | 비고 |
|---|---|---|
| index.html, about.html | 나영채 코치 프로필 사진, 3:4 | `.ph--portrait` → `<img>` |
| index.html, about.html | 『상처를 넘어설 용기』 표지 이미지 (2:3) | `.ph--book` → `<img>` |
| about.html | 출판사 소개문 · 구매 링크 · 연도별 경력, 자격(3행) · 강의 기관/주제 목록 | |
| index.html(S8), relation.html(3카드), money.html(1카드) | 대면·화상 여부 · 회기 · 가격 또는 '문의' | 프로그램 카드 |
| index.html(S9, 주석) | 실제 수강 후기 1~3(동의 받은 것) · 강의 기관 로고/명칭 | 자료 있을 때만 주석 해제 |
| contact.html | 이메일 · 전화 · 운영시간 · 위치/화상 여부 · 제공 형식 확정 · 예산 구간 · 소개서 PDF · 회신 소요 시간(2폼) · 엔드포인트(`data-endpoint`/`data-mailto`) | |
| 전 페이지 푸터 | 이메일 · 전화 · 상호/대표/사업자등록번호/주소 | assemble 시 공통 |
| privacy.html | 사업자 정보/보호책임자 · 보유 기간 · 위탁 내역 · v2 처리 위탁 · 요청 창구 이메일 · 시행일 | |
| assets/js/checkup.js | 추천 프로그램 `[교체: 회기]`(주의·훈련 필요 4곳) | 결과 문구 원문에 포함 |
| assets/js/forms.js | 미설정 안내 문구 내 `[교체: 폼 엔드포인트 또는 이메일]`, `[교체: 이메일]` | 엔드포인트 설정 시 자동 소멸 |
| assets/js/coach.js | `COACH_ENDPOINT` (v2 활성화 시) | |
| assets/img | og-image.png 재생성(폰트 로드 환경) | 선택 |

## 7. 5줄 요약

1. `site/` 에 9페이지 정적 사이트(순수 HTML/CSS/JS, 02-design 토큰 그대로)와 공통 컴포넌트(헤더/오버레이/푸터/위기 바/테마/리빌/호흡 모달)를 구현했다.
2. AI 코치 v1(3트랙 상태머신·안전 카드·요약 카드), 자가진단(채점·게이지·해시 공유), 6초 호흡(30.0초 정확), 폼 2종(검증·honeypot·폴백)을 01-plan 스펙대로 완성했다.
3. v2 서버리스 함수(`functions/coach.js`, claude-opus-5 + 구조화 출력 + 레이트리밋/타임아웃)와 `.env.example`, 클라이언트 폴백을 준비했다(배포는 사용자 확인 후).
4. `tools/check.js`(Playwright)로 32/32 페이지×폭 통과, 콘솔 에러 0, 가로 스크롤 0, h1 1개, 위기 연락처 존재, 코치 3트랙 완주·경계값·30초 타이머·접근성 흐름을 자동 검증했다.
5. 브리프에 없는 사실은 모두 `[교체:]` 로 노출(목록 §6), 후기 섹션은 주석 처리, Google Fonts/Lighthouse 실측은 남은 QA 항목이다.

---

## Round 2 — QA(04-qa.md) · SEO(06-seo.md) 반영

작성: C봇 · 2026-09-11 · 근거: `04-qa.md`(Q-01~Q-29), `06-seo.md`(§4, §5, §6 P0/P1/P2, §7-1 FAQ). E봇이 커밋한 `<head>`/robots/sitemap 은 유지하고 본문·CSS·JS 만 수정(어셈블러 재실행 안 함, HTML 은 직접 패치). 커밋 없음.

### R2-1. 이슈별 처리 결과

| 이슈 | 심각도 | 처리 | 내용 |
|---|---|---|---|
| Q-01 | Major | **수정** | `coach.js`: 세션 토큰 `seq` 도입. `start()` 에서 `seq++` + `root._breath.destroy()`. `say()`·호흡 `onComplete/onStop` 콜백이 자기 세션 토큰과 다르면 즉시 반환(Promise 를 resolve 하지 않아 이전 체인이 멈춤). 검증: 호흡 중 재시작 후 35초 대기 → 봇 말풍선 2개(STOP 인트로·질문)만, 사용자 말풍선 0, 블록 1, 타이머 0 |
| Q-02 | Major | **수정** | `say()` 에서 `typing.parentNode` 확인 후 제거 + 세션 토큰 가드. 검증: 로드 직후(<100ms) 재시작 → 봇 말풍선 정확히 2개, 타이핑 인디케이터 0, pageerror 0 |
| Q-03 | Major | **수정** | 9페이지 `<html class="no-js">` + `<head>` 첫 스크립트에서 `classList.replace('no-js','js')`. `base.css` 리빌 규칙을 `html.js [data-reveal]` 로 한정. 검증: JS 비활성 컨텍스트에서 38/38 리빌 블록 표시 |
| Q-04 | Major | **수정** | 토큰 값 조정(표는 유지, 값만 변경 — R2-2 참조). `.final .lead` 를 `--line` 으로(잉크 배경 12:1), 결과 구간 라벨 `--amber-ink`, 게이지 범례 11→12px, 앰버 호는 `--amber` 유지(비텍스트). 검증: 9페이지 × 4폭 라이트 + 9페이지 다크 전수(텍스트 노드 45~231개/페이지) 4.5:1 전부 통과 |
| Q-05 | Major | **수정** | `checkup.js`: 라디오 `change` 는 답만 기록하고 `다음` 버튼을 활성화(답 전에는 disabled). `pointerdown` 이 선행한 포인터 선택만 220ms 후 자동 진행. 키보드(화살표/Space)는 절대 자동 진행 없음. 검증: ArrowRight ×3 후에도 카드 유지·포커스 유지·`다음` 활성, 마우스 클릭은 자동 진행 |
| Q-06 | Major | **수정** | `breath.js` `start()` 재개 분기에서 `lastPhase=''` 리셋 → 재개 즉시 "들이쉬세요/내쉬세요" 복원(+aria-live 낭독). 검증: 재개 300ms 내 문구 복원 |
| Q-07 | Minor | **수정** | `setControls()` 가 hidden 되는 활성 버튼을 기억해 상태별 첫 버튼(일시정지/시작/한 번 더)으로 포커스 이동. 모달 Esc/Tab 리스너를 `document` 레벨로 옮기고 닫을 때 해제, 포커스가 모달 밖이면 첫 요소로 복귀. 검증: Space 로 시작 → 포커스 `일시정지`, Esc 닫힘 |
| Q-08 | Minor | **수정** | `html{scroll-padding-top: calc(header-compact + 16px)}` + `[id],[data-result]{scroll-margin-top}`. 부수 효과로 코치 페이지에서 스티키 헤더 축소 임계(24px)와 smooth scroll 이 진동하는 문제가 드러나 `nav.js` 에 히스테리시스(48px 축소 / 12px 복원) 추가 |
| Q-09 | Minor | **수정** | `.likert{border:0;padding:0;margin:0;min-width:0}` |
| Q-10 | Minor | **수정** | 머니 '훈련 필요' 추천 프로그램에서 "· 도박 관련 시 1336 안내 병기" 제거(1336 crisis-note 는 별도 렌더 유지). 검증: 결과 텍스트에 "안내 병기" 없음 |
| Q-11 | Minor | **수정** | 공유 결과(`#result=`)에서 `(가장 높게 나온 )?'{묶음}' 단계부터` 전체를 "먼저 훈련할 단계부터"로 치환. 검증: R-20 공유 본문 확인 |
| Q-12 | Minor | **수정** | index S5 DOM 을 aside(h2·흐름도·CTA) → 카드 순으로 재배치, `.track--flip .track__aside{order:2}` 는 `@media (min-width:901px)` 안에서만 |
| Q-13 | Minor | **수정** | `.rail--vertical` 수정자 추가, about 인라인 style 제거 |
| Q-14 | Minor | **수정** | `.breath--sm .breath__count{font-size:12px;letter-spacing:.04em}` |
| Q-15 | Minor | **미수정(환경)** | `node tools/make-images.js` 재실행했으나 이 세션은 Google Fonts 차단 → 여전히 산세리프 폴백. README 배포 전 체크리스트에 재생성 항목 기재 |
| Q-16 | Minor | **수정** | `functions/coach.js`: `ALLOWED_ORIGIN` 환경변수(기본 `https://huggingmind.kr`, 쉼표 다중) 화이트리스트 — 목록 외 Origin 은 403 + CORS 헤더 미발급, `Vary: Origin`. 레이트리밋 키는 플랫폼 헤더(`x-nf-client-connection-ip`/`x-real-ip`) 우선. 인메모리 한계는 주석·README 에 명시(플랫폼 레이트리밋 병행 권장) |
| Q-17 | Minor | **수정** | `sanitizeState()`: 문자열 120자, 감정 ≤3개×20자, 강도 0~10 정수만, 비객체 payload 400, body 8KB 초과 413 |
| Q-18 | Minor | **수정** | `scrollLast()` 에서 사용자 조작 이후 포커스가 body 로 빠지면 마지막 블록의 첫 컨트롤(없으면 위기 카드 링크)로 `focus({preventScroll:true})`. 검증: 칩 Enter → 다음 CTA 에 포커스 |
| Q-19 | Minor | **수정** | 폰트 CSS `preload as=style → onload rel=stylesheet` + `<noscript>` 폴백, preconnect 2개 유지. 웨이트: Serif **600·700 유지**(600 은 h2/h3/카드 제목 등 전역 사용, 02-design 토큰 준수), Sans 400/500/700, **Mono 500 제거**(`.mono/.eyebrow/.wordmark__brand` 를 400 으로) → 7→6 웨이트 |
| Q-20 | Nit | **수정** | `.flow > .icon` 셀렉터로 화살표 색 적용, `.tag--accent` 삭제, `.chat__field` 클래스 실제 사용(코치 인라인 style 제거), `.mb` 제거, 본문 인라인 `style` 0건(`final__eyebrow/final__note/section-head--tight/rail--vertical/about-book__author` 클래스화, forms.js `<pre>` 도 CSS 로) |
| Q-21 | Nit | **수정** | ≤480px 에서 `.flow__mark` 를 전폭 세로 배치 + 라벨 정적 배치(절대배치 해제) |
| Q-22 | Nit | **수정** | 601~900px 히어로 2열(1fr 1fr) 유지, 미디어 우측 정렬 max 340px |
| Q-23 | Nit | **수정** | `[tabindex="-1"]:focus-visible{outline:none}` |
| Q-24 | Nit | **의도적 예외** | 폼 입력 `outline-offset:1px` 유지 — 입력 박스는 이미 1px 테두리가 있어 3px 오프셋이면 링이 인접 필드·라벨과 겹침. 디자인 §4 포커스 규칙의 입력 예외로 기록 |
| Q-25 | Nit | **의도적 예외** | S4/S5 기술 카드 하단 Ghost 링크 생략 유지 — 카드 3장이 모두 같은 페이지로 가므로 aside 의 CTA 2개로 충분, 링크 중복(페이지당 +6) 회피 |
| Q-26 | Nit | **수정** | NVC 4칸 문구 공백 제거("~했을 때(관찰)" 등 기획 원문) |
| Q-27 | Nit | **의도적 예외** | S6 호흡 카드는 인라인 타이머의 `시작` 유지 — 기획 "카드 안에서 바로 실행" 조항. 별도 `호흡 시작` 버튼을 두면 같은 카드에 시작 버튼 2개 |
| Q-28 | Nit | **수정** | `MODEL = process.env.COACH_MODEL \|\| 'claude-opus-5'` |
| Q-29 | Nit | **수정** | `tools/check.js` 보강 — R2-4 참조 |

### R2-2. 디자인 토큰 변경값 (02-design 표 구조 유지, 값만 조정)

| 토큰 | 원안(라이트/다크) | R2(라이트/다크) | 대비(라이트 bg / bg-2 / surface · 다크 bg / bg-2 / surface) |
|---|---|---|---|
| `--ink-3` | `#8E887C` / `#7C766A` | **`#67625A` / `#9A9385`** | 5.5 / 5.1 / 6.0 · 6.1 / 5.7 / 5.5 (accent-soft 위 4.9 / 4.7) |
| `--relation` | `#B4553A` / `#E29A84` | **`#9F4830`** / 유지 | 5.6 / 5.1 / 6.0 · 8.1 |
| `--amber-ink` (신설) | — | **`#7F5C1E` / `#D9AD5C`** | 5.5 / 5.1 / 6.0 · 8.9 — 결과 '주의' 라벨 등 텍스트 전용 |
| `--amber` | `#C9963A` / `#D9AD5C` | 유지 | 게이지 호(비텍스트)에만 사용 |

기타: 최종 CTA 블록의 lead 는 `--line`(라이트, 잉크 배경 위 12:1) / `--ink-2`(다크). 12px 미만 텍스트 0건(범례 11→12px).

### R2-3. E봇 SEO 제안 반영 (P1 전부 · P0/P2 는 README)

| 제안 | 처리 |
|---|---|
| FAQ 5문항 × 2 (relation/money) | §7-1 원문 그대로 `<details class="faq__item">/<summary>` 아코디언(1px 라인, 세리프 20px 질문, 첫 항목 open, +아이콘 45° 회전). 섹션 인덱스 라벨 `05 — 자주 묻는 질문`(relation, 미니 도구 06 으로 재번호) / `06 — 자주 묻는 질문`(money). 각 페이지 JSON-LD `@graph` 에 `FAQPage`(mainEntity Question/Answer 5) 추가 — 파싱·검증 통과 |
| h1 검색어 보강 | relation `다시, 우리.` + `<span class="h1__sub">부부·부모자녀 화 조절 훈련</span>`(h1 내부, 절반 크기 서브라인) / ai-coach `AI 마음브레이크 코치 — 감정과 행동 사이에 틈을 만드는 4단계` / checkup `마음근력 자가진단 — 지금 내 마음근력은 어디에 있을까요.` / index 히어로 h1 슬로건 그대로 |
| 푸터 `<h2>` 강등 | 9페이지 `<p class="site-footer__heading">` (검증: footer h2 0개) |
| 히어로 영문 칩 한글 병기 | `RELATION FIT 관계 마음근력` / `MONEY FIT 머니 마음근력` |
| 관계↔머니 교차 링크 | 각 페이지 최종 CTA 앞 `.crosslink` 1줄("같은 마음브레이크로 돈 앞의 충동도 훈련합니다 → 머니 마음근력 — 손실 후 감정조절·추격매매 멈추기" / 반대편 동일 구조) |
| 자가진단 "오늘 할 것 1개" | 결과 리포트에 `.result__today` — 트랙×구간별 코치 CHOOSE 선택지 1개(관계: 되풀이해 주기 / 20분 뒤 알리기 / 상처 한 줄 적기, 머니: 30초 점검 / 손절선·한도 적기 / 앱 닫고 24시간) |
| 안정 구간 CTA | 안정 구간은 `AI 코치로 주 1회 점검하기` 를 primary, 상담 신청은 secondary (검증 통과) |
| §4-1 ai-coach 사이드 카드 헤딩 / §4-3 about 확장성 링크·ai-coach 트랙 링크 | 사이드 카드 h2/h3 → `p.card__title`, about '확장성' 항목에 relation/money 링크, ai-coach '다음 단계' 카드에 트랙 링크 |
| P0(폼 엔드포인트·사진·서치콘솔) | 사용자 자료 필요 → `site/README.md` "배포 전 체크리스트" 로 정리 |
| P2(유튜브 섹션·카톡 버튼·트랙별 OG) | 미구현, README 에 06-seo §5-4/§5-5/§6 링크만 |

### R2-4. `tools/check.js` 보강 (Q-29) 및 실행 결과

추가된 검사: privacy.html 포함(9페이지 × 4폭 = 36) · 요소 `getBoundingClientRect` 기반 오버플로 0 · 텍스트 대비 감사(라이트 36회 + 다크 9페이지, `p/span/a/li/dt/dd/label/legend/button/summary/h1~h3/output` 텍스트 노드 전수, 조상 첫 불투명 배경 기준, 리빌·애니메이션 완료 후) · `html.js` 전환 확인 · no-JS 컨텍스트 리빌 가시성 · 호흡 재개 문구 · 모달 Space 시작 후 포커스/Esc · 자가진단 키보드 자동 진행 금지(+포인터 자동 진행·`다음` 활성) · 공유 결과 문구 · 안정 구간 CTA · 코치 재시작 레이스 2종(타이핑 중 / 호흡 중 35초 대기) · 칩 선택 후 포커스 · FAQ 5개 + FAQPage JSON-LD · 푸터 h2 0.

`node tools/check.js` 결과(외부 폰트 요청은 빈 CSS 로 대체):

| 항목 | 결과 |
|---|---|
| 9페이지 × 400/768/1024/1440 | **36/36 PASS** — 콘솔 에러 0, 동일 출처 4xx 0, scrollWidth 초과 0, **요소 오버플로 0**, h1 1개, 위기 연락처 존재, `html.js`, 텍스트 대비 실패 0 (예: index 1440 폭 158/158 노드) |
| 다크 모드 대비 | 9/9 페이지 실패 0 (index 231/231, relation 165/165, money 145/145, ai-coach 75/75, checkup 56/56, about 100/100, contact 97/97, 404 45/45, privacy 61/61) |
| no-JS | `html.no-js`, 38/38 리빌 블록 표시(`index-1280-nojs.png`) |
| 호흡 | 5라운드 **30.02초**, 재개 300ms 내 문구 복원, Space 시작 후 포커스 `일시정지`, Esc 닫힘, reduced-motion 스케일 없음 |
| 자가진단 | 경계값 17/18/28/29 ✓, 키보드 ArrowRight ×3 카드 유지, `다음` 활성화, 포인터 자동 진행, S=32 → 훈련 필요 + "오늘 할 것 1개" + 지시문 미노출, 공유 문구, 안정 CTA |
| 코치 | 3트랙 완주, CALM 콜백 30.58초, 위기 카드 2종, **재시작 레이스 2종 통과(유령 말풍선 0, pageerror 0)**, 칩 Enter 후 포커스 CTA |
| 기타 | 테마 저장, 오버레이 트랩/Esc, 폼 검증·honeypot·폴백, FAQ/FAQPage, 푸터 h2 0, 흐름 중 콘솔 에러 0 |
| 합계 | **assert 73 ok / 실패 0** (`scratchpad/shots-r2/check-results.json`) |

스크린샷(`scratchpad/shots-r2/`, 44장): 9페이지 × 4폭(index fullPage) + `index-1280-dark.png` `index-1280-nojs.png` `index-400-menu.png` `relation-1280-faq.png` `checkup-1280-result.png` `ai-coach-1280-summary.png` `contact-1280-lecture.png`.

### R2-5. 추가로 바뀐 것 / 남은 것

- `nav.js` 헤더 축소 히스테리시스(48/12px): Q-08 의 `scroll-padding-top` 도입 후 코치 페이지에서 smooth scroll 과 헤더 높이 변화(76→60)가 24px 임계 주변에서 무한 진동하던 것을 해소.
- 자가진단 "미응답 문항 이동" 코드(R1)는 `다음` 이 답 전에 비활성화되면서 UI 로는 도달 불가 → 방어 코드로 유지(테스트에서는 제외).
- 남은 것: Q-15 og-image 세리프(폰트 가능 환경에서 `make-images.js`), Lighthouse 실측(미설치 — 대비는 자체 감사로 대체), v2 함수 실호출, P0 사용자 자료, P2 채널 URL.
