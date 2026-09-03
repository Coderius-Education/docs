<script lang="ts">
	import { ExternalLink } from "@lucide/svelte";
	import { type Activity, curriculum, levelColors, levelLabels } from "$lib/Curriculum";
	import { buildCardChips } from "$lib/ExamProgram";
	import { GEDEELD, HULPMIDDELEN, docentenCursussen, docentenUrl, hostVan, klasVan } from "$lib/docenten";
	import { Badge } from "$lib/components/ui/badge";
	import * as Card from "$lib/components/ui/card/index.js";
	import { cn } from "$lib/utils";
	import FilterPanel from "$lib/components/FilterPanel.svelte";

	let selectedFilters = $state({
		programmingLanguages: [] as string[],
		projectTypes: [] as string[],
		operatingSystems: [] as string[],
		examDomains: [] as string[],
	});

	function matchesFilters(activity: Activity) {
		const domainOk =
			selectedFilters.examDomains.length === 0 ||
			selectedFilters.examDomains.every((filter) =>
				activity.examDomains?.some((m) =>
					filter.length === 1 ? m.code.startsWith(filter) : m.code === filter,
				),
			);
		return domainOk;
	}

	// Filteren op id, niet op titel: de titels komen nu uit de registry en
	// mogen daar veranderen zonder dat deze pagina stil een cursus kwijtraakt.
	const rijen = $derived(docentenCursussen.filter(matchesFilters));
	const beginnerCourses = $derived(
		rijen.filter((c) => c.level === "Beginner" || GEDEELD.includes(c.id))
	);
	const advancedCourses = $derived(
		rijen.filter((c) => c.level !== "Beginner" || GEDEELD.includes(c.id))
	);

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
	<title>Voor docenten: cursussen, subdomeinen en examendomeinen</title>
	<meta
		name="description"
		content="Welke cursus staat op welk subdomein, bij welke klas past hij, welke examendomeinen raakt hij, en waar staat de docentenhandleiding."
	/>
</svelte:head>

<main class="mx-auto max-w-7xl px-4">
	<section class="pt-6 pb-4">
		<h1 class="text-2xl font-bold tracking-tight sm:text-3xl">Voor docenten</h1>
		<p class="mt-1 max-w-3xl text-muted-foreground">
			Elke cursus is een eigen site op een subdomein van coderius.nl, met een docentenhandleiding
			op <code>/docenten</code>: wat de cursus is, wat er technisch nodig is, hoe je 'm in de klas
			inzet. Filter op examendomein om te zien welke cursussen ergens op aansluiten.
		</p>
	</section>

	<FilterPanel
		activities={curriculum}
		{selectedFilters}
		onFilterChange={handleFilterChange}
		showExamDomains={true}
		showStandardFilters={false}
	/>

	<section aria-label="Cursussen en subdomeinen" class="mb-10">
		<h2 class="mb-3 text-xl font-bold">Cursussen en subdomeinen</h2>
		<div class="overflow-x-auto rounded-xl border">
			<table class="w-full text-sm">
				<thead class="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
					<tr>
						<th scope="col" class="px-3 py-2">Cursus</th>
						<th scope="col" class="px-3 py-2">Subdomein</th>
						<th scope="col" class="px-3 py-2">Niveau</th>
						<th scope="col" class="px-3 py-2">Klas</th>
						<th scope="col" class="px-3 py-2">Examendomeinen</th>
						<th scope="col" class="px-3 py-2">Handleiding</th>
					</tr>
				</thead>
				<tbody>
					{#each rijen as c (c.id)}
						{@const chips = buildCardChips(c.examDomains)}
						<tr class="border-t align-top">
							<td class="px-3 py-2">
								<a href={c.link} target="_blank" rel="noopener noreferrer" class={cn(link, "font-medium")}>
									{c.label}
									<ExternalLink class="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
								</a>
								<p class="text-xs text-muted-foreground">{c.description}</p>
							</td>
							<td class="px-3 py-2 font-mono text-xs">
								<a href={c.link} target="_blank" rel="noopener noreferrer" class={link}>{hostVan(c.link)}</a>
							</td>
							<td class="px-3 py-2">
								<Badge class={cn("whitespace-nowrap", levelColors[c.level])}>{levelLabels[c.level]}</Badge>
							</td>
							<td class="whitespace-nowrap px-3 py-2">{klasVan(c)}</td>
							<td class="px-3 py-2">
								{#if chips.length}
									<div class="flex flex-wrap gap-1">
										{#each chips as chip}
											<Badge variant={chip.strength === "strong" ? "default" : "outline"} class="text-xs" title={chip.title}>
												{chip.display}
											</Badge>
										{/each}
									</div>
								{:else}
									<span class="text-xs text-muted-foreground">nog niet ingevuld</span>
								{/if}
							</td>
							<td class="whitespace-nowrap px-3 py-2">
								<a href={docentenUrl(c.link)} target="_blank" rel="noopener noreferrer" class={link}>
									Voor de docent
									<ExternalLink class="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
								</a>
							</td>
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

	<section aria-label="Leerlijn" class="relative mb-8 ml-4 md:ml-8">
		<div class="absolute top-0 bottom-0 left-2 w-0.5 bg-border"></div>

		<div class="relative pb-4 pl-10">
			<div class="absolute left-0 top-1 h-5 w-5 rounded-full border-4 border-primary bg-background"></div>
			<div class="flex flex-wrap items-baseline gap-3">
				<h2 class="text-xl font-bold">Klas 4: Basis</h2>
				<Badge variant="outline">Havo 4 / VWO 4</Badge>
				<p class="text-sm text-muted-foreground">Alle leerlingen doorlopen de basiscursussen</p>
			</div>
			<ul class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each beginnerCourses as c (c.id)}
					<li>
						<Card.Root class="gap-1 py-3">
							<Card.Header class="px-3">
								<div class="flex items-start justify-between gap-3">
									<Card.Title class="min-w-0 text-base [overflow-wrap:anywhere]">
										<a href={c.link} target="_blank" rel="noopener noreferrer" class={link}>{c.label}</a>
									</Card.Title>
									<Badge class={cn("shrink-0 whitespace-nowrap", levelColors[c.level])}>{levelLabels[c.level]}</Badge>
								</div>
							</Card.Header>
						</Card.Root>
					</li>
				{/each}
			</ul>
		</div>

		<div class="relative pb-4 pl-10">
			<div class="absolute left-0 top-1 h-5 w-5 rounded-full border-4 border-primary bg-background"></div>
			<div class="flex flex-wrap items-baseline gap-3">
				<h2 class="text-xl font-bold">Klas 5+: Verdieping</h2>
				<Badge variant="outline">Havo 5 / VWO 5-6</Badge>
				<p class="text-sm text-muted-foreground">Leerlingen kiezen meerdere verdiepingsmodules</p>
			</div>
			<ul class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each advancedCourses as c (c.id)}
					<li>
						<Card.Root class="gap-1 py-3">
							<Card.Header class="px-3">
								<div class="flex items-start justify-between gap-3">
									<Card.Title class="min-w-0 text-base [overflow-wrap:anywhere]">
										<a href={c.link} target="_blank" rel="noopener noreferrer" class={link}>{c.label}</a>
									</Card.Title>
									<Badge class={cn("shrink-0 whitespace-nowrap", levelColors[c.level])}>{levelLabels[c.level]}</Badge>
								</div>
							</Card.Header>
						</Card.Root>
					</li>
				{/each}
			</ul>
		</div>
	</section>
</main>
