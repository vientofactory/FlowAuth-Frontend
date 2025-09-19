export interface TwoFactorSetup {
	secret: string;
	qrCodeUrl: string;
	backupCodes: string[];
}

export interface TwoFactorStatus {
	enabled: boolean;
	hasBackupCodes: boolean;
}

export interface TwoFactorEnableRequest {
	token: string;
	secret: string;
	backupCodes: string[];
}

export interface TwoFactorVerifyRequest {
	token: string;
}

export interface TwoFactorBackupCodeRequest {
	code: string;
}

export interface TwoFactorDisableRequest {
	currentPassword: string;
}

export interface TwoFactorResponse {
	message: string;
}

export interface TwoFactorVerifyResponse {
	valid: boolean;
}
