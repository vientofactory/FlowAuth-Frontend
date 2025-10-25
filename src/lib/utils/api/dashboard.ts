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

	// 새로운 고급 분석 API 메소드들
	async getTokenAnalytics(): Promise<{
		usagePatterns: {
			peakHours: Array<{ hour: number; count: number; percentage: number }>;
			weeklyPatterns: Array<{ day: string; count: number; percentage: number }>;
			monthlyTrends: Array<{ month: string; count: number; growth: number }>;
		};
		clientPerformance: Array<{
			clientId: number;
			clientName: string;
			totalTokens: number;
			activeTokens: number;
			avgResponseTime: number;
			errorRate: number;
			lastActivity: string;
		}>;
		userActivity: {
			activeUsers: number;
			newUsers: number;
			returningUsers: number;
			sessionDuration: number;
			geographicDistribution: Array<{ country: string; count: number; percentage: number }>;
		};
		systemHealth: {
			cacheHitRate: number;
			dbConnectionPool: { active: number; idle: number; pending: number };
			apiResponseTime: number;
			errorRate: number;
			uptime: number;
		};
	}> {
		return this.request('/dashboard/analytics/token');
	}

	async getSecurityMetrics(): Promise<{
		alerts: {
			total: number;
			critical: number;
			high: number;
			medium: number;
			low: number;
			byType: Array<{ type: string; count: number; severity: string }>;
		};
		riskAnalysis: {
			overallRiskScore: number;
			riskFactors: Array<{ factor: string; score: number; impact: string }>;
			recommendations: string[];
		};
		threatDetection: {
			suspiciousActivities: number;
			blockedAttempts: number;
			geographicThreats: Array<{ country: string; threatLevel: string; incidents: number }>;
			timeBasedPatterns: Array<{ hour: number; threatCount: number }>;
		};
		trends: {
			alertTrend: Array<{ date: string; count: number; severity: string }>;
			riskTrend: Array<{ date: string; score: number }>;
			securityScore: number;
		};
	}> {
		return this.request('/dashboard/analytics/security');
	}

	async getAdvancedAnalytics(): Promise<{
		tokenLifecycle: {
			creationToExpiration: Array<{ stage: string; avgTime: number; percentage: number }>;
			revocationReasons: Array<{ reason: string; count: number; percentage: number }>;
			lifetimeDistribution: Array<{ range: string; count: number; percentage: number }>;
		};
		clientAnalytics: {
			topClients: Array<{
				clientId: number;
				clientName: string;
				metrics: { [key: string]: number };
			}>;
			clientHealth: Array<{ clientId: number; healthScore: number; issues: string[] }>;
			usageCorrelation: Array<{ clientA: string; clientB: string; correlation: number }>;
		};
		predictiveInsights: {
			tokenDemand: { predicted: number; confidence: number; trend: string };
			riskPrediction: { level: string; factors: string[]; mitigation: string[] };
			systemCapacity: { current: number; predicted: number; bottleneck: string };
		};
	}> {
		return this.request('/dashboard/analytics/advanced');
	}
}
