import { type ReactNode, useState } from 'react';
import styles from './TeacherGate.module.css';
import { TEACHER_PASSWORD, TEACHER_UNLOCK_KEY } from './teacherAccess';

interface TeacherGateProps {
  children: ReactNode;
}

export function TeacherGate({ children }: TeacherGateProps) {
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(TEACHER_UNLOCK_KEY) === '1';
  });
  const [value, setValue] = useState('');
  const [wrong, setWrong] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value === TEACHER_PASSWORD) {
      sessionStorage.setItem(TEACHER_UNLOCK_KEY, '1');
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

export default TeacherGate;
