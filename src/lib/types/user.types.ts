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
	UPLOAD_FILE: 1 << 14 // 16384
} as const;

// 사전 정의된 역할들
export const ROLES = {
	USER: PERMISSIONS.READ_USER,
	CLIENT_MANAGER:
		PERMISSIONS.READ_CLIENT |
		PERMISSIONS.WRITE_CLIENT |
		PERMISSIONS.DELETE_CLIENT |
		PERMISSIONS.READ_TOKEN |
		PERMISSIONS.WRITE_TOKEN |
		PERMISSIONS.DELETE_TOKEN |
		PERMISSIONS.READ_DASHBOARD |
		PERMISSIONS.WRITE_DASHBOARD |
		PERMISSIONS.UPLOAD_FILE, // 대시보드 및 업로드 권한 추가
	TOKEN_MANAGER: PERMISSIONS.READ_TOKEN | PERMISSIONS.WRITE_TOKEN | PERMISSIONS.DELETE_TOKEN,
	USER_MANAGER:
		PERMISSIONS.READ_USER |
		PERMISSIONS.WRITE_USER |
		PERMISSIONS.DELETE_USER |
		PERMISSIONS.MANAGE_USERS,
	ADMIN: Object.values(PERMISSIONS).reduce((acc, perm) => acc | perm, 0) // 모든 권한
} as const;

// 역할 이름 매핑
export const ROLE_NAMES = {
	[ROLES.USER]: '일반 사용자',
	[ROLES.CLIENT_MANAGER]: '클라이언트 관리자',
	[ROLES.TOKEN_MANAGER]: '토큰 관리자',
	[ROLES.USER_MANAGER]: '사용자 관리자',
	[ROLES.ADMIN]: '시스템 관리자'
} as const;

// 사용자 유형별 권한 (백엔드와 일치)
export const USER_TYPE_PERMISSIONS = {
	[USER_TYPES.REGULAR]:
		PERMISSIONS.READ_USER |
		PERMISSIONS.READ_DASHBOARD |
		PERMISSIONS.WRITE_DASHBOARD |
		PERMISSIONS.UPLOAD_FILE, // 기본 사용자 권한 + 대시보드 + 업로드
	[USER_TYPES.DEVELOPER]:
		PERMISSIONS.READ_USER |
		PERMISSIONS.READ_CLIENT |
		PERMISSIONS.WRITE_CLIENT |
		PERMISSIONS.DELETE_CLIENT |
		PERMISSIONS.READ_TOKEN |
		PERMISSIONS.WRITE_TOKEN |
		PERMISSIONS.DELETE_TOKEN |
		PERMISSIONS.READ_DASHBOARD |
		PERMISSIONS.WRITE_DASHBOARD |
		PERMISSIONS.UPLOAD_FILE // 개발자 권한 + 대시보드 + 업로드
} as const;

export interface User {
	id: number;
	username: string;
	email: string;
	firstName?: string;
	lastName?: string;
	permissions: number;
	userType: USER_TYPES;
	isEmailVerified: boolean;
	isTwoFactorEnabled: boolean;
	avatar?: string | null;
	createdAt: string;
	updatedAt: string;
	lastLoginAt?: string;
}
