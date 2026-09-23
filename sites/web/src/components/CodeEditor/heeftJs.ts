// Heeft dit oefenveld JavaScript? Dan hoort de console erbij. De eerste
// JS-lessen hebben nog geen script.js: de code staat in een onclick of een
// <script>-tag in de HTML. De console bleef daar weg, terwijl buildDoc de
// fouten uit die code al doorstuurde.
export function heeftJavaScript(html: string, js: string): boolean {
  return js.trim() !== '' || /<script\b/i.test(html) || /<[a-z][^>]*\son[a-z]+\s*=/i.test(html);
}
