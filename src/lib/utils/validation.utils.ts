/**
 * 공통 검증 유틸리티 함수들
 * 백엔드 DTO의 검증 규칙과 일치하도록 구현
 */

import { OAUTH2_SCOPES } from './scope.utils';

export interface ValidationResult {
	isValid: boolean;
	message?: string;
}

/**
 * 이메일 주소 검증
 */
export function validateEmail(email: string): ValidationResult {
	if (!email || email.trim().length === 0) {
		return { isValid: false, message: '이메일을 입력해주세요.' };
	}

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(email)) {
		return { isValid: false, message: '올바른 이메일 형식이 아닙니다.' };
	}

	return { isValid: true };
}

/**
 * 비밀번호 검증 (백엔드 CreateUserDto와 동일)
 */
export function validatePassword(password: string): ValidationResult {
	if (!password || password.length === 0) {
		return { isValid: false, message: '비밀번호를 입력해주세요.' };
	}

	if (password.length < 6) {
		return { isValid: false, message: '비밀번호는 최소 6자 이상이어야 합니다.' };
	}

	return { isValid: true };
}

/**
 * 사용자 이름 검증
 */
export function validateUsername(username: string): ValidationResult {
	if (!username || username.trim().length === 0) {
		return { isValid: false, message: '사용자 이름을 입력해주세요.' };
	}

	if (username.length < 3) {
		return { isValid: false, message: '사용자 이름은 최소 3자 이상이어야 합니다.' };
	}

	const usernameRegex = /^[a-zA-Z0-9_]+$/;
	if (!usernameRegex.test(username)) {
		return { isValid: false, message: '사용자 이름은 영문, 숫자, 밑줄(_)만 사용할 수 있습니다.' };
	}

	return { isValid: true };
}

/**
 * 이름 검증 (firstName, lastName)
 */
export function validateName(name: string, fieldName: string): ValidationResult {
	if (!name || name.trim().length === 0) {
		return { isValid: false, message: `${fieldName}을(를) 입력해주세요.` };
	}

	if (name.length < 2) {
		return { isValid: false, message: `${fieldName}은(는) 최소 2자 이상이어야 합니다.` };
	}

	return { isValid: true };
}

/**
 * 클라이언트 이름 검증
 */
export function validateClientName(name: string): ValidationResult {
	if (!name || name.trim().length === 0) {
		return { isValid: false, message: '클라이언트 이름을 입력해주세요.' };
	}

	if (name.length > 100) {
		return { isValid: false, message: '클라이언트 이름은 100자를 초과할 수 없습니다.' };
	}

	return { isValid: true };
}

/**
 * 리다이렉트 URI 검증
 */
export function validateRedirectUri(uri: string): ValidationResult {
	if (!uri || uri.trim().length === 0) {
		return { isValid: false, message: '리다이렉트 URI를 입력해주세요.' };
	}

	try {
		const url = new URL(uri);
		if (!['http:', 'https:'].includes(url.protocol)) {
			return { isValid: false, message: '리다이렉트 URI는 http 또는 https 프로토콜만 허용됩니다.' };
		}
	} catch {
		return { isValid: false, message: '올바른 URL 형식이 아닙니다.' };
	}

	return { isValid: true };
}

/**
 * URL 검증 (선택적 필드용)
 */
export function validateUrl(url: string, fieldName: string): ValidationResult {
	if (!url || url.trim().length === 0) {
		// 선택적 필드이므로 빈 값은 유효
		return { isValid: true };
	}

	try {
		const parsedUrl = new URL(url);
		if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
			return {
				isValid: false,
				message: `${fieldName}은(는) http 또는 https 프로토콜만 허용됩니다.`
			};
		}
	} catch {
		return { isValid: false, message: `${fieldName}은(는) 올바른 URL 형식이 아닙니다.` };
	}

	return { isValid: true };
}

/**
 * 로고 URL 검증 (업로드된 파일 경로와 외부 URL 모두 허용)
 */
export function validateLogoUrl(url: string): ValidationResult {
	if (!url || url.trim().length === 0) {
		// 선택적 필드이므로 빈 값은 유효
		return { isValid: true };
	}

	// 상대 경로 형식 (/uploads/logos/...) 허용
	if (url.startsWith('/uploads/')) {
		return { isValid: true };
	}

	// 완전한 URL 형식도 허용
	try {
		const parsedUrl = new URL(url);
		if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
			return {
				isValid: false,
				message: '로고 URL은 업로드된 파일 경로이거나 http/https 프로토콜을 사용해야 합니다.'
			};
		}
		return { isValid: true };
	} catch {
		return { isValid: false, message: '올바른 로고 URL 형식이 아닙니다.' };
	}
}

/**
 * 스코프 검증
 */
export function validateScopes(scopes: string[]): ValidationResult {
	if (!scopes || scopes.length === 0) {
		return { isValid: false, message: '최소 하나의 권한 범위를 선택해주세요.' };
	}

	const validScopes = Object.values(OAUTH2_SCOPES) as string[];
	const invalidScopes = scopes.filter((scope) => !validScopes.includes(scope));

	if (invalidScopes.length > 0) {
		return { isValid: false, message: `유효하지 않은 권한 범위: ${invalidScopes.join(', ')}` };
	}

	return { isValid: true };
}

/**
 * 필수 필드 검증
 */
export function validateRequired(value: string, fieldName: string): ValidationResult {
	if (!value || value.trim().length === 0) {
		return { isValid: false, message: `${fieldName}을(를) 입력해주세요.` };
	}

	return { isValid: true };
}

/**
 * 최소 길이 검증
 */
export function validateMinLength(
	value: string,
	minLength: number,
	fieldName: string
): ValidationResult {
	if (value && value.length < minLength) {
		return { isValid: false, message: `${fieldName}은(는) 최소 ${minLength}자 이상이어야 합니다.` };
	}

	return { isValid: true };
}
