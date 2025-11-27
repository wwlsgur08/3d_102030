const fs = require('fs');

// main.js 파일 읽기
let content = fs.readFileSync('main.js', 'utf8');

// 라인 끝 정규화
const originalLineEnding = content.includes('\r\n') ? '\r\n' : '\n';
content = content.replace(/\r\n/g, '\n');

// updateZoomIndicator 함수 수정
const oldFunction = `// 줌 인디케이터 업데이트
function updateZoomIndicator() {
    const zoomBarFill = document.getElementById('zoom-bar-fill');
    const zoomValue = document.getElementById('zoom-value');
    
    if (!zoomBarFill || !zoomValue) return;
    
    // 카메라 거리 기반으로 줌 레벨 계산 (2.0이 기본값, 1.0이 최대 줌인, 5.0이 최대 줌아웃)
    const currentDistance = camera.position.length();
    const minDistance = 1.0; // 최대 줌인
    const maxDistance = 5.0; // 최대 줌아웃
    const defaultDistance = 2.0; // 기본값
    
    // 100%를 기준으로 계산 (거리가 가까울수록 확대)
    const zoomPercent = Math.round(((maxDistance - currentDistance) / (maxDistance - minDistance)) * 100);
    const clampedPercent = Math.max(0, Math.min(100, zoomPercent));
    
    zoomBarFill.style.height = clampedPercent + '%';
    zoomValue.textContent = clampedPercent + '%';
}`;

const newFunction = `// 줌 인디케이터 업데이트
function updateZoomIndicator() {
    const zoomBarFill = document.getElementById('zoom-bar-fill');
    const zoomValue = document.getElementById('zoom-value');
    
    if (!zoomBarFill || !zoomValue) return;
    
    // 카메라 거리 기반으로 줌 레벨 계산 (2.0이 기본값, 1.0이 최대 줌인, 5.0이 최대 줌아웃)
    const currentDistance = camera.position.length();
    const minDistance = 1.0; // 최대 줌인
    const maxDistance = 5.0; // 최대 줌아웃
    const defaultDistance = 2.0; // 기본값
    
    // 100%를 기준으로 계산 (거리가 가까울수록 확대)
    const rawPercent = ((maxDistance - currentDistance) / (maxDistance - minDistance)) * 100;
    
    // 53%를 0%로, 100%를 100%로 리매핑 (53~100 범위를 0~100으로)
    const remappedPercent = Math.round(((rawPercent - 53) / (100 - 53)) * 100);
    const clampedPercent = Math.max(0, Math.min(100, remappedPercent));
    
    zoomBarFill.style.height = clampedPercent + '%';
    zoomValue.textContent = clampedPercent + '%';
}`;

// 교체
if (content.includes(oldFunction)) {
    content = content.replace(oldFunction, newFunction);

    // 원래 라인 끝으로 복원
    if (originalLineEnding === '\r\n') {
        content = content.replace(/\n/g, '\r\n');
    }

    fs.writeFileSync('main.js', content, 'utf8');
    console.log('✅ updateZoomIndicator 함수 수정 완료! (53% → 0%)');
} else {
    console.error('❌ updateZoomIndicator 함수를 찾을 수 없습니다.');
}
