// JWT 관련 상수들
export const JWT_CONSTANTS = {
	SECRET_KEY_FALLBACK: 'your-secret-key', // fallback value, use ConfigService.get('JWT_SECRET') in actual usage
	EXPIRES_IN: '1h',
	ALGORITHMS: ['HS256'] as const,
	TOKEN_TYPE: 'access' as const
} as const;
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
	// ADMIN 권한은 별도로 계산됨 (모든 권한의 조합)
} as const;

// 권한 헬퍼 함수들
export const PERMISSION_UTILS = {
	/**
	 * 모든 권한의 비트마스크를 계산
	 */
	getAllPermissionsMask: (): number => {
		return Object.values(PERMISSIONS).reduce((acc, perm) => acc | perm, 0);
	},

	/**
	 * ADMIN 권한 값 (모든 권한의 조합)
	 */
	getAdminPermission: (): number => {
		return PERMISSION_UTILS.getAllPermissionsMask();
	},

	/**
	 * 사용 가능한 모든 권한 목록
	 */
	getAllPermissions: () => Object.values(PERMISSIONS),

	/**
	 * 권한 이름으로 값 찾기
	 */
	getPermissionValue: (name: keyof typeof PERMISSIONS) => PERMISSIONS[name]
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
	ADMIN: PERMISSION_UTILS.getAdminPermission() // 동적으로 계산된 모든 권한
} as const;

// 역할 이름 매핑
export const ROLE_NAMES = {
	[ROLES.USER]: '일반 사용자',
	[ROLES.CLIENT_MANAGER]: '클라이언트 관리자',
	[ROLES.TOKEN_MANAGER]: '토큰 관리자',
	[ROLES.USER_MANAGER]: '사용자 관리자',
	[ROLES.ADMIN]: '시스템 관리자'
} as const;

// 권한 이름 매핑
export const PERMISSION_NAMES: Record<number, string> = {
	[PERMISSIONS.READ_USER]: '사용자 조회',
	[PERMISSIONS.WRITE_USER]: '사용자 수정',
	[PERMISSIONS.DELETE_USER]: '사용자 삭제',
	[PERMISSIONS.READ_CLIENT]: '클라이언트 조회',
	[PERMISSIONS.WRITE_CLIENT]: '클라이언트 수정',
	[PERMISSIONS.DELETE_CLIENT]: '클라이언트 삭제',
	[PERMISSIONS.READ_TOKEN]: '토큰 조회',
	[PERMISSIONS.WRITE_TOKEN]: '토큰 수정',
	[PERMISSIONS.DELETE_TOKEN]: '토큰 삭제',
	[PERMISSIONS.MANAGE_USERS]: '사용자 관리',
	[PERMISSIONS.MANAGE_SYSTEM]: '시스템 관리',
	[PERMISSIONS.READ_DASHBOARD]: '대시보드 조회',
	[PERMISSIONS.WRITE_DASHBOARD]: '대시보드 수정',
	[PERMISSIONS.MANAGE_DASHBOARD]: '대시보드 관리',
	[PERMISSIONS.UPLOAD_FILE]: '파일 업로드'
	// ADMIN은 모든 권한의 조합이므로 개별 권한으로 표시하지 않음
};

/**
 * 권한 유틸리티 클래스
 * 비트마스크 기반 권한 관리를 위한 헬퍼 함수들
 */
export class PermissionUtils {
	/**
	 * 사용자가 특정 권한을 가지고 있는지 확인
	 */
	static hasPermission(userPermissions: number, requiredPermission: number): boolean {
		return (userPermissions & requiredPermission) === requiredPermission;
	}

	/**
	 * 사용자가 여러 권한 중 하나라도 가지고 있는지 확인
	 */
	static hasAnyPermission(userPermissions: number, requiredPermissions: number[]): boolean {
		return requiredPermissions.some((permission) =>
			this.hasPermission(userPermissions, permission)
		);
	}

	/**
	 * 사용자가 모든 필요한 권한을 가지고 있는지 확인
	 */
	static hasAllPermissions(userPermissions: number, requiredPermissions: number[]): boolean {
		return requiredPermissions.every((permission) =>
			this.hasPermission(userPermissions, permission)
		);
	}

	/**
	 * 권한 목록을 문자열로 변환
	 */
	static getPermissionNames(permissions: number): string[] {
		const names: string[] = [];
		Object.entries(PERMISSION_NAMES).forEach(([value, name]) => {
			if (this.hasPermission(permissions, parseInt(value))) {
				names.push(name);
			}
		});
		return names;
	}

	/**
	 * 역할 이름을 가져옴
	 */
	static getRoleName(permissions: number): string {
		// ADMIN 권한이 있는 경우 바로 시스템 관리자로 반환
		if (this.hasPermission(permissions, PERMISSION_UTILS.getAdminPermission())) {
			return ROLE_NAMES[ROLES.ADMIN];
		}

		// 정확히 일치하는 역할 찾기 (ADMIN 제외)
		for (const [roleName, rolePermissions] of Object.entries(ROLES)) {
			if (roleName !== 'ADMIN' && permissions === rolePermissions) {
				return ROLE_NAMES[rolePermissions] || roleName;
			}
		}

		// 포함 관계로 가장 가까운 역할 찾기 (권한 레벨이 높은 순서로)
		const rolePriority = ['USER_MANAGER', 'CLIENT_MANAGER', 'TOKEN_MANAGER', 'USER'];
		for (const roleName of rolePriority) {
			const rolePermissions = ROLES[roleName as keyof typeof ROLES];
			if (this.hasAllPermissions(permissions, [rolePermissions])) {
				return ROLE_NAMES[rolePermissions] || roleName;
			}
		}

		return '사용자 정의';
	}

	/**
	 * 관리자 권한인지 확인
	 */
	static isAdmin(permissions: number): boolean {
		return this.hasPermission(permissions, PERMISSION_UTILS.getAdminPermission());
	}
}

// 프론트엔드에서 사용하는 인증 관련 상수들
export const AUTH_CONSTANTS = {
	DEFAULT_USER_PERMISSIONS: ROLES.CLIENT_MANAGER, // OAuth2 기본 기능 권한
	TOKEN_TYPE: 'access' as const
} as const;
