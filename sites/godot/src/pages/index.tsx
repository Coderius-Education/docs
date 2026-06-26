import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import HomepageHero, {type HeroCta} from '@coderius/shared/components/HomepageHero';
import HomepageFeatures, {type FeatureItem} from '@coderius/shared/components/HomepageFeatures';

const ctas: HeroCta[] = [{label: 'Begin met je 1e 2D game', to: '/docs/installatie'}];

const features: FeatureItem[] = [
  {
    icon: '🕹️',
    title: 'Begin de tutorial',
    description: 'Van installatie tot je eerste speelbare 2D game.',
    link: '/docs/installatie',
  },
  {
    icon: '🧩',
    title: 'Nodes cheatsheet',
    description: 'De belangrijkste Godot-nodes op een rij.',
    link: '/cheatsheet',
  },
  {
    icon: '📝',
    title: 'GDScript-tips',
    description: 'Handige patronen en valkuilen in GDScript.',
    link: '/gdscript-tips',
  },
];

export default function Home(): ReactNode {
  return (
    <Layout
      title="Coderius Godot — Leer je eerste 2D game maken"
      description="Gratis Nederlandse cursus Godot 4: bouw stap voor stap je eerste 2D game met sprites, GDScript, animaties en collisions.">
      <HomepageHero title="Coderius Godot" ctas={ctas} />
      <HomepageFeatures heading="Waar wil je mee aan de slag?" features={features} />
    </Layout>
  );
}
