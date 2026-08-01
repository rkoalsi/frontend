// Accent colours + copy for the order-form brand rail.
//
// Two kinds of entry share that rail: the three *collections* (New Arrivals,
// Pre Orders, Special Offers) and the actual brands from `db.brands`.
// Collections get fixed semantic colours so they read as a different kind of
// thing; brands get their own `color` field when an admin has set one, and a
// stable name-derived colour when they haven't.

export type ThemeMode = 'light' | 'dark';

/**
 * One entry on the brand rail: either a collection or a real brand from
 * `db.brands`. Shared by the rail, the spotlight carousel and the info dialog.
 */
export interface BrandRailEntry {
  brand: string;
  url?: string | null;
  image?: string | null;
  secondary_image_url?: string | null;
  description?: string | null;
  color?: string | null;
}

export interface BrandAccent {
  /** Foreground/border accent, already tuned for the active theme. */
  main: string;
  /** Low-opacity companion for chip and banner backgrounds. */
  soft: string;
}

/**
 * The three rail entries that are not brands. Keys are the internal routing
 * values used by the products endpoints — "Clearance" surfaces as
 * "Special Offers" (see brandDisplayName in Products.tsx).
 */
export const COLLECTION_KEYS = ['New Arrivals', 'Pre Orders', 'Clearance'];

export const isCollectionKey = (brand?: string) =>
  !!brand && COLLECTION_KEYS.includes(brand);

/** Hue/saturation seeds for the collections, resolved per theme below. */
const COLLECTION_HSL: Record<string, [number, number]> = {
  'New Arrivals': [250, 55], // Bark Blue
  'Pre Orders': [32, 72],    // amber — incoming, not yet here
  Clearance: [330, 50],      // Pupscribe Pink
};

/**
 * Fallback hues for brands with no `color` set. Spread around the wheel and
 * deliberately clear of the collections' blue/amber/pink so a brand is never
 * mistaken for a collection.
 */
const FALLBACK_HSL: [number, number][] = [
  [199, 62],
  [145, 42],
  [12, 60],
  [274, 45],
  [172, 48],
  [42, 62],
  [212, 52],
  [96, 40],
  [318, 40],
  [186, 55],
];

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

function hexToHsl(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const int = parseInt(m[1], 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l * 100];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = h * 60;
  if (h < 0) h += 360;
  return [h, s * 100, l * 100];
}

/**
 * A brand's own hex can be any lightness — a logo colour picked for print is
 * often unreadable on one of our two grounds. Keep the hue, force the
 * lightness and saturation into the band that stays legible in this theme.
 */
function tune(h: number, s: number, mode: ThemeMode): BrandAccent {
  const sat = clamp(s, 34, 78);
  if (mode === 'dark') {
    return {
      main: `hsl(${h.toFixed(0)}, ${sat.toFixed(0)}%, 72%)`,
      soft: `hsla(${h.toFixed(0)}, ${sat.toFixed(0)}%, 72%, 0.15)`,
    };
  }
  return {
    main: `hsl(${h.toFixed(0)}, ${sat.toFixed(0)}%, 38%)`,
    soft: `hsla(${h.toFixed(0)}, ${sat.toFixed(0)}%, 42%, 0.11)`,
  };
}

/** Stable index into FALLBACK_HSL — the same brand always gets the same hue. */
function hashIndex(name: string, buckets: number) {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % buckets;
}

export function getBrandAccent(
  brand: string | undefined,
  color: string | null | undefined,
  mode: ThemeMode
): BrandAccent {
  const key = brand || '';
  const collection = COLLECTION_HSL[key];
  if (collection) return tune(collection[0], collection[1], mode);

  if (color) {
    const hsl = hexToHsl(color);
    if (hsl) return tune(hsl[0], hsl[1], mode);
  }

  const [h, s] = FALLBACK_HSL[hashIndex(key, FALLBACK_HSL.length)];
  return tune(h, s, mode);
}

/**
 * Copy for the collections. Brands carry their own `description` from
 * `db.brands`; the collections have nowhere to store one, and they are the
 * entries people most often misread as brands.
 */
export const COLLECTION_COPY: Record<
  string,
  { label: string; short: string; description: string }
> = {
  'New Arrivals': {
    label: 'New',
    // `short` stands in for the category list on the rail tabs — collections
    // are all filed under a single "All Products" category, so listing it
    // would say nothing.
    short: 'Added in the last 3 months',
    description: 'Products added to the catalogue in the last three months.',
  },
  'Pre Orders': {
    label: 'Pre-order',
    short: 'Incoming stock',
    description:
      'Stock already on its way to us. Reserve it now and it ships as soon as the shipment lands.',
  },
  Clearance: {
    label: 'Offer',
    short: 'Limited-Time Savings',
    description:
      'Limited-Time Clearance Offers on Selected Products',
  },
};
