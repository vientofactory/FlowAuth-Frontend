import type { User, LoginData, CreateUserDto } from '$lib';
import { API_ENDPOINTS, ROUTES } from '$lib/constants/app.constants';
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
import { BaseApi } from './base';
import type { TokenType } from '$lib/types/authorization.types';
import { parseBackendError } from '../error.utils';

export class AuthApi extends BaseApi {
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
				0,
				{ skipAuthRedirect: true }
			);

			this.setToken(result.accessToken, 'login');
			if (result.refreshToken) {
				this.setRefreshToken(result.refreshToken);
			}
			return result;
		} catch (error) {
			if (error instanceof Error && error.message.includes('2FA_REQUIRED')) {
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
			0,
			{ skipAuthRedirect: true }
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
			0,
			{ skipAuthRedirect: true }
		);

		this.setToken(result.accessToken);
		if (result.refreshToken) {
			this.setRefreshToken(result.refreshToken);
		}
		return result;
	}

	async getProfile(): Promise<User> {
		// 토큰이 없어도 세션 기반 인증(쿠키)으로 시도
		// BaseApi의 request 메서드에서 토큰이 있으면 Authorization 헤더를 자동으로 추가함
		return this.request<User>(API_ENDPOINTS.AUTH.PROFILE);
	}

	async updateProfile(data: {
		firstName?: string;
		lastName?: string;
		username?: string;
		bio?: string | undefined;
		website?: string | undefined;
		location?: string | undefined;
	}) {
		return this.request('/profile', {
			method: 'PUT',
			body: JSON.stringify(data)
		});
	}

	async checkUsername(username: string): Promise<{ available: boolean; message: string }> {
		return this.request(`/profile/check-username/${encodeURIComponent(username)}`);
	}

	async checkEmail(email: string): Promise<{ available: boolean; message: string }> {
		return this.request(`/auth/check-email/${encodeURIComponent(email)}`);
	}

	async checkUsernameForRegistration(
		username: string
	): Promise<{ available: boolean; message: string }> {
		return this.request(`/auth/check-username/${encodeURIComponent(username)}`);
	}

	async uploadAvatar(formData: FormData): Promise<{ avatarUrl: string; message: string }> {
		const config: RequestInit = {
			method: 'POST',
			body: formData,
			credentials: 'include'
		};

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
				throw new Error('Authentication required');
			}

			if (!response.ok) {
				const errorData = await this.parseAuthErrorResponse(response);
				throw this.createAuthErrorFromResponse(errorData, response.status);
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
		return this.sensitiveRequest('/profile/password', {
			method: 'PUT',
			body: JSON.stringify(data)
		});
	}

	logout(): Promise<{ message: string }> {
		return this.request('/auth/logout', {
			method: 'POST'
		});
	}

	// 계정 정보 새로고침
	async refreshAccount(): Promise<User> {
		try {
			const user = await this.getProfile();
			return user;
		} catch {
			try {
				await this.refreshJwtToken();
				return await this.getProfile();
			} catch {
				this.clearAllTokens();
				throw new Error('Session expired. Please login again.');
			}
		}
	}

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
			}>('/auth/refresh', {
				method: 'POST',
				body: JSON.stringify({ refreshToken })
			});

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

	// 사용자 토큰 관리
	async getUserTokens() {
		return this.request('/auth/tokens');
	}

	async revokeToken(tokenId: number, password?: string) {
		const body = password ? JSON.stringify({ password }) : undefined;
		return this.sensitiveRequest(`/auth/tokens/${tokenId}`, {
			method: 'DELETE',
			body
		});
	}

	async revokeAllTokens() {
		return this.sensitiveRequest('/auth/tokens', {
			method: 'DELETE'
		});
	}

	async revokeAllTokensForType(tokenType: string, password: string) {
		// tokenType에 따라 사용할 액세스 토큰 타입 결정
		const accessTokenType = tokenType === 'oauth2' ? 'oauth2' : 'login';
		return this.sensitiveRequest(
			`/auth/tokens/type/${tokenType}`,
			{
				method: 'DELETE',
				body: JSON.stringify({ password })
			},
			accessTokenType as TokenType
		);
	}

	// 2FA 관련
	async setupTwoFactor(): Promise<TwoFactorSetup> {
		return this.request<TwoFactorSetup>('/auth/2fa/setup', {
			method: 'POST'
		});
	}

	async enableTwoFactor(data: TwoFactorEnableRequest): Promise<TwoFactorResponse> {
		return this.sensitiveRequest('/auth/2fa/enable', {
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
		return this.sensitiveRequest('/auth/2fa/disable', {
			method: 'POST',
			body: JSON.stringify(data)
		});
	}

	async getTwoFactorStatus(): Promise<TwoFactorStatus> {
		return this.request<TwoFactorStatus>('/auth/2fa/status');
	}

	// 디버깅용 - 보안 경고
	debugToken(): void {
		if (typeof window !== 'undefined') {
			console.warn('🔒 보안 경고: 이 애플리케이션은 민감한 인증 정보를 보호합니다.');
			console.warn(
				'🚫 경고: 콘솔에 임의의 코드를 입력하지 마세요. 악의적인 공격자가 토큰을 탈취할 수 있습니다.'
			);
			console.warn('💡 개발자용: 토큰 정보는 보안상의 이유로 콘솔에 출력되지 않습니다.');
			console.warn(
				'🔍 디버깅이 필요한 경우 개발자 도구의 Application > Local Storage에서 확인하세요.'
			);

			// 토큰 존재 여부만 확인 (실제 토큰 값은 출력하지 않음)
			const hasToken = !!this.getToken();
			const hasRefreshToken = !!this.getRefreshToken();

			console.log(
				`토큰 상태: 액세스 토큰 ${hasToken ? '존재' : '없음'}, 리프레시 토큰 ${hasRefreshToken ? '존재' : '없음'}`
			);
		}
	}

	clearAllTokens(): void {
		this.removeToken();
		this.removeRefreshToken();
	}

	// Password reset methods
	async requestPasswordReset(email: string): Promise<{ message: string }> {
		return this.request<{ message: string }>('/auth/request-password-reset', {
			method: 'POST',
			body: JSON.stringify({ email })
		});
	}

	async validateResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
		return this.request<{ valid: boolean; email?: string }>(`/auth/validate-reset-token/${token}`);
	}

	async resetPassword(data: { token: string; newPassword: string }): Promise<{ message: string }> {
		return this.request<{ message: string }>('/auth/reset-password', {
			method: 'POST',
			body: JSON.stringify(data)
		});
	}

	// Email verification methods
	async verifyEmail(token: string): Promise<{ message: string; email?: string }> {
		return this.request<{ message: string; email?: string }>(`/auth/verify-email/${token}`);
	}

	async resendVerificationEmail(email: string): Promise<{ message: string }> {
		return this.request<{ message: string }>('/auth/resend-verification', {
			method: 'POST',
			body: JSON.stringify({ email })
		});
	}

	// Private helper methods for auth-specific error handling
	private async parseAuthErrorResponse(response: Response): Promise<{
		message?: string;
		status?: number;
		error_description?: string;
		// RFC 7807 Problem Details fields
		type?: string;
		title?: string;
		detail?: string;
		instance?: string;
		extensions?: Record<string, unknown>;
	}> {
		try {
			return await response.json();
		} catch {
			return {
				message: response.statusText || 'Network error',
				status: response.status
			};
		}
	}

	private createAuthErrorFromResponse(
		errorData: {
			message?: string;
			error_description?: string;
			// RFC 7807 Problem Details fields
			type?: string;
			title?: string;
			detail?: string;
			instance?: string;
			extensions?: Record<string, unknown>;
		},
		status: number
	): Error {
		// RFC 7807 Problem Details 형식을 우선적으로 처리
		if (errorData.type && errorData.title) {
			const backendError = parseBackendError(errorData);
			const error = new Error(backendError.message);
			(error as Error & { status?: number; code?: string; errorCode?: string }).status = status;
			(error as Error & { status?: number; code?: string; errorCode?: string }).code = errorData
				.extensions?.error as string;
			(error as Error & { status?: number; code?: string; errorCode?: string }).errorCode =
				errorData.extensions?.error as string;
			return error;
		}

		// 기존 OAuth2 형식 (하위 호환성 유지)
		const message = errorData.message || errorData.error_description || `HTTP ${status}`;
		const error = new Error(message);
		(error as Error & { status?: number }).status = status;
		return error;
	}
}
