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

export const formatHumanDateTime = (
  value?: string | number | Date | null,
  opts: FormatOpts = {}
): string => {
  if (value === null || value === undefined || value === '') return '—';

  let d: Date;
  if (value instanceof Date) {
    d = value;
  } else if (typeof value === 'number') {
    d = new Date(value);
  } else {
    let s = String(value).trim();
    // "YYYY-MM-DD HH:MM:SS" → ISO-ish so Date parses it consistently.
    if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(s)) s = s.replace(' ', 'T');
    const hasTz = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(s);
    if (opts.assumeUTC && !hasTz) s += 'Z';
    d = new Date(s);
  }

  if (isNaN(d.getTime())) return String(value);

  const fmtOpts: Intl.DateTimeFormatOptions = { ...DISPLAY_OPTS };
  if (opts.tz) fmtOpts.timeZone = opts.tz;
  return d.toLocaleString('en-IN', fmtOpts);
};
