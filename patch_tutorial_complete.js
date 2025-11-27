const fs = require('fs');

// main.js 파일 읽기
let content = fs.readFileSync('main.js', 'utf8');

// 라인 끝 정규화
const originalLineEnding = content.includes('\r\n') ? '\r\n' : '\n';
content = content.replace(/\r\n/g, '\n');

// completeOnboarding 함수에 focusOnNewestStar() 호출 추가
const searchPattern = `    // 도움말 패널 표시
    showHelpPanel();
    
    console.log('🎉 온보딩 완료!');
}`;

const replacement = `    // 도움말 패널 표시
    showHelpPanel();
    
    // 튜토리얼 전에 추가된 별이 있다면 그 별로 이동
    if (currentNewestStar) {
        focusOnNewestStar();
        console.log('📍 튜토리얼 완료 후 최신 별로 이동');
    }
    
    console.log('🎉 온보딩 완료!');
}`;

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

    console.log('✅ completeOnboarding 함수 수정 완료!');
} else {
    console.error('❌ 패턴을 찾을 수 없습니다.');
    console.log('찾으려는 패턴:');
    console.log(searchPattern);
}
