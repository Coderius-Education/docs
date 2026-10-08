<script lang="ts">
	import { onMount } from "svelte";
	import VakPagina from "$lib/components/vakpagina/VakPagina.svelte";
	import { vakVanHost } from "$lib/vakken";

	// Eén gebouwde pagina dient elke host. Op een vak-host serveert de delivery
	// /vak/<vak> (vooraf gebouwd, met het ontwerp van dat vak); hier komen de
	// apex, previews zonder vak en lokaal testen langs. Welk vak het is, weet de
	// pagina pas in de browser.
	let vak = $state<string | null>(null);
	onMount(() => {
		vak = vakVanHost(location.hostname);
	});
</script>

<VakPagina {vak} />
