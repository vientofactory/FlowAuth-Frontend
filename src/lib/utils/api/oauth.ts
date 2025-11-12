import { BaseApi } from './base';
import { API_ENDPOINTS } from '$lib/constants/app.constants';
import type { Client } from '$lib/types/oauth.types';

export interface AuthorizeParams {
	client_id: string;
	redirect_uri: string;
	response_type: string;
	scope?: string;
	state?: string;
	code_challenge?: string;
	code_challenge_method?: string;
	nonce?: string;
}

export interface AuthorizationInfo {
	client: Client;
	scopes: string[];
}

export interface ConsentRequest extends AuthorizeParams {
	approved: boolean;
}

export interface ConsentResponse {
	redirect_url: string;
}

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
		}>(API_ENDPOINTS.OAUTH2.SCOPES);

		return response.scopes.map((scope) => ({
			id: scope.name,
			name: scope.name.charAt(0).toUpperCase() + scope.name.slice(1).replace(/[_:]/g, ' '),
			description: scope.description
		}));
	}

	/**
	 * OAuth2 권한 부여 정보를 조회합니다.
	 */
	async getAuthorizationInfo(params: AuthorizeParams): Promise<AuthorizationInfo> {
		const searchParams = new URLSearchParams({
			client_id: params.client_id,
			redirect_uri: params.redirect_uri,
			response_type: params.response_type,
			...(params.scope && { scope: params.scope }),
			...(params.state && { state: params.state }),
			...(params.code_challenge && { code_challenge: params.code_challenge }),
			...(params.code_challenge_method && {
				code_challenge_method: params.code_challenge_method
			}),
			...(params.nonce && { nonce: params.nonce })
		});

		return this.request<AuthorizationInfo>(
			`${API_ENDPOINTS.OAUTH2.AUTHORIZE_INFO}?${searchParams.toString()}`,
			{
				method: 'GET'
			}
		);
	}

	/**
	 * 사용자 동의를 처리합니다.
	 */
	async handleConsent(request: ConsentRequest): Promise<ConsentResponse> {
		return this.request<ConsentResponse>(API_ENDPOINTS.OAUTH2.AUTHORIZE_CONSENT, {
			method: 'POST',
			body: JSON.stringify(request)
		});
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
		return this.request(API_ENDPOINTS.OAUTH2.USERINFO, {
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

		return this.request(API_ENDPOINTS.OAUTH2.TOKEN, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: params.toString()
		});
	}
}
