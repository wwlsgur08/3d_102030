const fs = require('fs');

// main.js 파일 읽기
let content = fs.readFileSync('main.js', 'utf8');

// 라인 끝 정규화
const originalLineEnding = content.includes('\r\n') ? '\r\n' : '\n';
content = content.replace(/\r\n/g, '\n');

// addNewStarToUniverse 함수 전체를 교체
const oldFunction = `// 새 별을 3D 우주에 추가
function addNewStarToUniverse(starData) {
    // 이전 후광 제거
    removeCurrentHalo();
    
    // 더미 데이터 교체가 필요한 경우
    if (starData.replaceDummyId) {
        replaceDummyWithNewStar(starData);
        return;
    }
    
    // 새로운 별 생성 (일반 추가)
    const starMaterial = new THREE.SpriteMaterial({ 
        map: starTextures[Math.floor(Math.random() * starTextures.length)], 
        transparent: true 
    });
    const newStar = new THREE.Sprite(starMaterial);
    
    // 랜덤한 위치에 배치 (구체 표면)
    const phi = Math.acos((2 * Math.random()) - 1);
    const theta = Math.random() * 2 * Math.PI;
    newStar.position.set(
        sphereRadius * Math.cos(theta) * Math.sin(phi), 
        sphereRadius * Math.sin(theta) * Math.sin(phi), 
        sphereRadius * Math.cos(phi)
    );
    newStar.scale.set(0.3, 0.3, 0.3);
    
    // 별 데이터 저장
    newStar.userData = {
        name: starData.name,
        simpleDescription: starData.simpleDescription,
        charms: starData.charms,
        comment: starData.comment,
        image: starData.image,
        isNewStar: true,
        timestamp: starData.timestamp,
        starId: starData.id
    };
    
    // 별 배열과 씬에 추가
    stars.push(newStar);
    scene.add(newStar);
    
    // 새 별을 최신 별로 설정하고 후광 추가
    setNewestStar(newStar);
    
    // 새 별로 카메라 자동 이동 (부드럽게)
    focusOnNewestStar();
    
    console.log(\`🌟 새로운 별 "\${starData.name}" 추가 완료! (총 \${stars.length}개)\`);
}`;

const newFunction = `// 새 별을 3D 우주에 추가
function addNewStarToUniverse(starData) {
    // 이전 후광 제거
    removeCurrentHalo();
    
    // 더미 별 하나 찾아서 제거
    const dummyIndex = stars.findIndex(star => !star.userData.isNewStar);
    if (dummyIndex !== -1) {
        const dummyStar = stars[dummyIndex];
        scene.remove(dummyStar);
        stars.splice(dummyIndex, 1);
        console.log(\`🗑️ 더미 별 제거 (남은 더미: \${stars.filter(s => !s.userData.isNewStar).length}개)\`);
    }
    
    // 새로운 별 생성 (일반 추가)
    const starMaterial = new THREE.SpriteMaterial({ 
        map: starTextures[Math.floor(Math.random() * starTextures.length)], 
        transparent: true 
    });
    const newStar = new THREE.Sprite(starMaterial);
    
    // 랜덤한 위치에 배치 (구체 표면)
    const phi = Math.acos((2 * Math.random()) - 1);
    const theta = Math.random() * 2 * Math.PI;
    newStar.position.set(
        sphereRadius * Math.cos(theta) * Math.sin(phi), 
        sphereRadius * Math.sin(theta) * Math.sin(phi), 
        sphereRadius * Math.cos(phi)
    );
    newStar.scale.set(0.3, 0.3, 0.3);
    
    // 별 데이터 저장
    newStar.userData = {
        name: starData.name,
        simpleDescription: starData.simpleDescription,
        charms: starData.charms,
        comment: starData.comment,
        image: starData.image,
        isNewStar: true,
        timestamp: starData.timestamp,
        starId: starData.id
    };
    
    // 별 배열과 씬에 추가
    stars.push(newStar);
    scene.add(newStar);
    
    // 새 별을 최신 별로 설정하고 후광 추가
    setNewestStar(newStar);
    
    // 새 별로 카메라 자동 이동 (부드럽게)
    focusOnNewestStar();
    
    console.log(\`🌟 새로운 별 "\${starData.name}" 추가 완료! (총 \${stars.length}개, 실제: \${stars.filter(s => s.userData.isNewStar).length}개)\`);
}`;

// 교체
if (content.includes(oldFunction)) {
    content = content.replace(oldFunction, newFunction);

    // 원래 라인 끝으로 복원
    if (originalLineEnding === '\r\n') {
        content = content.replace(/\n/g, '\r\n');
    }

    fs.writeFileSync('main.js', content, 'utf8');
    console.log('✅ addNewStarToUniverse 함수 수정 완료!');
} else {
    console.error('❌ addNewStarToUniverse 함수를 찾을 수 없습니다.');
}
