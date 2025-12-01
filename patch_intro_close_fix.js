// 이 파일을 main.js에서 실행하여 실시간 별 추가 시 인트로 닫기 타이밍을 수정합니다.

// 1090-1109번 라인을 찾아서 교체
const fs = require('fs');
const path = './main.js';

let content = fs.readFileSync(path, 'utf8');

// 교체할 원본 코드
const original = `            console.log('✨ 새로운 별자리 실시간 감지!', constellation);
            
            // 별자리를 3D 공간에 추가
            addConstellationToUniverse(constellation);
            
            // 인트로 화면이 현재 보이는 경우 자동으로 닫기
            const introOverlay = document.getElementById('intro-overlay');
            if (introOverlay && introOverlay.style.display !== 'none') {
                console.log('🚀 실시간 별 추가 감지 - 인트로 화면 자동 닫기');
                introOverlay.classList.add('fade-out');
                setTimeout(() => {
                    introOverlay.style.display = 'none';
                }, 1000);
            }
            
            // 대기 상태로 설정
            waitingForFirstDoubleClick = true;
            
            // "별을 더블클릭해보세요" 메시지 표시
            showNotification(\`✨ \${constellation.userName}님의 별자리가 추가되었습니다! 별을 더블클릭해보세요.\`, 'new-star');`;

// 교체될 새 코드
const replacement = `            console.log('✨ 새로운 별자리 실시간 감지!', constellation);

            // 인트로 화면이 현재 보이는 경우 자동으로 닫기
            const introOverlay = document.getElementById('intro-overlay');
            if (introOverlay && introOverlay.style.display !== 'none') {
                console.log('🚀 실시간 별 추가 감지 - 인트로 화면 자동 닫기');
                introOverlay.classList.add('fade-out');
                setTimeout(() => {
                    introOverlay.style.display = 'none';
                    
                    // 인트로가 완전히 닫힌 후에 별 추가 및 카메라 이동
                    addConstellationToUniverse(constellation);
                    waitingForFirstDoubleClick = true;
                    showNotification(\`✨ \${constellation.userName}님의 별자리가 추가되었습니다! 별을 더블클릭해보세요.\`, 'new-star');
                }, 1000);
            } else {
                // 인트로가 이미 닫혀있으면 바로 추가
                addConstellationToUniverse(constellation);
                waitingForFirstDoubleClick = true;
                showNotification(\`✨ \${constellation.userName}님의 별자리가 추가되었습니다! 별을 더블클릭해보세요.\`, 'new-star');
            }`;

content = content.replace(original, replacement);

fs.writeFileSync(path, content, 'utf8');
console.log('✅ main.js 패치 완료!');
