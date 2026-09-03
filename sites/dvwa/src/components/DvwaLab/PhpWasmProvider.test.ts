import { describe, expect, it, vi } from 'vitest';

// Twee stille bugs in de browser-singleton van het lab:
// 1. Een mislukte php-wasm-init (wasm-download afgebroken) bleef als afgewezen
//    promise hangen, zodat elke volgende submit dezelfde oude fout kreeg en
//    de leerling alleen met een herlaad verder kon.
// 2. injectSuperglobals riep `.replace` op de waarde; een getal of iets anders
//    dan een string uit een formulier crashte dan met een TypeError, en een
//    module zonder `<?php` slikte de formulierdata geruisloos in.

/** Verse module-instantie, zodat de singleton per test leeg begint. */
async function versProvider() {
  vi.resetModules();
  return import('./PhpWasmProvider');
}

/** Een namaak-php-instantie: genoeg voor createPhp (binary + run). */
function nepPhp() {
  return { binary: Promise.resolve(), run: vi.fn(async () => {}) };
}

describe('getPhp', () => {
  it('probeert na een mislukte init opnieuw bij de volgende aanroep', async () => {
    const { getPhp } = await versProvider();
    const instantie = nepPhp();
    const fabriek = vi
      .fn()
      .mockRejectedValueOnce(new Error('wasm-download afgebroken'))
      .mockResolvedValueOnce(instantie);

    await expect(getPhp(fabriek)).rejects.toThrow('wasm-download afgebroken');
    await expect(getPhp(fabriek)).resolves.toBe(instantie);
    expect(fabriek).toHaveBeenCalledTimes(2);
  });

  it('bewaart een geslaagde instantie en maakt geen tweede aan', async () => {
    const { getPhp } = await versProvider();
    const instantie = nepPhp();
    const fabriek = vi.fn().mockResolvedValue(instantie);

    await expect(getPhp(fabriek)).resolves.toBe(instantie);
    await expect(getPhp(fabriek)).resolves.toBe(instantie);
    await expect(getPhp(fabriek)).resolves.toBe(instantie);
    expect(fabriek).toHaveBeenCalledTimes(1);
  });
});

describe('injectSuperglobals', () => {
  it('zet een getal om naar een string in de ingevoegde PHP', async () => {
    const { injectSuperglobals } = await versProvider();
    const uit = injectSuperglobals('<?php echo $_GET["id"];', { id: 42 }, {});
    expect(uit).toContain("$_GET['id'] = '42';");
  });

  it('gooit een duidelijke fout als de module geen <?php heeft', async () => {
    const { injectSuperglobals } = await versProvider();
    expect(() => injectSuperglobals('echo "hoi";', { id: '1' }, {})).toThrow(
      'De PHP-module heeft geen openingstag <?php; de formulierdata kan nergens worden ingevoegd.',
    );
  });

  it('escapet aanhalingstekens en backslashes in een POST-waarde', async () => {
    const { injectSuperglobals } = await versProvider();
    const uit = injectSuperglobals('<?php echo 1;', {}, { naam: "o'hara\\x" });
    expect(uit).toContain("$_POST['naam'] = 'o\\'hara\\\\x';\n");
    expect(uit).toContain("$_SERVER['REQUEST_METHOD'] = 'POST';");
  });
});
