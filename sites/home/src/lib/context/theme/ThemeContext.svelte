<script lang="ts">
	import { browser } from "$app/environment";
	import { THEME_CONTEXT_KEY, type Theme } from "$lib/context/theme/Theme";
	import { setContext } from "svelte";

	let { children }: { children: any } = $props();

	// Zonder eigen keuze volgt het thema het systeem; het inline script in
	// +layout.svelte heeft dan al dezelfde klasse gezet, dus geen flits.
	function beginwaarde(): Theme {
		if (!browser) return "light";
		const saved = window.localStorage.getItem("theme");
		if (saved === "dark" || saved === "light") return saved;
		return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
	}

	let themeState = $state<Theme>(beginwaarde());
	let gekozen = $state(browser && window.localStorage.getItem("theme") !== null);

	const themeContext = {
		get current() {
			return themeState;
		},
		set: (newTheme: Theme) => {
			themeState = newTheme;
			gekozen = true;
		},
	};

	setContext(THEME_CONTEXT_KEY, themeContext);

	$effect(() => {
		if (browser) {
			// Alleen een bewuste keuze onthouden; anders blijft het systeem leidend.
			if (gekozen) window.localStorage.setItem("theme", themeState);
			document.documentElement.className = themeState;
		}
	});
</script>

{@render children?.()}
