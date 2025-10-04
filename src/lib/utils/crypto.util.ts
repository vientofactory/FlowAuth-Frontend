/**
 * 브라우저용 암호화적으로 안전한 난수 생성 유틸리티
 */
export class CryptoUtils {
	/**
	 * 암호화적으로 안전한 랜덤 문자열 생성
	 * @param length 생성할 문자열 길이
	 * @param charset 사용할 문자 집합 (기본값: 영문 대소문자 + 숫자)
	 * @returns 랜덤 문자열
	 */
	static generateRandomString(
		length: number,
		charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	): string {
		if (length <= 0) {
			throw new Error('Length must be greater than 0');
		}

		if (charset.length === 0) {
			throw new Error('Charset cannot be empty');
		}

		// 브라우저의 crypto.getRandomValues() 사용
		const randomBytes = new Uint8Array(length);
		crypto.getRandomValues(randomBytes);

		let result = '';
		for (let i = 0; i < length; i++) {
			result += charset.charAt(randomBytes[i] % charset.length);
		}

		return result;
	}

	/**
	 * OAuth2 state 파라미터용 랜덤 문자열 생성
	 * @param length 생성할 길이 (기본값: 32)
	 * @returns 랜덤 state 문자열
	 */
	static generateState(length: number = 32): string {
		return this.generateRandomString(length);
	}

	/**
	 * PKCE code_verifier 생성
	 * @returns base64url 인코딩된 code_verifier (43-128 글자)
	 */
	static generateCodeVerifier(): string {
		const randomBytes = new Uint8Array(32);
		crypto.getRandomValues(randomBytes);

		// base64url 인코딩 (패딩 제거)
		return btoa(String.fromCharCode(...randomBytes))
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=/g, '');
	}

	/**
	 * PKCE code_challenge 생성
	 * @param codeVerifier code_verifier 값
	 * @returns SHA256 해시된 code_challenge
	 * @throws Error 암호화 작업 실패 시
	 */
	static async generateCodeChallenge(codeVerifier: string): Promise<string> {
		if (!codeVerifier || typeof codeVerifier !== 'string') {
			throw new Error('Code verifier must be a non-empty string');
		}

		if (codeVerifier.length < 43 || codeVerifier.length > 128) {
			throw new Error('Code verifier must be between 43 and 128 characters long');
		}

		try {
			const encoder = new TextEncoder();
			const data = encoder.encode(codeVerifier);
			const digest = await crypto.subtle.digest('SHA-256', data);

			// base64url 인코딩 (패딩 제거)
			return btoa(String.fromCharCode(...new Uint8Array(digest)))
				.replace(/\+/g, '-')
				.replace(/\//g, '_')
				.replace(/=/g, '');
		} catch (error) {
			throw new Error(
				`Failed to generate code challenge: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * 지정된 범위의 랜덤 정수 생성
	 * @param min 최소값 (포함)
	 * @param max 최대값 (포함)
	 * @returns 범위 내의 랜덤 정수
	 */
	static randomInt(min: number, max: number): number {
		if (min > max) {
			throw new Error('min cannot be greater than max');
		}

		const range = max - min + 1;
		const randomBytes = new Uint32Array(1);
		crypto.getRandomValues(randomBytes);

		return min + (randomBytes[0] % range);
	}

	/**
	 * 암호화적으로 안전한 랜덤 바이트 생성
	 * @param size 바이트 수
	 * @returns Uint8Array 형태의 랜덤 바이트
	 */
	static randomBytes(size: number): Uint8Array {
		const bytes = new Uint8Array(size);
		crypto.getRandomValues(bytes);
		return bytes;
	}
}

/**
 * JWT 토큰 파싱 및 검증 유틸리티 (OpenID Connect용)
 */
export class JwtUtils {
	/**
	 * JWT 토큰을 파싱하여 헤더, 페이로드, 시그니처로 분리
	 * @param token JWT 토큰
	 * @returns 파싱된 토큰 정보
	 */
	static parseJwt(token: string): {
		header: Record<string, unknown>;
		payload: Record<string, unknown>;
		signature: string;
	} {
		const parts = token.split('.');
		if (parts.length !== 3) {
			throw new Error('Invalid JWT token format');
		}

		const [headerB64, payloadB64, signature] = parts;

		try {
			const header = JSON.parse(this.base64UrlDecode(headerB64));
			const payload = JSON.parse(this.base64UrlDecode(payloadB64));

			return { header, payload, signature };
		} catch {
			throw new Error('Failed to parse JWT token');
		}
	}

	/**
	 * JWT 토큰의 만료 여부 확인
	 * @param token JWT 토큰
	 * @returns 만료 여부
	 */
	static isTokenExpired(token: string): boolean {
		try {
			const { payload } = this.parseJwt(token);
			const exp = payload.exp as number;

			if (!exp) return false;

			const currentTime = Math.floor(Date.now() / 1000);
			return currentTime >= exp;
		} catch {
			return true; // 파싱 실패 시 만료된 것으로 간주
		}
	}

	/**
	 * JWT 토큰의 만료 시간 가져오기
	 * @param token JWT 토큰
	 * @returns 만료 시간 (Date 객체)
	 */
	static getTokenExpiration(token: string): Date | null {
		try {
			const { payload } = this.parseJwt(token);
			const exp = payload.exp as number;

			if (!exp) return null;

			return new Date(exp * 1000);
		} catch {
			return null;
		}
	}

	/**
	 * JWT 토큰의 발급 시간 가져오기
	 * @param token JWT 토큰
	 * @returns 발급 시간 (Date 객체)
	 */
	static getTokenIssuedAt(token: string): Date | null {
		try {
			const { payload } = this.parseJwt(token);
			const iat = payload.iat as number;

			if (!iat) return null;

			return new Date(iat * 1000);
		} catch {
			return null;
		}
	}

	/**
	 * Base64URL 디코딩
	 * @param str Base64URL 문자열
	 * @returns 디코딩된 문자열
	 */
	private static base64UrlDecode(str: string): string {
		let base64 = str.replace(/-/g, '+').replace(/_/g, '/');

		// 패딩 추가
		while (base64.length % 4 !== 0) {
			base64 += '=';
		}

		return atob(base64);
	}
}
