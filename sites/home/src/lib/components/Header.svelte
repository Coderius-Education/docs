<script lang="ts">
import { Button } from "$lib/components/ui/button";
import * as NavigationMenu from "$lib/components/ui/navigation-menu/index.js";
import ThemeButton from "$lib/components/ui/theme-button/ThemeButton.svelte";
</script>

<div class="h-12 border-b-2 bg-sidebar pt-1">
	<NavigationMenu.Root>
		<NavigationMenu.List class="flex w-screen">
			<NavigationMenu.Item>
				<Button variant="link" href="/">Modules</Button>
			</NavigationMenu.Item>
			<NavigationMenu.Item>
				<Button variant="link" href="/docent">Docent</Button>
			</NavigationMenu.Item>
			<div class="mr-2 ml-auto flex">
				<NavigationMenu.Item>
					<ThemeButton />
				</NavigationMenu.Item>
			</div>
		</NavigationMenu.List>
	</NavigationMenu.Root>
</div>
