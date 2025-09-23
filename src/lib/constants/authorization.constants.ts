import type { ScopeInfo } from '../types/authorization.types';

export const SCOPE_DESCRIPTIONS: Record<string, ScopeInfo> = {
	read: {
		icon: 'fas fa-eye',
		description: '귀하의 기본 프로필 정보를 읽을 수 있습니다',
		category: '읽기',
		risk: 'low'
	},
	write: {
		icon: 'fas fa-edit',
		description: '귀하의 계정 정보를 수정할 수 있습니다',
		category: '쓰기',
		risk: 'high'
	},
	profile: {
		icon: 'fas fa-user',
		description: '이름, 프로필 사진 등의 개인정보에 접근할 수 있습니다',
		category: '프로필',
		risk: 'medium'
	},
	email: {
		icon: 'fas fa-envelope',
		description: '귀하의 이메일 주소에 접근할 수 있습니다',
		category: '연락처',
		risk: 'medium'
	}
};

export const LOADING_MESSAGES = {
	VALIDATING: '인가 요청을 검증하고 있습니다...',
	PROCESSING: '동의 처리 중... 잠시만 기다려주세요'
} as const;

export const ERROR_MESSAGES = {
	REQUIRED_PARAMS_MISSING: '필수 OAuth2 파라미터가 누락되었습니다',
	UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다',
	CONSENT_ERROR: '동의 처리 중 오류가 발생했습니다'
} as const;
