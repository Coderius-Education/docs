<script lang="ts">
	import { page } from "$app/state";
	import { Button } from "$lib/components/ui/button";
	import ThemeButton from "$lib/components/ui/theme-button/ThemeButton.svelte";
</script>

<header class="border-b bg-sidebar">
	<div class="mx-auto flex h-12 max-w-7xl items-center gap-1 px-4">
		<a href="/" class="mr-3 text-lg font-semibold tracking-tight">Coderius</a>
		<nav aria-label="Hoofdmenu" class="flex items-center">
			<Button variant="link" href="/" aria-current={page.url.pathname === "/" ? "page" : undefined}>Cursussen</Button>
			<Button variant="link" href="/docent" aria-current={page.url.pathname.startsWith("/docent") ? "page" : undefined}>Docenten</Button>
		</nav>
		<div class="ml-auto">
			<ThemeButton />
		</div>
	</div>
</header>
