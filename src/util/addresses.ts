/**
 * Zoho customers often carry the same address twice (billing + shipping copies
 * with different address_id's). For display purposes those are one address —
 * dedupe by normalized content, keeping the first occurrence (its address_id
 * is still valid for estimates).
 */
const CONTENT_FIELDS = [
  'attention',
  'address',
  'street2',
  'city',
  'state',
  'zip',
  'country',
];

export const addressContentKey = (addr: any): string =>
  CONTENT_FIELDS.map((f) =>
    String(addr?.[f] ?? '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
  ).join('|');

export const dedupeAddressesByContent = (addresses: any[] = []): any[] => {
  const seen = new Map<string, any>();
  for (const addr of addresses) {
    const key = addressContentKey(addr);
    if (!seen.has(key)) seen.set(key, addr);
  }
  return Array.from(seen.values());
};
