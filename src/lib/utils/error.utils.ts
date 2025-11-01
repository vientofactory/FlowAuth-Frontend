import { ERROR_MESSAGES } from '../constants/authorization.constants';
import { ErrorType } from '../types/authorization.types';
import type { AuthorizationError } from '../types/authorization.types';
import { ERROR_CODES, type ErrorCode } from '@flowauth/shared';

// 백엔드 에러 코드에 따른 사용자 친화적인 메시지 매핑
const ERROR_CODE_MESSAGES: Record<string, string> = {
	[ERROR_CODES.VALIDATION_FAILED]: '입력값이 올바르지 않습니다. 다시 확인해주세요.',
	[ERROR_CODES.PAYLOAD_TOO_LARGE]: '업로드한 파일이 너무 큽니다.',
	[ERROR_CODES.CIRCULAR_REFERENCE]: '순환 참조가 감지되었습니다.',
	[ERROR_CODES.NESTING_TOO_DEEP]: '데이터 구조가 너무 깊습니다.',
	[ERROR_CODES.DATABASE_ERROR]: '데이터베이스 오류가 발생했습니다.',
	[ERROR_CODES.DATABASE_CONNECTION_ERROR]: '데이터베이스 연결에 실패했습니다.',
	[ERROR_CODES.DUPLICATE_ENTRY]: '중복된 항목이 있습니다.',
	[ERROR_CODES.FILE_UPLOAD_ERROR]: '파일 업로드에 실패했습니다.',
	[ERROR_CODES.FILE_TOO_LARGE]: '파일 크기가 너무 큽니다.',
	[ERROR_CODES.INVALID_FILE_TYPE]: '지원하지 않는 파일 형식입니다.',
	[ERROR_CODES.FILE_PROCESSING_ERROR]: '파일 처리 중 오류가 발생했습니다.',
	[ERROR_CODES.OAUTH2_INVALID_REQUEST]: '잘못된 OAuth2 요청입니다.',
	[ERROR_CODES.OAUTH2_INVALID_CLIENT]: '잘못된 클라이언트입니다.',
	[ERROR_CODES.OAUTH2_INVALID_GRANT]: '잘못된 권한 부여입니다.',
	[ERROR_CODES.OAUTH2_INVALID_SCOPE]: '잘못된 권한 범위입니다.',
	[ERROR_CODES.OAUTH2_INVALID_TOKEN]: '잘못된 토큰입니다.',
	[ERROR_CODES.OAUTH2_INSUFFICIENT_SCOPE]: '권한 범위가 부족합니다.',
	[ERROR_CODES.OAUTH2_ACCESS_DENIED]: '접근이 거부되었습니다.',
	[ERROR_CODES.OAUTH2_UNSUPPORTED_RESPONSE_TYPE]: '지원하지 않는 응답 형식입니다.',
	[ERROR_CODES.OAUTH2_UNSUPPORTED_GRANT_TYPE]: '지원하지 않는 권한 부여 형식입니다.',
	[ERROR_CODES.OAUTH2_UNAUTHORIZED_CLIENT]: '권한이 없는 클라이언트입니다.',
	[ERROR_CODES.OAUTH2_SERVER_ERROR]: 'OAuth2 서버 오류입니다.',
	[ERROR_CODES.UNAUTHORIZED]: '인증이 필요합니다.',
	[ERROR_CODES.FORBIDDEN]: '접근 권한이 없습니다.',
	[ERROR_CODES.INVALID_CREDENTIALS]: '잘못된 자격 증명입니다.',
	[ERROR_CODES.TOKEN_EXPIRED]: '토큰이 만료되었습니다.',
	[ERROR_CODES.TOO_MANY_REQUESTS]: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
	[ERROR_CODES.INTERNAL_SERVER_ERROR]: '서버 내부 오류가 발생했습니다.',
	[ERROR_CODES.BAD_REQUEST]: '잘못된 요청입니다.',
	[ERROR_CODES.NOT_FOUND]: '요청한 리소스를 찾을 수 없습니다.',
	[ERROR_CODES.CONFLICT]: '충돌이 발생했습니다.',
	[ERROR_CODES.SERVICE_UNAVAILABLE]: '서비스를 사용할 수 없습니다.'
};

