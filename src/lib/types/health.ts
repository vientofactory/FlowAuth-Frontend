export interface HealthCheckResponse {
	status: string;
	timestamp: string;
	service: string;
	version: string;
	uptime: number;
	memory: {
		used: number;
		total: number;
		rss: number;
	};
	environment: {
		nodeEnv: string;
		apiBaseUrl: string;
	};
}

export interface HealthIndicatorResult {
	status: 'up' | 'down';
	message?: string;
	[key: string]: unknown;
}

export interface BackendHealthResponse {
	status: 'ok' | 'error' | 'shutting_down';
	info: Record<string, HealthIndicatorResult>;
	error?: Record<string, HealthIndicatorResult>;
	details: Record<string, HealthIndicatorResult>;
}
