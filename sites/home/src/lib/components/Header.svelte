<script lang="ts">
	import { page } from "$app/state";
	import { Button } from "$lib/components/ui/button";
	import ThemeButton from "$lib/components/ui/theme-button/ThemeButton.svelte";
	import woordmerk from "$lib/assets/woordmerk.svg";
	import woordmerkDonker from "$lib/assets/woordmerk-donker.svg";
	import { VAKPAGINAS } from "$lib/vakpagina/laden";

	// Logo's van vakpagina's: allemaal verborgen; de CSS van VakThema toont dat
	// van het vak van de host (html[data-vak]) in plaats van het woordmerk.
	const logos = Object.entries(VAKPAGINAS).flatMap(([vak, doc]) => {
		const logo = doc.thema?.logo;
		if (!logo?.licht) return [];
		return [
			{ vak, src: logo.licht, klasse: `vak-logo-${vak}-licht` },
			...(logo.donker ? [{ vak, src: logo.donker, klasse: `vak-logo-${vak}-donker` }] : []),
		];
	});
</script>

<header class="border-b bg-sidebar">
	<div class="mx-auto flex h-12 max-w-[100rem] items-center gap-1 px-4">
		<a href="/" class="mr-3 flex items-center" aria-label="Coderius, naar de homepage">
			<img src={woordmerk} alt="" class="coderius-woordmerk h-9 w-auto dark:hidden" />
			<img src={woordmerkDonker} alt="" class="coderius-woordmerk hidden h-9 w-auto dark:block" />
			{#each logos as logo (logo.klasse)}
				<img src={logo.src} alt="" class="vak-logo {logo.klasse} h-9 w-auto" />
			{/each}
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
