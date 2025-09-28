// OAuth2 스코프 정의 (백엔드와 동기화)
export const OAUTH2_SCOPES = {
	// 계정 기본 정보
	IDENTIFY: 'identify',

	// 이메일
	EMAIL: 'email'
} as const;

// 타입 정의
export interface ScopeInfo {
	name: string;
	description: string;
	icon: string;
	color: string;
	risk: string;
	sensitive: boolean;
}

// 유효한 스코프들의 Set (한 번만 생성하여 재사용)
const VALID_SCOPES_SET: Set<string> = new Set(Object.values(OAUTH2_SCOPES));

// 스코프별 메타데이터 매핑
export const SCOPE_MAPPINGS: Record<string, ScopeInfo> = {
	// 계정 기본 정보
	[OAUTH2_SCOPES.IDENTIFY]: {
		name: '계정 기본 정보 읽기',
		description: '앱이 귀하의 기본 계정 정보(사용자 ID, 이름 등)를 읽을 수 있습니다',
		icon: 'fa-user-circle',
		color: 'blue',
		risk: 'low',
		sensitive: false
	},
	// 이메일
	[OAUTH2_SCOPES.EMAIL]: {
		name: '이메일 주소 읽기',
		description: '앱이 귀하의 이메일 주소를 읽을 수 있습니다',
		icon: 'fa-envelope',
		color: 'orange',
		risk: 'medium',
		sensitive: true
	}
};

/**
 * 주어진 스코프의 정보를 반환합니다
 */
export function getScopeInfo(scope: string): ScopeInfo {
	const normalizedScope = normalizeScopeFormat(scope);
	const mapping = SCOPE_MAPPINGS[normalizedScope];

	if (mapping) {
		return mapping;
	}

	// 매핑되지 않은 스코프의 경우 기본 처리
	return {
		name: scope
			.replace(/_/g, ' ')
			.replace(/:/g, ' ')
			.replace(/\b\w/g, (l) => l.toUpperCase()),
		description: `앱이 ${scope.replace(/_/g, ' ').replace(/:/g, ' ')} 권한을 사용할 수 있습니다`,
		icon: 'fa-key',
		color: 'gray',
		risk: 'unknown',
		sensitive: false
	};
}

/**
 * 스코프 유효성 검증
 */
export function isValidScope(scope: string): boolean {
	return VALID_SCOPES_SET.has(scope);
}

/**
 * 여러 스코프의 유효성 검증
 */
export function validateScopes(scopes: string[]): { valid: string[]; invalid: string[] } {
	const valid: string[] = [];
	const invalid: string[] = [];

	scopes.forEach((scope) => {
		if (isValidScope(scope)) {
			valid.push(scope);
		} else {
			invalid.push(scope);
		}
	});

	return { valid, invalid };
}

/**
 * 스코프 형식 정규화 (레거시 형식 지원)
 */
export function normalizeScopeFormat(scope: string): string {
	// 이미 정규화된 형식인지 확인
	const validScopes = Object.values(OAUTH2_SCOPES) as string[];
	if (validScopes.includes(scope)) {
		return scope;
	}

	// 레거시 형식 변환 (현재는 없음)
	const legacyMappings: Record<string, string> = {};

	return legacyMappings[scope] || scope;
}

/**
 * 스코프의 위험도에 따른 색상 반환
 */
export function getScopeRiskColor(risk: string): string {
	switch (risk) {
		case 'low':
			return 'text-green-600 bg-green-50';
		case 'medium':
			return 'text-yellow-600 bg-yellow-50';
		case 'high':
			return 'text-orange-600 bg-orange-50';
		case 'critical':
			return 'text-red-600 bg-red-50';
		default:
			return 'text-gray-600 bg-gray-50';
	}
}

/**
 * 스코프의 위험도에 따른 텍스트 반환
 */
export function getScopeRiskText(risk: string): string {
	switch (risk) {
		case 'low':
			return '낮음';
		case 'medium':
			return '중간';
		case 'high':
			return '높음';
		case 'critical':
			return '매우 높음';
		default:
			return '알 수 없음';
	}
}
