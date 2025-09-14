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
	 */
	static async generateCodeChallenge(codeVerifier: string): Promise<string> {
		const encoder = new TextEncoder();
		const data = encoder.encode(codeVerifier);
		const digest = await crypto.subtle.digest('SHA-256', data);

		// base64url 인코딩 (패딩 제거)
		return btoa(String.fromCharCode(...new Uint8Array(digest)))
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=/g, '');
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
