#!/bin/bash

# 카페 음악 배치 생성 스크립트
# 다양한 분위기와 테마의 음악을 한 번에 생성합니다

echo "🎵 카페 음악 배치 생성 시작..."
echo ""

# API 키 확인
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ 오류: ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다."
    echo "   export ANTHROPIC_API_KEY='your-api-key' 명령으로 설정하세요."
    exit 1
fi

# 아침 음악 (평화로운 분위기)
echo "🌅 아침 음악 생성 중..."
python cafe_music_generator.py --mood peaceful --theme morning --count 3

# 오후 음악 (편안한 분위기)
echo ""
echo "☀️ 오후 음악 생성 중..."
python cafe_music_generator.py --mood relaxing --theme afternoon --count 3

# 저녁 음악 (아늑한 분위기)
echo ""
echo "🌆 저녁 음악 생성 중..."
python cafe_music_generator.py --mood cozy --theme evening --count 3

# 비오는 날 특집 (감성적인 분위기)
echo ""
echo "🌧️ 비오는 날 특집 생성 중..."
python cafe_music_generator.py --mood melancholic --theme rainy --count 2

echo ""
echo "✅ 배치 생성 완료!"
echo "   총 11곡의 메타데이터가 생성되었습니다."
echo "   output/ 폴더를 확인하세요."
