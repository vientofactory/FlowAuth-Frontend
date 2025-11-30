import { dev } from '$app/environment';

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
