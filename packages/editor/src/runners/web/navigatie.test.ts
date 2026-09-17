import { describe, expect, it } from 'vitest';
import { Bezoek, linkDoel } from './navigatie';

// Issue #92: een klik op een link naar een ander HTML-bestand in het project
// liep dood. Dit is de logica achter het volgen van zo'n link en de weg terug.

const FILES = {
  'index.html': '<a href="over.html">',
  'over.html': '<a href="index.html">',
  'style.css': 'body{}',
  'blog/index.html': '',
  'blog/post.html': '<a href="../over.html">',
  'img/kat.png': 'data:image/png;base64,x',
};

describe('linkDoel', () => {
  it('vindt een bestand naast de pagina', () => {
    expect(linkDoel('index.html', 'over.html', FILES)).toEqual({ pad: 'over.html' });
    expect(linkDoel('index.html', './over.html', FILES)).toEqual({ pad: 'over.html' });
  });

  it('lost een pad op relatief aan de map van de pagina', () => {
    expect(linkDoel('blog/post.html', '../over.html', FILES)).toEqual({ pad: 'over.html' });
    expect(linkDoel('index.html', 'blog/post.html', FILES)).toEqual({ pad: 'blog/post.html' });
    expect(linkDoel('blog/post.html', '/index.html', FILES)).toEqual({ pad: 'index.html' });
  });

  it('neemt index.html voor een link naar een map', () => {
    expect(linkDoel('index.html', 'blog/', FILES)).toEqual({ pad: 'blog/index.html' });
    expect(linkDoel('index.html', 'blog', FILES)).toEqual({ pad: 'blog/index.html' });
  });

  it('laat een query of anker achter de bestandsnaam weg', () => {
    expect(linkDoel('index.html', 'over.html#top', FILES)).toEqual({ pad: 'over.html' });
    expect(linkDoel('index.html', 'over.html?x=1', FILES)).toEqual({ pad: 'over.html' });
    expect(linkDoel('over.html', '?x=1', FILES)).toEqual({ pad: 'over.html' });
  });

  it('zegt welk bestand ontbreekt', () => {
    expect(linkDoel('index.html', 'contact.html', FILES)).toEqual({
      fout: 'De link "contact.html" wijst naar "contact.html", maar dat bestand staat niet in je project.',
    });
  });

  it('weigert een bestand dat geen HTML is', () => {
    expect(linkDoel('index.html', 'style.css', FILES)).toEqual({
      fout: 'De link "style.css" wijst naar "style.css", en het voorbeeld kan alleen een HTML-bestand tonen.',
    });
    expect(linkDoel('index.html', 'img/kat.png', FILES)).toMatchObject({
      fout: expect.any(String),
    });
  });
});

describe('Bezoek', () => {
  it('begint op het startbestand, zonder weg terug', () => {
    const b = new Bezoek();
    expect(b.bijRun('index.html', FILES)).toBe('index.html');
    expect(b.pagina).toBe('index.html');
    expect(b.terugNaar).toBeNull();
  });

  it('volgt een link en kent de weg terug', () => {
    const b = new Bezoek();
    b.bijRun('index.html', FILES);
    expect(b.ga('over.html')).toBe('over.html');
    expect(b.terugNaar).toBe('index.html');
    expect(b.ga('blog/post.html')).toBe('blog/post.html');
    expect(b.terugNaar).toBe('over.html');
    expect(b.terug()).toBe('over.html');
    expect(b.terug()).toBe('index.html');
    expect(b.terugNaar).toBeNull();
    // Terug op de bodem blijft op de bodem.
    expect(b.terug()).toBe('index.html');
  });

  it('een link naar de pagina zelf stapelt niet', () => {
    const b = new Bezoek();
    b.bijRun('index.html', FILES);
    b.ga('over.html');
    b.ga('over.html');
    expect(b.terug()).toBe('index.html');
  });

  it('een link terug naar het startbestand of een eerdere pagina gaat terug, niet erbovenop', () => {
    // Wie via "Terug naar de startpagina" op index.html belandt, hoort daar
    // geen knop "Terug naar over.html" te zien.
    const b = new Bezoek();
    b.bijRun('index.html', FILES);
    b.ga('over.html');
    expect(b.ga('index.html')).toBe('index.html');
    expect(b.terugNaar).toBeNull();
    b.ga('over.html');
    b.ga('blog/post.html');
    expect(b.ga('over.html')).toBe('over.html');
    expect(b.terugNaar).toBe('index.html');
  });

  it('blijft bij een nieuwe run op de bezochte pagina', () => {
    // De leerling typt in over.html en wil dat blijven zien.
    const b = new Bezoek();
    b.bijRun('index.html', FILES);
    b.ga('over.html');
    expect(b.bijRun('index.html', FILES)).toBe('over.html');
  });

  it('valt terug als de bezochte pagina niet meer bestaat', () => {
    const b = new Bezoek();
    b.bijRun('index.html', FILES);
    b.ga('over.html');
    b.ga('blog/post.html');
    const { 'over.html': _weg, ...zonder } = FILES;
    expect(b.bijRun('index.html', zonder)).toBe('blog/post.html');
    expect(b.terug()).toBe('index.html');
  });

  it('een ander startbestand begint opnieuw', () => {
    const b = new Bezoek();
    b.bijRun('index.html', FILES);
    b.ga('over.html');
    expect(b.bijRun('blog/index.html', FILES)).toBe('blog/index.html');
    expect(b.terugNaar).toBeNull();
  });
});
