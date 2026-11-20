// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { CheckerConfig, ProjectFiles } from '../types';
import { PhotoStrip } from './PhotoStrip';

// De review van de upload tool van robotica (november 2026): de docent zet
// een vinkje op grond van een foto, en kon hem alleen als miniatuur zien,
// bijgesneden.

afterEach(cleanup);

const config = { imageKinds: ['image'] } as unknown as CheckerConfig;
const files: ProjectFiles = {
  'robot.jpg': {
    path: 'robot.jpg',
    kind: 'image',
    content: 'data:image/jpeg;base64,eA==',
    sizeBytes: 1,
    tooLarge: false,
  },
};

describe('PhotoStrip', () => {
  it('toont een foto groot na een klik', () => {
    render(<PhotoStrip files={files} config={config} />);
    fireEvent.click(screen.getByRole('button', { name: 'Bekijk robot.jpg groot' }));
    const groot = screen.getAllByAltText('robot.jpg');
    expect(groot).toHaveLength(2);
    expect(groot[1].getAttribute('src')).toBe('data:image/jpeg;base64,eA==');
  });

  it('snijdt een miniatuur niet bij', () => {
    const css = readFileSync(join(__dirname, 'PhotoStrip.module.css'), 'utf8');
    const foto = /\.foto\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(foto).toContain('object-fit: contain');
  });
});
