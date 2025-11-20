import { writable } from 'svelte/store';
import { apiClient } from '$lib/utils/api';
import { LOCAL_STORAGE_KEYS } from '@flowauth/shared';
import { setAuthTokenCookie, deleteAuthTokenCookie, clearAllAuthCookies } from '$lib/utils/cookie';
import type { User } from '$lib';
import { profileStore } from './profile';

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	isInitialized: boolean;
}

// Svelte writable store 생성
export const authState = writable<AuthState>({
	user: null,
	isAuthenticated: false,
	isLoading: false,
	isInitialized: false
});

class AuthStore {
	// 사용자 정보 초기화 (앱 시작 시 호출)
	async initialize() {
		console.log('AuthStore: Starting initialization...');
		authState.update((state) => ({ ...state, isLoading: true, isInitialized: false }));

		// 세션 복원 이벤트 리스너 등록
		this.setupSessionRecoveryListener();

		// 현재 페이지가 인증이 필요하지 않은 페이지인지 확인
		const isPublicPage =
			typeof window !== 'undefined' ? this.isPublicPage(window.location.pathname) : false;

		try {
			// 토큰 또는 쿠키가 있는지 먼저 확인
			const token = this.getToken();
			const hasAuthData = !!(token && token.trim() !== '');

			console.log('AuthStore: Auth data check', { hasAuthData, isPublicPage });

			// 공개 페이지가 아니거나 인증 데이터가 있는 경우에만 인증 시도
			if (!isPublicPage || hasAuthData) {
				console.log('AuthStore: Attempting authentication...');

				try {
					// 토큰이 있으면 강제 새로고침, 없으면 세션 쿠키 기반
					const user = await profileStore.getProfile(hasAuthData);
					console.log('AuthStore: Authentication successful');

					// 프로필 스토어에 최신 데이터 설정
					profileStore.setProfile(user);

					authState.update((state) => ({
						...state,
						user,
						isAuthenticated: true,
						isLoading: false,
						isInitialized: true
					}));
					return;
				} catch (authError) {
					console.log('AuthStore: Authentication failed:', authError);

					// 토큰이 만료되었거나 유효하지 않은 경우 토큰 제거
					const errorMessage = authError instanceof Error ? authError.message : String(authError);
					if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
						console.log('AuthStore: Removing invalid tokens');
						if (typeof window !== 'undefined') {
							localStorage.removeItem(LOCAL_STORAGE_KEYS.LOGIN_TOKEN);
							localStorage.removeItem(LOCAL_STORAGE_KEYS.OAUTH2_TOKEN);
							localStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH_LOGIN_TOKEN);
							localStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH_OAUTH2_TOKEN);
							deleteAuthTokenCookie();
						}
					}

					// 공개 페이지가 아닌 경우에만 리다이렉트 필요
					if (!isPublicPage) {
						console.log('AuthStore: Protected page without valid auth, will redirect');
						// DashboardLayout에서 처리하도록 상태만 업데이트
						authState.update((state) => ({
							...state,
							user: null,
							isAuthenticated: false,
							isLoading: false,
							isInitialized: true
						}));
						return;
					}
				}
			}

			// 모든 인증 방법 실패 또는 공개 페이지
			console.log('AuthStore: No authentication or public page');
			authState.update((state) => ({
				...state,
				user: null,
				isAuthenticated: false,
				isLoading: false,
				isInitialized: true
			}));

			// 프로필 스토어 안전하게 리셋
			try {
				profileStore.reset();
			} catch (resetError) {
				console.warn('AuthStore: Failed to reset profile store:', resetError);
			}
		} catch (error) {
			console.error('AuthStore: Initialization error:', error);

			// 초기화 실패 시에도 initialized 상태로 설정
			authState.update((state) => ({
				...state,
				user: null,
				isAuthenticated: false,
				isLoading: false,
				isInitialized: true
			}));

			try {
				profileStore.reset();
			} catch (resetError) {
				console.warn('AuthStore: Failed to reset profile store:', resetError);
			}
		}
	}

	// 로그인
	async login(email: string, password: string, recaptchaToken?: string) {
		console.log('AuthStore: Login attempt for:', email);
		authState.update((state) => ({ ...state, isLoading: true }));

		try {
			const result = await apiClient.login({ email, password, recaptchaToken });
			console.log('AuthStore: Login successful, token received:', !!result.accessToken);

			// 토큰이 제대로 저장되었는지 확인
			const storedToken = this.getToken();
			console.log('AuthStore: Token stored in localStorage:', !!storedToken);

			// 프로필 스토어에 사용자 정보 설정 (강제 새로고침하여 최신 데이터 보장)
			profileStore.setProfile(result.user);

			// auth 상태 업데이트
			authState.update((state) => ({
				...state,
				user: result.user,
				isAuthenticated: true,
				isLoading: false
			}));

			// 로그인 후 최신 프로필 데이터로 동기화
			try {
				const freshProfile = await profileStore.getProfile(true);
				authState.update((state) => ({
					...state,
					user: freshProfile
				}));
				console.log('AuthStore: Profile synchronized after login');
			} catch (syncError) {
				console.warn('AuthStore: Failed to sync profile after login:', syncError);
			}

			console.log('AuthStore: Auth state updated successfully');
			return result;
		} catch (error) {
			console.log('AuthStore: Login failed:', error);
			authState.update((state) => ({ ...state, isLoading: false }));
			throw error;
		}
	}

	// 2FA 토큰 검증 로그인
	async verifyTwoFactorLogin(email: string, token: string) {
		console.log('AuthStore: 2FA login attempt for:', email);
		authState.update((state) => ({ ...state, isLoading: true }));

		try {
			const result = await apiClient.verifyTwoFactorLogin(email, token);
			console.log('AuthStore: 2FA login successful, token received:', !!result.accessToken);

			// 프로필 스토어에 사용자 정보 설정
			profileStore.setProfile(result.user);

			// auth 상태 업데이트
			authState.update((state) => ({
				...state,
				user: result.user,
				isAuthenticated: true,
				isLoading: false
			}));

			// 로그인 후 최신 프로필 데이터로 동기화
			try {
				const freshProfile = await profileStore.getProfile(true);
				authState.update((state) => ({
					...state,
					user: freshProfile
				}));
				console.log('AuthStore: Profile synchronized after 2FA login');
			} catch (syncError) {
				console.warn('AuthStore: Failed to sync profile after 2FA login:', syncError);
			}

			console.log('AuthStore: 2FA auth state updated successfully');
			return result;
		} catch (error) {
			console.log('AuthStore: 2FA login failed:', error);
			authState.update((state) => ({ ...state, isLoading: false }));
			throw error;
		}
	}

	// 백업 코드 검증 로그인
	async verifyBackupCodeLogin(email: string, backupCode: string) {
		console.log('AuthStore: Backup code login attempt for:', email);
		authState.update((state) => ({ ...state, isLoading: true }));

		try {
			const result = await apiClient.verifyBackupCodeLogin(email, backupCode);
			console.log('AuthStore: Backup code login successful, token received:', !!result.accessToken);

			// 프로필 스토어에 사용자 정보 설정
			profileStore.setProfile(result.user);

			// auth 상태 업데이트
			authState.update((state) => ({
				...state,
				user: result.user,
				isAuthenticated: true,
				isLoading: false
			}));

			// 로그인 후 최신 프로필 데이터로 동기화
			try {
				const freshProfile = await profileStore.getProfile(true);
				authState.update((state) => ({
					...state,
					user: freshProfile
				}));
				console.log('AuthStore: Profile synchronized after backup code login');
			} catch (syncError) {
				console.warn('AuthStore: Failed to sync profile after backup code login:', syncError);
			}

			console.log('AuthStore: Backup code auth state updated successfully');
			return result;
		} catch (error) {
			console.log('AuthStore: Backup code login failed:', error);
			authState.update((state) => ({ ...state, isLoading: false }));
			throw error;
		}
	}

	// OAuth2 토큰 저장
	async setOAuth2Token(accessToken: string, refreshToken?: string) {
		console.log('AuthStore: Setting OAuth2 token');
		if (typeof window !== 'undefined') {
			localStorage.setItem(LOCAL_STORAGE_KEYS.OAUTH2_TOKEN, accessToken);
			if (refreshToken) {
				localStorage.setItem(LOCAL_STORAGE_KEYS.REFRESH_OAUTH2_TOKEN, refreshToken);
			}
			// 쿠키에도 저장
			setAuthTokenCookie(accessToken);
		}

		// 프로필 스토어에서 사용자 정보 가져오기 (캐시 무시)
		try {
			const user = await profileStore.getProfile(true);
			// 프로필 스토어에 최신 데이터 설정
			profileStore.setProfile(user);

			authState.update((state) => ({
				...state,
				user,
				isAuthenticated: true,
				isLoading: false
			}));
			console.log('AuthStore: OAuth2 token set and user loaded successfully');
		} catch (error) {
			console.log('AuthStore: Failed to load user profile after OAuth2 token set:', error);
			throw error;
		}
	}

	// 로그아웃
	async logout() {
		console.log('AuthStore: Logout initiated');

		try {
			// 백엔드에 로그아웃 요청
			await apiClient.logout();
			console.log('AuthStore: Backend logout successful');
		} catch (error) {
			console.log('AuthStore: Backend logout failed, proceeding with client-side cleanup:', error);
			// 백엔드 로그아웃 실패해도 클라이언트 측 정리 진행
		}

		// 클라이언트 측 토큰 제거
		if (typeof window !== 'undefined') {
			console.log('AuthStore: Removing tokens from localStorage');
			localStorage.removeItem(LOCAL_STORAGE_KEYS.LOGIN_TOKEN);
			localStorage.removeItem(LOCAL_STORAGE_KEYS.OAUTH2_TOKEN);

			// 모든 인증 관련 쿠키 제거
			clearAllAuthCookies();

			// 모든 리프레시 토큰도 제거
			localStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH_LOGIN_TOKEN);
			localStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH_OAUTH2_TOKEN);

			// 세션 스토리지 정리
			sessionStorage.removeItem(LOCAL_STORAGE_KEYS.LOGIN_TOKEN);
			sessionStorage.removeItem(LOCAL_STORAGE_KEYS.OAUTH2_TOKEN);
			sessionStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH_LOGIN_TOKEN);
			sessionStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH_OAUTH2_TOKEN);

			console.log('AuthStore: All tokens and cookies removed successfully');
		}

		// 프로필 스토어 초기화
		try {
			profileStore.reset();
		} catch (resetError) {
			console.warn('AuthStore: Failed to reset profile store during logout:', resetError);
		}

		// 상태 업데이트
		authState.update(() => ({
			user: null,
			isAuthenticated: false,
			isLoading: false,
			isInitialized: true
		}));

		console.log('AuthStore: Logout completed');
	}

	// 프로필 업데이트
	async updateProfile(updates: Partial<User>) {
		const currentState = await this.getCurrentState();
		if (!currentState.user) throw new Error('Not authenticated');

		authState.update((state) => ({ ...state, isLoading: true }));

		try {
			const updatedUser = await profileStore.updateProfile(updates);
			authState.update((state) => ({
				...state,
				user: updatedUser,
				isLoading: false
			}));
			return updatedUser;
		} catch (error) {
			authState.update((state) => ({ ...state, isLoading: false }));
			throw error;
		}
	}

	// 프로필 새로고침
	async refreshProfile() {
		console.log('AuthStore: Refreshing profile...');
		authState.update((state) => ({ ...state, isLoading: true }));

		try {
			const user = await profileStore.refreshProfile();
			authState.update((state) => ({
				...state,
				user,
				isAuthenticated: true,
				isLoading: false
			}));
			console.log('AuthStore: Profile refreshed successfully');
			return user;
		} catch (error) {
			console.log('AuthStore: Profile refresh failed:', error);
			authState.update((state) => ({ ...state, isLoading: false }));
			throw error;
		}
	}

	// 현재 상태 가져오기 (내부용)
	private async getCurrentState(): Promise<AuthState> {
		return new Promise((resolve) => {
			const unsubscribe = authState.subscribe((state) => {
				unsubscribe();
				resolve(state);
			});
		});
	}

	// 토큰 가져오기 (private 메소드)
	private getToken(): string | null {
		if (typeof window !== 'undefined') {
			// 우선 login 토큰 확인, 없으면 oauth2 확인
			let token = localStorage.getItem(LOCAL_STORAGE_KEYS.LOGIN_TOKEN);
			if (!token || token.trim() === '') {
				token = localStorage.getItem(LOCAL_STORAGE_KEYS.OAUTH2_TOKEN);
			}

			// 토큰이 있는 경우 간단한 형식 검증
			if (token && token.trim() !== '' && this.isValidJWTFormat(token)) {
				return token;
			}

			// 잘못된 토큰이면 정리
			if (token) {
				console.log('AuthStore: Invalid token format detected, cleaning up');
				localStorage.removeItem(LOCAL_STORAGE_KEYS.LOGIN_TOKEN);
				localStorage.removeItem(LOCAL_STORAGE_KEYS.OAUTH2_TOKEN);
			}
		}
		return null;
	}

	// JWT 토큰 형식 검증 (간단한 검증)
	private isValidJWTFormat(token: string): boolean {
		try {
			const parts = token.split('.');
			return parts.length === 3 && parts.every((part) => part.length > 0);
		} catch {
			return false;
		}
	}

	// 공개 페이지인지 확인 (인증이 필요하지 않은 페이지)
	private isPublicPage(pathname: string): boolean {
		const publicPaths = [
			'/',
			'/auth/login',
			'/auth/register',
			'/auth/forgot-password',
			'/auth/reset-password',
			'/auth/verify-email',
			'/auth/2fa/setup',
			'/callback',
			'/oauth2/authorize'
		];

		// 정확한 경로 매치 또는 하위 경로 매치
		return publicPaths.some((path) => {
			if (path === '/') {
				return pathname === '/';
			}
			return (
				pathname === path || pathname.startsWith(path + '/') || pathname.startsWith(path + '?')
			);
		});
	}

	// 현재 세션 토큰의 JTI 가져오기
	getCurrentSessionTokenId(): string | null {
		const token = this.getToken();
		if (!token) return null;

		try {
			// JWT 디코딩 (간단한 base64 디코딩)
			const payload = token.split('.')[1];
			const decodedPayload = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
			return decodedPayload.jti || null;
		} catch (error) {
			console.error('Failed to decode JWT token:', error);
			return null;
		}
	}

	// 세션 정보 가져오기 (디버깅용)
	getSessionInfo() {
		const token = this.getToken();
		const hasToken = !!token;
		const tokenLength = token ? token.length : 0;

		return {
			hasToken,
			tokenLength,
			isAuthenticated: false, // 이 값은 store에서 가져와야 함
			user: null // 이 값은 store에서 가져와야 함
		};
	}

	// 세션 복원 이벤트 리스너 설정
	private setupSessionRecoveryListener() {
		if (typeof window === 'undefined') return;

		window.addEventListener('session-recovered', async () => {
			console.log('AuthStore: Session recovery event received, refreshing auth state...');

			try {
				const user = await profileStore.refreshProfile();
				authState.update((state) => ({
					...state,
					user,
					isAuthenticated: true,
					isLoading: false
				}));
				console.log('AuthStore: Session successfully recovered');
			} catch (error) {
				console.error('AuthStore: Failed to recover session:', error);
				// 세션 복원 실패 시 로그아웃 처리
				this.logout();
			}
		});
	}
}

// 싱글톤 인스턴스 생성
export const authStore = new AuthStore();

// 편의를 위한 export
export default authStore;
