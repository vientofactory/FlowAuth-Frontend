# FlowAuth Frontend

FlowAuth의 프론트엔드 애플리케이션입니다. SvelteKit을 기반으로 모던하고 직관적인 OAuth2/OIDC 관리 인터페이스를 제공합니다.

## 기술 스택

- **Framework**: [SvelteKit](https://kit.svelte.dev/)
- **Language**: TypeScript
- **Styling**: [TailwindCSS](https://tailwindcss.com/)
- **Build Tool**: Vite
- **State Management**: Svelte Stores
- **Icons**: Font Awesome
- **Linting**: ESLint
- **Code Formatting**: Prettier

## 사전 요구사항

- Node.js (v18 이상)
- npm 또는 yarn
- 백엔드 서버 실행 중 (http://localhost:3000)

## 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

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

## 프로젝트 구조

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

## 주요 기능

### 인증 시스템

- **회원가입/로그인**: JWT 기반 사용자 인증
- **프로필 관리**: 사용자 정보 조회 및 수정
- **세션 관리**: 자동 로그인 및 로그아웃

### 대시보드

- **메인 대시보드**: 통계 및 빠른 액션
- **클라이언트 관리**: OAuth2/OIDC 애플리케이션 등록/관리
- **토큰 관리**: 발급된 토큰 조회/취소
- **OAuth2/OIDC 테스터**: 개발자용 테스트 도구

### OAuth2/OIDC 플로우

- **인가 요청**: 사용자 권한 승인 인터페이스
- **콜백 처리**: 토큰 교환 및 결과 표시
- **PKCE 지원**: 보안 강화된 인증 플로우
- **OIDC 스코프 지원**: openid, profile, email 스코프 관리

### 컴포넌트 라이브러리

- **Button**: 다양한 스타일의 버튼 컴포넌트
- **Input**: 폼 입력 필드
- **Card**: 콘텐츠 컨테이너
- **Modal**: 팝업 다이얼로그
- **Table**: 데이터 테이블
- **Toast**: 알림 메시지 시스템

## API 문서

### 주요 엔드포인트

프론트엔드는 백엔드 API를 통해 데이터를 교환합니다. 주요 API 엔드포인트는 다음과 같습니다:

#### 인증 관련

- `POST /auth/login` - 사용자 로그인
- `POST /auth/register` - 사용자 등록
- `GET /auth/profile` - 프로필 조회

#### OAuth2 관련

- `GET /oauth2/authorize` - 인가 요청
- `POST /oauth2/token` - 토큰 발급
- `GET /oauth2/userinfo` - 사용자 정보 조회
- `POST /oauth2/authorize/consent` - 동의 처리

#### 클라이언트 관리

- `GET /clients` - 클라이언트 목록 조회
- `POST /clients` - 새 클라이언트 생성
- `PUT /clients/:id` - 클라이언트 수정
- `DELETE /clients/:id` - 클라이언트 삭제

#### 헬스체크

- `GET /health` - 애플리케이션 헬스체크

### API 통신

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

## 테스트

```bash
# 단위 테스트 실행
npm run test

# 테스트 커버리지 확인
npm run test:cov

# E2E 테스트 실행
npm run test:e2e
```

## 사용 가능한 스크립트

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

## 환경 설정

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

### 추가 환경 변수

```env
# Backend API URL (기본값: http://localhost:3000)
VITE_API_URL=http://localhost:3000
```

## 보안 기능

- **JWT 토큰 기반 인증**: 백엔드와의 안전한 통신
- **PKCE 지원**: OAuth2 인증 플로우의 보안 강화
- **CORS 설정**: 백엔드와의 안전한 교차 출처 요청
- **입력 검증**: 클라이언트 측 폼 유효성 검사
- **XSS 방지**: Svelte의 자동 이스케이핑 및 보안 헤더

## 문제 해결

### 빌드 오류

**문제**: 빌드 실패 또는 타입 오류

**해결 방법**:

1. 의존성 재설치:

   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. 타입 체크 실행:

   ```bash
   npm run check
   ```

3. 캐시 클리어:

   ```bash
   npm run prepare
   ```

### API 연결 오류

**문제**: 백엔드 API와의 통신 실패

**해결 방법**:

1. 백엔드 서버 실행 확인:

   ```bash
   # 백엔드 디렉토리에서
   npm run start:dev
   ```

2. 환경 변수 확인:

   ```bash
   cat .env
   # VITE_API_URL이 올바른지 확인
   ```

3. CORS 설정 확인: 백엔드의 CORS 설정이 프론트엔드 도메인을 허용하는지 확인

### 스타일링 문제

**문제**: TailwindCSS 스타일이 적용되지 않음

**해결 방법**:

1. Tailwind 설정 확인:

   ```bash
   npx tailwindcss --help
   ```

2. 빌드 재실행:

   ```bash
   npm run build
   ```

## 배포

### Node.js 서버 배포

이 프로젝트는 `@sveltejs/adapter-node`를 사용하여 Node.js 서버로 배포됩니다.

```bash
# 빌드
npm run build

# 서버 시작 (프로덕션)
node build/index.js

# 또는 PM2를 사용한 프로덕션 배포
npm install -g pm2
pm2 start build/index.js --name flowauth-frontend
```

### 지원되는 플랫폼

- **Vercel**: `vercel --prod`
- **Railway**: Node.js 애플리케이션으로 배포
- **Render**: Node.js 웹 서비스로 배포
- **Heroku**: Node.js 앱으로 배포
- **DigitalOcean App Platform**: Node.js 앱으로 배포
- **PM2**: 프로세스 매니저를 통한 배포

## 개발 환경 설정

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

## 기여하기

1. 이 리포지토리를 포크하세요
2. 기능 브랜치를 생성하세요 (`git checkout -b feature/AmazingFeature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 푸시하세요 (`git push origin feature/AmazingFeature`)
5. Pull Request를 생성하세요

### 코드 스타일

- ESLint 규칙 준수
- Prettier 자동 포맷팅
- 의미 있는 커밋 메시지

## 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.
