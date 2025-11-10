// 전역 변수
let currentResult = null;

// DOM이 로드되면 초기화
document.addEventListener('DOMContentLoaded', function() {
    loadConfig();
    loadHistory();
    setupEventListeners();
});

// 설정 로드
async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();

        // 분위기 옵션 추가
        const moodSelect = document.getElementById('mood');
        config.moods.forEach(mood => {
            const option = document.createElement('option');
            option.value = mood.value;
            option.textContent = mood.label;
            if (mood.value === config.default_mood) {
                option.selected = true;
            }
            moodSelect.appendChild(option);
        });

        // 테마 옵션 추가
        const themeSelect = document.getElementById('theme');
        config.themes.forEach(theme => {
            const option = document.createElement('option');
            option.value = theme.value;
            option.textContent = theme.label;
            if (theme.value === config.default_theme) {
                option.selected = true;
            }
            themeSelect.appendChild(option);
        });

    } catch (error) {
        console.error('설정 로드 실패:', error);
        showToast('설정을 불러오는데 실패했습니다.', 'error');
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 생성 버튼
    document.getElementById('generateBtn').addEventListener('click', generateContent);

    // 다운로드 버튼
    document.getElementById('downloadJsonBtn').addEventListener('click', () => downloadFile('json'));
    document.getElementById('downloadTxtBtn').addEventListener('click', () => downloadFile('txt'));

    // 복사 버튼
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            copyToClipboard(targetId, this);
        });
    });
}

// 콘텐츠 생성
async function generateContent() {
    const mood = document.getElementById('mood').value;
    const theme = document.getElementById('theme').value;
    const generateBtn = document.getElementById('generateBtn');
    const progressContainer = document.getElementById('progressContainer');
    const resultContainer = document.getElementById('resultContainer');

    // UI 업데이트
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<span class="btn-icon">⏳</span> 생성 중...';
    progressContainer.style.display = 'block';
    resultContainer.style.display = 'none';

    try {
        // 생성 요청
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ mood, theme })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        // 진행 상태 폴링
        const taskId = data.task_id;
        await pollStatus(taskId);

    } catch (error) {
        console.error('생성 실패:', error);
        showToast(error.message || '생성에 실패했습니다.', 'error');

        // UI 복원
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<span class="btn-icon">✨</span> 생성하기';
        progressContainer.style.display = 'none';
    }
}

// 상태 폴링
async function pollStatus(taskId) {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const generateBtn = document.getElementById('generateBtn');
    const progressContainer = document.getElementById('progressContainer');

    const statusMessages = {
        'started': '시작 중...',
        'generating_music': '음악 메타데이터 생성 중...',
        'generating_youtube': '유튜브 메타데이터 생성 중...',
        'saving': '저장 중...',
        'completed': '완료!'
    };

    const poll = async () => {
        try {
            const response = await fetch(`/api/status/${taskId}`);
            const status = await response.json();

            if (status.error) {
                throw new Error(status.error);
            }

            // 진행률 업데이트
            progressBar.style.width = `${status.progress}%`;
            progressText.textContent = statusMessages[status.status] || status.status;

            if (status.status === 'completed') {
                // 완료
                showToast('생성이 완료되었습니다!', 'success');
                displayResult(status.result);
                loadHistory();

                // UI 복원
                generateBtn.disabled = false;
                generateBtn.innerHTML = '<span class="btn-icon">✨</span> 생성하기';
                setTimeout(() => {
                    progressContainer.style.display = 'none';
                    progressBar.style.width = '0%';
                }, 1000);

            } else if (status.status === 'error') {
                throw new Error(status.error);

            } else {
                // 계속 폴링
                setTimeout(poll, 1000);
            }

        } catch (error) {
            console.error('상태 확인 실패:', error);
            showToast(error.message || '상태 확인에 실패했습니다.', 'error');

            // UI 복원
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<span class="btn-icon">✨</span> 생성하기';
            progressContainer.style.display = 'none';
        }
    };

    poll();
}

// 결과 표시
function displayResult(result) {
    currentResult = result;

    // 음악 정보
    document.getElementById('musicTitle').textContent = result.music.title;
    document.getElementById('musicTitleEn').textContent = result.music.title_en;
    document.getElementById('musicStyle').textContent = result.music.style;
    document.getElementById('musicMood').textContent = result.music.mood;
    document.getElementById('musicTheme').textContent = result.music.theme;
    document.getElementById('musicLyrics').textContent = result.music.lyrics;

    // 유튜브 메타데이터
    document.getElementById('youtubeTitle').textContent = result.youtube.youtube_title;
    document.getElementById('youtubeDescription').textContent = result.youtube.youtube_description;

    // 태그
    const tagsContainer = document.getElementById('youtubeTags');
    tagsContainer.innerHTML = '';
    result.youtube.tags.forEach(tag => {
        const span = document.createElement('span');
        span.className = 'tag';
        span.textContent = tag;
        tagsContainer.appendChild(span);
    });

    // 해시태그
    document.getElementById('youtubeHashtags').textContent = result.youtube.hashtags.join(' ');

    // 결과 컨테이너 표시
    document.getElementById('resultContainer').style.display = 'block';

    // 스크롤
    document.getElementById('resultContainer').scrollIntoView({ behavior: 'smooth' });
}

// 히스토리 로드
async function loadHistory() {
    try {
        const response = await fetch('/api/history');
        const data = await response.json();

        const container = document.getElementById('historyContainer');

        if (data.items.length === 0) {
            container.innerHTML = '<div class="loading">생성된 항목이 없습니다.</div>';
            return;
        }

        container.innerHTML = '';
        data.items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div class="history-item-title">${item.title}</div>
                <div class="history-item-subtitle">${item.title_en}</div>
                <div class="history-item-meta">
                    <span class="history-badge">${item.mood}</span>
                    <span class="history-badge">${item.theme}</span>
                    <span class="history-badge">${formatDate(item.created_at)}</span>
                </div>
            `;
            div.addEventListener('click', () => loadDetail(item.id));
            container.appendChild(div);
        });

    } catch (error) {
        console.error('히스토리 로드 실패:', error);
    }
}

// 상세 정보 로드
async function loadDetail(itemId) {
    try {
        const response = await fetch(`/api/detail/${itemId}`);
        const result = await response.json();

        displayResult(result);

    } catch (error) {
        console.error('상세 정보 로드 실패:', error);
        showToast('상세 정보를 불러오는데 실패했습니다.', 'error');
    }
}

// 파일 다운로드
function downloadFile(fileType) {
    if (!currentResult) {
        showToast('다운로드할 결과가 없습니다.', 'error');
        return;
    }

    const url = `/api/download/${currentResult.id}/${fileType}`;
    window.open(url, '_blank');
    showToast(`${fileType.toUpperCase()} 파일 다운로드를 시작합니다.`, 'success');
}

// 클립보드 복사
async function copyToClipboard(targetId, button) {
    try {
        const element = document.getElementById(targetId);
        const text = element.textContent || element.innerText;

        await navigator.clipboard.writeText(text);

        // 버튼 피드백
        const originalText = button.textContent;
        button.textContent = '✓ 복사됨';
        button.classList.add('copied');

        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);

        showToast('클립보드에 복사되었습니다.', 'success');

    } catch (error) {
        console.error('복사 실패:', error);
        showToast('복사에 실패했습니다.', 'error');
    }
}

// Toast 메시지 표시
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 날짜 포맷팅
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;

    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}
