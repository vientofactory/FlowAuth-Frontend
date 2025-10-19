<script lang="ts">
	import { Card, Button, Badge, PermissionUtils } from '$lib';
	import type { User } from '$lib';
	import type { TwoFactorState } from '$lib/stores/2fa';

	interface Props {
		user: User;
		twoFactorState: TwoFactorState;
		onDisableTwoFactorDialogOpen: () => void;
		onGoToTwoFactorSetup: () => void;
	}

	let { user, twoFactorState, onDisableTwoFactorDialogOpen, onGoToTwoFactorSetup }: Props =
		$props();
</script>

<div class="space-y-6">
	<!-- 계정 상태 -->
	<Card>
		<h3 class="mb-4 text-lg font-medium text-gray-900">계정 상태</h3>
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<span class="text-sm text-gray-600">상태</span>
				{#if user.isActive}
					<Badge variant="success" size="sm">활성</Badge>
				{:else}
					<Badge variant="warning" size="sm">비활성</Badge>
				{/if}
			</div>
			<div class="flex items-center justify-between">
				<span class="text-sm text-gray-600">역할</span>
				{#if user.permissions !== undefined}
					<Badge variant="info" size="sm">
						{PermissionUtils.getRoleName(Number(user.permissions))}
					</Badge>
				{:else}
					<Badge variant="secondary" size="sm">권한 없음</Badge>
				{/if}
			</div>
			<div class="flex items-center justify-between">
				<span class="text-sm text-gray-600">세부 권한</span>
				{#if user.permissions !== undefined}
					<div class="flex max-w-48 flex-wrap gap-1">
						{#each PermissionUtils.getPermissionNames(Number(user.permissions)) as permission (permission)}
							<Badge variant="secondary" size="xs">{permission}</Badge>
						{/each}
					</div>
				{:else}
					<Badge variant="secondary" size="sm">권한 없음</Badge>
				{/if}
			</div>
			<div class="flex items-center justify-between">
				<span class="text-sm text-gray-600">2FA</span>
				{#if twoFactorState.isLoading}
					<div class="flex items-center space-x-2">
						<i class="fas fa-spinner fa-spin text-gray-400"></i>
						<span class="text-sm text-gray-500">확인 중...</span>
					</div>
				{:else if twoFactorState.status?.enabled}
					<div class="flex items-center space-x-3">
						<div class="flex items-center space-x-2">
							<Badge variant="success" size="sm">활성</Badge>
							{#if twoFactorState.status.hasBackupCodes}
								<span class="text-xs text-green-600">백업 코드 있음</span>
							{:else}
								<span class="text-xs text-yellow-600">백업 코드 필요</span>
							{/if}
						</div>
						<Button
							variant="outline"
							size="xs"
							onclick={onDisableTwoFactorDialogOpen}
							class="text-red-600 hover:bg-red-50 hover:text-red-700"
						>
							비활성화
						</Button>
					</div>
				{:else}
					<div class="flex items-center space-x-2">
						<Badge variant="secondary" size="sm">비활성</Badge>
						<Button variant="outline" size="xs" onclick={onGoToTwoFactorSetup}>설정</Button>
					</div>
				{/if}
			</div>
		</div>
	</Card>

	<!-- 계정 정보 -->
	<Card>
		<h3 class="mb-4 text-lg font-medium text-gray-900">계정 정보</h3>
		<div class="space-y-3">
			<div>
				<span class="text-sm text-gray-600">사용자 ID</span>
				<p class="text-sm text-gray-900">#{user.id}</p>
			</div>
			<div>
				<span class="text-sm text-gray-600">가입일</span>
				<p class="text-sm text-gray-900">
					{user.createdAt
						? new Date(user.createdAt).toLocaleDateString('ko-KR', {
								year: 'numeric',
								month: 'long',
								day: 'numeric'
							})
						: '정보 없음'}
				</p>
			</div>
			<div>
				<span class="text-sm text-gray-600">마지막 로그인</span>
				<p class="text-sm text-gray-900">
					{user.lastLoginAt
						? new Date(user.lastLoginAt).toLocaleDateString('ko-KR', {
								year: 'numeric',
								month: 'long',
								day: 'numeric'
							})
						: '정보 없음'}
				</p>
			</div>
			<div>
				<span class="text-sm text-gray-600">이메일 인증</span>
				<p class="text-sm text-gray-900">
					{user.isEmailVerified ? '인증됨' : '미인증'}
				</p>
			</div>
		</div>
	</Card>

	<!-- 보안 설정 -->
	<Card>
		<h3 class="mb-4 text-lg font-medium text-gray-900">보안 설정</h3>
		<div class="space-y-3">
			<Button variant="outline" class="w-full justify-start" onclick={onGoToTwoFactorSetup}>
				<i class="fas fa-mobile-alt mr-2"></i>
				{#if twoFactorState.status?.enabled}
					2단계 인증 관리
				{:else}
					2단계 인증 설정
				{/if}
			</Button>
		</div>
	</Card>

	<!-- 위험 구역 -->
	<Card class="border-red-200">
		<h3 class="mb-4 text-lg font-medium text-red-900">위험 구역</h3>
		<div class="space-y-3">
			<div class="rounded-md bg-red-50 p-3">
				<p class="text-sm text-red-800">
					아래 작업들은 신중하게 고려하세요. 일부 작업은 되돌릴 수 없습니다.
				</p>
			</div>
			<Button
				variant="outline"
				class="w-full justify-start border-red-300 text-red-600 hover:bg-red-50"
			>
				<i class="fas fa-trash mr-2"></i>
				계정 삭제
			</Button>
		</div>
	</Card>
</div>
