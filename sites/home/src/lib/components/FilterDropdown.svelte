<script lang="ts" generics="T extends string">
	import { ChevronDown } from "@lucide/svelte";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import { cn } from "$lib/utils";

	// Eén filtergroep als knop met een menu vol vinkjes. Meer dan één keuze mag:
	// binnen een groep is het "of", tussen groepen "en" (dat doet de pagina).
	// De gekozen waarden staan als chips naast de knoppen; die tekent de pagina,
	// zodat de chips van alle groepen samen op één regel na de knoppen staan.
	interface Props {
		label: string;
		opties: { waarde: T; label: string }[];
		gekozen: T[];
	}

	let { label, opties, gekozen = $bindable() }: Props = $props();

	function zet(waarde: T, aan: boolean) {
		gekozen = aan
			? opties.map((o) => o.waarde).filter((w) => w === waarde || gekozen.includes(w))
			: gekozen.filter((w) => w !== waarde);
	}
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger
		class={cn(
			"inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none data-[state=open]:bg-accent",
			gekozen.length > 0 && "border-primary"
		)}
		aria-label={gekozen.length > 0 ? `${label}, ${gekozen.length} gekozen` : label}
	>
		{label}
		{#if gekozen.length > 0}
			<span
				class="rounded-full bg-primary px-1.5 text-xs leading-5 font-medium text-primary-foreground"
				aria-hidden="true">{gekozen.length}</span
			>
		{/if}
		<ChevronDown class="size-3.5 text-muted-foreground" aria-hidden="true" />
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="w-auto min-w-44">
		<DropdownMenu.Group aria-label={label}>
			{#each opties as optie (optie.waarde)}
				<DropdownMenu.CheckboxItem
					checked={gekozen.includes(optie.waarde)}
					onCheckedChange={(aan) => zet(optie.waarde, aan)}
				>
					{optie.label}
				</DropdownMenu.CheckboxItem>
			{/each}
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
