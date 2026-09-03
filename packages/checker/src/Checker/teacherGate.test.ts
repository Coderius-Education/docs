import { describe, expect, it } from 'vitest';
import {
  type GateStorage,
  UNLOCKED_VALUE,
  isCorrectPassword,
  isUnlocked,
  tryUnlock,
} from './teacherGate';

// Het docentenslot zat volledig in de React-component TeacherGate.tsx en was
// daardoor niet te testen zonder DOM. De regels zijn klein maar gevoelig: een
// verkeerd wachtwoord mag de sessie niet markeren, een ontgrendeling geldt
// alleen voor de eigen storageKey, en zonder opslag (SSR) is het slot dicht.

function nepStorage(): GateStorage & { inhoud: Map<string, string> } {
  const inhoud = new Map<string, string>();
  return {
    inhoud,
    getItem: (key) => inhoud.get(key) ?? null,
    setItem: (key, value) => {
      inhoud.set(key, value);
    },
  };
}

describe('isCorrectPassword', () => {
  it('vergelijkt exact: hoofdletters en spaties tellen mee', () => {
    expect(isCorrectPassword('Geheim', 'Geheim')).toBe(true);
    expect(isCorrectPassword('geheim', 'Geheim')).toBe(false);
    expect(isCorrectPassword('Geheim ', 'Geheim')).toBe(false);
    expect(isCorrectPassword('', 'Geheim')).toBe(false);
  });
});

describe('isUnlocked', () => {
  it('is dicht zonder opslag (server-side rendering)', () => {
    expect(isUnlocked(null, 'docent')).toBe(false);
    expect(isUnlocked(undefined, 'docent')).toBe(false);
  });

  it('is dicht in een verse sessie en open na de markering', () => {
    const storage = nepStorage();
    expect(isUnlocked(storage, 'docent')).toBe(false);

    storage.setItem('docent', UNLOCKED_VALUE);
    expect(isUnlocked(storage, 'docent')).toBe(true);
  });

  it('accepteert alleen de vaste markering als waarde', () => {
    const storage = nepStorage();
    storage.setItem('docent', 'ja');
    expect(isUnlocked(storage, 'docent')).toBe(false);
  });
});

describe('tryUnlock', () => {
  it('markeert de sessie bij het juiste wachtwoord', () => {
    const storage = nepStorage();

    expect(tryUnlock(storage, 'docent', 'Geheim', 'Geheim')).toBe(true);

    expect(storage.inhoud.get('docent')).toBe(UNLOCKED_VALUE);
    expect(isUnlocked(storage, 'docent')).toBe(true);
  });

  it('laat de opslag met rust bij een verkeerd wachtwoord', () => {
    const storage = nepStorage();

    expect(tryUnlock(storage, 'docent', 'fout', 'Geheim')).toBe(false);

    expect(storage.inhoud.size).toBe(0);
    expect(isUnlocked(storage, 'docent')).toBe(false);
  });

  it('ontgrendelt alleen de eigen storageKey', () => {
    const storage = nepStorage();

    tryUnlock(storage, 'web-docent', 'Geheim', 'Geheim');

    expect(isUnlocked(storage, 'web-docent')).toBe(true);
    expect(isUnlocked(storage, 'python-docent')).toBe(false);
  });
});
