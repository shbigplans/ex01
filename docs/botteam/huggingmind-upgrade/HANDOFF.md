# HANDOFF — huggingmind.kr 프로 업그레이드 (봇팀 작업 인수인계)

작성일 2026-09-12 · 브랜치 `claude/peaceful-darwin-73qyba` · 웹 세션에서 진행한 전체 작업 요약

## 1. 한눈에 보기

| 항목 | 내용 |
|---|---|
| 브랜드 | 나영채 · 감정·충동조절 마음근력 코치 · BLISS MIND FIT (huggingmind.kr) |
| 결과물 | 정적 사이트 7페이지 + 404 + 개인정보처리방침, AI 기능 3종, 서버리스 코치 함수, QA 스크립트 |
| 상태 | D봇 최종 판정 **출시 가능** (2라운드 종료, Blocker 0, 회귀 0) |
| 미리보기 | https://claude.ai/code/artifact/e9ee1708-c65d-4d71-995d-7e2e1acfd2c9 |
| 디자인 캔버스 | https://claude.ai/code/artifact/71af0a10-781f-4b58-81dd-ffe71ee210a3 |
| 원본 자료 | 포지셔닝 PDF 8p (브리프 `00-brief.md` 에 전문 추출) |

## 2. 폴더 구조

```
site/                       ← 배포 대상 (그대로 정적 호스팅에 업로드)
  index.html relation.html money.html ai-coach.html checkup.html about.html contact.html 404.html privacy.html
  assets/css/  tokens.css(디자인 토큰·다크모드) base.css components.css pages.css
  assets/js/   theme.js nav.js reveal.js breath.js coach.js coach-data.js checkup.js forms.js index.js
  assets/img/  favicon.svg favicon-192/512.png og-image.svg/png
  sitemap.xml robots.txt README.md(배포·[교체:] 체크리스트)
functions/coach.js          ← AI 코치 v2 (Claude API, Netlify Functions / Vercel 주석)
functions/.env.example
tools/check.js              ← Playwright QA (36 페이지×폭, 73 assert)
docs/botteam/huggingmind-upgrade/
  00-brief.md   킥오프 브리프 (PDF 원문 카피 전문)
  01-plan.md    A봇 기획안 (사이트맵·섹션 카피·AI 코치 스크립트·자가진단 문항·채점·폼)
  02-design.md  B봇 디자인 시스템 (컬러/타이포/간격/컴포넌트/모션 + R2 예외)
  03-dev-log.md C봇 구현 로그 (R1·R2, 기획과 다르게 결정한 것, [교체:] 목록)
  04-qa.md      D봇 QA (Q-01~Q-31, 성공 기준 10개, R2 재검증)
  05-conversation.md 봇 간 대화 요약 (라운드별 결정)
  06-seo.md     E봇 SEO/마케팅 (메타·JSON-LD·FAQ 초안·전환 동선·콘텐츠 주제)
  design/       Claude Design 아트보드 원본 (*.dc.html, canvas.json)
.claude/skills/botteam/SKILL.md ← `/botteam <주제>` 로 봇팀 재가동
```

## 3. 로컬(VS Code)에서 이어서 작업하기

```bash
# 원하는 폴더에서
git clone https://github.com/shbigplans/ex01.git
cd ex01
git checkout claude/peaceful-darwin-73qyba
code .                       # VS Code 열기

# 사이트 로컬 실행
cd site && python -m http.server 8080   # → http://localhost:8080

# QA 재실행 (Playwright 필요: npm i -D playwright && npx playwright install chromium)
node tools/check.js
```

이미 클론해 두었다면 `git fetch origin && git checkout claude/peaceful-darwin-73qyba && git pull` 만 하면 됩니다.

Claude Code 를 VS Code 터미널에서 쓰면 이 웹 세션의 대화 기록까지 그대로 가져올 수 있습니다.

```bash
claude --teleport session_01RFmb8UcDmEUpHkqXWT4kcu
```

(같은 claude.ai 계정으로 로그인되어 있어야 하고, 저장소 클론 안에서 실행해야 합니다.)

## 4. AI 기능 요약

| 기능 | 파일 | 동작 |
|---|---|---|
| AI 마음브레이크 코치 (v1) | `coach.js`, `coach-data.js` | STOP→FEEL→CALM→CHOOSE 규칙 기반 대화, 키 없이 동작, 3트랙(관계/머니/일반), `?track=` 파라미터, 안전 키워드 → 위기 카드, 요약 카드 복사 |
| AI 코치 v2 (선택) | `functions/coach.js` | Claude API 로 봇 발화 생성, 흐름은 코드가 유지. `COACH_ENDPOINT` 설정 시 사용, 실패 시 v1 폴백. `ANTHROPIC_API_KEY`, `ALLOWED_ORIGIN` 환경변수 |
| 마음근력 자가진단 | `checkup.js` | 관계/머니 8문항, 8~17 안정 / 18~28 주의 / 29~40 훈련 필요, 지수 게이지, 먼저 훈련할 단계, "오늘 할 것 1개", `#result=R-23` 공유 |
| 6초 호흡 타이머 | `breath.js` | 3초 들숨/3초 날숨, 5·10·15 라운드, 인라인/모달, reduced-motion 대응, 완료 콜백 |

## 5. 배포 전에 채워야 할 것 (사용자 자료 필요)

1. `[교체: ...]` 102곳 — 전수 목록은 `04-qa.md` §7. 핵심: 프로필 사진(3:4), 저서 표지(2:3), 이메일·전화, 사업자 정보, 프로그램 형식·회기·가격, 회신 소요 시간.
2. 상담/강의 폼 전송: `contact.html` 의 `data-endpoint`(Formspree·Netlify Forms 등) 또는 `data-mailto` 실값.
3. 검색엔진 인증 메타(Google Search Console, 네이버 서치어드바이저) — 각 HTML head 의 주석 자리.
4. `og-image.png` 를 웹폰트가 되는 환경에서 재생성(`tools/make-images.js`) — 현재는 대체 폰트로 렌더됨.
5. v2 AI 코치를 쓰려면 `functions/` 배포 + 환경변수 설정 (배포 방식 결정 필요: Netlify / Vercel / 기타).
6. 기존 huggingmind.kr 의 연락처·프로그램·사진 이관 (웹 세션 네트워크 정책으로 캡처 실패 — 로컬에서는 브라우저로 바로 확인 가능).

## 6. 다음에 봇팀을 다시 부를 때

```
/botteam <주제>
봇팀 가동: <주제>
```

이 저장소의 `.claude/skills/botteam/SKILL.md` 가 A·B·C·D·E봇 구성과 라운드 규칙을 담고 있습니다. 메인 브랜치에 머지해 두면 어느 세션에서든 동작합니다.
