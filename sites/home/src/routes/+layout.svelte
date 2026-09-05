<script lang="ts">
	import "../app.css";
	import favicon from "$lib/assets/favicon.svg";
	import Header from "$lib/components/Header.svelte";
	import Footer from "$lib/components/Footer.svelte";
	import Matomo from "$lib/components/Matomo.svelte";
	import ThemeContext from "$lib/context/theme/ThemeContext.svelte";

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
		}
	</script>
	<link rel="icon" href={favicon} />
</svelte:head>

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
