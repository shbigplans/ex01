# 🎵 카페 음악 콘텐츠 자동화 시스템 가이드

유튜브 카페 음악 채널 운영을 위한 완전 자동화 시스템입니다.

## 📋 목차

1. [시스템 개요](#시스템-개요)
2. [설치 방법](#설치-방법)
3. [워크플로우](#워크플로우)
4. [사용 방법](#사용-방법)
5. [고급 사용법](#고급-사용법)
6. [팁과 노하우](#팁과-노하우)
7. [FAQ](#faq)

---

## 🎯 시스템 개요

### 무엇을 자동화하나요?

이 시스템은 다음을 자동으로 생성합니다:

1. **음악 메타데이터**
   - 매력적인 음악 제목 (한글 + 영문)
   - Suno AI에 입력할 음악 스타일
   - 감성적인 영어 가사
   - 분위기 태그

2. **유튜브 업로드 정보**
   - SEO 최적화된 제목
   - 상세한 설명 (description)
   - 검색 최적화 태그 15-20개
   - 트렌디한 해시태그

### 시스템 구조

```
┌─────────────────┐
│  config.yaml    │  ← 설정 파일
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ cafe_music_generator.py     │  ← 메인 스크립트
│                             │
│  1. Claude AI API 호출      │
│  2. 음악 메타데이터 생성     │
│  3. 유튜브 메타데이터 생성   │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  output/ 폴더                │
│                             │
│  ├── cafe_music_001.json    │  ← 기계가 읽는 형식
│  ├── cafe_music_001.txt     │  ← 사람이 읽는 형식
│  └── batch_summary.json     │  ← 배치 요약
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Suno AI                    │  ← 음악 생성 (수동)
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  YouTube 업로드              │  ← 영상 업로드 (수동)
└─────────────────────────────┘
```

---

## 🛠 설치 방법

### 1단계: Python 환경 준비

Python 3.8 이상이 필요합니다.

```bash
# Python 버전 확인
python --version

# 또는
python3 --version
```

### 2단계: 프로젝트 설정

```bash
# 필요한 패키지 설치
pip install -r requirements.txt

# 또는
pip3 install -r requirements.txt
```

### 3단계: API 키 설정

1. [Anthropic Console](https://console.anthropic.com/)에서 API 키 발급
2. 환경변수 설정:

**Linux/Mac:**
```bash
export ANTHROPIC_API_KEY='your-api-key-here'
```

**Windows (PowerShell):**
```powershell
$env:ANTHROPIC_API_KEY='your-api-key-here'
```

**Windows (CMD):**
```cmd
set ANTHROPIC_API_KEY=your-api-key-here
```

**영구 설정 (권장):**

`.env` 파일 생성:
```bash
cp .env.example .env
# .env 파일을 열어서 실제 API 키 입력
```

---

## 🔄 워크플로우

### 전체 프로세스

```
1. 🤖 메타데이터 생성 (자동)
   ↓
2. 🎼 Suno AI에서 음악 생성 (수동)
   ↓
3. 🎬 영상 제작 (수동/반자동)
   ↓
4. 📤 유튜브 업로드 (수동)
```

### 자동화된 부분 (1단계)

✅ 음악 제목 생성
✅ 음악 스타일 제안
✅ 가사 작성
✅ 유튜브 제목 생성
✅ 유튜브 설명 작성
✅ SEO 태그 생성
✅ 해시태그 생성

### 수동 작업이 필요한 부분

⚠️ Suno AI에 메타데이터 입력 및 음악 생성
⚠️ 음악 다운로드
⚠️ 영상 제작 (이미지/비디오 편집)
⚠️ 유튜브 업로드

---

## 🚀 사용 방법

### 기본 사용법

**1곡 생성:**
```bash
python cafe_music_generator.py
```

**여러 곡 한 번에 생성:**
```bash
python cafe_music_generator.py --count 5
```

### 분위기와 테마 지정

**특정 분위기로 생성:**
```bash
python cafe_music_generator.py --mood relaxing --count 3
```

**특정 테마로 생성:**
```bash
python cafe_music_generator.py --theme morning --count 2
```

**조합:**
```bash
python cafe_music_generator.py --mood cozy --theme rainy --count 5
```

### 사용 가능한 옵션

#### 분위기 (Mood)
- `relaxing` - 편안한
- `upbeat` - 경쾌한
- `cozy` - 아늑한
- `peaceful` - 평화로운
- `energetic` - 활기찬
- `melancholic` - 감성적인
- `romantic` - 로맨틱한

#### 테마 (Theme)
- `morning` - 아침
- `afternoon` - 오후
- `evening` - 저녁
- `night` - 밤
- `rainy` - 비오는 날
- `sunny` - 화창한 날
- `weekend` - 주말
- `workday` - 평일

### 출력 파일 이해하기

**JSON 파일 (cafe_music_001.json):**
```json
{
  "id": "cafe_music_20250110_001",
  "music": {
    "title": "따스한 오후의 재즈",
    "title_en": "Warm Afternoon Jazz",
    "style": "jazz, acoustic, smooth",
    "lyrics": "Sunlight streaming through...",
    "mood_tags": ["relaxing", "warm", "peaceful"]
  },
  "youtube": {
    "youtube_title": "☕ 따스한 오후의 재즈 | 카페 음악 | Warm Afternoon Jazz",
    "youtube_description": "...",
    "tags": ["카페음악", "재즈", ...],
    "hashtags": ["#카페음악", "#재즈", ...]
  }
}
```

**TXT 파일 (cafe_music_001.txt):**
사람이 읽기 쉬운 형식으로 모든 정보가 정리되어 있습니다.

---

## 🎓 고급 사용법

### 1. 설정 파일 커스터마이징

`config.yaml` 파일을 수정하여 기본값을 변경할 수 있습니다.

**채널 정보 수정:**
```yaml
youtube:
  channel_name: "Your Cafe Music Channel"  # 여기를 수정
```

**고정 태그 추가:**
```yaml
youtube:
  fixed_tags:
    - "카페음악"
    - "cafe music"
    - "당신의 고유 태그"  # 추가
```

**설명 하단 문구 변경:**
```yaml
youtube:
  description_footer: |
    당신만의 메시지를 여기에 작성하세요!
```

### 2. 배치 작업 스크립트

여러 분위기/테마를 한 번에 생성하는 쉘 스크립트:

**batch_generate.sh:**
```bash
#!/bin/bash

# 아침 음악 5곡
python cafe_music_generator.py --mood peaceful --theme morning --count 5

# 오후 음악 5곡
python cafe_music_generator.py --mood relaxing --theme afternoon --count 5

# 저녁 음악 5곡
python cafe_music_generator.py --mood cozy --theme evening --count 5

echo "✅ 총 15곡 생성 완료!"
```

실행:
```bash
chmod +x batch_generate.sh
./batch_generate.sh
```

### 3. 생성된 파일 활용하기

**Suno AI 워크플로우:**

1. `output/cafe_music_001.txt` 파일 열기
2. "음악 정보" 섹션에서:
   - `스타일` → Suno AI의 "Style of Music" 필드에 입력
   - `가사` → Suno AI의 "Lyrics" 필드에 복사
3. 음악 생성 버튼 클릭
4. 생성된 음악 다운로드

**유튜브 업로드 워크플로우:**

1. 음악 파일과 이미지로 영상 제작
2. 유튜브 스튜디오 업로드 페이지 열기
3. `output/cafe_music_001.txt` 파일에서:
   - `유튜브 제목` → 제목 필드에 붙여넣기
   - `설명` → 설명 필드에 붙여넣기
   - `태그` → 태그 필드에 붙여넣기
   - `해시태그` → 설명 끝에 추가

---

## 💡 팁과 노하우

### 콘텐츠 전략

**1. 시리즈로 만들기**

같은 테마로 여러 곡을 만들어 플레이리스트로 구성:

```bash
# "비오는 날" 시리즈 10곡
python cafe_music_generator.py --theme rainy --count 10
```

**2. 시간대별 음악**

하루 시간대별로 다른 분위기 생성:

```bash
# 아침 - 평화로운
python cafe_music_generator.py --mood peaceful --theme morning --count 5

# 오후 - 편안한
python cafe_music_generator.py --mood relaxing --theme afternoon --count 5

# 저녁 - 아늑한
python cafe_music_generator.py --mood cozy --theme evening --count 5
```

**3. 계절별 콘텐츠**

config.yaml에 계절 테마 추가:
```yaml
music:
  # 테마에 계절 추가
  custom_themes:
    - spring: 봄
    - summer: 여름
    - autumn: 가을
    - winter: 겨울
```

### 품질 향상 팁

**1. 가사 수정**

생성된 가사가 마음에 들지 않으면:
- TXT 파일에서 직접 수정
- 다시 생성하기 (같은 명령 재실행)

**2. 태그 최적화**

- 유튜브 검색창에서 "카페 음악" 검색
- 인기 영상의 태그 참고
- config.yaml의 `fixed_tags`에 추가

**3. 썸네일 일관성**

- 모든 영상에 같은 디자인 스타일 사용
- 시리즈별로 색상 구분
- 제목 텍스트는 읽기 쉽게

### 효율성 향상

**1. 한 번에 많이 생성**

주말에 한 번에 20-30곡 메타데이터 생성:
```bash
python cafe_music_generator.py --count 30
```

**2. 템플릿 활용**

자주 사용하는 설정을 별도 config 파일로:
```bash
# 아침 음악용 설정
python cafe_music_generator.py --config config_morning.yaml --count 10

# 저녁 음악용 설정
python cafe_music_generator.py --config config_evening.yaml --count 10
```

**3. 일정 관리**

- 월요일: 메타데이터 생성 (5곡)
- 화요일: Suno AI로 음악 생성
- 수요일: 영상 제작
- 목요일: 유튜브 업로드
- 금요일: 예약 발행 설정

---

## ❓ FAQ

### Q1. API 비용은 얼마나 드나요?

**A:** Claude API는 토큰 기반 요금제입니다.
- 1곡당 약 2,000 토큰 사용 (음악 메타데이터 + 유튜브 메타데이터)
- Claude Sonnet 4.5: 입력 $3/M 토큰, 출력 $15/M 토큰
- 대략 1곡당 $0.05-0.10 정도
- 10곡 생성시 약 $0.50-1.00

### Q2. 생성된 가사가 너무 짧거나 길어요

**A:** `config.yaml`에서 프롬프트를 수정하거나, 생성 후 직접 편집하세요.

스크립트 내 프롬프트 부분 수정:
```python
"lyrics": "음악 가사 (영어, 4-8줄, 카페 분위기에 맞게)",
# → "lyrics": "음악 가사 (영어, 8-12줄, 카페 분위기에 맞게)",
```

### Q3. 같은 내용이 반복 생성돼요

**A:** Claude AI는 매번 다른 결과를 생성하지만, 가끔 유사한 결과가 나올 수 있습니다.

해결책:
1. `config.yaml`에서 `temperature` 값 증가 (0.7 → 0.9)
2. 다양한 mood와 theme 조합 사용
3. 마음에 들지 않으면 다시 생성

### Q4. Suno AI에서 음악이 이상하게 나와요

**A:** 스타일 키워드를 조정하세요.

좋은 예:
- "jazz, acoustic, smooth, relaxing"
- "bossa nova, guitar, soft, mellow"

피해야 할 예:
- 너무 많은 키워드 (10개 이상)
- 상충되는 스타일 (heavy metal, soft)

### Q5. 유튜브 조회수가 안 나와요

**A:** SEO 최적화와 꾸준한 업로드가 중요합니다.

팁:
- 주 3-5회 정기 업로드
- 같은 시간대에 업로드
- 플레이리스트 활용
- 커뮤니티 탭 활용
- 다른 카페 음악 채널 연구
- 썸네일과 제목 A/B 테스트

### Q6. 다른 장르도 만들 수 있나요?

**A:** 네! `config.yaml`에서 장르를 변경하세요.

```yaml
music:
  genres:
    - "classical"
    - "piano"
    - "ambient"
    # 원하는 장르 추가
```

### Q7. 영상 제작은 어떻게 하나요?

**A:** 여러 방법이 있습니다:

**간단한 방법:**
- Canva: 무료 템플릿 사용
- Adobe Spark: 자동 영상 생성

**전문적인 방법:**
- Adobe Premiere Pro
- Final Cut Pro
- DaVinci Resolve (무료)

**자동화:**
- FFmpeg로 스크립트 작성 (이미지 + 음악 → 영상)

### Q8. 저작권 문제는 없나요?

**A:**
- Suno AI로 생성한 음악: Suno 이용약관 확인 필요
- Claude AI로 생성한 텍스트: 일반적으로 사용 가능
- 배경 이미지: 무료 스톡 이미지 사용 (Unsplash, Pexels)

항상 각 플랫폼의 이용약관을 확인하세요.

---

## 🎬 실전 예제

### 예제 1: 주간 콘텐츠 제작

```bash
# 월요일: 이번 주 콘텐츠 메타데이터 생성
python cafe_music_generator.py --mood relaxing --theme workday --count 3
python cafe_music_generator.py --mood peaceful --theme morning --count 2

# 총 5곡의 메타데이터가 output/ 폴더에 생성됨
```

### 예제 2: 시즌 특집

```bash
# 겨울 특집 시리즈
python cafe_music_generator.py --mood cozy --theme evening --count 10

# 생성 후 수동으로 제목에 "겨울" 추가
# 썸네일에 눈 이미지 사용
```

### 예제 3: 빠른 프로토타입

```bash
# 아이디어 테스트를 위해 1곡만 빠르게 생성
python cafe_music_generator.py --mood romantic --theme night

# output 폴더에서 결과 확인
# 마음에 들면 --count 10으로 더 생성
```

---

## 🔧 트러블슈팅

### API 키 오류

```
❌ 오류: ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.
```

**해결:**
```bash
export ANTHROPIC_API_KEY='your-actual-api-key'
python cafe_music_generator.py
```

### 모듈 없음 오류

```
ModuleNotFoundError: No module named 'anthropic'
```

**해결:**
```bash
pip install -r requirements.txt
```

### JSON 파싱 오류

```
json.decoder.JSONDecodeError: ...
```

**해결:**
- 인터넷 연결 확인
- API 키 유효성 확인
- 다시 실행 (일시적 오류일 수 있음)

---

## 📚 추가 자료

### 유용한 링크

- [Anthropic API 문서](https://docs.anthropic.com/)
- [Suno AI](https://suno.ai/)
- [유튜브 크리에이터 아카데미](https://creatoracademy.youtube.com/)
- [무료 음악 이미지 - Unsplash](https://unsplash.com/)
- [무료 음악 이미지 - Pexels](https://pexels.com/)

### 커뮤니티

- 유튜브 크리에이터 커뮤니티
- Reddit: r/NewTubers
- Facebook: 유튜브 크리에이터 그룹

---

## 📞 지원

문제가 발생하거나 제안사항이 있으면:

1. 이 가이드를 먼저 확인
2. FAQ 섹션 참고
3. GitHub Issues에 문의

---

**행운을 빕니다! 🎵**

멋진 카페 음악 채널을 만들어보세요!
