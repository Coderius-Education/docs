<script lang="ts">
	import { curriculum, levelColors, type Activity } from "$lib/Curriculum.ts";
	import { buildCardChips } from "$lib/ExamProgram.ts";
	import { ExternalLink } from "@lucide/svelte";
	import { Badge } from "$lib/components/ui/badge";
	import * as Card from "$lib/components/ui/card/index.js";
	import { cn } from "$lib/utils.ts";
	import FilterPanel from "$lib/components/FilterPanel.svelte";

	const excluded = ["Code Editor"];
	const sharedTitles = ["Robotica", "Godot game engine"];

	let selectedFilters = $state({
		programmingLanguages: [] as string[],
		projectTypes: [] as string[],
		operatingSystems: [] as string[],
		examDomains: [] as string[],
	});

	function matchesFilters(activity: Activity) {
		const langOk =
			selectedFilters.programmingLanguages.length === 0 ||
			selectedFilters.programmingLanguages.every((lang) =>
				activity.programmingLanguages?.includes(lang)
			);
		const typeOk =
			selectedFilters.projectTypes.length === 0 ||
			selectedFilters.projectTypes.every((type) =>
				activity.projectTypes?.includes(type)
			);
		const osOk =
			selectedFilters.operatingSystems.length === 0 ||
			selectedFilters.operatingSystems.every((os) =>
				activity.operatingSystems?.includes(os)
			);
		const domainOk =
			selectedFilters.examDomains.length === 0 ||
			selectedFilters.examDomains.every((filter) =>
				activity.examDomains?.some((m) =>
					filter.length === 1 ? m.code.startsWith(filter) : m.code === filter,
				),
			);
		return langOk && typeOk && osOk && domainOk;
	}

	const beginnerCourses = $derived(
		curriculum.filter(
			(c) =>
				(c.level === "Beginner" || sharedTitles.includes(c.title)) &&
				!excluded.includes(c.title) &&
				matchesFilters(c)
		)
	);
	const advancedCourses = $derived(
		curriculum.filter(
			(c) =>
				(c.level !== "Beginner" || sharedTitles.includes(c.title)) &&
				!excluded.includes(c.title) &&
				matchesFilters(c)
		)
	);

	function handleFilterChange(newFilters: {
		programmingLanguages: string[];
		projectTypes: string[];
		operatingSystems: string[];
		examDomains?: string[];
	}) {
		selectedFilters = { ...newFilters, examDomains: newFilters.examDomains ?? [] };
	}
</script>

<div class="mx-auto w-[96%]">

	<FilterPanel
		activities={curriculum}
		{selectedFilters}
		onFilterChange={handleFilterChange}
		showExamDomains={true}
		showStandardFilters={false}
	/>

	<!-- Timeline -->
	<div class="relative ml-4 md:ml-8">
		<!-- Vertical line -->
		<div class="absolute top-0 bottom-0 left-2 w-0.5 bg-border"></div>

		<!-- Step 1: Klas 4 -->
		<div class="relative pb-4 pl-10">
			<!-- Milestone dot -->
			<div class="absolute left-0 top-1 h-5 w-5 rounded-full border-4 border-primary bg-background"></div>

			<div class="flex flex-wrap items-baseline gap-3">
				<h2 class="text-xl font-bold">Klas 4: Basis</h2>
				<Badge variant="outline">Havo 4 / VWO 4</Badge>
				<p class="text-sm text-muted-foreground">Alle leerlingen doorlopen de basiscursussen</p>
			</div>

			<div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
				{#each beginnerCourses as course}
					<Card.Root class="py-3">
						<Card.Header class="px-3">
							<div class="flex items-center justify-between gap-3">
								<Card.Title class="text-lg">
									<a href={course.link} target="_blank" class="inline-flex items-center gap-1 hover:underline">
										{course.title}
										<ExternalLink class="h-4 w-4 shrink-0 text-muted-foreground" />
									</a>
								</Card.Title>
								<Badge
									variant="default"
									class={cn("text-xs whitespace-nowrap", levelColors[course.level])}
								>
									{course.level}
								</Badge>
							</div>
							{@const chips = buildCardChips(course.examDomains)}
							{#if chips.length}
								<div class="mt-1 flex flex-wrap gap-1">
									{#each chips as chip}
										<Badge
											variant={chip.strength === "strong" ? "default" : "outline"}
											class="text-xs"
											title={chip.title}
										>
											{chip.display}
										</Badge>
									{/each}
								</div>
							{/if}
						</Card.Header>
					</Card.Root>
				{/each}
			</div>
		</div>

		<!-- Step 2: Klas 5+ -->
		<div class="relative pb-4 pl-10">
			<!-- Milestone dot -->
			<div class="absolute left-0 top-1 h-5 w-5 rounded-full border-4 border-primary bg-background"></div>

			<div class="flex flex-wrap items-baseline gap-3">
				<h2 class="text-xl font-bold">Klas 5+: Verdieping</h2>
				<Badge variant="outline">Havo 5 / VWO 5-6</Badge>
				<p class="text-sm text-muted-foreground">Leerlingen kiezen meerdere verdiepingsmodules</p>
			</div>

			<div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
				{#each advancedCourses as course}
					<Card.Root class="py-3">
						<Card.Header class="px-3">
							<div class="flex items-center justify-between gap-3">
								<Card.Title class="text-lg">
									<a href={course.link} target="_blank" class="inline-flex items-center gap-1 hover:underline">
										{course.title}
										<ExternalLink class="h-4 w-4 shrink-0 text-muted-foreground" />
									</a>
								</Card.Title>
								<Badge
									variant="default"
									class={cn("text-xs whitespace-nowrap", levelColors[course.level])}
								>
									{course.level}
								</Badge>
							</div>
							{@const chips = buildCardChips(course.examDomains)}
							{#if chips.length}
								<div class="mt-1 flex flex-wrap gap-1">
									{#each chips as chip}
										<Badge
											variant={chip.strength === "strong" ? "default" : "outline"}
											class="text-xs"
											title={chip.title}
										>
											{chip.display}
										</Badge>
									{/each}
								</div>
							{/if}
						</Card.Header>
					</Card.Root>
				{/each}
			</div>
		</div>
	</div>
</div>
