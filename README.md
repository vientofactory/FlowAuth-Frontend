# FlowAuth Frontend

FlowAuth의 프론트엔드 애플리케이션입니다. SvelteKit을 기반으로 모던하고 직관적인 OAuth2 관리 인터페이스를 제공합니다.

## 🚀 기술 스택

- **Framework**: [SvelteKit](https://kit.svelte.dev/)
- **Language**: TypeScript
- **Styling**: [TailwindCSS](https://tailwindcss.com/)
- **Build Tool**: Vite
- **State Management**: Svelte Stores
- **Icons**: Font Awesome
- **Linting**: ESLint
- **Code Formatting**: Prettier

## 📋 사전 요구사항

- Node.js (v18 이상)
- npm 또는 yarn
- 백엔드 서버 실행 중 (http://localhost:3000)

## 🛠️ 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정 (선택사항)

```env
# Backend API URL (기본값: http://localhost:3000)
VITE_API_URL=http://localhost:3000
```

### 3. 개발 서버 실행

```bash
# 개발 모드 (핫 리로드)
npm run dev

# 브라우저에서 자동 열기
npm run dev -- --open
```

애플리케이션이 `http://localhost:5173`에서 실행됩니다.

### 4. 프로덕션 빌드

```bash
# 프로덕션용 빌드
npm run build

# 빌드 미리보기
npm run preview
```

## 📁 프로젝트 구조

```
frontend/
├── src/
│   ├── app.css                 # 글로벌 스타일
│   ├── app.d.ts               # 타입 정의
│   ├── app.html               # HTML 템플릿
│   ├── lib/
│   │   ├── components/        # 재사용 가능한 컴포넌트
│   │   │   ├── AuthLayout.svelte
│   │   │   ├── Button.svelte
│   │   │   ├── Card.svelte
│   │   │   ├── Input.svelte
│   │   │   ├── Modal.svelte
│   │   │   ├── Table.svelte
│   │   │   └── ...
│   │   ├── composables/       # 커스텀 훅
│   │   │   └── useToast.ts
│   │   ├── config/            # 설정 파일
│   │   │   └── env.ts
│   │   ├── constants/         # 상수 정의
│   │   │   └── app.constants.ts
│   │   ├── stores/            # 상태 관리
│   │   │   ├── auth.ts        # 인증 상태
│   │   │   └── toast.ts       # 토스트 알림 상태
│   │   ├── types/             # TypeScript 타입
│   │   │   └── oauth.types.ts
│   │   └── utils/             # 유틸리티 함수
│   │       ├── api.ts         # API 클라이언트
│   │       └── crypto.util.ts # 암호화 유틸리티
│   └── routes/                # 페이지 라우트
│       ├── +layout.svelte     # 레이아웃
│       ├── +page.svelte       # 메인 페이지
│       ├── auth/              # 인증 관련 페이지
│       │   ├── login/         # 로그인
│       │   └── register/      # 회원가입
│       ├── dashboard/         # 대시보드
│       │   ├── +page.svelte   # 대시보드 메인
│       │   ├── clients/       # 클라이언트 관리
│       │   ├── oauth-tester/  # OAuth2 테스터
│       │   ├── profile/       # 프로필 관리
│       │   ├── settings/      # 설정
│       │   └── tokens/        # 토큰 관리
│       ├── oauth2/            # OAuth2 플로우
│       │   └── authorize/     # 인가 페이지
│       └── callback/          # OAuth2 콜백
├── static/                    # 정적 파일
│   └── robots.txt
├── tests/                     # 테스트 파일
└── package.json
```

## 🎨 주요 기능

### 🔐 인증 시스템

- **회원가입/로그인**: JWT 기반 사용자 인증
- **프로필 관리**: 사용자 정보 조회 및 수정
- **세션 관리**: 자동 로그인 및 로그아웃

### 🏠 대시보드

- **메인 대시보드**: 통계 및 빠른 액션
- **클라이언트 관리**: OAuth2 애플리케이션 등록/관리
- **토큰 관리**: 발급된 토큰 조회/취소
- **OAuth2 테스터**: 개발자용 테스트 도구

### 🔄 OAuth2 플로우

- **인가 요청**: 사용자 권한 승인 인터페이스
- **콜백 처리**: 토큰 교환 및 결과 표시
- **PKCE 지원**: 보안 강화된 인증 플로우

### 🧩 컴포넌트 라이브러리

- **Button**: 다양한 스타일의 버튼 컴포넌트
- **Input**: 폼 입력 필드
- **Card**: 콘텐츠 컨테이너
- **Modal**: 팝업 다이얼로그
- **Table**: 데이터 테이블
- **Toast**: 알림 메시지 시스템

## 🧪 테스트 및 품질

### 코드 품질 검사

```bash
# 타입 체크
npm run check

# 린팅 및 포맷팅
npm run lint

# 타입 체크 (워치 모드)
npm run check:watch
```

### 개발 도구

```bash
# 코드 포맷팅
npm run format

# SvelteKit 동기화
npm run prepare
```

## 📜 사용 가능한 스크립트

```bash
# 개발
npm run dev           # 개발 서버
npm run dev -- --open # 브라우저 자동 열기

# 빌드
npm run build         # 프로덕션 빌드
npm run preview       # 빌드 미리보기

# 코드 품질
npm run check         # 타입 체크
npm run lint          # 린팅
npm run format        # 포맷팅
```

## ⚙️ 환경별 설정

### 개발 환경

```bash
npm run dev
# HMR 활성화, 소스맵 포함
```

### 프로덕션 환경

```bash
npm run build
npm run preview
# 최적화된 빌드, 정적 파일 제공
```

## 🌐 API 통신

타입 안전한 API 클라이언트를 통해 백엔드와 통신합니다:

```typescript
// lib/utils/api.ts
export class ApiClient {
	async getClients() {
		return this.request('/clients');
	}

	async createClient(data: CreateClientDto) {
		return this.request('/clients', {
			method: 'POST',
			body: JSON.stringify(data)
		});
	}
}
```

## 📱 반응형 디자인

모바일 우선 접근 방식을 채택하여 모든 디바이스에서 최적의 경험을 제공합니다.

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
