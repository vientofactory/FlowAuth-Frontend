import { ERROR_MESSAGES } from '../constants/authorization.constants';
import { ErrorType } from '../types/authorization.types';
import type { AuthorizationError } from '../types/authorization.types';

/**
 * 에러 객체를 분석하여 구조화된 에러 정보를 반환합니다.
 */
export function parseError(error: unknown): AuthorizationError {
	if (error instanceof Error) {
		// 타임아웃 에러
		if (error.message.includes('오래 걸립니다') || error.message.includes('timeout')) {
			return {
				type: ErrorType.TIMEOUT_ERROR,
				message: '보안 검증이 너무 오래 걸립니다. 잠시 후 다시 시도해주세요.',
				retryable: true,
				details: error.message
			};
		}

		// 네트워크 에러
		if (error.message.includes('fetch') || error.message.includes('network')) {
			return {
				type: ErrorType.NETWORK_ERROR,
				message: '네트워크 연결을 확인하고 다시 시도해주세요',
				retryable: true,
				details: error.message
			};
		}

		// 파라미터 관련 에러
		if (error.message.includes('parameter') || error.message.includes('필수')) {
			return {
				type: ErrorType.INVALID_PARAMS,
				message: ERROR_MESSAGES.REQUIRED_PARAMS_MISSING,
				retryable: false,
				details: error.message
			};
		}

		// 클라이언트 관련 에러
		if (error.message.includes('client') || error.message.includes('클라이언트')) {
			return {
				type: ErrorType.CLIENT_NOT_FOUND,
				message: '요청한 애플리케이션을 찾을 수 없습니다',
				retryable: false,
				details: error.message
			};
		}

		// 스코프 관련 에러
		if (error.message.includes('scope') || error.message.includes('권한')) {
			return {
				type: ErrorType.SCOPE_INVALID,
				message: '요청된 권한이 유효하지 않습니다',
				retryable: false,
				details: error.message
			};
		}

		// 서버 에러
		if (error.message.includes('500') || error.message.includes('server')) {
			return {
				type: ErrorType.SERVER_ERROR,
				message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요',
				retryable: true,
				details: error.message
			};
		}

		// 기타 에러
		return {
			type: ErrorType.UNKNOWN,
			message: error.message,
			retryable: true,
			details: error.message
		};
	}

	// 알 수 없는 에러
	return {
		type: ErrorType.UNKNOWN,
		message: ERROR_MESSAGES.UNKNOWN_ERROR,
		retryable: false
	};
}

/**
 * 에러 타입에 따른 사용자 친화적인 메시지를 반환합니다.
 */
export function getErrorDisplayMessage(error: AuthorizationError): string {
	return error.message;
}

/**
 * 에러가 재시도 가능한지 확인합니다.
 */
export function isRetryableError(error: AuthorizationError): boolean {
	return error.retryable;
}
