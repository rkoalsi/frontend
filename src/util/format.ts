// Shared number/currency formatting for the Marketplace.
//
// Everything money-facing is INR, so it uses the Indian digit grouping
// (lakh/crore: ₹12,34,567) rather than the western thousands grouping.

const toNumber = (value: any): number => {
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Group a number with Indian separators. `decimals` is fixed (both min and
 * max) so columns line up: `formatNumber(4692)` → `4,692`,
 * `formatNumber(4692.5, 2)` → `4,692.50`.
 */
export const formatNumber = (value: any, decimals = 0): string =>
  toNumber(value).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

/**
 * INR amount with the ₹ symbol. Defaults to whole rupees — pass `2` where
 * paise matter (invoice/estimate totals, line rates).
 */
export const formatCurrency = (value: any, decimals = 0): string =>
  `₹${formatNumber(value, decimals)}`;
