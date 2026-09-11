# huggingmind.kr — BLISS MIND FIT 정적 사이트

순수 HTML/CSS/JS(ES2020, 빌드 도구·프레임워크·npm 없음). 외부 의존성은 Google Fonts 링크 하나.

## 구조

```
site/
  index.html relation.html money.html ai-coach.html checkup.html about.html contact.html 404.html privacy.html
  assets/css/tokens.css      디자인 토큰(02-design.md) → CSS 변수, 라이트/다크
  assets/css/base.css        리셋·타이포·유틸
  assets/css/components.css  버튼·헤더·푸터·카드·흐름도·스텝 레일·채팅·호흡 원·게이지·폼
  assets/css/pages.css       페이지 레이아웃
  assets/js/theme.js         다크/라이트 토글(localStorage 'hm-theme', 시스템 설정 반영)
  assets/js/nav.js           스티키 헤더 축소, 모바일 오버레이 메뉴(포커스 트랩, Esc)
  assets/js/reveal.js        스크롤 리빌(IntersectionObserver, reduced-motion 존중)
  assets/js/breath.js        6초 호흡 타이머(인라인/모달, onComplete 콜백)
  assets/js/coach-data.js    AI 코치 스크립트 데이터(01-plan §5-a)
  assets/js/coach.js         AI 코치 v1 상태머신 + v2 호출/폴백
  assets/js/checkup.js       자가진단 렌더·채점·게이지·해시 공유
  assets/js/forms.js         폼 검증·honeypot·엔드포인트/mailto 폴백·자가진단 자동 채움
  assets/js/index.js         홈 S6 인라인 호흡 카드
  assets/img/favicon.svg     브랜드 심볼 "틈"
  assets/img/og-image.svg    OG 이미지 원본(1200×630) → og-image.png 로 변환해 배치
  sitemap.xml robots.txt
functions/coach.js           AI 코치 v2 서버리스 함수(Netlify/Vercel), functions/.env.example
tools/check.js               Playwright 자동 검증 스크립트
tools/make-images.js         og-image.svg/favicon.svg → PNG 변환(Playwright 렌더)
```

## 로컬 미리보기

```
cd site && python3 -m http.server 8080
# http://localhost:8080
```

## 배포 (정적 호스팅)

Netlify / Vercel / Cloudflare Pages / GitHub Pages 어디든 `site/` 디렉토리를 루트로 배포합니다.
- Netlify: Publish directory = `site`. 404는 `site/404.html` 자동 인식.
- Vercel: Output directory = `site`. `vercel.json`에 `{ "cleanUrls": true }` 권장.
- 도메인: `https://huggingmind.kr` (canonical/OG/sitemap 이 이 도메인 기준으로 작성됨. 다른 도메인이면 일괄 치환).

## `[교체: ...]` 목록 (배포 전 실제 값으로 바꿀 곳)

화면에 `[교체: ...]` 로 노출되는 항목은 브리프에 없는 사실이므로 사용자가 채워야 합니다.

| 위치 | 항목 |
|---|---|
| index / about 히어로 | 나영채 코치 프로필 사진 (3:4) — `.ph--portrait` 자리를 `<img>` 로 교체 |
| index S7 / about 저서 | 『상처를 넘어설 용기』 표지 이미지 (2:3), 출판사 소개문, 구매 링크 |
| index S8 / relation / money 프로그램 카드 | 대면·화상 여부, 회기, 가격 또는 '문의' |
| index S9 (주석 처리) | 실제 수강 후기 2~3건(동의 받은 것), 강의 기관 로고/명칭 — 자료가 있을 때만 주석 해제 |
| about | 연도별 경력·자격, 강의 기관/주제 목록 |
| contact | 이메일, 전화, 운영시간, 위치/화상 여부, 제공 상담 형식 확정, 예산 구간, 소개서 PDF, 회신 소요 시간 |
| contact 폼 | `data-endpoint`(Formspree/Netlify Forms 등) 또는 `data-mailto`(실제 이메일) |
| 푸터 | 이메일, 전화, 상호/대표/사업자등록번호/주소 |
| privacy.html | 사업자 정보, 보유 기간, 위탁 내역, 요청 창구, 시행일 |
| checkup 결과 문구 | 추천 프로그램의 `[교체: 회기]` (assets/js/checkup.js) |
| assets/img | og-image.png (og-image.svg 를 1200×630 PNG로 변환), 필요 시 PNG favicon 세트 |
| assets/js/coach.js | v2 활성화 시 `COACH_ENDPOINT` |

## 배포 전 체크리스트 (E봇 P0 — 사용자 자료 필요)

- [ ] **폼 엔드포인트 연결** — `contact.html` 두 폼의 `data-endpoint`(Formspree/Netlify Forms) 또는 `data-mailto`(실제 이메일). 미연결 배포는 전환 0.
- [ ] **프로필 사진·저서 표지** — `index.html`/`about.html` 의 `.ph--portrait`/`.ph--book` 를 `<img>` 로 교체(alt: `나영채 감정·충동조절 마음근력 코치 프로필 사진`, `나영채 저서 『상처를 넘어설 용기』 표지`, 영문 파일명, width/height 명시).
- [ ] **Search Console·네이버 서치어드바이저** — 각 페이지 `<head>` 의 `[교체: 검색엔진 사이트 인증 메타]` 주석 자리에 인증 메타 삽입 후 `sitemap.xml` 제출.
- [ ] 프로그램 형식·회기·비용, 연락처, 사업자 정보, 개인정보처리방침 4항목 등 `[교체:]` 해소(아래 표).
- [ ] 폰트가 로드되는 환경에서 `node tools/make-images.js` 로 `og-image.png` 재생성(세리프 적용).
- [ ] v2 코치 배포 시 `functions/.env.example` 의 `ALLOWED_ORIGIN` 을 실제 도메인으로.

P2(미구현, 설계안만): 유튜브 채널/영상 섹션 · 카카오톡 채널 버튼 · 트랙별 OG 이미지 — `docs/botteam/huggingmind-upgrade/06-seo.md` §5-4, §5-5, §6 참고. 채널 URL 확정 후 구현.

## 폼 연결

`contact.html` 의 두 `<form data-form>` 에서:
1. `data-endpoint="https://formspree.io/f/xxxx"` 처럼 지정하면 JSON POST로 전송.
2. 비어 있고 `data-mailto="you@example.com"` 이면 mailto 링크로 열림.
3. 둘 다 비어 있으면 "전송 경로 미설정" 안내 + 내용 복사 버튼(현재 상태).

## AI 코치 v2 활성화 (선택, 사용자 확인 후)

1. `functions/coach.js` 를 Netlify Functions(`functions/`) 또는 Vercel(`api/coach.js` 어댑터) 로 배포. `npm i @anthropic-ai/sdk`, `package.json` 에 `"type": "module"`.
2. 서버 환경변수 `ANTHROPIC_API_KEY`, `ALLOWED_ORIGIN`(CORS 허용 도메인, 기본 https://huggingmind.kr) 설정 (`functions/.env.example`).
3. `site/assets/js/coach.js` 의 `COACH_ENDPOINT` 를 `/.netlify/functions/coach` 또는 `/api/coach` 로 변경.
4. 실패·8초 타임아웃 시 자동으로 v1로 폴백하며 "오프라인 가이드로 계속합니다"가 한 줄 표시됩니다.

## 검증

```
node tools/check.js   # 정적 서버 자동 기동 → 7페이지 × 4폭 콘솔/가로스크롤/h1/위기연락처 + 코치 3트랙·진단 경계값·호흡 30초
```
