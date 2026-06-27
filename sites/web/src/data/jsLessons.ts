// De volgorde én volledigheid van de JS-lessen komen uit de sidebar (sidebars.ts),
// zodat de overzichtstabel op /js niet kan verouderen: een nieuwe les in de
// jsSidebar verschijnt automatisch. Hier staan alleen de Nederlandse labels per
// doc-id; een onbekende id valt terug op de slug tot je 'm hieronder benoemt.
import sidebars from '@site/sidebars';

const labels: Record<string, string> = {
  'js-basics/intro-javascript': 'Wat is JavaScript?',
  'js-basics/inline-onclick': 'Inline onclick',
  'js-basics/inline-stijl': 'Inline stijl',
  'js-basics/script-tag': 'De script-tag',
  'js-basics/scriptjs': 'script.js',
  'js-basics/variabelen': 'Variabelen',
  'js-basics/events': 'Events',
  'js-basics/operatoren-types': 'Waarden en operatoren',
  'js-basics/if-else': 'Beslissingen met if/else',
  'js-basics/formulier-data': 'Formulier-data ophalen',
  'js-basics/prompt-alert': 'prompt en alert',
  'js-basics/loops': 'Loops',
  'js-basics/arrays': 'Arrays',
  'js-basics/modern-dom': 'Modern DOM',
};

export type JsLes = {to: string; label: string};

const ids = (sidebars.jsSidebar ?? []).filter(
  (item): item is string => typeof item === 'string',
);

export const jsLessons: JsLes[] = ids.map((id) => ({
  to: `/docs/${id}`,
  label: labels[id] ?? id.replace('js-basics/', ''),
}));
