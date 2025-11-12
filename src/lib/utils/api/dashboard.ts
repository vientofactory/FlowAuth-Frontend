import { BaseApi } from './base';
import { API_ENDPOINTS } from '$lib/constants/app.constants';

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
		return this.request(API_ENDPOINTS.DASHBOARD.STATS);
	}

	async getRecentActivities(
		limit: number = 10,
		offset: number = 0
	): Promise<{
		activities: {
			id: number;
			type: string;
			description: string;
			createdAt: string | Date;
			resourceId?: number;
			metadata?: {
				clientName?: string;
				clientId?: number;
				scopes?: string[];
				reason?: string;
				activity?: string;
				location?: string;
				userId?: number;
				ipAddress?: string;
				userAgent?: string;
				severity?: string;
				details?: {
					scopes?: string[];
					expiresAt?: string;
					isActive?: boolean;
					isConfidential?: boolean;
					description?: string;
					createdAt?: string;
					updatedAt?: string;
					tokenId?: number;
				};
			};
		}[];
		total: number;
	}> {
		return this.request(`${API_ENDPOINTS.DASHBOARD.ACTIVITIES}?limit=${limit}&offset=${offset}`);
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
	}> {
		return this.request(API_ENDPOINTS.DASHBOARD.ANALYTICS.TOKEN);
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
		return this.request(API_ENDPOINTS.DASHBOARD.ANALYTICS.SECURITY);
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
		return this.request(API_ENDPOINTS.DASHBOARD.ANALYTICS.ADVANCED);
	}

	async getConnectedApps(): Promise<{
		apps: Array<{
			id: number;
			name: string;
			description?: string;
			logoUrl?: string;
			website?: string;
			status: 'active' | 'expired' | 'revoked';
			connectedAt: string | Date;
			lastUsedAt?: string | Date;
			expiresAt: string | Date;
			scopes: string[];
		}>;
		total: number;
	}> {
		return this.request(API_ENDPOINTS.DASHBOARD.CONNECTED_APPS);
	}

	async revokeConnectedApp(appId: number): Promise<{
		success: boolean;
		message: string;
	}> {
		return this.request(`${API_ENDPOINTS.DASHBOARD.CONNECTED_APPS}/${appId}`, {
			method: 'DELETE'
		});
	}
}
