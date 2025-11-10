#!/usr/bin/env python3
"""
Cafe Music Content Generator - Web Application (ChatGPT Version)
카페 음악 콘텐츠 자동 생성 시스템 - 웹 버전 (ChatGPT GPT-4o-mini)
"""

from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
from openai import OpenAI
import json
import yaml
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List
import threading
import uuid

app = Flask(__name__)
CORS(app)

# 전역 변수로 진행 상태 저장
generation_status = {}


class CafeMusicGenerator:
    def __init__(self, config_path: str = "config.yaml"):
        """초기화"""
        self.load_config(config_path)
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY 환경변수가 설정되지 않았습니다.")
        self.client = OpenAI(api_key=api_key)
        self.output_dir = Path("output")
        self.output_dir.mkdir(exist_ok=True)

    def load_config(self, config_path: str):
        """설정 파일 로드"""
        with open(config_path, 'r', encoding='utf-8') as f:
            self.config = yaml.safe_load(f)

    def generate_music_metadata(self, mood: str = None, theme: str = None) -> Dict:
        """음악 메타데이터 생성"""
        mood = mood or self.config['music']['default_mood']
        theme = theme or self.config['music']['default_theme']

        prompt = f"""당신은 카페 음악 전문가입니다. 다음 조건에 맞는 카페 음악을 위한 메타데이터를 생성해주세요.

분위기: {mood}
테마: {theme}
장르: {', '.join(self.config['music']['genres'])}

다음 형식의 JSON으로만 응답해주세요:
{{
    "title": "음악 제목 (한글, 간결하고 감성적으로)",
    "title_en": "영문 제목",
    "style": "Suno AI에 입력할 음악 스타일 (예: jazz, acoustic, bossa nova, lo-fi, chill)",
    "lyrics": "음악 가사 (영어, 4-8줄, 카페 분위기에 맞게)",
    "mood_tags": ["분위기를 나타내는 태그들"],
    "description": "이 음악의 특징과 어울리는 상황 설명 (2-3문장, 한글)"
}}"""

        response = self.client.chat.completions.create(
            model=self.config['openai']['model'],
            messages=[
                {"role": "system", "content": "You are a professional cafe music expert."},
                {"role": "user", "content": prompt}
            ],
            temperature=self.config['openai']['temperature'],
            max_tokens=self.config['openai']['max_tokens'],
            response_format={"type": "json_object"}
        )

        metadata = json.loads(response.choices[0].message.content)
        metadata['generated_at'] = datetime.now().isoformat()
        metadata['mood'] = mood
        metadata['theme'] = theme

        return metadata

    def generate_youtube_metadata(self, music_metadata: Dict) -> Dict:
        """유튜브 업로드용 메타데이터 생성"""
        prompt = f"""다음 카페 음악에 대한 유튜브 업로드용 메타데이터를 생성해주세요.

음악 정보:
- 제목: {music_metadata['title']}
- 영문 제목: {music_metadata['title_en']}
- 스타일: {music_metadata['style']}

다음 형식의 JSON으로만 응답해주세요:
{{
    "youtube_title": "유튜브 제목 (50자 이내)",
    "youtube_description": "유튜브 설명 (200-300자)",
    "tags": ["유튜브 태그 15-20개"],
    "hashtags": ["#카페음악", "#해시태그 5-7개"]
}}"""

        response = self.client.chat.completions.create(
            model=self.config['openai']['model'],
            messages=[
                {"role": "system", "content": "You are a YouTube SEO expert."},
                {"role": "user", "content": prompt}
            ],
            temperature=self.config['openai']['temperature'],
            max_tokens=self.config['openai']['max_tokens'],
            response_format={"type": "json_object"}
        )

        return json.loads(response.choices[0].message.content)

    def generate_single(self, mood: str = None, theme: str = None, task_id: str = None) -> Dict:
        """단일 곡 생성"""
        try:
            if task_id:
                generation_status[task_id] = {"status": "generating_music", "progress": 30}

            music_meta = self.generate_music_metadata(mood, theme)

            if task_id:
                generation_status[task_id] = {"status": "generating_youtube", "progress": 60}

            youtube_meta = self.generate_youtube_metadata(music_meta)

            result = {
                'id': f"cafe_music_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}",
                'music': music_meta,
                'youtube': youtube_meta
            }

            if task_id:
                generation_status[task_id] = {"status": "saving", "progress": 90}

            self.save_single_result(result)

            if task_id:
                generation_status[task_id] = {"status": "completed", "progress": 100, "result": result}

            return result

        except Exception as e:
            if task_id:
                generation_status[task_id] = {"status": "error", "error": str(e)}
            raise

    def save_single_result(self, result: Dict):
        """단일 결과를 파일로 저장"""
        output_file = self.output_dir / f"{result['id']}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        txt_file = self.output_dir / f"{result['id']}.txt"
        with open(txt_file, 'w', encoding='utf-8') as f:
            f.write("=" * 80 + "\n")
            f.write(f"카페 음악 메타데이터 - {result['id']}\n")
            f.write("=" * 80 + "\n\n")

            f.write("🎵 음악 정보\n")
            f.write("-" * 80 + "\n")
            f.write(f"제목: {result['music']['title']}\n")
            f.write(f"영문 제목: {result['music']['title_en']}\n")
            f.write(f"스타일: {result['music']['style']}\n")
            f.write(f"분위기: {result['music']['mood']}\n")
            f.write(f"테마: {result['music']['theme']}\n\n")

            f.write("📝 가사 (Suno AI용)\n")
            f.write("-" * 80 + "\n")
            f.write(result['music']['lyrics'] + "\n\n")

            f.write("🎬 유튜브 메타데이터\n")
            f.write("-" * 80 + "\n")
            f.write(f"제목: {result['youtube']['youtube_title']}\n\n")
            f.write(f"설명:\n{result['youtube']['youtube_description']}\n\n")
            f.write(f"태그: {', '.join(result['youtube']['tags'])}\n\n")
            f.write(f"해시태그: {' '.join(result['youtube']['hashtags'])}\n")


