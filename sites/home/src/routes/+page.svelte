<script lang="ts">
	import { onMount } from "svelte";
	import { X } from "@lucide/svelte";
	import { REPO_URL, SUBJECTS } from "@coderius/shared/sites";
	import {
		type Activity,
		type Thema,
		curriculum,
		levelLabels,
		themasVan,
		themasVoorVakken,
	} from "$lib/Curriculum";
	import { inleiding, vakVanHost } from "$lib/vakken";
	import CursusKaart from "$lib/components/CursusKaart.svelte";
	import FilterDropdown from "$lib/components/FilterDropdown.svelte";
	import { cn } from "$lib/utils";

	const NIVEAUS: Activity["level"][] = ["Beginner", "Medium"];
	// Alleen vakken met minstens één cursus; een vak zonder kaarten is geen filter.
	const VAKKEN = SUBJECTS.filter((v) => curriculum.some((c) => c.subject === v.id));
	const vakLabel = (id: string) => SUBJECTS.find((v) => v.id === id)?.label ?? id;

	// Drie filters, elk met meer keuzes tegelijk: binnen een filter "of", tussen
	// de filters "en". De examendomeinen staan op de docentenpagina.
	let vakken = $state<string[]>([]);
	let niveaus = $state<Activity["level"][]>([]);
	let themas = $state<Thema[]>([]);

	// Eén gebouwde pagina dient elke host. Op wo.coderius.nl staat het vak
	// wetenschapsoriëntatie vooraf aan; dat kan pas in de browser.
	onMount(() => {
		const vak = vakVanHost(location.hostname);
		if (vak && VAKKEN.some((v) => v.id === vak)) vakken = [vak];
	});

	// Het Thema-filter toont alleen de thema's van de gekozen vakken; een thema
	// van een vak dat niet meer gekozen is, valt weg.
	const themaOpties = $derived(themasVoorVakken(vakken));
	$effect(() => {
		const weg = themas.filter((t) => !themaOpties.includes(t));
		if (weg.length > 0) themas = themas.filter((t) => themaOpties.includes(t));
	});

	const vanVak = $derived(
		curriculum.filter((c) => vakken.length === 0 || vakken.includes(c.subject))
	);
	const zichtbaar = $derived(
		vanVak.filter(
			(c) =>
				(niveaus.length === 0 || niveaus.includes(c.level)) &&
				(themas.length === 0 || themasVan(c).some((t) => themas.includes(t)))
		)
	);
	const kop = $derived(vakken.length === 1 ? vakLabel(vakken[0]) : "Coderius Education");

	type Chip = { groep: string; label: string; weg: () => void };
	const chips = $derived<Chip[]>([
		...vakken.map((v) => ({ groep: "Vak", label: vakLabel(v), weg: () => (vakken = vakken.filter((x) => x !== v)) })),
		...niveaus.map((n) => ({ groep: "Niveau", label: levelLabels[n], weg: () => (niveaus = niveaus.filter((x) => x !== n)) })),
		...themas.map((t) => ({ groep: "Thema", label: t, weg: () => (themas = themas.filter((x) => x !== t)) })),
	]);

	function wis() {
		vakken = [];
		niveaus = [];
		themas = [];
	}

	const knop = "rounded-full border px-3 py-1 text-sm transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none";
</script>

<svelte:head>
	<title>{vakken.length === 1 ? `${kop} — Coderius` : "Coderius Education"}</title>
	<meta
		name="description"
		content="Cursussen voor het voortgezet onderwijs: Python, webontwikkeling, games, robotica, security, onderzoek doen en meer. Gratis en open, direct in je browser."
	/>
</svelte:head>

<main class="mx-auto max-w-[100rem] px-4">
	<section class="pt-4 pb-3">
		<h1 class="text-2xl font-bold tracking-tight sm:text-3xl">{kop}</h1>
		<p class="mt-1 text-muted-foreground">{inleiding(vakken, vanVak.length)}</p>
	</section>

	<section aria-label="Filters" class="flex flex-wrap items-center gap-2 pb-3">
		<FilterDropdown label="Vak" opties={VAKKEN.map((v) => ({ waarde: v.id, label: v.label }))} bind:gekozen={vakken} />
		<FilterDropdown label="Niveau" opties={NIVEAUS.map((n) => ({ waarde: n, label: levelLabels[n] }))} bind:gekozen={niveaus} />
		<FilterDropdown label="Thema" opties={themaOpties.map((t) => ({ waarde: t, label: t }))} bind:gekozen={themas} />
		{#if chips.length > 0}
			<ul class="contents" aria-label="Gekozen filters">
				{#each chips as chip (chip.groep + chip.label)}
					<li>
						<button
							type="button"
							class="inline-flex items-center gap-1 rounded-full border border-primary bg-primary py-1 pr-2 pl-3 text-sm text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
							aria-label={`${chip.groep} ${chip.label} weghalen`}
							onclick={chip.weg}
						>
							{chip.label}
							<X class="size-3.5" aria-hidden="true" />
						</button>
					</li>
				{/each}
			</ul>
			<button type="button" class="px-1 py-1 text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline" onclick={wis}>
				Filters wissen
			</button>
		{/if}
	</section>

	<section aria-label="Cursussen">
		<p class="mb-3 text-sm text-muted-foreground">
			{#if zichtbaar.length === vanVak.length && zichtbaar.length > 1}
				Alle {zichtbaar.length} cursussen, eerst voor beginners, daarna gevorderd.
			{:else if zichtbaar.length === vanVak.length}
				Eén cursus, niveau {levelLabels[zichtbaar[0].level].toLowerCase()}.
			{:else}
				{zichtbaar.length} van {vanVak.length} cursussen.
			{/if}
		</p>

		{#if zichtbaar.length === 0}
			<div class="rounded-xl border py-10 text-center">
				<p class="text-muted-foreground">Geen cursus met deze combinatie.</p>
				<button type="button" class={cn(knop, "mt-3")} onclick={wis}>
					Filters wissen
				</button>
			</div>
		{:else}
			<ul id="cursussen" class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
				{#each zichtbaar as c (c.id)}
					<li><CursusKaart cursus={c} /></li>
				{/each}
			</ul>
		{/if}
	</section>

	<section aria-label="Over Coderius" class="mt-4 mb-4 grid gap-5 md:grid-cols-2">
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
