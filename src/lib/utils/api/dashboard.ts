import { BaseApi } from './base';

export class DashboardApi extends BaseApi {
	async getDashboardStats(): Promise<{
		totalClients: number;
		activeTokens: number;
		totalTokensIssued: number;
		expiredTokens: number;
		revokedTokens: number;
		lastLoginDate: string | null;
		accountCreated: string | null;
		tokenIssuanceByHour: Array<{ hour: string; count: number }>;
		tokenIssuanceByDay: Array<{ date: string; count: number }>;
		clientUsageStats: Array<{
			clientName: string;
			tokenCount: number;
			percentage: number;
		}>;
		scopeUsageStats: Array<{
			scope: string;
			count: number;
			percentage: number;
		}>;
		tokenExpirationRate: number;
		averageTokenLifetime: number;
		insights: {
			trends: string;
			recommendations: string;
			alerts: string;
		};
	}> {
		return this.request('/dashboard/stats');
	}

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
}
