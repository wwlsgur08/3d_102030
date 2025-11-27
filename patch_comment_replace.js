const fs = require('fs');

// main.js 파일 읽기
let content = fs.readFileSync('main.js', 'utf8');

// 라인 끝 정규화
const originalLineEnding = content.includes('\r\n') ? '\r\n' : '\n';
content = content.replace(/\r\n/g, '\n');

// replaceDummyWithNewStar 함수를 주석 처리
const functionToComment = `// 더미 데이터를 실제 별자리로 교체
function replaceDummyWithNewStar(starData) {
    const dummyId = starData.replaceDummyId;
    
    // 더미 별 찾기 (starData 배열에서 인덱스는 dummyId - 1)
    const dummyIndex = dummyId - 1;
    if (dummyIndex < 0 || dummyIndex >= stars.length) {
        console.error(\`❌ 더미 별 ID \${dummyId} 찾을 수 없음\`);
        return;
    }
    
    const dummyStar = stars[dummyIndex];
    
    // 기존 더미 별의 위치와 스케일 유지하면서 데이터만 교체
    dummyStar.userData = {
        name: starData.name,
        simpleDescription: starData.simpleDescription,
        charms: starData.charms,
        comment: starData.comment,
        image: starData.image,
        isNewStar: true, // 실제 별자리로 표시
        timestamp: starData.timestamp,
        starId: starData.id,
        originalDummyId: dummyId
    };
    
    // 새 별을 최신 별로 설정하고 후광 추가
    setNewestStar(dummyStar);
    
    // 새 별로 카메라 자동 이동
    focusOnNewestStar();
    
    console.log(\`🔄 더미 별자리 ID \${dummyId}를 "\${starData.name}"로 교체 완료!\`);
}`;

const commented = `// [DEPRECATED] 더미 데이터를 실제 별자리로 교체 (더 이상 사용하지 않음)
// 이제 더미는 삭제되고, 실제 별은 새로운 랜덤 위치에 추가됩니다
/*
function replaceDummyWithNewStar(starData) {
    const dummyId = starData.replaceDummyId;
    
    // 더미 별 찾기 (starData 배열에서 인덱스는 dummyId - 1)
    const dummyIndex = dummyId - 1;
    if (dummyIndex < 0 || dummyIndex >= stars.length) {
        console.error(\`❌ 더미 별 ID \${dummyId} 찾을 수 없음\`);
        return;
    }
    
    const dummyStar = stars[dummyIndex];
    
    // 기존 더미 별의 위치와 스케일 유지하면서 데이터만 교체
    dummyStar.userData = {
        name: starData.name,
        simpleDescription: starData.simpleDescription,
        charms: starData.charms,
        comment: starData.comment,
        image: starData.image,
        isNewStar: true, // 실제 별자리로 표시
        timestamp: starData.timestamp,
        starId: starData.id,
        originalDummyId: dummyId
    };
    
    // 새 별을 최신 별로 설정하고 후광 추가
    setNewestStar(dummyStar);
    
    // 새 별로 카메라 자동 이동
    focusOnNewestStar();
    
    console.log(\`🔄 더미 별자리 ID \${dummyId}를 "\${starData.name}"로 교체 완료!\`);
}
*/`;

// 교체
if (content.includes(functionToComment)) {
    content = content.replace(functionToComment, commented);

    // 원래 라인 끝으로 복원
    if (originalLineEnding === '\r\n') {
        content = content.replace(/\n/g, '\r\n');
    }

    fs.writeFileSync('main.js', content, 'utf8');
    console.log('✅ replaceDummyWithNewStar 함수 주석 처리 완료!');
} else {
    console.error('❌ replaceDummyWithNewStar 함수를 찾을 수 없습니다.');
}
