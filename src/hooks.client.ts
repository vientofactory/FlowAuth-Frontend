import { dev } from '$app/environment';
import type { HandleClientError } from '@sveltejs/kit';

function printSecurityWarn(): void {
	console.log(
		'%c!!! WARNING !!!',
		'color: #fff; background: #d32f2f; font-size: 18px; font-weight: bold; padding: 8px 16px; border-radius: 6px;'
	);
	console.log(
		'%c브라우저 콘솔에 알 수 없는 코드를 입력하지 마세요! 계정의 액세스 토큰이 악의적인 사용자에게 넘어갈 수 있습니다.',
		'color: #fff; background: #fbc02d; font-size: 16px; font-weight: bold; padding: 6px 12px; border-radius: 4px;'
	);
	console.log(
		'%c팁: 개발자 도구를 사용할 때는 항상 신뢰할 수 있는 출처의 코드만 실행하세요.',
		'color: #1976d2; background: #e3f2fd; font-size: 14px; padding: 4px 10px; border-radius: 3px;'
	);
}

// 보안 경고 출력
if (!dev && typeof window !== 'undefined') {
	setInterval(() => {
		printSecurityWarn();
	}, 5000);
}

// 클라이언트 사이드 에러 처리
export const handleError: HandleClientError = ({ error, event, status, message }) => {
	// 개발 모드에서는 콘솔에 상세 에러 로그
	if (dev) {
		console.error('Client-side error:', {
			error,
			status,
			message,
			url: event?.url?.pathname,
			userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
			timestamp: new Date().toISOString()
		});
	}

	// 특정 에러 타입별 처리
	if (error instanceof Error) {
		// 네트워크 에러 처리
		if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
			return {
				message: '네트워크 연결을 확인해주세요.',
				code: 'NETWORK_ERROR'
			};
		}

		// 권한 에러 처리
		if (error.message.includes('Unauthorized') || status === 401) {
			return {
				message: '인증이 필요합니다.',
				code: 'AUTH_ERROR'
			};
		}

		// 접근 권한 에러 처리
		if (error.message.includes('Forbidden') || status === 403) {
			return {
				message: '접근 권한이 없습니다.',
				code: 'PERMISSION_ERROR'
			};
		}

		// 페이지 찾을 수 없음
		if (status === 404) {
			return {
				message: '페이지를 찾을 수 없습니다.',
				code: 'NOT_FOUND'
			};
		}

		// 서버 에러
		if (status >= 500) {
			return {
				message: '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
				code: 'SERVER_ERROR'
			};
		}
	}

	// 기본 에러 메시지 (개발 모드에서는 상세 정보, 프로덕션에서는 일반적인 메시지)
	return {
		message: dev
			? message || '예기치 못한 오류가 발생했습니다.'
			: '오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
		code: 'UNKNOWN_ERROR'
	};
};

// 전역 에러 핸들러 (window.onerror)
if (typeof window !== 'undefined') {
	window.addEventListener('error', (event) => {
		if (dev) {
			console.error('Global error:', {
				message: event.message,
				filename: event.filename,
				lineno: event.lineno,
				colno: event.colno,
				error: event.error,
				timestamp: new Date().toISOString()
			});
		}
	});

	// Promise rejection 핸들러
	window.addEventListener('unhandledrejection', (event) => {
		if (dev) {
			console.error('Unhandled promise rejection:', {
				reason: event.reason,
				timestamp: new Date().toISOString()
			});
		}

		// 인증 관련 Promise rejection은 로그인 페이지로 리다이렉트
		if (
			event.reason &&
			typeof event.reason === 'object' &&
			(event.reason.status === 401 || event.reason.message?.includes('Unauthorized'))
		) {
			// 현재 페이지가 인증 페이지가 아닌 경우에만 리다이렉트
			if (!window.location.pathname.startsWith('/auth')) {
				const loginUrl = new URL('/auth/login', window.location.origin);
				loginUrl.searchParams.set('returnUrl', window.location.pathname + window.location.search);
				window.location.href = loginUrl.toString();
			}
		}
	});
}
