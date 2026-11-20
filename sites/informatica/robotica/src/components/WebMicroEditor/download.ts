// De code in de editor als bestand op de computer. De editor schrijft naar het
// bord, maar Robot checken vraagt om je main.py: zonder deze knop kon alleen
// wie Thonny gebruikt hem inleveren (review van de upload tool, november
// 2026). Het bord verschijnt via USB niet als schijf.

/** De naam van het bestand: die van het geopende bestand, anders main.py. */
export function downloadNaam(geopend: string | null): string {
  const naam = geopend?.slice(geopend.lastIndexOf('/') + 1);
  return naam && /\.py$/.test(naam) ? naam : 'main.py';
}

export function downloadCode(code: string, naam: string): void {
  const url = URL.createObjectURL(new Blob([code], { type: 'text/x-python' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = naam;
  document.body.append(a);
  a.click();
  a.remove();
  // Firefox en Safari halen een download soms pas na de klik op.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
