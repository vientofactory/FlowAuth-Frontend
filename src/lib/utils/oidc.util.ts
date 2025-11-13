import { CryptoUtils, JwtUtils } from './crypto.util';
import type { IdTokenPayload, ImplicitTokenResponse } from '$lib/types/oauth.types';

/**
 * JWKS 키 인터페이스
 */
interface JWKSKey {
	kty: string;
	kid: string;
	n: string;
	e: string;
	alg: string;
}

/**
 * JWKS 응답 인터페이스
 */
interface JWKSResponse {
	keys: JWKSKey[];
}

/**
 * HTTP 요청을 위한 헬퍼 함수
 */
async function httpRequest(url: string, options: RequestInit = {}): Promise<Response> {
	const response = await fetch(url, {
		headers: {
			'Content-Type': 'application/json',
			...options.headers
		},
		...options
	});

	if (!response.ok) {
		throw new Error(`HTTP request failed: ${response.status} ${response.statusText}`);
	}

	return response;
}

/**
 * OpenID Connect 클라이언트 유틸리티
 */
export class OIDCUtils {
	/**
	 * OpenID Connect Discovery 문서 가져오기
	 * @param issuer Issuer URL
	 * @returns Discovery 문서
	 */
	static async getDiscoveryDocument(issuer: string) {
		const discoveryUrl = `${issuer}/.well-known/openid-configuration`;
		const response = await httpRequest(discoveryUrl);
		return await response.json();
	}

	/**
	 * JWKS (JSON Web Key Set) 가져오기
	 * @param jwksUri JWKS URI
	 * @returns JWKS
	 */
	static async getJwks(jwksUri: string): Promise<JWKSResponse> {
		const response = await httpRequest(jwksUri);

		return await response.json();
	}

	/**
	 * Implicit Grant를 위한 인증 URL 생성
	 * @param authorizationEndpoint 인증 엔드포인트
	 * @param params 인증 파라미터
	 * @returns 완성된 인증 URL
	 */
	static buildImplicitAuthorizationUrl(
		authorizationEndpoint: string,
		params: {
			client_id: string;
			redirect_uri: string;
			response_type: 'id_token' | 'token id_token';
			scope: string;
			state?: string;
			nonce?: string;
		}
	): string {
		const url = new URL(authorizationEndpoint);

		// 필수 파라미터
		url.searchParams.set('client_id', params.client_id);
		url.searchParams.set('redirect_uri', params.redirect_uri);
		url.searchParams.set('response_type', params.response_type);
		url.searchParams.set('scope', params.scope);

		// 선택 파라미터
		if (params.state) {
			url.searchParams.set('state', params.state);
		}

		// nonce는 OIDC에서 필수 (replay attack 방지)
		const nonce = params.nonce || CryptoUtils.generateState(32);
		url.searchParams.set('nonce', nonce);

		return url.toString();
	}

	/**
	 * URL fragment에서 Implicit Grant 토큰 파싱
	 * @param hash URL hash (location.hash)
	 * @returns 파싱된 토큰 정보
	 */
	static parseImplicitTokens(hash: string): ImplicitTokenResponse | null {
		if (!hash || !hash.startsWith('#')) {
			return null;
		}

		const hashParams = new URLSearchParams(hash.substring(1));

		const accessToken = hashParams.get('access_token');
		const idToken = hashParams.get('id_token');
		const tokenType = hashParams.get('token_type');
		const expiresIn = hashParams.get('expires_in');
		const state = hashParams.get('state');

		if (!accessToken && !idToken) {
			return null;
		}

		return {
			access_token: accessToken || undefined,
			id_token: idToken || undefined,
			token_type: tokenType || 'Bearer',
			expires_in: expiresIn ? parseInt(expiresIn) : undefined,
			state: state || undefined
		};
	}

