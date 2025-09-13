import type { User, LoginData, CreateUserDto } from '$lib';
import { APP_CONSTANTS, API_ENDPOINTS, ROUTES, MESSAGES } from '$lib/constants/app.constants';

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

const API_BASE_URL = APP_CONSTANTS.API_BASE_URL;

class ApiClient {
	private baseURL: string;
	private maxRetries = APP_CONSTANTS.DEFAULT_RETRY_COUNT;
	private retryDelay = APP_CONSTANTS.DEFAULT_RETRY_DELAY;

	constructor(baseURL: string = API_BASE_URL) {
		this.baseURL = baseURL;
	}

	private async request<T>(
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
			console.error(`Network Error for ${url}:`, error); // 네트워크 에러 로깅

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
		console.error(`API Error [${status}]:`, message, errorData); // 상세한 에러 로깅

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
		}
	}

	private removeToken(): void {
		if (typeof window !== 'undefined') {
			localStorage.removeItem(APP_CONSTANTS.TOKEN_STORAGE_KEY);
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

	async updateProfile(data: Partial<User>): Promise<User> {
		return this.request<User>('/auth/profile', {
			method: 'PUT',
			body: JSON.stringify(data)
		});
	}

	logout(): void {
		this.removeToken();
	} // 디버깅용: 현재 토큰 상태 확인
	debugToken(): void {
		const token = this.getToken();
		console.log('Current token:', token ? `${token.substring(0, 20)}...` : 'No token');
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
