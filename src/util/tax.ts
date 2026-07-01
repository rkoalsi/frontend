// Shared tax helpers for the order form.

/**
 * GST percentage for a product. Zoho returns an `item_tax_preferences` array
 * and the effective rate is the last entry. Guards against a missing/empty
 * array so the product cards never crash with a client-side exception.
 */
export const getTaxPercentage = (product: any): number => {
  const prefs = product?.item_tax_preferences;
  if (!Array.isArray(prefs) || prefs.length === 0) return 0;
  return prefs[prefs.length - 1]?.tax_percentage ?? 0;
};
