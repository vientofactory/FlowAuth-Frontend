// OAuth2 스코프 정의 (백엔드와 동기화)
export const OAUTH2_SCOPES = {
	// 사용자 관련
	READ_USER: 'read:user',

	// 프로필 관련
	READ_PROFILE: 'read:profile',

	// 파일 관련
	UPLOAD_FILE: 'upload:file',
	READ_FILE: 'read:file',
	DELETE_FILE: 'delete:file',

	// 클라이언트 관련
	READ_CLIENT: 'read:client',
	WRITE_CLIENT: 'write:client',
	DELETE_CLIENT: 'delete:client',

	// 기본 권한
	BASIC: 'basic',

	// 이메일 주소 스코프
	EMAIL: 'email'
} as const;

// 스코프 카테고리
export const SCOPE_CATEGORIES = {
	USER: 'user',
	PROFILE: 'profile',
	FILE: 'file',
	CLIENT: 'client',
	ADMIN: 'admin'
} as const;

// 타입 정의
export interface ScopeInfo {
	name: string;
	description: string;
	icon: string;
	color: string;
	risk: string;
	category: string;
	sensitive: boolean;
}

// 유효한 스코프들의 Set (한 번만 생성하여 재사용)
const VALID_SCOPES_SET: Set<string> = new Set(Object.values(OAUTH2_SCOPES));

// 스코프별 메타데이터 매핑
export const SCOPE_MAPPINGS: Record<string, ScopeInfo> = {
	// 사용자 관련
	[OAUTH2_SCOPES.READ_USER]: {
		name: '사용자 기본 정보 읽기',
		description: '앱이 귀하의 기본 사용자 정보(이름, ID 등)를 읽을 수 있습니다',
		icon: 'fa-user-circle',
		color: 'blue',
		risk: 'low',
		category: SCOPE_CATEGORIES.USER,
		sensitive: false
	},

	// 프로필 관련
	[OAUTH2_SCOPES.READ_PROFILE]: {
		name: '사용자 프로필 읽기',
		description: '앱이 귀하의 상세 프로필 정보를 읽을 수 있습니다',
		icon: 'fa-id-card',
		color: 'green',
		risk: 'low',
		category: SCOPE_CATEGORIES.PROFILE,
		sensitive: false
	},

	// 파일 관련
	[OAUTH2_SCOPES.UPLOAD_FILE]: {
		name: '파일 업로드',
		description: '앱이 파일을 업로드할 수 있습니다',
		icon: 'fa-upload',
		color: 'purple',
		risk: 'medium',
		category: SCOPE_CATEGORIES.FILE,
		sensitive: false
	},
	[OAUTH2_SCOPES.READ_FILE]: {
		name: '파일 읽기',
		description: '앱이 업로드된 파일을 읽을 수 있습니다',
		icon: 'fa-file',
		color: 'indigo',
		risk: 'low',
		category: SCOPE_CATEGORIES.FILE,
		sensitive: false
	},
	[OAUTH2_SCOPES.DELETE_FILE]: {
		name: '파일 삭제',
		description: '앱이 업로드된 파일을 삭제할 수 있습니다',
		icon: 'fa-trash',
		color: 'red',
		risk: 'high',
		category: SCOPE_CATEGORIES.FILE,
		sensitive: true
	},

	// 클라이언트 관련
	[OAUTH2_SCOPES.READ_CLIENT]: {
		name: '클라이언트 정보 읽기',
		description: '앱이 OAuth2 클라이언트 정보를 읽을 수 있습니다',
		icon: 'fa-cog',
		color: 'cyan',
		risk: 'low',
		category: SCOPE_CATEGORIES.CLIENT,
		sensitive: false
	},
	[OAUTH2_SCOPES.WRITE_CLIENT]: {
		name: '클라이언트 정보 수정',
		description: '앱이 새로운 OAuth2 클라이언트를 생성하거나 기존 클라이언트를 수정할 수 있습니다',
		icon: 'fa-plus-circle',
		color: 'orange',
		risk: 'high',
		category: SCOPE_CATEGORIES.CLIENT,
		sensitive: true
	},
	[OAUTH2_SCOPES.DELETE_CLIENT]: {
		name: '클라이언트 삭제',
		description: '앱이 OAuth2 클라이언트를 삭제할 수 있습니다',
		icon: 'fa-times-circle',
		color: 'red',
		risk: 'high',
		category: SCOPE_CATEGORIES.CLIENT,
		sensitive: true
	},

	// 기본 권한
	[OAUTH2_SCOPES.BASIC]: {
		name: '기본 접근 권한',
		description: '앱이 기본적인 기능에 접근할 수 있습니다',
		icon: 'fa-key',
		color: 'gray',
		risk: 'low',
		category: SCOPE_CATEGORIES.USER,
		sensitive: false
	},

	// 이메일 주소 스코프
	[OAUTH2_SCOPES.EMAIL]: {
		name: '사용자 이메일 주소 읽기',
		description: '앱이 귀하의 이메일 주소를 읽을 수 있습니다',
		icon: 'fa-envelope',
		color: 'red',
		risk: 'high',
		category: SCOPE_CATEGORIES.PROFILE,
		sensitive: false
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
		category: SCOPE_CATEGORIES.USER,
		sensitive: false
	};
}

