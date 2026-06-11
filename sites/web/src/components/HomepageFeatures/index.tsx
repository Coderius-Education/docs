import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

type CourseCard = {
  title: string;
  description: string;
  to: string;
  label: string;
};

const courses: CourseCard[] = [
  {
    title: 'HTML & CSS — 14 lessen',
    description:
      'De bouwstenen van het web: paginastructuur, tekst, afbeeldingen, links, CSS-klassen, pseudo-klassen, Flexbox, semantische HTML en formulieren.',
    to: '/docs/html-css/intro-html',
    label: 'Start HTML & CSS',
  },
  {
    title: 'JavaScript — 10 lessen',
    description:
      'Maak je pagina interactief: onclick, functies, variabelen, events, beslissingen (if/else), datatypes en formulier-data uitlezen.',
    to: '/docs/js-basics/intro-javascript',
    label: 'Start JavaScript',
  },
];

function CourseCardItem({title, description, to, label}: CourseCard): ReactNode {
  return (
    <div className={styles.card}>
      <h3>{title}</h3>
      <p>{description}</p>
      <Link className="button button--primary" to={to}>
        {label}
      </Link>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.cardRow}>
          {courses.map((card) => (
            <CourseCardItem key={card.title} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}
