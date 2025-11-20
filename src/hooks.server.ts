import { error, type Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';

// 에러 처리를 위한 handle 함수
export const handle: Handle = async ({ event, resolve }) => {
	try {
		const response = await resolve(event);

		// 404 에러 처리
		if (response.status === 404) {
			// 정적 파일들은 그대로 처리
			if (event.url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
				return response;
			}

			// API 엔드포인트 404는 JSON으로 응답
			if (event.url.pathname.startsWith('/api/')) {
				return new Response(
					JSON.stringify({
						error: 'Not Found',
						message: 'The requested API endpoint does not exist',
						status: 404
					}),
					{
						status: 404,
						headers: {
							'Content-Type': 'application/json'
						}
					}
				);
			}
		}

		return response;
	} catch (err) {
		// 개발 모드에서는 상세한 에러 정보 표시
		if (dev) {
			console.error('Handle error:', err);
		}

		// 에러 타입에 따른 처리
		if (err instanceof Error) {
			// 네트워크 관련 에러
			if (err.message.includes('ECONNREFUSED') || err.message.includes('fetch failed')) {
				throw error(502, {
					message: 'Backend service is unavailable'
				});
			}

			// 타임아웃 에러
			if (err.message.includes('timeout') || err.message.includes('ETIMEDOUT')) {
				throw error(504, {
					message: 'Request timeout'
				});
			}
		}

		// 기본 서버 에러
		throw error(500, {
			message: dev ? (err as Error).message : 'Internal server error'
		});
	}
};

// 클라이언트 사이드 에러 처리
export const handleError = ({ error: err, event, status, message }) => {
	// 에러 로깅 (개발 모드에서만)
	if (dev) {
		console.error('Client error:', {
			error: err,
			status,
			message,
			url: event?.url?.pathname,
			timestamp: new Date().toISOString()
		});
	}

	// 프로덕션에서는 정보 숨기기
	return {
		message: dev ? message : getPublicErrorMessage(status)
	};
};

// 공개적으로 안전한 에러 메시지 반환
function getPublicErrorMessage(status: number): string {
	switch (status) {
		case 400:
			return 'Bad request';
		case 401:
			return 'Authentication required';
		case 403:
			return 'Access forbidden';
		case 404:
			return 'Page not found';
		case 429:
			return 'Too many requests';
		case 500:
			return 'Internal server error';
		case 502:
			return 'Bad gateway';
		case 503:
			return 'Service unavailable';
		case 504:
			return 'Gateway timeout';
		default:
			return 'An error occurred';
	}
}
