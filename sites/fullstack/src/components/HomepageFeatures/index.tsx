import type {ReactNode} from 'react';
import HomepageFeatures from '@coderius/shared/components/HomepageFeatures';

// Deze site toont (nog) geen feature-kaarten op de homepage. Opmaak + CSS van
// de feature-sectie staan in @coderius/shared.
export default function (): ReactNode {
  return <HomepageFeatures features={[]} />;
}
