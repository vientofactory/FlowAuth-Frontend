import type { Client } from '$lib/types/oauth.types';
import type { PageLoad } from './$types';

export interface ConsentPageData {
	client: Client;
	scopes: string[];
	authorizeParams: {
		client_id: string;
		redirect_uri: string;
		response_type: string;
		scope?: string;
		state?: string;
		code_challenge?: string;
		code_challenge_method?: string;
		nonce?: string;
	};
}

// OAuth2 동의 페이지 파라미터 로드
export const load: PageLoad = async ({ url }) => {
	const client_id = url.searchParams.get('client_id');
	const redirect_uri = url.searchParams.get('redirect_uri');
	const response_type = url.searchParams.get('response_type');
	const scope = url.searchParams.get('scope');
	const state = url.searchParams.get('state');
	const code_challenge = url.searchParams.get('code_challenge');
	const code_challenge_method = url.searchParams.get('code_challenge_method');
	const nonce = url.searchParams.get('nonce');

	if (!client_id || !redirect_uri || !response_type) {
		return {
			error: {
				status: 400,
				message: '필수 OAuth2 파라미터가 누락되었습니다. (client_id, redirect_uri, response_type)'
			}
		};
	}

	return {
		authorizeParams: {
			client_id,
			redirect_uri,
			response_type,
			scope: scope || undefined,
			state: state || undefined,
			code_challenge: code_challenge || undefined,
			code_challenge_method: code_challenge_method || undefined,
			nonce: nonce || undefined
		}
	};
};
