// 애플리케이션 상수들
export const APP_CONSTANTS = {
	API_BASE_URL: 'http://localhost:3000',
	FRONTEND_URL: 'http://localhost:5174',
	DEFAULT_RETRY_COUNT: 3,
	DEFAULT_RETRY_DELAY: 1000, // 1 second
	TOKEN_STORAGE_KEY: 'auth_token',
	REFRESH_TOKEN_STORAGE_KEY: 'refresh_token',
	ID_TOKEN_STORAGE_KEY: 'id_token',
	TOKEN_EXPIRY_STORAGE_KEY: 'token_expiry',
	REDIRECT_DELAY: 1000 // 1 second
} as const;

// 토큰 타입별 스토리지 키
export const TOKEN_STORAGE_KEYS = {
	LOGIN: 'auth_token_login',
	OAUTH2: 'auth_token_oauth2',
	REFRESH_LOGIN: 'refresh_token_login',
	REFRESH_OAUTH2: 'refresh_token_oauth2'
} as const;

// 라우트 상수들
export const ROUTES = {
	HOME: '/',
	LOGIN: '/auth/login',
	REGISTER: '/auth/register',
	DASHBOARD: '/dashboard',
	DASHBOARD_PROFILE: '/dashboard/profile',
	DASHBOARD_CLIENTS: '/dashboard/clients',
	DASHBOARD_CONNECTIONS: '/dashboard/connections',
	DASHBOARD_TOKENS: '/dashboard/tokens',
	DASHBOARD_OAUTH_TESTER: '/dashboard/oauth-tester',
	DASHBOARD_EMAIL_MANAGEMENT: '/dashboard/email-management',
	FORGOT_PASSWORD: '/auth/forgot-password',
	RESET_PASSWORD: '/auth/reset-password',
	VERIFY_EMAIL: '/auth/verify-email',
	OAUTH_AUTHORIZE: '/oauth2/authorize',
	CALLBACK: '/callback'
} as const;

// API 엔드포인트 상수들
export const API_ENDPOINTS = {
	AUTH: {
		LOGIN: '/auth/login',
		REGISTER: '/auth/register',
		PROFILE: '/profile',
		ME: '/auth/me',
		CLIENTS: '/auth/clients',
		LOGOUT: '/auth/logout',
		REFRESH: '/auth/refresh',
		TOKENS: '/auth/tokens'
	},
	OAUTH2: {
		TOKEN: '/oauth2/token',
		AUTHORIZE: '/oauth2/authorize',
		AUTHORIZE_INFO: '/oauth2/authorize/info',
		AUTHORIZE_CONSENT: '/oauth2/authorize/consent',
		SCOPES: '/oauth2/scopes',
		USERINFO: '/oauth2/userinfo'
	},
	DASHBOARD: {
		STATS: '/dashboard/stats',
		ACTIVITIES: '/dashboard/activities',
		CONNECTED_APPS: '/dashboard/connected-apps',
		ANALYTICS: {
			TOKEN: '/dashboard/analytics/token',
			SECURITY: '/dashboard/analytics/security',
			ADVANCED: '/dashboard/analytics/advanced'
		}
	},
	UPLOADS: {
		CONFIG: '/uploads/config',
		LOGO: '/uploads/logo'
	}
} as const;

// UI 상수들
export const UI_CONSTANTS = {
	TOAST_DURATION: 3000, // 3 seconds
	SUCCESS_TOAST_DURATION: 4000, // 4 seconds
	INPUT_DEBOUNCE_DELAY: 300
} as const;

// 스타일 상수들
export const STYLE_CONSTANTS = {
	GRADIENTS: {
		PRIMARY: 'bg-gradient-to-r from-blue-600 to-indigo-600',
		SECONDARY: 'bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-100',
		TEXT_PRIMARY: 'bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'
	},
	BACKGROUND: {
		PAGE: 'min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100',
		CARD: 'bg-white/80 shadow-2xl backdrop-blur-sm'
	},
	BORDER: 'border-white/20',
	SHADOW: 'shadow-lg'
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
