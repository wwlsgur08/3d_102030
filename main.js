import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { gsap } from 'gsap';

// 전역 변수들 
let socket = null;
let currentNewestStar = null; // 가장 최근 별 (후광 표시용)
let currentHalo = null; // 현재 후광 객체
const pageLoadTime = Date.now(); // 페이지 로드 시간 기록

// 온보딩 시스템 변수
let onboardingStep = 0; // 현재 온보딩 단계 (0: 비활성, 1-6: 각 단계)
let onboardingActive = false; // 온보딩 진행 중 여부
const ONBOARDING_STEPS = [
    { action: 'drag', message: '마우스로 드래그해서 우주를 돌려보세요!', icon: '🖱️' },
    { action: 'zoom', message: '마우스 휠로 확대/축소해보세요!', icon: '🔍' },
    { action: 'hover', message: '별에 마우스를 올려보세요!', icon: '⭐' },
    { action: 'click', message: '더블클릭으로 별 상세보기를 해보세요!', icon: '👆' },
    { action: 'close', message: '× 버튼으로 창을 닫아보세요!', icon: '❌' },
    { action: 'complete', message: '완벽해요! 이제 자유롭게 탐험하세요!', icon: '🎉' }
];

// 인트로 화면 제어 함수
window.startExploration = function() {
    const introOverlay = document.getElementById('intro-overlay');
    
    introOverlay.classList.add('fade-out');
    
    // 1초 후 완전히 제거하고 온보딩 시작 체크
    setTimeout(() => {
        introOverlay.style.display = 'none';
        
        // 항상 온보딩 시작 (탐험 떠나기 버튼 클릭할 때마다)
        startOnboarding();
    }, 1000);
    
    console.log('🚀 탐험 시작! 인트로 화면 제거');
};

// 도움말 패널 표시 함수
function showHelpPanel() {
    const helpPanel = document.getElementById('help-panel');
    const helpToggleBtn = document.getElementById('help-toggle-btn');
    
    // 모바일 체크
    const isMobile = window.innerWidth <= 480;
    
    if (isMobile) {
        // 모바일: i 아이콘만 표시하고 도움말은 숨김
        helpToggleBtn.style.display = 'block';
        helpPanel.style.display = 'none';
    } else {
        // 데스크톱: 도움말 패널 표시
        helpPanel.style.display = 'block';
        helpToggleBtn.style.display = 'none';
    }
    
    // 도움말 토글 기능 초기화
    initHelpToggle();
}

// 도움말 토글 기능 초기화
function initHelpToggle() {
    const helpPanel = document.getElementById('help-panel');
    const helpToggleBtn = document.getElementById('help-toggle-btn');
    const helpCloseBtn = document.getElementById('help-close-btn');
    
    // i 아이콘 클릭시 도움말 표시
    helpToggleBtn.addEventListener('click', function() {
        helpPanel.style.display = 'block';
        helpToggleBtn.style.display = 'none';
        console.log('ℹ️ 도움말 패널 열기');
    });
    
    // 터치 이벤트도 추가
    helpToggleBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        helpPanel.style.display = 'block';
        helpToggleBtn.style.display = 'none';
        console.log('📱 터치로 도움말 패널 열기');
    });
    
    // X 버튼 클릭시 도움말 숨김
    helpCloseBtn.addEventListener('click', function() {
        helpPanel.style.display = 'none';
        helpToggleBtn.style.display = 'block';
        console.log('✖️ 도움말 패널 닫기');
    });
    
    // X 버튼 터치 이벤트도 추가
    helpCloseBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        helpPanel.style.display = 'none';
        helpToggleBtn.style.display = 'block';
        console.log('📱 터치로 도움말 패널 닫기');
    });
}

// 화면 크기 변경시 도움말 표시 방식 조정
window.addEventListener('resize', function() {
    const helpPanel = document.getElementById('help-panel');
    const helpToggleBtn = document.getElementById('help-toggle-btn');
    const isMobile = window.innerWidth <= 480;
    
    if (isMobile) {
        // 모바일 모드: 도움말이 열려있지 않다면 i 아이콘만 표시
        if (helpPanel.style.display === 'none' || !helpPanel.style.display) {
            helpToggleBtn.style.display = 'block';
            helpPanel.style.display = 'none';
        }
    } else {
        // 데스크톱 모드: 도움말 패널 표시, i 아이콘 숨김
        helpPanel.style.display = 'block';
        helpToggleBtn.style.display = 'none';
    }
});


// clearTestStars를 전역 함수로 만들기
// Firebase에서 모든 별자리 삭제
window.clearAllConstellations = function() {
    const confirmation = confirm('⚠️ Firebase에 저장된 모든 별자리를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다!');
    
    if (!confirmation) {
        return;
    }
    
    try {
        const database = window.firebaseDatabase;
        
        // Firebase에서 모든 별자리 삭제
        database.ref('constellations').remove()
            .then(() => {
                console.log('🗑️ Firebase 별자리 모두 삭제 완료');
                
                // 화면에서 IPAD_ATSER에서 온 별들 제거
                const ipadStars = stars.filter(star => star.userData.isFromIPAD);
                ipadStars.forEach(star => {
                    const index = stars.indexOf(star);
                    if (index > -1) {
                        stars.splice(index, 1);
                    }
                    scene.remove(star);
                });
                
                // 후광 제거
                removeCurrentHalo();
                currentNewestStar = null;
                
                showNotification(`🗑️ ${ipadStars.length}개의 별자리가 삭제되었습니다`, 'success');
                console.log(`✅ ${ipadStars.length}개 별자리 삭제 완료`);
            })
            .catch(error => {
                console.error('❌ Firebase 삭제 실패:', error);
                showNotification('❌ 삭제 실패: ' + error.message, 'error');
            });
            
    } catch (error) {
        console.error('❌ 별자리 삭제 오류:', error);
        showNotification('❌ 오류 발생: ' + error.message, 'error');
    }
};

// 이전 테스트 별 삭제 함수 (호환성 유지)
window.clearTestStars = function() {
    const testStars = stars.filter(star => star.userData.isNewStar);
    
    if (testStars.length === 0) {
        showNotification('삭제할 테스트 별이 없습니다', 'info');
        return;
    }
    
    // 후광 제거
    removeCurrentHalo();
    currentNewestStar = null;
    
    let deletedCount = 0;
    let revertedCount = 0;
    
    // 테스트 별들 처리
    testStars.forEach(testStar => {
        const userData = testStar.userData;
        
        // 더미 데이터를 교체한 경우 → 원래 더미 데이터로 복원
        if (userData.originalDummyId) {
            const originalDummyData = starData[userData.originalDummyId - 1]; // 인덱스는 -1
            testStar.userData = {
                name: originalDummyData.name,
                simpleDescription: originalDummyData.simpleDescription,
                charms: originalDummyData.charms,
                comment: originalDummyData.comment,
                image: originalDummyData.image,
                isNewStar: false // 더미로 복원
            };
            revertedCount++;
            console.log(`🔄 더미 별자리 ID ${userData.originalDummyId} 복원`);
        } else {
            // 새로 추가된 별 → 완전 삭제
            const index = stars.indexOf(testStar);
            if (index > -1) {
                stars.splice(index, 1);
            }
            scene.remove(testStar);
            deletedCount++;
        }
    });
    
    showNotification(`🗑️ ${deletedCount}개 삭제, ${revertedCount}개 더미로 복원`, 'success');
    console.log(`🗑️ 테스트 별 정리 완료: ${deletedCount}개 삭제, ${revertedCount}개 더미 복원`);
};

