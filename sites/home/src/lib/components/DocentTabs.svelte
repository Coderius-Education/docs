<script lang="ts">
	import { page } from "$app/state";
	import { cn } from "$lib/utils";

	// Twee docentenpagina's met elk één vraag: "wanneer geef ik wat" en
	// "welke cursus dekt welk examendomein". De tabbalk maakt de tweede
	// zichtbaar vanaf de eerste.
	const tabs = [
		{ href: "/docent", label: "Curriculum" },
		{ href: "/docent/examenprogramma", label: "Examenprogramma" },
	];

	function actief(href: string): boolean {
		// Zonder .html en zonder slash aan het eind: adapter-static schrijft
		// docent.html, en een lokale testserver laat dat in het pad staan.
		return page.url.pathname.replace(/\.html$/, "").replace(/\/$/, "") === href;
	}
</script>

<nav aria-label="Docentenpagina's" class="mb-6 flex flex-wrap gap-1 border-b">
	{#each tabs as t (t.href)}
		<a
			href={t.href}
			aria-current={actief(t.href) ? "page" : undefined}
			class={cn(
				"-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
				actief(t.href)
					? "border-primary text-foreground"
					: "border-transparent text-muted-foreground hover:text-foreground"
			)}
		>
			{t.label}
		</a>
	{/each}
</nav>
