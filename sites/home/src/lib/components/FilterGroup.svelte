<script lang="ts">
	import Badge from '$lib/components/ui/badge/badge.svelte';

	interface Props {
		title: string;
		options: string[];
		selected: string[];
		onToggle: (value: string) => void;
		tooltips?: (option: string) => string | undefined;
		labels?: (option: string) => string;
		inline?: boolean;
	}

	let {
		title,
		options,
		selected,
		onToggle,
		tooltips,
		labels,
		inline = false,
	}: Props = $props();
</script>

{#if inline}
	<div class="flex flex-wrap items-center gap-2">
		<h3 class="text-sm font-semibold">{title}:</h3>
		{#each options as option}
			<Badge
				variant={selected.includes(option) ? 'default' : 'secondary'}
				class="cursor-pointer px-3 py-1 transition-opacity hover:opacity-80"
				onclick={() => onToggle(option)}
				title={tooltips?.(option)}
			>
				{labels ? labels(option) : option}
			</Badge>
		{/each}
	</div>
{:else}
	<div>
		<h3 class="mb-2 text-sm font-semibold">{title}</h3>
		<div class="flex flex-wrap gap-2">
			{#each options as option}
				<Badge
					variant={selected.includes(option) ? 'default' : 'secondary'}
					class="cursor-pointer px-3 py-1 transition-opacity hover:opacity-80"
					onclick={() => onToggle(option)}
					title={tooltips?.(option)}
				>
					{labels ? labels(option) : option}
				</Badge>
			{/each}
		</div>
	</div>
{/if}
