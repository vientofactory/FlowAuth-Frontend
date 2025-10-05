<script lang="ts">
	import { useToast } from '$lib';
	import { onMount } from 'svelte';

	interface Props {
		onCallbackProcessed: (data: {
			authCode: string;
			oauthState: string;
			oauthNonce: string;
			error: string;
			implicitAccessToken: string;
			implicitIdToken: string;
		}) => void;
	}

	let { onCallbackProcessed }: Props = $props();

	const toast = useToast();

	// 콜백 처리 함수
	function processOAuthCallback() {
		// URL 파라미터에서 코드와 상태 추출
		const urlParams = new URLSearchParams(window.location.search);
		const hashParams = new URLSearchParams(window.location.hash.substring(1));

		let authCode = urlParams.get('code') || '';
		let oauthState = urlParams.get('state') || '';
		let oauthNonce = urlParams.get('nonce') || '';
		let error = urlParams.get('error') || '';
		let errorDescription = urlParams.get('error_description') || '';

		// Implicit Grant의 경우 해시에서 토큰 추출
		let implicitAccessToken = hashParams.get('access_token') || '';
		let implicitIdToken = hashParams.get('id_token') || '';
		let _implicitState = hashParams.get('state') || '';

		// Implicit Grant 토큰 정보 표시
		if (implicitIdToken) {
			toast.success('ID 토큰을 받았습니다!');
		}
		if (implicitAccessToken) {
			toast.success('액세스 토큰을 받았습니다!');
		}

		// 세션 스토리지에서 state, nonce 가져오기
		const storedState = sessionStorage.getItem('state');
		const storedNonce = sessionStorage.getItem('oauth_nonce');

		// state 검증
		if (storedState && oauthState && storedState !== oauthState) {
			toast.warning('State 파라미터가 일치하지 않습니다. 보안 문제가 있을 수 있습니다.');
		}

		// nonce 검증 (OIDC인 경우)
		if (storedNonce && oauthNonce && storedNonce !== oauthNonce) {
			toast.warning('Nonce 파라미터가 일치하지 않습니다. 보안 문제가 있을 수 있습니다.');
		} else if (storedNonce && !oauthNonce) {
			toast.warning(
				'Nonce 파라미터가 누락되었습니다. OIDC 요청의 경우 보안 문제가 있을 수 있습니다.'
			);
		}

		// 에러가 있는 경우 토스트로 표시
		if (error) {
			toast.error(`OAuth2 인증 에러: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`);
		} else if (authCode) {
			toast.success('인증 코드를 받았습니다. 토큰으로 교환해보세요!');
		} else if (!implicitAccessToken && !implicitIdToken) {
			toast.info('인증 파라미터가 없습니다. OAuth2 인증을 시작해보세요.');
		}

		// 콜백 처리 완료 이벤트 발생
		onCallbackProcessed({
			authCode,
			oauthState,
			oauthNonce,
			error,
			implicitAccessToken,
			implicitIdToken
		});
	}

	onMount(() => {
		processOAuthCallback();
	});
</script>
