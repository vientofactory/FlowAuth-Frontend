<script lang="ts">
	import { DashboardLayout, Card, Button } from '$lib';
	import { useToast } from '$lib';

	let generalSettings = $state({
		siteName: 'FlowAuth',
		siteDescription: 'OAuth2 인증 시스템',
		adminEmail: 'admin@flowauth.com',
		defaultTokenExpiry: 3600,
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

	function saveGeneralSettings() {
		// TODO: 실제 API 호출
		toast.success('일반 설정이 저장되었습니다.');
	}

	function saveSecuritySettings() {
		// TODO: 실제 API 호출
		toast.success('보안 설정이 저장되었습니다.');
	}

	function saveNotificationSettings() {
		// TODO: 실제 API 호출
		toast.success('알림 설정이 저장되었습니다.');
	}

	function exportData() {
		toast.info('데이터를 내보내는 중...');
		// TODO: 실제 내보내기 로직
	}

	function importData() {
		toast.info('데이터를 가져오는 중...');
		// TODO: 실제 가져오기 로직
	}
</script>

<DashboardLayout title="설정" description="시스템 설정과 환경을 관리하세요." showBackButton={true}>
	<div class="space-y-4 sm:space-y-6">
		<!-- 일반 설정 -->
		<Card>
			<div class="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<h3 class="text-base sm:text-lg font-medium text-gray-900">일반 설정</h3>
				<Button onclick={saveGeneralSettings} class="w-full sm:w-auto h-10 sm:h-11">
					<i class="fas fa-save mr-2"></i>
					저장
				</Button>
			</div>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<label for="site-name" class="block text-sm font-medium text-gray-700 mb-1">사이트 이름</label>
					<input
						id="site-name"
						type="text"
						bind:value={generalSettings.siteName}
						class="w-full h-10 sm:h-11 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 text-base"
					/>
				</div>

				<div>
					<label for="admin-email" class="block text-sm font-medium text-gray-700 mb-1">관리자 이메일</label>
					<input
						id="admin-email"
						type="email"
						bind:value={generalSettings.adminEmail}
						class="w-full h-10 sm:h-11 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 text-base"
					/>
				</div>

				<div class="sm:col-span-2">
					<label for="site-description" class="block text-sm font-medium text-gray-700 mb-1">사이트 설명</label>
					<textarea
						id="site-description"
						bind:value={generalSettings.siteDescription}
						rows="3"
						class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 text-base"
					></textarea>
				</div>

				<div>
					<label for="default-token-expiry" class="block text-sm font-medium text-gray-700 mb-1">
						기본 토큰 만료 시간 (초)
					</label>
					<input
						id="default-token-expiry"
						type="number"
						bind:value={generalSettings.defaultTokenExpiry}
						min="60"
						class="w-full h-10 sm:h-11 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 text-base"
					/>
				</div>

				<div>
					<label for="default-refresh-token-expiry" class="block text-sm font-medium text-gray-700 mb-1">
						리프레시 토큰 만료 시간 (초)
					</label>
					<input
						id="default-refresh-token-expiry"
						type="number"
						bind:value={generalSettings.defaultRefreshTokenExpiry}
						min="3600"
						class="w-full h-10 sm:h-11 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 text-base"
					/>
				</div>
			</div>
		</Card>

		<!-- 보안 설정 -->
		<Card>
			<div class="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<h3 class="text-base sm:text-lg font-medium text-gray-900">보안 설정</h3>
				<Button onclick={saveSecuritySettings} class="w-full sm:w-auto h-10 sm:h-11">
					<i class="fas fa-save mr-2"></i>
					저장
				</Button>
			</div>

			<div class="space-y-4 sm:space-y-6">
				<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border border-gray-200">
					<div class="flex-1">
						<h4 class="text-sm font-medium text-gray-900">2단계 인증</h4>
						<p class="text-xs sm:text-sm text-gray-500 mt-1">추가 보안을 위해 2FA를 활성화합니다.</p>
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

				<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border border-gray-200">
					<div class="flex-1">
						<h4 class="text-sm font-medium text-gray-900">강력한 비밀번호 요구</h4>
						<p class="text-xs sm:text-sm text-gray-500 mt-1">사용자에게 강력한 비밀번호를 요구합니다.</p>
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

				<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border border-gray-200">
					<div class="flex-1">
						<h4 class="text-sm font-medium text-gray-900">로그인 알림</h4>
						<p class="text-xs sm:text-sm text-gray-500 mt-1">새로운 로그인 시 이메일 알림을 보냅니다.</p>
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
						<label for="session-timeout" class="block text-sm font-medium text-gray-700 mb-1">
							세션 타임아웃 (초)
						</label>
						<input
							id="session-timeout"
							type="number"
							bind:value={securitySettings.sessionTimeout}
							min="300"
							class="w-full h-10 sm:h-11 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 text-base"
						/>
					</div>

					<div>
						<label for="max-login-attempts" class="block text-sm font-medium text-gray-700 mb-1">
							최대 로그인 시도 횟수
						</label>
						<input
							id="max-login-attempts"
							type="number"
							bind:value={securitySettings.maxLoginAttempts}
							min="1"
							max="10"
							class="w-full h-10 sm:h-11 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 text-base"
						/>
					</div>
				</div>
			</div>
		</Card>

		<!-- 알림 설정 -->
		<Card>
			<div class="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<h3 class="text-base sm:text-lg font-medium text-gray-900">알림 설정</h3>
				<Button onclick={saveNotificationSettings} class="w-full sm:w-auto h-10 sm:h-11">
					<i class="fas fa-save mr-2"></i>
					저장
				</Button>
			</div>

			<div class="space-y-4 sm:space-y-6">
				<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border border-gray-200">
					<div class="flex-1">
						<h4 class="text-sm font-medium text-gray-900">이메일 알림</h4>
						<p class="text-xs sm:text-sm text-gray-500 mt-1">이메일로 알림을 받습니다.</p>
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

				<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border border-gray-200">
					<div class="flex-1">
						<h4 class="text-sm font-medium text-gray-900">새 클라이언트 알림</h4>
						<p class="text-xs sm:text-sm text-gray-500 mt-1">새 클라이언트 등록 시 알림을 받습니다.</p>
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

				<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border border-gray-200">
					<div class="flex-1">
						<h4 class="text-sm font-medium text-gray-900">보안 경고</h4>
						<p class="text-xs sm:text-sm text-gray-500 mt-1">보안 관련 경고를 받습니다.</p>
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
			<h3 class="mb-4 sm:mb-6 text-base sm:text-lg font-medium text-gray-900">데이터 관리</h3>
			<div class="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
				<Button variant="outline" onclick={exportData} class="h-10 sm:h-11">
					<i class="fas fa-download mr-2"></i>
					데이터 내보내기
				</Button>
				<Button variant="outline" onclick={importData} class="h-10 sm:h-11">
					<i class="fas fa-upload mr-2"></i>
					데이터 가져오기
				</Button>
			</div>
			<p class="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-500">
				시스템 데이터를 백업하거나 복원할 수 있습니다. 중요한 작업이므로 신중하게 진행하세요.
			</p>
		</Card>
	</div>
</DashboardLayout>
