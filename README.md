# Aster 3D 별자리 뷰어

사용자가 만든 별자리를 3D 공간에서 실시간으로 확인할 수 있는 웹 애플리케이션입니다.

## 기능

- 🌟 3D 별자리 시각화
- 🔄 실시간 별자리 추가
- 💫 인터랙티브 UI (마우스 드래그, 줌, 클릭)
- 📱 모바일 지원

## Vercel 배포 방법

### 1. Vercel 계정 준비
- https://vercel.com 에 가입합니다.

### 2. 프로젝트 배포

#### 방법 A: Vercel CLI 사용 (권장)

```bash
# Vercel CLI 설치 (처음 한 번만)
npm install -g vercel

# 프로젝트 디렉토리로 이동
cd C:\Users\wwlsg\Documents\Aster\3d_102030

# Vercel 로그인 (처음 한 번만)
vercel login

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

#### 방법 B: GitHub 연동 배포

1. GitHub에 프로젝트를 업로드합니다.
2. Vercel 대시보드에서 "New Project" 클릭
3. GitHub 저장소를 선택
4. 배포 설정:
   - Framework Preset: Other
   - Build Command: (비워두기)
   - Output Directory: (비워두기)
5. "Deploy" 클릭

### 3. IPAD_ATSER 프로젝트와 연결

배포 완료 후 Vercel에서 제공하는 URL을 복사합니다 (예: `https://your-project.vercel.app`)

그 다음 `IPAD_ATSER/result.html` 파일을 수정합니다:

```javascript
// 518번째 줄 근처
const url3D = isLocalhost 
    ? 'http://localhost:5173/index.html'
    : 'https://your-project.vercel.app';  // ← 여기에 실제 Vercel URL 입력
```

## 로컬 개발

```bash
# HTTP 서버 실행 (Python)
python -m http.server 5173

# 또는 (Node.js)
npx http-server -p 5173

# 브라우저에서 열기
# http://localhost:5173
```

## 데이터 흐름

1. 사용자가 IPAD_ATSER에서 별자리를 생성
2. "3D별에 추가" 버튼 클릭
3. 별자리 데이터가 localStorage에 저장
4. 3D 뷰어가 새 탭에서 열림
5. 3D 뷰어가 localStorage에서 데이터를 읽어 별자리 표시

## 주의사항

- localStorage는 같은 도메인에서만 공유됩니다
- 다른 도메인에 배포했다면 CORS 정책에 따라 localStorage 공유가 안 될 수 있습니다
- 이 경우 두 프로젝트를 같은 도메인에 배포하거나, URL 파라미터 방식으로 변경해야 합니다

## 문제 해결

### localStorage가 공유되지 않을 때

두 프로젝트를 같은 Vercel 프로젝트로 배포:

```
your-domain.vercel.app/
  ├── index.html (IPAD_ATSER)
  ├── select.html
  ├── main.html
  ├── result.html
  └── 3d/
      └── index.html (3D 뷰어)
```

또는 URL 파라미터 방식 사용 (result.html 수정 필요)
