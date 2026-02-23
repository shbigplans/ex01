# 🌐 카페 음악 생성기 - 웹 버전 가이드

웹 브라우저에서 쉽게 사용할 수 있는 버전입니다!

## ✨ 웹 버전의 장점

- 🖱️ **직관적인 UI**: 마우스 클릭만으로 모든 작업 가능
- 👀 **실시간 미리보기**: 생성 결과를 바로 확인
- 📋 **원클릭 복사**: 클립보드로 즉시 복사
- 📥 **쉬운 다운로드**: JSON, TXT 파일 다운로드
- 📚 **히스토리 관리**: 이전 생성 결과 쉽게 조회
- 📱 **반응형 디자인**: 모바일에서도 사용 가능

---

## 🚀 빠른 시작

### 1단계: 의존성 설치

```bash
pip install -r requirements.txt
```

설치되는 패키지:
- `anthropic` - Claude AI API
- `pyyaml` - 설정 파일 파서
- `flask` - 웹 프레임워크
- `flask-cors` - CORS 지원

### 2단계: API 키 설정

```bash
export ANTHROPIC_API_KEY='your-api-key-here'
```

**Windows (PowerShell):**
```powershell
$env:ANTHROPIC_API_KEY='your-api-key-here'
```

### 3단계: 웹 서버 실행

```bash
python app.py
```

출력 예시:
```
🎵 카페 음악 생성기 웹 서버 시작
   http://localhost:5000 에서 확인하세요
 * Running on http://0.0.0.0:5000
```

### 4단계: 브라우저에서 접속

브라우저를 열고 다음 주소로 접속:
```
http://localhost:5000
```

---

## 📖 사용 방법

### 메인 화면 구성

```
┌─────────────────────────────────────┐
│  🎵 카페 음악 콘텐츠 생성기         │
│  AI가 자동으로 음악 메타데이터를... │
├─────────────────────────────────────┤
│                                     │
│  [새 음악 메타데이터 생성]          │
│  분위기: [드롭다운]                 │
│  테마:   [드롭다운]                 │
│  [✨ 생성하기]                      │
│                                     │
├─────────────────────────────────────┤
│  [생성 결과]                        │
│  - 음악 정보                        │
│  - 가사                             │
│  - 유튜브 메타데이터                │
│                                     │
├─────────────────────────────────────┤
│  [생성 히스토리]                    │
│  - 최근 생성 목록                   │
└─────────────────────────────────────┘
```

### 단계별 사용법

#### 1. 분위기와 테마 선택

**분위기 옵션:**
- 편안한 (Relaxing)
- 경쾌한 (Upbeat)
- 아늑한 (Cozy)
- 평화로운 (Peaceful)
- 활기찬 (Energetic)
- 감성적인 (Melancholic)
- 로맨틱한 (Romantic)

**테마 옵션:**
- 아침 (Morning)
- 오후 (Afternoon)
- 저녁 (Evening)
- 밤 (Night)
- 비오는 날 (Rainy)
- 화창한 날 (Sunny)
- 주말 (Weekend)
- 평일 (Workday)

#### 2. 생성하기 버튼 클릭

버튼을 클릭하면:
1. 버튼이 "생성 중..."으로 변경
2. 진행률 바 표시
3. 실시간 진행 상태 업데이트:
   - "음악 메타데이터 생성 중..."
   - "유튜브 메타데이터 생성 중..."
   - "저장 중..."
   - "완료!"

#### 3. 결과 확인

생성이 완료되면 아래와 같은 정보가 표시됩니다:

**🎵 음악 정보:**
- 제목 (한글)
- 영문 제목
- 스타일 (Suno AI용)
- 분위기
- 테마

**📝 가사 (Suno AI용):**
- 영어 가사
- [복사] 버튼으로 클립보드에 복사

**🎬 유튜브 메타데이터:**
- 제목 (SEO 최적화)
- 설명 (200-300자)
- 태그 (15-20개)
- 해시태그 (5-7개)

