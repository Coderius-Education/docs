// Biedt een bestand aan als download. De object-URL wordt pas na de klik
// vrijgegeven: meteen erna intrekken breekt in sommige browsers de download
// af voordat hij begonnen is.
export function downloadBestand(inhoud: BlobPart, bestandsnaam: string, type: string): void {
  const url = URL.createObjectURL(new Blob([inhoud], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = bestandsnaam;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
