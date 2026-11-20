import { type ReactNode, useEffect, useRef, useState } from 'react';
import styles from './TeacherGate.module.css';
import { isUnlocked, sessionStorageOrNull, tryUnlock } from './teacherGate';

interface TeacherGateProps {
  password: string;
  storageKey: string;
  children: ReactNode;
}

// Zacht wachtwoord-slot: houdt gewone leerlingen tegen, geen echte beveiliging
// (het wachtwoord staat in de gebundelde JS). De ontgrendelde status blijft
// binnen de sessie bewaard. De regels zelf staan in teacherGate.ts.
export function TeacherGate({ password, storageKey, children }: TeacherGateProps) {
  const [unlocked, setUnlocked] = useState<boolean>(() =>
    isUnlocked(sessionStorageOrNull(), storageKey),
  );
  const [value, setValue] = useState('');
  const [wrong, setWrong] = useState(false);
  // Na het ontgrendelen verdwijnt het formulier, en viel de focus op de
  // pagina zelf. Nu gaat hij naar het eerste veld van de docentweergave (de
  // naam van de leerling), of anders de eerste knop.
  const [zojuist, setZojuist] = useState(false);
  const wortel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!zojuist || !wortel.current) return;
    const doel =
      wortel.current.querySelector<HTMLElement>(
        'input:not([type=file]):not([type=hidden]):not([tabindex="-1"])',
      ) ?? wortel.current.querySelector<HTMLElement>('button');
    doel?.focus();
    setZojuist(false);
  }, [zojuist]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tryUnlock(sessionStorage, storageKey, value, password)) {
      setUnlocked(true);
      setWrong(false);
      setZojuist(true);
    } else {
      setWrong(true);
    }
  };

  if (unlocked) return <div ref={wortel}>{children}</div>;

  return (
    <form className={styles.gate} onSubmit={submit}>
      <label className={styles.label} htmlFor="docent-wachtwoord">
        Docentwachtwoord
      </label>
      <input
        id="docent-wachtwoord"
        type="password"
        className={styles.input}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setWrong(false);
        }}
        autoComplete="off"
      />
      <button type="submit" className={styles.button}>
        Ontgrendel
      </button>
      {wrong && (
        <p className={styles.wrong} role="alert">
          Onjuist wachtwoord.
        </p>
      )}
    </form>
  );
}