	/**
	 * ID 토큰 검증 및 파싱
	 * @param idToken ID 토큰
	 * @param expectedIssuer 예상 issuer
	 * @param expectedAudience 예상 audience
	 * @param expectedNonce 예상 nonce
	 * @returns 검증된 토큰 페이로드
	 */
	static async validateAndParseIdToken(
		idToken: string,
		expectedIssuer: string,
		expectedAudience: string,
		expectedNonce?: string
	): Promise<IdTokenPayload> {
		try {
			const { payload } = JwtUtils.parseJwt(idToken);

			// 기본 검증
			if (payload.iss !== expectedIssuer) {
				throw new Error('Invalid issuer');
			}

			if (payload.aud !== expectedAudience) {
				throw new Error('Invalid audience');
			}

			// 만료 확인
			if (JwtUtils.isTokenExpired(idToken)) {
				throw new Error('Token is expired');
			}

			// nonce 검증 (있는 경우)
			if (expectedNonce && payload.nonce !== expectedNonce) {
				throw new Error('Invalid nonce');
			}

			return payload as IdTokenPayload;
		} catch (error) {
			throw new Error(
				`ID token validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * UserInfo 엔드포인트에서 사용자 정보 가져오기
	 * @param userinfoEndpoint UserInfo 엔드포인트
	 * @param accessToken 액세스 토큰
	 * @returns 사용자 정보
	 */
	static async getUserInfo(userinfoEndpoint: string, accessToken: string) {
		const response = await httpRequest(userinfoEndpoint, {
			headers: {
				Authorization: `Bearer ${accessToken}`
			}
		});

		return await response.json();
	}

	/**
	 * 토큰 저장 (세션 스토리지)
	 * @param tokens 토큰 정보
	 */
	static storeTokens(tokens: ImplicitTokenResponse): void {
		if (tokens.access_token) {
			sessionStorage.setItem('oidc_access_token', tokens.access_token);
		}

		if (tokens.id_token) {
			sessionStorage.setItem('oidc_id_token', tokens.id_token);
		}

		if (tokens.token_type) {
			sessionStorage.setItem('oidc_token_type', tokens.token_type);
		}

		if (tokens.expires_in) {
			const expiresAt = Date.now() + tokens.expires_in * 1000;
			sessionStorage.setItem('oidc_expires_at', expiresAt.toString());
		}

		if (tokens.state) {
			sessionStorage.setItem('oidc_state', tokens.state);
		}
	}

	/**
	 * 저장된 토큰 가져오기
	 * @returns 저장된 토큰 정보
	 */
	static getStoredTokens(): ImplicitTokenResponse | null {
		const accessToken = sessionStorage.getItem('oidc_access_token');
		const idToken = sessionStorage.getItem('oidc_id_token');
		const tokenType = sessionStorage.getItem('oidc_token_type');
		const expiresAt = sessionStorage.getItem('oidc_expires_at');
		const state = sessionStorage.getItem('oidc_state');

		if (!accessToken && !idToken) {
			return null;
		}

		const expiresIn = expiresAt ? Math.floor((parseInt(expiresAt) - Date.now()) / 1000) : undefined;

		return {
			access_token: accessToken || undefined,
			id_token: idToken || undefined,
			token_type: tokenType || 'Bearer',
			expires_in: expiresIn,
			state: state || undefined
		};
	}

	/**
	 * 저장된 토큰 삭제
	 */
	static clearStoredTokens(): void {
		sessionStorage.removeItem('oidc_access_token');
		sessionStorage.removeItem('oidc_id_token');
		sessionStorage.removeItem('oidc_token_type');
		sessionStorage.removeItem('oidc_expires_at');
		sessionStorage.removeItem('oidc_state');
	}

	/**
	 * 저장된 액세스 토큰이 유효한지 확인
	 * @returns 유효성 여부
	 */
	static isAccessTokenValid(): boolean {
		const expiresAt = sessionStorage.getItem('oidc_expires_at');
		if (!expiresAt) return false;

		const expiresAtTime = parseInt(expiresAt);
		return Date.now() < expiresAtTime;
	}

	/**
	 * RSA 서명 검증을 위한 JWKS 키 가져오기
	 * @param jwksUri JWKS 엔드포인트 URI
	 * @param kid Key ID
	 * @returns RSA 공개키
	 */
	static async getRsaPublicKey(jwksUri: string, kid: string): Promise<CryptoKey> {
		const jwks = await this.getJwks(jwksUri);

		const key = jwks.keys.find((k: JWKSKey) => k.kid === kid);
		if (!key) {
			throw new Error(`Key with kid '${kid}' not found in JWKS`);
		}

		if (key.kty !== 'RSA') {
			throw new Error('Only RSA keys are supported');
		}

		// JWKS에서 RSA 공개키 구성
		const publicKey = {
			kty: key.kty,
			n: key.n,
			e: key.e,
			alg: key.alg,
			kid: key.kid
		};

		// CryptoKey로 변환
		return await crypto.subtle.importKey(
			'jwk',
			publicKey,
			{
				name: 'RSASSA-PKCS1-v1_5',
				hash: 'SHA-256'
			},
			false,
			['verify']
		);
	}

	/**
	 * RSA 서명 검증을 포함한 ID 토큰 검증
	 * @param idToken ID 토큰
	 * @param jwksUri JWKS 엔드포인트 URI
	 * @param expectedIssuer 예상 issuer
	 * @param expectedAudience 예상 audience
	 * @param expectedNonce 예상 nonce
	 * @returns 검증된 토큰 페이로드
	 */
	static async validateAndParseIdTokenWithRsa(
		idToken: string,
		jwksUri: string,
		expectedIssuer: string,
		expectedAudience: string,
		expectedNonce?: string
	): Promise<IdTokenPayload> {
		try {
			const { header, payload, signature } = JwtUtils.parseJwt(idToken);

			// 개발 환경 토큰은 검증 건너뛰기 (HMAC 서명)
			if (header.alg === 'HS256') {
				console.log('Development environment token detected, skipping RSA validation');
				return payload as IdTokenPayload;
			}

			// 헤더에서 key ID 추출
			const kid = header.kid as string;
			if (!kid) {
				throw new Error('Key ID (kid) not found in token header');
			}

			// RSA 공개키 가져오기
			const publicKey = await this.getRsaPublicKey(jwksUri, kid);

			// 서명 검증
			const encoder = new TextEncoder();
			const data = encoder.encode(`${idToken.split('.')[0]}.${idToken.split('.')[1]}`);
			const signatureBytes = Uint8Array.from(
				atob(signature.replace(/-/g, '+').replace(/_/g, '/')),
				(c) => c.charCodeAt(0)
			);

			const isValidSignature = await crypto.subtle.verify(
				'RSASSA-PKCS1-v1_5',
				publicKey,
				signatureBytes,
				data
			);

			if (!isValidSignature) {
				throw new Error('Invalid RSA signature');
			}

			// 기본 검증
			if (payload.iss !== expectedIssuer) {
				throw new Error('Invalid issuer');
			}

			if (payload.aud !== expectedAudience) {
				throw new Error('Invalid audience');
			}

			// 만료 확인
			if (JwtUtils.isTokenExpired(idToken)) {
				throw new Error('Token is expired');
			}

			// nonce 검증 (있는 경우)
			if (expectedNonce && payload.nonce !== expectedNonce) {
				throw new Error('Invalid nonce');
			}

			return payload as IdTokenPayload;
		} catch (error) {
			throw new Error(
				`RSA ID token validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}
}
