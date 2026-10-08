<script lang="ts">
	import "../app.css";
	import favicon from "$lib/assets/favicon.svg";
	import Header from "$lib/components/Header.svelte";
	import Footer from "$lib/components/Footer.svelte";
	import Matomo from "$lib/components/Matomo.svelte";
	import ThemeContext from "$lib/context/theme/ThemeContext.svelte";
	import VakThema from "$lib/components/vakpagina/VakThema.svelte";

	let { children } = $props();
</script>

<svelte:head>
	<script>
		// Vóór de eerste render, anders flitst het verkeerde thema. Een eigen
		// keuze (de knop) wint; anders volgt de pagina het systeem, net als de
		// cursussites.
		if (typeof window !== 'undefined') {
			const savedTheme = window.localStorage.getItem('theme');
			const systeem = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
			document.documentElement.className =
				savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : systeem;
			// Het vak van de host (zie vakVanHost in src/lib/vakken.ts), voor de
			// kleuren van de vakpagina. Ook vóór de eerste render, anders flitsen ze.
			const host = window.location.hostname.toLowerCase();
			const vak = /^([a-z0-9-]+)\.(?:coderius\.nl|localtest\.me)$/.exec(host)?.[1] ||
				/--([a-z0-9-]+)\.preview\.coderius\.nl$/.exec(host)?.[1];
			if (vak) document.documentElement.dataset.vak = vak;
		}
	</script>
	<link rel="icon" href={favicon} />
</svelte:head>

<VakThema />
<Matomo />
<ThemeContext>
	<div class="flex min-h-screen flex-col">
		<Header />
		<div class="flex-1">
			{@render children()}
		</div>
		<Footer />
	</div>
</ThemeContext>