// -- STEP 1: 데이터 준비 --
const starData = [
    { 
        name: "계획적인 책임감을 가진 별", 
        simpleDescription: "계획성과 책임감으로 신뢰를 쌓는 별", 
        charms: ["계획성 ★6", "책임감 ★6", "성실함 ★5", "신중함 ★4", "비판적 사고력 ★3", "절제력 ★3"], 
        comment: "당신의 체계적인 접근과 강한 책임감이 주변에 안정감을 선사합니다.",
        image: "image/1.png"
    },
    { 
        name: "창의적인 열정을 가진 별", 
        simpleDescription: "창의성과 열정으로 세상을 밝히는 별", 
        charms: ["창의성 ★6", "열정 ★6", "섬세함 ★5", "열린 마음 ★4", "공감 능력 ★3", "자기 성찰 ★3"], 
        comment: "당신의 독창적인 아이디어와 뜨거운 열정이 새로운 가능성을 열어갑니다.",
        image: "image/2.png"
    },
    { 
        name: "사교적인 분위기 메이커 별", 
        simpleDescription: "활기찬 에너지로 즐거움을 나누는 별", 
        charms: ["분위기 메이커 ★6", "사교적 에너지 ★6", "유머 감각 ★5", "다양한 친분 ★4", "타인을 편하게 해주는 능력 ★4"], 
        comment: "당신이 있는 곳에는 언제나 웃음과 활기가 가득합니다.",
        image: "image/3.png"
    },
    { 
        name: "넓은 시야를 가진 리더 별", 
        simpleDescription: "통찰력과 리더십으로 길을 제시하는 별", 
        charms: ["리더십 ★6", "넓은 시야 ★6", "전략적 사고 ★5", "통찰력 ★4", "침착함 ★4"], 
        comment: "당신의 탁월한 리더십과 넓은 관점이 모두에게 방향을 제시합니다.",
        image: "image/4.png"
    },
    { 
        name: "공감하는 위로를 주는 별", 
        simpleDescription: "따뜻한 공감으로 마음을 어루만지는 별", 
        charms: ["공감 능력 ★6", "위로 능력 ★6", "경청 능력 ★5", "다정함 ★5", "이해심 ★3"], 
        comment: "당신의 깊은 공감과 위로가 상처받은 마음에 치유를 가져다줍니다.",
        image: "image/5.png"
    },
    { 
        name: "야망 있는 모험가 별", 
        simpleDescription: "모험심과 야망으로 도전하는 별", 
        charms: ["모험심 ★6", "야망 ★6", "호기심 ★5", "열정 ★5", "긍정적 ★3"], 
        comment: "당신의 대담한 도전 정신과 끝없는 야망이 새로운 세계를 열어갑니다.",
        image: "image/6.png"
    },
    { 
        name: "책임감 있는 원칙의 별", 
        simpleDescription: "확고한 원칙과 책임감으로 신뢰받는 별", 
        charms: ["원칙 준수 ★6", "책임감 ★6", "정직함 ★5", "성실함 ★4", "일관성 ★4"], 
        comment: "당신의 흔들리지 않는 원칙과 강한 책임감이 모두의 신뢰를 얻습니다.",
        image: "image/7.png"
    },
    { 
        name: "침착한 전략가 별", 
        simpleDescription: "냉철한 판단력과 전략적 사고를 가진 별", 
        charms: ["침착함 ★6", "전략적 사고 ★6", "자기 객관화 ★5", "비판적 사고력 ★4", "계획성 ★4"], 
        comment: "당신의 침착한 판단력과 치밀한 전략이 어떤 상황도 해결해냅니다.",
        image: "image/8.png"
    },
    { 
        name: "창의적인 배려심의 별", 
        simpleDescription: "창의적 사고와 따뜻한 배려를 겸비한 별", 
        charms: ["창의성 ★6", "배려심 ★6", "다정함 ★5", "열린 마음 ★4", "긍정적 ★4"], 
        comment: "당신의 창의적인 아이디어와 세심한 배려가 모두를 행복하게 만듭니다.",
        image: "image/9.png"
    },
    { 
        name: "사교적인 리더 별", 
        simpleDescription: "친화력과 리더십을 모두 갖춘 별", 
        charms: ["리더십 ★6", "사교적 에너지 ★6", "분위기 메이커 ★5", "목표 의식 ★4", "다양한 친분 ★4"], 
        comment: "당신의 카리스마 있는 리더십과 뛰어난 친화력이 팀을 하나로 만듭니다.",
        image: "image/10.png"
    },
    { 
        name: "성실하게 분석하는 별", 
        simpleDescription: "꼼꼼한 분석력과 성실함을 갖춘 별", 
        charms: ["성실함 ★6", "비판적 사고력 ★5", "집중력 ★5", "계획성 ★4", "통찰력 ★3", "신중함 ★3", "자기 객관화 ★2"], 
        comment: "당신의 철저한 분석과 성실한 자세가 완벽한 결과를 만들어냅니다.",
        image: "image/11.png"
    },
    { 
        name: "긍정적인 공감의 별", 
        simpleDescription: "밝은 에너지와 깊은 공감을 나누는 별", 
        charms: ["공감 능력 ★6", "긍정적 ★6", "위로 능력 ★5", "다정함 ★4", "경청 능력 ★2", "이해심 ★2"], 
        comment: "당신의 밝은 긍정 에너지와 따뜻한 공감이 모두에게 희망을 전해줍니다.",
        image: "image/12.png"
    },
    { 
        name: "열정적인 아이디어의 별", 
        simpleDescription: "끝없는 아이디어와 열정으로 가득한 별", 
        charms: ["열정 ★6", "창의성 ★6", "호기심 ★5", "열린 마음 ★4", "모험심 ★4", "사교적 에너지 ★1"], 
        comment: "당신의 무한한 아이디어와 뜨거운 열정이 새로운 혁신을 만들어냅니다.",
        image: "image/13.png"
    },
    { 
        name: "진정성 있는 인내의 별", 
        simpleDescription: "진실된 마음과 끈질긴 인내력을 가진 별", 
        charms: ["인내심 ★6", "진정성 ★6", "일관성 ★5", "성실함 ★4", "자기 성찰 ★4", "절제력 ★1"], 
        comment: "당신의 진실한 마음과 변함없는 인내가 모든 어려움을 극복해냅니다.",
        image: "image/14.png"
    },
    { 
        name: "유쾌한 포용력의 별", 
        simpleDescription: "따뜻한 유머와 너그러운 포용력을 가진 별", 
        charms: ["포용력 ★6", "유머 감각 ★5", "타인을 편하게 해주는 능력 ★5", "사교적 에너지 ★4", "이해심 ★3", "긍정적 ★2"], 
        comment: "당신의 유쾌한 유머와 넓은 포용력이 모두를 편안하게 만듭니다.",
        image: "image/15.png"
    },
    { 
        name: "현실적인 목표의 별", 
        simpleDescription: "현실적 판단력과 명확한 목표 의식을 가진 별", 
        charms: ["목표 의식 ★6", "현실 감각 ★6", "계획성 ★5", "자기 객관화 ★4", "절제력 ★4", "신중함 ★1"], 
        comment: "당신의 현실적인 판단과 명확한 목표가 확실한 성과를 이끌어냅니다.",
        image: "image/16.png"
    },
    { 
        name: "다정한 책임감의 별", 
        simpleDescription: "따뜻한 마음과 강한 책임감을 겸비한 별", 
        charms: ["다정함 ★6", "책임감 ★5", "배려심 ★5", "진정성 ★4", "안정감 ★3", "이해심 ★2"], 
        comment: "당신의 다정한 마음과 든든한 책임감이 모두에게 안정을 선사합니다.",
        image: "image/17.png"
    },
    { 
        name: "안정적인 리더 별", 
        simpleDescription: "안정감 있는 리더십으로 신뢰받는 별", 
        charms: ["리더십 ★6", "안정감 ★5", "책임감 ★5", "넓은 시야 ★4", "신중함 ★3", "침착함 ★3", "계획성 ★1"], 
        comment: "당신의 안정적인 리더십과 신뢰할 수 있는 모습이 팀을 든든하게 만듭니다.",
        image: "image/18.png"
    },
    { 
        name: "견고한 책임감의 별", 
        simpleDescription: "흔들리지 않는 책임감과 성실함을 가진 별", 
        charms: ["책임감 ★6", "성실함 ★6", "일관성 ★5", "원칙 준수 ★3", "인내심 ★2"], 
        comment: "당신의 견고한 책임감과 변함없는 성실함이 모든 일을 완벽하게 해냅니다.",
        image: "image/19.png"
    },
    { 
        name: "용감한 수호자 별", 
        simpleDescription: "약자를 보호하는 용기 있는 수호자 별", 
        charms: ["약자보호 ★6", "용기 ★5", "책임감 ★5", "정직함 ★4", "리더십 ★3", "원칙 준수 ★2"], 
        comment: "당신의 용기 있는 행동과 보호자적 마음이 약한 이들에게 희망을 줍니다.",
        image: "image/20.png"
    },
    { 
        name: "지혜로운 중재자 별", 
        simpleDescription: "깊은 이해심과 지혜로 중재하는 별", 
        charms: ["이해심 ★6", "넓은 시야 ★5", "경청 능력 ★5", "침착함 ★4", "타인을 편하게 해주는 능력 ★3", "포용력 ★2"], 
        comment: "당신의 깊은 지혜와 뛰어난 중재 능력이 갈등을 평화롭게 해결합니다.",
        image: "image/21.png"
    },
    { 
        name: "꾸준히 발전하는 별", 
        simpleDescription: "끊임없는 자기계발 의지로 성장하는 별", 
        charms: ["자기 계발 의지 ★6", "성실함 ★5", "인내심 ★5", "목표 의식 ★4", "집중력 ★3", "계획성 ★2", "절제력 ★1"], 
        comment: "당신의 끝없는 성장 의지와 꾸준한 노력이 놀라운 발전을 이루어냅니다.",
        image: "image/22.png"
    },
    { 
        name: "즐거운 탐험가 별", 
        simpleDescription: "모험과 탐험을 즐기는 자유로운 별", 
        charms: ["모험심 ★6", "긍정적 ★5", "호기심 ★5", "사교적 에너지 ★4", "열린 마음 ★3", "창의성 ★2", "열정 ★1"], 
        comment: "당신의 자유로운 탐험 정신과 긍정적인 에너지가 새로운 세계를 발견해냅니다.",
        image: "image/23.png"
    },
    { 
        name: "명료한 원칙의 별", 
        simpleDescription: "명확한 원칙과 논리적 사고를 가진 별", 
        charms: ["원칙 준수 ★6", "비판적 사고력 ★5", "일관성 ★5", "정직함 ★4", "자기 객관화 ★3", "양심 ★2", "신중함 ★1"], 
        comment: "당신의 명확한 원칙과 논리적 사고가 모든 상황에 올바른 판단을 제시합니다.",
        image: "image/24.png"
    },
    { 
        name: "열정적인 분위기 메이커 별", 
        simpleDescription: "뜨거운 열정으로 분위기를 만드는 별", 
        charms: ["분위기 메이커 ★6", "열정 ★5", "유머 감각 ★5", "사교적 에너지 ★4", "창의성 ★3", "긍정적 ★3", "다양한 친분 ★1"], 
        comment: "당신의 뜨거운 열정과 뛰어난 분위기 조성 능력이 모든 자리를 활기차게 만듭니다.",
        image: "image/25.png"
    },
    { 
        name: "신중한 계획가 별", 
        simpleDescription: "신중한 판단과 체계적 계획을 세우는 별", 
        charms: ["계획성 ★6", "신중함 ★5", "절제력 ★5", "현실 감각 ★4", "책임감 ★3", "성실함 ★3", "비판적 사고력 ★1"], 
        comment: "당신의 신중한 판단과 체계적인 계획이 모든 일을 성공으로 이끕니다.",
        image: "image/26.png"
    },
    { 
        name: "따뜻한 진정성의 별", 
        simpleDescription: "진실된 마음과 따뜻한 배려를 가진 별", 
        charms: ["진정성 ★6", "다정함 ★5", "배려심 ★5", "책임감 ★4", "안정감 ★3", "이해심 ★2", "위로 능력 ★1"], 
        comment: "당신의 진실한 마음과 따뜻한 배려가 모두에게 진정한 위안을 제공합니다.",
        image: "image/27.png"
    },
    { 
        name: "경쟁을 즐기는 전략가 별", 
        simpleDescription: "치밀한 전략과 건전한 경쟁심을 가진 별", 
        charms: ["전략적 사고 ★6", "경쟁심 ★5", "야망 ★5", "통찰력 ★4", "목표 의식 ★3", "리더십 ★2", "계획성 ★1"], 
        comment: "당신의 뛰어난 전략적 사고와 건전한 경쟁 정신이 최고의 성과를 만들어냅니다.",
        image: "image/28.png"
    },
    { 
        name: "포용력 있는 경청의 별", 
        simpleDescription: "깊은 경청과 넓은 포용력을 가진 별", 
        charms: ["경청 능력 ★6", "포용력 ★5", "이해심 ★5", "인내심 ★3", "안정감 ★3", "침착함 ★2", "다정함 ★1"], 
        comment: "당신의 깊은 경청과 따뜻한 포용력이 모두의 마음을 편안하게 만듭니다.",
        image: "image/29.png"
    },
    { 
        name: "겸손한 실력가 별", 
        simpleDescription: "겸손한 자세와 뛰어난 실력을 겸비한 별", 
        charms: ["겸손 ★6", "통찰력 ★5", "성실함 ★5", "자기 성찰 ★4", "집중력 ★3", "신중함 ★2", "절제력 ★1"], 
        comment: "당신의 겸손한 자세와 뛰어난 실력이 모두의 존경과 신뢰를 받습니다.",
        image: "image/30.png"
    },
    { 
        name: "창의적인 문제 해결사 별", 
        simpleDescription: "창의적 사고로 문제를 해결하는 별", 
        charms: ["문제 해결 ★6", "창의성 ★5", "넓은 시야 ★5", "호기심 ★4", "긍정적 ★2", "열린 마음 ★2", "모험심 ★1"], 
        comment: "당신의 창의적인 문제 해결 능력이 어떤 난제도 혁신적으로 풀어냅니다.",
        image: "image/31.png"
    },
    { 
        name: "일관성 있는 리더 별", 
        simpleDescription: "일관된 원칙과 신뢰할 수 있는 리더십을 가진 별", 
        charms: ["리더십 ★6", "일관성 ★5", "책임감 ★5", "원칙 준수 ★4", "진정성 ★3", "정직함 ★2", "성실함 ★1"], 
        comment: "당신의 일관된 리더십과 흔들리지 않는 원칙이 모두의 신뢰를 얻습니다.",
        image: "image/32.png"
    },
    { 
        name: "활기찬 탐험가 별", 
        simpleDescription: "활기찬 에너지로 세상을 탐험하는 별", 
        charms: ["모험심 ★6", "사교적 에너지 ★5", "열정 ★5", "다양한 친분 ★4", "긍정적 ★3", "유머 감각 ★2", "호기심 ★1"], 
        comment: "당신의 활기찬 에너지와 탐험 정신이 모든 경험을 특별하게 만듭니다.",
        image: "image/33.png"
    },
    { 
        name: "한결같은 진정성의 별", 
        simpleDescription: "변함없는 진정성과 일관성을 가진 별", 
        charms: ["일관성 ★6", "진정성 ★6", "정직함 ★5", "책임감 ★4", "원칙 준수 ★2"], 
        comment: "당신의 변함없는 진정성과 일관된 모습이 모두에게 신뢰를 줍니다.",
        image: "image/34.png"
    },
    { 
        name: "세심한 위로자 별", 
        simpleDescription: "세심한 배려로 마음을 위로하는 별", 
        charms: ["위로 능력 ★6", "세심함 ★5", "섬세함 ★5", "공감 능력 ★4", "경청 능력 ★3", "다정함 ★2", "안정감 ★1"], 
        comment: "당신의 세심한 관찰과 따뜻한 위로가 상처받은 마음을 치유합니다.",
        image: "image/35.png"
    },
    { 
        name: "야망 있는 개척자 별", 
        simpleDescription: "강한 야망으로 새로운 길을 개척하는 별", 
        charms: ["야망 ★6", "모험심 ★5", "리더십 ★5", "목표 의식 ★4", "열정 ★3", "자기 계발 의지 ★2", "경쟁심 ★1"], 
        comment: "당신의 강한 야망과 개척 정신이 새로운 영역을 열어갑니다.",
        image: "image/36.png"
    },
    { 
        name: "흔들림 없는 신념의 별", 
        simpleDescription: "확고한 신념과 진정성을 지닌 별", 
        charms: ["진정성 ★6", "원칙 준수 ★5", "일관성 ★5", "자기 성찰 ★4", "정직함 ★3", "양심 ★2", "책임감 ★1"], 
        comment: "당신의 흔들리지 않는 신념과 확고한 원칙이 올바른 길을 제시합니다.",
        image: "image/37.png"
    },
    { 
        name: "유연한 사고의 별", 
        simpleDescription: "열린 마음과 유연한 적응력을 가진 별", 
        charms: ["열린 마음 ★6", "적응력 ★5", "넓은 시야 ★5", "창의성 ★4", "호기심 ★3", "긍정적 ★2", "이해심 ★1"], 
        comment: "당신의 열린 마음과 유연한 사고가 변화하는 세상에 완벽하게 적응합니다.",
        image: "image/38.png"
    },
    { 
        name: "성실한 협력자 별", 
        simpleDescription: "성실함과 협동심으로 함께하는 별", 
        charms: ["성실함 ★6", "협동심 ★5", "배려심 ★5", "책임감 ★4", "타인을 편하게 해주는 능력 ★3", "경청 능력 ★2", "다정함 ★1"], 
        comment: "당신의 성실한 자세와 뛰어난 협력 정신이 팀워크를 완벽하게 만듭니다.",
        image: "image/39.png"
    },
    { 
        name: "에너지를 주는 긍정의 별", 
        simpleDescription: "긍정적 에너지로 모두를 밝게 만드는 별", 
        charms: ["긍정적 ★6", "사교적 에너지 ★5", "분위기 메이커 ★5", "유머 감각 ★4", "다정함 ★3", "열린 마음 ★2", "위로 능력 ★1"], 
        comment: "당신의 밝은 긍정 에너지가 모든 사람에게 희망과 활력을 선사합니다.",
        image: "image/40.png"
    },
    { 
        name: "목표를 향한 집중력의 별", 
        simpleDescription: "강한 집중력으로 목표를 달성하는 별", 
        charms: ["집중력 ★6", "목표 의식 ★5", "인내심 ★5", "자기 계발 의지 ★4", "성실함 ★3", "계획성 ★2", "전략적 사고 ★1"], 
        comment: "당신의 뛰어난 집중력과 확고한 목표 의식이 모든 꿈을 현실로 만듭니다.",
        image: "image/41.png"
    },
    { 
        name: "모두를 아우르는 이해심의 별", 
        simpleDescription: "깊은 이해심으로 모두를 포용하는 별", 
        charms: ["이해심 ★6", "포용력 ★5", "넓은 시야 ★5", "공감 능력 ★4", "안정감 ★3", "배려심 ★2", "침착함 ★1"], 
        comment: "당신의 깊은 이해심과 넓은 포용력이 모든 사람을 하나로 아우릅니다.",
        image: "image/42.png"
    },
    { 
        name: "용기 있는 도전자 별", 
        simpleDescription: "용기와 도전 정신으로 앞서가는 별", 
        charms: ["용기 ★6", "경쟁심 ★5", "모험심 ★5", "열정 ★4", "야망 ★3", "자기 계발 의지 ★2", "긍정적 ★1"], 
        comment: "당신의 용기 있는 도전 정신이 불가능해 보이는 일들을 가능하게 만듭니다.",
        image: "image/43.png"
    },
    { 
        name: "성실한 계획가 별", 
        simpleDescription: "성실함과 체계적 계획으로 성공하는 별", 
        charms: ["성실함 ★6", "계획성 ★6", "책임감 ★5", "신중함 ★4", "일관성 ★4"], 
        comment: "당신의 성실한 자세와 완벽한 계획이 모든 일을 성공으로 이끕니다.",
        image: "image/44.png"
    },
    { 
        name: "재치 있는 통찰력의 별", 
        simpleDescription: "뛰어난 통찰력과 재치를 겸비한 별", 
        charms: ["통찰력 ★6", "유머 감각 ★5", "창의성 ★5", "비판적 사고력 ★4", "호기심 ★3", "넓은 시야 ★2", "열린 마음 ★1"], 
        comment: "당신의 날카로운 통찰력과 유쾌한 재치가 모든 상황을 지혜롭게 해결합니다.",
        image: "image/45.png"
    },
    { 
        name: "묵묵한 지지자 별", 
        simpleDescription: "조용한 지지와 든든한 뒷받침을 주는 별", 
        charms: ["경청 능력 ★6", "인내심 ★5", "배려심 ★5", "안정감 ★4", "이해심 ★3", "책임감 ★2", "성실함 ★1"], 
        comment: "당신의 묵묵한 지지와 변함없는 응원이 모두에게 큰 힘이 됩니다.",
        image: "image/46.png"
    },
    { 
        name: "원대한 꿈을 꾸는 별", 
        simpleDescription: "큰 꿈과 원대한 비전을 품은 별", 
        charms: ["야망 ★6", "넓은 시야 ★5", "목표 의식 ★5", "자기 계발 의지 ★4", "열정 ★2", "리더십 ★2", "창의성 ★1"], 
        comment: "당신의 원대한 꿈과 큰 비전이 세상을 더 나은 곳으로 만들어갑니다.",
        image: "image/47.png"
    },
    { 
        name: "평온한 자기 성찰의 별", 
        simpleDescription: "깊은 자기 성찰과 평온함을 가진 별", 
        charms: ["자기 성찰 ★6", "안정감 ★5", "침착함 ★5", "절제력 ★4", "겸손 ★3", "신중함 ★2", "자기 객관화 ★1"], 
        comment: "당신의 깊은 성찰과 평온한 마음이 내면의 진정한 지혜를 키워갑니다.",
        image: "image/48.png"
    },
    { 
        name: "생기를 불어넣는 별", 
        simpleDescription: "활기찬 에너지로 생동감을 불어넣는 별", 
        charms: ["분위기 메이커 ★6", "긍정적 ★5", "창의성 ★5", "사교적 에너지 ★4", "유머 감각 ★2", "열린 마음 ★2", "다정함 ★1"], 
        comment: "당신의 활기찬 생명력과 긍정적 에너지가 모든 곳에 생기를 불어넣습니다.",
        image: "image/49.png"
    },
    { 
        name: "올곧은 신념의 별", 
        simpleDescription: "정직하고 올곧은 신념을 지닌 별", 
        charms: ["정직함 ★6", "원칙 준수 ★5", "진정성 ★5", "책임감 ★4", "양심 ★3", "일관성 ★2", "겸손 ★1"], 
        comment: "당신의 올곧은 신념과 정직한 마음이 모두에게 진정한 신뢰를 줍니다.",
        image: "image/50.png"
    }
];

