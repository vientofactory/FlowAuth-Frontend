<script lang="ts">
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import QRCode from '$lib/components/QRCode.svelte';
	import type { TwoFactorSetup } from '$lib/types/2fa.types';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faMobileAlt, faTimes, faArrowRight } from '@fortawesome/free-solid-svg-icons';

	interface Props {
		setupData: TwoFactorSetup;
		onNext: () => void;
		onCancel: () => void;
	}

	let { setupData, onNext, onCancel }: Props = $props();
</script>

<Card>
	<div class="p-6">
		<div class="text-center">
			<div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
				<FontAwesomeIcon icon={faMobileAlt} class="text-xl text-blue-600" />
			</div>
			<h2 class="mb-2 text-xl font-bold text-gray-900">1단계: 인증 앱 설정</h2>
			<p class="mb-6 text-gray-600">
				Google Authenticator, Authy 등의 인증 앱을 사용하여 QR 코드를 스캔하세요.
			</p>
		</div>

		<div class="mb-6 flex justify-center">
			<QRCode qrCodeUrl={setupData.qrCodeUrl} secret={setupData.secret} size={250} />
		</div>

		<div class="mb-6 rounded-lg bg-gray-50 p-4">
			<h3 class="mb-3 font-semibold text-gray-900">설정 방법:</h3>
			<ol class="space-y-2 text-sm text-gray-700">
				<li class="flex items-start">
					<span
						class="mr-2 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600"
						>1</span
					>
					인증 앱을 실행하세요
				</li>
				<li class="flex items-start">
					<span
						class="mr-2 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600"
						>2</span
					>
					QR 코드를 스캔하거나 시크릿 키를 수동으로 입력하세요
				</li>
				<li class="flex items-start">
					<span
						class="mr-2 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600"
						>3</span
					>
					생성된 6자리 토큰을 다음 단계에서 입력하세요
				</li>
			</ol>
		</div>

		<div class="flex justify-between">
			<Button variant="outline" onclick={onCancel}>
				<FontAwesomeIcon icon={faTimes} class="mr-2" />
				취소
			</Button>
			<Button onclick={onNext}>
				<FontAwesomeIcon icon={faArrowRight} class="mr-2" />
				다음
			</Button>
		</div>
	</div>
</Card>
