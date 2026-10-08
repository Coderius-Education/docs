<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import { ArrowRight, ExternalLink } from "@lucide/svelte";
	import { SITES_BY_ID } from "@coderius/shared/sites";
	import { curriculum } from "$lib/Curriculum";
	import CursusKaart from "$lib/components/CursusKaart.svelte";
	import { type Klas, normaliseerKlas, VERLAAT_COOKIE } from "$lib/klas";

	const code = page.params.code ?? "";
	let klas = $state<Klas | null>(null);
	let status = $state<"laden" | "klaar" | "weg" | "fout">("laden");

	onMount(async () => {
		try {
			const antwoord = await fetch(`/_cdx/klas/${encodeURIComponent(code)}.json`);
			if (antwoord.status === 404) {
				status = "weg";
				return;
			}
			klas = antwoord.ok ? normaliseerKlas(await antwoord.json()) : null;
			status = klas ? "klaar" : "fout";
		} catch {
			status = "fout";
		}
	});

	const cursus = (id: string) => curriculum.find((c) => c.id === id);
	const cursusNaam = (id: string) => SITES_BY_ID[id]?.label ?? id;

	function verlaat() {
		document.cookie = VERLAAT_COOKIE;
		location.href = "/";
	}
</script>

<svelte:head>
	<title>{klas ? `${klas.naam} — Coderius` : "Klas — Coderius"}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="mx-auto max-w-[100rem] px-4 pb-8">
	{#if status === "laden"}
		<p class="pt-6 text-muted-foreground">Klas laden…</p>
	{:else if status === "weg"}
		<section class="pt-6">
			<h1 class="text-2xl font-bold tracking-tight">Deze klas bestaat niet (meer)</h1>
			<p class="mt-1 text-muted-foreground">
				Misschien heeft je docent een nieuwe link gemaakt. Vraag om de nieuwe, of
				<a href="/" class="underline underline-offset-2">bekijk alle cursussen</a>.
			</p>
		</section>
	{:else if status === "fout" || !klas}
		<section class="pt-6">
			<h1 class="text-2xl font-bold tracking-tight">De klas laadt niet</h1>
			<p class="mt-1 text-muted-foreground">Probeer het zo nog eens.</p>
		</section>
	{:else}
		<section class="flex flex-wrap items-end gap-3 pt-4 pb-3">
			<div class="min-w-0 flex-1">
				<p class="text-sm text-muted-foreground">Klas</p>
				<h1 class="text-2xl font-bold tracking-tight sm:text-3xl">{klas.naam}</h1>
				{#if klas.intro}
					<p class="mt-1 max-w-prose whitespace-pre-line text-muted-foreground">{klas.intro}</p>
				{/if}
			</div>
			<button
				type="button"
				class="rounded-full border px-3 py-1 text-sm transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
				onclick={verlaat}
			>
				Klasweergave verlaten
			</button>
		</section>

		{#each klas.groepen as groep (groep.id)}
			<section class="mt-4" aria-label={groep.titel || "Snelkoppelingen"}>
				{#if groep.titel}
					<h2 class="mb-2 text-lg font-semibold">{groep.titel}</h2>
				{/if}
				<ul class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
					{#each groep.items as item, i (i)}
						<li>
							{#if item.type === "cursus" && cursus(item.site)}
								<CursusKaart cursus={cursus(item.site)!} label={item.label} nieuwTabblad={false} />
							{:else if item.type === "pagina"}
								<a
									href={item.pad}
									class="flex h-full flex-col gap-1 rounded-xl border bg-card p-3.5 text-card-foreground shadow-sm transition-colors hover:border-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
								>
									<span class="text-xs text-muted-foreground">Les uit {cursusNaam(item.site)}</span>
									<span class="text-base font-semibold leading-tight">
										{item.label}<ArrowRight class="ml-1 inline h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
									</span>
								</a>
							{:else if item.type === "link"}
								<a
									href={item.url}
									target="_blank"
									rel="noopener noreferrer"
									class="flex h-full flex-col gap-1 rounded-xl border bg-card p-3.5 text-card-foreground shadow-sm transition-colors hover:border-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
								>
									<span class="text-xs text-muted-foreground">{item.host}</span>
									<span class="text-base font-semibold leading-tight">
										{item.label}<ExternalLink class="ml-1 inline h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
									</span>
								</a>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	{/if}
</main>
