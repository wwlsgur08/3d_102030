const fs = require('fs');

// main.js 파일 읽기
const content = fs.readFileSync('main.js', 'utf8');

// 수정할 내용: focusOnNewestStar 함수 시작 부분에 intro-overlay 체크 추가
const oldCode = `// 새 별에 시점만 변경 (회전축은 중앙 고정)
function focusOnNewestStar() {
    if (!currentNewestStar) return;
    
    // 회전 일시 정지 및 타이머 리셋 (3분간 정지)`;

const newCode = `// 새 별에 시점만 변경 (회전축은 중앙 고정)
function focusOnNewestStar() {
    if (!currentNewestStar) return;
    
    // 인트로 화면이 보이는 경우 카메라 이동하지 않음
    const introOverlay = document.getElementById('intro-overlay');
    if (introOverlay && introOverlay.style.display !== 'none') {
        console.log('⏸️ 시작화면 표시 중 - 카메라 이동 건너뜀');
        return;
    }
    
    // 회전 일시 정지 및 타이머 리셋 (3분간 정지)`;

// 교체
const modified = content.replace(oldCode, newCode);

// 수정된 내용 저장
fs.writeFileSync('main.js', modified, 'utf8');

console.log('✅ main.js 수정 완료!');
