# 02. 디자인 시스템 — B봇(디자인)

작성: B봇 · 2026-09-11 · 근거: `00-brief.md`, `01-plan.md`
디자인 캔버스(Claude Design) 링크: (오케스트레이터가 저장 후 기입)

## 방향: "Warm Editorial — 종이 위의 단단한 문장"

브랜드가 파는 것은 '틈'이다. 감정과 행동 사이의 여백. 그래서 사이트도 여백을 판다.
템플릿 티(그라데이션 히어로, 둥근 카드 + 좌측 컬러 바, 아이콘 나열)를 전부 배제하고,
잡지 에디토리얼처럼 **큰 명조 헤드라인 + 정밀한 모노 라벨 + 넓은 여백 + 한 가지 깊은 초록**으로 간다.
두 트랙(관계/머니)은 같은 채도·명도에서 색상만 다른 두 틴트로 구분한다.

대안 방향(캔버스에 저사양 스케치로 병기): "Dark Precision" — 잉크 배경, 라임 포인트, 데이터 룩. 채택하지 않은 이유: 상담·코칭 브랜드의 따뜻함이 죽고, 40대 관계 트랙 페르소나와 거리감.

## 1. 컬러 토큰 (oklch 기준, hex는 근사값)

| 토큰 | 라이트 | 다크 | 용도 |
|---|---|---|---|
| `--bg` | `#F7F4EE` (oklch 0.965 0.008 85) | `#15130F` | 페이지 바탕 (따뜻한 종이) |
| `--bg-2` | `#EFEAE1` | `#1D1A15` | 섹션 교차 배경 |
| `--surface` | `#FFFDF9` | `#211E18` | 카드·입력 |
| `--ink` | `#1B1915` | `#F1ECE3` | 본문·헤드라인 |
| `--ink-2` | `#5B564D` | `#B4AC9E` | 보조 텍스트 |
| `--ink-3` | `#8E887C` | `#7C766A` | 캡션·플레이스홀더 |
| `--line` | `#DDD6C9` | `#2E2A22` | 구분선 (1px, 헤어라인 금지) |
| `--accent` | `#2F5D4A` (oklch 0.45 0.07 160) | `#8FBFA6` | 브랜드 초록 — 주 CTA, 링크, 강조 |
| `--accent-ink` | `#FFFFFF` | `#0F1A15` | accent 위 텍스트 |
| `--accent-soft` | `#E3EDE6` | `#1E2E27` | accent 배경 틴트 |
| `--relation` | `#B4553A` (oklch 0.55 0.13 35) | `#E29A84` | RELATION FIT 틴트 (테라코타) |
| `--relation-soft` | `#F4E4DD` | `#33221C` | |
| `--money` | `#2E5F7A` (oklch 0.45 0.07 235) | `#8DB9D2` | MONEY FIT 틴트 (딥 블루) |
| `--money-soft` | `#DFE9F0` | `#1A2730` | |
| `--danger` | `#9B2D2D` | `#E48B8B` | 위기 안내 바 텍스트 |
| `--danger-soft` | `#F6E3E3` | `#31201F` | 위기 안내 바 배경 |

규칙: 그라데이션은 히어로 뒤 "종이 결" 노이즈(opacity 0.04)와 호흡 원(accent 라디얼) 두 곳에만. 그림자는 카드 hover 시 `0 12px 32px -16px rgb(27 25 21 / .25)` 한 종류만.

## 2. 타이포그래피

| 역할 | 폰트 | 대체 스택 |
|---|---|---|
| 디스플레이(헤드라인 KR) | **Noto Serif KR** 600/700 | "Apple SD Gothic Neo", "Nanum Myeongjo", serif |
| 본문(KR) | **Noto Sans KR** 400/500/700 | Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif |
| 라벨·숫자·오버라인 | **IBM Plex Mono** 400/500 | ui-monospace, "SF Mono", Menlo, monospace |

Google Fonts 한 번에 로드: `family=Noto+Serif+KR:wght@600;700&family=Noto+Sans+KR:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500&display=swap`

타입 스케일 (clamp, 1440 기준 → 400 기준)

| 토큰 | 크기 | 행간 | 자간 |
|---|---|---|---|
| `--t-display` | clamp(40px, 5.2vw, 76px) | 1.12 | -0.02em |
| `--t-h1` | clamp(34px, 3.6vw, 52px) | 1.18 | -0.015em |
| `--t-h2` | clamp(26px, 2.4vw, 36px) | 1.25 | -0.01em |
| `--t-h3` | 22px | 1.35 | 0 |
| `--t-lead` | clamp(17px, 1.3vw, 20px) | 1.65 | 0 |
| `--t-body` | 16px | 1.75 | 0 |
| `--t-small` | 14px | 1.6 | 0 |
| `--t-mono` | 12px | 1.4 | 0.08em (대문자) |

한글 헤드라인은 `word-break: keep-all; text-wrap: balance`. 본문 `text-wrap: pretty`.

## 3. 간격·레이아웃

