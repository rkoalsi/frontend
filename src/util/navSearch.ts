/**
 * Shared search + "frequently used" logic for the homepage grid and the ⌘K
 * palette. Both surfaces feed the same shape in, so a match here behaves
 * identically in either place.
 */

export type NavEntry = {
  /** Stable identity — the action name on home, the path for admin routes. */
  id: string;
  label: string;
  /** Group heading shown in the palette ("Orders", "Admin · Marketing"). */
  group: string;
  keywords?: string[];
  path?: string;
};

/** Normalises for matching: lowercase, collapse anything that isn't a letter/digit. */
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Regex-safe. Labels are ours, but keywords shouldn't be able to break matching. */
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Crude singulariser, deliberately not a real stemmer. It exists so "orders"
 * finds "Create New Order" and "cheque" finds "Cheques" — the only plural case
 * that actually comes up in these labels.
 */
const stem = (token: string) =>
  token.length > 3 && token.endsWith('s') && !token.endsWith('ss') ? token.slice(0, -1) : token;

/**
 * Score one entry against a query. Higher is better, 0 means "no match".
 *
 * The tiers matter more than the exact numbers: an exact label beats a label
 * prefix, which beats a word-start inside the label, which beats a keyword hit,
 * which beats a subsequence ("cusan" → Customer Analytics). Every query token
 * must land somewhere, so "payment due" doesn't match a page that only has
 * "payment".
 */
export const scoreEntry = (entry: NavEntry, query: string, allowFuzzy = false): number => {
  const q = norm(query);
  if (!q) return 1;

  const label = norm(entry.label);
  const keywords = (entry.keywords || []).map(norm);

  let total = 0;
  for (const token of q.split(' ')) {
    const root = stem(token);
    // Word-start match, tolerating the plural either way round.
    const wordStart = new RegExp(`\\b${escapeRe(root)}`);
    let best = 0;

    if (label === token || label === root) best = 100;
    else if (label.startsWith(root)) best = 80;
    else if (wordStart.test(label)) best = 60;
    else if (label.includes(root)) best = 40;

    if (best < 60) {
      for (const kw of keywords) {
        if (kw.startsWith(root)) best = Math.max(best, 55);
        else if (wordStart.test(kw)) best = Math.max(best, 45);
        else if (kw.includes(root)) best = Math.max(best, 30);
      }
    }

    // Abbreviation support ("cusan" → Customer Analytics), and only ever as a
    // whole-result-set fallback — see searchEntries. Scattered letters match
    // nearly anything ("dues" is a subsequence of "targeteD cUstomErS"), so
    // this must never compete with real matches.
    if (allowFuzzy && best === 0 && token.length >= 4 && isSubsequence(token, label)) {
      best = 12;
    }

    if (best === 0) return 0;
    total += best;
  }

  // Short labels win ties — "Cheques" should outrank "Expense Estimates" for "che".
  return total * 100 - label.length;
};

const isSubsequence = (needle: string, haystack: string): boolean => {
  let i = 0;
  for (const ch of haystack) {
    if (ch === needle[i]) i += 1;
    if (i === needle.length) return true;
  }
  return needle.length === 0;
};

/**
 * Filter + rank. Empty query returns everything, order untouched.
 *
 * Fuzzy subsequence matching only kicks in when the strict pass found nothing
 * at all. Letting it run alongside real matches is what padded a search for
 * "orders" with Customer Analytics and Create New Customer.
 */
