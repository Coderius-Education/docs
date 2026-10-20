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

  it('herkent ook een licentiekop met @license of na @charset', () => {
    expect(
      lijktBibliotheek(
        'js/three.module.js',
        '/**\n * @license\n * Copyright 2010-2024 Three.js Authors\n * SPDX-License-Identifier: MIT\n */\nconst REVISION = "160";',
      ),
    ).toBe(true);
    expect(
      lijktBibliotheek(
        'js/vue.global.js',
        '/**\n* vue v3.4.21\n* (c) 2018-present Yuxi (Evan) You and Vue contributors\n* @license MIT\n**/\nvar Vue = (function (exports) {',
      ),
    ).toBe(true);
    expect(
      lijktBibliotheek(
        'css/animate.css',
        '@charset "UTF-8";/*!\n * animate.css - https://animate.style/\n * Licensed under the Hippocratic License 2.1\n */\n:root { --animate-duration: 1s; }',
      ),
    ).toBe(true);
    // Een eigen bestand met een gewoon commentaar en @charset blijft eigen werk.
    expect(
      lijktBibliotheek('css/style.css', '@charset "UTF-8";\n/* Mijn stijl */\nbody { margin: 0; }'),
    ).toBe(false);
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