// -- 기본 설정 --
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
camera.position.set(0, 0, 2); // 카메라 위치 명시적 설정

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 0.5; // 확대 가능
controls.maxDistance = 2.9; // 초기 시점보다 축소 불가 (확대만 가능)
controls.target.set(0, 0, 0);
controls.enablePan = false;

// 자동 회전 시스템 변수
let autoRotate = true; // 자동 회전 상태
let lastInteractionTime = Date.now(); // 마지막 상호작용 시간
let rotationSpeed = 0.003; // 회전 속도 (3배 빠르게)
let rotationAxis = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(); // 랜덤 회전축
const INTERACTION_TIMEOUT = 180000; // 3분 (180초) 타임아웃

// 사용자 상호작용 감지 함수
function onUserInteraction() {
    lastInteractionTime = Date.now();
    if (autoRotate) {
        autoRotate = false;
        controls.autoRotate = false;
        console.log('🎮 사용자 상호작용 감지 - 자동 회전 중지');
    }
}

// 온보딩 전용 상호작용 감지
function onOnboardingInteraction(actionType) {
    if (!onboardingActive) return;
    
    const currentStep = ONBOARDING_STEPS[onboardingStep - 1];
    if (currentStep && currentStep.action === actionType) {
        console.log(`✅ 온보딩 액션 완료: ${actionType}`);
        nextOnboardingStep();
    }
}

