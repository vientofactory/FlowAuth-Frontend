import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { CryptoUtils } from '$lib/utils/crypto.util';

/**
 * OIDC nonce 관리 스토어
 * nonce는 replay attack 방지를 위해 사용되며, 세션 스토리지에 저장됩니다.
 */
interface OIDCState {
	nonce: string | null;
	state: string | null;
	codeVerifier: string | null;
}

function createOIDCStore() {
	const initialState: OIDCState = {
		nonce: null,
		state: null,
		codeVerifier: null
	};

	const { subscribe, set } = writable<OIDCState>(initialState);

	// 브라우저 환경에서만 세션 스토리지 사용
	if (browser) {
		// 초기 로드 시 세션 스토리지에서 복원
		const storedNonce = sessionStorage.getItem('oidc_nonce');
		const storedState = sessionStorage.getItem('oidc_state');
		const storedCodeVerifier = sessionStorage.getItem('oidc_code_verifier');

		if (storedNonce || storedState || storedCodeVerifier) {
			set({
				nonce: storedNonce,
				state: storedState,
				codeVerifier: storedCodeVerifier
			});
		}
	}

	return {
		subscribe,

		/**
		 * 새로운 nonce와 state 생성 및 저장
		 */
		generateAndStoreNonce: () => {
			const nonce = CryptoUtils.generateState(32);
			const state = CryptoUtils.generateState(32);
			const codeVerifier = CryptoUtils.generateCodeVerifier();

			const newState: OIDCState = {
				nonce,
				state,
				codeVerifier
			};

			set(newState);

			// 세션 스토리지에 저장
			if (browser) {
				sessionStorage.setItem('oidc_nonce', nonce);
				sessionStorage.setItem('oidc_state', state);
				sessionStorage.setItem('oidc_code_verifier', codeVerifier);
			}

			return { nonce, state, codeVerifier };
		},

		/**
		 * 저장된 nonce 검증
		 */
		validateNonce: (receivedNonce: string): boolean => {
			let currentNonce: string | null = null;

			subscribe((state) => {
				currentNonce = state.nonce;
			})();

			return currentNonce === receivedNonce;
		},

		/**
		 * 저장된 state 검증
		 */
		validateState: (receivedState: string): boolean => {
			let currentState: string | null = null;

			subscribe((state) => {
				currentState = state.state;
			})();

			return currentState === receivedState;
		},

		/**
		 * 저장된 값들 가져오기
		 */
		getStoredValues: (): OIDCState => {
			let currentState: OIDCState = initialState;

			subscribe((state) => {
				currentState = state;
			})();

			return currentState;
		},

		/**
		 * 저장된 값들 초기화 (로그인 완료 후)
		 */
		clearStoredValues: () => {
			set(initialState);

			if (browser) {
				sessionStorage.removeItem('oidc_nonce');
				sessionStorage.removeItem('oidc_state');
				sessionStorage.removeItem('oidc_code_verifier');
			}
		}
	};
}

export const oidcStore = createOIDCStore();
