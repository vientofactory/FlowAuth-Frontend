import { writable } from 'svelte/store';
import { apiClient } from '$lib/utils/api';
import { parseError } from '../utils/error.utils';
import { ERROR_MESSAGES } from '../constants/authorization.constants';
import { ROUTES } from '../constants/app.constants';
import type { User } from '$lib/types/user.types';
interface AuthorizePageData {
	authorizeParams: {
		client_id: string;
		redirect_uri: string;
		response_type: string;
		scope?: string;
		state?: string;
		code_challenge?: string;
		code_challenge_method?: string;
		nonce?: string;
	};
}
import type {
	AuthorizationState,
	AuthorizationHookReturn,
	AuthorizationError
} from '../types/authorization.types';
import { ErrorType } from '../types/authorization.types';

/**
 * OAuth2 권한 부여를 위한 커스텀 훅
 */
export function useAuthorization(data: AuthorizePageData): AuthorizationHookReturn {
	const initialState: AuthorizationState = {
		loading: true,
		submitting: false,
		error: null,
		client: null,
		scopes: [],
		loadingProgress: 0,
		currentUser: null
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

		// 로딩 타임아웃 설정 (30초)
		const timeoutId = setTimeout(() => {
			const error: AuthorizationError = {
				type: ErrorType.TIMEOUT_ERROR,
				message: '보안 검증이 너무 오래 걸립니다. 잠시 후 다시 시도해주세요.',
				retryable: true
			};
			state.update((current) => ({ ...current, error, loading: false }));
		}, 30000);

		// 사용자 정보 변수를 try 블록 밖에서 선언하여 catch에서도 접근 가능
		let currentUser: User | null = null;

		try {
			console.log('[Authorization] Starting authorization data load');
			updateProgress(10);
			await new Promise((resolve) => setTimeout(resolve, 100)); // 최소 로딩 시간 보장

			updateProgress(20);
			console.log('[Authorization] Loading current user profile');
			// 현재 사용자 정보 로드
			try {
				currentUser = await apiClient.getProfile();
				console.log('[Authorization] Current user loaded:', currentUser);
			} catch (userError) {
				console.warn('[Authorization] Failed to load user profile:', userError);
				// 사용자 정보 로드 실패는 치명적 오류가 아니므로 계속 진행
			}

			updateProgress(40);
			console.log('[Authorization] Checking debug token');
			// 디버그 정보 출력
			apiClient.debugToken();

			updateProgress(60);
			await new Promise((resolve) => setTimeout(resolve, 100)); // 최소 로딩 시간 보장

			// 백엔드에서 동의 정보 조회 - API 클라이언트 사용
			console.log('[Authorization] Making API request to get authorization info');

			updateProgress(85);

			// API 요청에 타임아웃 추가 (15초로 단축)
			const apiTimeoutId = setTimeout(() => {
				console.error('[Authorization] API request timeout after 15 seconds');
				throw new Error('API 요청이 15초를 초과했습니다. 네트워크 연결을 확인해주세요.');
			}, 15000);

			const result = await apiClient.getAuthorizationInfo({
				client_id: authorizeParams.client_id,
				redirect_uri: authorizeParams.redirect_uri,
				response_type: authorizeParams.response_type,
				...(authorizeParams.scope && { scope: authorizeParams.scope }),
				...(authorizeParams.state && { state: authorizeParams.state }),
				...(authorizeParams.code_challenge && { code_challenge: authorizeParams.code_challenge }),
				...(authorizeParams.code_challenge_method && {
					code_challenge_method: authorizeParams.code_challenge_method
				}),
				...(authorizeParams.nonce && { nonce: authorizeParams.nonce })
			});

			clearTimeout(apiTimeoutId);
			console.log('[Authorization] API request successful:', result);

			// 타임아웃 취소
			clearTimeout(timeoutId);

			updateProgress(100);
			await new Promise((resolve) => setTimeout(resolve, 200)); // 성공 상태 표시 시간

			console.log('[Authorization] Updating state with success data');
			state.update((current) => ({
				...current,
				client: result.client,
				scopes: result.scopes,
				currentUser,
				loading: false,
				error: null
			}));
			console.log('[Authorization] State updated successfully');
		} catch (err) {
			// 타임아웃 취소
			clearTimeout(timeoutId);

			console.error('[Authorization] Error occurred:', err);

			// 401 에러 (인증 실패) 처리 - 로그인 페이지로 리디렉션
			if (err instanceof Error && err.message.includes('Authentication required')) {
				console.log('[Authorization] Authentication required, redirecting to login page');

				// 현재 OAuth2 authorize URL을 returnUrl로 설정
				const currentUrl = window.location.href;
				const loginUrl = `${ROUTES.LOGIN}?returnUrl=${encodeURIComponent(currentUrl)}`;

				window.location.href = loginUrl;
				return;
			}

			const parsedError = parseError(err);
			console.log('[Authorization] Parsed error:', parsedError);

			state.update((current) => ({
				...current,
				error: parsedError,
				loading: false,
				// 사용자 정보가 로드되었다면 보존
				currentUser: currentUser || current.currentUser
			}));
			console.log('[Authorization] Error state updated');
		}
	}

	/**
	 * 동의 처리 함수 - API 클라이언트 사용
	 */
	async function handleConsent(approved: boolean): Promise<void> {
		state.update((current) => ({ ...current, submitting: true, error: null }));

		try {
			const result = await apiClient.handleConsent({
				...data.authorizeParams,
				approved
			});

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
			// currentUser는 유지하여 에러 상태에서도 로그인 정보를 보존
		}));
		await loadAuthorizationData();
	}

	// 컴포넌트 마운트 시 데이터 로드 (호출하는 쪽에서 직접 호출하도록 변경)
	// onMount(() => {
	// 	console.log('[Authorization] Component mounted, starting data load');
	// 	loadAuthorizationData();

	// 	// 추가 안전장치: 45초 후에도 로딩 중이면 강제로 에러 상태로 전환
	// 	setTimeout(() => {
	// 		state.update((current) => {
	// 			if (current.loading) {
	// 				console.error('[Authorization] Force timeout: loading took too long');
	// 				return {
	// 					...current,
	// 					loading: false,
	// 					error: {
	// 						type: ErrorType.TIMEOUT_ERROR,
	// 						message: '보안 검증이 예상보다 오래 걸리고 있습니다. 페이지를 새로고침해주세요.',
	// 						retryable: false
	// 					}
	// 				};
	// 			}
	// 			return current;
	// 		});
	// 	}, 45000);
	// });

	return {
		state,
		loadAuthorizationData,
		handleConsent,
		retryAuthorization
	};
}
