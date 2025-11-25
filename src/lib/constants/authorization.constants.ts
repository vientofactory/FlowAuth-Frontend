import type { ScopeInfo } from '../types/authorization.types';
import { faKey, faUser, faEnvelope } from '@fortawesome/free-solid-svg-icons';

// 일반 사용자의 명확한 권한 이해를 위한 스코프 정보 사전 정의
// 사전 정의에 없는 경우 백엔드 응답으로 fallback
export const SCOPE_DESCRIPTIONS: Record<string, ScopeInfo> = {
	openid: {
		name: 'OpenID Connect',
		icon: faKey,
		description: 'OpenID Connect 인증을 통해 귀하의 신원을 확인할 수 있습니다'
	},
	profile: {
		name: '프로필 읽기',
		icon: faUser,
		description: '이름, 프로필 사진, 생년월일 등의 기본 프로필 정보에 접근할 수 있습니다'
	},
	email: {
		name: '이메일 주소 읽기',
		icon: faEnvelope,
		description: '귀하의 이메일 주소와 이메일 인증 상태에 접근할 수 있습니다'
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
