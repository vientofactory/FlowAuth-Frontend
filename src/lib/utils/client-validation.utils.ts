import {
	validateClientName,
	validateRedirectUri,
	validateUrl,
	validateLogoUrl,
	validateScopes
} from '$lib/utils/validation.utils';

export interface ValidationResult {
	isValid: boolean;
	message?: string;
}

export interface ClientFormData {
	clientName: string;
	redirectUris: string;
	scopes: string;
	logoUri: string;
	termsOfServiceUri: string;
	policyUri: string;
}

export interface ClientFormErrors {
	clientName: string;
	redirectUris: string;
	scopes: string;
	logoUri: string;
	termsOfServiceUri: string;
	policyUri: string;
}

// 클라이언트 이름 검증
export function validateClientNameField(clientName: string): ValidationResult {
	const result = validateClientName(clientName);
	return {
		isValid: result.isValid,
		message: result.isValid ? '' : result.message || ''
	};
}

// 리다이렉트 URI 검증
export function validateRedirectUrisField(redirectUris: string): ValidationResult {
	if (!redirectUris.trim()) {
		return {
			isValid: false,
			message: '리다이렉트 URI를 입력해주세요.'
		};
	}

	const uris = redirectUris
		.split('\n')
		.map((uri) => uri.trim())
		.filter((uri) => uri.length > 0);

	if (uris.length === 0) {
		return {
			isValid: false,
			message: '최소 하나의 리다이렉트 URI를 입력해주세요.'
		};
	}

	for (const uri of uris) {
		const result = validateRedirectUri(uri);
		if (!result.isValid) {
			return {
				isValid: false,
				message: result.message || '올바르지 않은 리다이렉트 URI가 있습니다.'
			};
		}
	}

	return { isValid: true };
}

// 스코프 검증
export function validateScopesField(scopes: string): ValidationResult {
	if (!scopes.trim()) {
		return {
			isValid: false,
			message: '권한 범위를 입력해주세요.'
		};
	}

	const scopesArray = scopes
		.split(' ')
		.map((scope) => scope.trim())
		.filter((scope) => scope.length > 0);

	const result = validateScopes(scopesArray);
	return {
		isValid: result.isValid,
		message: result.isValid ? '' : result.message || ''
	};
}

// 로고 URI 검증 (선택적)
export function validateLogoUriField(logoUri: string): ValidationResult {
	if (!logoUri || logoUri.trim() === '') {
		return { isValid: true };
	}

	const result = validateLogoUrl(logoUri);
	return {
		isValid: result.isValid,
		message: result.isValid ? '' : result.message || ''
	};
}

// 서비스 약관 URI 검증 (선택적)
export function validateTermsOfServiceUriField(termsOfServiceUri: string): ValidationResult {
	if (!termsOfServiceUri || termsOfServiceUri.trim() === '') {
		return { isValid: true };
	}

	const result = validateUrl(termsOfServiceUri, '서비스 약관 URL');
	return {
		isValid: result.isValid,
		message: result.isValid ? '' : result.message || ''
	};
}

// 개인정보처리방침 URI 검증 (선택적)
export function validatePolicyUriField(policyUri: string): ValidationResult {
	if (!policyUri || policyUri.trim() === '') {
		return { isValid: true };
	}

	const result = validateUrl(policyUri, '개인정보처리방침 URL');
	return {
		isValid: result.isValid,
		message: result.isValid ? '' : result.message || ''
	};
}

// 폼 전체 검증
export function validateClientForm(formData: ClientFormData): ClientFormErrors {
	return {
		clientName: validateClientNameField(formData.clientName).message || '',
		redirectUris: validateRedirectUrisField(formData.redirectUris).message || '',
		scopes: validateScopesField(formData.scopes).message || '',
		logoUri: validateLogoUriField(formData.logoUri).message || '',
		termsOfServiceUri: validateTermsOfServiceUriField(formData.termsOfServiceUri).message || '',
		policyUri: validatePolicyUriField(formData.policyUri).message || ''
	};
}

// 폼이 유효한지 확인
export function isClientFormValid(errors: ClientFormErrors): boolean {
	return Object.values(errors).every((error) => error === '');
}

// 수정 폼 검증 함수들
export function validateEditClientNameField(clientName: string): ValidationResult {
	console.log('validateEditClientNameField - editClientName:', clientName);
	const result = validateClientName(clientName);
	return {
		isValid: result.isValid,
		message: result.isValid ? '' : result.message || ''
	};
}

export function validateEditRedirectUrisField(redirectUris: string): ValidationResult {
	console.log('validateEditRedirectUrisField - editRedirectUris:', redirectUris);
	if (!redirectUris.trim()) {
		return {
			isValid: false,
			message: '리다이렉트 URI를 입력해주세요.'
		};
	}

	const uris = redirectUris
		.split('\n')
		.map((uri) => uri.trim())
		.filter((uri) => uri.length > 0);

	console.log('validateEditRedirectUrisField - parsed uris:', uris);

	if (uris.length === 0) {
		return {
			isValid: false,
			message: '최소 하나의 리다이렉트 URI를 입력해주세요.'
		};
	}

	for (const uri of uris) {
		const result = validateRedirectUri(uri);
		if (!result.isValid) {
			return {
				isValid: false,
				message: result.message || '올바르지 않은 리다이렉트 URI가 있습니다.'
			};
		}
	}

	return { isValid: true };
}

export function validateEditScopesField(scopes: string): ValidationResult {
	console.log('validateEditScopesField - editScopes:', scopes);
	if (!scopes.trim()) {
		return {
			isValid: false,
			message: '권한 범위를 입력해주세요.'
		};
	}

	const scopesArray = scopes
		.split(' ')
		.map((scope) => scope.trim())
		.filter((scope) => scope.length > 0);

	console.log('validateEditScopesField - parsed scopes:', scopesArray);
	const result = validateScopes(scopesArray);
	return {
		isValid: result.isValid,
		message: result.isValid ? '' : result.message || ''
	};
}

export function validateEditLogoUriField(logoUri: string): ValidationResult {
	console.log('validateEditLogoUriField - editLogoUri:', logoUri);
	if (!logoUri || logoUri.trim() === '') {
		return { isValid: true };
	}

	const result = validateLogoUrl(logoUri);
	return {
		isValid: result.isValid,
		message: result.isValid ? '' : result.message || ''
	};
}

export function validateEditTermsOfServiceUriField(termsOfServiceUri: string): ValidationResult {
	console.log('validateEditTermsOfServiceUriField - editTermsOfServiceUri:', termsOfServiceUri);
	if (!termsOfServiceUri || termsOfServiceUri.trim() === '') {
		return { isValid: true };
	}

	const result = validateUrl(termsOfServiceUri, '서비스 약관 URL');
	return {
		isValid: result.isValid,
		message: result.isValid ? '' : result.message || ''
	};
}

export function validateEditPolicyUriField(policyUri: string): ValidationResult {
	console.log('validateEditPolicyUriField - editPolicyUri:', policyUri);
	if (!policyUri || policyUri.trim() === '') {
		return { isValid: true };
	}

	const result = validateUrl(policyUri, '개인정보처리방침 URL');
	return {
		isValid: result.isValid,
		message: result.isValid ? '' : result.message || ''
	};
}
