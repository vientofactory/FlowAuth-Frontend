// place files you want to import through the `$lib` alias in this folder.

// Components
export { default as Button } from './components/Button.svelte';
export { default as ActionButton } from './components/ActionButton.svelte';
export { default as ModalActions } from './components/ModalActions.svelte';
export { default as Input } from './components/Input.svelte';
export { default as Card } from './components/Card.svelte';
export { default as Toast } from './components/Toast.svelte';
export { default as ToastContainer } from './components/ToastContainer.svelte';
export { default as Table } from './components/Table.svelte';
export { default as Modal } from './components/Modal.svelte';
export { default as Tabs } from './components/Tabs.svelte';
export { default as Badge } from './components/Badge.svelte';
export { default as Dropdown } from './components/Dropdown.svelte';
export { default as Loading } from './components/Loading.svelte';
export { default as DashboardSkeleton } from './components/dashboard/DashboardSkeleton.svelte';
export { default as DashboardLayout } from './components/DashboardLayout.svelte';
export { default as AuthLayout } from './components/AuthLayout.svelte';
export { default as PageHeader } from './components/PageHeader.svelte';
export { default as Navigation } from './components/Navigation.svelte';
export { default as Footer } from './components/Footer.svelte';
export { default as LogoUpload } from './components/LogoUpload.svelte';

// Form Components
export { default as FormField } from './components/form/FormField.svelte';
export { default as TextareaField } from './components/form/TextareaField.svelte';

// UI Components
export { default as LoadingSpinner } from './components/ui/LoadingSpinner.svelte';
export { default as LoadingButton } from './components/ui/LoadingButton.svelte';
export { default as ErrorMessage } from './components/ui/ErrorMessage.svelte';
export { default as ErrorBoundary } from './components/ui/ErrorBoundary.svelte';
export { default as ConfirmModal } from './components/ui/ConfirmModal.svelte';

// Email Management Components
export { default as QueueStatusCards } from './components/email-management/QueueStatusCards.svelte';
export { default as QuickActions } from './components/email-management/QuickActions.svelte';
export { default as QueueTable } from './components/email-management/QueueTable.svelte';
export { default as TestSection } from './components/email-management/TestSection.svelte';
export { default as SmtpStatusCard } from './components/email-management/SmtpStatusCard.svelte';
export { default as TestEmailModal } from './components/email-management/TestEmailModal.svelte';

// Auth Components
export { default as TwoFactorLoadingSteps } from './components/auth/TwoFactorLoadingSteps.svelte';
export { default as TwoFactorStepIndicator } from './components/auth/TwoFactorStepIndicator.svelte';
export { default as TwoFactorQRStep } from './components/auth/TwoFactorQRStep.svelte';
export { default as TwoFactorTokenStep } from './components/auth/TwoFactorTokenStep.svelte';
export { default as TwoFactorBackupStep } from './components/auth/TwoFactorBackupStep.svelte';

// Profile Components
export { default as ProfileReadOnlyView } from './components/profile/ProfileReadOnlyView.svelte';
export { default as ProfileEditForm } from './components/profile/ProfileEditForm.svelte';
export { default as PasswordChangeSection } from './components/profile/PasswordChangeSection.svelte';

// Dashboard Components
export { default as DashboardStatsSection } from './components/dashboard/DashboardStatsSection.svelte';
export { default as EmailVerificationAlert } from './components/EmailVerificationAlert.svelte';
export { default as QuickActionsSection } from './components/dashboard/QuickActionsSection.svelte';
export { default as TokenAnalyticsSection } from './components/dashboard/TokenAnalyticsSection.svelte';
export { default as EmailSystemStatus } from './components/dashboard/EmailSystemStatus.svelte';

// Token Components
export { default as TokensHeader } from './components/tokens/TokensHeader.svelte';
export { default as TokenCard } from './components/tokens/TokenCard.svelte';
export { default as TokenList } from './components/tokens/TokenList.svelte';
export { default as RevokeModal } from './components/tokens/RevokeModal.svelte';

// Callback Components
export { default as CallbackHeader } from './components/callback/CallbackHeader.svelte';
export { default as AuthResultDisplay } from './components/callback/AuthResultDisplay.svelte';
export { default as ImplicitTokenDisplay } from './components/callback/ImplicitTokenDisplay.svelte';
export { default as UsageGuideSection } from './components/callback/UsageGuideSection.svelte';
export { default as TokenInfoTab } from './components/callback/TokenInfoTab.svelte';
export { default as ProfileInfoTab } from './components/callback/ProfileInfoTab.svelte';
export { default as TokenAnalysisTab } from './components/callback/TokenAnalysisTab.svelte';
export { default as TokenModal } from './components/callback/TokenModal.svelte';

// Composables
export { useToast } from './composables/useToast';
export {
	useFieldValidation,
	useFormValidation,
	validators
} from './composables/useFormValidation.svelte';

// Utils
export { inputHandlers, formatters } from './utils/input.utils';

// API
export { apiClient } from './utils/api';
export type {
	CreateClientData,
	EmailQueueStats,
	EmailTestRequest,
	SMTPConnectionStatus
} from './utils/api';

// Permissions
export {
	PermissionUtils,
	PERMISSIONS,
	ROLES,
	ROLE_NAMES,
	PERMISSION_NAMES
} from './utils/permissions';

// Types - re-export from shared package
export type { User } from '@flowauth/shared';
export { USER_TYPES } from '@flowauth/shared';

export interface LoginData {
	email: string;
	password: string;
	recaptchaToken?: string;
}

export interface CreateUserDto {
	email: string;
	password: string;
	username: string;
	firstName: string;
	lastName: string;
	userType?: string;
	recaptchaToken: string;
}

// Stores
export { authState, authStore } from './stores/auth';
export {
	profileState,
	profileStore,
	profileUser,
	isProfileLoading,
	profileError,
	isProfileInitialized
} from './stores/profile';
export { toast } from './stores/toast';
export { twoFactorStore } from './stores/2fa';

// Constants
export {
	APP_CONSTANTS,
	ROUTES,
	API_ENDPOINTS,
	UI_CONSTANTS,
	MESSAGES,
	STYLE_CONSTANTS
} from './constants/app.constants';
export {
	ICONS,
	getRequirementIcon,
	getRequirementStatus,
	createSuccessHint,
	createLoadingHint
} from './constants/icons';

// Error handling
export { errorManager } from './stores/error';
export type { ErrorToast } from './stores/error';
export {
	createApiError,
	getErrorMessage,
	handleFetchError,
	handleJavaScriptError,
	getErrorType,
	getErrorActions
} from './utils/error-handler';
export type { ApiError } from './utils/error-handler';

// Types
export type { ToastMessage } from './stores/toast';
export type {
	PasswordRequirements,
	ValidationResult,
	DuplicationCheckResults
} from './types/auth.types';
