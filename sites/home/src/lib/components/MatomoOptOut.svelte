<script lang="ts">
import { onMount } from "svelte";
import { Button } from "$lib/components/ui/button";
import {
	matomoForgetOptOut,
	matomoIsOptedOut,
	matomoOptOut,
	type MatomoOptOutStatus,
} from "@coderius/shared/matomo";

// Interactielogica volledig gedelegeerd aan @coderius/shared/matomo — dit
// component doet zelf geen window._paq-aanroepen, alleen de weergave. Svelte-
// equivalent van packages/shared/components/Privacy/MatomoOptOut.tsx.
let status = $state<MatomoOptOutStatus | "loading">("loading");

onMount(() => {
	matomoIsOptedOut((s) => {
		status = s;
	});
});

function toggle() {
	if (status === "opted-out") {
		matomoForgetOptOut();
		status = "active";
	} else {
		matomoOptOut();
		status = "opted-out";
	}
}
</script>

{#if status !== "loading"}
	<div class="rounded-md border p-4">
		{#if status === "unavailable"}
			<p class="text-muted-foreground text-sm">
				Statistieken zijn op dit moment niet actief in je browser, dus er is
				niets om bezwaar tegen te maken.
			</p>
		{:else}
			<Button variant="secondary" onclick={toggle}>
				{status === "opted-out"
					? "Statistieken weer toestaan"
					: "Bezwaar maken tegen statistieken"}
			</Button>
			<p class="text-muted-foreground mt-2 text-sm">
				{status === "opted-out"
					? "Je bezwaar is opgeslagen in je browser. We tellen jouw bezoek niet meer mee."
					: "Je bezoek wordt op dit moment cookieloos meegeteld in de statistieken."}
			</p>
		{/if}
	</div>
{/if}
