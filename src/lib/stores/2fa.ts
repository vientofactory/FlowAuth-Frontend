import { writable } from 'svelte/store';
import { apiClient } from '$lib/utils/api';
import type { TwoFactorStatus } from '$lib/types/2fa.types';

export interface TwoFactorState {
	status: TwoFactorStatus | null;
	isLoading: boolean;
	error: string | null;
}

const initialState: TwoFactorState = {
	status: null,
	isLoading: false,
	error: null
};

function createTwoFactorStore() {
	const { subscribe, set, update } = writable<TwoFactorState>(initialState);

	return {
		subscribe,

		// 2FA 상태 로드
		async loadStatus() {
			update((state) => ({ ...state, isLoading: true, error: null }));

			try {
				const status = await apiClient.getTwoFactorStatus();
				update((state) => ({
					...state,
					status,
					isLoading: false
				}));
				return status;
			} catch (error) {
				console.error('Failed to load 2FA status:', error);
				const errorMessage =
					error instanceof Error ? error.message : '2FA 상태를 불러올 수 없습니다.';
				update((state) => ({
					...state,
					isLoading: false,
					error: errorMessage,
					status: { enabled: false, hasBackupCodes: false } // 기본값 설정
				}));
				return { enabled: false, hasBackupCodes: false };
			}
		},

		// 2FA 비활성화
		async disableTwoFactor(currentPassword: string) {
			update((state) => ({ ...state, isLoading: true, error: null }));

			try {
				await apiClient.disableTwoFactor({ currentPassword });
				update((state) => ({
					...state,
					status: { enabled: false, hasBackupCodes: false },
					isLoading: false
				}));
			} catch (error) {
				console.error('Failed to disable 2FA:', error);
				const errorMessage =
					error instanceof Error ? error.message : '2FA 비활성화에 실패했습니다.';
				update((state) => ({
					...state,
					isLoading: false,
					error: errorMessage
				}));
				throw error;
			}
		},

		// 에러 초기화
		clearError() {
			update((state) => ({ ...state, error: null }));
		},

		// 상태 초기화
		reset() {
			set(initialState);
		}
	};
}

export const twoFactorStore = createTwoFactorStore();
