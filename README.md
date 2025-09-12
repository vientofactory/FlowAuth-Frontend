# FlowAuth Frontend

FlowAuth의 프론트엔드 애플리케이션입니다. SvelteKit을 기반으로 모던하고 직관적인 OAuth2 관리 인터페이스를 제공합니다.

## 🚀 기술 스택

- **Framework**: [SvelteKit](https://kit.svelte.dev/)
- **Language**: TypeScript
- **Styling**: [TailwindCSS](https://tailwindcss.com/)
- **Build Tool**: Vite
- **Linting**: ESLint
- **Code Formatting**: Prettier

## 📋 사전 요구사항

- Node.js (v18 이상)
- npm 또는 yarn

## 🛠 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
# 개발 모드 (핫 리로드)
npm run dev

# 브라우저에서 자동 열기
npm run dev -- --open
```

애플리케이션이 `http://localhost:5173`에서 실행됩니다.

### 3. 프로덕션 빌드

```bash
# 프로덕션용 빌드
npm run build

# 빌드 미리보기
npm run preview
```

## 🧪 테스트 및 품질

```bash
# 코드 포맷팅 확인
npm run format

# 코드 린팅
npm run lint

# 타입 체크
npm run check
```

## 🏗 프로젝트 구조

```
src/
├── app.css                 # 글로벌 스타일
├── app.d.ts                # 타입 정의
├── app.html                # HTML 템플릿
├── lib/
│   ├── index.ts            # 라이브러리 익스포트
│   └── assets/             # 정적 에셋
├── routes/                 # 페이지 라우트
│   ├── +layout.svelte      # 레이아웃
│   └── +page.svelte        # 메인 페이지
└── ...
```

## 🎨 디자인 시스템

### 색상 팔레트

- **Primary**: Blue (#3B82F6)
- **Secondary**: Gray (#6B7280)
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Error**: Red (#EF4444)

### 컴포넌트

- 반응형 디자인
- 접근성 고려
- 모던한 UI/UX

## 🔧 주요 기능

### 사용자 인터페이스

- 로그인/회원가입 페이지
- 대시보드
- 프로필 관리
- 설정 페이지

### OAuth2 관리

- 클라이언트 등록 폼
- 권한 부여 동의 페이지
- 토큰 관리 인터페이스
- 콜백 처리

### 관리자 기능

- 사용자 관리
- 클라이언트 관리
- 권한 부여 내역 조회

## 🌐 API 연동

백엔드 API와의 통신을 위해 다음 환경 변수를 설정하세요:

```env
# .env 파일
VITE_API_BASE_URL=http://localhost:3000
```

## 📱 반응형 디자인

모든 페이지가 모바일, 태블릿, 데스크톱 환경에 최적화되어 있습니다.

## 🚀 배포

### 정적 사이트 배포

```bash
npm run build
# dist 폴더의 파일들을 웹 서버에 업로드
```

### 지원되는 플랫폼

- Vercel
- Netlify
- GitHub Pages
- 일반 웹 서버

## 🔧 개발 환경 설정

### VS Code 추천 확장

- Svelte for VS Code
- Tailwind CSS IntelliSense
- Prettier
- ESLint

### 브라우저 지원

- Chrome (최신)
- Firefox (최신)
- Safari (최신)
- Edge (최신)

## 🤝 기여하기

1. 이 리포지토리를 포크하세요
2. 기능 브랜치를 생성하세요 (`git checkout -b feature/AmazingFeature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 푸시하세요 (`git push origin feature/AmazingFeature`)
5. Pull Request를 생성하세요

### 코드 스타일

- ESLint 규칙 준수
- Prettier 자동 포맷팅
- 의미 있는 커밋 메시지

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.
