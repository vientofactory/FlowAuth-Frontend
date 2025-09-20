<script lang="ts">
	import { DashboardLayout, Card, Button, FormField, TextareaField } from '$lib';
	import { useToast } from '$lib';
	import { onMount } from 'svelte';
	import { apiClient } from '$lib';

	let generalSettings = $state({
		siteName: 'FlowAuth',
		siteDescription: 'OAuth2 인증 시스템',
		adminEmail: 'admin@flowauth.com',
		defaultTokenExpiry: 86400,
		defaultRefreshTokenExpiry: 86400 * 30
	});

	let securitySettings = $state({
		enableTwoFactor: false,
		requireStrongPasswords: true,
		enableLoginNotifications: true,
		sessionTimeout: 1800,
		maxLoginAttempts: 5,
		enableAuditLog: true
	});

	let notificationSettings = $state({
		emailNotifications: true,
		newClientNotifications: true,
		tokenExpiryNotifications: true,
		securityAlerts: true,
		systemUpdates: false
	});

	const toast = useToast();

	onMount(async () => {
		await loadSettings();
	});

	async function loadSettings() {
		try {
			const [general, security, notifications] = await Promise.all([
				apiClient.getGeneralSettings(),
				apiClient.getSecuritySettings(),
				apiClient.getNotificationSettings()
			]);

			generalSettings = general;
			securitySettings = security;
			notificationSettings = notifications;
		} catch (error) {
			console.error('Failed to load settings:', error);
			toast.error('설정을 불러오는데 실패했습니다.');
		}
	}

	async function saveGeneralSettings() {
		try {
			await apiClient.updateGeneralSettings(generalSettings);
			toast.success('일반 설정이 저장되었습니다.');
		} catch (error) {
			console.error('Failed to save general settings:', error);
			toast.error('일반 설정 저장에 실패했습니다.');
		}
	}

	async function saveSecuritySettings() {
		try {
			await apiClient.updateSecuritySettings(securitySettings);
			toast.success('보안 설정이 저장되었습니다.');
		} catch (error) {
			console.error('Failed to save security settings:', error);
			toast.error('보안 설정 저장에 실패했습니다.');
		}
	}

	async function saveNotificationSettings() {
		try {
			await apiClient.updateNotificationSettings(notificationSettings);
			toast.success('알림 설정이 저장되었습니다.');
		} catch (error) {
			console.error('Failed to save notification settings:', error);
			toast.error('알림 설정 저장에 실패했습니다.');
		}
	}

	// 실제 데이터 내보내기 구현
	async function exportData() {
		try {
			const exportData = await apiClient.exportSettings();

			// JSON 파일로 다운로드
			const dataStr = JSON.stringify(exportData, null, 2);
			const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

			const exportFileDefaultName = `flowauth-settings-${new Date().toISOString().split('T')[0]}.json`;

			const linkElement = document.createElement('a');
			linkElement.setAttribute('href', dataUri);
			linkElement.setAttribute('download', exportFileDefaultName);
			linkElement.click();

			toast.success('설정이 성공적으로 내보내졌습니다.');
		} catch (error) {
			console.error('Failed to export settings:', error);
			toast.error('설정 내보내기에 실패했습니다.');
		}
	}

	// 실제 데이터 가져오기 구현
	async function importData() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';

		input.onchange = async (event) => {
			const file = (event.target as HTMLInputElement).files?.[0];
			if (!file) return;

			try {
				const text = await file.text();
				const importData = JSON.parse(text);

				// 데이터 유효성 검증
				if (
					!importData.data ||
					!importData.data.general ||
					!importData.data.security ||
					!importData.data.notification
				) {
					throw new Error('잘못된 파일 형식입니다.');
				}

				await apiClient.importSettings(importData.data);

				// 설정 다시 로드
				await loadSettings();

				toast.success('설정이 성공적으로 가져와졌습니다.');
			} catch (error) {
				console.error('Failed to import settings:', error);
				toast.error('설정 가져오기에 실패했습니다. 파일 형식을 확인해주세요.');
			}
		};

		input.click();
	}
