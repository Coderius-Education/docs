<script lang="ts">
	// Eén cursuskaart: merk, niveau, naam, omschrijving en voorkennis. Gedeeld
	// door de homepage en de klaspagina, zodat een cursus er overal hetzelfde
	// uitziet.
	import { ExternalLink } from "@lucide/svelte";
	import { type Activity, levelColors, levelLabels, voorkennisVan } from "$lib/Curriculum";
	import { Badge } from "$lib/components/ui/badge";
	import { cn } from "$lib/utils";

	let {
		cursus,
		label,
		nieuwTabblad = true,
	}: {
		cursus: Activity;
		/** Eigen naam (van een klas); anders de naam uit de registry. */
		label?: string | null;
		/** Op de homepage opent een cursus in een nieuw tabblad. */
		nieuwTabblad?: boolean;
	} = $props();

	// Het huisstijl-merk per cursus, gegenereerd door scripts/genereer-huisstijl.mjs.
	const merken = import.meta.glob<string>("$lib/assets/merk/*.svg", {
		eager: true,
		query: "?url",
		import: "default",
	});
	const merk = (id: string, donker = false) =>
		merken[`/src/lib/assets/merk/${id}${donker ? "-donker" : ""}.svg`];

	const woorden = $derived((label || cursus.label).split(" "));
</script>

<a
	href={cursus.link}
	target={nieuwTabblad ? "_blank" : undefined}
	rel={nieuwTabblad ? "noopener noreferrer" : undefined}
	class="flex h-full flex-col gap-1 rounded-xl border bg-card p-3.5 text-card-foreground shadow-sm transition-colors hover:border-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
>
	<div class="flex items-center gap-2">
		{#if merk(cursus.id)}
			<img src={merk(cursus.id)} alt="" class="-my-1 -ml-1 size-9 shrink-0 dark:hidden" />
			<img src={merk(cursus.id, true)} alt="" class="-my-1 -ml-1 hidden size-9 shrink-0 dark:block" />
		{/if}
		<Badge class={cn("ml-auto shrink-0", levelColors[cursus.level])}>{levelLabels[cursus.level]}</Badge>
	</div>
	<div>
		<h2 class="text-base font-semibold leading-tight">
			{#if nieuwTabblad}
				{woorden.slice(0, -1).join(" ")}
				<span class="whitespace-nowrap">{woorden.at(-1)}<ExternalLink class="ml-1 inline h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" /></span>
			{:else}
				{woorden.join(" ")}
			{/if}
		</h2>
	</div>
	<p class="text-lg leading-snug text-muted-foreground">{cursus.description}</p>
	{#if cursus.requires.length > 0}
		<p class="mt-auto text-xs text-muted-foreground">Voorkennis: {voorkennisVan(cursus)}</p>
	{/if}
</a>
