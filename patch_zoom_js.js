const fs = require('fs');

// main.js 파일 읽기
let content = fs.readFileSync('main.js', 'utf8');

// 라인 끝 정규화
const originalLineEnding = content.includes('\r\n') ? '\r\n' : '\n';
content = content.replace(/\r\n/g, '\n');

// animate() 함수 내에서 controls.update() 다음에 줌 인디케이터 업데이트 추가
const searchPattern = `    controls.update();

    // 영구 후광 업데이트
    updatePermanentHalo();`;

const replacement = `    controls.update();
    
    // 줌 인디케이터 업데이트
    updateZoomIndicator();

    // 영구 후광 업데이트
    updatePermanentHalo();`;

// updateZoomIndicator 함수 추가 (animate 함수 뒤에)
const animateFunctionEnd = `function animate() {`;
const insertPosition = content.indexOf('// 온보딩 시작 함수');

if (insertPosition !== -1) {
    const beforeInsert = content.substring(0, insertPosition);
    const afterInsert = content.substring(insertPosition);

    const zoomFunction = `// 줌 인디케이터 업데이트
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
}

`;

    content = beforeInsert + zoomFunction + afterInsert;
}

// animate 함수 내 controls.update() 수정
if (content.includes(searchPattern)) {
    content = content.replace(searchPattern, replacement);
}

// 원래 라인 끝으로 복원
if (originalLineEnding === '\r\n') {
    content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync('main.js', content, 'utf8');
console.log('✅ 줌 인디케이터 JavaScript 추가 완료!');
