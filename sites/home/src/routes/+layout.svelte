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
		if (typeof window !== 'undefined') {
			const savedTheme = window.localStorage.getItem('theme');

			if (savedTheme === 'dark' || savedTheme === 'light')
				document.documentElement.className = savedTheme;
			else document.documentElement.className = 'dark';
		}
	</script>
	<link rel="icon" href={favicon} />
</svelte:head>

<Matomo />
<ThemeContext>
	<Header />
	{@render children()}
	<Footer />
</ThemeContext>
