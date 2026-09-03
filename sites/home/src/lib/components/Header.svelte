<script lang="ts">
	import { page } from "$app/state";
	import logo from "$lib/assets/logo.svg";
	import { Button } from "$lib/components/ui/button";
	import ThemeButton from "$lib/components/ui/theme-button/ThemeButton.svelte";
</script>

<header class="border-b bg-sidebar">
	<div class="mx-auto flex h-12 max-w-7xl items-center gap-1 px-4">
		<a href="/" class="mr-3 flex items-center gap-2 font-semibold">
			<img src={logo} alt="" class="h-7 w-7" />
			<span>Coderius</span>
		</a>
		<nav aria-label="Hoofdmenu" class="flex items-center">
			<Button variant="link" href="/" aria-current={page.url.pathname === "/" ? "page" : undefined}>Cursussen</Button>
			<Button variant="link" href="/docent" aria-current={page.url.pathname.startsWith("/docent") ? "page" : undefined}>Docenten</Button>
		</nav>
		<div class="ml-auto">
			<ThemeButton />
		</div>
	</div>
</header>
