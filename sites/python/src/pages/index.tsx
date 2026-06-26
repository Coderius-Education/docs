import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import HomepageHero, {type HeroCta} from '@coderius/shared/components/HomepageHero';
import HomepageFeatures, {type FeatureItem} from '@coderius/shared/components/HomepageFeatures';

const ctas: HeroCta[] = [
  {label: 'Begin met leren', to: '/docs/basis/introductie'},
  {label: 'Playground', to: '/playground'},
];

const features: FeatureItem[] = [
  {
    icon: '🪜',
    title: 'Stap voor stap',
    description: 'Van je eerste print() tot functies en lijsten. Elke les bouwt voort op de vorige.',
  },
  {
    icon: '▶️',
    title: 'Direct uitvoeren',
    description: 'Schrijf en run Python code in je browser. Geen installatie nodig.',
  },
  {
    icon: '🛠️',
    title: 'Leren door doen',
    description: 'Elke les heeft oefeningen met tips en oplossingen om zelf mee te oefenen.',
  },
];

export default function Home(): ReactNode {
  return (
    <Layout
      title="Leer Python programmeren"
      description="Leer stap voor stap programmeren in Python met interactieve oefeningen.">
      <HomepageHero title="Coderius Python" ctas={ctas} />
      <HomepageFeatures features={features} />
    </Layout>
  );
}
