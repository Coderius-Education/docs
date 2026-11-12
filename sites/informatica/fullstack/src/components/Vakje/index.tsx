import type { ComponentProps, ReactNode } from 'react';

// Een takenlijst in een les (`- [ ] …`) wordt een lijst met aankruisvakjes,
// en Markdown zet die vast: `disabled`. Op Beveilig je eigen project stonden
// er 27, op een lijst om je project mee na te lopen, en geen ervan kon je
// aanvinken. Dit vakje kan aan en uit. Wat is aangevinkt, blijft tot je de
// pagina herlaadt: de lijst loop je in één keer af.
export default function Vakje({ disabled, checked, ...rest }: ComponentProps<'input'>): ReactNode {
  if (rest.type !== 'checkbox') return <input disabled={disabled} checked={checked} {...rest} />;
  // `checked` zonder `onChange` maakt het vakje in React alleen-lezen.
  return <input {...rest} defaultChecked={Boolean(checked)} />;
}