// 새로운 랜덤 회전축 생성
function generateNewRotationAxis() {
    rotationAxis = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2, 
        (Math.random() - 0.5) * 2
    ).normalize();
    console.log('🔄 새로운 회전축 설정:', rotationAxis);
}

// 딥필드 배경 이미지 설정 (원본 색상 유지)
const textureLoader = new THREE.TextureLoader();
const deepFieldBackground = textureLoader.load('deep_field_background.jpg', (texture) => {
    // 원본 색상과 밝기 유지 설정
    texture.colorSpace = THREE.SRGBColorSpace;
});
scene.background = deepFieldBackground;
const stars = [];
const starImagePaths = [
    'star_red.png', 'star_orange.png', 'star_skyblue.png', 'star_pink.png',
    'star_green.png', 'star_yellow.png', 'star_royalblue.png'
];
const starTextures = starImagePaths.map(path => textureLoader.load(path));

const starCount = 150;
const sphereRadius = 2.5;

for (let i = 0; i < starCount; i++) {
    const starMaterial = new THREE.SpriteMaterial({ map: starTextures[i % 7], transparent: true });
    const star = new THREE.Sprite(starMaterial);
    const phi = Math.acos((2 * Math.random()) - 1);
    const theta = Math.random() * 2 * Math.PI;
    star.position.set(sphereRadius * Math.cos(theta) * Math.sin(phi), sphereRadius * Math.sin(theta) * Math.sin(phi), sphereRadius * Math.cos(phi));
    star.scale.set(0.3, 0.3, 0.3);

    star.userData = starData[i % starData.length];

    stars.push(star);
    scene.add(star);
}

