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
			return localStorage.getItem(APP_CONSTANTS.TOKEN_STORAGE_KEY);
		}
		return null;
	}

	private setToken(token: string): void {
		if (typeof window !== 'undefined') {
			localStorage.setItem(APP_CONSTANTS.TOKEN_STORAGE_KEY, token);
			// OAuth2 플로우를 위해 쿠키에도 저장 (HttpOnly가 아닌 클라이언트 사이드 쿠키)
			// SameSite=Lax로 설정하여 크로스사이트 요청에서도 작동하도록 함
			document.cookie = `token=${token}; path=/; max-age=86400; samesite=lax`;
		}
	}

	private removeToken(): void {
		if (typeof window !== 'undefined') {
			localStorage.removeItem(APP_CONSTANTS.TOKEN_STORAGE_KEY);
			// 쿠키도 제거
			document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
		}
	}

	// 디버깅용 함수들
	debugToken(): void {
		if (typeof window !== 'undefined') {
			const token = this.getToken();
			console.log('Current token in localStorage:', token ? 'present' : 'missing');
			console.log('Current token value:', token);

			// JWT 토큰 디코딩 (서명 검증 없이)
			if (token) {
				try {
					const parts = token.split('.');
					if (parts.length === 3) {
						const payload = JSON.parse(atob(parts[1]));
						console.log('Token payload:', {
							sub: payload.sub,
							email: payload.email,
							iat: payload.iat,
							exp: payload.exp,
							issued: new Date(payload.iat * 1000).toISOString(),
							expires: new Date(payload.exp * 1000).toISOString(),
							isExpired: Date.now() / 1000 > payload.exp
						});
					}
				} catch (error) {
					console.log('Failed to decode token:', error);
				}
			}

			// 쿠키 확인
			const cookies = document.cookie.split(';').reduce(
				(acc, cookie) => {
					const [key, value] = cookie.trim().split('=');
					acc[key] = value;
					return acc;
				},
				{} as Record<string, string>
			);
			console.log('Current token in cookie:', cookies.token ? 'present' : 'missing');
			console.log('All cookies:', cookies);
		}
	}

	clearAllTokens(): void {
		console.log('Clearing all tokens...');
		this.removeToken();
		console.log('Tokens cleared');
	}

	// 토큰 재생성 (현재 사용자 정보로 새로운 토큰 발급)
	async refreshToken(): Promise<void> {
		try {
			console.log('Refreshing token...');
			const profile = await this.getProfile();
			console.log('Profile retrieved successfully, user:', profile.email);

			// 현재 사용자 정보가 있다면 토큰이 유효함
			console.log('Token is valid, no refresh needed');
		} catch (error) {
			console.log('Token refresh failed, clearing tokens:', error);
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
	async getDashboardStats() {
		try {
			const [clients, tokens, profile] = await Promise.all([
				this.getClients().catch(() => []),
				this.getUserTokens().catch(() => []),
				this.getProfile().catch(() => null)
			]);

			return {
				totalClients: Array.isArray(clients) ? clients.length : 0,
				activeTokens: Array.isArray(tokens) ? tokens.length : 0,
				lastLoginDate: profile?.updatedAt ? new Date(profile.updatedAt) : null,
				accountCreated: profile?.createdAt ? new Date(profile.createdAt) : null
			};
		} catch (error) {
			console.error('Failed to load dashboard stats:', error);
			return {
				totalClients: 0,
				activeTokens: 0,
				lastLoginDate: null,
				accountCreated: null
			};
		}
	}

	// 사용자 토큰 관리 API
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
}

export const apiClient = new ApiClient();
export default apiClient;
