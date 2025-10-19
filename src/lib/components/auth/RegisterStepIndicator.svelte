<script lang="ts">
	interface Props {
		currentStep: number;
		totalSteps: number;
		currentStepValid: boolean;
	}

	let { currentStep, totalSteps, currentStepValid }: Props = $props();

	// 단계별 정보
	function getStepInfo(step: number) {
		switch (step) {
			case 1:
				return {
					title: '기본 정보',
					description: '이름과 사용자 유형을 입력해주세요',
					requirement: '이름과 성을 각각 2글자 이상 입력해주세요'
				};
			case 2:
				return {
					title: '계정 정보',
					description: '사용자 이름과 이메일을 설정해주세요',
					requirement:
						'사용자 이름(3글자 이상, 영문/숫자/언더스코어만)과 유효한 이메일을 입력해주세요'
				};
			case 3:
				return {
					title: '비밀번호 설정',
					description: '안전한 비밀번호를 설정해주세요',
					requirement: '모든 비밀번호 요구사항을 만족하고 비밀번호 확인이 일치해야 합니다'
				};
			case 4:
				return {
					title: '정보 확인 및 약관 동의',
					description: '입력하신 정보를 확인하고 약관에 동의해주세요',
					requirement: '필수 약관에 동의해주세요'
				};
			default:
				return { title: '회원가입', description: '새 계정을 만들어주세요', requirement: '' };
		}
	}

	let stepInfo = $derived(getStepInfo(currentStep));
</script>

<div class="mb-6">
	<div class="mb-4 flex items-center justify-between">
		{#each Array(totalSteps) as _, index (index)}
			{@const stepNumber = index + 1}
			{@const isActive = stepNumber === currentStep}
			{@const isCompleted = stepNumber < currentStep}
			<div class="flex items-center">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300 {isCompleted
						? 'border-green-500 bg-green-500 text-white'
						: isActive
							? 'border-blue-500 bg-blue-500 text-white'
							: 'border-gray-300 bg-white text-gray-400'}"
				>
					{#if isCompleted}
						<i class="fas fa-check text-xs"></i>
					{:else}
						{stepNumber}
					{/if}
				</div>
				{#if index < totalSteps - 1}
					<div
						class="mx-2 h-1 w-12 rounded-full transition-all duration-300 {stepNumber < currentStep
							? 'bg-green-500'
							: 'bg-gray-200'}"
					></div>
				{/if}
			</div>
		{/each}
	</div>
	<div class="text-center">
		<h2 class="text-xl font-bold text-gray-900 sm:text-2xl">{stepInfo.title}</h2>
		<p class="text-sm text-gray-600 sm:text-base">{stepInfo.description}</p>

		<!-- 단계별 요구사항 안내 -->
		{#if !currentStepValid}
			<div class="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
				<div class="flex items-center">
					<i class="fas fa-exclamation-triangle mr-2 text-amber-500"></i>
					<div class="text-left">
						<p class="text-sm text-amber-700">
							<strong>완료 조건:</strong>
							{stepInfo.requirement}
						</p>
					</div>
				</div>
			</div>
		{:else}
			<div class="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
				<div class="flex items-center justify-center">
					<i class="fas fa-check-circle mr-2 text-green-500"></i>
					<p class="text-sm text-green-700">
						<strong>모든 요구사항이 충족되었습니다!</strong> 다음 단계로 진행할 수 있습니다.
					</p>
				</div>
			</div>
		{/if}
	</div>
</div>
