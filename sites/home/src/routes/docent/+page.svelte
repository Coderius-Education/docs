<script lang="ts">
	import { ExternalLink } from "@lucide/svelte";
	import { type Activity, levelColors, levelLabels, voorkennisVan } from "$lib/Curriculum";
	import { docentenCursussen, docentenUrl, inKlas4, inKlas5 } from "$lib/docenten";
	import { Badge } from "$lib/components/ui/badge";
	import * as Card from "$lib/components/ui/card/index.js";
	import { cn } from "$lib/utils";
	import DocentTabs from "$lib/components/DocentTabs.svelte";

	const klas4 = docentenCursussen.filter(inKlas4);
	const klas5 = docentenCursussen.filter(inKlas5);

	const link = "inline-flex items-center gap-1 underline-offset-2 hover:underline";
</script>

<svelte:head>
	<title>Voor docenten: curriculum</title>
	<meta
		name="description"
		content="Welke cursus geef je in klas 4 en welke in klas 5 en hoger, met niveau, voorkennis en de docentenhandleiding per cursus."
	/>
</svelte:head>

{#snippet kaart(c: Activity)}
	<li>
		<Card.Root class="h-full gap-2 py-3">
			<Card.Header class="px-3">
				<div class="flex items-start justify-between gap-3">
					<Card.Title class="min-w-0 text-base [overflow-wrap:anywhere]">
						<a href={c.link} target="_blank" rel="noopener noreferrer" class={link}>{c.label}</a>
					</Card.Title>
					<Badge class={cn("shrink-0 whitespace-nowrap", levelColors[c.level])}>{levelLabels[c.level]}</Badge>
				</div>
				<Card.Description>{c.description}</Card.Description>
			</Card.Header>
			<Card.Content class="flex flex-wrap items-center justify-between gap-2 px-3 text-xs text-muted-foreground">
				<span>{c.requires.length > 0 ? `Voorkennis: ${voorkennisVan(c)}` : "Geen voorkennis nodig"}</span>
				<a href={docentenUrl(c.link)} target="_blank" rel="noopener noreferrer" class={cn(link, "text-foreground")}>
					Voor de docent
					<ExternalLink class="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
				</a>
			</Card.Content>
		</Card.Root>
	</li>
{/snippet}

<main class="mx-auto max-w-7xl px-4">
	<section class="pt-6 pb-4">
		<h1 class="text-2xl font-bold tracking-tight sm:text-3xl">Voor docenten</h1>
		<p class="mt-1 max-w-3xl text-muted-foreground">
			Het curriculum in twee stappen: de basis in klas 4, de verdieping in klas 5 en hoger. Elke
			cursus heeft een docentenhandleiding met wat er technisch nodig is en hoe je 'm in de klas
			inzet.
		</p>
	</section>

	<DocentTabs />

	<section aria-label="Leerlijn" class="relative mb-8 ml-4 md:ml-8">
		<div class="absolute top-0 bottom-0 left-2 w-0.5 bg-border"></div>

		<div class="relative pb-6 pl-10">
			<div class="absolute left-0 top-1 h-5 w-5 rounded-full border-4 border-primary bg-background"></div>
			<div class="flex flex-wrap items-baseline gap-3">
				<h2 class="text-xl font-bold">Klas 4: Basis</h2>
				<Badge variant="outline">Havo 4 / VWO 4</Badge>
				<p class="text-sm text-muted-foreground">Alle leerlingen doorlopen de basiscursussen</p>
			</div>
			<ul class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
				{#each klas4 as c (c.id)}
					{@render kaart(c)}
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
			<ul class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
				{#each klas5 as c (c.id)}
					{@render kaart(c)}
				{/each}
			</ul>
		</div>
	</section>
</main>
