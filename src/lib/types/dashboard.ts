// 대시보드 관련 타입 정의
export interface ConnectedAppDto {
	id: number;
	name: string;
	description?: string;
	logoUrl?: string;
	scopes: string[];
	connectedAt: Date;
	lastUsedAt?: Date;
	expiresAt: Date;
	status: 'active' | 'expired' | 'revoked';
}

export interface ConnectedAppsResponse {
	apps: ConnectedAppDto[];
	total: number;
}

export interface RevokeConnectionResponse {
	success: boolean;
	revokedTokensCount: number;
	message: string;
}

export interface DashboardStats {
	totalClients: number;
	activeTokens: number;
	totalTokensIssued: number;
	expiredTokens: number;
	revokedTokens: number;
	tokenExpirationRate: number;
	lastLoginDate?: Date;
	accountCreated?: Date;
	tokenIssuanceByHour: Array<{ hour: string; count: number }>;
	tokenIssuanceByDay: Array<{ date: string; count: number }>;
	clientUsageStats: Array<{
		clientName: string;
		tokenCount: number;
		percentage: number;
	}>;
	insights: {
		trends: string;
		recommendations: string;
		alerts: string;
	};
}

export interface RecentActivity {
	id: number;
	type: string;
	description: string;
	createdAt: Date;
	resourceId?: number;
	metadata?: Record<string, unknown>;
}

export interface SecurityMetrics {
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
		timeBasedPatterns: Array<{ hour: number; threatCount: number }>;
	};
}

export interface TokenAnalytics {
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
}

export interface AdvancedAnalytics {
	tokenLifecycle: {
		creationToExpiration: unknown[];
		revocationReasons: unknown[];
		lifetimeDistribution: unknown[];
	};
	clientAnalytics: {
		topClients: unknown[];
		clientHealth: unknown[];
		usageCorrelation: unknown[];
	};
	predictiveInsights: {
		tokenDemand: { predicted: number; confidence: number; trend: string };
		riskPrediction: { level: string; factors: string[]; mitigation: string[] };
		systemCapacity: { current: number; predicted: number; bottleneck: string };
	};
}
