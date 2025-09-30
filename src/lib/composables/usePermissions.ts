import { derived } from 'svelte/store';
import { authState } from '$lib/stores/auth';
import { PermissionUtils, PERMISSIONS, ROLES, ROLE_NAMES } from '$lib/utils/permissions';

/**
 * 권한 관련 composable
 * 사용자 권한을 쉽게 체크하고 사용할 수 있도록 도와줍니다.
 */
export function usePermissions() {
	// 현재 사용자 권한 상태
	const userPermissions = derived(authState, ($authState) => {
		if (!$authState.user?.permissions) return 0;
		return typeof $authState.user.permissions === 'string'
			? parseInt($authState.user.permissions, 10)
			: $authState.user.permissions;
	});

	// 현재 사용자
	const user = derived(authState, ($authState) => $authState.user);

	// 특정 권한을 가지고 있는지 확인
	const hasPermission = (permission: number) => {
		return derived(userPermissions, ($permissions) =>
			PermissionUtils.hasPermission($permissions, permission)
		);
	};

	// 여러 권한 중 하나라도 가지고 있는지 확인
	const hasAnyPermission = (permissions: number[]) => {
		return derived(userPermissions, ($userPermissions) =>
			PermissionUtils.hasAnyPermission($userPermissions, permissions)
		);
	};

	// 모든 필요한 권한을 가지고 있는지 확인
	const hasAllPermissions = (permissions: number[]) => {
		return derived(userPermissions, ($userPermissions) =>
			PermissionUtils.hasAllPermissions($userPermissions, permissions)
		);
	};

	// 관리자 권한인지 확인
	const isAdmin = derived(userPermissions, ($permissions) => PermissionUtils.isAdmin($permissions));

	// 역할 이름 가져오기
	const roleName = derived(userPermissions, ($permissions) =>
		PermissionUtils.getRoleName($permissions)
	);

	// 사용자 권한 이름 목록 가져오기
	const permissionNames = derived(userPermissions, ($permissions) =>
		PermissionUtils.getPermissionNames($permissions)
	);

	// 특정 역할인지 확인
	const hasRole = (role: string) => {
		return derived(userPermissions, ($permissions) => {
			const userRole = PermissionUtils.getRoleName($permissions);
			return userRole === ROLE_NAMES[role as keyof typeof ROLE_NAMES];
		});
	};

	return {
		user,
		userPermissions,
		hasPermission,
		hasAnyPermission,
		hasAllPermissions,
		isAdmin,
		roleName,
		permissionNames,
		hasRole,

		// 편의 store들
		canReadUser: hasPermission(PERMISSIONS.READ_USER),
		canWriteUser: hasPermission(PERMISSIONS.WRITE_USER),
		canDeleteUser: hasPermission(PERMISSIONS.DELETE_USER),
		canReadClient: hasPermission(PERMISSIONS.READ_CLIENT),
		canWriteClient: hasPermission(PERMISSIONS.WRITE_CLIENT),
		canDeleteClient: hasPermission(PERMISSIONS.DELETE_CLIENT),
		canReadToken: hasPermission(PERMISSIONS.READ_TOKEN),
		canWriteToken: hasPermission(PERMISSIONS.WRITE_TOKEN),
		canDeleteToken: hasPermission(PERMISSIONS.DELETE_TOKEN),
		canManageUsers: hasPermission(PERMISSIONS.MANAGE_USERS),
		canManageSystem: hasPermission(PERMISSIONS.MANAGE_SYSTEM),
		canReadDashboard: hasPermission(PERMISSIONS.READ_DASHBOARD),
		canWriteDashboard: hasPermission(PERMISSIONS.WRITE_DASHBOARD),
		canUploadFile: hasPermission(PERMISSIONS.UPLOAD_FILE),

		// 역할 체크 편의 store들
		isUser: hasRole(ROLES.USER),
		isClientManager: hasRole(ROLES.CLIENT_MANAGER),
		isTokenManager: hasRole(ROLES.TOKEN_MANAGER),
		isUserManager: hasRole(ROLES.USER_MANAGER)
	};
}