// 배경 별들 생성 (1000개, 큰 구에 배치)
const backgroundStarTexture = textureLoader.load('star_background.png');
const backgroundSphereRadius = 6; // 메인 구보다 2.4배 크게 (더 가까이)
const backgroundStarCount = 1200;

for (let i = 0; i < backgroundStarCount; i++) {
    const backgroundStarMaterial = new THREE.SpriteMaterial({ 
        map: backgroundStarTexture, 
        transparent: true 
    });
    const backgroundStar = new THREE.Sprite(backgroundStarMaterial);
    
    // 구면 좌표로 랜덤 배치
    const phi = Math.acos((2 * Math.random()) - 1);
    const theta = Math.random() * 2 * Math.PI;
    
    backgroundStar.position.set(
        backgroundSphereRadius * Math.cos(theta) * Math.sin(phi),
        backgroundSphereRadius * Math.sin(theta) * Math.sin(phi),
        backgroundSphereRadius * Math.cos(phi)
    );
    
    // 다양한 크기 (0.1 ~ 0.25) - 더 크게
    const size = 0.1 + Math.random() * 0.15;
    backgroundStar.scale.set(size, size, size);
    
    // 배경 별은 클릭 불가능하도록 userData 없음
    backgroundStar.userData = { isBackground: true };
    
    scene.add(backgroundStar);
}

console.log(`🌟 배경 별 ${backgroundStarCount}개 생성 완료 (반지름: ${backgroundSphereRadius})`);

// Firebase Realtime Database 리스너 설정 (기존 별자리 로드 + 실시간 감지)
setupFirebaseListener();

// URL 파라미터에서 별자리 데이터 확인
loadConstellationFromURL();

// localStorage에서 IPAD_ATSER 별자리 로드 (임시 전달용)
loadConstellationsFromLocalStorage();

// -- STEP 3: 인터랙션 설정 --
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let intersectedObject = null;

const tooltip = document.getElementById('tooltip');
const detailPanel = document.getElementById('detail-panel');

window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    tooltip.style.left = event.clientX + 15 + 'px';
    tooltip.style.top = event.clientY + 15 + 'px';
});

// 마우스 상호작용 감지
window.addEventListener('mousedown', (e) => {
    onUserInteraction();
    onOnboardingInteraction('drag'); // 온보딩: 드래그 감지
});
window.addEventListener('wheel', (e) => {
    onUserInteraction();
    onOnboardingInteraction('zoom'); // 온보딩: 줌 감지
});
window.addEventListener('touchstart', (e) => {
    onUserInteraction();
    onOnboardingInteraction('drag'); // 온보딩: 터치 드래그 감지
});

// 모바일 더블탭 감지를 위한 변수들
let lastTouchTime = 0;
let lastTouchPosition = { x: 0, y: 0 };
const DOUBLE_TAP_DELAY = 300; // 300ms 내 두 번 터치
const TOUCH_TOLERANCE = 50; // 50px 허용 오차

// 터치 좌표 정규화 함수
function getNormalizedCoordinates(clientX, clientY) {
    return {
        x: (clientX / window.innerWidth) * 2 - 1,
        y: -(clientY / window.innerHeight) * 2 + 1
    };
}

// 별 상세보기 실행 함수 (공통)
function showStarDetail(normalizedCoords) {
    raycaster.setFromCamera(new THREE.Vector2(normalizedCoords.x, normalizedCoords.y), camera);
    const intersects = raycaster.intersectObjects(stars);
    
    if (intersects.length > 0) {
        const clickedStar = intersects[0].object;
        controls.enabled = false;
        const targetPosition = new THREE.Vector3();
        clickedStar.getWorldPosition(targetPosition);

        const offset = 0.5;
        const newCameraPosition = targetPosition.clone().multiplyScalar(1 + offset / targetPosition.length());

        gsap.to(camera.position, {
            duration: 1.5,
            x: newCameraPosition.x,
            y: newCameraPosition.y,
            z: newCameraPosition.z,
            ease: "power3.inOut"
        });

        gsap.to(controls.target, {
            duration: 1.5,
            x: targetPosition.x,
            y: targetPosition.y,
            z: targetPosition.z,
            ease: "power3.inOut",
            onUpdate: () => {
                controls.update();
            },
            onComplete: () => {
                const data = clickedStar.userData;
                document.getElementById('detail-name').innerText = data.name;
                document.getElementById('constellation-image').src = data.image;
                document.getElementById('charms').innerHTML = data.charms.join('<br>');
                document.getElementById('comment').innerText = data.comment;
                detailPanel.style.display = 'block';
            }
        });
        return true; // 별 클릭 성공
    }
    return false; // 별 클릭 실패
}

// 데스크톱 더블클릭 처리
window.addEventListener('dblclick', (event) => {
    onUserInteraction();
    const coords = getNormalizedCoordinates(event.clientX, event.clientY);
    const success = showStarDetail(coords);
    if (success) {
        onOnboardingInteraction('click'); // 온보딩: 클릭 감지
    }
});

// 모바일 터치 더블탭 처리 (인트로 화면 제외)
window.addEventListener('touchend', (event) => {
    // 인트로 화면이 보이는 동안에는 더블탭 처리 안함
    const introOverlay = document.getElementById('intro-overlay');
    if (introOverlay && introOverlay.style.display !== 'none') {
        return;
    }
    
    // 터치 이벤트가 있을 때만 기본 동작 방지
    if (event.changedTouches && event.changedTouches.length > 0) {
        event.preventDefault(); // 기본 줌 동작 방지
        
        const currentTime = Date.now();
        const touch = event.changedTouches[0];
        const currentPosition = { x: touch.clientX, y: touch.clientY };
        
        // 더블탭 조건 체크
        const timeDiff = currentTime - lastTouchTime;
        const distance = Math.sqrt(
            Math.pow(currentPosition.x - lastTouchPosition.x, 2) + 
            Math.pow(currentPosition.y - lastTouchPosition.y, 2)
        );
        
        if (timeDiff < DOUBLE_TAP_DELAY && distance < TOUCH_TOLERANCE) {
            // 더블탭 감지!
            onUserInteraction();
            const coords = getNormalizedCoordinates(touch.clientX, touch.clientY);
            const success = showStarDetail(coords);
            
            if (success) {
                onOnboardingInteraction('click'); // 온보딩: 클릭 감지
                console.log('📱 모바일 더블탭으로 별 상세보기 실행');
            }
            
            // 더블탭 처리 후 초기화
            lastTouchTime = 0;
            lastTouchPosition = { x: 0, y: 0 };
        } else {
            // 첫 번째 탭 또는 조건 불일치
            lastTouchTime = currentTime;
            lastTouchPosition = currentPosition;
        }
    }
});

// 추가적인 모바일 제스처 방지 및 온보딩 감지
document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
    onOnboardingInteraction('zoom'); // 온보딩: 모바일 줌 감지
});

document.addEventListener('gesturechange', function(e) {
    e.preventDefault();
});

document.addEventListener('gestureend', function(e) {
    e.preventDefault();
});

// 별 상세보기 패널 닫기 함수 (공통)
function closeDetailPanel() {
    detailPanel.style.display = 'none';
    
    // 온보딩: 닫기 감지
    onOnboardingInteraction('close');

    // 항상 초기 중앙 시점으로 돌아가기
    gsap.to(camera.position, {
        duration: 1.5,
        x: 0,
        y: 0,
        z: 2,
        ease: "power3.inOut"
    });

    gsap.to(controls.target, {
        duration: 1.5,
        x: 0,
        y: 0,
        z: 0,
        ease: "power3.inOut",
        onUpdate: () => {
            controls.update();
        },
        onComplete: () => {
            controls.enabled = true;
        }
    });
}

