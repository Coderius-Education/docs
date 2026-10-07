<script lang="ts">
	import VakPagina from "$lib/components/vakpagina/VakPagina.svelte";

	let { data } = $props();
</script>

<VakPagina vak={data.vak} />
