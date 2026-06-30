<script lang="ts">
	import FilterGroup from './FilterGroup.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import type { Activity } from '$lib/Curriculum';
	import {
		examDomains,
		formatExamDomainTooltip,
		formatKeuzeDomainTooltip,
		keuzeDomainGroups,
	} from '$lib/ExamProgram';

	interface Props {
		activities: Activity[];
		selectedFilters: {
			programmingLanguages: string[];
			projectTypes: string[];
			operatingSystems: string[];
			examDomains?: string[];
		};
		onFilterChange: (filters: typeof selectedFilters) => void;
		showExamDomains?: boolean;
		showStandardFilters?: boolean;
	}

	let {
		activities,
		selectedFilters,
		onFilterChange,
		showExamDomains = false,
		showStandardFilters = true,
	}: Props = $props();

	// Extract unique values per category
	const availableProgrammingLanguages = $derived(
		Array.from(new Set(activities.flatMap((a) => a.programmingLanguages || []))).sort()
	);

	const availableProjectTypes = $derived(
		Array.from(new Set(activities.flatMap((a) => a.projectTypes || []))).sort()
	);

	const availableOperatingSystems = $derived(
		Array.from(new Set(activities.flatMap((a) => a.operatingSystems || []))).sort()
	);

	// Examendomeinen komen uit ExamProgram. We splitsen kerndomeinen (B-F,
	// verplicht; getoond als subdomein-codes) en keuzedomeinen (G-R; getoond
	// als hoofdletter + naam, subdomeinen alleen in de tooltip).
	const kernParents = new Set(["B", "C", "D", "E", "F"]);
	const kernDomeinCodes = examDomains
		.filter((d) => kernParents.has(d.parent ?? ""))
		.map((d) => d.code);
	const keuzeDomainLetters = keuzeDomainGroups.map((g) => g.letter);
	const keuzeDomainLabel = (letter: string) => {
		const g = keuzeDomainGroups.find((x) => x.letter === letter);
		return g ? `${g.letter} — ${g.name}` : letter;
	};

	function toggleFilter(
		category: keyof typeof selectedFilters,
		value: string
	) {
		const newFilters = { ...selectedFilters };
		const current = newFilters[category] ?? [];
		if (current.includes(value)) {
			newFilters[category] = current.filter((v) => v !== value);
		} else {
			newFilters[category] = [...current, value];
		}
		onFilterChange(newFilters);
	}

	const hasActiveFilters = $derived(
		selectedFilters.programmingLanguages.length > 0 ||
			selectedFilters.projectTypes.length > 0 ||
			selectedFilters.operatingSystems.length > 0 ||
			(selectedFilters.examDomains?.length ?? 0) > 0
	);

	function clearAllFilters() {
		onFilterChange({
			programmingLanguages: [],
			projectTypes: [],
			operatingSystems: [],
			examDomains: []
		});
	}
</script>

<div class="mb-8 rounded-lg border border-gray-200 p-6 dark:border-gray-700">
	<div class="mb-0 flex items-center justify-between">
		{#if hasActiveFilters}
			<Button variant="outline" size="sm" onclick={clearAllFilters}>
				Wis alle filters
			</Button>
		{/if}
	</div>

	{#if showStandardFilters}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<FilterGroup
				title="Besturingssystemen"
				options={availableOperatingSystems}
				selected={selectedFilters.operatingSystems}
				onToggle={(value) => toggleFilter('operatingSystems', value)}
			/>

			<FilterGroup
				title="Projecttypen"
				options={availableProjectTypes}
				selected={selectedFilters.projectTypes}
				onToggle={(value) => toggleFilter('projectTypes', value)}
			/>

			<FilterGroup
				title="Programmeertalen"
				options={availableProgrammingLanguages}
				selected={selectedFilters.programmingLanguages}
				onToggle={(value) => toggleFilter('programmingLanguages', value)}
			/>
		</div>
	{/if}

	{#if showExamDomains}
		<div class={showStandardFilters ? 'mt-4 space-y-4' : 'space-y-4'}>
			<FilterGroup
				title="Kerndomeinen"
				options={kernDomeinCodes}
				selected={selectedFilters.examDomains ?? []}
				onToggle={(value) => toggleFilter('examDomains', value)}
				tooltips={formatExamDomainTooltip}
				inline
			/>
			<FilterGroup
				title="Keuzedomeinen"
				options={keuzeDomainLetters}
				selected={selectedFilters.examDomains ?? []}
				onToggle={(value) => toggleFilter('examDomains', value)}
				tooltips={formatKeuzeDomainTooltip}
				labels={keuzeDomainLabel}
				inline
			/>
		</div>
	{/if}
</div>