// 데스크톱 클릭 이벤트
document.getElementById('close-btn').addEventListener('click', (e) => {
    e.preventDefault();
    closeDetailPanel();
    console.log('🖱️ 데스크톱 클릭으로 상세보기 닫기');
});

// 모바일 터치 이벤트
document.getElementById('close-btn').addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeDetailPanel();
    console.log('📱 모바일 터치로 상세보기 닫기');
});

// 터치 시작시 피드백
document.getElementById('close-btn').addEventListener('touchstart', (e) => {
    e.preventDefault();
    const closeBtn = document.getElementById('close-btn');
    closeBtn.style.transform = 'scale(0.9)';
    closeBtn.style.color = '#fff';
});

// 터치 취소시 원래대로
document.getElementById('close-btn').addEventListener('touchcancel', (e) => {
    e.preventDefault();
    const closeBtn = document.getElementById('close-btn');
    closeBtn.style.transform = 'scale(1)';
    closeBtn.style.color = '#999';
});

// -- 애니메이션 루프 (수정) --
function animate() {
    requestAnimationFrame(animate);
    
    // 자동 회전 시스템 체크
    const timeSinceLastInteraction = Date.now() - lastInteractionTime;
    
    if (!autoRotate && timeSinceLastInteraction > INTERACTION_TIMEOUT) {
        // 3분 경과 → 자동 회전 재시작 + 인트로 화면 표시
        autoRotate = true;
        generateNewRotationAxis(); // 새로운 랜덤 방향
        showIntroOverlay(); // 인트로 화면 다시 표시
        console.log('⏰ 3분 경과 - 자동 회전 재시작 + 인트로 화면 표시');
    }
    
    // 자동 회전 실행
    if (autoRotate) {
        // 카메라를 회전축 중심으로 회전
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationAxis(rotationAxis, rotationSpeed);
        camera.position.applyMatrix4(rotationMatrix);
        camera.lookAt(0, 0, 0); // 항상 중심을 바라보도록
    }
    
    controls.update();

    // 영구 후광 업데이트
    updatePermanentHalo();

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(stars);

    if (intersects.length > 0) {
        if (intersectedObject !== intersects[0].object) {
            if (intersectedObject) { // 이전 객체 원래대로
                intersectedObject.scale.set(0.3, 0.3, 0.3);
            }
            intersectedObject = intersects[0].object;
            intersectedObject.scale.set(0.4, 0.4, 0.4); // 새 객체 확대

            document.getElementById('tooltip-name').innerText = intersectedObject.userData.name;
            document.getElementById('tooltip-desc').innerText = intersectedObject.userData.simpleDescription;
            tooltip.style.display = 'block';
            document.body.style.cursor = 'pointer';
            
            // 온보딩: 호버 감지
            onOnboardingInteraction('hover');
        }
    } else {
        if (intersectedObject) {
            intersectedObject.scale.set(0.3, 0.3, 0.3);
            tooltip.style.display = 'none';
            document.body.style.cursor = 'default';
        }
        intersectedObject = null;
    }

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// -- STEP 4: WebSocket 실시간 별 추가 기능 --

// Firebase Realtime Database에서 실시간으로 새 별자리 감지
function setupFirebaseListener() {
    try {
        const database = window.firebaseDatabase;
        const constellationsRef = database.ref('constellations');
        
        console.log('🔥 Firebase 실시간 리스너 설정 중...');
        
        // 처음 로드 시 기존 모든 별자리 불러오기
        constellationsRef.once('value', (snapshot) => {
            const allConstellations = snapshot.val();
            if (allConstellations) {
                const constellationArray = Object.values(allConstellations);
                console.log(`📚 Firebase에서 ${constellationArray.length}개의 기존 별자리 불러옴`);
                
                constellationArray.forEach(constellation => {
                    addConstellationToUniverse(constellation);
                });
                
                if (constellationArray.length > 0) {
                    showNotification(`💫 ${constellationArray.length}개의 별자리를 불러왔습니다!`, 'success');
                }
            } else {
                console.log('📭 Firebase에 저장된 별자리가 없습니다.');
            }
        });
        
        // 새로운 별자리가 추가되면 실행 (실시간 감지)
        constellationsRef.on('child_added', (snapshot) => {
            const constellation = snapshot.val();
            const constellationId = snapshot.key;
            
            // 이미 로드된 별자리인지 체크 (초기 로드 시 중복 방지)
            const isInitialLoad = Date.now() - pageLoadTime < 5000; // 페이지 로드 후 5초 이내
            if (isInitialLoad) {
                return; // 초기 로드는 once로 처리했으므로 무시
            }
            
            console.log('✨ 새로운 별자리 실시간 감지!', constellation);
            
            // 별자리를 3D 공간에 추가
            addConstellationToUniverse(constellation);
            
            // 알림 표시
            showNotification(`✨ ${constellation.userName}님의 별자리가 추가되었습니다!`, 'new-star');
        });
        
        console.log('✅ Firebase 리스너 활성화 완료!');
        
    } catch (error) {
        console.error('❌ Firebase 리스너 설정 실패:', error);
    }
}

// URL 파라미터에서 별자리 데이터 로드
function loadConstellationFromURL() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const constellationParam = urlParams.get('constellation');
        
        if (!constellationParam) {
            console.log('📭 URL에 별자리 데이터가 없습니다.');
            return;
        }
        
        const constellation = JSON.parse(decodeURIComponent(constellationParam));
        console.log('🌟 URL에서 별자리 데이터 발견:', constellation);
        
        // 별자리를 3D 공간에 추가
        addConstellationToUniverse(constellation);
        showNotification(`✨ ${constellation.userName}님의 별자리가 우주에 추가되었습니다!`, 'new-star');
        
        // URL에서 파라미터 제거 (새로고침 시 중복 추가 방지)
        window.history.replaceState({}, document.title, window.location.pathname);
        
    } catch (error) {
        console.error('❌ URL 별자리 로드 실패:', error);
    }
}

// localStorage에 별자리 저장 (영구 보관)
function saveConstellationToLocalStorage(constellation) {
    try {
        const savedConstellations = localStorage.getItem('saved3DConstellations');
        let constellations = savedConstellations ? JSON.parse(savedConstellations) : [];
        
        // 중복 체크 (userName + timestamp로 구분)
        const isDuplicate = constellations.some(c => 
            c.userName === constellation.userName && 
            c.timestamp === constellation.timestamp
        );
        
        if (!isDuplicate) {
            constellations.push(constellation);
            localStorage.setItem('saved3DConstellations', JSON.stringify(constellations));
            console.log('💾 별자리 localStorage에 저장됨:', constellation.userName);
        } else {
            console.log('⚠️ 이미 저장된 별자리:', constellation.userName);
        }
    } catch (error) {
        console.error('❌ localStorage 저장 실패:', error);
    }
}

// 저장된 별자리들을 불러오기 (페이지 로드 시)
function loadSavedConstellations() {
    try {
        const savedConstellations = localStorage.getItem('saved3DConstellations');
        if (!savedConstellations) {
            console.log('📭 저장된 별자리가 없습니다.');
            return;
        }
        
        const constellations = JSON.parse(savedConstellations);
        console.log(`💫 저장된 ${constellations.length}개의 별자리 불러오는 중...`);
        
        // 각 별자리를 3D 공간에 추가
        constellations.forEach(constellation => {
            addConstellationToUniverse(constellation);
        });
        
        if (constellations.length > 0) {
            showNotification(`💫 ${constellations.length}개의 저장된 별자리를 불러왔습니다!`, 'success');
        }
        
    } catch (error) {
        console.error('❌ 저장된 별자리 로드 실패:', error);
    }
}

