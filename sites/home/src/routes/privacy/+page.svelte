<script lang="ts">
import { PRIVACY_CONTENT } from "@coderius/shared/privacy-content";
import MatomoOptOut from "$lib/components/MatomoOptOut.svelte";

const { sections, lastUpdated, controller } = PRIVACY_CONTENT;
</script>

<svelte:head>
	<title>Privacy — Coderius</title>
	<meta
		name="description"
		content="Privacyverklaring: hoe en waarom Coderius-cursussites bezoekstatistieken verzamelen via Matomo."
	/>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-10">
	{#each sections as section (section.id)}
		<section class="mb-8">
			<h2 class="mb-3 text-xl font-semibold">{section.heading}</h2>
			{#each section.paragraphs as paragraph (paragraph)}
				<p class="mb-3">{paragraph}</p>
			{/each}
			{#if section.list}
				<ul class="mb-3 list-disc pl-6">
					{#each section.list as item (item)}
						<li>{item}</li>
					{/each}
				</ul>
			{/if}
			{#if section.trailingParagraphs}
				{#each section.trailingParagraphs as paragraph (paragraph)}
					<p class="mb-3">{paragraph}</p>
				{/each}
			{/if}
			{#if section.id === "bezwaar"}
				<MatomoOptOut />
			{/if}
			{#if section.id === "contact"}
				<p>
					Neem contact op met {controller.schoolName}, via
					<a class="underline" href="mailto:{controller.contactEmail}"
						>{controller.contactEmail}</a
					>.
				</p>
			{/if}
		</section>
	{/each}
	<p class="text-muted-foreground text-sm">Laatst bijgewerkt: {lastUpdated}.</p>
</div>
