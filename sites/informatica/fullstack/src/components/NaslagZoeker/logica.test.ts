import { describe, expect, it } from 'vitest';
import { past, splitsLabel, woorden } from './logica';

describe('past', () => {
  it('zonder zoekwoorden past alles', () => {
    expect(past('Hoe start ik mijn server?', '')).toBe(true);
    expect(past('Hoe start ik mijn server?', '   ')).toBe(true);
  });

  it('elk woord moet erin staan, zonder hoofdletters en accenten', () => {
    expect(past('Hoe stuur ik door? (RedirectResponse)', 'redirect')).toBe(true);
    expect(past('Hoe stuur ik door? (RedirectResponse)', 'redirect cookie')).toBe(false);
    expect(past('Een idee dat je ziet', 'IDÉE')).toBe(true);
  });

  it('een geplakte foutmelding met een ander pad past nog', () => {
    const onderwerp =
      'TemplateNotFound jinja2.exceptions.TemplateNotFound: groet.html Oorzaak: de template staat niet in de map templates';
    const geplakt =
      'jinja2.exceptions.TemplateNotFound: welkom.html raised in C:\\Users\\sam\\project\\main.py line 12';
    expect(past(onderwerp, geplakt)).toBe(true);
    expect(past(onderwerp, 'jinja2.exceptions.TemplateNotFound: groet.html')).toBe(true);
    // Kort geplakt, met een andere bestandsnaam, en de naam met punten ervoor.
    expect(
      past(
        'TemplateNotFound: de template staat niet in templates',
        'jinja2.exceptions.TemplateNotFound: welkom.html',
      ),
    ).toBe(true);
    // Een statuscode uit een geplakte regel van de terminal.
    expect(
      past(
        '422 Unprocessable Entity, een veld ontbreekt',
        'INFO: 127.0.0.1:52344 - "POST /groet HTTP/1.1" 422',
      ),
    ).toBe(true);
    // Een andere fout past niet, ook al delen ze gewone woorden.
    expect(
      past(onderwerp, 'KeyError: naam raised in C:\\Users\\sam\\project\\main.py line 12'),
    ).toBe(false);
  });

  it('leestekens rond een woord tellen niet, die erin wel', () => {
    expect(woorden('"422", {{ naam }}')).toEqual(['422', '{{', 'naam', '}}']);
    expect(past('Gebruik @app.get voor een pagina', '@app.get')).toBe(true);
  });
});

describe('splitsLabel', () => {
  it('haalt de code tussen haakjes aan het eind eraf', () => {
    expect(splitsLabel('Hoe geef ik JSON terug? (@app.get)')).toEqual({
      vraag: 'Hoe geef ik JSON terug?',
      label: '@app.get',
    });
  });

  it('laat een tekst zonder haakjes aan het eind heel', () => {
    expect(splitsLabel('405 Method Not Allowed')).toEqual({
      vraag: '405 Method Not Allowed',
      label: null,
    });
    expect(splitsLabel('Afbeelding (broken image) laadt niet')).toEqual({
      vraag: 'Afbeelding (broken image) laadt niet',
      label: null,
    });
  });
});
