import { BaseApi } from './base';

export class OAuthApi extends BaseApi {
	async getAvailableScopes(): Promise<
		{
			id: string;
			name: string;
			description: string;
		}[]
	> {
		const response = await this.request<{
			scopes: { name: string; description: string; isDefault: boolean }[];
			meta: { total: number; cached: boolean; cacheSize: number };
		}>('/oauth2/scopes');

		return response.scopes.map((scope) => ({
			id: scope.name,
			name: scope.name.charAt(0).toUpperCase() + scope.name.slice(1).replace(/[_:]/g, ' '),
			description: scope.description
		}));
	}
}