#### 4. 클립보드 복사

각 섹션마다 [복사] 버튼:
- 클릭하면 자동으로 클립보드에 복사
- "✓ 복사됨" 피드백 표시
- Suno AI나 유튜브에 바로 붙여넣기

#### 5. 파일 다운로드

결과 화면 상단에 다운로드 버튼:
- **JSON 다운로드**: 기계가 읽는 형식
- **TXT 다운로드**: 사람이 읽기 쉬운 형식

#### 6. 히스토리 조회

하단의 "생성 히스토리" 섹션:
- 최근 생성한 50개 항목 표시
- 항목 클릭하면 결과 다시 표시
- 실시간으로 업데이트

---

## 🎯 실전 활용법

### 워크플로우 1: Suno AI 연동

1. 웹에서 음악 메타데이터 생성
2. "가사" 섹션의 [복사] 버튼 클릭
3. Suno AI 열기
4. "Lyrics" 필드에 붙여넣기
5. "스타일" 복사하여 "Style of Music"에 입력
6. 음악 생성!

### 워크플로우 2: 유튜브 업로드

1. Suno AI에서 음악 다운로드
2. 영상 제작
3. 유튜브 스튜디오 업로드 페이지 열기
4. 웹에서 "유튜브 제목" 복사 → 붙여넣기
5. "설명" 복사 → 붙여넣기
6. "태그" 복사 → 붙여넣기
7. 업로드 완료!

### 워크플로우 3: 배치 작업

**방법 1: 웹에서 반복**
```
1. 생성하기 클릭
2. 다운로드 (JSON, TXT)
3. 새로고침 없이 바로 다음 곡 생성
4. 반복
```

**방법 2: 명령줄 사용**
```bash
# 터미널에서 배치 생성
python cafe_music_generator.py --count 10

# 웹에서 히스토리로 확인
```

---

## 🔧 고급 기능

### API 엔드포인트

웹 애플리케이션은 REST API를 제공합니다:

```
GET  /                        - 메인 페이지
GET  /api/config              - 설정 정보
POST /api/generate            - 메타데이터 생성
GET  /api/status/<task_id>    - 생성 상태 확인
GET  /api/history             - 히스토리 조회
GET  /api/detail/<item_id>    - 상세 정보
GET  /api/download/<id>/<type> - 파일 다운로드
```

### 프로그래밍 방식 사용

**JavaScript (fetch):**
```javascript
// 생성 요청
const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        mood: 'relaxing',
        theme: 'afternoon'
    })
});
const data = await response.json();
console.log('Task ID:', data.task_id);
```

**Python (requests):**
```python
import requests

# 생성 요청
response = requests.post('http://localhost:5000/api/generate',
    json={'mood': 'relaxing', 'theme': 'afternoon'})
task_id = response.json()['task_id']

# 상태 확인
status = requests.get(f'http://localhost:5000/api/status/{task_id}')
print(status.json())
```

---

## 💡 팁과 트릭

### 1. 키보드 단축키

브라우저 기본 단축키 활용:
- `Tab` - 다음 필드로 이동
- `Enter` - 생성 버튼 활성화 (포커스시)
- `Ctrl+C` / `Cmd+C` - 선택한 텍스트 복사

### 2. 빠른 작업

- 드롭다운에서 화살표 키로 빠르게 선택
- 생성 중에도 스크롤하여 히스토리 확인 가능
- 여러 탭을 열어서 동시에 여러 생성 작업 가능

### 3. 모바일 사용

- 모바일 브라우저에서도 완벽 작동
- 터치로 복사 버튼 클릭
- 반응형 디자인으로 작은 화면 최적화

### 4. 북마크 활용

자주 사용하는 경우:
```
http://localhost:5000
```
을 브라우저 북마크에 추가

### 5. 히스토리 활용

- 과거 생성 결과 재사용
- A/B 테스트 (여러 버전 비교)
- 베스트 결과 선택

---

## 🐛 트러블슈팅

