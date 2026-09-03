<script lang="ts">
	import { ExternalLink } from "@lucide/svelte";
	import { REPO_URL } from "@coderius/shared/sites";
	import {
		THEMAS,
		type Activity,
		type Thema,
		curriculum,
		levelColors,
		levelLabels,
		themasVan,
		voorkennisVan,
	} from "$lib/Curriculum";
	import { Badge } from "$lib/components/ui/badge";
	import { cn } from "$lib/utils";

	const NIVEAUS: Activity["level"][] = ["Beginner", "Medium"];

	// Twee filterrijen in plaats van een paneel met 23 opties: één keuze per
	// rij, "Alles" is de standaard. De examendomeinen staan op de docentenpagina.
	let niveau = $state<Activity["level"] | null>(null);
	let thema = $state<Thema | null>(null);

	const zichtbaar = $derived(
		curriculum.filter(
			(c) => (niveau === null || c.level === niveau) && (thema === null || themasVan(c).includes(thema))
		)
	);

	const chip = "rounded-full border px-3 py-1 text-sm transition-colors hover:bg-accent";
	const chipActief = "border-primary bg-primary text-primary-foreground hover:bg-primary";
</script>

<svelte:head>
	<title>Coderius Education</title>
	<meta
		name="description"
		content="Cursussen voor het voortgezet onderwijs: Python, webontwikkeling, games, robotica, security en meer. Gratis en open, direct in je browser."
	/>
</svelte:head>

<main class="mx-auto max-w-7xl px-4">
	<section class="pt-6 pb-4">
		<h1 class="text-2xl font-bold tracking-tight sm:text-3xl">Coderius Education</h1>
		<p class="mt-1 max-w-3xl text-muted-foreground">
			{curriculum.length} cursussen voor het voortgezet onderwijs, van je eerste regel Python tot een
			website met een eigen back-end. Kies een cursus en begin meteen in je browser.
		</p>
	</section>

	<section aria-label="Filters" class="flex flex-wrap items-center gap-x-6 gap-y-2 pb-4">
		<div class="flex flex-wrap items-center gap-2" role="group" aria-label="Niveau">
			<button type="button" class={cn(chip, niveau === null && chipActief)} aria-pressed={niveau === null} onclick={() => (niveau = null)}>
				Alle niveaus
			</button>
			{#each NIVEAUS as n}
				<button type="button" class={cn(chip, niveau === n && chipActief)} aria-pressed={niveau === n} onclick={() => (niveau = n)}>
					{levelLabels[n]}
				</button>
			{/each}
		</div>
		<div class="flex flex-wrap items-center gap-2" role="group" aria-label="Thema">
			<button type="button" class={cn(chip, thema === null && chipActief)} aria-pressed={thema === null} onclick={() => (thema = null)}>
				Alle thema's
			</button>
			{#each THEMAS as t}
				<button type="button" class={cn(chip, thema === t && chipActief)} aria-pressed={thema === t} onclick={() => (thema = t)}>
					{t}
				</button>
			{/each}
		</div>
	</section>

	<section aria-label="Cursussen">
		<p class="mb-3 text-sm text-muted-foreground">
			{#if zichtbaar.length === curriculum.length}
				Alle {curriculum.length} cursussen, in de volgorde van de leerlijn.
			{:else}
				{zichtbaar.length} van {curriculum.length} cursussen.
			{/if}
		</p>

		{#if zichtbaar.length === 0}
			<div class="rounded-xl border py-10 text-center">
				<p class="text-muted-foreground">Geen cursus met deze combinatie.</p>
				<button type="button" class={cn(chip, "mt-3")} onclick={() => { niveau = null; thema = null; }}>
					Filters wissen
				</button>
			</div>
		{:else}
			<ul id="cursussen" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{#each zichtbaar as c (c.id)}
					{@const woorden = c.label.split(" ")}
					<li>
						<a
							href={c.link}
							target="_blank"
							rel="noopener noreferrer"
							class="flex h-full flex-col gap-2 rounded-xl border bg-card p-4 text-card-foreground shadow-sm transition-colors hover:border-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
						>
							<div class="flex items-start justify-between gap-2">
								<h2 class="text-base font-semibold leading-tight">
									{woorden.slice(0, -1).join(" ")}
									<span class="whitespace-nowrap">{woorden.at(-1)}<ExternalLink class="ml-1 inline h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" /></span>
								</h2>
								<Badge class={cn("shrink-0", levelColors[c.level])}>{levelLabels[c.level]}</Badge>
							</div>
							<p class="text-sm text-muted-foreground">{c.description}</p>
							{#if c.requires.length > 0}
								<p class="mt-auto text-xs text-muted-foreground">Voorkennis: {voorkennisVan(c)}</p>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section aria-label="Over Coderius" class="mt-10 mb-6 grid gap-6 md:grid-cols-2">
		<div>
			<h2 class="text-lg font-semibold">Lesmateriaal</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Wij maken ons eigen lesmateriaal en geven het gratis weg. Alles is open source, dus
				docenten mogen het gebruiken, aanpassen en delen zoals het bij hun leerlingen past.
				Ideeën of een bijdrage? Het materiaal staat
				<a href={REPO_URL} target="_blank" rel="noopener noreferrer" class="underline underline-offset-2">op GitHub</a>.
			</p>
		</div>
		<div>
			<h2 class="text-lg font-semibold">Visie</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Leren gaat het best door te doen. Elke cursus combineert korte uitleg met opdrachten,
				projecten en voorbeelden die je direct uitvoert, meestal in de browser zelf. Zo pas je
				kennis meteen toe, en samen met docenten verbeteren we het materiaal steeds verder.
			</p>
		</div>
	</section>
</main>
