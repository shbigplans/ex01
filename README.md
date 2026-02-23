# 🎵 카페 음악 콘텐츠 자동화 시스템

유튜브 카페 음악 채널 운영을 위한 AI 기반 자동화 도구

## 🌟 새로운 기능: 웹 버전

이제 웹 브라우저에서 쉽게 사용할 수 있습니다!

```bash
# 웹 서버 실행
python app.py

# 브라우저에서 접속
http://localhost:5000
```

**웹 버전의 장점:**
- 🖱️ 직관적인 UI - 마우스 클릭만으로 모든 작업
- 👀 실시간 미리보기 - 생성 결과를 바로 확인
- 📋 원클릭 복사 - 클립보드로 즉시 복사
- 📥 쉬운 다운로드 - JSON, TXT 파일 다운로드
- 📚 히스토리 관리 - 이전 생성 결과 쉽게 조회

자세한 사용법은 [웹 가이드](WEB_GUIDE.md)를 참조하세요.

---

## ✨ 주요 기능

- 🤖 **AI 기반 메타데이터 생성**: Claude AI가 음악 제목, 가사, 스타일을 자동 생성
- 🎯 **SEO 최적화**: 유튜브 검색에 최적화된 제목, 설명, 태그 자동 생성
- ⚡ **배치 처리**: 여러 곡의 메타데이터를 한 번에 생성
- 🎨 **커스터마이징**: 분위기, 테마, 장르를 자유롭게 설정
- 📁 **다양한 출력 형식**: JSON, TXT 형식으로 저장

## 🚀 빠른 시작

### 1. 설치

```bash
# 의존성 설치
pip install -r requirements.txt
```

### 2. API 키 설정

```bash
# API 키 설정
export ANTHROPIC_API_KEY='your-api-key-here'
```

### 3. 실행

```bash
# 1곡 생성
python cafe_music_generator.py

# 5곡 생성
python cafe_music_generator.py --count 5

# 특정 분위기로 생성
python cafe_music_generator.py --mood relaxing --theme afternoon --count 3
```

## 📖 사용 방법

### 기본 명령어

```bash
# 기본 사용 (1곡)
python cafe_music_generator.py

# 여러 곡 생성
python cafe_music_generator.py --count 10

# 분위기 지정
python cafe_music_generator.py --mood cozy --count 5

# 테마 지정
python cafe_music_generator.py --theme morning --count 3

# 분위기 + 테마
python cafe_music_generator.py --mood peaceful --theme rainy --count 5
```

### 옵션

| 옵션 | 설명 | 예시 |
|------|------|------|
| `--count` | 생성할 곡 수 | `--count 10` |
| `--mood` | 분위기 설정 | `--mood relaxing` |
| `--theme` | 테마 설정 | `--theme morning` |
| `--config` | 설정 파일 지정 | `--config my_config.yaml` |

### 사용 가능한 분위기 (Mood)

- `relaxing` - 편안한
- `upbeat` - 경쾌한
- `cozy` - 아늑한
- `peaceful` - 평화로운
- `energetic` - 활기찬
- `melancholic` - 감성적인
- `romantic` - 로맨틱한

### 사용 가능한 테마 (Theme)

- `morning` - 아침
- `afternoon` - 오후
- `evening` - 저녁
- `night` - 밤
- `rainy` - 비오는 날
- `sunny` - 화창한 날
- `weekend` - 주말
- `workday` - 평일

## 📁 출력 구조

```
output/
├── cafe_music_20250110_001.json    # 기계가 읽는 형식
├── cafe_music_20250110_001.txt     # 사람이 읽는 형식
├── cafe_music_20250110_002.json
├── cafe_music_20250110_002.txt
└── batch_summary_20250110.json     # 배치 요약
```

### 출력 예시

