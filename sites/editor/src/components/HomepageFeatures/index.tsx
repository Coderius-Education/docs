import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from '@coderius/shared/components/HomepageFeatures/styles.module.css';

type FeatureItem = {
  title: string;
  description: ReactNode;
  link: string;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Website maken',
    description: 'Leer hoe je een website bouwt met HTML, CSS en JavaScript in VS Code.',
    link: '/web',
  },
  {
    title: 'Python',
    description: 'Leer hoe je Python-code schrijft en uitvoert in VS Code.',
    link: '/python',
  },
  {
    title: 'Git & GitHub',
    description: 'Leer versiebeheer met git — eerst in een browser-simulator, daarna in VS Code en op GitHub.',
    link: '/git/',
  },
];

function Feature({title, description, link}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md padding-vert--lg">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
        <Link className="button button--primary" to={link}>
          Aan de slag
        </Link>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
