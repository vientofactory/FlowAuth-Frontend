import { BaseApi } from './base';

export class SettingsApi extends BaseApi {
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
}
