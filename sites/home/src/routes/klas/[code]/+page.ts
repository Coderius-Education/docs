// Een klas bestaat pas als een docent hem maakt, dus niet bij het bouwen: deze
// pagina draait alleen in de browser. De delivery serveert de SPA-terugval
// (404.html) op /klas/<code> met status 200 en zet het klas-cookie.
export const prerender = false;
export const ssr = false;
