import type { User, LoginData, CreateUserDto } from '$lib';
import { APP_CONSTANTS, API_ENDPOINTS, ROUTES, MESSAGES } from '$lib/constants/app.constants';
import { TOKEN_STORAGE_KEYS } from '$lib/constants/app.constants';
import { env } from '$lib/config/env';
import type { TokenType } from '$lib/types/authorization.types';
import type {
	TwoFactorSetup,
	TwoFactorStatus,
	TwoFactorEnableRequest,
	TwoFactorVerifyRequest,
	TwoFactorBackupCodeRequest,
	TwoFactorDisableRequest,
	TwoFactorResponse,
	TwoFactorVerifyResponse
} from '$lib/types/2fa.types';

export interface ApiError {
	message?: string;
	status?: number;
	code?: string;
	error?: string;
	error_description?: string;
	timestamp?: string;
	path?: string;
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
	recaptchaToken: string;
}

class ApiClient {
	private baseURL: string;
	private maxRetries = APP_CONSTANTS.DEFAULT_RETRY_COUNT;
	private retryDelay = APP_CONSTANTS.DEFAULT_RETRY_DELAY;
	private currentTokenType: TokenType = 'login'; // 기본값은 login

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
				console.log('API Client: 401 error detected');
				console.log('API Client: skipAuthRedirect =', skipAuthRedirect);

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
							// 2FA_REQUIRED 에러는 catch 밖으로 던져서 login 페이지에서 처리하도록 함
							throw new Error('2FA_REQUIRED');
						}
					} catch (parseError) {
						// 파싱 실패 시 일반적인 401 에러 처리로 진행
						if (parseError instanceof Error && parseError.message === '2FA_REQUIRED') {
							// 2FA_REQUIRED 에러는 다시 던짐
							throw parseError;
						}
						console.log('API Client: Failed to parse error response for 2FA check:', parseError);
					}
				}

				this.removeToken();

				// 로그인 엔드포인트에서는 자동 리다이렉트하지 않음
				if (!skipAuthRedirect && typeof window !== 'undefined') {
					window.location.href = ROUTES.LOGIN;
				}

				// 로그인 시도인 경우 원래 에러 메시지를 유지
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
		// 서버에서 보내는 실제 메시지를 우선 사용
		const message = errorData.message || errorData.error_description || `HTTP ${status}`;

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
			// 현재 토큰 타입 우선, 없으면 다른 타입 확인
			let storageKey =
				this.currentTokenType === 'login' ? TOKEN_STORAGE_KEYS.LOGIN : TOKEN_STORAGE_KEYS.OAUTH2;
			let token = localStorage.getItem(storageKey);

			if (!token) {
				// 다른 타입 확인
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

	private setToken(token: string, tokenType?: TokenType): void {
		if (typeof window !== 'undefined') {
			const type = tokenType || this.currentTokenType;
			const storageKey = type === 'login' ? TOKEN_STORAGE_KEYS.LOGIN : TOKEN_STORAGE_KEYS.OAUTH2;
			console.log('ApiClient: Setting token to localStorage for type:', type);
			localStorage.setItem(storageKey, token);
			// OAuth2 플로우를 위해 쿠키에도 저장 (HttpOnly가 아닌 클라이언트 사이드 쿠키)
			// SameSite=Lax로 설정하여 크로스사이트 요청에서도 작동하도록 함
			document.cookie = `token=${token}; path=/; max-age=86400; samesite=lax`;
			console.log('ApiClient: Token set successfully');
		}
	}

	private getRefreshToken(): string | null {
		if (typeof window !== 'undefined') {
			return localStorage.getItem(APP_CONSTANTS.REFRESH_TOKEN_STORAGE_KEY);
		}
		return null;
	}

	private setRefreshToken(refreshToken: string): void {
		if (typeof window !== 'undefined') {
			localStorage.setItem(APP_CONSTANTS.REFRESH_TOKEN_STORAGE_KEY, refreshToken);
		}
	}

	private removeRefreshToken(): void {
		if (typeof window !== 'undefined') {
			localStorage.removeItem(APP_CONSTANTS.REFRESH_TOKEN_STORAGE_KEY);
		}
	}

	private removeToken(): void {
		if (typeof window !== 'undefined') {
			console.log('ApiClient: Removing tokens from localStorage');
			localStorage.removeItem(TOKEN_STORAGE_KEYS.LOGIN);
			localStorage.removeItem(TOKEN_STORAGE_KEYS.OAUTH2);
			// 쿠키도 제거
			document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
			console.log('ApiClient: Tokens removed successfully');
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
		this.removeRefreshToken();
	}

	// 계정 정보 새로고침 (프로필 정보 및 인증 상태 확인)
	async refreshAccount(): Promise<User> {
		try {
			const user = await this.getProfile();
			return user;
		} catch (error) {
			console.error('Account refresh failed:', error);
			// 프로필 조회 실패 시 JWT 토큰 리프래시 시도
			try {
				await this.refreshJwtToken();
				// 리프래시 성공 후 다시 프로필 조회
				return await this.getProfile();
			} catch (refreshError) {
				console.error('JWT token refresh also failed:', refreshError);
				this.clearAllTokens();
				throw new Error('Session expired. Please login again.');
			}
		}
	}

	// JWT 토큰 리프래시 (일반 로그인용)
	async refreshJwtToken(): Promise<{ user: User; accessToken: string; refreshToken?: string }> {
		const refreshToken = this.getRefreshToken();
		if (!refreshToken) {
			this.clearAllTokens();
			throw new Error('No refresh token available. Please login again.');
		}

		try {
			const response = await this.request<{
				user: User;
				accessToken: string;
				refreshToken?: string;
			}>(API_ENDPOINTS.AUTH.REFRESH, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${this.getToken()}`
				}
			});

			// 새로운 토큰 저장
			this.setToken(response.accessToken);
			if (response.refreshToken) {
				this.setRefreshToken(response.refreshToken);
			}
			return response;
		} catch (error) {
			console.error('JWT token refresh failed:', error);
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

	async login(
		data: LoginData
	): Promise<{ user: User; accessToken: string; refreshToken?: string }> {
		try {
			const result = await this.request<{ user: User; accessToken: string; refreshToken?: string }>(
				API_ENDPOINTS.AUTH.LOGIN,
				{
					method: 'POST',
					body: JSON.stringify(data)
				},
				0, // retryCount
				true // skipAuthRedirect - 로그인 시에는 401 에러 시 자동 리다이렉트하지 않음
			);

			this.setToken(result.accessToken, 'login');
			if (result.refreshToken) {
				this.setRefreshToken(result.refreshToken);
			}
			return result;
		} catch (error) {
			console.log('API Client: Login error caught:', error);
			console.log('API Client: Error type:', typeof error);
			console.log('API Client: Error instanceof Error:', error instanceof Error);
			if (error instanceof Error) {
				console.log('API Client: Error message:', error.message);
				console.log('API Client: Error name:', error.name);
			}
			console.log('API Client: Full error object:', error);

			// 2FA가 필요한 경우 특별 처리
			if (error instanceof Error && error.message.includes('2FA_REQUIRED')) {
				console.log('API Client: 2FA_REQUIRED error detected:', error.message);
				throw new Error('2FA_REQUIRED');
			}
			throw error;
		}
	}

	async verifyTwoFactorLogin(
		email: string,
		token: string
	): Promise<{ user: User; accessToken: string; refreshToken?: string }> {
		const result = await this.request<{ user: User; accessToken: string; refreshToken?: string }>(
			'/auth/verify-2fa',
			{
				method: 'POST',
				body: JSON.stringify({ email, token })
			},
			0, // retryCount
			true // skipAuthRedirect
		);

		this.setToken(result.accessToken);
		if (result.refreshToken) {
			this.setRefreshToken(result.refreshToken);
		}
		return result;
	}

	async verifyBackupCodeLogin(
		email: string,
		backupCode: string
	): Promise<{ user: User; accessToken: string; refreshToken?: string }> {
		const result = await this.request<{ user: User; accessToken: string; refreshToken?: string }>(
			'/auth/verify-backup-code',
			{
				method: 'POST',
				body: JSON.stringify({ email, backupCode })
			},
			0, // retryCount
			true // skipAuthRedirect
		);

		this.setToken(result.accessToken);
		if (result.refreshToken) {
			this.setRefreshToken(result.refreshToken);
		}
		return result;
	}

	async getProfile(): Promise<User> {
		const token = this.getToken();
		if (!token) {
			throw new Error('No authentication token found');
		}
		return this.request<User>(API_ENDPOINTS.AUTH.PROFILE);
	}

	async updateProfile(data: { firstName?: string; lastName?: string; username?: string }) {
		return this.request('/profile', {
			method: 'PUT',
			body: JSON.stringify(data)
		});
	}

	async checkUsername(username: string): Promise<{ available: boolean; message: string }> {
		return this.request(`/profile/check-username/${encodeURIComponent(username)}`);
	}

	async uploadAvatar(formData: FormData): Promise<{ avatarUrl: string; message: string }> {
		const config: RequestInit = {
			method: 'POST',
			body: formData,
			credentials: 'include'
		};

		// JWT 토큰이 있으면 헤더에 추가 (FormData 사용 시 별도 처리)
		const token = this.getToken();
		if (token) {
			config.headers = {
				Authorization: `Bearer ${token}`
			};
		}

		const url = `${this.baseURL}/profile/avatar`;

		try {
			const response = await fetch(url, config);

			if (response.status === 401) {
				this.removeToken();
				if (typeof window !== 'undefined') {
					window.location.href = ROUTES.LOGIN;
				}
				throw new Error(MESSAGES.VALIDATION.AUTHENTICATION_REQUIRED);
			}

			if (!response.ok) {
				const errorData = await this.parseErrorResponse(response);
				throw this.createErrorFromResponse(errorData, response.status);
			}

			return await response.json();
		} catch (error) {
			if (
				error instanceof TypeError ||
				(error as Error & { name?: string }).name === 'NetworkError'
			) {
				throw new Error('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
			}
			throw error;
		}
	}

	async removeAvatar(): Promise<{ message: string }> {
		return this.request('/profile/avatar', {
			method: 'DELETE'
		});
	}

	async changePassword(data: { currentPassword: string; newPassword: string }) {
		return this.request('/profile/password', {
			method: 'PUT',
			body: JSON.stringify(data)
		});
	}

	logout(): Promise<{ message: string }> {
		return this.request('/auth/logout', {
			method: 'POST'
		});
	}

	// 대시보드 통계 API
	async getDashboardStats(): Promise<{
		totalClients: number;
		activeTokens: number;
		lastLoginDate: string | null;
		accountCreated: string | null;
	}> {
		return this.request('/dashboard/stats');
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

	async revokeAllTokensForType(tokenType: TokenType) {
		return this.request(`/auth/tokens/type/${tokenType}`, {
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

	async resetClientSecret(id: number) {
		return this.request(`/auth/clients/${id}/reset-secret`, {
			method: 'PUT'
		});
	}

	async removeClientLogo(id: number) {
		return this.request(`/auth/clients/${id}/logo`, {
			method: 'DELETE'
		});
	}

	// 로고 업로드 API
	async uploadLogo(file: File): Promise<{
		success: boolean;
		message: string;
		data: { filename: string; url: string; originalName: string; size: number; mimetype: string };
	}> {
		const formData = new FormData();
		formData.append('logo', file);

		const config: RequestInit = {
			method: 'POST',
			body: formData,
			credentials: 'include'
		};

		// JWT 토큰이 있으면 헤더에 추가 (FormData 사용 시 별도 처리)
		const token = this.getToken();
		if (token) {
			config.headers = {
				Authorization: `Bearer ${token}`
			};
		}

		const url = `${this.baseURL}/uploads/logo`;

		try {
			const response = await fetch(url, config);

			if (response.status === 401) {
				this.removeToken();
				if (typeof window !== 'undefined') {
					window.location.href = ROUTES.LOGIN;
				}
				throw new Error(MESSAGES.VALIDATION.AUTHENTICATION_REQUIRED);
			}

			if (!response.ok) {
				const errorData = await this.parseErrorResponse(response);
				throw this.createErrorFromResponse(errorData, response.status);
			}

			return await response.json();
		} catch (error) {
			if (
				error instanceof TypeError ||
				(error as Error & { name?: string }).name === 'NetworkError'
			) {
				throw new Error('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
			}
			throw error;
		}
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

	// 업로드 설정 정보 가져오기
	async getUploadConfig(type: string): Promise<{
		allowedMimes: readonly string[];
		maxSize: number;
		maxSizeMB: number;
		destination: string;
	}> {
		return this.request(`/uploads/config/${type}`);
	}

	// OAuth2 스코프 관련 API
	async getAvailableScopes(): Promise<
		{
			id: string;
			name: string;
			description: string;
		}[]
	> {
		const response = await this.request<{
			scopes: { name: string; description: string; isDefault: boolean }[];
			meta: { total: number; cached: boolean; cacheSize: number };
		}>('/oauth2/scopes');

		// 백엔드 응답에서 스코프 배열만 추출하고 프론트엔드 형식에 맞게 변환
		return response.scopes.map((scope) => ({
			id: scope.name,
			name: scope.name.charAt(0).toUpperCase() + scope.name.slice(1).replace(/[_:]/g, ' '),
			description: scope.description
		}));
	}

	// 설정 관련 API
	async getGeneralSettings(): Promise<{
		siteName: string;
		siteDescription: string;
		adminEmail: string;
		defaultTokenExpiry: number;
		defaultRefreshTokenExpiry: number;
	}> {
		return this.request('/settings/general');
	}

	async updateGeneralSettings(settings: {
		siteName: string;
		siteDescription: string;
		adminEmail: string;
		defaultTokenExpiry: number;
		defaultRefreshTokenExpiry: number;
	}): Promise<{
		siteName: string;
		siteDescription: string;
		adminEmail: string;
		defaultTokenExpiry: number;
		defaultRefreshTokenExpiry: number;
	}> {
		return this.request('/settings/general', {
			method: 'PUT',
			body: JSON.stringify(settings)
		});
	}

	async getSecuritySettings(): Promise<{
		enableTwoFactor: boolean;
		requireStrongPasswords: boolean;
		enableLoginNotifications: boolean;
		sessionTimeout: number;
		maxLoginAttempts: number;
		enableAuditLog: boolean;
	}> {
		return this.request('/settings/security');
	}

	async updateSecuritySettings(settings: {
		enableTwoFactor: boolean;
		requireStrongPasswords: boolean;
		enableLoginNotifications: boolean;
		sessionTimeout: number;
		maxLoginAttempts: number;
		enableAuditLog: boolean;
	}): Promise<{
		enableTwoFactor: boolean;
		requireStrongPasswords: boolean;
		enableLoginNotifications: boolean;
		sessionTimeout: number;
		maxLoginAttempts: number;
		enableAuditLog: boolean;
	}> {
		return this.request('/settings/security', {
			method: 'PUT',
			body: JSON.stringify(settings)
		});
	}

	async getNotificationSettings(): Promise<{
		emailNotifications: boolean;
		newClientNotifications: boolean;
		tokenExpiryNotifications: boolean;
		securityAlerts: boolean;
		systemUpdates: boolean;
	}> {
		return this.request('/settings/notifications');
	}

	async updateNotificationSettings(settings: {
		emailNotifications: boolean;
		newClientNotifications: boolean;
		tokenExpiryNotifications: boolean;
		securityAlerts: boolean;
		systemUpdates: boolean;
	}): Promise<{
		emailNotifications: boolean;
		newClientNotifications: boolean;
		tokenExpiryNotifications: boolean;
		securityAlerts: boolean;
		systemUpdates: boolean;
	}> {
		return this.request('/settings/notifications', {
			method: 'PUT',
			body: JSON.stringify(settings)
		});
	}

	// 대시보드 관련 API
	async getRecentActivities(limit: number = 10): Promise<
		{
			id: number;
			type: string;
			description: string;
			createdAt: string | Date;
			resourceId?: number;
			metadata?: { [key: string]: unknown };
		}[]
	> {
		return this.request(`/dashboard/activities?limit=${limit}`);
	}

	// 데이터 내보내기/가져오기 API
	async exportSettings(): Promise<{
		exportedAt: string;
		version: string;
		data: {
			general: {
				siteName: string;
				siteDescription: string;
				adminEmail: string;
				defaultTokenExpiry: number;
				defaultRefreshTokenExpiry: number;
			};
			security: {
				enableTwoFactor: boolean;
				requireStrongPasswords: boolean;
				enableLoginNotifications: boolean;
				sessionTimeout: number;
				maxLoginAttempts: number;
				enableAuditLog: boolean;
			};
			notification: {
				emailNotifications: boolean;
				newClientNotifications: boolean;
				tokenExpiryNotifications: boolean;
				securityAlerts: boolean;
				systemUpdates: boolean;
			};
		};
	}> {
		return this.request('/settings/export');
	}

	async importSettings(data: {
		general: {
			siteName: string;
			siteDescription: string;
			adminEmail: string;
			defaultTokenExpiry: number;
			defaultRefreshTokenExpiry: number;
		};
		security: {
			enableTwoFactor: boolean;
			requireStrongPasswords: boolean;
			enableLoginNotifications: boolean;
			sessionTimeout: number;
			maxLoginAttempts: number;
			enableAuditLog: boolean;
		};
		notification: {
			emailNotifications: boolean;
			newClientNotifications: boolean;
			tokenExpiryNotifications: boolean;
			securityAlerts: boolean;
			systemUpdates: boolean;
		};
	}): Promise<{
		importedAt: string;
		message: string;
		data: {
			general: {
				siteName: string;
				siteDescription: string;
				adminEmail: string;
				defaultTokenExpiry: number;
				defaultRefreshTokenExpiry: number;
			};
			security: {
				enableTwoFactor: boolean;
				requireStrongPasswords: boolean;
				enableLoginNotifications: boolean;
				sessionTimeout: number;
				maxLoginAttempts: number;
				enableAuditLog: boolean;
			};
			notification: {
				emailNotifications: boolean;
				newClientNotifications: boolean;
				tokenExpiryNotifications: boolean;
				securityAlerts: boolean;
				systemUpdates: boolean;
			};
		};
	}> {
		return this.request('/settings/import', {
			method: 'POST',
			body: JSON.stringify(data)
		});
	}

	// 2FA 관련 API
	async setupTwoFactor(): Promise<TwoFactorSetup> {
		return this.request<TwoFactorSetup>('/auth/2fa/setup', {
			method: 'POST'
		});
	}

	async enableTwoFactor(data: TwoFactorEnableRequest): Promise<TwoFactorResponse> {
		return this.request<TwoFactorResponse>('/auth/2fa/enable', {
			method: 'POST',
			body: JSON.stringify(data)
		});
	}

	async verifyTwoFactor(data: TwoFactorVerifyRequest): Promise<TwoFactorVerifyResponse> {
		return this.request<TwoFactorVerifyResponse>('/auth/2fa/verify', {
			method: 'POST',
			body: JSON.stringify(data)
		});
	}

	async verifyTwoFactorBackupCode(
		data: TwoFactorBackupCodeRequest
	): Promise<TwoFactorVerifyResponse> {
		return this.request<TwoFactorVerifyResponse>('/auth/2fa/verify-backup', {
			method: 'POST',
			body: JSON.stringify(data)
		});
	}

	async disableTwoFactor(data: TwoFactorDisableRequest): Promise<TwoFactorResponse> {
		return this.request<TwoFactorResponse>('/auth/2fa/disable', {
			method: 'DELETE',
			body: JSON.stringify(data)
		});
	}

	async getTwoFactorStatus(): Promise<TwoFactorStatus> {
		return this.request<TwoFactorStatus>('/auth/2fa/status');
	}
}

export const apiClient = new ApiClient();
export default apiClient;
