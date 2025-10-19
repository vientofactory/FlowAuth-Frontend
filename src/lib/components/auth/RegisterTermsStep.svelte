<script lang="ts">
	interface Props {
		termsAccepted: boolean;
		privacyAccepted: boolean;
		isLoading: boolean;
		firstName: string;
		lastName: string;
		username: string;
		email: string;
		userType: string;
	}

	let {
		termsAccepted = $bindable(),
		privacyAccepted = $bindable(),
		isLoading,
		firstName,
		lastName,
		username,
		email,
		userType
	}: Props = $props();

	// 사용자 타입 표시 텍스트
	function getUserTypeDisplay(type: string): { label: string; badge: string; badgeColor: string } {
		switch (type) {
			case 'DEVELOPER':
				return {
					label: '개발자',
					badge: '고급',
					badgeColor: 'bg-green-100 text-green-800'
				};
			case 'REGULAR':
			default:
				return {
					label: '일반 사용자',
					badge: '기본',
					badgeColor: 'bg-blue-100 text-blue-800'
				};
		}
	}

	let userTypeInfo = $derived(getUserTypeDisplay(userType));
</script>

<div class="space-y-6">
	<!-- 입력 정보 요약 -->
	<div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
		<h3 class="mb-4 flex items-center text-lg font-semibold text-gray-900">
			<i class="fas fa-user-check mr-2 text-blue-600"></i>
			입력하신 정보를 확인해주세요
		</h3>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<!-- 기본 정보 -->
			<div class="space-y-3">
				<div class="rounded-lg border border-blue-100 bg-white p-3">
					<h4 class="mb-2 text-sm font-medium text-gray-700">기본 정보</h4>
					<div class="space-y-2 text-sm">
						<div class="flex justify-between">
							<span class="text-gray-600">이름:</span>
							<span class="font-medium text-gray-900">{firstName} {lastName}</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-gray-600">사용자 유형:</span>
							<div class="flex items-center space-x-2">
								<span class="font-medium text-gray-900">{userTypeInfo.label}</span>
								<span
									class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {userTypeInfo.badgeColor}"
								>
									{userTypeInfo.badge}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- 계정 정보 -->
			<div class="space-y-3">
				<div class="rounded-lg border border-blue-100 bg-white p-3">
					<h4 class="mb-2 text-sm font-medium text-gray-700">계정 정보</h4>
					<div class="space-y-2 text-sm">
						<div class="flex justify-between">
							<span class="text-gray-600">사용자명:</span>
							<span class="font-medium text-gray-900">{username}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-600">이메일:</span>
							<span class="font-medium break-all text-gray-900">{email}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="mt-4 rounded-lg border border-blue-100 bg-white p-3">
			<div class="flex items-start space-x-2">
				<i class="fas fa-info-circle mt-0.5 text-blue-500"></i>
				<div class="text-sm text-gray-600">
					<strong>안내:</strong> 회원가입 완료 후 위 정보는 프로필 페이지에서 수정할 수 있습니다. 단,
					사용자 유형은 변경할 수 없으니 신중히 선택해주세요.
				</div>
			</div>
		</div>
	</div>

	<div class="space-y-4">
		<!-- 서비스 이용약관 -->
		<div class="rounded-lg border border-gray-200 p-4">
			<label class="flex cursor-pointer items-start space-x-3">
				<input
					type="checkbox"
					bind:checked={termsAccepted}
					disabled={isLoading}
					class="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
				/>
				<div class="min-w-0 flex-1">
					<div class="text-sm font-medium text-gray-900">서비스 이용약관 동의 (필수)</div>
					<div class="mt-1 text-xs text-gray-500">FlowAuth 서비스 이용을 위한 필수 약관입니다.</div>
				</div>
			</label>
		</div>

		<!-- 개인정보 처리방침 -->
		<div class="rounded-lg border border-gray-200 p-4">
			<label class="flex cursor-pointer items-start space-x-3">
				<input
					type="checkbox"
					bind:checked={privacyAccepted}
					disabled={isLoading}
					class="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
				/>
				<div class="min-w-0 flex-1">
					<div class="text-sm font-medium text-gray-900">개인정보 처리방침 동의 (필수)</div>
					<div class="mt-1 text-xs text-gray-500">
						개인정보 수집 및 이용에 대한 필수 동의입니다.
					</div>
				</div>
			</label>
		</div>

		<!-- 전체 동의 -->
		<div class="border-t border-gray-200 pt-4">
			<label class="flex cursor-pointer items-center space-x-3">
				<input
					type="checkbox"
					checked={termsAccepted && privacyAccepted}
					onchange={(e) => {
						const checked = e.currentTarget.checked;
						termsAccepted = checked;
						privacyAccepted = checked;
					}}
					disabled={isLoading}
					class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
				/>
				<span class="text-sm font-medium text-gray-900"> 전체 약관에 동의합니다 </span>
			</label>
		</div>
	</div>
</div>