# Flask 라우트

@app.route('/')
def index():
    """메인 페이지"""
    return render_template('index.html')


@app.route('/api/config')
def get_config():
    """설정 정보 반환"""
    try:
        with open('config.yaml', 'r', encoding='utf-8') as f:
            config = yaml.safe_load(f)

        return jsonify({
            "moods": [
                {"value": "relaxing", "label": "편안한 (Relaxing)"},
                {"value": "upbeat", "label": "경쾌한 (Upbeat)"},
                {"value": "cozy", "label": "아늑한 (Cozy)"},
                {"value": "peaceful", "label": "평화로운 (Peaceful)"},
                {"value": "energetic", "label": "활기찬 (Energetic)"},
                {"value": "melancholic", "label": "감성적인 (Melancholic)"},
                {"value": "romantic", "label": "로맨틱한 (Romantic)"}
            ],
            "themes": [
                {"value": "morning", "label": "아침 (Morning)"},
                {"value": "afternoon", "label": "오후 (Afternoon)"},
                {"value": "evening", "label": "저녁 (Evening)"},
                {"value": "night", "label": "밤 (Night)"},
                {"value": "rainy", "label": "비오는 날 (Rainy)"},
                {"value": "sunny", "label": "화창한 날 (Sunny)"},
                {"value": "weekend", "label": "주말 (Weekend)"},
                {"value": "workday", "label": "평일 (Workday)"}
            ],
            "default_mood": config['music']['default_mood'],
            "default_theme": config['music']['default_theme']
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/generate', methods=['POST'])
def generate():
    """음악 메타데이터 생성"""
    try:
        data = request.json
        mood = data.get('mood')
        theme = data.get('theme')

        if not os.environ.get("OPENAI_API_KEY"):
            return jsonify({"error": "OPENAI_API_KEY 환경변수가 설정되지 않았습니다."}), 500

        task_id = str(uuid.uuid4())
        generation_status[task_id] = {"status": "started", "progress": 0}

        def generate_async():
            try:
                generator = CafeMusicGenerator()
                generator.generate_single(mood, theme, task_id)
            except Exception as e:
                generation_status[task_id] = {"status": "error", "error": str(e)}

        thread = threading.Thread(target=generate_async)
        thread.start()

        return jsonify({"task_id": task_id})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/status/<task_id>')
def get_status(task_id):
    """생성 상태 확인"""
    if task_id not in generation_status:
        return jsonify({"error": "Task not found"}), 404

    return jsonify(generation_status[task_id])


@app.route('/api/history')
def get_history():
    """생성 히스토리 조회"""
    try:
        output_dir = Path("output")
        if not output_dir.exists():
            return jsonify({"items": []})

        json_files = sorted(output_dir.glob("*.json"), key=lambda x: x.stat().st_mtime, reverse=True)

        items = []
        for json_file in json_files[:50]:
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    items.append({
                        "id": data['id'],
                        "title": data['music']['title'],
                        "title_en": data['music']['title_en'],
                        "mood": data['music']['mood'],
                        "theme": data['music']['theme'],
                        "created_at": data['music']['generated_at']
                    })
            except Exception:
                continue

        return jsonify({"items": items})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/detail/<item_id>')
def get_detail(item_id):
    """상세 정보 조회"""
    try:
        json_file = Path("output") / f"{item_id}.json"
        if not json_file.exists():
            return jsonify({"error": "Item not found"}), 404

        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        return jsonify(data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/download/<item_id>/<file_type>')
def download_file(item_id, file_type):
    """파일 다운로드"""
    try:
        if file_type == 'json':
            file_path = Path("output") / f"{item_id}.json"
            mimetype = 'application/json'
        elif file_type == 'txt':
            file_path = Path("output") / f"{item_id}.txt"
            mimetype = 'text/plain'
        else:
            return jsonify({"error": "Invalid file type"}), 400

        if not file_path.exists():
            return jsonify({"error": "File not found"}), 404

        return send_file(file_path, mimetype=mimetype, as_attachment=True, download_name=file_path.name)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    if not os.environ.get("OPENAI_API_KEY"):
        print("❌ 경고: OPENAI_API_KEY 환경변수가 설정되지 않았습니다.")
        print("   export OPENAI_API_KEY='your-api-key' 명령으로 설정하세요.")

    print("🎵 카페 음악 생성기 웹 서버 시작 (ChatGPT 버전)")
    print("   모델: GPT-4o-mini (저렴하고 빠른 버전)")
    print("   http://localhost:5000 에서 확인하세요")

    app.run(debug=True, host='0.0.0.0', port=5000)
