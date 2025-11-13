// Re-export the refactored API client for backward compatibility
export { apiClient as default, apiClient } from './api/index';
export type {
	ApiError,
	CreateClientData,
	EmailQueueStats,
	EmailTestRequest,
	SMTPConnectionStatus,
	AuthorizeParams,
	AuthorizationInfo,
	ConsentRequest,
	ConsentResponse
} from './api/index';

// Legacy exports for backward compatibility
export { AuthApi } from './api/auth';
export { ClientsApi } from './api/clients';
export { SettingsApi } from './api/settings';
export { DashboardApi } from './api/dashboard';
export { UploadsApi } from './api/uploads';
export { OAuthApi } from './api/oauth';
export { EmailApi } from './api/email';
