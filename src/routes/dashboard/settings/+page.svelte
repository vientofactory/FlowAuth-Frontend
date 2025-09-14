<script lang="ts">
	import { DashboardLayout, Card, Button, Badge } from '$lib';
	import { authState, useToast } from '$lib';
	import { onMount } from 'svelte';

	// 설정 상태
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

<DashboardLayout
	title="설정"
	description="시스템 설정과 환경을 관리하세요."
	showBackButton={true}
>
	{#snippet children()}
		<div class="space-y-6">
			<!-- 일반 설정 -->
			<Card>
				<div class="flex items-center justify-between mb-6">
					<h3 class="text-lg font-medium text-gray-900">일반 설정</h3>
					<Button onclick={saveGeneralSettings}>
						<i class="fas fa-save mr-2"></i>
						저장
					</Button>
				</div>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div>
						<label class="block text-sm font-medium text-gray-700">사이트 이름</label>
						<input
							type="text"
							bind:value={generalSettings.siteName}
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700">관리자 이메일</label>
						<input
							type="email"
							bind:value={generalSettings.adminEmail}
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						/>
					</div>

					<div class="sm:col-span-2">
						<label class="block text-sm font-medium text-gray-700">사이트 설명</label>
						<textarea
							bind:value={generalSettings.siteDescription}
							rows="3"
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						></textarea>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700">기본 토큰 만료 시간 (초)</label>
						<input
							type="number"
							bind:value={generalSettings.defaultTokenExpiry}
							min="60"
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700">리프레시 토큰 만료 시간 (초)</label>
						<input
							type="number"
							bind:value={generalSettings.defaultRefreshTokenExpiry}
							min="3600"
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						/>
					</div>
				</div>
			</Card>

			<!-- 보안 설정 -->
			<Card>
				<div class="flex items-center justify-between mb-6">
					<h3 class="text-lg font-medium text-gray-900">보안 설정</h3>
					<Button onclick={saveSecuritySettings}>
						<i class="fas fa-save mr-2"></i>
						저장
					</Button>
				</div>

				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<div>
							<h4 class="text-sm font-medium text-gray-900">2단계 인증</h4>
							<p class="text-sm text-gray-500">추가 보안을 위해 2FA를 활성화합니다.</p>
						</div>
						<label class="relative inline-flex items-center cursor-pointer">
							<input
								type="checkbox"
								bind:checked={securitySettings.enableTwoFactor}
								class="sr-only peer"
							/>
							<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
						</label>
					</div>

					<div class="flex items-center justify-between">
						<div>
							<h4 class="text-sm font-medium text-gray-900">강력한 비밀번호 요구</h4>
							<p class="text-sm text-gray-500">사용자에게 강력한 비밀번호를 요구합니다.</p>
						</div>
						<label class="relative inline-flex items-center cursor-pointer">
							<input
								type="checkbox"
								bind:checked={securitySettings.requireStrongPasswords}
								class="sr-only peer"
							/>
							<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
						</label>
					</div>

					<div class="flex items-center justify-between">
						<div>
							<h4 class="text-sm font-medium text-gray-900">로그인 알림</h4>
							<p class="text-sm text-gray-500">새로운 로그인 시 이메일 알림을 보냅니다.</p>
						</div>
						<label class="relative inline-flex items-center cursor-pointer">
							<input
								type="checkbox"
								bind:checked={securitySettings.enableLoginNotifications}
								class="sr-only peer"
							/>
							<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
						</label>
					</div>

					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div>
							<label class="block text-sm font-medium text-gray-700">세션 타임아웃 (초)</label>
							<input
								type="number"
								bind:value={securitySettings.sessionTimeout}
								min="300"
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
							/>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700">최대 로그인 시도 횟수</label>
							<input
								type="number"
								bind:value={securitySettings.maxLoginAttempts}
								min="1"
								max="10"
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
							/>
						</div>
					</div>
				</div>
			</Card>

			<!-- 알림 설정 -->
			<Card>
				<div class="flex items-center justify-between mb-6">
					<h3 class="text-lg font-medium text-gray-900">알림 설정</h3>
					<Button onclick={saveNotificationSettings}>
						<i class="fas fa-save mr-2"></i>
						저장
					</Button>
				</div>

				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<div>
							<h4 class="text-sm font-medium text-gray-900">이메일 알림</h4>
							<p class="text-sm text-gray-500">이메일로 알림을 받습니다.</p>
						</div>
						<label class="relative inline-flex items-center cursor-pointer">
							<input
								type="checkbox"
								bind:checked={notificationSettings.emailNotifications}
								class="sr-only peer"
							/>
							<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
						</label>
					</div>

					<div class="flex items-center justify-between">
						<div>
							<h4 class="text-sm font-medium text-gray-900">새 클라이언트 알림</h4>
							<p class="text-sm text-gray-500">새 클라이언트 등록 시 알림을 받습니다.</p>
						</div>
						<label class="relative inline-flex items-center cursor-pointer">
							<input
								type="checkbox"
								bind:checked={notificationSettings.newClientNotifications}
								class="sr-only peer"
							/>
							<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
						</label>
					</div>

					<div class="flex items-center justify-between">
						<div>
							<h4 class="text-sm font-medium text-gray-900">보안 경고</h4>
							<p class="text-sm text-gray-500">보안 관련 경고를 받습니다.</p>
						</div>
						<label class="relative inline-flex items-center cursor-pointer">
							<input
								type="checkbox"
								bind:checked={notificationSettings.securityAlerts}
								class="sr-only peer"
							/>
							<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
						</label>
					</div>
				</div>
			</Card>

			<!-- 데이터 관리 -->
			<Card>
				<h3 class="text-lg font-medium text-gray-900 mb-6">데이터 관리</h3>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<Button variant="outline" onclick={exportData}>
						<i class="fas fa-download mr-2"></i>
						데이터 내보내기
					</Button>
					<Button variant="outline" onclick={importData}>
						<i class="fas fa-upload mr-2"></i>
						데이터 가져오기
					</Button>
				</div>
				<p class="mt-4 text-sm text-gray-500">
					시스템 데이터를 백업하거나 복원할 수 있습니다. 중요한 작업이므로 신중하게 진행하세요.
				</p>
			</Card>
		</div>
	{/snippet}
</DashboardLayout>