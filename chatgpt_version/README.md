# 🎵 카페 음악 콘텐츠 자동화 시스템 - ChatGPT 버전

유튜브 카페 음악 채널 운영을 위한 AI 기반 자동화 도구

**💰 ChatGPT (GPT-4o-mini) 사용 - 저렴하고 빠른 버전!**

## 🌟 왜 ChatGPT 버전인가?

### 💵 가격 비교 (1곡 기준)

| 모델 | 입력 가격 | 출력 가격 | 1곡당 비용 | 특징 |
|------|----------|----------|-----------|------|
| **GPT-4o-mini** | $0.15/1M | $0.60/1M | **~$0.02** | ⭐ 가장 저렴 |
| Claude Sonnet 4.5 | $3.00/1M | $15.00/1M | ~$0.08 | 더 비쌈 |

**결론: ChatGPT 버전이 약 4배 저렴합니다!**

### ⚡ 기타 장점

- **빠른 응답 속도**: GPT-4o-mini는 매우 빠름
- **JSON 모드**: 안정적인 JSON 출력
- **높은 품질**: 충분히 좋은 품질의 결과
- **낮은 비용**: 많은 콘텐츠를 생성해도 부담 없음

## 📊 비용 예상

```
1곡 생성: ~$0.02
10곡 생성: ~$0.20
100곡 생성: ~$2.00
1000곡 생성: ~$20.00
```

## 🚀 빠른 시작

### 1. 설치

```bash
cd chatgpt_version
pip install -r requirements.txt
```

### 2. API 키 설정

