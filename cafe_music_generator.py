#!/usr/bin/env python3
"""
Cafe Music Content Generator
카페 음악 콘텐츠 자동 생성 시스템
"""

import anthropic
import json
import yaml
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List


class CafeMusicGenerator:
    def __init__(self, config_path: str = "config.yaml"):
        """초기화"""
        self.load_config(config_path)
        self.client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
        self.output_dir = Path("output")
        self.output_dir.mkdir(exist_ok=True)

    def load_config(self, config_path: str):
        """설정 파일 로드"""
        with open(config_path, 'r', encoding='utf-8') as f:
            self.config = yaml.safe_load(f)

    def generate_music_metadata(self, mood: str = None, theme: str = None) -> Dict:
        """
        음악 메타데이터 생성 (제목, 가사, 스타일)

        Args:
            mood: 분위기 (예: relaxing, upbeat, cozy)
            theme: 테마 (예: morning, afternoon, rainy day)

        Returns:
            제목, 가사, 스타일이 포함된 딕셔너리
        """
        mood = mood or self.config['music']['default_mood']
        theme = theme or self.config['music']['default_theme']

        prompt = f"""당신은 카페 음악 전문가입니다. 다음 조건에 맞는 카페 음악을 위한 메타데이터를 생성해주세요.

분위기: {mood}
테마: {theme}
장르: {', '.join(self.config['music']['genres'])}

다음 형식의 JSON으로 응답해주세요:
{{
    "title": "음악 제목 (한글, 간결하고 감성적으로)",
    "title_en": "영문 제목",
    "style": "Suno AI에 입력할 음악 스타일 (예: jazz, acoustic, bossa nova, lo-fi, chill)",
    "lyrics": "음악 가사 (영어, 4-8줄, 카페 분위기에 맞게)",
    "mood_tags": ["분위기를 나타내는 태그들"],
    "description": "이 음악의 특징과 어울리는 상황 설명 (2-3문장, 한글)"
}}

카페에서 편안하게 들을 수 있고, 집중력을 높이거나 휴식을 취하기 좋은 음악이 되도록 해주세요."""

        message = self.client.messages.create(
            model=self.config['claude']['model'],
            max_tokens=self.config['claude']['max_tokens'],
            messages=[{"role": "user", "content": prompt}]
        )

        # JSON 추출
        response_text = message.content[0].text
        # JSON 부분만 추출 (```json ... ``` 처리)
        if "```json" in response_text:
            json_str = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            json_str = response_text.split("```")[1].split("```")[0].strip()
        else:
            json_str = response_text.strip()

        metadata = json.loads(json_str)
        metadata['generated_at'] = datetime.now().isoformat()
        metadata['mood'] = mood
        metadata['theme'] = theme

        return metadata

    def generate_youtube_metadata(self, music_metadata: Dict) -> Dict:
        """
        유튜브 업로드용 메타데이터 생성 (제목, 설명, 태그)

        Args:
            music_metadata: generate_music_metadata()로 생성된 음악 메타데이터

        Returns:
            유튜브 제목, 설명, 태그가 포함된 딕셔너리
        """
        prompt = f"""다음 카페 음악에 대한 유튜브 업로드용 메타데이터를 생성해주세요.

음악 정보:
- 제목: {music_metadata['title']}
- 영문 제목: {music_metadata['title_en']}
- 스타일: {music_metadata['style']}
- 설명: {music_metadata['description']}
- 분위기: {music_metadata['mood']}
- 테마: {music_metadata['theme']}

다음 형식의 JSON으로 응답해주세요:
{{
    "youtube_title": "유튜브 제목 (50자 이내, 클릭을 유도하면서도 정확하게)",
    "youtube_description": "유튜브 설명 (200-300자, 음악 소개, 추천 상황, 구독 유도 포함)",
    "tags": ["유튜브 태그 15-20개", "한글과 영문 혼합", "카페음악", "관련 키워드"],
    "hashtags": ["#카페음악", "#해시태그 5-7개"]
}}

유튜브 SEO를 고려하여 검색이 잘 되도록 작성해주세요."""

        message = self.client.messages.create(
            model=self.config['claude']['model'],
            max_tokens=self.config['claude']['max_tokens'],
            messages=[{"role": "user", "content": prompt}]
        )

        response_text = message.content[0].text
        if "```json" in response_text:
            json_str = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            json_str = response_text.split("```")[1].split("```")[0].strip()
        else:
            json_str = response_text.strip()

        return json.loads(json_str)

    def generate_batch(self, count: int = 5, mood: str = None, theme: str = None) -> List[Dict]:
        """
        여러 곡의 메타데이터를 한 번에 생성

        Args:
            count: 생성할 곡 수
            mood: 분위기
            theme: 테마

        Returns:
            생성된 메타데이터 리스트
        """
        results = []

        for i in range(count):
            print(f"\n[{i+1}/{count}] 음악 메타데이터 생성 중...")

            # 음악 메타데이터 생성
            music_meta = self.generate_music_metadata(mood, theme)
            print(f"  ✓ 제목: {music_meta['title']}")
            print(f"  ✓ 스타일: {music_meta['style']}")

            # 유튜브 메타데이터 생성
            print(f"  유튜브 메타데이터 생성 중...")
            youtube_meta = self.generate_youtube_metadata(music_meta)
            print(f"  ✓ 유튜브 제목: {youtube_meta['youtube_title']}")

            # 통합
            result = {
                'id': f"cafe_music_{datetime.now().strftime('%Y%m%d')}_{i+1:03d}",
                'music': music_meta,
                'youtube': youtube_meta
            }

            results.append(result)

            # 개별 파일로 저장
            self.save_single_result(result)

        return results

    def save_single_result(self, result: Dict):
        """단일 결과를 파일로 저장"""
        output_file = self.output_dir / f"{result['id']}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        # 읽기 쉬운 텍스트 버전도 저장
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

        print(f"  ✓ 저장 완료: {output_file.name}")

    def save_batch_summary(self, results: List[Dict], filename: str = None):
        """배치 결과 요약본 저장"""
        if filename is None:
            filename = f"batch_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

        summary_file = self.output_dir / filename
        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)

        print(f"\n✓ 배치 요약 저장: {summary_file}")


def main():
    """메인 함수"""
    import argparse

    parser = argparse.ArgumentParser(description='카페 음악 콘텐츠 자동 생성')
    parser.add_argument('--count', type=int, default=1, help='생성할 곡 수 (기본: 1)')
    parser.add_argument('--mood', type=str, help='분위기 (예: relaxing, upbeat, cozy)')
    parser.add_argument('--theme', type=str, help='테마 (예: morning, afternoon, rainy)')
    parser.add_argument('--config', type=str, default='config.yaml', help='설정 파일 경로')

    args = parser.parse_args()

    # API 키 확인
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("❌ 오류: ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.")
        print("   export ANTHROPIC_API_KEY='your-api-key' 명령으로 설정하세요.")
        return

    print("🎵 카페 음악 콘텐츠 생성기 시작")
    print(f"   생성할 곡 수: {args.count}")
    if args.mood:
        print(f"   분위기: {args.mood}")
    if args.theme:
        print(f"   테마: {args.theme}")
    print()

    try:
        generator = CafeMusicGenerator(args.config)
        results = generator.generate_batch(args.count, args.mood, args.theme)
        generator.save_batch_summary(results)

        print(f"\n✅ 완료! {len(results)}곡의 메타데이터가 생성되었습니다.")
        print(f"   출력 폴더: {generator.output_dir.absolute()}")

    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