### 문제 1: 페이지가 로드되지 않음

**증상:**
```
This site can't be reached
```

**해결책:**
```bash
# 1. 서버가 실행 중인지 확인
ps aux | grep app.py

# 2. 포트가 사용 중인지 확인
lsof -i :5000

# 3. 서버 재시작
python app.py
```

### 문제 2: API 키 오류

**증상:**
```
ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.
```

**해결책:**
```bash
# API 키 설정 확인
echo $ANTHROPIC_API_KEY

# 없으면 다시 설정
export ANTHROPIC_API_KEY='your-api-key'

# 서버 재시작
python app.py
```

### 문제 3: 생성이 시작되지 않음

**증상:**
- 생성 버튼 클릭해도 반응 없음
- 또는 "생성 중..." 상태에서 멈춤

**해결책:**
1. 브라우저 개발자 도구 열기 (F12)
2. Console 탭에서 에러 확인
3. Network 탭에서 요청 상태 확인
4. 서버 터미널에서 에러 로그 확인

### 문제 4: 복사 버튼이 작동하지 않음

**증상:**
- [복사] 버튼 클릭해도 복사 안 됨

**해결책:**
- HTTPS가 아닌 경우 일부 브라우저에서 제한
- 텍스트를 직접 선택하여 `Ctrl+C`로 복사
- 또는 크롬/파이어폭스 최신 버전 사용

### 문제 5: 히스토리가 비어있음

**증상:**
- "생성된 항목이 없습니다."

**원인:**
- `output/` 폴더가 비어있음

**해결책:**
- 먼저 콘텐츠를 생성하세요
- 또는 명령줄로 생성:
  ```bash
  python cafe_music_generator.py
  ```

---

## 🔒 보안 고려사항

### 프로덕션 환경

웹 버전을 인터넷에 공개하려면:

**1. 디버그 모드 끄기**
```python
# app.py 마지막 줄 수정
app.run(debug=False, host='0.0.0.0', port=5000)
```

**2. 환경변수 보안**
```bash
# .env 파일 사용
pip install python-dotenv

# app.py에 추가
from dotenv import load_dotenv
load_dotenv()
```

**3. 인증 추가**
```python
# Flask-Login 또는 Flask-HTTPAuth 사용
pip install flask-login
```

**4. HTTPS 사용**
```bash
# Let's Encrypt 인증서 사용
# 또는 Nginx 리버스 프록시
```

**5. 레이트 리밋**
```python
# Flask-Limiter 사용
pip install flask-limiter
```

---

## 📊 성능 최적화

### 1. 캐싱

자주 사용하는 설정 캐싱:
```python
from functools import lru_cache

@lru_cache(maxsize=1)
def get_config():
    # 설정 로드
    pass
```

### 2. 비동기 처리

현재는 스레드 사용, 더 나은 성능을 위해:
```python
# Celery 사용
pip install celery redis
```

### 3. 데이터베이스

많은 히스토리 관리:
```python
# SQLite 또는 PostgreSQL 사용
pip install sqlalchemy
```

---

## 🚢 배포

### 로컬 네트워크

같은 네트워크의 다른 기기에서 접속:

```bash
# 서버 IP 확인
hostname -I

# 다른 기기에서 접속
http://192.168.x.x:5000
```

### 클라우드 배포

**Heroku:**
```bash
# Procfile 생성
echo "web: python app.py" > Procfile

# 배포
git push heroku main
```

**AWS EC2:**
```bash
# Gunicorn 사용
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

**Docker:**
```dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "app.py"]
```

---

## 🎓 추가 학습 자료

- [Flask 공식 문서](https://flask.palletsprojects.com/)
- [Anthropic API 문서](https://docs.anthropic.com/)
- [웹 개발 기초 - MDN](https://developer.mozilla.org/)

---

## 💬 피드백

웹 버전에 대한 제안이나 버그 리포트:
- GitHub Issues
- 이메일
- 기타 연락처

---

**즐거운 음악 제작 되세요! 🎵**