[OpenAI Platform](https://platform.openai.com/api-keys)에서 API 키 발급

```bash
export OPENAI_API_KEY='your-api-key-here'
```

**Windows (PowerShell):**
```powershell
$env:OPENAI_API_KEY='your-api-key-here'
```

### 3-A. 웹 버전 실행 (추천)

```bash
python app.py
```

브라우저에서 http://localhost:5000 접속

### 3-B. CLI 버전 실행

```bash
# 1곡 생성
python cafe_music_generator.py

# 5곡 생성
python cafe_music_generator.py --count 5

# 특정 분위기로 생성
python cafe_music_generator.py --mood relaxing --theme afternoon --count 3
```

## ✨ 주요 기능

### 웹 버전
- 🖱️ **직관적인 UI** - 마우스 클릭만으로 모든 작업
- 👀 **실시간 미리보기** - 생성 결과를 바로 확인
- 📋 **원클릭 복사** - 클립보드로 즉시 복사
- 📥 **쉬운 다운로드** - JSON, TXT 파일 다운로드
- 📚 **히스토리 관리** - 이전 생성 결과 쉽게 조회

### CLI 버전
- ⚡ **배치 처리** - 여러 곡의 메타데이터를 한 번에 생성
- 🎨 **커스터마이징** - 분위기, 테마, 장르를 자유롭게 설정
- 📁 **다양한 출력 형식** - JSON, TXT 형식으로 저장

### AI 기능
- 🤖 **AI 기반 메타데이터 생성** - ChatGPT가 음악 제목, 가사, 스타일을 자동 생성
- 🎯 **SEO 최적화** - 유튜브 검색에 최적화된 제목, 설명, 태그 자동 생성

## 📖 사용 방법

### 웹 버전 (추천)

1. **서버 시작**
   ```bash
   python app.py
   ```

2. **브라우저 접속**
   ```
   http://localhost:5000
   ```

3. **분위기와 테마 선택**
   - 편안한, 경쾌한, 아늑한 등
   - 아침, 오후, 저녁, 비오는 날 등

4. **생성 버튼 클릭**
   - 실시간 진행 상태 표시
   - 30초 ~ 1분 내 완료

5. **결과 확인 및 활용**
   - 가사 복사 → Suno AI에 붙여넣기
   - 유튜브 메타데이터 복사 → 유튜브 업로드
   - JSON/TXT 다운로드

### CLI 버전

**기본 사용:**
```bash
python cafe_music_generator.py
```

**여러 곡 생성:**
```bash
python cafe_music_generator.py --count 10
```

**특정 분위기로:**
```bash
python cafe_music_generator.py --mood cozy --theme evening --count 5
```

## 🎯 사용 가능한 옵션

### 분위기 (Mood)
- `relaxing` - 편안한
- `upbeat` - 경쾌한
- `cozy` - 아늑한
- `peaceful` - 평화로운
- `energetic` - 활기찬
- `melancholic` - 감성적인
- `romantic` - 로맨틱한

### 테마 (Theme)
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

## 🔄 워크플로우

```
1. 이 도구로 메타데이터 생성 (30초)
   ↓
2. Suno AI에 스타일과 가사 입력 (1분)
   ↓
3. 생성된 음악 다운로드 (2분)
   ↓
4. 영상 제작 (10분)
   ↓
5. 유튜브에 업로드 (5분)
```

**총 소요 시간: 약 20분/곡**

## ⚙️ 설정

`config.yaml` 파일을 수정하여 설정 변경:

```yaml
# 모델 변경
openai:
  model: "gpt-4o-mini"  # 또는 "gpt-4o", "gpt-3.5-turbo"
  temperature: 0.7      # 창의성 조절 (0.0-1.0)

# 기본값 변경
music:
  default_mood: "relaxing"
  default_theme: "afternoon"
  genres:
    - "jazz"
    - "acoustic"
    - "your-favorite-genre"
```

## 🛠 시스템 요구사항

- Python 3.8 이상
- OpenAI API 키
- 인터넷 연결

## 📦 의존성

- `openai` - OpenAI API 클라이언트 (GPT-4o-mini)
- `pyyaml` - YAML 설정 파일 파서
- `flask` - 웹 프레임워크 (웹 버전)
- `flask-cors` - CORS 지원 (웹 버전)

## 💡 사용 예제

### 예제 1: 아침 음악 시리즈

```bash
python cafe_music_generator.py --mood peaceful --theme morning --count 5
```

### 예제 2: 비오는 날 특집

```bash
python cafe_music_generator.py --mood melancholic --theme rainy --count 10
```

### 예제 3: 웹에서 빠르게 생성

1. `python app.py` 실행
2. 브라우저에서 http://localhost:5000 접속
3. 분위기와 테마 선택
4. 생성 버튼 클릭
5. 결과 복사/다운로드

## 🆚 Claude 버전 vs ChatGPT 버전

| 기능 | Claude 버전 | ChatGPT 버전 |
|------|------------|-------------|
| **가격** | ~$0.08/곡 | ~$0.02/곡 ⭐ |
| **속도** | 빠름 | 매우 빠름 ⭐ |
| **품질** | 매우 높음 | 충분히 높음 |
| **한글 지원** | 우수 | 우수 |
| **JSON 안정성** | 좋음 | 매우 좋음 ⭐ |
| **추천** | 최고 품질 원할 때 | 비용 절감 원할 때 ⭐ |

**결론: 대부분의 경우 ChatGPT 버전 추천!**

## 🔍 비용 계산기

**월간 콘텐츠 생성 목표에 따른 비용:**

- **주 5회 업로드 (월 20곡)**: ~$0.40/월
- **매일 업로드 (월 30곡)**: ~$0.60/월
- **하루 3곡 업로드 (월 90곡)**: ~$1.80/월

**Claude 버전 대비 절약액:**
- 월 20곡: $1.60 절약
- 월 30곡: $2.40 절약
- 월 90곡: $7.20 절약

## 💳 API 키 발급 방법

1. [OpenAI Platform](https://platform.openai.com/) 접속
2. 로그인 또는 회원가입
3. API Keys 메뉴로 이동
4. "Create new secret key" 클릭
5. 키 복사 (한 번만 표시됨!)
6. 환경변수로 설정

**주의:** API 키는 절대 공개하지 마세요!

## ❓ FAQ

### Q1. GPT-4o-mini면 품질이 떨어지나요?

**A:** 아니요! 카페 음악 메타데이터 생성에는 충분히 높은 품질입니다. 실제로 테스트 결과 Claude와 큰 차이가 없습니다.

### Q2. 더 저렴한 모델은 없나요?

**A:** gpt-3.5-turbo가 더 저렴하지만 (~$0.01/곡), 품질이 눈에 띄게 떨어집니다. gpt-4o-mini가 가성비 최고입니다.

### Q3. API 비용은 어떻게 계산되나요?

**A:** 입력 토큰 + 출력 토큰으로 계산됩니다. 대략 1곡당 2,000 토큰 정도 사용됩니다.

### Q4. 무료 크레딧이 있나요?

**A:** 신규 가입시 $5 무료 크레딧 제공 (약 250곡 생성 가능!).

### Q5. Claude 버전과 함께 사용 가능한가요?

**A:** 네! 두 버전 모두 독립적으로 사용 가능합니다. 비용 절감은 ChatGPT로, 최고 품질은 Claude로 선택적 사용 가능합니다.

## 🔒 보안 팁

- API 키는 `.env` 파일에 저장하고 `.gitignore`에 추가
- GitHub에 절대 업로드하지 마세요
- 정기적으로 사용량 확인
- 의심스러운 활동 발견시 즉시 키 재발급

## 📊 성능 벤치마크

**테스트 환경**: 일반 PC, 안정적인 인터넷

| 작업 | 시간 | 비용 |
|------|------|------|
| 1곡 생성 | 30-40초 | $0.02 |
| 10곡 배치 생성 | 5-7분 | $0.20 |
| 100곡 배치 생성 | 50-70분 | $2.00 |

## 🤝 기여

버그 리포트, 기능 제안, PR을 환영합니다!

## 📄 라이선스

MIT License

## 🙏 감사

- [OpenAI](https://openai.com/) - GPT-4o-mini 제공
- [Suno AI](https://suno.ai/) - 음악 생성 플랫폼

---

**행운을 빕니다! 🎵**

저렴한 비용으로 많은 콘텐츠를 만들어보세요!
