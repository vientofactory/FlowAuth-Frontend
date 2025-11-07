// 사용자 관련 타입 정의
export enum USER_TYPES {
	REGULAR = 'regular', // 일반 사용자 - OAuth2 로그인만 사용
	DEVELOPER = 'developer' // 개발자 - 클라이언트 관리 가능
}

// 권한 비트마스크 상수들 (백엔드와 일치)
export const PERMISSIONS = {
	// 사용자 권한
	READ_USER: 1 << 0, // 1
	WRITE_USER: 1 << 1, // 2
	DELETE_USER: 1 << 2, // 4

	// 클라이언트 권한
	READ_CLIENT: 1 << 3, // 8
	WRITE_CLIENT: 1 << 4, // 16
	DELETE_CLIENT: 1 << 5, // 32

	// 토큰 권한
	READ_TOKEN: 1 << 6, // 64
	WRITE_TOKEN: 1 << 7, // 128
	DELETE_TOKEN: 1 << 8, // 256

	// 시스템 권한
	MANAGE_USERS: 1 << 9, // 512
	MANAGE_SYSTEM: 1 << 10, // 1024

	// 대시보드 권한
	READ_DASHBOARD: 1 << 11, // 2048
	WRITE_DASHBOARD: 1 << 12, // 4096
	MANAGE_DASHBOARD: 1 << 13, // 8192

	// 업로드 권한
	UPLOAD_FILE: 1 << 14, // 16384

	// ADMIN 권한 - 별도의 슈퍼 권한
	// 주의: 30번째 비트 사용 (이전 31번째 비트에서 변경됨)
	// 변경 이유: JavaScript의 32비트 정수 한계로 인한 호환성 문제
	// - 31번째 비트(1 << 31)는 JavaScript에서 음수로 해석됨 (부호 비트)
	// - 30번째 비트(1 << 30)는 양수 범위 내에서 안전하게 사용 가능
	// - TypeScript/JavaScript와 백엔드 데이터베이스 간 호환성 보장
	ADMIN_ACCESS: 1 << 30 // 1073741824
} as const;

// 권한 헬퍼 함수들
export const PERMISSION_UTILS = {
	/**
	 * 모든 권한의 비트마스크를 계산 (ADMIN_ACCESS 제외)
	 */
	getAllPermissionsMask: (): number => {
		return Object.values(PERMISSIONS).reduce((acc, perm) => {
			if (perm !== PERMISSIONS.ADMIN_ACCESS) {
				return acc | perm;
			}
			return acc;
		}, 0);
	},

	/**
	 * ADMIN 권한 값 (ADMIN_ACCESS 비트만)
	 */
	getAdminPermission: (): number => {
		return PERMISSIONS.ADMIN_ACCESS;
	},

	/**
	 * 사용 가능한 모든 권한 목록 (ADMIN_ACCESS 제외)
	 */
	getAllPermissions: () => {
		return Object.values(PERMISSIONS).filter((p) => p !== PERMISSIONS.ADMIN_ACCESS);
	},

	/**
	 * 권한 이름으로 값 찾기
	 */
	getPermissionValue: (name: keyof typeof PERMISSIONS) => PERMISSIONS[name]
} as const;

// 역할 상수들
export const ROLES = {
	USER: 'user',
	CLIENT_MANAGER: 'client_manager',
	TOKEN_MANAGER: 'token_manager',
	USER_MANAGER: 'user_manager',
	ADMIN: 'admin'
} as const;

// 역할별 권한 매핑
export const ROLE_PERMISSIONS = {
	[ROLES.USER]: [
		PERMISSIONS.READ_CLIENT,
		PERMISSIONS.READ_TOKEN,
		PERMISSIONS.DELETE_TOKEN,
		PERMISSIONS.UPLOAD_FILE
	],
	[ROLES.CLIENT_MANAGER]: [
		PERMISSIONS.READ_CLIENT,
		PERMISSIONS.WRITE_CLIENT,
		PERMISSIONS.DELETE_CLIENT,
		PERMISSIONS.READ_TOKEN,
		PERMISSIONS.WRITE_TOKEN,
		PERMISSIONS.DELETE_TOKEN,
		PERMISSIONS.READ_DASHBOARD,
		PERMISSIONS.WRITE_DASHBOARD,
		PERMISSIONS.UPLOAD_FILE
	],
	[ROLES.TOKEN_MANAGER]: [
		PERMISSIONS.READ_TOKEN,
		PERMISSIONS.WRITE_TOKEN,
		PERMISSIONS.DELETE_TOKEN
	],
	[ROLES.USER_MANAGER]: [
		PERMISSIONS.READ_USER,
		PERMISSIONS.WRITE_USER,
		PERMISSIONS.DELETE_USER,
		PERMISSIONS.MANAGE_USERS
	],
	[ROLES.ADMIN]: [PERMISSIONS.ADMIN_ACCESS] // ADMIN은 별도의 슈퍼 권한만 가짐
} as const;

// 역할 계층 구조 (상속 관계)
export const ROLE_HIERARCHY = {
	[ROLES.USER]: [],
	[ROLES.CLIENT_MANAGER]: [ROLES.USER],
	[ROLES.TOKEN_MANAGER]: [ROLES.USER],
	[ROLES.USER_MANAGER]: [ROLES.USER, ROLES.CLIENT_MANAGER],
	[ROLES.ADMIN]: [ROLES.USER, ROLES.CLIENT_MANAGER, ROLES.TOKEN_MANAGER, ROLES.USER_MANAGER]
} as const;

// 역할 이름 매핑
export const ROLE_NAMES = {
	[ROLES.USER]: '일반 사용자',
	[ROLES.CLIENT_MANAGER]: '클라이언트 관리자',
	[ROLES.TOKEN_MANAGER]: '토큰 관리자',
	[ROLES.USER_MANAGER]: '사용자 관리자',
	[ROLES.ADMIN]: '시스템 관리자'
} as const;

// 사용자 유형별 기본 권한 (역할 기반)
export const USER_TYPE_PERMISSIONS = {
	[USER_TYPES.REGULAR]: ROLE_PERMISSIONS[ROLES.USER].reduce((acc, perm) => acc | perm, 0),
	[USER_TYPES.DEVELOPER]: ROLE_PERMISSIONS[ROLES.CLIENT_MANAGER].reduce(
		(acc, perm) => acc | perm,
		0
	)
} as const;

export interface User {
	id: number;
	userId?: string;
	username: string;
	email: string;
	firstName?: string;
	lastName?: string;
	permissions: number;
	userType: USER_TYPES;
	isEmailVerified: boolean;
	isTwoFactorEnabled: boolean;
	isActive: boolean;
	avatar?: string | null;
	bio?: string;
	website?: string;
	location?: string;
	createdAt: string;
	updatedAt: string;
	lastLoginAt?: string;
}
