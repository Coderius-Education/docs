<script lang="ts">
	// Kleuren en kopletter van elke vakpagina, op html[data-vak]. Staat in de
	// layout, zodat ook de klaspagina en de docentenpagina's het vak volgen.
	import { VAKPAGINAS } from "$lib/vakpagina/laden";
	import { themaCss } from "$lib/vakpagina/thema";

	const css = themaCss(VAKPAGINAS);
</script>

<svelte:head>
	{#if css}
		{@html `<style>${css}</style>`}
	{/if}
</svelte:head>
