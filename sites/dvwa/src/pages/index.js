import HomepageFeatures from '@coderius/shared/components/HomepageFeatures';
import HomepageHero from '@coderius/shared/components/HomepageHero';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

const ctas = [{ label: 'Begin met de labs', to: '/docs/installatie' }];

const features = [
  {
    title: 'Linux leren',
    description: 'De basis van de command line voor je begint.',
    link: '/docs/linux_leren',
  },
  {
    title: 'DVWA installeren',
    description: 'Zet je eigen oefenomgeving op.',
    link: '/docs/dvwa_installatie',
  },
  {
    title: 'Challenges',
    description: 'SQL-injectie, XSS, command injection en meer.',
    link: '/docs/dvwa_tutorial',
  },
];

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <HomepageHero title="Coderius DVWA" ctas={ctas} />
      <HomepageFeatures heading="Waar wil je mee aan de slag?" features={features} />
    </Layout>
  );
}
