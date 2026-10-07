import { describe, expect, it } from 'vitest';
import { heeftJavaScript } from './heeftJs';

describe('heeftJavaScript', () => {
  it('ziet een script.js', () => {
    expect(heeftJavaScript('<p>Hoi</p>', "console.log('hoi');")).toBe(true);
  });

  it('ziet een onclick zonder script.js (issue #103)', () => {
    expect(
      heeftJavaScript(
        "<button onclick=\"document.getElementById('zin').textContent = 'Hoi'\">Klik</button>",
        '',
      ),
    ).toBe(true);
  });

  it('ziet een <script>-tag in de HTML', () => {
    expect(heeftJavaScript('<body><script>verander();</script></body>', '')).toBe(true);
  });

  it('ziet andere handlers en hoofdletters', () => {
    expect(heeftJavaScript('<img src="x.png" ONLOAD="start()">', '')).toBe(true);
    expect(heeftJavaScript('<input oninput = "tel()">', '')).toBe(true);
  });

  it('laat een pagina met alleen HTML en CSS met de console dicht', () => {
    expect(heeftJavaScript('<p class="online">Wat is een button?</p>', '  ')).toBe(false);
    expect(heeftJavaScript('<a href="onderwerp.html">Link</a>', '')).toBe(false);
    expect(heeftJavaScript('<p>Zet de lamp on = aan</p>', '')).toBe(false);
  });
});