/**
 * 스코프 배열을 카테고리별로 그룹화
 */
export function groupScopesByCategory(scopes: string[]): Record<string, string[]> {
	const groups: Record<string, string[]> = {};

	scopes.forEach((scope) => {
		const scopeInfo = getScopeInfo(scope);
		const category = scopeInfo.category;

		if (!groups[category]) {
			groups[category] = [];
		}
		groups[category].push(scope);
	});

	return groups;
}

/**
 * 스코프 유효성 검증
 */
export function validateScopes(scopes: string[]): { isValid: boolean; message?: string } {
	if (!scopes || scopes.length === 0) {
		return { isValid: false, message: '최소 하나의 권한 범위를 선택해주세요.' };
	}

	const invalidScopes = scopes.filter((scope) => !VALID_SCOPES_SET.has(scope));

	if (invalidScopes.length > 0) {
		return {
			isValid: false,
			message: `유효하지 않은 권한 범위: ${invalidScopes.join(', ')}`
		};
	}

	return { isValid: true };
}

/**
 * 스코프의 민감도 계산
 */
export function calculateScopeRisk(scopes: string[]): 'low' | 'medium' | 'high' | 'critical' {
	let maxRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';

	scopes.forEach((scope) => {
		const scopeInfo = getScopeInfo(scope);
		const risk = scopeInfo.risk;

		if (risk === 'critical') {
			maxRisk = 'critical';
		} else if (risk === 'high' && maxRisk !== 'critical') {
			maxRisk = 'high';
		} else if (risk === 'medium' && maxRisk !== 'critical' && maxRisk !== 'high') {
			maxRisk = 'medium';
		}
	});

	return maxRisk;
}

/**
 * 민감한 스코프인지 확인
 */
export function isSensitiveScope(scope: string): boolean {
	const scopeInfo = getScopeInfo(scope);
	return scopeInfo.sensitive;
}

/**
 * 민감한 스코프 필터링
 */
export function filterSensitiveScopes(scopes: string[]): string[] {
	return scopes.filter((scope) => isSensitiveScope(scope));
}

/**
 * 카테고리별 스코프 개수 반환
 */
export function getScopeCategoryCounts(scopes: string[]): Record<string, number> {
	const counts: Record<string, number> = {};

	scopes.forEach((scope) => {
		const scopeInfo = getScopeInfo(scope);
		const category = scopeInfo.category;
		counts[category] = (counts[category] || 0) + 1;
	});

	return counts;
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

	// 레거시 형식 변환
	const legacyMappings: Record<string, string> = {
		basic: OAUTH2_SCOPES.BASIC
	};

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
			return '보통';
		case 'high':
			return '높음';
		case 'critical':
			return '매우 높음';
		default:
			return '알 수 없음';
	}
}
