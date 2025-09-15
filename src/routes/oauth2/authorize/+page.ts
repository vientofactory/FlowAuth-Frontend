import type { Client } from '$lib/types/oauth.types';
import type { LoadEvent } from '@sveltejs/kit';

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
	};
}

// 서버사이드에서는 URL 파라미터만 전달하고, 실제 API 호출은 클라이언트사이드에서 수행
export const load = async ({ url }: LoadEvent) => {
	const client_id = url.searchParams.get('client_id');
	const redirect_uri = url.searchParams.get('redirect_uri');
	const response_type = url.searchParams.get('response_type');
	const scope = url.searchParams.get('scope');
	const state = url.searchParams.get('state');
	const code_challenge = url.searchParams.get('code_challenge');
	const code_challenge_method = url.searchParams.get('code_challenge_method');

	if (!client_id || !redirect_uri || !response_type) {
		throw new Error('Missing required OAuth2 parameters');
	}

	return {
		authorizeParams: {
			client_id,
			redirect_uri,
			response_type,
			scope,
			state,
			code_challenge,
			code_challenge_method
		}
	};
};
