import { onMount } from 'svelte';
import { writable } from 'svelte/store';
import { apiClient } from '$lib/utils/api';
import { parseError } from '../utils/error.utils';
import { ERROR_MESSAGES } from '../constants/authorization.constants';
import type { Client } from '$lib/types/oauth.types';
import type { PageData } from '../../../routes/oauth2/authorize/$types';
import type {
	AuthorizationState,
	AuthorizationHookReturn,
	AuthorizationError
} from '../types/authorization.types';
import { ErrorType } from '../types/authorization.types';

/**
 * OAuth2 권한 부여를 위한 커스텀 훅
 */
export function useAuthorization(data: PageData): AuthorizationHookReturn {
	const initialState: AuthorizationState = {
		loading: true,
		submitting: false,
		error: null,
		client: null,
		scopes: [],
		loadingProgress: 0
	};

	const state = writable<AuthorizationState>(initialState);

	/**
	 * 로딩 진행률을 업데이트합니다.
	 */
	function updateProgress(progress: number) {
		state.update((current) => ({ ...current, loadingProgress: progress }));
	}

	/**
	 * 권한 부여 데이터를 로드합니다.
	 */
	async function loadAuthorizationData(): Promise<void> {
		const { authorizeParams } = data;

		// 필수 파라미터 검증
		if (
			!authorizeParams.client_id ||
			!authorizeParams.redirect_uri ||
			!authorizeParams.response_type
		) {
			const error: AuthorizationError = {
				type: ErrorType.INVALID_PARAMS,
				message: ERROR_MESSAGES.REQUIRED_PARAMS_MISSING,
				retryable: false
			};
			state.update((current) => ({ ...current, error, loading: false }));
			return;
		}

		try {
			updateProgress(25);

			// 디버그 정보 출력
			apiClient.debugToken();
			updateProgress(50);

			// 백엔드에서 동의 정보 조회
			const params = new URLSearchParams({
				client_id: authorizeParams.client_id,
				redirect_uri: authorizeParams.redirect_uri,
				response_type: authorizeParams.response_type,
				...(authorizeParams.scope && { scope: authorizeParams.scope }),
				...(authorizeParams.state && { state: authorizeParams.state }),
				...(authorizeParams.code_challenge && { code_challenge: authorizeParams.code_challenge }),
				...(authorizeParams.code_challenge_method && {
					code_challenge_method: authorizeParams.code_challenge_method
				})
			});

			updateProgress(75);

			const result = await apiClient.request<{ client: Client; scopes: string[] }>(
				`/oauth2/authorize/info?${params.toString()}`,
				{ method: 'GET' }
			);

			updateProgress(100);

			state.update((current) => ({
				...current,
				client: result.client,
				scopes: result.scopes,
				loading: false,
				error: null
			}));
		} catch (err) {
			console.error('Authorization validation error:', err);
			const parsedError = parseError(err);
			state.update((current) => ({
				...current,
				error: parsedError,
				loading: false
			}));
		}
	}

	/**
	 * 동의 처리 함수
	 */
	async function handleConsent(approved: boolean): Promise<void> {
		state.update((current) => ({ ...current, submitting: true, error: null }));

		try {
			const consentData = {
				...data.authorizeParams,
				approved
			};

			const result = await apiClient.request<{ redirect_url: string }>(
				'/oauth2/authorize/consent',
				{
					method: 'POST',
					body: JSON.stringify(consentData)
				}
			);

			// 리다이렉트
			window.location.href = result.redirect_url;
		} catch (err) {
			console.error('Consent error:', err);
			const parsedError = parseError(err);
			state.update((current) => ({
				...current,
				error: parsedError,
				submitting: false
			}));
		}
	}

	/**
	 * 권한 부여 재시도
	 */
	async function retryAuthorization(): Promise<void> {
		state.update((current) => ({
			...current,
			loading: true,
			error: null,
			loadingProgress: 0
		}));
		await loadAuthorizationData();
	}

	// 컴포넌트 마운트 시 데이터 로드
	onMount(() => {
		loadAuthorizationData();
	});

	return {
		state,
		loadAuthorizationData,
		handleConsent,
		retryAuthorization
	};
}
