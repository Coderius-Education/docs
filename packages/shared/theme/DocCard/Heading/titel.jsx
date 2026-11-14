// De titel van een kaart zonder icoon. Docusaurus haalt een emoji vooraan
// het label eraf en zet hem als icoon voor de titel. Een cijfer, # en * tellen
// daarbij ook als emoji (\p{Emoji}): "3. Acties" werd icoon "3" en titel
// ". Acties". Komt het icoon uit het label, dan krijgt de titel het hele label
// terug; het reserve-icoon (📄, 🗃, 🔗) staat niet in het label en valt weg.
export function kaartTitel(item, title, icon) {
  const label = item?.label?.trim();
  if (icon && label?.startsWith(icon)) return label;
  return title;
}
