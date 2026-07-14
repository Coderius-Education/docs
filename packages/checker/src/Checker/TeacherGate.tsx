import { type ReactNode, useState } from 'react';
import styles from './TeacherGate.module.css';

interface TeacherGateProps {
  password: string;
  storageKey: string;
  children: ReactNode;
}

// Zacht wachtwoord-slot: houdt gewone leerlingen tegen, geen echte beveiliging
// (het wachtwoord staat in de gebundelde JS). De ontgrendelde status blijft
// binnen de sessie bewaard.
export function TeacherGate({ password, storageKey, children }: TeacherGateProps) {
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(storageKey) === '1';
  });
  const [value, setValue] = useState('');
  const [wrong, setWrong] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value === password) {
      sessionStorage.setItem(storageKey, '1');
      setUnlocked(true);
      setWrong(false);
    } else {
      setWrong(true);
    }
  };

  if (unlocked) return <>{children}</>;

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