// localStorage에서 IPAD_ATSER에서 생성된 별자리 불러오기
function loadConstellationsFromLocalStorage() {
    try {
        const constellations3D = localStorage.getItem('constellations3D');
        if (!constellations3D) {
            console.log('📭 저장된 별자리가 없습니다.');
            return;
        }
        
        const constellations = JSON.parse(constellations3D);
        console.log(`🌟 ${constellations.length}개의 별자리 발견!`);
        
        // 각 별자리를 3D 공간에 추가
        constellations.forEach(constellation => {
            addConstellationToUniverse(constellation);
        });
        
        // 추가 후 localStorage에서 제거 (중복 추가 방지)
        localStorage.removeItem('constellations3D');
        showNotification(`✨ ${constellations.length}개의 별자리가 우주에 추가되었습니다!`, 'new-star');
        
    } catch (error) {
        console.error('❌ 별자리 로드 실패:', error);
    }
}

// 별자리를 3D 우주에 추가하는 함수
function addConstellationToUniverse(constellation) {
    // 별자리 데이터를 별 형식으로 변환
    const charmsText = constellation.charms.map(charm => 
        `${charm.name} ★${charm.level}`
    );
    
    const starData = {
        name: constellation.name, // 사용자가 입력한 이름
        simpleDescription: constellation.description || `${constellation.userName}님의 매력 별자리 (총 레벨: ${constellation.totalLevel})`, // 사용자가 입력한 설명
        charms: charmsText,
        comment: constellation.description || `${constellation.charms.length}개의 핵심 매력으로 이루어진 ${constellation.userName}님만의 특별한 별자리입니다.`,
        image: constellation.cardImage || 'star_background.png', // 카드 이미지 사용
        timestamp: constellation.timestamp,
        isFromIPAD: true
    };
    
    // 기존 addNewStarToUniverse 함수 활용
    addNewStarToUniverse(starData);
    console.log(`✨ "${constellation.name}" 별자리 추가 완료 (이미지: ${constellation.cardImage ? 'O' : 'X'})`);
}

function initializeWebSocket() {
    console.log('🌐 WebSocket 서버에 연결 시도 중...');
    socket = io('http://localhost:3333');
    
    socket.on('connect', () => {
        console.log('✅ 3D 우주가 별자리 서버에 연결됨!');
        showNotification('🌟 실시간 별자리 수신 준비 완료!', 'success');
    });
    
    socket.on('disconnect', () => {
        console.log('❌ 별자리 서버 연결 끊어짐');
        showNotification('📡 서버 연결이 끊어졌습니다', 'error');
    });
    
    // 새로운 별 수신
    socket.on('new-star-added', (newStarData) => {
        console.log('⭐ 새로운 별 수신:', newStarData);
        addNewStarToUniverse(newStarData);
        showNotification(`✨ "${newStarData.name}"이 우주에 나타났습니다!`, 'new-star');
    });
}

// 새 별을 3D 우주에 추가
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
    
    console.log(`🌟 새로운 별 "${starData.name}" 추가 완료! (총 ${stars.length}개)`);
}

// 더미 데이터를 실제 별자리로 교체
function replaceDummyWithNewStar(starData) {
    const dummyId = starData.replaceDummyId;
    
    // 더미 별 찾기 (starData 배열에서 인덱스는 dummyId - 1)
    const dummyIndex = dummyId - 1;
    if (dummyIndex < 0 || dummyIndex >= stars.length) {
        console.error(`❌ 더미 별 ID ${dummyId} 찾을 수 없음`);
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
    
    console.log(`🔄 더미 별자리 ID ${dummyId}를 "${starData.name}"로 교체 완료!`);
}

// 최신 별 설정 및 후광 추가
function setNewestStar(star) {
    currentNewestStar = star;
    addPermanentHalo(star);
}

// 새 별에 시점만 변경 (회전축은 중앙 고정)
function focusOnNewestStar() {
    if (!currentNewestStar) return;
    
    // 회전 일시 정지 및 타이머 리셋 (3분간 정지)
    autoRotate = false;
    lastInteractionTime = Date.now();
    console.log('🛑 새 별 추가로 회전 일시 정지 (3분간)');
    
    // 카메라만 이동하고 회전축은 중앙에 고정
    controls.enabled = false;
    const targetPosition = new THREE.Vector3();
    currentNewestStar.getWorldPosition(targetPosition);

    const offset = 0.5;
    const newCameraPosition = targetPosition.clone().multiplyScalar(1 + offset / targetPosition.length());

    gsap.to(camera.position, {
        duration: 2,
        x: newCameraPosition.x,
        y: newCameraPosition.y,
        z: newCameraPosition.z,
        ease: "power2.inOut",
        onUpdate: () => {
            controls.update(); // 카메라 위치 변경에 대한 업데이트만
        },
        onComplete: () => {
            controls.enabled = true; // 새 별은 팝업이 없으니 바로 컨트롤 활성화
        }
    });
    
    // controls.target은 (0,0,0)으로 유지 - 회전축 중앙 고정
    console.log('🎯 새 별에 시점만 이동 (회전축 중앙 고정, 3분 후 회전 재개)');
}

// 영구 후광 추가 (가장 최근 별용)
function addPermanentHalo(star) {
    // 자연스러운 후광 효과 생성 (원형 그라디언트)
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    // 방사형 그라디언트로 자연스러운 후광 만들기
    const gradient = context.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)'); // 중심: 밝은 흰색
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.6)'); 
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)'); // 가장자리: 투명
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 512);
    
    // 텍스처로 변환
    const haloTexture = new THREE.CanvasTexture(canvas);
    
    // 후광 지오메트리 (평면) - 크기 축소
    const haloGeometry = new THREE.PlaneGeometry(0.8, 0.8);
    const haloMaterial = new THREE.MeshBasicMaterial({
        map: haloTexture,
        transparent: true,
        opacity: 0.5, // 투명도 낮춤
        blending: THREE.AdditiveBlending, // 가산 블렌딩으로 빛나는 효과
        depthWrite: false, // 깊이 버퍼에 쓰지 않아서 다른 객체와 자연스럽게 블렌딩
        depthTest: false // 깊이 테스트 비활성화로 항상 뒤에 렌더링
    });
    
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    
    // 별과 정확히 같은 위치에 배치
    halo.position.copy(star.position);
    
    // 후광이 카메라를 향하도록 회전 (먼저 설정)
    halo.lookAt(camera.position);
    
    // 카메라에서 별로의 방향으로 후광을 아주 조금만 뒤로 배치
    const direction = new THREE.Vector3();
    direction.subVectors(star.position, camera.position).normalize();
    halo.position.add(direction.multiplyScalar(0.02)); // 아주 조금만 뒤에
    
    // 렌더링 순서 조정 (낮은 숫자가 먼저 렌더링됨)
    halo.renderOrder = -1; // 별보다 먼저 렌더링 (뒤에 표시)
    
    scene.add(halo);
    currentHalo = halo;
    
    // 부드러운 펄스 애니메이션 (더 자연스럽게) - 스케일 범위 축소
    gsap.to(halo.scale, {
        x: 1.1,
        y: 1.1,
        z: 1.1,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
    });
    
    gsap.to(halo.material, {
        opacity: 0.4,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
    });
    
    // 미세한 회전 애니메이션 추가 (더 역동적인 느낌)
    gsap.to(halo.rotation, {
        z: Math.PI * 2,
        duration: 8,
        repeat: -1,
        ease: "none"
    });
    
    console.log('✨ 새 별에 자연스러운 후광 추가됨');
}

// 현재 후광 제거
function removeCurrentHalo() {
    if (currentHalo) {
        // 애니메이션 제거
        gsap.killTweensOf(currentHalo.scale);
        gsap.killTweensOf(currentHalo.material);
        
        // 씬에서 제거
        scene.remove(currentHalo);
        currentHalo = null;
        console.log('👑 이전 후광 제거됨');
    }
}


