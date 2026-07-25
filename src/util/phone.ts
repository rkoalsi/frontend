/**
 * Indian mobile normalisation — mirror of `config/phone.py` on the backend.
 *
 * Kept in sync so the UI can warn about an unusable number *before* the admin
 * tries to create a login or send a WhatsApp message, instead of surfacing a
 * server error afterwards.
 */

export interface NormalizedPhone {
  phone: string | null;
  valid: boolean;
  reason: string;
}

const MOBILE_RE = /^[6-9]\d{9}$/;

export function normalizeIndianMobile(raw: unknown): NormalizedPhone {
  const digits = String(raw ?? '').replace(/\D/g, '');

  if (!digits) {
    return { phone: null, valid: false, reason: 'No phone number on record' };
  }

  let candidate = digits;
  // "00" is the international dialling prefix (00 91 98…), not a second number.
  if (candidate.length >= 12 && candidate.startsWith('00')) candidate = candidate.slice(2);

  if (candidate.length === 13 && candidate.startsWith('091')) candidate = candidate.slice(3);
  else if (candidate.length === 12 && candidate.startsWith('91')) candidate = candidate.slice(2);
  else if (candidate.length === 11 && candidate.startsWith('0')) candidate = candidate.slice(1);

  if (MOBILE_RE.test(candidate)) {
    return { phone: candidate, valid: true, reason: '' };
  }

  // Long values are almost always two numbers in one field — guessing which is
  // meant is how you message the wrong customer.
  if (digits.length > 13) {
    return {
      phone: null,
      valid: false,
      reason: `Looks like more than one number (${digits.length} digits). Split them and keep a single mobile.`,
    };
  }

  if (candidate.length < 10) {
    return { phone: null, valid: false, reason: `Too short for a mobile number (${digits.length} digits)` };
  }

  if (candidate.length > 10) {
    return {
      phone: null,
      valid: false,
      reason: `Not a recognised Indian mobile format (${digits.length} digits)`,
    };
  }

  return {
    phone: null,
    valid: false,
    reason: 'Indian mobile numbers must be 10 digits starting with 6-9',
  };
}

/** The 10-digit mobile, or '' when it cannot be resolved. */
export function toWhatsappNumber(raw: unknown): string {
  return normalizeIndianMobile(raw).phone ?? '';
}
