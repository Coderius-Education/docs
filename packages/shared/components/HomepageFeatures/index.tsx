import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

export type FeatureItem = {
  title: string;
  link?: string;
  description: ReactNode;
};

function Feature({title, link, description}: FeatureItem) {
  const heading = link ? <Link to={link}>{title}</Link> : title;
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md padding-vert--md">
        <Heading as="h3">{heading}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

/**
 * Gedeelde "features"-sectie voor de homepage van elke -docs site.
 * Elke site levert alleen zijn eigen `features`-data aan via een dunne shim in
 * `src/components/HomepageFeatures`; de opmaak en CSS staan hier één keer.
 */
export default function HomepageFeatures({
  features = [],
}: {
  features?: FeatureItem[];
}): ReactNode {
  if (features.length === 0) return null;
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {features.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
