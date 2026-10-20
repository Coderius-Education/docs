import { describe, expect, it } from 'vitest';
import { lijktBibliotheek } from './bibliotheek';

describe('lijktBibliotheek', () => {
  it('herkent een geminificeerd bestand aan zijn naam', () => {
    expect(lijktBibliotheek('js/jquery.min.js', 'x')).toBe(true);
    expect(lijktBibliotheek('css/bootstrap.min.css', 'x')).toBe(true);
  });

  it('herkent een bekende bibliotheek aan zijn naam, ook niet geminificeerd', () => {
    for (const naam of [
      'jquery.js',
      'jquery-3.7.1.js',
      'bootstrap.bundle.js',
      'bootstrap.css',
      'popper.js',
      'normalize.css',
      'font-awesome.css',
      'fontawesome.css',
    ]) {
      expect(lijktBibliotheek(`lib/${naam}`, 'x'), naam).toBe(true);
    }
  });

  it('herkent een bibliotheek aan zijn licentiekop of aan een heel lange regel', () => {
    expect(lijktBibliotheek('js/slider.js', '\n/*! Swiper 11 | MIT */\nfunction a() {}')).toBe(
      true,
    );
    expect(lijktBibliotheek('js/vendor.js', `var a=1;${'b();'.repeat(400)}`)).toBe(true);
  });

  it('laat eigen code staan, ook met een naam die op een bibliotheek lijkt', () => {
    // Een eigen bestand mag nooit wegvallen.
    for (const naam of [
      'script.js',
      'app.js',
      'reset.css',
      'chart.js',
      'style.css',
      'mijn-jquery-test.js',
    ]) {
      expect(lijktBibliotheek(naam, '/* mijn code */\nlet a = 1;'), naam).toBe(false);
    }
    // Een gewoon commentaar bovenaan is geen licentiekop.
    expect(lijktBibliotheek('script.js', '/* Gemaakt door Sam */\nlet a = 1;')).toBe(false);
  });

  it('kijkt alleen naar JavaScript en CSS', () => {
    expect(lijktBibliotheek('index.html', `<p>${'x'.repeat(2000)}</p>`)).toBe(false);
  });
});
