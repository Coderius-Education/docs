<script lang="ts">
	// Het cursusoverzicht met filters: was de hele homepage, is nu een blok van de
	// vakpagina. Met automatischeKop staan kop en inleiding erboven zoals vroeger;
	// een docent kan vooraf filters kiezen, cursussen uitlichten of het overzicht
	// tot een paar cursussen beperken.
	import { X } from "@lucide/svelte";
	import { SUBJECTS } from "@coderius/shared/sites";
	import {
		type Activity,
		type Thema,
		curriculum,
		levelLabels,
		themasVan,
		themasVoorVakken,
	} from "$lib/Curriculum";
	import { inleiding } from "$lib/vakken";
	import CursusKaart from "$lib/components/CursusKaart.svelte";
	import FilterDropdown from "$lib/components/FilterDropdown.svelte";
	import { cn } from "$lib/utils";
	import type { BlokProps } from "$lib/vakpagina/types";

	let { vak, props }: { vak: string | null; props: BlokProps } = $props();

	const NIVEAUS: Activity["level"][] = ["Beginner", "Medium"];
	const vakLabel = (id: string) => SUBJECTS.find((v) => v.id === id)?.label ?? id;

	// De cursussen van dit blok: eventueel beperkt, uitgelichte eerst.
	const basis = $derived.by(() => {
		const alleen = props.alleen ?? [];
		const uitgelicht = props.uitgelicht ?? [];
		const lijst = alleen.length ? curriculum.filter((c) => alleen.includes(c.id)) : curriculum;
		const rang = (c: Activity) => {
			const i = uitgelicht.indexOf(c.id);
			return i === -1 ? uitgelicht.length : i;
		};
		return [...lijst].sort((a, b) => rang(a) - rang(b));
	});
	// Alleen vakken met minstens één cursus; een vak zonder kaarten is geen filter.
	const VAKKEN = $derived(SUBJECTS.filter((v) => basis.some((c) => c.subject === v.id)));

	// Drie filters, elk met meer keuzes tegelijk: binnen een filter "of", tussen
	// de filters "en". De examendomeinen staan op de docentenpagina.
	// Het vak van de host (of van de vakpagina) staat vooraf aan, net als de
	// filters die de docent koos. Meteen bij het bouwen, niet pas in de browser:
	// anders flitst de vooraf gebouwde vakpagina eerst als "Coderius Education".
	const beginVakken = (v: string | null) => (v && VAKKEN.some((x) => x.id === v) ? [v] : []);
	const beginNiveaus = () =>
		(props.niveaus ?? []).filter((n): n is Activity["level"] => (NIVEAUS as string[]).includes(n));
	// svelte-ignore state_referenced_locally
	let vakken = $state<string[]>(beginVakken(vak));
	let niveaus = $state<Activity["level"][]>(beginNiveaus());
	// svelte-ignore state_referenced_locally
	let themas = $state<Thema[]>((props.themas ?? []) as Thema[]);

	// Op de root van de apex en lokaal komt het vak pas na het laden binnen.
	// svelte-ignore state_referenced_locally
	let vorigVak = vak;
	$effect(() => {
		if (vak === vorigVak) return;
		vorigVak = vak;
		vakken = beginVakken(vak);
	});

	// Het Thema-filter toont alleen de thema's van de gekozen vakken; een thema
	// van een vak dat niet meer gekozen is, valt weg.
	const themaOpties = $derived(themasVoorVakken(vakken));
	$effect(() => {
		const weg = themas.filter((t) => !themaOpties.includes(t));
		if (weg.length > 0) themas = themas.filter((t) => themaOpties.includes(t));
	});

	const vanVak = $derived(basis.filter((c) => vakken.length === 0 || vakken.includes(c.subject)));
	const zichtbaar = $derived(
		vanVak.filter(
			(c) =>
				(niveaus.length === 0 || niveaus.includes(c.level)) &&
				(themas.length === 0 || themasVan(c).some((t) => themas.includes(t)))
		)
	);
	const kop = $derived(vakken.length === 1 ? vakLabel(vakken[0]) : "Coderius Education");
	const filters = $derived(props.filters !== false);

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
	{#if props.automatischeKop}
		<title>{vakken.length === 1 ? `${kop} — Coderius` : "Coderius Education"}</title>
	{/if}
</svelte:head>

{#if props.automatischeKop}
	<section class="pt-4 pb-3">
		<h1 class="text-2xl font-bold tracking-tight sm:text-3xl">{kop}</h1>
		<p class="mt-1 text-muted-foreground">{inleiding(vakken, vanVak.length)}</p>
	</section>
{:else if props.title}
	<h2 class="pb-3 text-xl font-semibold">{props.title}</h2>
{/if}

{#if filters}
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
{/if}

<section aria-label="Cursussen">
	{#if filters}
		<p class="mb-3 text-sm text-muted-foreground">
			{#if zichtbaar.length === vanVak.length && zichtbaar.length > 1}
				Alle {zichtbaar.length} cursussen, eerst voor beginners, daarna gevorderd.
			{:else if zichtbaar.length === vanVak.length && zichtbaar.length === 1}
				Eén cursus, niveau {levelLabels[zichtbaar[0].level].toLowerCase()}.
			{:else}
				{zichtbaar.length} van {vanVak.length} cursussen.
			{/if}
		</p>
	{/if}

	{#if zichtbaar.length === 0}
		<div class="rounded-xl border py-10 text-center">
			<p class="text-muted-foreground">Geen cursus met deze combinatie.</p>
			<button type="button" class={cn(knop, "mt-3")} onclick={wis}>
				Filters wissen
			</button>
		</div>
	{:else}
		<ul id="cursussen" class="grid grid-cols-1 gap-3 text-left sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
			{#each zichtbaar as c (c.id)}
				<li><CursusKaart cursus={c} /></li>
			{/each}
		</ul>
	{/if}
</section>
