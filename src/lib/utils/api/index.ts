import { BaseApi } from './base';
import { AuthApi } from './auth';
import { ClientsApi, type CreateClientData } from './clients';
import { SettingsApi } from './settings';
import { DashboardApi } from './dashboard';
import { UploadsApi } from './uploads';
import { OAuthApi } from './oauth';
import type { ApiError } from './base';
import type { User, LoginData, CreateUserDto } from '$lib';
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

class ApiClient extends BaseApi {
	public readonly auth: AuthApi;
	public readonly clients: ClientsApi;
	public readonly settings: SettingsApi;
	public readonly dashboard: DashboardApi;
	public readonly uploads: UploadsApi;
	public readonly oauth: OAuthApi;

	constructor(baseURL?: string) {
		super(baseURL);
		this.auth = new AuthApi(baseURL);
		this.clients = new ClientsApi(baseURL);
		this.settings = new SettingsApi(baseURL);
		this.dashboard = new DashboardApi(baseURL);
		this.uploads = new UploadsApi(baseURL);
		this.oauth = new OAuthApi(baseURL);
	}

	// Backward compatibility methods - delegate to respective APIs
	// Auth methods
	async register(data: CreateUserDto): Promise<User> {
		return this.auth.register(data);
	}

	async login(
		data: LoginData
	): Promise<{ user: User; accessToken: string; refreshToken?: string }> {
		return this.auth.login(data);
	}

	async verifyTwoFactorLogin(
		email: string,
		token: string
	): Promise<{ user: User; accessToken: string; refreshToken?: string }> {
		return this.auth.verifyTwoFactorLogin(email, token);
	}

	async verifyBackupCodeLogin(
		email: string,
		backupCode: string
	): Promise<{ user: User; accessToken: string; refreshToken?: string }> {
		return this.auth.verifyBackupCodeLogin(email, backupCode);
	}

	async getProfile(): Promise<User> {
		return this.auth.getProfile();
	}

	async updateProfile(data: { firstName?: string; lastName?: string; username?: string }) {
		return this.auth.updateProfile(data);
	}

	async checkUsername(username: string): Promise<{ available: boolean; message: string }> {
		return this.auth.checkUsername(username);
	}

	async checkEmail(email: string): Promise<{ available: boolean; message: string }> {
		return this.auth.checkEmail(email);
	}

	async checkUsernameForRegistration(
		username: string
	): Promise<{ available: boolean; message: string }> {
		return this.auth.checkUsernameForRegistration(username);
	}

	async uploadAvatar(formData: FormData): Promise<{ avatarUrl: string; message: string }> {
		return this.auth.uploadAvatar(formData);
	}

	async removeAvatar(): Promise<{ message: string }> {
		return this.auth.removeAvatar();
	}

	async changePassword(data: { currentPassword: string; newPassword: string }) {
		return this.auth.changePassword(data);
	}

	async refreshAccount(): Promise<User> {
		return this.auth.refreshAccount();
	}

	async refreshJwtToken(): Promise<{ user: User; accessToken: string; refreshToken?: string }> {
		return this.auth.refreshJwtToken();
	}

	async getUserTokens() {
		return this.auth.getUserTokens();
	}

	async revokeToken(tokenId: number) {
		return this.auth.revokeToken(tokenId);
	}

	async revokeAllTokens() {
		return this.auth.revokeAllTokens();
	}

	async revokeAllTokensForType(tokenType: string) {
		return this.auth.revokeAllTokensForType(tokenType);
	}

	async setupTwoFactor(): Promise<TwoFactorSetup> {
		return this.auth.setupTwoFactor();
	}

	async enableTwoFactor(data: TwoFactorEnableRequest): Promise<TwoFactorResponse> {
		return this.auth.enableTwoFactor(data);
	}

	async verifyTwoFactor(data: TwoFactorVerifyRequest): Promise<TwoFactorVerifyResponse> {
		return this.auth.verifyTwoFactor(data);
	}

	async verifyTwoFactorBackupCode(
		data: TwoFactorBackupCodeRequest
	): Promise<TwoFactorVerifyResponse> {
		return this.auth.verifyTwoFactorBackupCode(data);
	}

