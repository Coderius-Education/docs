// @vitest-environment jsdom
import type { MoeilijkheidId } from '@coderius/shared/leerdoelen';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import type { CheckReport, CheckerConfig, Concept } from '../types';
import { Cijfer } from './Cijfer';

// Het blok Cijfer in de docentweergave: de docent kiest de denkvaardigheid,
// de nakijker stelt de moeilijkheid voor, en de zin uit het sjabloon staat
// eronder (en dus in de PDF).

function concept(id: string, subject: string, level: Concept['level']): Concept {
  return { id, subject, group: 'G', label: id, level, detect: { type: 'regex', pattern: /x/g } };
}

const config: CheckerConfig = {
  subjects: [
    { id: 'html', label: 'HTML' },
    { id: 'css', label: 'CSS' },
  ],
  concepts: [
    concept('h-basis', 'html', 'basis'),
    concept('h-gev', 'html', 'gevorderd'),
    concept('c-basis', 'css', 'basis'),
    concept('c-gev', 'css', 'gevorderd'),
  ],
  fileKinds: [{ id: 'html', label: 'HTML' }],
  classify: () => 'html',
  textKinds: ['html'],
  accept: '.html',
  teacher: { password: 'x', storageKey: 'coderius:test:x' },
  pdfFilename: () => 'x.pdf',
};

function rapport(gebruikt: string[]): CheckReport {
  return {
    fileStats: { total: 1, byKind: {}, skippedTooLarge: 0 },
    concepts: config.concepts.map((c) => ({
      id: c.id,
      count: gebruikt.includes(c.id) ? 1 : 0,
      used: gebruikt.includes(c.id),
    })),
    buitenLesstof: [],
    warnings: [],
  };
}

function Opstelling({ gebruikt }: { gebruikt: string[] }) {
  const [bloom, setBloom] = useState<string | null>(null);
  const [moeilijkheid, setMoeilijkheid] = useState<MoeilijkheidId | null>(null);
  return (
    <Cijfer
      report={rapport(gebruikt)}
      config={config}
      track={null}
      bloom={bloom}
      moeilijkheid={moeilijkheid}
      onBloom={setBloom}
      onMoeilijkheid={setMoeilijkheid}
    />
  );
}

afterEach(cleanup);

describe('Cijfer', () => {
  it('vraagt eerst om een denkvaardigheid, en geeft dan cijfer en zin', () => {
    render(<Opstelling gebruikt={['h-basis', 'h-gev', 'c-basis']} />);
    expect(screen.queryByText(/daarbij hoort het cijfer/)).toBeNull();
    expect(screen.getByText(/maar bij CSS geen concept op gevorderd/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Toepassen' }));
    expect(
      screen.getByText(
        'Ik heb bij jou Bloom niveau toepassen gezien voor de moeilijkheid basis en daarbij hoort het cijfer 6,5.',
      ),
    ).toBeTruthy();
    expect(screen.getByText('6,5')).toBeTruthy();
  });

  it('laat de docent de voorgestelde moeilijkheid aanpassen', () => {
    render(<Opstelling gebruikt={['h-basis', 'h-gev', 'c-basis']} />);
    fireEvent.click(screen.getByRole('button', { name: 'Evalueren' }));
    const basis = screen.getByRole('button', { name: 'Basis (voorstel)' });
    expect(basis.getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Gevorderd' }));
    expect(screen.getByText(/moeilijkheid gevorderd en daarbij hoort het cijfer 9,0/)).toBeTruthy();
    expect(screen.getByText(/Je hebt het aangepast/)).toBeTruthy();
  });

  it('toont expert alleen als het niveau expertconcepten heeft', () => {
    render(<Opstelling gebruikt={[]} />);
    expect(screen.queryByRole('button', { name: /Expert/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Niet aan basis voldaan (voorstel)' })).toBeTruthy();
  });
});
