// Shared margin helpers for the order form.
// Mirrors the backend effective_margin() in routes/orders.py so the price the
// customer sees (card → cart → Review) matches the Zoho estimate discount.

/** Parse a margin like "40%", "40", 40 → 40. Falls back to 40 when malformed. */
export const parseMarginPct = (margin: any): number => {
  const n = parseInt(String(margin ?? '').replace('%', '').trim(), 10);
  return Number.isNaN(n) ? 40 : n;
};

/**
 * Effective margin percentage for a product. Adds the clearance bonus
 * (additive percentage points, capped at 100) when the product is on clearance.
 * `baseMargin` is whatever already won the precedence chain
 * (special margin → customer margin → order margin → default).
 */
export const getEffectiveMarginPct = (baseMargin: any, product: any): number => {
  let pct = parseMarginPct(baseMargin);
  if (product?.clearance) {
    const bonus = Number(product?.clearance_margin) || 0;
    pct += bonus;
  }
  return Math.min(pct, 100);
};

/** Effective margin as a "NN%" string for storing on order lines. */
export const getEffectiveMarginStr = (baseMargin: any, product: any): string =>
  `${getEffectiveMarginPct(baseMargin, product)}%`;
