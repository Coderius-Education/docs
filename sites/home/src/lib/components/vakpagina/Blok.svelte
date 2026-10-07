<script lang="ts">
	// Eén blok van een vakpagina, en (recursief) zijn kinderen. `genest` is waar
	// voor blokken binnen een ander blok: die krijgen geen eigen breedte of ruimte.
	import { ExternalLink } from "@lucide/svelte";
	import Blok from "./Blok.svelte";
	import Cursusoverzicht from "./Cursusoverzicht.svelte";
	import Markdown from "./Markdown.svelte";
	import { binnenKlassen, buitenKlassen, kolommen } from "$lib/vakpagina/opmaak";
	import type { Blok as BlokType } from "$lib/vakpagina/types";
	import { cn } from "$lib/utils";

	let {
		blok,
		vak,
		genest = false,
	}: { blok: BlokType; vak: string | null; genest?: boolean } = $props();

	const p = $derived(blok.props ?? {});
	const kinderen = $derived(blok.kinderen ?? []);
	const buiten = $derived(genest ? "" : buitenKlassen(p));
	const binnen = $derived(binnenKlassen(p));
	const extern = (href?: string) => !!href && href.startsWith("https://");
	const uitlijning = $derived(
		p.align === "center" ? "justify-center" : p.align === "right" ? "justify-end" : "justify-start"
	);
</script>

{#if blok.type === "Courses"}
	<div class={cn(buiten, binnen)}>
		<Cursusoverzicht {vak} props={p} />
	</div>
{:else if blok.type === "Hero"}
	<section
		class={cn(
			buiten,
			binnen,
			p.variant === "plain" ? "" : "vak-op-primary rounded-xl bg-primary px-6 text-primary-foreground",
			p.variant === "compact" ? "py-6" : p.variant === "plain" ? "py-4" : "py-12",
			p.align ? "" : "text-center"
		)}
	>
		{#if p.title}
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">{p.title}</h1>
		{/if}
		{#if p.tagline}
			<p class="mt-2 text-lg opacity-90">{p.tagline}</p>
		{/if}
		{#if blok.tekst}
			<Markdown tekst={blok.tekst} class="mx-auto mt-3 max-w-prose" />
		{/if}
		{#each kinderen as kind (kind.id)}
			<div class="mt-5"><Blok blok={kind} {vak} genest /></div>
		{/each}
	</section>
{:else if blok.type === "Section"}
	<section class={cn(buiten, binnen)}>
		{#if p.title}
			<h2 class={genest ? "text-lg font-semibold" : "text-2xl font-semibold tracking-tight"}>{p.title}</h2>
		{/if}
		{#if p.subtitle}
			<p class="mt-1 text-muted-foreground">{p.subtitle}</p>
		{/if}
		{#if blok.tekst}
			<Markdown
				tekst={blok.tekst}
				class={genest ? "mt-1 text-sm text-muted-foreground" : "mt-2 max-w-prose text-muted-foreground"}
			/>
		{/if}
		{#each kinderen as kind (kind.id)}
			<div class="mt-4"><Blok blok={kind} {vak} genest /></div>
		{/each}
	</section>
{:else if blok.type === "Columns"}
	<div class={cn(buiten, binnen)}>
		<div class={kolommen(p.count)}>
			{#each kinderen as kind (kind.id)}
				<Blok blok={kind} {vak} genest />
			{/each}
		</div>
	</div>
{:else if blok.type === "Card"}
	{#snippet kaart()}
		{#if p.info}
			<span class="text-xs text-muted-foreground">{p.info}</span>
		{/if}
		{#if p.title}
			<h3 class="text-base font-semibold leading-tight">
				{p.title}{#if extern(p.href)}<ExternalLink class="ml-1 inline h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />{/if}
			</h3>
		{/if}
		{#if blok.tekst}
			<Markdown tekst={blok.tekst} class="mt-1 text-muted-foreground" />
		{/if}
	{/snippet}
	<div class={cn(buiten)}>
		{#if p.href}
			<a
				href={p.href}
				target={extern(p.href) ? "_blank" : undefined}
				rel={extern(p.href) ? "noopener noreferrer" : undefined}
				class={cn(
					"flex h-full flex-col gap-1 rounded-xl border bg-card p-4 text-card-foreground shadow-sm transition-colors hover:border-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
					binnen
				)}
			>
				{@render kaart()}
			</a>
		{:else}
			<div class={cn("flex h-full flex-col gap-1 rounded-xl border bg-card p-4 text-card-foreground shadow-sm", binnen)}>
				{@render kaart()}
			</div>
		{/if}
	</div>
{:else if blok.type === "Buttons"}
	<div class={cn(buiten, "flex flex-wrap gap-2", uitlijning)}>
		{#each kinderen as kind (kind.id)}
			<Blok blok={kind} {vak} genest />
		{/each}
	</div>
{:else if blok.type === "Button"}
	<a
		href={p.href ?? "#"}
		target={extern(p.href) ? "_blank" : undefined}
		rel={extern(p.href) ? "noopener noreferrer" : undefined}
		class={cn(
			"inline-flex items-center rounded-md font-medium transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
			p.size === "sm" ? "px-3 py-1 text-sm" : p.size === "lg" ? "px-6 py-3 text-lg" : "px-4 py-2",
			p.variant === "secondary"
				? "border border-current bg-transparent hover:bg-accent hover:text-accent-foreground"
				: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 [.vak-op-primary_&]:bg-background [.vak-op-primary_&]:text-foreground [.vak-op-primary_&]:hover:bg-accent"
		)}
	>
		{blok.tekst || "Knop"}
	</a>
{:else if blok.type === "Picture" && p.src}
	<figure class={cn(buiten, binnen)}>
		<img src={p.src} alt={p.alt ?? ""} class="mx-auto h-auto max-w-full rounded-xl" loading="lazy" />
		{#if p.caption}
			<figcaption class="mt-2 text-sm text-muted-foreground">{p.caption}</figcaption>
		{/if}
	</figure>
{:else if blok.type === "Divider"}
	<div class={buiten}><hr class="border-border" /></div>
{/if}
