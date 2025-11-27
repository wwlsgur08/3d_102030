const fs = require('fs');

// main.js 파일 읽기
let content = fs.readFileSync('main.js', 'utf8');

// 라인 끝 정규화 (Windows \r\n을 \n으로)
const originalLineEnding = content.includes('\r\n') ? '\r\n' : '\n';
content = content.replace(/\r\n/g, '\n');

// 수정할 내용: focusOnNewestStar 함수 시작 부분에 intro-overlay 체크 추가
const searchPattern = `    if (!currentNewestStar) return;
    
    // 회전 일시 정지 및 타이머 리셋 (3분간 정지)`;

const replacement = `    if (!currentNewestStar) return;
    
    // 인트로 화면이 보이는 경우 카메라 이동하지 않음
    const introOverlay = document.getElementById('intro-overlay');
    if (introOverlay && introOverlay.style.display !== 'none') {
        console.log('⏸️ 시작화면 표시 중 - 카메라 이동 건너뜀');
        return;
    }
    
    // 회전 일시 정지 및 타이머 리셋 (3분간 정지)`;

// Check if pattern exists
if (content.includes(searchPattern)) {
    // 교체
    content = content.replace(searchPattern, replacement);

    // 원래 라인 끝으로 복원
    if (originalLineEnding === '\r\n') {
        content = content.replace(/\n/g, '\r\n');
    }

    // 수정된 내용 저장
    fs.writeFileSync('main.js', content, 'utf8');

    console.log('✅ main.js 수정 완료!');
} else {
    console.error('❌ 패턴을 찾을 수 없습니다.');
}
