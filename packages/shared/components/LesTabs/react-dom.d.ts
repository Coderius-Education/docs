// De workspace heeft geen @types/react-dom. <LesNaast> gebruikt van react-dom
// alleen createPortal; meer staat hier dus niet.
declare module 'react-dom' {
  import type { ReactNode, ReactPortal } from 'react';
  export function createPortal(
    children: ReactNode,
    container: Element | DocumentFragment,
    key?: string | null,
  ): ReactPortal;
}
