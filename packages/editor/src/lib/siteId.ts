import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

/**
 * De registry-id van de site waarin de editor draait (createConfig zet hem in
 * customFields.siteId). Alle cursussen van een vak delen één origin, dus
 * opslag gaat per site via storageKey(useSiteId(), …).
 */
export function useSiteId(): string {
  const { siteConfig } = useDocusaurusContext();
  const id = siteConfig.customFields?.siteId;
  return typeof id === 'string' && id ? id : 'lokaal';
}
