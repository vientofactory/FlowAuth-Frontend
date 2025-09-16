import type { User, LoginData, CreateUserDto } from '$lib';
import { APP_CONSTANTS, API_ENDPOINTS, ROUTES, MESSAGES } from '$lib/constants/app.constants';
import { env } from '$lib/config/env';

export interface ApiError {
	message: string;
	status?: number;
	code?: string;
}

export interface CreateClientData {
	name: string;
	description?: string;
	redirectUris: string[];
	grants: string[];
	scopes?: string[];
	logoUri?: string;
	termsOfServiceUri?: string;
	policyUri?: string;
}

class ApiClient {
	private baseURL: string;
	private maxRetries = APP_CONSTANTS.DEFAULT_RETRY_COUNT;
	private retryDelay = APP_CONSTANTS.DEFAULT_RETRY_DELAY;

	constructor(baseURL: string = env.API_BASE_URL) {
		this.baseURL = baseURL;
	}

	async request<T>(
		endpoint: string,
		options: RequestInit = {},
		retryCount = 0,
		skipAuthRedirect = false
	): Promise<T> {
		const url = `${this.baseURL}${endpoint}`;

		const config: RequestInit = {
			headers: {
				'Content-Type': 'application/json',
				...options.headers
			},
			credentials: 'include', // 쿠키 포함
			...options
		};

		// JWT 토큰이 있으면 헤더에 추가
		const token = this.getToken();
		if (token) {
			config.headers = {
				...config.headers,
				Authorization: `Bearer ${token}`
			};
		}

		try {
			const response = await fetch(url, config);

			// Handle token expiration
			if (response.status === 401) {
				this.removeToken();

				// 로그인 엔드포인트에서는 자동 리다이렉트하지 않음
				if (!skipAuthRedirect && typeof window !== 'undefined') {
					window.location.href = ROUTES.LOGIN;
				}

				// 로그인 시도인 경우 더 적절한 에러 메시지 제공
				const errorMessage = skipAuthRedirect
					? MESSAGES.VALIDATION.LOGIN_FAILED
					: MESSAGES.VALIDATION.AUTHENTICATION_REQUIRED;

				throw new Error(errorMessage);
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

			// 네트워크 에러에 대한 사용자 친화적 메시지
			if (
				error instanceof TypeError ||
				(error as Error & { name?: string }).name === 'NetworkError'
			) {
				throw new Error('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
			}

			throw error;
		}
	}

	private async parseErrorResponse(response: Response): Promise<ApiError> {
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

	private createErrorFromResponse(errorData: ApiError, status: number): Error {
		const message = errorData.message || `HTTP ${status}`;

		const error = new Error(message);
		(error as Error & { status?: number; code?: string }).status = status;
		(error as Error & { status?: number; code?: string }).code = errorData.code;
		return error;
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	private getToken(): string | null {
		if (typeof window !== 'undefined') {
			const token = localStorage.getItem(APP_CONSTANTS.TOKEN_STORAGE_KEY);
			console.log('ApiClient: Getting token from localStorage:', !!token);
			return token;
		}
		console.log('ApiClient: Window not available, returning null');
		return null;
	}

	private setToken(token: string): void {
		if (typeof window !== 'undefined') {
			console.log('ApiClient: Setting token to localStorage');
			localStorage.setItem(APP_CONSTANTS.TOKEN_STORAGE_KEY, token);
			// OAuth2 플로우를 위해 쿠키에도 저장 (HttpOnly가 아닌 클라이언트 사이드 쿠키)
			// SameSite=Lax로 설정하여 크로스사이트 요청에서도 작동하도록 함
			document.cookie = `token=${token}; path=/; max-age=86400; samesite=lax`;
			console.log('ApiClient: Token set successfully');
		}
	}

	private removeToken(): void {
		if (typeof window !== 'undefined') {
			console.log('ApiClient: Removing token from localStorage');
			localStorage.removeItem(APP_CONSTANTS.TOKEN_STORAGE_KEY);
			// 쿠키도 제거
			document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
			console.log('ApiClient: Token removed successfully');
		}
	}

	// 디버깅용 함수들
	debugToken(): void {
		if (typeof window !== 'undefined') {
			const token = this.getToken();

			// JWT 토큰 디코딩 (서명 검증 없이)
			if (token) {
				try {
					const parts = token.split('.');
					if (parts.length === 3) {
						// Token information available for debugging if needed
						JSON.parse(atob(parts[1]));
					}
				} catch {
					// Failed to decode token
				}
			}

			// 쿠키 확인
			document.cookie.split(';').reduce(
				(acc, cookie) => {
					const [key, value] = cookie.trim().split('=');
					acc[key] = value;
					return acc;
				},
				{} as Record<string, string>
			);
		}
	}

	clearAllTokens(): void {
		this.removeToken();
	}

	// 토큰 재생성 (현재 사용자 정보로 새로운 토큰 발급)
	async refreshToken(): Promise<void> {
		try {
			await this.getProfile();
			// Token is valid, no refresh needed
		} catch {
			this.clearAllTokens();
			throw new Error('Token refresh failed. Please login again.');
		}
	}

	// 인증 관련 API
	async register(data: CreateUserDto): Promise<User> {
		return this.request<User>('/auth/register', {
			method: 'POST',
			body: JSON.stringify(data)
		});
	}

	async login(data: LoginData): Promise<{ user: User; accessToken: string }> {
		const result = await this.request<{ user: User; accessToken: string }>(
			API_ENDPOINTS.AUTH.LOGIN,
			{
				method: 'POST',
				body: JSON.stringify(data)
			},
			0, // retryCount
			true // skipAuthRedirect - 로그인 시에는 401 에러 시 자동 리다이렉트하지 않음
		);

		this.setToken(result.accessToken);
		return result;
	}

	async getProfile(): Promise<User> {
		const token = this.getToken();
		if (!token) {
			throw new Error('No authentication token found');
		}
		return this.request<User>(API_ENDPOINTS.AUTH.PROFILE);
	}

	async updateProfile(data: { firstName?: string; lastName?: string }) {
		return this.request('/auth/profile', {
			method: 'PUT',
			body: JSON.stringify(data)
		});
	}

	async changePassword(data: { currentPassword: string; newPassword: string }) {
		return this.request('/auth/profile/password', {
			method: 'PATCH',
			body: JSON.stringify(data)
		});
	}

	logout(): void {
		this.removeToken();
	}

	// 대시보드 통계 API
	async getDashboardStats(): Promise<{
		totalClients: number;
		activeTokens: number;
		lastLoginDate: string | null;
		accountCreated: string | null;
	}> {
		return this.request('/oauth2/dashboard/stats');
	} // 사용자 토큰 관리 API
	async getUserTokens() {
		return this.request('/auth/tokens');
	}

	async revokeToken(tokenId: number) {
		return this.request(`/auth/tokens/${tokenId}`, {
			method: 'DELETE'
		});
	}

	async revokeAllTokens() {
		return this.request('/auth/tokens', {
			method: 'DELETE'
		});
	}

	// 클라이언트 관리 API
	async getClients() {
		return this.request('/auth/clients');
	}

	async createClient(data: CreateClientData) {
		return this.request('/auth/clients', {
			method: 'POST',
			body: JSON.stringify(data)
		});
	}

	async getClient(id: number) {
		return this.request(`/auth/clients/${id}`);
	}

	async updateClient(id: number, data: Partial<CreateClientData>) {
		return this.request(`/auth/clients/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(data)
		});
	}

	async updateClientStatus(id: number, isActive: boolean) {
		return this.request(`/auth/clients/${id}/status`, {
			method: 'PATCH',
			body: JSON.stringify({ isActive })
		});
	}

	async deleteClient(id: number) {
		return this.request(`/auth/clients/${id}`, {
			method: 'DELETE'
		});
	}

	// 온라인 상태 감지 및 자동 세션 복원
	private isOnline = true;
	private reconnectTimer: number | null = null;
	private readonly RECONNECT_INTERVAL = 30000; // 30초마다 재연결 시도

	// 온라인 상태 모니터링 시작
	startNetworkMonitoring() {
		if (typeof window === 'undefined') return;

		// 온라인/오프라인 이벤트 리스너 등록
		window.addEventListener('online', this.handleOnline.bind(this));
		window.addEventListener('offline', this.handleOffline.bind(this));

		// 주기적 연결 상태 확인
		this.scheduleReconnect();
	}

	// 온라인 상태 모니터링 중지
	stopNetworkMonitoring() {
		if (typeof window === 'undefined') return;

		window.removeEventListener('online', this.handleOnline.bind(this));
		window.removeEventListener('offline', this.handleOffline.bind(this));

		if (this.reconnectTimer) {
			clearInterval(this.reconnectTimer);
			this.reconnectTimer = null;
		}
	}

	private handleOnline() {
		console.log('[API] Network connection restored');
		this.isOnline = true;

		// 네트워크 복구 시 세션 검증 및 복원 시도
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

	// 세션 복원 시도
	private async attemptSessionRecovery() {
		try {
			const token = this.getToken();
			if (!token) {
				console.log('[API] No token found, skipping session recovery');
				return;
			}

			// 간단한 API 호출로 세션 검증
			await this.request('/auth/me', {}, 0, true);
			console.log('[API] Session recovered successfully');

			// 세션 복원 성공 시 사용자에게 알림 (옵션)
			if (typeof window !== 'undefined' && 'dispatchEvent' in window) {
				window.dispatchEvent(new CustomEvent('session-recovered'));
			}
		} catch (error) {
			console.log('[API] Session recovery failed:', error);
			// 세션 복원 실패 시 토큰 제거
			this.removeToken();
		}
	}

	// 현재 온라인 상태 확인
	isNetworkOnline(): boolean {
		return this.isOnline && (typeof navigator === 'undefined' || navigator.onLine);
	}
}

export const apiClient = new ApiClient();
export default apiClient;