// 백엔드 에러 코드에 따른 재시도 가능 여부
const RETRYABLE_ERROR_CODES: Set<string> = new Set([
	ERROR_CODES.DATABASE_CONNECTION_ERROR,
	ERROR_CODES.INTERNAL_SERVER_ERROR,
	ERROR_CODES.SERVICE_UNAVAILABLE,
	ERROR_CODES.TOO_MANY_REQUESTS
]);

// 백엔드 에러 코드에 따른 에러 타입 매핑
const ERROR_CODE_TYPES: Record<string, ErrorType> = {
	[ERROR_CODES.VALIDATION_FAILED]: ErrorType.INVALID_PARAMS,
	[ERROR_CODES.UNAUTHORIZED]: ErrorType.AUTHENTICATION_ERROR,
	[ERROR_CODES.FORBIDDEN]: ErrorType.AUTHORIZATION_ERROR,
	[ERROR_CODES.INVALID_CREDENTIALS]: ErrorType.AUTHENTICATION_ERROR,
	[ERROR_CODES.TOKEN_EXPIRED]: ErrorType.AUTHENTICATION_ERROR,
	[ERROR_CODES.NOT_FOUND]: ErrorType.NOT_FOUND,
	[ERROR_CODES.CONFLICT]: ErrorType.CONFLICT,
	[ERROR_CODES.TOO_MANY_REQUESTS]: ErrorType.RATE_LIMITED,
	[ERROR_CODES.INTERNAL_SERVER_ERROR]: ErrorType.SERVER_ERROR,
	[ERROR_CODES.SERVICE_UNAVAILABLE]: ErrorType.SERVER_ERROR,
	[ERROR_CODES.BAD_REQUEST]: ErrorType.INVALID_PARAMS
};

/**
 * 백엔드 에러 코드를 기반으로 구조화된 에러 정보를 반환합니다.
 * RFC 7807 Problem Details와 OAuth2 에러 형식을 모두 지원합니다.
 */
export function parseBackendError(error: {
	error?: string;
	error_description?: string;
	message?: string;
	status?: number;
	// RFC 7807 Problem Details fields
	type?: string;
	title?: string;
	detail?: string;
	instance?: string;
	extensions?: Record<string, unknown>;
}): AuthorizationError {
	// RFC 7807 Problem Details 형식인 경우
	if (error.type && error.title) {
		const errorCode = (error.extensions?.error as string) || 'unknown_error';
		// extensions.error_description을 우선적으로 사용, 없으면 detail 사용
		const errorDescription =
			(error.extensions?.error_description as string) || error.detail || error.title;

		return {
			type: ERROR_CODE_TYPES[errorCode] || ErrorType.UNKNOWN,
			message: errorDescription,
			retryable: RETRYABLE_ERROR_CODES.has(errorCode),
			details: errorDescription,
			errorCode: errorCode as ErrorCode
		};
	}

	// 기존 OAuth2 형식 (하위 호환성 유지)
	const errorCode = error.error;
	const errorDescription = error.error_description || error.message;

	// 백엔드 에러 코드가 있는 경우
	if (errorCode && ERROR_CODE_MESSAGES[errorCode]) {
		return {
			type: ERROR_CODE_TYPES[errorCode] || ErrorType.UNKNOWN,
			message: ERROR_CODE_MESSAGES[errorCode],
			retryable: RETRYABLE_ERROR_CODES.has(errorCode),
			details: errorDescription,
			errorCode: errorCode as ErrorCode
		};
	}

	// 백엔드 에러 코드가 없는 경우 기존 로직 사용
	return parseError(new Error(errorDescription || 'Unknown error'));
}

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
