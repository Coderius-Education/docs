// Kleurrekenwerk voor de huisstijl: OKLCH naar sRGB, gamut-mapping en het
// WCAG-contrast. OKLCH omdat een gelijke L daar ook echt even licht oogt: zo
// krijgen dertien cursuskleuren hetzelfde contrast zonder dat je elke kleur
// met de hand bijstelt.

function oklchNaarLineair(L, C, h) {
  const hr = (h * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const binnenGamut = (rgb) => rgb.every((c) => c >= -1e-6 && c <= 1 + 1e-6);

// Buiten sRGB? Dan chroma omlaag tot hij past; L en tint blijven staan.
function inGamut(L, C, h) {
  if (binnenGamut(oklchNaarLineair(L, C, h))) return C;
  let lo = 0;
  let hi = C;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (binnenGamut(oklchNaarLineair(L, mid, h))) lo = mid;
    else hi = mid;
  }
  return lo;
}

const encodeer = (c) => {
  const v = Math.min(1, Math.max(0, c));
  return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
};

/** OKLCH naar #rrggbb, met de chroma zo nodig teruggebracht tot sRGB. */
function oklch(L, C, h) {
  const rgb = oklchNaarLineair(L, inGamut(L, C, h), h);
  return `#${rgb
    .map((c) =>
      Math.round(encodeer(c) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

function luminantie(hex) {
  const n = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = Number.parseInt(n.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2-contrast tussen twee #rrggbb-kleuren. */
function contrast(a, b) {
  const [x, y] = [luminantie(a), luminantie(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

module.exports = { oklch, contrast, luminantie };