**JSON 파일:**
```json
{
  "id": "cafe_music_20250110_001",
  "music": {
    "title": "따스한 오후의 재즈",
    "title_en": "Warm Afternoon Jazz",
    "style": "jazz, acoustic, smooth",
    "lyrics": "Sunlight streaming through the window...",
    "mood_tags": ["relaxing", "warm", "peaceful"]
  },
  "youtube": {
    "youtube_title": "☕ 따스한 오후의 재즈 | 카페 음악 | Warm Afternoon Jazz",
    "youtube_description": "편안한 오후를 위한 따스한 재즈 음악...",
    "tags": ["카페음악", "재즈", "cafe music", ...],
    "hashtags": ["#카페음악", "#재즈", "#CafeMusic"]
  }
}
```

## 🔄 워크플로우

```
1. 이 도구로 메타데이터 생성
   ↓
2. Suno AI에 스타일과 가사 입력
   ↓
3. 생성된 음악 다운로드
   ↓
4. 영상 제작 (음악 + 이미지)
   ↓
5. 유튜브에 업로드 (생성된 제목, 설명, 태그 사용)
```

## ⚙️ 설정

`config.yaml` 파일을 수정하여 기본 설정을 변경할 수 있습니다:

```yaml
# 음악 기본 설정
music:
  default_mood: "relaxing"
  default_theme: "afternoon"
  genres:
    - "jazz"
    - "acoustic"
    - "bossa nova"

# 유튜브 설정
youtube:
  channel_name: "Your Channel Name"
  fixed_tags:
    - "카페음악"
    - "cafe music"
```

## 📚 문서

- **[웹 가이드](WEB_GUIDE.md)** - 웹 버전 사용법 (추천)
- [상세 가이드](GUIDE.md) - CLI 버전 전체 기능과 사용법
- [워크플로우](WORKFLOW.md) - 처음부터 끝까지 전체 프로세스
- [FAQ](GUIDE.md#faq) - 자주 묻는 질문

## 💡 사용 예제

### 예제 1: 주간 콘텐츠 제작

```bash
# 월요일: 이번 주 콘텐츠 메타데이터 생성
python cafe_music_generator.py --mood peaceful --theme morning --count 5
```

### 예제 2: 테마별 시리즈

```bash
# "비오는 날" 시리즈
python cafe_music_generator.py --theme rainy --count 10

# "주말 아침" 시리즈
python cafe_music_generator.py --mood peaceful --theme morning --count 7
```

### 예제 3: 배치 스크립트

**batch_generate.sh:**
```bash
#!/bin/bash

# 다양한 분위기의 음악 생성
python cafe_music_generator.py --mood peaceful --theme morning --count 3
python cafe_music_generator.py --mood relaxing --theme afternoon --count 3
python cafe_music_generator.py --mood cozy --theme evening --count 3

echo "✅ 총 9곡 생성 완료!"
```

## 🛠 시스템 요구사항

- Python 3.8 이상
- Anthropic API 키
- 인터넷 연결

## 📦 의존성

**CLI 버전:**
- `anthropic` - Claude AI API 클라이언트
- `pyyaml` - YAML 설정 파일 파서

**웹 버전 (추가):**
- `flask` - 웹 프레임워크
- `flask-cors` - CORS 지원

## 💰 비용

Claude API는 토큰 기반 요금제를 사용합니다:

- 1곡당 약 $0.05-0.10
- 10곡 생성시 약 $0.50-1.00
- 100곡 생성시 약 $5-10

자세한 요금은 [Anthropic 요금 페이지](https://www.anthropic.com/pricing)를 참조하세요.

## 🤝 기여

버그 리포트, 기능 제안, PR을 환영합니다!

## 📄 라이선스

MIT License

## 🙏 감사

- [Anthropic](https://www.anthropic.com/) - Claude AI 제공
- [Suno AI](https://suno.ai/) - 음악 생성 플랫폼

---

**행운을 빕니다! 🎵**

질문이나 문제가 있으면 이슈를 열어주세요.
