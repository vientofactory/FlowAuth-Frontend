/**
 * API 에러 처리를 위한 유틸리티 함수들
 */

export interface ApiError {
	status: number;
	message: string;
	code?: string;
	details?: Record<string, unknown>;
	timestamp: string;
}

/**
 * 표준 API 에러 생성
 */
export function createApiError(
	status: number,
	message: string,
	code?: string,
	details?: Record<string, unknown>
): ApiError {
	return {
		status,
		message,
		code,
		details,
		timestamp: new Date().toISOString()
	};
}

/**
 * HTTP 상태 코드에 따른 사용자 친화적 메시지 반환
 */
export function getErrorMessage(status: number, originalMessage?: string): string {
	// 원본 메시지가 사용자 친화적인 경우 그대로 사용
	if (originalMessage && !originalMessage.includes('Error:') && originalMessage.length < 100) {
		return originalMessage;
	}

	switch (status) {
		case 400:
			return '요청에 문제가 있습니다. 입력한 정보를 다시 확인해주세요.';
		case 401:
			return '로그인이 필요합니다.';
		case 403:
			return '이 작업을 수행할 권한이 없습니다.';
		case 404:
			return '요청한 리소스를 찾을 수 없습니다.';
		case 408:
			return '요청 시간이 초과되었습니다. 다시 시도해주세요.';
		case 409:
			return '데이터 충돌이 발생했습니다.';
		case 422:
			return '입력한 데이터에 문제가 있습니다.';
		case 429:
			return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
		case 500:
			return '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
		case 502:
			return '서버가 응답하지 않습니다. 잠시 후 다시 시도해주세요.';
		case 503:
			return '서비스가 일시적으로 사용할 수 없습니다.';
		case 504:
			return '서버 응답 시간이 초과되었습니다.';
		default:
			return originalMessage || '알 수 없는 오류가 발생했습니다.';
	}
}

/**
 * fetch 에러를 표준 ApiError로 변환
 */
export async function handleFetchError(response: Response): Promise<ApiError> {
	let errorData: Record<string, unknown> = {};

	try {
		// JSON 응답 시도
		errorData = await response.json();
	} catch {
		// JSON이 아닌 경우 텍스트로 시도
		try {
			const text = await response.text();
			errorData = { message: text };
		} catch {
			errorData = { message: 'Unknown error' };
		}
	}

	const message = typeof errorData.message === 'string' ? errorData.message : undefined;
	const code = typeof errorData.code === 'string' ? errorData.code : `HTTP_${response.status}`;

	return createApiError(
		response.status,
		getErrorMessage(response.status, message),
		code,
		errorData
	);
}

/**
 * JavaScript 에러를 ApiError로 변환
 */
export function handleJavaScriptError(error: Error): ApiError {
	let status = 500;
	let message = error.message;

	// 네트워크 에러 감지
	if (
		error.message.includes('NetworkError') ||
		error.message.includes('fetch') ||
		error.message.includes('ERR_NETWORK')
	) {
		status = 0; // 네트워크 에러
		message = '네트워크 연결을 확인해주세요.';
	}

	// 타임아웃 에러 감지
	if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
		status = 408;
		message = '요청 시간이 초과되었습니다.';
	}

	return createApiError(status, getErrorMessage(status, message), error.name, {
		originalMessage: error.message,
		stack: error.stack
	});
}

/**
 * 에러 타입 감지
 */
export function getErrorType(
	error: ApiError
): 'network' | 'auth' | 'permission' | 'validation' | 'server' | 'client' | 'unknown' {
	const { status } = error;

	if (status === 0) return 'network';
	if (status === 401) return 'auth';
	if (status === 403) return 'permission';
	if (status >= 400 && status < 500) return 'client';
	if (status >= 500) return 'server';
	if (status === 422 || status === 400) return 'validation';

	return 'unknown';
}

/**
 * 에러에 대한 권장 액션 반환
 */
export function getErrorActions(error: ApiError): Array<{
	label: string;
	action: string;
	variant: 'primary' | 'secondary' | 'danger' | 'outline';
}> {
	const type = getErrorType(error);

	switch (type) {
		case 'network':
			return [
				{ label: '다시 시도', action: 'retry', variant: 'primary' },
				{ label: '오프라인 모드', action: 'offline', variant: 'outline' }
			];
		case 'auth':
			return [
				{ label: '로그인', action: 'login', variant: 'primary' },
				{ label: '홈으로', action: 'home', variant: 'outline' }
			];
		case 'permission':
			return [
				{ label: '대시보드로', action: 'dashboard', variant: 'primary' },
				{ label: '문의하기', action: 'contact', variant: 'outline' }
			];
		case 'validation':
			return [
				{ label: '수정하기', action: 'edit', variant: 'primary' },
				{ label: '취소', action: 'cancel', variant: 'outline' }
			];
		case 'server':
			return [
				{ label: '새로고침', action: 'refresh', variant: 'primary' },
				{ label: '문제 신고', action: 'report', variant: 'outline' }
			];
		default:
			return [
				{ label: '다시 시도', action: 'retry', variant: 'primary' },
				{ label: '홈으로', action: 'home', variant: 'outline' }
			];
	}
}

/**
 * 에러 로깅 (개발 환경에서만)
 */
export function logError(error: ApiError, context?: string): void {
	if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
		console.group(`🚨 API Error${context ? ` - ${context}` : ''}`);
		console.error('Status:', error.status);
		console.error('Message:', error.message);
		console.error('Code:', error.code);
		console.error('Details:', error.details);
		console.error('Timestamp:', error.timestamp);
		console.groupEnd();
	}
}
