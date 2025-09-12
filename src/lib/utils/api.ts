import type { User, LoginData, RegisterData } from '$lib';

export interface CreateClientData {
	name: string;
	description?: string;
	redirectUris: string[];
	grants: string[];
}

const API_BASE_URL = 'http://localhost:3000';

class ApiClient {
	private baseURL: string;

	constructor(baseURL: string = API_BASE_URL) {
		this.baseURL = baseURL;
	}

	private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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

			if (!response.ok) {
				const error = await response.json().catch(() => ({ message: 'Network error' }));
				throw new Error(error.message || `HTTP ${response.status}`);
			}

			return await response.json();
		} catch (error) {
			console.error('API request failed:', error);
			throw error;
		}
	}

	private getToken(): string | null {
		if (typeof window !== 'undefined') {
			return localStorage.getItem('auth_token');
		}
		return null;
	}

	private setToken(token: string): void {
		if (typeof window !== 'undefined') {
			localStorage.setItem('auth_token', token);
		}
	}

	private removeToken(): void {
		if (typeof window !== 'undefined') {
			localStorage.removeItem('auth_token');
		}
	}

	// 인증 관련 API
	async register(data: RegisterData): Promise<User> {
		return this.request<User>('/auth/register', {
			method: 'POST',
			body: JSON.stringify(data)
		});
	}

	async login(data: LoginData): Promise<{ user: User; accessToken: string }> {
		const result = await this.request<{ user: User; accessToken: string }>('/auth/login', {
			method: 'POST',
			body: JSON.stringify(data)
		});

		// 토큰 저장
		this.setToken(result.accessToken);

		return result;
	}

	async getProfile(): Promise<User> {
		return this.request<User>('/auth/profile');
	}

	async updateProfile(data: Partial<User>): Promise<User> {
		return this.request<User>('/auth/profile', {
			method: 'PUT',
			body: JSON.stringify(data)
		});
	}

	logout(): void {
		this.removeToken();
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
