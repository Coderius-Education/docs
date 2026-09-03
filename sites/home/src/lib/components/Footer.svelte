<script lang="ts">
	import { REPO_URL } from "@coderius/shared/sites";
</script>

<footer class="border-t px-4 py-6 text-sm">
	<div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2">
		<p class="text-muted-foreground">
			Licensed under
			<a
				class="underline"
				href="https://creativecommons.org/licenses/by-nc/4.0/deed.nl"
				target="_blank"
				rel="license noopener noreferrer"
			>
				Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)
			</a>.
		</p>
		<nav aria-label="Voettekst" class="flex flex-wrap gap-4 text-muted-foreground">
			<a class="underline" href="/docent">Voor docenten</a>
			<a class="underline" href={REPO_URL} target="_blank" rel="noopener noreferrer">Broncode op GitHub</a>
			<a class="underline" href="/privacy">Privacy</a>
		</nav>
	</div>
</footer>
