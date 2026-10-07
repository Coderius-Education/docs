// Elk python-codeblok op deze site krijgt regelnummers, zonder dat 300 fences
// in de lessen `showLineNumbers` hoeven te dragen. De swizzle in index.tsx
// beslist met deze helper; de fences binnen <CodeUitleg> houden hun expliciete
// `showLineNumbers`, want packages/shared/codeuitleg.test.ts leest de bron.

const OPT_OUT = 'geen-regelnummers';

/** Staat er al een `showLineNumbers`(=n)-token in de metastring? */
export function heeftRegelnummers(metastring?: string): boolean {
  return (metastring ?? '').split(/\s+/).some((token) => token.startsWith('showLineNumbers'));
}

/** Moet dit blok regelnummers krijgen: python, nog geen nummers, geen opt-out. */
export function wilRegelnummers(className?: string, metastring?: string): boolean {
  if (typeof className !== 'string' || !className.includes('language-python')) return false;
  if (heeftRegelnummers(metastring)) return false;
  return !(metastring ?? '').split(/\s+/).includes(OPT_OUT);
}
