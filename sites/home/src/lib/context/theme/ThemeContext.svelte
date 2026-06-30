<script lang="ts">
import { browser } from "$app/environment";
import { THEME_CONTEXT_KEY, type Theme } from "$lib/context/theme/Theme";
import { setContext } from "svelte";

let { children }: { children: any } = $props();

// Initialize with default value, will be updated in onMount
let themeState = $state<Theme>("dark");

// Only access localStorage in the browser
if (browser) {
	const savedTheme = window.localStorage.getItem("theme") as Theme;
	themeState = savedTheme || "dark";
}

const themeContext = {
	get current() {
		return themeState;
	},
	set: (newTheme: Theme) => {
		themeState = newTheme;
	},
};

setContext(THEME_CONTEXT_KEY, themeContext);

$effect(() => {
	if (browser) {
		window.localStorage.setItem("theme", themeState);
		document.documentElement.className = themeState;
	}
});
</script>

{@render children?.()}
