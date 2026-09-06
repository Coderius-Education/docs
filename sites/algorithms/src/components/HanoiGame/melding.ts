// De tekst die het spel toont zodra de toren op paal C staat. Bij de doorloop
// van het hoofdstuk zei het spel "Opgelost in 7 zetten! Kun je het in
// minder?" bij 3 schijven, terwijl 7 het minimum is (2ⁿ − 1). Op de pagina
// "Op zoek naar patronen" zoekt de leerling juist dat minimum, dus de melding
// stuurde hem verder zoeken naar iets dat niet bestaat. Hoeveel het minimum is
// zegt de melding bewust niet: dat ontdekt de leerling zelf door te tellen.

export function minimumZetten(aantal: number): number {
  return 2 ** aantal - 1;
}

export function opgelostMelding(zetten: number, aantal: number): string {
  const kern = `Opgelost in ${zetten} ${zetten === 1 ? 'zet' : 'zetten'}.`;
  return zetten <= minimumZetten(aantal)
    ? `${kern} Sneller kan niet.`
    : `${kern} Het kan in minder.`;
}
