// 애플리케이션 상수들
export const APP_CONSTANTS = {
	API_BASE_URL: 'http://localhost:3000',
	FRONTEND_URL: 'http://localhost:5174',
	DEFAULT_RETRY_COUNT: 3,
	DEFAULT_RETRY_DELAY: 1000, // 1 second
	TOKEN_STORAGE_KEY: 'auth_token',
	REDIRECT_DELAY: 1000 // 1 second
} as const;

// 라우트 상수들
export const ROUTES = {
	HOME: '/',
	LOGIN: '/auth/login',
	REGISTER: '/auth/register',
	DASHBOARD: '/dashboard',
	FORGOT_PASSWORD: '/auth/forgot-password'
} as const;

// API 엔드포인트 상수들
export const API_ENDPOINTS = {
	AUTH: {
		LOGIN: '/auth/login',
		REGISTER: '/auth/register',
		PROFILE: '/auth/profile',
		CLIENTS: '/auth/clients',
		LOGOUT: '/auth/logout'
	}
} as const;

// UI 상수들
export const UI_CONSTANTS = {
	TOAST_DURATION: 3000, // 3 seconds
	SUCCESS_TOAST_DURATION: 4000, // 4 seconds
	INPUT_DEBOUNCE_DELAY: 300
} as const;

// 메시지 상수들
export const MESSAGES = {
	VALIDATION: {
		EMAIL_PASSWORD_REQUIRED: '이메일과 비밀번호를 입력해주세요.',
		LOGIN_SUCCESS: '로그인에 성공했습니다!',
		LOGIN_FAILED: '이메일 또는 비밀번호가 올바르지 않습니다.',
		AUTHENTICATION_REQUIRED: '인증이 필요합니다.',
		NETWORK_ERROR: '네트워크 연결을 확인해주세요.'
	}
} as const;