	async disableTwoFactor(data: TwoFactorDisableRequest): Promise<TwoFactorResponse> {
		return this.auth.disableTwoFactor(data);
	}

	async getTwoFactorStatus(): Promise<TwoFactorStatus> {
		return this.auth.getTwoFactorStatus();
	}

	// Clients methods
	async getClients() {
		return this.clients.getClients();
	}

	async createClient(data: CreateClientData) {
		return this.clients.createClient(data);
	}

	async getClient(id: number) {
		return this.clients.getClient(id);
	}

	async updateClient(id: number, data: Partial<CreateClientData>) {
		return this.clients.updateClient(id, data);
	}

	async updateClientStatus(id: number, isActive: boolean) {
		return this.clients.updateClientStatus(id, isActive);
	}

	async deleteClient(id: number) {
		return this.clients.deleteClient(id);
	}

	async resetClientSecret(id: number) {
		return this.clients.resetClientSecret(id);
	}

	async removeClientLogo(id: number) {
		return this.clients.removeClientLogo(id);
	}

	// Settings methods
	async getGeneralSettings(): Promise<{
		siteName: string;
		siteDescription: string;
		adminEmail: string;
		defaultTokenExpiry: number;
		defaultRefreshTokenExpiry: number;
	}> {
		return this.settings.getGeneralSettings();
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
		return this.settings.updateGeneralSettings(settings);
	}

	async getSecuritySettings(): Promise<{
		enableTwoFactor: boolean;
		requireStrongPasswords: boolean;
		enableLoginNotifications: boolean;
		sessionTimeout: number;
		maxLoginAttempts: number;
		enableAuditLog: boolean;
	}> {
		return this.settings.getSecuritySettings();
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
		return this.settings.updateSecuritySettings(settings);
	}

	async getNotificationSettings(): Promise<{
		emailNotifications: boolean;
		newClientNotifications: boolean;
		tokenExpiryNotifications: boolean;
		securityAlerts: boolean;
		systemUpdates: boolean;
	}> {
		return this.settings.getNotificationSettings();
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
		return this.settings.updateNotificationSettings(settings);
	}

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
		return this.settings.exportSettings();
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
		return this.settings.importSettings(data);
	}

	// Dashboard methods
	async getDashboardStats() {
		return this.dashboard.getDashboardStats();
	}

	async getRecentActivities(limit: number = 10) {
		return this.dashboard.getRecentActivities(limit);
	}

	async getTokenAnalytics() {
		return this.dashboard.getTokenAnalytics();
	}

	async getSecurityMetrics() {
		return this.dashboard.getSecurityMetrics();
	}

	async getAdvancedAnalytics() {
		return this.dashboard.getAdvancedAnalytics();
	}

	// Uploads methods
	async uploadLogo(file: File) {
		return this.uploads.uploadLogo(file);
	}

	async getUploadConfig(type: string) {
		return this.uploads.getUploadConfig(type);
	}

	// OAuth methods
	async getAvailableScopes() {
		return this.oauth.getAvailableScopes();
	}

	// Base methods (make protected methods public for backward compatibility)
	async request<T>(
		endpoint: string,
		options: RequestInit = {},
		retryCount = 0,
		skipAuthRedirect = false
	): Promise<T> {
		return super.request<T>(endpoint, options, retryCount, skipAuthRedirect);
	}

	async logout(): Promise<{ message: string }> {
		return this.request('/auth/logout', {
			method: 'POST'
		});
	}

	debugToken(): void {
		if (typeof window !== 'undefined') {
			const token = this.getToken();
			if (token) {
				try {
					const parts = token.split('.');
					if (parts.length === 3) {
						JSON.parse(atob(parts[1]));
					}
				} catch {
					// Failed to decode token
				}
			}
		}
	}

	clearAllTokens(): void {
		super.clearAllTokens();
	}

	startNetworkMonitoring() {
		super.startNetworkMonitoring();
	}

	stopNetworkMonitoring() {
		super.stopNetworkMonitoring();
	}

	isNetworkOnline(): boolean {
		return super.isNetworkOnline();
	}
}

export const apiClient = new ApiClient();
export default apiClient;

// Re-export types for backward compatibility
export type { ApiError, CreateClientData };
