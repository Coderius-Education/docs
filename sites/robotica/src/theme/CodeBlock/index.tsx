import OriginalCodeBlock from '@theme-original/CodeBlock';
import type { ComponentProps, ReactNode } from 'react';
import { maakEditorLink } from '../../components/WebMicroEditor/codeLink';
import styles from './styles.module.css';

// Elke python-codeblok in de docs krijgt automatisch een "Open in de editor"-
// link: de code reist mee in de URL-hash, de editor laadt hem voor. Zo hoeft
// een leerling niet meer te kopiëren en plakken. REPL-transcripten (>>>) zijn
// niet runnable en krijgen geen link.

type Props = ComponentProps<typeof OriginalCodeBlock> & { children?: ReactNode };

export default function CodeBlock(props: Props): ReactNode {
  const isPython =
    typeof props.className === 'string' && props.className.includes('language-python');
  const code = typeof props.children === 'string' ? props.children : null;
  if (!isPython || !code || code.includes('>>>')) {
    return <OriginalCodeBlock {...props} />;
  }
  return (
    <>
      <OriginalCodeBlock {...props} />
      <div className={styles.editorLink}>
        <a href={maakEditorLink(code.replace(/\s+$/, ''))}>Open in de editor →</a>
      </div>
    </>
  );
}
