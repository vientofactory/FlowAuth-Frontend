import { writable } from 'svelte/store';
import { apiClient } from '$lib/utils/api';
import type { User } from '$lib';

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
}

// Svelte writable store 생성
export const authState = writable<AuthState>({
	user: null,
	isAuthenticated: false,
	isLoading: false
});

class AuthStore {
	// 사용자 정보 초기화 (앱 시작 시 호출)
	async initialize() {
		authState.update((state) => ({ ...state, isLoading: true }));

		try {
			const token = this.getToken();

			if (token && token.trim() !== '') {
				// 토큰이 있으면 사용자 정보 가져오기
				const user = await apiClient.getProfile();
				authState.update((state) => ({
					...state,
					user,
					isAuthenticated: true,
					isLoading: false
				}));
			} else {
				// JWT 토큰이 없어도 쿠키 기반으로 사용자 정보 시도
				try {
					const user = await apiClient.getProfile();
					authState.update((state) => ({
						...state,
						user,
						isAuthenticated: true,
						isLoading: false
					}));
				} catch {
					// 쿠키 기반 인증도 실패하면 로그아웃 처리
					authState.update((state) => ({
						...state,
						user: null,
						isAuthenticated: false,
						isLoading: false
					}));
				}
			}
		} catch {
			// JWT 토큰 기반 인증 실패 시, 쿠키 기반 시도
			try {
				const user = await apiClient.getProfile();
				authState.update((state) => ({
					...state,
					user,
					isAuthenticated: true,
					isLoading: false
				}));
			} catch {
				// 모든 인증 방법 실패
				this.logout();
				authState.update((state) => ({
					...state,
					user: null,
					isAuthenticated: false,
					isLoading: false
				}));
			}
		}
	}

	// 로그인
	async login(email: string, password: string) {
		authState.update((state) => ({ ...state, isLoading: true }));

		try {
			const result = await apiClient.login({ email, password });
			authState.update((state) => ({
				...state,
				user: result.user,
				isAuthenticated: true,
				isLoading: false
			}));
			return result;
		} catch (error) {
			authState.update((state) => ({ ...state, isLoading: false }));
			throw error;
		}
	}

	// 로그아웃
	logout() {
		apiClient.logout();
		authState.update(() => ({
			user: null,
			isAuthenticated: false,
			isLoading: false
		}));
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
			return localStorage.getItem('auth_token');
		}
		return null;
	}
}

// 싱글톤 인스턴스 생성
export const authStore = new AuthStore();

// 편의를 위한 export
export default authStore;
