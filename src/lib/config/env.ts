// 환경변수 접근을 위한 유틸리티
export const env = {
	API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
	APP_NAME: import.meta.env.VITE_APP_NAME || 'FlowAuth',
	APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0'
} as const;

// API URL 생성 헬퍼 함수
export function createApiUrl(endpoint: string): string {
	return `${env.API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
}

// 개발 모드 확인
export const isDev = import.meta.env.DEV;
export const isProd = import.meta.env.PROD;
