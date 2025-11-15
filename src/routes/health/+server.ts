import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$lib/config/env';

export const GET: RequestHandler = async () => {
	const healthCheck = {
		status: 'ok',
		timestamp: new Date().toISOString(),
		service: 'FlowAuth Frontend',
		version: env.APP_VERSION,
		uptime: process.uptime(),
		memory: {
			used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
			total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
			rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
		},
		environment: {
			nodeEnv: process.env.NODE_ENV || 'development',
			apiBaseUrl: env.API_BASE_URL
		}
	};

	return json(healthCheck);
};
