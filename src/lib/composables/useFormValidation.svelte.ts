import {
	validateEmail,
	validatePassword,
	validateUsername,
	validateName,
	validateRequired,
	validateUrl
} from '$lib/utils/validation.utils';

export interface FieldValidation {
	value: string;
	error: string;
	isValid: boolean;
	validate: (immediate?: boolean) => boolean;
	clear: () => void;
	triggerValidation: () => void;
	setError: (message: string) => void;
}

export interface FormValidation {
	fields: Record<string, FieldValidation>;
	isValid: boolean;
	validateAll: () => boolean;
	clearAll: () => void;
	reset: () => void;
}

export function useFieldValidation(
	initialValue: string = '',
	validator?: (value: string) => { isValid: boolean; message?: string },
	options: {
		debounceMs?: number;
		autoValidate?: boolean;
		validateOnEmpty?: boolean;
	} = {}
): FieldValidation {
	const { debounceMs = 300, autoValidate = true, validateOnEmpty = false } = options;
	let value = $state(initialValue);
	let error = $state('');
	let validationTimeout: ReturnType<typeof setTimeout> | null = null;

	const validate = (immediate: boolean = false) => {
		if (!validator) {
			error = '';
			return true;
		}

		const performValidation = () => {
			const result = validator(value);
			error = result.isValid ? '' : result.message || '입력값이 올바르지 않습니다.';
			return result.isValid;
		};

		// Immediate validation for form submission
		if (immediate) {
			if (validationTimeout) {
				clearTimeout(validationTimeout);
				validationTimeout = null;
			}
			return performValidation();
		}

		// Debounced validation for real-time feedback
		if (validationTimeout) {
			clearTimeout(validationTimeout);
		}

		validationTimeout = setTimeout(() => {
			performValidation();
			validationTimeout = null;
		}, debounceMs);

		return true; // Return true for debounced validation
	};

	const clear = () => {
		if (validationTimeout) {
			clearTimeout(validationTimeout);
			validationTimeout = null;
		}
		error = '';
	};

	const setError = (message: string) => {
		if (validationTimeout) {
			clearTimeout(validationTimeout);
			validationTimeout = null;
		}
		error = message;
	};

	return {
		get value() {
			return value;
		},
		set value(newValue: string) {
			value = newValue;
			// Only trigger validation if auto-validation is enabled
			if (autoValidate) {
				const shouldValidate = validateOnEmpty || newValue.trim() !== '';
				if (shouldValidate) {
					validate(false); // Use debounced validation
				} else {
					clear();
				}
			}
		},
		get error() {
			return error;
		},
		get isValid() {
			return !error;
		},
		validate: (immediate = true) => validate(immediate),
		triggerValidation: () => validate(false), // Trigger debounced validation manually
		clear,
		setError
	};
}

// Convenience functions for common validation scenarios
export function useRealtimeValidation(
	initialValue: string = '',
	validator?: (value: string) => { isValid: boolean; message?: string },
	debounceMs: number = 300
): FieldValidation {
	return useFieldValidation(initialValue, validator, {
		debounceMs,
		autoValidate: true,
		validateOnEmpty: false
	});
}

export function useManualValidation(
	initialValue: string = '',
	validator?: (value: string) => { isValid: boolean; message?: string }
): FieldValidation {
	return useFieldValidation(initialValue, validator, {
		autoValidate: false,
		validateOnEmpty: true
	});
}

export function useFormValidation(fields: Record<string, FieldValidation>): FormValidation {
	const validateAll = () => {
		let allValid = true;
		for (const field of Object.values(fields)) {
			if (!field.validate()) {
				allValid = false;
			}
		}
		return allValid;
	};

	const clearAll = () => {
		for (const field of Object.values(fields)) {
			field.clear();
		}
	};

	const reset = () => {
		for (const field of Object.values(fields)) {
			field.value = '';
			field.clear();
		}
	};

	return {
		fields,
		get isValid() {
			return Object.values(fields).every((field) => field.isValid);
		},
		validateAll,
		clearAll,
		reset
	};
}

// 일반적인 검증 함수들을 export
export const validators = {
	email: (value: string) => validateEmail(value),
	password: (value: string) => validatePassword(value),
	username: (value: string) => validateUsername(value),
	firstName: (value: string) => validateName(value, '이름'),
	lastName: (value: string) => validateName(value, '성'),
	required: (fieldName: string) => (value: string) => validateRequired(value, fieldName),
	url:
		(fieldName: string = 'URL') =>
		(value: string) =>
			validateUrl(value, fieldName),

	// 커스텀 검증자들
	confirmPassword: (getOriginalPassword: string | (() => string)) => (value: string) => {
		if (!value) {
			return { isValid: false, message: '비밀번호 확인을 입력해주세요.' };
		}

		// Support both string and function for backward compatibility
		const originalPassword =
			typeof getOriginalPassword === 'function' ? getOriginalPassword() : getOriginalPassword;

		if (value !== originalPassword) {
			return { isValid: false, message: '비밀번호가 일치하지 않습니다.' };
		}
		return { isValid: true };
	},

	twoFactorToken: (value: string) => {
		if (!value) {
			return { isValid: false, message: '토큰을 입력해주세요.' };
		}
		if (!/^\d{6}$/.test(value)) {
			return { isValid: false, message: '6자리 숫자를 입력해주세요.' };
		}
		return { isValid: true };
	},

	backupCode: (value: string) => {
		if (!value) {
			return { isValid: false, message: '백업 코드를 입력해주세요.' };
		}
		if (!/^[A-Z0-9]{8,12}$/.test(value.replace(/-/g, ''))) {
			return { isValid: false, message: '올바른 백업 코드를 입력해주세요.' };
		}
		return { isValid: true };
	},

	redirectUris: (value: string) => {
		if (!value.trim()) {
			return { isValid: false, message: '리다이렉트 URI를 입력해주세요.' };
		}

		const uris = value.split('\n').filter((uri) => uri.trim());
		for (const uri of uris) {
			const result = validateUrl(uri.trim(), 'Redirect URI');
			if (!result.isValid) {
				return { isValid: false, message: `올바르지 않은 URI: ${uri}` };
			}
		}
		return { isValid: true };
	}
};
