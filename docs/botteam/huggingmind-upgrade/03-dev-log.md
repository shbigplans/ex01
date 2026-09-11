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
