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

	async getUserInfo(accessToken: string): Promise<{
		sub: string;
		name?: string;
		given_name?: string;
		family_name?: string;
		preferred_username?: string;
		profile?: string;
		picture?: string;
		email?: string;
		email_verified?: boolean;
		locale?: string;
		updated_at?: number;
		roles?: string[];
		[key: string]: unknown;
	}> {
		return this.request('/oauth2/userinfo', {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${accessToken}`
			}
		});
	}

	async exchangeToken(data: {
		grant_type: string;
		client_id: string;
		client_secret: string;
		code: string;
		redirect_uri: string;
		code_verifier?: string;
	}): Promise<{
		access_token: string;
		token_type: string;
		expires_in?: number;
		refresh_token?: string;
		scope?: string;
		id_token?: string;
	}> {
		const params = new URLSearchParams();
		params.append('grant_type', data.grant_type);
		params.append('client_id', data.client_id);
		params.append('client_secret', data.client_secret);
		params.append('code', data.code);
		params.append('redirect_uri', data.redirect_uri);

		if (data.code_verifier) {
			params.append('code_verifier', data.code_verifier);
		}

		return this.request('/oauth2/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: params.toString()
		});
	}
}
