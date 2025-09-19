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
	lastLoginDate?: Date;
	accountCreated?: Date;
}

export interface RecentActivity {
	id: number;
	type: string;
	description: string;
	createdAt: Date;
	resourceId?: number;
	metadata?: Record<string, unknown>;
}
