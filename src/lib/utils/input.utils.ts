/**
 * Input transformation utilities for consistent input handling across components
 */

export interface InputTransformOptions {
	maxLength?: number;
	allowedChars?: RegExp;
	transform?: (value: string) => string;
}

/**
 * Base input transformer that applies character filtering, length limiting, and transformations
 */
export function transformInput(value: string, options: InputTransformOptions = {}): string {
	const { maxLength, allowedChars, transform } = options;

	let result = value;

	// Apply character filtering
	if (allowedChars) {
		result = result.replace(allowedChars, '');
	}

	// Apply custom transformation
	if (transform) {
		result = transform(result);
	}

	// Apply length limit
	if (maxLength !== undefined) {
		result = result.slice(0, maxLength);
	}

	return result;
}

/**
 * Creates an input handler that applies transformations and updates a field
 */
export function createInputHandler(
	field: { value: string; clear: () => void },
	options: InputTransformOptions = {}
) {
	return (event: Event) => {
		const target = event.target as HTMLInputElement;
		const transformedValue = transformInput(target.value, options);
		field.value = transformedValue;

		// Update the input element value if it was transformed
		if (target.value !== transformedValue) {
			target.value = transformedValue;
		}

		// Clear validation errors during input
		field.clear();
	};
}

/**
 * Transforms input to digits only with optional length limit
 */
export function createNumericInputHandler(
	field: { value: string; clear: () => void },
	maxLength?: number
) {
	return createInputHandler(field, {
		allowedChars: /\D/g, // Remove non-digits
		maxLength
	});
}

/**
 * Transforms input to uppercase alphanumeric with optional formatting
 */
export function createAlphanumericInputHandler(
	field: { value: string; clear: () => void },
	options: {
		maxLength?: number;
		allowHyphens?: boolean;
		toUpperCase?: boolean;
	} = {}
) {
	const { maxLength, allowHyphens = false, toUpperCase = true } = options;

	return createInputHandler(field, {
		allowedChars: allowHyphens ? /[^A-Z0-9-]/g : /[^A-Z0-9]/g,
		transform: toUpperCase ? (value: string) => value.toUpperCase() : undefined,
		maxLength
	});
}

/**
 * Specific handlers for common use cases
 */
export const inputHandlers = {
	/**
	 * Handler for 2FA tokens (6-digit numeric)
	 */
	twoFactorToken: (field: { value: string; clear: () => void }) =>
		createNumericInputHandler(field, 6),

	/**
	 * Handler for backup codes (uppercase alphanumeric with hyphens)
	 */
	backupCode: (field: { value: string; clear: () => void }) =>
		createAlphanumericInputHandler(field, {
			allowHyphens: true,
			toUpperCase: true
		}),

	/**
	 * Handler for phone numbers (numeric with length limit)
	 */
	phoneNumber: (field: { value: string; clear: () => void }, maxLength = 15) =>
		createNumericInputHandler(field, maxLength),

	/**
	 * Handler for credit card numbers (numeric with length limit)
	 */
	creditCard: (field: { value: string; clear: () => void }) => createNumericInputHandler(field, 19), // Max for most cards including spaces

	/**
	 * Handler for postal codes (alphanumeric, uppercase)
	 */
	postalCode: (field: { value: string; clear: () => void }, maxLength = 10) =>
		createAlphanumericInputHandler(field, {
			maxLength,
			allowHyphens: true,
			toUpperCase: true
		})
};

/**
 * Format functions for display purposes
 */
export const formatters = {
	/**
	 * Format a string as a 2FA token (XXX XXX)
	 */
	twoFactorToken: (value: string): string => {
		const digits = value.replace(/\D/g, '').slice(0, 6);
		return digits.length > 3 ? `${digits.slice(0, 3)} ${digits.slice(3)}` : digits;
	},

	/**
	 * Format a backup code with hyphens (XXXX-XXXX-XXXX)
	 */
	backupCode: (value: string): string => {
		const clean = value.replace(/[^A-Z0-9]/g, '');
		return clean.replace(/(.{4})/g, '$1-').replace(/-$/, '');
	},

	/**
	 * Format a phone number
	 */
	phoneNumber: (value: string, format = 'US'): string => {
		const digits = value.replace(/\D/g, '');

		if (format === 'US') {
			if (digits.length <= 3) return digits;
			if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
			return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
		}

		return digits;
	},

	/**
	 * Format a credit card number (XXXX XXXX XXXX XXXX)
	 */
	creditCard: (value: string): string => {
		const digits = value.replace(/\D/g, '');
		return digits.replace(/(.{4})/g, '$1 ').trim();
	}
};
