/**
 * 회원가입 관련 타입 정의
 */

export interface PasswordRequirements {
	length: boolean;
	lowercase: boolean;
	uppercase: boolean;
	number: boolean;
	specialChar: boolean;
}

export interface ValidationResult {
	available: boolean;
	message: string;
}

export interface DuplicationCheckResults {
	username: ValidationResult | null;
	email: ValidationResult | null;
}
