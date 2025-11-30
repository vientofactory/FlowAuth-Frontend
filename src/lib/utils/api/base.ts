import { APP_CONSTANTS, ROUTES, MESSAGES } from '$lib/constants/app.constants';
import { TOKEN_STORAGE_KEYS } from '$lib/constants/app.constants';
import { env } from '$lib/config/env';
import type { TokenType } from '$lib/types/authorization.types';
import { parseBackendError } from '../error.utils';
import { setAuthTokenCookie, deleteAuthTokenCookie } from '../cookie';
import { apiRequestStore } from '$lib/stores/api';

export interface ApiError {
	message?: string;
	status?: number;
	code?: string;
	// RFC 7807 Problem Details fields
	type?: string;
	title?: string;
	detail?: string;
	instance?: string;
	extensions?: Record<string, unknown>;
	// Legacy OAuth2 fields for backward compatibility
	error?: string;
	error_description?: string;
	state?: string;
	timestamp?: string;
	path?: string;
}

export interface RequestOptions {
	skipAuthRedirect?: boolean;
	disableRetry?: boolean;
	disableAutoRefresh?: boolean;
}

export abstract class BaseApi {
	protected baseURL: string;
	protected maxRetries = APP_CONSTANTS.DEFAULT_RETRY_COUNT;
	protected retryDelay = APP_CONSTANTS.DEFAULT_RETRY_DELAY;
	protected currentTokenType: TokenType = 'login';

	constructor(baseURL: string = env.API_BASE_URL) {
		this.baseURL = baseURL;
	}

