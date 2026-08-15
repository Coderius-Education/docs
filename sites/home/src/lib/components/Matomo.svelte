<script lang="ts">
import { onMount } from "svelte";
import { afterNavigate } from "$app/navigation";
import { buildMatomoSnippet, matomoPagePath } from "@coderius/shared/matomo";
import { MATOMO_SITE_ID } from "$lib/matomo-config";

// Geen zichtbare markup. Injecteert de cookieloze Matomo-snippet alleen in
// productiebuilds, en alleen als MATOMO_SITE_ID al is ingevuld.
//
// Let op: dit gebeurt bewust via document.createElement + appendChild, niet
// via {@html ...} in <svelte:head> — <script>-tags die via innerHTML worden
// ingevoegd voert de browser niet uit.
onMount(() => {
	if (!import.meta.env.PROD || !MATOMO_SITE_ID) return;
	const script = document.createElement("script");
	script.textContent = buildMatomoSnippet({ siteId: MATOMO_SITE_ID });
	document.head.appendChild(script);
});

// SvelteKit is een SPA na de eerste load: zonder dit telt alleen de
// allereerste harde page load als pageview.
afterNavigate(({ from, to }) => {
	if (typeof window === "undefined" || !window._paq) return;
	if (!from || !to || from.url.pathname === to.url.pathname) return;
	// Zelfde vorm als het snippet en de Docusaurus-sites sturen: volledige URL
	// met genormaliseerd pad, zodat een adres met en zonder afsluitende slash
	// niet als twee regels in het rapport belandt.
	const url =
		to.url.origin + matomoPagePath(to.url.pathname) + to.url.search + to.url.hash;
	window._paq.push(["setCustomUrl", url]);
	window._paq.push(["setDocumentTitle", document.title]);
	window._paq.push(["trackPageView"]);
});
</script>
