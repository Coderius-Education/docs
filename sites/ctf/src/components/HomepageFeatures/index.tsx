import type {ReactNode} from 'react';
import HomepageFeatures, {type FeatureItem} from '@coderius/shared/components/HomepageFeatures';

// Alleen de site-specifieke data; opmaak + CSS staan in @coderius/shared.
const features: FeatureItem[] = [
  {
    title: 'Forensics',
    link: '/docs/category/forensics',
    description: (
      <>
        Onderzoek digitale sporen: van de Wayback Machine en IP-adressen tot
        verborgen bestanden en audio-analyse.
      </>
    ),
  },
  {
    title: 'Hacking',
    link: '/docs/category/hacking',
    description: (
      <>
        Leer over wachtwoorden, cookies, HTTP-headers, robots.txt en meer.
        Ontdek hoe kwetsbaarheden in websites werken.
      </>
    ),
  },
  {
    title: 'Code',
    link: '/docs/category/code',
    description: (
      <>
        Crack versleutelde berichten, decodeer Base64, ontcijfer geobfusceerde
        code en los crypto-puzzels op.
      </>
    ),
  },
];

export default function (): ReactNode {
  return <HomepageFeatures features={features} />;
}
