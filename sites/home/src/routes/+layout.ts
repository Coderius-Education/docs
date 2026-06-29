// Prerender alle pagina's tot statische HTML. Zonder dit valt adapter-static
// terug op een SPA met alleen 404.html, waardoor de root (/) geen index.html
// krijgt. De homepage is volledig statisch (client-side filter), dus prerender
// kan aan.
export const prerender = true;
