<script lang="ts">
	import { ExternalLink } from "@lucide/svelte";
	import { type Activity, curriculum } from "$lib/Curriculum";
	import { type CardChip, buildCardChipGroups } from "$lib/ExamProgram";
	import { HULPMIDDELEN, docentenCursussen, hostVan } from "$lib/docenten";
	import { Badge } from "$lib/components/ui/badge";
	import * as Card from "$lib/components/ui/card/index.js";
	import { cn } from "$lib/utils";
	import DocentTabs from "$lib/components/DocentTabs.svelte";
	import FilterPanel from "$lib/components/FilterPanel.svelte";

	let selectedFilters = $state({
		programmingLanguages: [] as string[],
		projectTypes: [] as string[],
		operatingSystems: [] as string[],
		examDomains: [] as string[],
	});

	function matchesFilters(activity: Activity) {
		return (
			selectedFilters.examDomains.length === 0 ||
			selectedFilters.examDomains.every((filter) =>
				activity.examDomains?.some((m) =>
					filter.length === 1 ? m.code.startsWith(filter) : m.code === filter,
				),
			)
		);
	}

	// Filteren op id, niet op titel: de titels komen uit de registry en mogen
	// daar veranderen zonder dat deze pagina stil een cursus kwijtraakt.
	const rijen = $derived(docentenCursussen.filter(matchesFilters));

	function handleFilterChange(newFilters: {
		programmingLanguages: string[];
		projectTypes: string[];
		operatingSystems: string[];
		examDomains?: string[];
	}) {
		selectedFilters = { ...newFilters, examDomains: newFilters.examDomains ?? [] };
	}

	const link = "inline-flex items-center gap-1 underline-offset-2 hover:underline";
</script>

<svelte:head>
	<title>Voor docenten: examenprogramma</title>
	<meta
		name="description"
		content="Welke examendomeinen van het examenprogramma informatica raakt elke cursus, en hoe sterk."
	/>
</svelte:head>

{#snippet chipsCel(chips: CardChip[], leeg: string)}
	{#if chips.length}
		<div class="flex flex-wrap gap-1">
			{#each chips as chip (chip.display)}
				<Badge variant={chip.strength === "strong" ? "default" : "outline"} class="text-xs" title={chip.title}>
					{chip.display}
				</Badge>
			{/each}
		</div>
	{:else}
		<span class="text-xs text-muted-foreground">{leeg}</span>
	{/if}
{/snippet}

<main class="mx-auto max-w-7xl px-4">
	<section class="pt-6 pb-4">
		<h1 class="text-2xl font-bold tracking-tight sm:text-3xl">Examenprogramma</h1>
		<p class="mt-1 max-w-3xl text-muted-foreground">
			Filter op examendomein om te zien welke cursussen ergens op aansluiten; een gevuld domein is
			een sterk raakvlak, een open domein een zijdelings. Elke cursusnaam linkt naar de cursussite;
			de docentenhandleiding per cursus staat bij het
			<a href="/docent" class="underline underline-offset-2">curriculum</a>.
		</p>
	</section>

	<DocentTabs />

	<FilterPanel
		activities={curriculum}
		{selectedFilters}
		onFilterChange={handleFilterChange}
		showExamDomains
		showStandardFilters={false}
	/>

	<section aria-label="Cursussen en examendomeinen" class="mb-10">
		<h2 class="mb-3 text-xl font-bold">Cursussen en examendomeinen</h2>
		<div class="overflow-x-auto rounded-xl border">
			<table class="w-full text-sm">
				<thead class="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
					<tr>
						<th scope="col" class="px-3 py-2">Cursus</th>
						<th scope="col" class="px-3 py-2">Kerndomeinen</th>
						<th scope="col" class="px-3 py-2">Keuzedomeinen</th>
					</tr>
				</thead>
				<tbody>
					{#each rijen as c (c.id)}
						{@const chips = buildCardChipGroups(c.examDomains)}
						<tr class="border-t align-top">
							<td class="px-3 py-2">
								<a href={c.link} target="_blank" rel="noopener noreferrer" class={cn(link, "font-medium")}>
									{c.label}
									<ExternalLink class="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
								</a>
								<p class="text-xs text-muted-foreground">{c.description}</p>
							</td>
							<td class="px-3 py-2">{@render chipsCel(chips.kern, "geen")}</td>
							<td class="px-3 py-2">{@render chipsCel(chips.keuze, "geen")}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		{#if rijen.length === 0}
			<p class="mt-3 text-sm text-muted-foreground">Geen cursus raakt deze combinatie van examendomeinen.</p>
		{/if}
	</section>

	<section aria-label="Hulpmiddelen" class="mb-10">
		<h2 class="mb-3 text-xl font-bold">Hulpmiddelen, geen cursussen</h2>
		<ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each HULPMIDDELEN as h (h.id)}
				<li>
					<Card.Root class="gap-1 py-3">
						<Card.Header class="px-3">
							<Card.Title>
								<a href={h.url} target="_blank" rel="noopener noreferrer" class={link}>
									{h.label}
									<ExternalLink class="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
								</a>
							</Card.Title>
							<Card.Description>{h.description}</Card.Description>
							<p class="font-mono text-xs text-muted-foreground">{hostVan(h.url)}</p>
						</Card.Header>
					</Card.Root>
				</li>
			{/each}
		</ul>
	</section>
</main>
