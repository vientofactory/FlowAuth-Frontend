import { APP_CONSTANTS, ROUTES, MESSAGES, API_ENDPOINTS } from '$lib/constants/app.constants';
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
		skipAuthRedirect = false
	): Promise<T> {
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
				// Check if token needs proactive refresh
				await this.checkAndRefreshTokenIfNeeded(token);

				config.headers = {
					...config.headers,
					Authorization: `Bearer ${this.getToken() || token}` // Use refreshed token if available
				};
			}

			const response = await fetch(url, config);

			// Handle token expiration - try automatic refresh first
			if (response.status === 401) {
				console.log('API Client: 401 error detected');

				// 로그인 시도인 경우 2FA가 필요한지 먼저 확인
				if (skipAuthRedirect) {
					try {
						const clonedResponse = response.clone();
						const errorData = await this.parseErrorResponse(clonedResponse);
						console.log('API Client: Parsed error data:', errorData);
						console.log('API Client: Error message:', errorData.message);
						console.log('API Client: Error status:', errorData.status);

						// 2FA가 필요한 경우 특별 처리
						if (errorData.error_description === '2FA_REQUIRED') {
							console.log('API Client: 2FA_REQUIRED detected in response');
							throw new Error('2FA_REQUIRED');
						}
					} catch (parseError) {
						if (parseError instanceof Error && parseError.message === '2FA_REQUIRED') {
							throw parseError;
						}
						console.log('API Client: Failed to parse error response for 2FA check:', parseError);
					}
				}

				// Try automatic token refresh if we have a refresh token and this isn't a login attempt
				if (!skipAuthRedirect && this.getRefreshToken()) {
					console.log('API Client: Attempting automatic token refresh');
					try {
						await this.attemptTokenRefresh();
						// Retry the original request with the new token
						console.log('API Client: Token refresh successful, retrying original request');
						return this.request<T>(endpoint, options, retryCount, skipAuthRedirect);
					} catch (refreshError) {
						console.log('API Client: Token refresh failed:', refreshError);
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
					console.log('API Client: Created error:', error.message);
					throw error;
				} else {
					throw new Error(MESSAGES.VALIDATION.AUTHENTICATION_REQUIRED);
				}
			}

			if (!response.ok) {
				const errorData = await this.parseErrorResponse(response);

				if (this.shouldRetry(response.status, retryCount)) {
					await this.delay(this.retryDelay * Math.pow(2, retryCount));
					return this.request<T>(endpoint, options, retryCount + 1, skipAuthRedirect);
				}

				throw this.createErrorFromResponse(errorData, response.status);
			}

			return await response.json();
		} catch (error) {
			if (this.shouldRetryNetworkError(error, retryCount)) {
				await this.delay(this.retryDelay * Math.pow(2, retryCount));
				return this.request<T>(endpoint, options, retryCount + 1, skipAuthRedirect);
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
				if (token) {
					console.log('ApiClient: Found token in alternative storage key:', storageKey);
				}
			}

			console.log('ApiClient: Getting token from localStorage:', !!token);
			return token;
		}
		console.log('ApiClient: Window not available, returning null');
		return null;
	}

	protected setToken(token: string, tokenType?: TokenType): void {
		if (typeof window !== 'undefined') {
			const type = tokenType || this.currentTokenType;
			const storageKey = type === 'login' ? TOKEN_STORAGE_KEYS.LOGIN : TOKEN_STORAGE_KEYS.OAUTH2;
			console.log('ApiClient: Setting token to localStorage for type:', type);
			localStorage.setItem(storageKey, token);
			setAuthTokenCookie(token);
			console.log('ApiClient: Token set successfully');
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
				if (refreshToken) {
					console.log('ApiClient: Found refresh token in alternative storage key:', altKey);
				}
			}

			console.log('ApiClient: Getting refresh token from localStorage:', !!refreshToken);
			return refreshToken;
		}
		console.log('ApiClient: Window not available, returning null');
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
			console.log(
				'ApiClient: Setting refresh token to localStorage for type:',
				this.currentTokenType
			);
			localStorage.setItem(refreshKey, refreshToken);
			console.log('ApiClient: Refresh token set successfully');
		}
	}

	protected removeRefreshToken(): void {
		if (typeof window !== 'undefined') {
			console.log('ApiClient: Removing refresh tokens from localStorage');
			localStorage.removeItem(TOKEN_STORAGE_KEYS.REFRESH_LOGIN);
			localStorage.removeItem(TOKEN_STORAGE_KEYS.REFRESH_OAUTH2);
			console.log('ApiClient: Refresh tokens removed successfully');
		}
	}

	protected removeToken(): void {
		if (typeof window !== 'undefined') {
			console.log('ApiClient: Removing tokens from localStorage');
			localStorage.removeItem(TOKEN_STORAGE_KEYS.LOGIN);
			localStorage.removeItem(TOKEN_STORAGE_KEYS.OAUTH2);
			deleteAuthTokenCookie();
			console.log('ApiClient: Tokens removed successfully');
		}
	}

	protected clearAllTokens(): void {
		this.removeToken();
		this.removeRefreshToken();
	}

	// 온라인 상태 감지 및 자동 세션 복원
	protected isOnline = true;
	protected reconnectTimer: number | NodeJS.Timeout | null = null;
	protected readonly RECONNECT_INTERVAL = 30000;

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
		console.log('[API] Network connection restored');
		this.isOnline = true;
		this.attemptSessionRecovery();
	}

	private handleOffline() {
		console.log('[API] Network connection lost');
		this.isOnline = false;
	}

	private scheduleReconnect() {
		if (this.reconnectTimer) return;

		this.reconnectTimer = window.setInterval(() => {
			if (!this.isOnline && navigator.onLine) {
				console.log('[API] Attempting to reconnect...');
				this.attemptSessionRecovery();
			}
		}, this.RECONNECT_INTERVAL);
	}

	private async attemptSessionRecovery() {
		try {
			const token = this.getToken();
			if (!token) {
				console.log('[API] No token found, skipping session recovery');
				return;
			}

			await this.request(API_ENDPOINTS.AUTH.ME, {}, 0, true);
			console.log('[API] Session recovered successfully');

			if (typeof window !== 'undefined' && 'dispatchEvent' in window) {
				window.dispatchEvent(new CustomEvent('session-recovered'));
			}
		} catch (error) {
			console.log('[API] Session recovery failed:', error);
			this.removeToken();
		}
	}

	protected async checkAndRefreshTokenIfNeeded(token: string): Promise<void> {
		try {
			// Decode token to check expiry
			const decoded = this.decodeToken(token);
			if (!decoded) return;

			const now = Math.floor(Date.now() / 1000);
			const expiresIn = decoded.exp - now;

			// Refresh if token expires in less than 5 minutes
			const REFRESH_THRESHOLD = 5 * 60; // 5 minutes

			if (expiresIn > 0 && expiresIn <= REFRESH_THRESHOLD) {
				console.log(
					`API Client: Token expires in ${expiresIn} seconds, attempting proactive refresh`
				);
				await this.attemptTokenRefresh();
			}
		} catch (error) {
			console.warn('API Client: Failed to check token expiry for proactive refresh:', error);
			// Don't throw - just continue with current token
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
		const refreshToken = this.getRefreshToken();
		if (!refreshToken) {
			throw new Error('No refresh token available');
		}

		try {
			console.log('API Client: Attempting token refresh with refresh token');
			const response = await fetch(`${this.baseURL}/auth/refresh`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include',
				body: JSON.stringify({ refreshToken })
			});

			if (!response.ok) {
				const errorData = await this.parseErrorResponse(response);
				throw this.createErrorFromResponse(errorData, response.status);
			}

			const result = await response.json();
			console.log('API Client: Token refresh successful');

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
			console.error('API Client: Token refresh failed:', error);
			// Clear all tokens on refresh failure
			this.clearAllTokens();
			throw error;
		}
	}

	protected isNetworkOnline(): boolean {
		return this.isOnline && (typeof navigator === 'undefined' || navigator.onLine);
	}
}