export const searchEntries = <T extends NavEntry>(entries: T[], query: string): T[] => {
  if (!query.trim()) return entries;

  const rank = (allowFuzzy: boolean) =>
    entries
      .map((entry) => ({ entry, score: scoreEntry(entry, query, allowFuzzy) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.entry);

  const strict = rank(false);
  return strict.length ? strict : rank(true);
};

// ---------------------------------------------------------------------------
// Frequently used
// ---------------------------------------------------------------------------

/**
 * Storage model, and why it's split in two.
 *
 * `SNAPSHOT_KEY` holds the server's merged totals for this user, cached locally
 * so the shortcuts row renders on first paint with no network wait.
 * `PENDING_KEY` holds counts from this device that the server hasn't seen yet.
 *
 * Sending pending *deltas* rather than the local cumulative total is what makes
 * this work across devices: a rep's phone and laptop each contribute their own
 * clicks instead of one device's running total repeatedly clobbering the
 * other's. On sync the two are merged server-side and the snapshot is replaced.
 *
 * Everything here degrades quietly. If storage is unavailable (private
 * browsing, quota) or the sync request fails, the row just falls back to
 * whatever this device knows — it's a convenience, never a blocker.
 */
const SNAPSHOT_KEY = 'pupscribe:nav:usage';
const PENDING_KEY = 'pupscribe:nav:usage:pending';
const HALF_LIFE_DAYS = 21;

type UsageRecord = { count: number; lastAt: number };
type UsageMap = Record<string, UsageRecord>;

const readMap = (key: string): UsageMap => {
  if (typeof window === 'undefined') return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeMap = (key: string, map: UsageMap) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(map));
  } catch {
    /* private browsing / quota — shortcuts are a nicety, never block on them */
  }
};

/** Server totals plus anything this device hasn't synced yet. */
const mergedUsage = (): UsageMap => {
  const merged: UsageMap = { ...readMap(SNAPSHOT_KEY) };
  const pending = readMap(PENDING_KEY);
  Object.keys(pending).forEach((id) => {
    const base = merged[id] || { count: 0, lastAt: 0 };
    merged[id] = {
      count: (base.count || 0) + (pending[id].count || 0),
      lastAt: Math.max(base.lastAt || 0, pending[id].lastAt || 0),
    };
  });
  return merged;
};

/** Call on every navigation from the grid or the palette. */
export const recordUsage = (id: string) => {
  if (typeof window === 'undefined' || !id) return;
  const pending = readMap(PENDING_KEY);
  const prev = pending[id] || { count: 0, lastAt: 0 };
  pending[id] = { count: prev.count + 1, lastAt: Date.now() };
  writeMap(PENDING_KEY, pending);
};

/**
 * Push this device's unsent counts and adopt the server's merged totals.
 *
 * Called once on homepage mount. `post` is injected so this module stays free
 * of an axios import (and stays trivially testable). A failed sync is a no-op:
 * the pending counts stay pending and go up with the next attempt.
 */
export const syncUsage = async (
  post: (url: string, body: any) => Promise<{ data: any }>
): Promise<void> => {
  if (typeof window === 'undefined') return;
  const pending = readMap(PENDING_KEY);
  try {
    const { data } = await post('/users/nav-usage/sync', { deltas: pending });
    const usage = data?.usage;
    if (usage && typeof usage === 'object') {
      writeMap(SNAPSHOT_KEY, usage);
      // Only clear what we actually sent — a click during the round trip must
      // survive to the next sync rather than being dropped here.
      const now = readMap(PENDING_KEY);
      Object.keys(pending).forEach((id) => {
        const remaining = (now[id]?.count || 0) - (pending[id]?.count || 0);
        if (remaining > 0) now[id] = { ...now[id], count: remaining };
        else delete now[id];
      });
      writeMap(PENDING_KEY, now);
    }
  } catch {
    /* offline or unauthenticated — retry on the next mount */
  }
};

/**
 * Top `limit` ids by recency-weighted frequency. A page opened 20 times three
 * months ago shouldn't outrank one opened 5 times this week, so each record's
 * count decays by half every three weeks.
 *
 * Returns [] until `minDistinct` different destinations have been used — a row
 * of shortcuts built from two data points is just noise.
 */
export const getFrequentIds = (limit = 5, minDistinct = 3): string[] => {
  const usage = mergedUsage();
  const ids = Object.keys(usage);
  if (ids.length < minDistinct) return [];

  const now = Date.now();
  const dayMs = 86400000;
  return ids
    .map((id) => {
      const { count, lastAt } = usage[id];
      const ageDays = Math.max(0, (now - lastAt) / dayMs);
      return { id, score: (count || 0) * Math.pow(0.5, ageDays / HALF_LIFE_DAYS) };
    })
    .filter((r) => r.score >= 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.id);
};
