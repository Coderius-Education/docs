<script lang="ts">
	// Tekst uit een vakpagina-blok. markdownNaarHtml escapet alles en laat alleen
	// een handvol opmaak en veilige links door, dus {@html} is hier veilig.
	import { markdownNaarHtml } from "$lib/vakpagina/markdown";

	let { tekst, class: klasse = "" }: { tekst: string; class?: string } = $props();
	const html = $derived(markdownNaarHtml(tekst));
</script>

{#if html}
	<div
		class="[&_a]:underline [&_a]:underline-offset-2 [&_code]:font-mono [&_li]:ml-5 [&_li]:list-disc [&_p+p]:mt-2 [&_ul]:mt-2 {klasse}"
	>
		{@html html}
	</div>
{/if}
