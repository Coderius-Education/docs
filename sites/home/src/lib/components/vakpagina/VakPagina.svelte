<script lang="ts">
	// De startpagina van een vak: het document uit src/lib/vakpaginas/<vak>.json,
	// of de standaardpagina. Zie src/lib/vakpagina/types.ts.
	import { SUBJECTS } from "@coderius/shared/sites";
	import Blok from "./Blok.svelte";
	import { vakpaginaVoor } from "$lib/vakpagina/laden";

	let { vak }: { vak: string | null } = $props();

	const doc = $derived(vakpaginaVoor(vak));
	const vakNaam = $derived(SUBJECTS.find((v) => v.id === vak)?.label);
	// Het Cursusoverzicht met automatische kop zet zelf de titel (die volgt de
	// filters); anders komt hij uit het document of het vak.
	const eigenTitel = $derived(
		doc.meta?.titel || !doc.blokken.some((b) => b.type === "Courses" && b.props?.automatischeKop)
	);
	const titel = $derived(doc.meta?.titel || (vakNaam ? `${vakNaam} — Coderius` : "Coderius Education"));
	const omschrijving = $derived(
		doc.meta?.omschrijving ||
			"Cursussen voor het voortgezet onderwijs: Python, webontwikkeling, games, robotica, security, onderzoek doen en meer. Gratis en open, direct in je browser."
	);
</script>

<svelte:head>
	{#if eigenTitel}
		<title>{titel}</title>
	{/if}
	<meta name="description" content={omschrijving} />
	{#if doc.meta?.afbeelding}
		<meta property="og:image" content={doc.meta.afbeelding} />
	{/if}
</svelte:head>

<main>
	{#each doc.blokken as blok (blok.id)}
		<Blok {blok} {vak} />
	{/each}
</main>