</script>

<DashboardLayout title="설정" description="시스템 설정과 환경을 관리하세요." showBackButton={true}>
	<div class="space-y-4 sm:space-y-6">
		<!-- 일반 설정 -->
		<Card>
			<div class="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
				<h3 class="text-base font-medium text-gray-900 sm:text-lg">일반 설정</h3>
				<Button onclick={saveGeneralSettings} class="h-10 w-full sm:h-11 sm:w-auto">
					<i class="fas fa-save mr-2"></i>
					저장
				</Button>
			</div>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<FormField
					name="siteName"
					label="사이트 이름"
					type="text"
					bind:value={generalSettings.siteName}
					class="h-10 sm:h-11"
				/>

				<FormField
					name="adminEmail"
					label="관리자 이메일"
					type="email"
					bind:value={generalSettings.adminEmail}
					class="h-10 sm:h-11"
				/>

				<div class="sm:col-span-2">
					<TextareaField
						name="siteDescription"
						label="사이트 설명"
						bind:value={generalSettings.siteDescription}
						rows={3}
					/>
				</div>

				<FormField
					name="defaultTokenExpiry"
					label="기본 토큰 만료 시간 (초)"
					type="text"
					value={String(generalSettings.defaultTokenExpiry)}
					oninput={(e) =>
						(generalSettings.defaultTokenExpiry =
							parseInt((e.target as HTMLInputElement).value) || 60)}
					inputmode="numeric"
					class="h-10 sm:h-11"
				/>

				<FormField
					name="defaultRefreshTokenExpiry"
					label="리프레시 토큰 만료 시간 (초)"
					type="text"
					value={String(generalSettings.defaultRefreshTokenExpiry)}
					oninput={(e) =>
						(generalSettings.defaultRefreshTokenExpiry =
							parseInt((e.target as HTMLInputElement).value) || 3600)}
					inputmode="numeric"
					class="h-10 sm:h-11"
				/>
			</div>
		</Card>

		<!-- 보안 설정 -->
		<Card>
			<div class="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
				<h3 class="text-base font-medium text-gray-900 sm:text-lg">보안 설정</h3>
				<Button onclick={saveSecuritySettings} class="h-10 w-full sm:h-11 sm:w-auto">
					<i class="fas fa-save mr-2"></i>
					저장
				</Button>
			</div>

			<div class="space-y-4 sm:space-y-6">
				<div
					class="flex flex-col gap-3 rounded-lg border border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4"
				>
					<div class="flex-1">
						<h4 class="text-sm font-medium text-gray-900">2단계 인증</h4>
						<p class="mt-1 text-xs text-gray-500 sm:text-sm">
							추가 보안을 위해 2FA를 활성화합니다.
						</p>
					</div>
					<label class="relative inline-flex cursor-pointer items-center">
						<input
							type="checkbox"
							bind:checked={securitySettings.enableTwoFactor}
							class="peer sr-only"
						/>
						<div
							class="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
						></div>
					</label>
				</div>

				<div
					class="flex flex-col gap-3 rounded-lg border border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4"
				>
					<div class="flex-1">
						<h4 class="text-sm font-medium text-gray-900">강력한 비밀번호 요구</h4>
						<p class="mt-1 text-xs text-gray-500 sm:text-sm">
							사용자에게 강력한 비밀번호를 요구합니다.
						</p>
					</div>
					<label class="relative inline-flex cursor-pointer items-center">
						<input
							type="checkbox"
							bind:checked={securitySettings.requireStrongPasswords}
							class="peer sr-only"
						/>
						<div
							class="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
						></div>
					</label>
				</div>

				<div
					class="flex flex-col gap-3 rounded-lg border border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4"
				>
					<div class="flex-1">
						<h4 class="text-sm font-medium text-gray-900">로그인 알림</h4>
						<p class="mt-1 text-xs text-gray-500 sm:text-sm">
							새로운 로그인 시 이메일 알림을 보냅니다.
						</p>
					</div>
					<label class="relative inline-flex cursor-pointer items-center">
						<input
							type="checkbox"
							bind:checked={securitySettings.enableLoginNotifications}
							class="peer sr-only"
						/>
						<div
							class="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
						></div>
					</label>
				</div>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div>
						<label for="session-timeout" class="mb-1 block text-sm font-medium text-gray-700">
							세션 타임아웃 (초)
						</label>
						<input
							id="session-timeout"
							type="number"
							bind:value={securitySettings.sessionTimeout}
							min="300"
							class="h-10 w-full rounded-md border-gray-300 px-3 text-base shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:h-11"
						/>
					</div>

					<div>
						<label for="max-login-attempts" class="mb-1 block text-sm font-medium text-gray-700">
							최대 로그인 시도 횟수
						</label>
						<input
							id="max-login-attempts"
							type="number"
							bind:value={securitySettings.maxLoginAttempts}
							min="1"
							max="10"
							class="h-10 w-full rounded-md border-gray-300 px-3 text-base shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:h-11"
						/>
					</div>
				</div>
			</div>
		</Card>

		<!-- 알림 설정 -->
		<Card>
			<div class="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
				<h3 class="text-base font-medium text-gray-900 sm:text-lg">알림 설정</h3>
				<Button onclick={saveNotificationSettings} class="h-10 w-full sm:h-11 sm:w-auto">
					<i class="fas fa-save mr-2"></i>
					저장
				</Button>
			</div>

			<div class="space-y-4 sm:space-y-6">
				<div
					class="flex flex-col gap-3 rounded-lg border border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4"
				>
					<div class="flex-1">
						<h4 class="text-sm font-medium text-gray-900">이메일 알림</h4>
						<p class="mt-1 text-xs text-gray-500 sm:text-sm">이메일로 알림을 받습니다.</p>
					</div>
					<label class="relative inline-flex cursor-pointer items-center">
						<input
							type="checkbox"
							bind:checked={notificationSettings.emailNotifications}
							class="peer sr-only"
						/>
						<div
							class="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
						></div>
					</label>
				</div>

				<div
					class="flex flex-col gap-3 rounded-lg border border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4"
				>
					<div class="flex-1">
						<h4 class="text-sm font-medium text-gray-900">새 클라이언트 알림</h4>
						<p class="mt-1 text-xs text-gray-500 sm:text-sm">
							새 클라이언트 등록 시 알림을 받습니다.
						</p>
					</div>
					<label class="relative inline-flex cursor-pointer items-center">
						<input
							type="checkbox"
							bind:checked={notificationSettings.newClientNotifications}
							class="peer sr-only"
						/>
						<div
							class="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
						></div>
					</label>
				</div>

				<div
					class="flex flex-col gap-3 rounded-lg border border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4"
				>
					<div class="flex-1">
						<h4 class="text-sm font-medium text-gray-900">보안 경고</h4>
						<p class="mt-1 text-xs text-gray-500 sm:text-sm">보안 관련 경고를 받습니다.</p>
					</div>
					<label class="relative inline-flex cursor-pointer items-center">
						<input
							type="checkbox"
							bind:checked={notificationSettings.securityAlerts}
							class="peer sr-only"
						/>
						<div
							class="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
						></div>
					</label>
				</div>
			</div>
		</Card>

		<!-- 데이터 관리 -->
		<Card>
			<h3 class="mb-4 text-base font-medium text-gray-900 sm:mb-6 sm:text-lg">데이터 관리</h3>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
				<Button variant="outline" onclick={exportData} class="h-10 sm:h-11">
					<i class="fas fa-download mr-2"></i>
					데이터 내보내기
				</Button>
				<Button variant="outline" onclick={importData} class="h-10 sm:h-11">
					<i class="fas fa-upload mr-2"></i>
					데이터 가져오기
				</Button>
			</div>
			<p class="mt-3 text-xs text-gray-500 sm:mt-4 sm:text-sm">
				시스템 데이터를 백업하거나 복원할 수 있습니다. 중요한 작업이므로 신중하게 진행하세요.
			</p>
		</Card>
	</div>
</DashboardLayout>
