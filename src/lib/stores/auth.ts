import { writable } from 'svelte/store';
import { apiClient } from '$lib/utils/api';
import { TOKEN_STORAGE_KEYS } from '$lib/constants/app.constants';
import type { User } from '$lib';

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	isInitialized: boolean; // 초기화 완료 여부 추가
}

// Svelte writable store 생성
export const authState = writable<AuthState>({
	user: null,
	isAuthenticated: false,
	isLoading: false,
	isInitialized: false // 초기값 false
});

class AuthStore {
	// 사용자 정보 초기화 (앱 시작 시 호출)
	async initialize() {
		console.log('AuthStore: Initializing authentication state...');
		authState.update((state) => ({ ...state, isLoading: true }));

		// 세션 복원 이벤트 리스너 등록
		this.setupSessionRecoveryListener();

		try {
			const token = this.getToken();
			console.log('AuthStore: Token found in storage:', !!token);

			if (token && token.trim() !== '') {
				// 토큰이 있으면 사용자 정보 가져오기
				console.log('AuthStore: Attempting to get profile with token...');
				const user = await apiClient.getProfile();
				console.log('AuthStore: Profile loaded successfully:', !!user);
				authState.update((state) => ({
					...state,
					user,
					isAuthenticated: true,
					isLoading: false,
					isInitialized: true
				}));
			} else {
				// JWT 토큰이 없어도 쿠키 기반으로 사용자 정보 시도
				console.log('AuthStore: No token found, trying cookie-based auth...');
				try {
					const user = await apiClient.getProfile();
					console.log('AuthStore: Cookie-based auth successful:', !!user);
					authState.update((state) => ({
						...state,
						user,
						isAuthenticated: true,
						isLoading: false,
						isInitialized: true
					}));
				} catch (cookieError) {
					// 쿠키 기반 인증도 실패하면 로그아웃 처리
					console.log('AuthStore: Cookie-based auth failed:', cookieError);
					authState.update((state) => ({
						...state,
						user: null,
						isAuthenticated: false,
						isLoading: false,
						isInitialized: true
					}));
				}
			}
		} catch (tokenError) {
			// JWT 토큰 기반 인증 실패 시, 쿠키 기반 시도
			console.log('AuthStore: Token-based auth failed:', tokenError);
			console.log('AuthStore: Error details:', tokenError);

			// 토큰이 만료되었거나 유효하지 않은 경우 토큰 제거
			const errorMessage = tokenError instanceof Error ? tokenError.message : String(tokenError);
			if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
				console.log('AuthStore: Token appears to be invalid, removing it');
				// 토큰만 제거하고 완전히 로그아웃하지는 않음
				if (typeof window !== 'undefined') {
					localStorage.removeItem('auth_token');
					document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
				}
			}

			try {
				const user = await apiClient.getProfile();
				console.log('AuthStore: Fallback to cookie-based auth successful:', !!user);
				authState.update((state) => ({
					...state,
					user,
					isAuthenticated: true,
					isLoading: false
				}));
			} catch (fallbackError) {
				// 모든 인증 방법 실패
				console.log('AuthStore: All auth methods failed:', fallbackError);
				const fallbackErrorMessage =
					fallbackError instanceof Error ? fallbackError.message : String(fallbackError);

				// 네트워크 오류인 경우 세션을 유지 (오프라인 모드)
				if (
					fallbackErrorMessage.includes('fetch') ||
					fallbackErrorMessage.includes('network') ||
					fallbackErrorMessage.includes('Failed to fetch')
				) {
					console.log('AuthStore: Network error detected, keeping session for offline mode');
					// 네트워크 오류 시 세션 유지 (나중에 재연결 시도)
					authState.update((state) => ({
						...state,
						isLoading: false,
						isInitialized: true
						// user와 isAuthenticated는 유지
					}));
				} else {
					// 다른 종류의 오류인 경우 로그아웃
					this.logout();
					authState.update((state) => ({
						...state,
						user: null,
						isAuthenticated: false,
						isLoading: false,
						isInitialized: true
					}));
				}
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

			authState.update((state) => ({
				...state,
				user: result.user,
				isAuthenticated: true,
				isLoading: false
			}));

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

			authState.update((state) => ({
				...state,
				user: result.user,
				isAuthenticated: true,
				isLoading: false
			}));

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

			authState.update((state) => ({
				...state,
				user: result.user,
				isAuthenticated: true,
				isLoading: false
			}));

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
			localStorage.setItem(TOKEN_STORAGE_KEYS.OAUTH2, accessToken);
			if (refreshToken) {
				localStorage.setItem(TOKEN_STORAGE_KEYS.REFRESH_OAUTH2, refreshToken);
			}
			// 쿠키에도 저장
			document.cookie = `token=${accessToken}; path=/; max-age=86400; samesite=lax`;
		}

		// 사용자 정보 가져오기
		try {
			const user = await apiClient.getProfile();
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
			localStorage.removeItem(TOKEN_STORAGE_KEYS.LOGIN);
			localStorage.removeItem(TOKEN_STORAGE_KEYS.OAUTH2);
			// 쿠키도 제거
			document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
			console.log('AuthStore: Tokens removed successfully');
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
			const updatedUser = await apiClient.updateProfile(updates);
			authState.update((state) => ({
				...state,
				user: updatedUser as User,
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
			const user = await apiClient.getProfile();
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
			let token = localStorage.getItem(TOKEN_STORAGE_KEYS.LOGIN);
			if (!token) {
				token = localStorage.getItem(TOKEN_STORAGE_KEYS.OAUTH2);
			}
			return token;
		}
		return null;
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
				const user = await apiClient.getProfile();
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