- 컨테이너 max 1200px, 좌우 패딩 `clamp(20px, 4vw, 56px)`.
- 12컬럼 그리드, 거터 32px(모바일 16px). 히어로는 7/5 비대칭, 트랙 섹션은 5/7 ↔ 7/5 좌우 반전.
- 섹션 수직 패딩 `clamp(80px, 10vw, 144px)`. 섹션 상단에 에디토리얼 인덱스 라벨(모노) `01 — 문제`, `02 — 핵심기술` … + 1px 라인.
- 라운드: 버튼 999px(필), 카드 4px(거의 각짐), 입력 4px, 호흡 원 50%.
- 간격 스케일: 4 8 12 16 24 32 48 64 96 144.

## 4. 컴포넌트

- **버튼**: 높이 52px(모바일 48px), 패딩 0 28px, 모노 라벨 아님 — 본문 폰트 500 15px. Primary = accent 배경 / Secondary = 1px ink 라인 투명 배경 / Ghost = 밑줄 텍스트 링크 + 화살표(→는 SVG 20px). 호버: primary 배경 8% 어둡게, secondary 배경 `--bg-2`. 포커스: `outline: 2px solid var(--accent); outline-offset: 3px`.
- **헤더**: 높이 76px → 스크롤 후 60px, `--bg` 90% + backdrop-blur 12px, 하단 1px `--line`. 워드마크 "BLISS MIND FIT"는 모노 500 13px 자간 0.14em + 옆에 세리프 "나영채". 오른쪽: 호흡 아이콘(원 SVG), 테마 토글(해/달 SVG), `상담 신청` primary 버튼(모바일에서는 숨기고 오버레이 메뉴에).
- **흐름 다이어그램(고리)**: 노드 = 모노 13px 텍스트 + 1px 라인 박스, 화살표는 20px SVG. "감정 폭발 → 행동" 사이에 accent 점선 박스 + 라벨 "여기가 개입지점입니다".
- **마음브레이크 스텝 레일**: 4칸 그리드, 각 칸 상단 모노 `01 STOP`, 중앙 세리프 36px "멈춘다", 하단 본문. 칸 사이 1px 세로선. 호버 시 accent-soft 배경. 모바일 세로 스택.
- **트랙 카드**: 상단 트랙 틴트 라벨(모노, 해당 트랙 색), 세리프 제목, 본문, 하단 Ghost 링크. 배경 surface, 1px line, 라운드 4px.
- **AI 코치 채팅**: 봇 말풍선 = surface 배경 1px line 라운드 16px(좌하단 4px), 사용자 선택 = accent-soft 배경 라운드 16px(우하단 4px). 선택 버튼 칩 = 1px line 필, 선택 시 accent 배경. 상단 4점 스텝퍼(모노 라벨 STOP·FEEL·CALM·CHOOSE, 현재 accent). 강도 슬라이더 accent 트랙.
- **호흡 원**: 지름 220px(모바일 180px), accent 라디얼(중심 accent-soft → 가장자리 투명) + 1px accent 테두리. 들숨 scale 1→1.35 3s ease-in-out. 원 안 세리프 22px "들이쉬세요", 아래 모노 카운트.
- **자가진단 문항 카드**: 1문항씩, 좌상단 모노 `R3 / 08`, 세리프 24px 질문, 5개 라디오를 가로 세그먼트(1~5)로, 양끝 라벨 "전혀 아니다 / 매우 그렇다". 진행 바 상단 2px accent.
- **결과 게이지**: 반원 SVG, 구간 3색(안정 accent, 주의 `#C9963A` 앰버, 훈련 필요 relation), 바늘 대신 두꺼운 호(12px). 중앙 세리프 52px 지수 + 모노 라벨.
- **위기 안내 바**: danger-soft 배경, danger 텍스트 14px, 전화번호는 `tel:` 링크 + 밑줄. 아이콘 없이 텍스트만.
- **푸터**: bg-2 배경, 4열 → 모바일 2열 → 1열. 상단 위기 안내 바 전폭.

## 5. 모션

- 히어로: 오버라인 → 헤드라인 → 서브 → CTA 순 120ms 스태거 fade-up(16px, 700ms cubic-bezier(.2,.7,.2,1)). 단 한 번.
- 스크롤 리빌: 섹션 진입 시 opacity 0→1, translateY 12px→0, 600ms. IntersectionObserver, threshold .15.
- 호흡 원만 지속 애니메이션. 그 외 장식 모션 없음.
- `prefers-reduced-motion: reduce` 시 전부 즉시 표시.

## 6. 이미지·아이콘

- 아이콘: 인라인 SVG stroke 1.5px 20/24px, 이모지·딩벳 금지.
- 프로필 사진 `[교체]` 자리는 3:4 비율, `--bg-2` 배경에 모노 라벨 "PORTRAIT / 3:4"만. 저서 표지 `[교체]` 자리는 2:3.
- OG 이미지 1200×630: bg 종이색 + 세리프 슬로건 + 하단 모노 "BLISS MIND FIT · huggingmind.kr" (SVG로 생성해 PNG 변환).
- favicon: 초록 원 안에 1px 흰 세로 틈(gap) — 브랜드 심볼 "틈". SVG favicon + PNG 세트.

## 7. 다크 모드

`:root` 라이트 기본, `@media (prefers-color-scheme: dark)` + `[data-theme]` 토글. 토글 값 localStorage `hm-theme`. 다크에서는 accent를 밝게(`#8FBFA6`) 올리고 종이 노이즈 opacity 0.06.
