import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import HomepageHero, {type HeroCta} from '@coderius/shared/components/HomepageHero';
import HomepageFeatures, {type FeatureItem} from '@coderius/shared/components/HomepageFeatures';

const ctas: HeroCta[] = [{label: 'Start de challenges', to: '/docs/intro'}];

const features: FeatureItem[] = [
  {
    icon: '🚩',
    title: 'Challenges',
    description: 'Begin met de eerste Capture the Flag-opdrachten.',
    link: '/docs/intro',
  },
  {
    icon: '🧰',
    title: 'Toolbox',
    description: 'De tools die je nodig hebt om challenges te kraken.',
    link: '/toolbox',
  },
  {
    icon: '📖',
    title: 'Woordenlijst',
    description: 'Snel de cybersecurity-termen opzoeken.',
    link: '/woordenlijst',
  },
];

export default function Home(): ReactNode {
  return (
    <Layout
      title="Home"
      description="Leer cybersecurity door Capture the Flag challenges op te lossen">
      <HomepageHero ctas={ctas} />
      <HomepageFeatures heading="Waar wil je mee aan de slag?" features={features} />
    </Layout>
  );
}
