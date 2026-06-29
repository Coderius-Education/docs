<script lang="ts">
import { levelColors, ownCurriculum } from "$lib/Curriculum.ts";
import { ExternalLink } from "@lucide/svelte";
import { Badge } from "$lib/components/ui/badge";
import { Button } from "$lib/components/ui/button";
import * as Card from "$lib/components/ui/card/index.js";
import { Separator } from "$lib/components/ui/separator/index.js";
import { cn } from "$lib/utils.ts";
import FilterPanel from "$lib/components/FilterPanel.svelte";

// Filter state structure
let selectedFilters = $state({
	programmingLanguages: [] as string[],
	projectTypes: [] as string[],
	operatingSystems: [] as string[]
});

// Filter curriculum based on selected filters
const filteredCurriculum = $derived.by(() => {
	// If no filters selected, show all
	const hasAnyFilter =
		selectedFilters.programmingLanguages.length > 0 ||
		selectedFilters.projectTypes.length > 0 ||
		selectedFilters.operatingSystems.length > 0;

	if (!hasAnyFilter) return ownCurriculum;

	// AND logic within each group: activity must have ALL selected items in that group
	return ownCurriculum.filter((activity) => {
		const matchesProgrammingLanguages =
			selectedFilters.programmingLanguages.length === 0 ||
			selectedFilters.programmingLanguages.every((lang) =>
				activity.programmingLanguages?.includes(lang)
			);

		const matchesProjectTypes =
			selectedFilters.projectTypes.length === 0 ||
			selectedFilters.projectTypes.every((type) =>
				activity.projectTypes?.includes(type)
			);

		const matchesOperatingSystems =
			selectedFilters.operatingSystems.length === 0 ||
			selectedFilters.operatingSystems.every((os) =>
				activity.operatingSystems?.includes(os)
			);

		// AND logic between groups: all groups must match
		return (
			matchesProgrammingLanguages &&
			matchesProjectTypes &&
			matchesOperatingSystems
		);
	});
});

// Handle filter updates from FilterPanel
function handleFilterChange(newFilters: typeof selectedFilters) {
	selectedFilters = newFilters;
}

</script>

<div class="mx-auto w-[96%]">
	<div class="mb-4 mt-6">
		<h1 class="text-center text-3xl font-bold">Coderius Education</h1>
	</div>

	<div>
		<!-- Filter Section -->
		<FilterPanel
			activities={ownCurriculum}
			{selectedFilters}
			onFilterChange={handleFilterChange}
		/>

		<!-- Documents Grid -->
		<div class="mb-6 flex items-baseline gap-3">
			<h2 class="text-2xl font-bold">Lesmateriaal</h2>
			<p class="text-sm text-white-600">{filteredCurriculum.length} cursussen gevonden</p>
		</div>

		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
			{#each filteredCurriculum as curriculum}
				<Card.Root>
					<Card.Header>
						<div class="flex items-center justify-between gap-3">
							<Card.Title class="text-lg">
								<a href={curriculum.link} target="_blank" class="inline-flex items-center gap-1 hover:underline">
									{curriculum.title}
									<ExternalLink class="h-4 w-4 shrink-0 text-muted-foreground" />
								</a>
							</Card.Title>
							<Badge
								variant="default"
								class={cn('text-xs whitespace-nowrap', levelColors[curriculum.level])}
							>
								{curriculum.level}
							</Badge>
						</div>
					</Card.Header>
				</Card.Root>
			{/each}
		</div>

		{#if filteredCurriculum.length === 0}
			<div class="py-12 text-center">
				<p class="text-lg text-gray-500">
					Geen lesmaterialen gevonden met de geselecteerde filters.
				</p>
				<Button
					variant="outline"
					class="mt-4"
					onclick={() =>
						(selectedFilters = {
							programmingLanguages: [],
							projectTypes: [],
							operatingSystems: []
						})}
				>
					Leeg filters
				</Button>
			</div>
		{/if}
	</div>

    <div class="flex mt-8">
        <Card.Root class="mr-2 w-5/12">
            <Card.Header>
                <Card.Title class="text-4xl">Lesmateriaal</Card.Title>
                <Card.Description class="text-xl">Wij maken ons eigen lesmateriaal, gratis voor niets</Card.Description>
            </Card.Header>
            <Card.Content class="text-sm">
                <p>
                    Wij blijven voortdurend zoeken naar manieren om ons lesmateriaal te verbeteren, zowel didactisch als inhoudelijk. 
                    Al ons lesmateriaal is open source, zodat iedereen het vrij kan gebruiken, aanpassen en verder ontwikkelen. 
                    Veel van het materiaal is opgebouwd met eigen ontwikkelde tools en frameworks, waarmee we de best mogelijke leerervaring willen creëren. 
                    We nodigen leraren van harte uit om onze lessen te gebruiken, aan te passen en te delen op een manier die past bij hun leerlingen. 
                    Heb je ideeën, suggesties of wil je zelf bijdragen aan nieuw lesmateriaal? Neem dan gerust contact met ons op!
                </p>
            </Card.Content>
        </Card.Root>
        <Card.Root class="w-7/12">
            <Card.Header>
                <Card.Title class="text-4xl">Visie</Card.Title>
                <Card.Description class="text-lg">Onze visie is gebaseerd op leren met de praktijk</Card.Description>
            </Card.Header>
            <Card.Content class="text-sm">
                <p>
                    Wij geloven dat leren het beste gebeurt door te doen. Daarom is ons lesmateriaal zo ontwikkeld dat studenten actief worden betrokken bij het leerproces. 
                    In onze cursussen combineren we theorie met praktische opdrachten, projecten en realistische voorbeelden die de leerstof tot leven brengen. 
                    Ons doel is om lesmateriaal te maken dat niet alleen informatief is, maar ook inspirerend en leuk om mee te werken. 
                    Door studenten volop de kans te geven hun kennis direct toe te passen, bereiden we hen beter voor op de echte uitdagingen binnen de technologie-industrie. 
                    Samen met docenten blijven we ons materiaal voortdurend verbeteren, zodat de leerervaring steeds beter en effectiever wordt.
                </p>
            </Card.Content>
        </Card.Root>
    </div>
	<Separator class="my-4" />
</div>