	protected async request<T>(
		endpoint: string,
		options: RequestInit = {},
		retryCount = 0,
		requestOptions: RequestOptions = {}
	): Promise<T> {
		const {
			skipAuthRedirect = false,
			disableRetry = false,
			disableAutoRefresh = false
		} = requestOptions;
		apiRequestStore.startRequest();

		try {
			const url = `${this.baseURL}${endpoint}`;

			const config: RequestInit = {
				headers: {
					'Content-Type': 'application/json',
					...options.headers
				},
				credentials: 'include',
				...options
			};

			// JWT 토큰이 있으면 헤더에 추가 (이미 Authorization 헤더가 없는 경우만)
			const token = this.getToken();
			if (token && !(config.headers as Record<string, string>)?.Authorization) {
				// 민감한 작업이 아닌 경우에만 토큰 리프레시 확인
				if (!disableAutoRefresh) {
					await this.checkAndRefreshTokenIfNeeded(token);
				}

				config.headers = {
					...config.headers,
					Authorization: `Bearer ${this.getToken() || token}` // Use refreshed token if available
				};
			}

			const response = await fetch(url, config);

			// Handle token expiration - try automatic refresh first
			if (response.status === 401) {
				// 로그인 시도인 경우 2FA가 필요한지 먼저 확인
				if (skipAuthRedirect) {
					try {
						const clonedResponse = response.clone();
						const errorData = await this.parseErrorResponse(clonedResponse);

						// 2FA가 필요한 경우 특별 처리
						if (errorData.error_description === '2FA_REQUIRED') {
							throw new Error('2FA_REQUIRED');
						}
					} catch (parseError) {
						if (parseError instanceof Error && parseError.message === '2FA_REQUIRED') {
							throw parseError;
						}
					}
				}

				// Try automatic token refresh if we have a refresh token and this isn't a login attempt
				// 민감한 작업에서는 자동 토큰 리프레시 비활성화
				if (!skipAuthRedirect && !disableAutoRefresh && this.getRefreshToken()) {
					try {
						await this.attemptTokenRefresh();
						// Retry the original request with the new token
						return this.request<T>(endpoint, options, retryCount, {
							skipAuthRedirect,
							disableRetry,
							disableAutoRefresh
						});
					} catch {
						// Refresh failed, proceed with normal 401 handling
					}
				}

				// Normal 401 handling - remove token and redirect
				this.removeToken();

				if (!skipAuthRedirect && typeof window !== 'undefined') {
					// 이미 로그인 페이지에 있는 경우 리다이렉트하지 않음
					const currentPath = window.location.pathname;
					if (!currentPath.includes('/auth/login') && !currentPath.includes('/auth/register')) {
						window.location.href = ROUTES.LOGIN;
					}
				}

				if (skipAuthRedirect) {
					const errorData = await this.parseErrorResponse(response);
					const error = this.createErrorFromResponse(errorData, response.status);
					throw error;
				} else {
					throw new Error(MESSAGES.VALIDATION.AUTHENTICATION_REQUIRED);
				}
			}

			if (!response.ok) {
				const errorData = await this.parseErrorResponse(response);

				// 재시도가 비활성화되었거나 400번대 에러인 경우 재시도하지 않음
				if (!disableRetry && this.shouldRetry(response.status, retryCount)) {
					await this.delay(this.retryDelay * Math.pow(2, retryCount));
					return this.request<T>(endpoint, options, retryCount + 1, {
						skipAuthRedirect,
						disableRetry
					});
				}

				throw this.createErrorFromResponse(errorData, response.status);
			}

			return await response.json();
		} catch (error) {
			// 재시도가 비활성화되지 않은 경우에만 네트워크 에러 재시도
			if (!disableRetry && this.shouldRetryNetworkError(error, retryCount)) {
				await this.delay(this.retryDelay * Math.pow(2, retryCount));
				return this.request<T>(endpoint, options, retryCount + 1, {
					skipAuthRedirect,
					disableRetry
				});
			}

			if (
				error instanceof TypeError ||
				(error as Error & { name?: string }).name === 'NetworkError'
			) {
				throw new Error('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
			}

			throw error;
		} finally {
			apiRequestStore.endRequest();
		}
	}

	protected async parseErrorResponse(response: Response): Promise<ApiError> {
		try {
			return await response.json();
		} catch {
			return {
				message: response.statusText || MESSAGES.VALIDATION.NETWORK_ERROR,
				status: response.status
			};
		}
	}

	private shouldRetry(status: number, retryCount: number): boolean {
		// 400번대 클라이언트 에러에서는 재시도하지 않음
		if (status >= 400 && status < 500) {
			return false;
		}
		// 500번대 서버 에러나 네트워크 에러(status 0)에서만 재시도
		return retryCount < this.maxRetries && (status >= 500 || status === 0);
	}

	private shouldRetryNetworkError(error: unknown, retryCount: number): boolean {
		return (
			retryCount < this.maxRetries &&
			(error instanceof TypeError || (error as Error & { name?: string }).name === 'NetworkError')
		);
	}

	protected createErrorFromResponse(errorData: ApiError, status: number): Error {
		// RFC 7807 Problem Details 형식을 우선적으로 처리
		if (errorData.type && errorData.title) {
			const backendError = parseBackendError(errorData);
			const error = new Error(backendError.message);
			(error as Error & { status?: number; code?: string; errorCode?: string }).status = status;
			(error as Error & { status?: number; code?: string; errorCode?: string }).code =
				errorData.code;
			(error as Error & { status?: number; code?: string; errorCode?: string }).errorCode =
				errorData.extensions?.error as string;
			return error;
		}

		// 기존 OAuth2 형식 (하위 호환성 유지)
		if (errorData.error) {
			const backendError = parseBackendError(errorData);
			const error = new Error(backendError.message);
			(error as Error & { status?: number; code?: string; errorCode?: string }).status = status;
			(error as Error & { status?: number; code?: string; errorCode?: string }).code =
				errorData.code;
			(error as Error & { status?: number; code?: string; errorCode?: string }).errorCode =
				errorData.error;
			return error;
		}

		// 기존 로직
		const message = errorData.message || errorData.error_description || `HTTP ${status}`;
		const error = new Error(message);
		(error as Error & { status?: number; code?: string }).status = status;
		(error as Error & { status?: number; code?: string }).code = errorData.code;
		return error;
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	protected getToken(): string | null {
		if (typeof window !== 'undefined') {
			let storageKey =
				this.currentTokenType === 'login' ? TOKEN_STORAGE_KEYS.LOGIN : TOKEN_STORAGE_KEYS.OAUTH2;
			let token = localStorage.getItem(storageKey);

			if (!token) {
				storageKey =
					this.currentTokenType === 'login' ? TOKEN_STORAGE_KEYS.OAUTH2 : TOKEN_STORAGE_KEYS.LOGIN;
				token = localStorage.getItem(storageKey);
			}

			return token;
		}
		return null;
	}

	protected setToken(token: string, tokenType?: TokenType): void {
		if (typeof window !== 'undefined') {
			const type = tokenType || this.currentTokenType;
			const storageKey = type === 'login' ? TOKEN_STORAGE_KEYS.LOGIN : TOKEN_STORAGE_KEYS.OAUTH2;
			localStorage.setItem(storageKey, token);
			setAuthTokenCookie(token);
		}
	}

	public getRefreshToken(): string | null {
		if (typeof window !== 'undefined') {
			// 토큰 타입에 따라 올바른 리프레시 토큰 키 사용
			const refreshKey =
				this.currentTokenType === 'login'
					? TOKEN_STORAGE_KEYS.REFRESH_LOGIN
					: TOKEN_STORAGE_KEYS.REFRESH_OAUTH2;
			let refreshToken = localStorage.getItem(refreshKey);

			// 대안 키에서도 확인 (호환성 유지)
			if (!refreshToken) {
				const altKey =
					this.currentTokenType === 'login'
						? TOKEN_STORAGE_KEYS.REFRESH_OAUTH2
						: TOKEN_STORAGE_KEYS.REFRESH_LOGIN;
				refreshToken = localStorage.getItem(altKey);
			}

			return refreshToken;
		}
		return null;
	}

	public getAccessToken(): string | null {
		// OAuth2 토큰의 경우 현재 토큰을 반환
		return this.getToken();
	}

	public getIdToken(): string | null {
		if (typeof window !== 'undefined') {
			return localStorage.getItem(APP_CONSTANTS.ID_TOKEN_STORAGE_KEY);
		}
		return null;
	}

	public getTokenExpiry(): Date | null {
		if (typeof window !== 'undefined') {
			const expiryStr = localStorage.getItem(APP_CONSTANTS.TOKEN_EXPIRY_STORAGE_KEY);
			return expiryStr ? new Date(expiryStr) : null;
		}
		return null;
	}

	protected setRefreshToken(refreshToken: string): void {
		if (typeof window !== 'undefined') {
			const refreshKey =
				this.currentTokenType === 'login'
					? TOKEN_STORAGE_KEYS.REFRESH_LOGIN
					: TOKEN_STORAGE_KEYS.REFRESH_OAUTH2;
			localStorage.setItem(refreshKey, refreshToken);
		}
	}

	protected removeRefreshToken(): void {
		if (typeof window !== 'undefined') {
			localStorage.removeItem(TOKEN_STORAGE_KEYS.REFRESH_LOGIN);
			localStorage.removeItem(TOKEN_STORAGE_KEYS.REFRESH_OAUTH2);
		}
	}

	protected removeToken(): void {
		if (typeof window !== 'undefined') {
			localStorage.removeItem(TOKEN_STORAGE_KEYS.LOGIN);
			localStorage.removeItem(TOKEN_STORAGE_KEYS.OAUTH2);
			deleteAuthTokenCookie();
		}
	}

	protected clearAllTokens(): void {
		this.removeToken();
		this.removeRefreshToken();
	}

	// 온라인 상태 감지 및 자동 세션 복원
	protected isOnline = true;
	protected reconnectTimer: number | NodeJS.Timeout | null = null;
	protected readonly RECONNECT_INTERVAL = 120000; // 120초로 더 늘림 (2분)
	protected isRefreshingToken = false; // 토큰 리프레시 중복 방지 플래그
	protected tokenRefreshPromise: Promise<void> | null = null; // 토큰 리프레시 Promise 캐싱
	protected lastTokenCheck = 0; // 마지막 토큰 체크 시간
	protected readonly TOKEN_CHECK_THROTTLE = 30000; // 30초마다 토큰 체크 (기존 빈도 줄임)

	protected startNetworkMonitoring() {
		if (typeof window === 'undefined') return;

		window.addEventListener('online', this.handleOnline.bind(this));
		window.addEventListener('offline', this.handleOffline.bind(this));
		this.scheduleReconnect();
	}

	protected stopNetworkMonitoring() {
		if (typeof window === 'undefined') return;

		window.removeEventListener('online', this.handleOnline.bind(this));
		window.removeEventListener('offline', this.handleOffline.bind(this));

		if (this.reconnectTimer) {
			window.clearInterval(this.reconnectTimer);
			this.reconnectTimer = null;
		}
	}

	private handleOnline() {
		this.isOnline = true;
		this.attemptSessionRecovery();
	}

	private handleOffline() {
		this.isOnline = false;
	}

	private scheduleReconnect() {
		if (this.reconnectTimer) return;

		this.reconnectTimer = window.setInterval(() => {
			if (!this.isOnline && navigator.onLine) {
				this.attemptSessionRecovery();
			}
		}, this.RECONNECT_INTERVAL);
	}

	private async attemptSessionRecovery() {
		try {
			const token = this.getToken();
			if (!token) {
				return;
			}

			// 토큰이 유효한지 로컬에서 먼저 확인
			const decoded = this.decodeToken(token);
			if (!decoded) {
				this.clearAllTokens();
				return;
			}

			const now = Math.floor(Date.now() / 1000);
			const expiresIn = decoded.exp - now;

			// 토큰이 이미 만료되었으면 세션 복구하지 않음
			if (expiresIn <= 0) {
				this.clearAllTokens();
				return;
			}

			// 토큰이 1분 이내에 만료될 예정이라면 갱신 시도
			if (expiresIn <= 60) {
				try {
					await this.attemptTokenRefresh();
				} catch {
					return;
				}
			}

			if (typeof window !== 'undefined' && 'dispatchEvent' in window) {
				window.dispatchEvent(new CustomEvent('session-recovered'));
			}
		} catch {
			this.clearAllTokens();
		}
	}

	protected async checkAndRefreshTokenIfNeeded(token: string): Promise<void> {
		// 최근에 토큰 체크를 했으면 스킵 (스로틀링)
		const now = Date.now();
		if (now - this.lastTokenCheck < this.TOKEN_CHECK_THROTTLE) {
			return;
		}
		this.lastTokenCheck = now;

		// 이미 토큰 리프레시 중인 경우 기존 Promise를 기다림
		if (this.tokenRefreshPromise) {
			await this.tokenRefreshPromise;
			return;
		}

		try {
			// Decode token to check expiry
			const decoded = this.decodeToken(token);
			if (!decoded) return;

			const currentTime = Math.floor(Date.now() / 1000);
			const expiresIn = decoded.exp - currentTime;

			// Refresh if token expires in less than 5 minutes (10분에서 5분으로 줄임)
			const REFRESH_THRESHOLD = 5 * 60; // 5 minutes

			if (expiresIn > 0 && expiresIn <= REFRESH_THRESHOLD) {
				// Promise 기반 토큰 리프레시 시작
				this.tokenRefreshPromise = this.attemptTokenRefresh();
				await this.tokenRefreshPromise;
			}
		} catch {
			// Don't throw - just continue with current token
		} finally {
			this.tokenRefreshPromise = null;
		}
	}

	protected decodeToken(token: string): { exp: number } | null {
		try {
			const payload = JSON.parse(atob(token.split('.')[1]));
			return { exp: payload.exp };
		} catch {
			return null;
		}
	}

	protected async attemptTokenRefresh(): Promise<void> {
		// 이미 리프레시 중인 경우 기존 Promise를 기다림
		if (this.tokenRefreshPromise && this.tokenRefreshPromise !== Promise.resolve()) {
			return this.tokenRefreshPromise;
		}

		const refreshToken = this.getRefreshToken();
		if (!refreshToken) {
			throw new Error('No refresh token available');
		}

		try {
			// 토큰 리프레시 시 재시도 비활성화 및 자동 리프레시 비활성화
			const result = await this.request<{
				accessToken: string;
				refreshToken?: string;
			}>(
				'/auth/refresh',
				{
					method: 'POST',
					body: JSON.stringify({ refreshToken })
				},
				0,
				{
					disableRetry: true,
					disableAutoRefresh: true
				}
			);

			// Update tokens
			this.setToken(result.accessToken);
			if (result.refreshToken) {
				this.setRefreshToken(result.refreshToken);
			}

			// Dispatch session recovered event
			if (typeof window !== 'undefined' && 'dispatchEvent' in window) {
				window.dispatchEvent(new CustomEvent('session-recovered'));
			}
		} catch (error) {
			// Clear all tokens on refresh failure
			this.clearAllTokens();
			throw error;
		}
	}

	protected async sensitiveRequest<T>(
		endpoint: string,
		options: RequestInit = {},
		tokenType?: TokenType
	): Promise<T> {
		// 임시로 토큰 타입 변경 (지정된 경우)
		const originalTokenType = this.currentTokenType;
		if (tokenType) {
			this.currentTokenType = tokenType;
		}

		try {
			return await this.request<T>(endpoint, options, 0, {
				skipAuthRedirect: true,
				disableRetry: true,
				disableAutoRefresh: false
			});
		} finally {
			// 토큰 타입 복원
			this.currentTokenType = originalTokenType;
		}
	}

	protected isNetworkOnline(): boolean {
		return this.isOnline && (typeof navigator === 'undefined' || navigator.onLine);
	}
}
