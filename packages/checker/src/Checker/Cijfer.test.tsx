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

function Opstelling({
  gebruikt,
  start = { bloom: null, moeilijkheid: null },
  onMoeilijkheid,
}: {
  gebruikt: string[];
  start?: { bloom: string | null; moeilijkheid: string | null };
  onMoeilijkheid?: (m: MoeilijkheidId | null) => void;
}) {
  const [bloom, setBloom] = useState<string | null>(start.bloom);
  const [moeilijkheid, setMoeilijkheid] = useState<MoeilijkheidId | null>(
    start.moeilijkheid as MoeilijkheidId | null,
  );
  const [gebruiktNu, setGebruiktNu] = useState(gebruikt);
  return (
    <>
      <button type="button" onClick={() => setGebruiktNu([...gebruiktNu, 'c-gev'])}>
        vink c-gev aan
      </button>
      <Cijfer
        report={rapport(gebruiktNu)}
        config={config}
        track={null}
        bloom={bloom}
        moeilijkheid={moeilijkheid}
        onBloom={setBloom}
        onMoeilijkheid={(m) => {
          onMoeilijkheid?.(m);
          setMoeilijkheid(m);
        }}
      />
    </>
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
    expect(screen.getByText(/Je koos een andere moeilijkheid dan het voorstel/)).toBeTruthy();
  });

  it('een bevestigd voorstel blijft staan als het voorstel later verandert', () => {
    // Eerst bewaarde een klik op het voorstel niets, en schoof het cijfer
    // mee zodra de docent nog een concept aanvinkte.
    const bewaard: (MoeilijkheidId | null)[] = [];
    render(
      <Opstelling
        gebruikt={['h-basis', 'h-gev', 'c-basis']}
        onMoeilijkheid={(m) => bewaard.push(m)}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Toepassen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Basis (voorstel)' }));
    expect(bewaard).toEqual(['basis']);

    fireEvent.click(screen.getByRole('button', { name: 'vink c-gev aan' }));
    expect(screen.getByRole('button', { name: 'Gevorderd (voorstel)' })).toBeTruthy();
    expect(screen.getByText(/moeilijkheid basis en daarbij hoort het cijfer 6,5/)).toBeTruthy();
  });

  it('zegt dat het cijfer het voorstel volgt zolang er niets gekozen is', () => {
    render(<Opstelling gebruikt={['h-basis', 'c-basis']} />);
    expect(
      screen.getByText(/het cijfer volgt het voorstel tot je een moeilijkheid kiest/),
    ).toBeTruthy();
  });

  it('houdt een gekozen expert zichtbaar, ook in een leerroute zonder expertconcepten', () => {
    render(<Opstelling gebruikt={[]} start={{ bloom: 'toepassen', moeilijkheid: 'expert' }} />);
    const expert = screen.getByRole('button', { name: 'Expert' });
    expect(expert.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Basis' }));
    expect(screen.getByText(/moeilijkheid basis en daarbij/)).toBeTruthy();
  });

  it('valt niet om op een bewaarde waarde die bloom.json niet meer kent', () => {
    render(<Opstelling gebruikt={['h-basis']} start={{ bloom: 'weten', moeilijkheid: 'super' }} />);
    expect(screen.getByText(/Kies de denkvaardigheid/)).toBeTruthy();
    expect(screen.queryByText(/daarbij hoort het cijfer/)).toBeNull();
  });

  it('zet de kop Cijfer pas in de PDF als er een denkvaardigheid is', () => {
    render(<Opstelling gebruikt={['h-basis']} />);
    const kop = screen.getByRole('heading', { name: 'Cijfer' });
    expect(kop.className).toMatch(/noPrint/);
    fireEvent.click(screen.getByRole('button', { name: 'Onthouden' }));
    expect(screen.getByRole('heading', { name: 'Cijfer' }).className).not.toMatch(/noPrint/);
  });

  it('toont expert alleen als het niveau expertconcepten heeft', () => {
    render(<Opstelling gebruikt={[]} />);
    expect(screen.queryByRole('button', { name: /Expert/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Niet aan basis voldaan (voorstel)' })).toBeTruthy();
  });
});
