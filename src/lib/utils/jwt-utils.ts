export interface TokenInfo {
	header: {
		alg: string;
		typ: string;
		kid?: string;
		[key: string]: unknown;
	};
	payload: Record<string, unknown>;
	signature: string;
}

export interface DecodedTokenResult {
	tokenInfo: TokenInfo;
	isValidNonce: boolean;
	isExpired: boolean;
	expiresIn?: number;
}

/**
 * JWT 토큰을 디코딩하고 검증합니다.
 */
export function decodeJWT(token: string, expectedNonce?: string): DecodedTokenResult | null {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) {
			throw new Error('Invalid JWT format');
		}

		const payload = JSON.parse(atob(parts[1]));
		const header = JSON.parse(atob(parts[0]));

		// nonce 검증 (ID 토큰인 경우)
		let isValidNonce = true;
		if (expectedNonce && payload.nonce) {
			isValidNonce = payload.nonce === expectedNonce;
		}

		// 만료 시간 검증
		let isExpired = false;
		let expiresIn: number | undefined;

		if (payload.exp) {
			const now = Math.floor(Date.now() / 1000);
			const exp = typeof payload.exp === 'number' ? payload.exp : parseInt(String(payload.exp));
			isExpired = now > exp;
			expiresIn = exp - now;
		}

		const tokenInfo: TokenInfo = {
			header,
			payload,
			signature: parts[2]
		};

		return {
			tokenInfo,
			isValidNonce,
			isExpired,
			expiresIn
		};
	} catch (error) {
		console.error('JWT 디코딩 실패:', error);
		return null;
	}
}

/**
 * JWT 토큰의 만료 시간을 읽기 쉬운 형식으로 변환합니다.
 */
export function formatTokenExpiry(expiresIn?: number): string {
	if (!expiresIn) return '만료 시간 정보 없음';

	if (expiresIn < 0) return '만료됨';

	const hours = Math.floor(expiresIn / 3600);
	const minutes = Math.floor((expiresIn % 3600) / 60);
	const seconds = expiresIn % 60;

	if (hours > 0) {
		return `${hours}시간 ${minutes}분 ${seconds}초 남음`;
	} else if (minutes > 0) {
		return `${minutes}분 ${seconds}초 남음`;
	} else {
		return `${seconds}초 남음`;
	}
}

/**
 * JWT 페이로드를 보기 좋게 포맷팅합니다.
 */
export function formatJWTPayload(payload: Record<string, unknown>): string {
	return JSON.stringify(payload, null, 2);
}

/**
 * JWT 헤더를 보기 좋게 포맷팅합니다.
 */
export function formatJWTHeader(header: Record<string, unknown>): string {
	return JSON.stringify(header, null, 2);
}
