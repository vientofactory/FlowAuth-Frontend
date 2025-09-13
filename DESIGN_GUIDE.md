# FlowAuth 디자인 시스템 가이드

## 🎨 색상 팔레트 (Color Palette)

### Primary Colors

```css
/* 메인 브랜드 색상 */
--primary-50: #eff6ff; /* 파란색 50 */
--primary-100: #dbeafe; /* 파란색 100 */
--primary-500: #3b82f6; /* 파란색 500 */
--primary-600: #2563eb; /* 파란색 600 */
--primary-700: #1d4ed8; /* 파란색 700 */

/* 보조 브랜드 색상 */
--secondary-50: #f8fafc; /* 슬레이트 50 */
--secondary-100: #f1f5f9; /* 슬레이트 100 */
--secondary-500: #64748b; /* 슬레이트 500 */
--secondary-600: #475569; /* 슬레이트 600 */
--secondary-700: #334155; /* 슬레이트 700 */
```

### Semantic Colors

```css
/* 성공 상태 */
--success: #10b981; /* 에메랄드 500 */
--success-light: #d1fae5; /* 에메랄드 100 */

/* 경고 상태 */
--warning: #f59e0b; /* 앰버 500 */
--warning-light: #fef3c7; /* 앰버 100 */

/* 오류 상태 */
--error: #ef4444; /* 레드 500 */
--error-light: #fee2e2; /* 레드 100 */

/* 정보 상태 */
--info: #3b82f6; /* 블루 500 */
--info-light: #dbeafe; /* 블루 100 */
```

## 🔤 타이포그래피 (Typography)

### 폰트 계층

```css
/* 헤딩 */
--heading-1: 3rem; /* 48px - 메인 타이틀 */
--heading-2: 2.25rem; /* 36px - 섹션 타이틀 */
--heading-3: 1.875rem; /* 30px - 카드 타이틀 */
--heading-4: 1.5rem; /* 24px - 서브 타이틀 */

/* 본문 */
--body-large: 1.125rem; /* 18px - 리드 텍스트 */
--body-base: 1rem; /* 16px - 기본 본문 */
--body-small: 0.875rem; /* 14px - 보조 텍스트 */
--body-xs: 0.75rem; /* 12px - 캡션 */
```

### 폰트 스타일

```css
/* 그라데이션 텍스트 */
.gradient-text {
	background: linear-gradient(45deg, #2563eb, #4f46e5, #7c3aed);
	background-size: 200% 200%;
	animation: gradient-shift 3s ease infinite;
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
}
```

## 📐 레이아웃 및 간격 (Layout & Spacing)

### 컨테이너 너비

```css
--container-xs: 20rem; /* 320px - 모바일 카드 */
--container-sm: 24rem; /* 384px - 작은 컨테이너 */
--container-md: 28rem; /* 448px - 중간 컨테이너 */
--container-lg: 32rem; /* 512px - 큰 컨테이너 */
--container-xl: 80rem; /* 1280px - 전체 너비 */
```

### 간격 시스템

```css
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem; /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem; /* 16px */
--space-5: 1.25rem; /* 20px */
--space-6: 1.5rem; /* 24px */
--space-8: 2rem; /* 32px */
--space-10: 2.5rem; /* 40px */
--space-12: 3rem; /* 48px */
--space-16: 4rem; /* 64px */
--space-20: 5rem; /* 80px */
```

## 🎯 컴포넌트 패턴 (Component Patterns)

### 버튼 (Button)

```svelte
<!-- Primary 버튼 -->
<Button
	variant="primary"
	class="transform shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
>
	기본 버튼
</Button>

<!-- Secondary 버튼 -->
<Button variant="secondary" class="border border-gray-300 hover:bg-gray-50">보조 버튼</Button>

<!-- Danger 버튼 -->
<Button variant="danger" class="bg-red-600 hover:bg-red-700">위험 버튼</Button>
```

### 입력 필드 (Input)

```svelte
<Input
	type="email"
	placeholder="your@email.com"
	value={email}
	oninput={(e) => (email = e.target.value)}
	required
	disabled={isLoading}
	class="transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
/>
```

### 카드 (Card)

```svelte
<Card class="card-enter border-0 bg-white/80 shadow-2xl backdrop-blur-sm">
	<!-- 카드 내용 -->
</Card>
```

## 🌟 애니메이션 (Animations)

### 진입 애니메이션

```css
.card-enter {
	animation: card-enter 0.6s ease-out;
}

@keyframes card-enter {
	from {
		opacity: 0;
		transform: translateY(20px) scale(0.95);
	}
	to {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}
```

### 호버 효과

```css
.hover-lift {
	transition: all 0.2s ease;
}

.hover-lift:hover {
	transform: translateY(-2px);
	box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}
```

### 로딩 애니메이션

```css
@keyframes spin {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}

.fa-spin {
	animation: spin 1s linear infinite;
}
```

## 🎨 배경 패턴 (Background Patterns)

### 그라데이션 배경

```css
.bg-gradient-primary {
	background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #c7d2fe 100%);
}

.bg-gradient-secondary {
	background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%);
}
```

### 그리드 패턴

```css
.bg-grid-slate-100 {
	background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(148 163 184 / 0.1)'%3e%3cpath d='m0 .5h32m-32 32h32m-32-32v32m32-32v32'/%3e%3c/svg%3e");
}
```

## 📱 반응형 디자인 (Responsive Design)

### 브레이크포인트

```css
/* 모바일 우선 */
--mobile: 640px;
--tablet: 768px;
--desktop: 1024px;
--wide: 1280px;
```

### 반응형 유틸리티

```css
/* 텍스트 크기 */
.text-responsive {
	font-size: clamp(1rem, 2.5vw, 1.5rem);
}

/* 컨테이너 */
.container-responsive {
	width: min(100% - 2rem, 28rem);
	margin: 0 auto;
}
```

## 🎯 사용 가이드라인

### 1. 색상 사용 원칙

- **Primary**: 메인 액션, CTA 버튼, 링크
- **Secondary**: 보조 텍스트, 배경, 테두리
- **Semantic**: 상태 표시 (성공/경고/오류/정보)

### 2. 타이포그래피 계층

- **H1**: 페이지 메인 타이틀
- **H2**: 섹션 타이틀
- **H3**: 카드/컴포넌트 타이틀
- **Body**: 일반 텍스트
- **Small**: 보조 텍스트, 캡션

### 3. 간격 시스템

- **space-4 (16px)**: 컴포넌트 내부 패딩
- **space-6 (24px)**: 섹션 간격
- **space-8 (32px)**: 큰 섹션 간격
- **space-12 (48px)**: 페이지 섹션 간격

### 4. 그림자 시스템

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

## 🔧 구현 예시

### 페이지 템플릿

```svelte
<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
	<!-- 배경 패턴 -->
	<div
		class="bg-grid-slate-100 absolute inset-0 -z-10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"
	></div>

	<div class="container-responsive py-12">
		<!-- 페이지 내용 -->
	</div>
</div>
```

### 폼 컴포넌트

```svelte
<form onsubmit={handleSubmit} class="space-y-6">
	<div class="space-y-5">
		<!-- 입력 필드들 -->
	</div>

	<Button
		variant="primary"
		type="submit"
		disabled={isLoading}
		class="w-full transform py-3 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
	>
		제출
	</Button>
</form>
```

이 디자인 시스템을 따르면 FlowAuth의 모든 페이지에서 일관된 사용자 경험을 제공할 수 있습니다.
