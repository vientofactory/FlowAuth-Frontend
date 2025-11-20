import { authState } from '$lib/stores/auth';
import { goto } from '$app/navigation';
import { get } from 'svelte/store';

/**
 * 인증이 필요한 페이지를 보호하는 가드 함수
 * @param redirectPath 인증 실패 시 리다이렉트할 경로 (기본: /auth/login)
 * @param returnUrl 로그인 후 돌아올 URL을 설정할지 여부 (기본: true)
 * @returns 인증 상태 확인 함수
 */
export function createAuthGuard(redirectPath = '/auth/login', returnUrl = true) {
	return async (timeout = 5000): Promise<boolean> => {
		// 서버 사이드에서는 체크하지 않음
		if (typeof window === 'undefined') {
			return true;
		}

		const currentPath = window.location.pathname;
		console.log('AuthGuard: Checking authentication for path:', currentPath);

		// 최대 대기 시간 설정
		const startTime = Date.now();

		return new Promise((resolve) => {
			const checkAuth = () => {
				const state = get(authState);
				const elapsed = Date.now() - startTime;

				// 초기화가 완료된 경우
				if (state.isInitialized) {
					if (state.isAuthenticated && state.user) {
						console.log('AuthGuard: User is authenticated');
						resolve(true);
						return;
					} else {
						console.log('AuthGuard: User is not authenticated, redirecting...');
						// 현재 경로를 return URL로 설정
						const loginUrl = new URL(redirectPath, window.location.origin);
						if (returnUrl && currentPath !== '/' && !currentPath.startsWith('/auth')) {
							loginUrl.searchParams.set('returnUrl', currentPath);
						}
						goto(loginUrl.toString());
						resolve(false);
						return;
					}
				}

				// 타임아웃 체크
				if (elapsed >= timeout) {
					console.log('AuthGuard: Initialization timeout, redirecting...');
					const loginUrl = new URL(redirectPath, window.location.origin);
					if (returnUrl && currentPath !== '/' && !currentPath.startsWith('/auth')) {
						loginUrl.searchParams.set('returnUrl', currentPath);
					}
					goto(loginUrl.toString());
					resolve(false);
					return;
				}

				// 아직 초기화 중이면 잠시 후 다시 체크
				setTimeout(checkAuth, 100);
			};

			checkAuth();
		});
	};
}

/**
 * 인증 상태 변화를 구독하고 필요시 리다이렉트하는 함수
 * @param redirectPath 인증 실패 시 리다이렉트할 경로
 * @param returnUrl 로그인 후 돌아올 URL을 설정할지 여부
 * @returns unsubscribe 함수
 */
export function subscribeToAuthState(redirectPath = '/auth/login', returnUrl = true) {
	if (typeof window === 'undefined') {
		return () => {};
	}

	const currentPath = window.location.pathname;

	return authState.subscribe((state) => {
		// 초기화가 완료되고 인증되지 않은 경우
		if (state.isInitialized && !state.isAuthenticated) {
			console.log('AuthGuard: User lost authentication, redirecting...');
			const loginUrl = new URL(redirectPath, window.location.origin);
			if (returnUrl && currentPath !== '/' && !currentPath.startsWith('/auth')) {
				loginUrl.searchParams.set('returnUrl', currentPath);
			}
			goto(loginUrl.toString());
		}
	});
}

/**
 * 기본 대시보드 인증 가드
 */
export const dashboardAuthGuard = createAuthGuard('/auth/login', true);

/**
 * 관리자 전용 페이지 인증 가드
 */
export const adminAuthGuard = createAuthGuard('/auth/login', true);

/**
 * 개발자 전용 페이지 인증 가드
 */
export const developerAuthGuard = createAuthGuard('/auth/login', true);
