/**
 * 쿠키 관련 유틸리티 함수들
 */

interface CookieOptions {
	path?: string;
	maxAge?: number;
	expires?: Date;
	secure?: boolean;
	sameSite?: 'strict' | 'lax' | 'none';
	httpOnly?: boolean;
}

/**
 * 쿠키 설정
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}) {
	if (typeof window === 'undefined') return;

	const {
		path = '/',
		maxAge,
		expires,
		secure = false,
		sameSite = 'lax',
		httpOnly = false
	} = options;

	let cookieString = `${name}=${value}`;

	if (path) cookieString += `; path=${path}`;
	if (maxAge) cookieString += `; max-age=${maxAge}`;
	if (expires) cookieString += `; expires=${expires.toUTCString()}`;
	if (secure) cookieString += `; secure`;
	if (sameSite) cookieString += `; samesite=${sameSite}`;
	if (httpOnly) cookieString += `; httponly`;

	document.cookie = cookieString;
}

/**
 * 쿠키 삭제
 */
export function deleteCookie(name: string, path: string = '/') {
	if (typeof window === 'undefined') return;

	// 다양한 조합으로 쿠키 삭제 시도
	const cookieSettings = [
		`${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`,
		`${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure`,
		`${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax`,
		`${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=lax`
	];

	cookieSettings.forEach((setting) => {
		document.cookie = setting;
	});
}

/**
 * 쿠키 값 가져오기
 */
export function getCookie(name: string): string | null {
	if (typeof window === 'undefined') return null;

	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);

	if (parts.length === 2) {
		return parts.pop()?.split(';').shift() || null;
	}

	return null;
}

/**
 * 인증 토큰 쿠키 설정 (기본 24시간)
 */
export function setAuthTokenCookie(token: string, maxAge: number = 86400) {
	setCookie('token', token, {
		path: '/',
		maxAge,
		sameSite: 'lax'
	});
}

/**
 * 인증 토큰 쿠키 삭제
 */
export function deleteAuthTokenCookie() {
	deleteCookie('token');
}

/**
 * 모든 인증 관련 쿠키 삭제
 */
export function clearAllAuthCookies() {
	const authCookieNames = ['token', 'refresh_token', 'session_id'];

	authCookieNames.forEach((cookieName) => {
		deleteCookie(cookieName);
	});
}
