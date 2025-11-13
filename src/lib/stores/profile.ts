import { writable, derived, get } from 'svelte/store';
import { apiClient } from '$lib/utils/api';
import type { User } from '$lib';

interface ProfileState {
	user: User | null;
	isLoading: boolean;
	error: string | null;
	lastFetched: number | null;
	isInitialized: boolean;
}

// 프로필 상태 스토어
export const profileState = writable<ProfileState>({
	user: null,
	isLoading: false,
	error: null,
	lastFetched: null,
	isInitialized: false
});

// 프로필 캐시 시간 (5분)
const PROFILE_CACHE_DURATION = 5 * 60 * 1000;

// 현재 요청 중인 Promise를 저장하여 중복 요청 방지
let currentRequest: Promise<User> | null = null;

class ProfileStore {
	/**
	 * 프로필 정보를 가져옵니다. (캐시 고려)
	 * @param forceRefresh 강제로 새로고침할지 여부
	 * @returns User 정보
	 */
	async getProfile(forceRefresh = false): Promise<User> {
		// 현재 상태 확인 (동기적으로)
		const currentState = this.getCurrentStateSync();
		const now = Date.now();

		// 캐시가 유효하고 강제 새로고침이 아닌 경우 캐시된 데이터 반환
		if (
			!forceRefresh &&
			currentState.user &&
			currentState.lastFetched &&
			now - currentState.lastFetched < PROFILE_CACHE_DURATION &&
			!currentState.error
		) {
			console.log('ProfileStore: Returning cached profile data');
			return currentState.user;
		}

		// 이미 요청 중인 경우 해당 Promise 반환
		if (currentRequest && !forceRefresh) {
			console.log('ProfileStore: Returning existing request promise');
			return currentRequest;
		}

		console.log('ProfileStore: Fetching fresh profile data');

		// 로딩 상태 시작
		profileState.update((state) => ({
			...state,
			isLoading: true,
			error: null
		}));

		// 새로운 요청 시작
		currentRequest = this.fetchProfileFromAPI();

		try {
			const user = await currentRequest;

			// 성공 시 상태 업데이트
			profileState.update((state) => ({
				...state,
				user,
				isLoading: false,
				error: null,
				lastFetched: Date.now(),
				isInitialized: true
			}));

			console.log('ProfileStore: Profile fetched successfully');
			return user;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to fetch profile';

			// 실패 시 상태 업데이트
			profileState.update((state) => ({
				...state,
				isLoading: false,
				error: errorMessage,
				isInitialized: true
			}));

			console.error('ProfileStore: Profile fetch failed:', errorMessage);
			throw error;
		} finally {
			// 요청 완료 후 Promise 제거
			currentRequest = null;
		}
	}

	/**
	 * 프로필 정보를 강제로 새로고침합니다.
	 */
	async refreshProfile(): Promise<User> {
		return this.getProfile(true);
	}

	/**
	 * 프로필 정보를 업데이트합니다.
	 * @param updates 업데이트할 프로필 데이터
	 */
	async updateProfile(updates: Partial<User>): Promise<User> {
		const currentState = this.getCurrentStateSync();
		if (!currentState.user) {
			throw new Error('No profile data available to update');
		}

		// 로딩 상태 시작
		profileState.update((state) => ({
			...state,
			isLoading: true,
			error: null
		}));

		try {
			const updatedUser = await apiClient.updateProfile(updates);

			// 성공 시 상태 업데이트
			profileState.update((state) => ({
				...state,
				user: updatedUser as User,
				isLoading: false,
				error: null,
				lastFetched: Date.now()
			}));

			console.log('ProfileStore: Profile updated successfully');
			return updatedUser as User;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';

			// 실패 시 상태 업데이트 (사용자 정보는 유지)
			profileState.update((state) => ({
				...state,
				isLoading: false,
				error: errorMessage
			}));

			console.error('ProfileStore: Profile update failed:', errorMessage);
			throw error;
		}
	}

	/**
	 * 프로필 상태를 초기화합니다.
	 */
	reset(): void {
		try {
			profileState.set({
				user: null,
				isLoading: false,
				error: null,
				lastFetched: null,
				isInitialized: false
			});
			currentRequest = null;
			console.log('ProfileStore: Profile state reset');
		} catch (error) {
			console.warn('ProfileStore: Error during reset:', error);
		}
	}

	/**
	 * 프로필 데이터가 유효한지 확인합니다.
	 */
	isProfileValid(): boolean {
		const currentState = this.getCurrentStateSync();
		const now = Date.now();

		return !!(
			currentState.user &&
			currentState.lastFetched &&
			now - currentState.lastFetched < PROFILE_CACHE_DURATION &&
			!currentState.error
		);
	}

	/**
	 * 캐시된 프로필 데이터를 즉시 반환합니다. (비동기 아님)
	 */
	getCachedProfile(): User | null {
		const currentState = this.getCurrentStateSync();
		return currentState.user;
	}

	/**
	 * 외부에서 프로필 데이터를 설정합니다. (로그인 후 등)
	 */
	setProfile(user: User): void {
		profileState.update((state) => ({
			...state,
			user,
			isLoading: false,
			error: null,
			lastFetched: Date.now(),
			isInitialized: true
		}));
		console.log('ProfileStore: Profile set externally');
	}

	/**
	 * API에서 프로필 데이터를 가져옵니다.
	 */
	private async fetchProfileFromAPI(): Promise<User> {
		try {
			return await apiClient.getProfile();
		} catch (error) {
			console.error('ProfileStore: API fetch failed:', error);
			throw error;
		}
	}

	/**
	 * 현재 상태를 동기적으로 가져옵니다.
	 */
	private getCurrentStateSync(): ProfileState {
		try {
			return get(profileState);
		} catch (error) {
			console.warn('ProfileStore: Error getting current state sync:', error);
			return {
				user: null,
				isLoading: false,
				error: null,
				lastFetched: null,
				isInitialized: false
			};
		}
	}
}

// 싱글톤 인스턴스 생성
export const profileStore = new ProfileStore();

// 편의를 위한 derived 스토어들
export const profileUser = derived(profileState, ($profileState) => $profileState.user);
export const isProfileLoading = derived(profileState, ($profileState) => $profileState.isLoading);
export const profileError = derived(profileState, ($profileState) => $profileState.error);
export const isProfileInitialized = derived(
	profileState,
	($profileState) => $profileState.isInitialized
);

// 기본 export
export default profileStore;