// 알림 메시지 표시
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    
    // 타입별 배경 그라디언트 설정
    let bgGradient;
    if (type === 'success') {
        bgGradient = 'linear-gradient(to right, rgba(34, 211, 238, 0.9), rgba(20, 184, 166, 0.9))';
    } else if (type === 'error') {
        bgGradient = 'linear-gradient(to right, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))';
    } else if (type === 'new-star') {
        bgGradient = 'linear-gradient(to right, rgba(103, 232, 249, 0.9), rgba(34, 211, 238, 0.9))';
    } else {
        bgGradient = 'linear-gradient(to bottom right, rgba(30, 41, 59, 0.9), rgba(30, 58, 138, 0.9))';
    }
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgGradient};
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        color: ${type === 'success' || type === 'new-star' ? '#1e1b4b' : '#ffffff'};
        padding: 15px 20px;
        border-radius: 12px;
        font-family: sans-serif;
        font-size: 14px;
        font-weight: 600;
        z-index: 1000;
        border: 1px solid rgba(34, 211, 238, 0.3);
        box-shadow: 0 8px 24px rgba(34, 211, 238, 0.3), 0 0 20px rgba(34, 211, 238, 0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 애니메이션으로 슬라이드 인
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // 5초 후 자동 제거
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// 영구 후광 업데이트 (애니메이션 루프에서 호출)
function updatePermanentHalo() {
    if (currentHalo && currentNewestStar) {
        // 후광을 정확히 별 위치에 맞춤
        currentHalo.position.copy(currentNewestStar.position);
        
        // 후광이 항상 카메라를 향하도록 업데이트 (먼저 회전 설정)
        currentHalo.lookAt(camera.position);
        
        // 카메라에서 별로의 방향으로 후광을 아주 조금만 뒤로 배치
        const direction = new THREE.Vector3();
        direction.subVectors(currentNewestStar.position, camera.position).normalize();
        currentHalo.position.add(direction.multiplyScalar(0.02)); // 아주 조금만 뒤에
    }
}

// 온보딩 시작 함수
function startOnboarding() {
    onboardingStep = 1;
    onboardingActive = true;
    showOnboardingStep();
    
    // "다음" 버튼 클릭 이벤트 등록
    const nextBtn = document.getElementById('onboarding-next');
    if (nextBtn) {
        nextBtn.onclick = function() {
            nextOnboardingStep();
        };
    }
    
    console.log('🎓 온보딩 시작!');
}

// 온보딩 단계 표시 함수
function showOnboardingStep() {
    if (onboardingStep === 0 || onboardingStep > ONBOARDING_STEPS.length) return;
    
    const overlay = document.getElementById('onboarding-overlay');
    const icon = document.getElementById('onboarding-icon');
    const message = document.getElementById('onboarding-message');
    const progress = document.getElementById('onboarding-progress');
    const nextBtn = document.getElementById('onboarding-next');
    const dragHint = document.getElementById('drag-hint');
    
    const currentStep = ONBOARDING_STEPS[onboardingStep - 1];
    
    // 오버레이 내용 업데이트
    icon.textContent = currentStep.icon;
    message.textContent = currentStep.message;
    progress.textContent = `${onboardingStep} / ${ONBOARDING_STEPS.length}`;
    
    // 마지막 단계면 "완료" 버튼으로 변경
    if (onboardingStep === ONBOARDING_STEPS.length) {
        nextBtn.textContent = '완료';
    } else {
        nextBtn.textContent = '다음';
    }
    
    // 오버레이 표시
    overlay.style.display = 'flex';
    
    // 드래그 단계에서만 힌트 애니메이션 표시
    if (currentStep.action === 'drag') {
        dragHint.style.display = 'block';
    } else {
        dragHint.style.display = 'none';
    }
    
    console.log(`📖 온보딩 단계 ${onboardingStep}: ${currentStep.action}`);
}

// 다음 온보딩 단계로 진행
function nextOnboardingStep() {
    if (!onboardingActive) {
        console.log('⚠️ nextOnboardingStep 호출되었지만 onboardingActive가 false');
        return;
    }
    
    const overlay = document.getElementById('onboarding-overlay');
    
    if (onboardingStep >= ONBOARDING_STEPS.length) {
        // 온보딩 완료
        completeOnboarding();
        return;
    }
    
    onboardingStep++;
    
    // 잠시 오버레이 숨기기
    overlay.style.display = 'none';
    
    // 1초 후 다음 단계 표시
    setTimeout(() => {
        // 타임아웃 중에 건너뛰기가 실행되었을 수 있으니 재확인
        if (onboardingActive) {
            showOnboardingStep();
        }
    }, 1000);
}

// 온보딩 완료 함수
function completeOnboarding() {
    const overlay = document.getElementById('onboarding-overlay');
    const dragHint = document.getElementById('drag-hint');
    
    overlay.style.display = 'none';
    dragHint.style.display = 'none';
    onboardingActive = false;
    onboardingStep = 0;
    
    // 도움말 패널 표시
    showHelpPanel();
    
    console.log('🎉 온보딩 완료!');
}

// 온보딩 건너뛰기 함수
window.skipOnboarding = function() {
    console.log('⏭️ 온보딩 건너뛰기 버튼 클릭됨 (현재 단계:', onboardingStep, ')');
    
    // 온보딩 상태를 즉시 종료
    onboardingActive = false;
    onboardingStep = 0;
    
    const overlay = document.getElementById('onboarding-overlay');
    const dragHint = document.getElementById('drag-hint');
    
    // 즉시 숨기기
    if (overlay) overlay.style.display = 'none';
    if (dragHint) dragHint.style.display = 'none';
    
    // 도움말 패널 표시
    showHelpPanel();
    
    console.log('✅ 온보딩 즉시 종료됨');
}


// 인트로 화면 다시 표시 함수
function showIntroOverlay() {
    const introOverlay = document.getElementById('intro-overlay');
    const helpPanel = document.getElementById('help-panel');
    const helpToggleBtn = document.getElementById('help-toggle-btn');
    
    // 인트로 화면 다시 표시
    introOverlay.style.display = 'flex';
    introOverlay.style.opacity = '1';
    introOverlay.classList.remove('fade-out');
    
    // 도움말 패널 숨기기
    helpPanel.style.display = 'none';
    helpToggleBtn.style.display = 'none';
    
    console.log('🔄 인트로 화면 다시 표시');
}

// URL 파라미터에서 새로운 별자리 확인 및 추가
function checkURLForNewConstellation() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const constellationParam = urlParams.get('newConstellation');
        
        if (constellationParam) {
            const constellation = JSON.parse(decodeURIComponent(constellationParam));
            console.log('🔗 URL에서 새 별자리 발견:', constellation);
            
            // URL 파라미터 제거 (깔끔하게)
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // 별자리를 3D 공간에 추가
            addConstellationFromTest(constellation);
            
            // 알림 표시
            showNotification(`✨ "${constellation.userName}"의 별자리가 추가되었습니다!`, 'new-star');
        }
    } catch (error) {
        console.error('❌ URL 파라미터 처리 중 오류:', error);
    }
}

// localStorage에서 새로운 별자리 확인 및 추가
function checkLocalStorageForNewConstellations() {
    try {
        const constellations3D = localStorage.getItem('constellations3D');
        if (!constellations3D) return;
        
        const constellations = JSON.parse(constellations3D);
        if (!Array.isArray(constellations) || constellations.length === 0) return;
        
        // 처리되지 않은 별자리들을 확인
        const processedKey = 'processedConstellations3D';
        const processedConstellations = JSON.parse(localStorage.getItem(processedKey) || '[]');
        
        constellations.forEach(constellation => {
            // 이미 처리된 별자리인지 확인
            const isProcessed = processedConstellations.some(
                p => p.timestamp === constellation.timestamp && p.userName === constellation.userName
            );
            
            if (!isProcessed) {
                // 별자리를 3D 공간에 추가
                console.log('📦 localStorage에서 새 별자리 발견:', constellation);
                addConstellationFromTest(constellation);
                
                // 처리 완료 표시
                processedConstellations.push({
                    timestamp: constellation.timestamp,
                    userName: constellation.userName
                });
                
                // 알림 표시
                showNotification(`✨ "${constellation.userName}"의 별자리가 추가되었습니다!`, 'new-star');
            }
        });
        
        // 처리 완료 목록 저장
        localStorage.setItem(processedKey, JSON.stringify(processedConstellations));
        
    } catch (error) {
        console.error('❌ localStorage 별자리 확인 중 오류:', error);
    }
}

// 페이지 로드 시 실행
window.addEventListener('load', () => {
    // URL 파라미터 확인 (최우선)
    setTimeout(checkURLForNewConstellation, 500);
    
    // WebSocket 연결 시도
    setTimeout(initializeWebSocket, 1000);
    
    // localStorage 확인 (WebSocket 없이도 작동)
    setTimeout(checkLocalStorageForNewConstellations, 2000);
    
    // 주기적으로 localStorage 확인 (10초마다)
    setInterval(checkLocalStorageForNewConstellations, 10000);
});