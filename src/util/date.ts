// Human-readable date/time formatting shared across admin tables.
//
// Two shapes of `created_at` show up in this app:
//  - Already-IST wall-clock strings like "2026-07-21 12:30:00" (the orders
//    endpoint pre-formats these to Asia/Kolkata). Format as-is — no tz shift.
//  - Naive UTC ISO strings from Mongo like "2026-07-21T07:00:00" (leads,
//    expected reorders). Pass { assumeUTC: true, tz: 'Asia/Kolkata' } so they
//    are interpreted as UTC and rendered in IST.

type FormatOpts = {
  assumeUTC?: boolean;
  tz?: string;
};

const DISPLAY_OPTS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
};

const DATE_ONLY_OPTS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
};

const parseTimestamp = (
  value: string | number | Date,
  opts: FormatOpts
): Date => {
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);

  let s = String(value).trim();
  // "YYYY-MM-DD HH:MM:SS" → ISO-ish so Date parses it consistently.
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(s)) s = s.replace(' ', 'T');
  const hasTz = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(s);
  if (opts.assumeUTC && !hasTz) s += 'Z';
  return new Date(s);
};

export const formatHumanDateTime = (
  value?: string | number | Date | null,
  opts: FormatOpts = {}
): string => {
  if (value === null || value === undefined || value === '') return '—';

  const d = parseTimestamp(value, opts);
  if (isNaN(d.getTime())) return String(value);

  const fmtOpts: Intl.DateTimeFormatOptions = { ...DISPLAY_OPTS };
  if (opts.tz) fmtOpts.timeZone = opts.tz;
  return d.toLocaleString('en-IN', fmtOpts);
};

/** Same parsing rules as formatHumanDateTime, but day-level — "21 Jul 2026". */
export const formatHumanDate = (
  value?: string | number | Date | null,
  opts: FormatOpts = {}
): string => {
  if (value === null || value === undefined || value === '') return '—';

  const d = parseTimestamp(value, opts);
  if (isNaN(d.getTime())) return String(value);

  const fmtOpts: Intl.DateTimeFormatOptions = { ...DATE_ONLY_OPTS };
  if (opts.tz) fmtOpts.timeZone = opts.tz;
  return d.toLocaleDateString('en-IN', fmtOpts);
};

/**
 * The one date a customer or salesperson should see on a catalogue: when it
 * last changed, falling back to when it was added. Timestamps come out of Mongo
 * as naive UTC, so they are always read as UTC and rendered in IST — otherwise
 * the same catalogue reads differently depending on the viewer's device clock.
 */
export const formatCatalogueDate = (
  updatedAt?: string | null,
  createdAt?: string | null
): string => {
  const value = updatedAt || createdAt;
  if (!value) return '';
  const label = updatedAt ? 'Updated' : 'Added';
  return `${label} ${formatHumanDate(value, {
    assumeUTC: true,
    tz: 'Asia/Kolkata',
  })}`;
};
