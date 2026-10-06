// Pure phone formatting for the RD-first contact / application forms (WD3 / WF4). No Angular here so it
// can be unit-tested directly and reused by the PhoneFormatDirective. The control value is the formatted
// display string; `toE164()` derives the normalized number the edge function also stores (phone_e164).

const RD_AREA = new Set(['809', '829', '849']); // Dominican Republic area codes (NANP, +1)

/** International when the raw input carries a leading "+" or more than 10 national digits. */
export function isInternational(raw: string): boolean {
  const hasPlus = raw.trimStart().startsWith('+');
  const digits = raw.replace(/\D/g, '');
  return hasPlus || digits.length > 10;
}

/** Group up to 10 digits progressively as XXX-XXX-XXXX (NANP national format). */
function groupNanp(d: string): string {
  const a = d.slice(0, 3);
  const b = d.slice(3, 6);
  const c = d.slice(6, 10);
  let out = a;
  if (d.length > 3) out += '-' + b;
  if (d.length > 6) out += '-' + c;
  return out;
}

/** Format the raw input for display: "809-692-5906" nationally, "+1 809-692-5906" / "+34 612 345 678" intl. */
export function formatPhoneDisplay(raw: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (!digits) return raw.trimStart().startsWith('+') ? '+' : '';

  if (!isInternational(raw)) {
    return groupNanp(digits.slice(0, 10));
  }

  // International. NANP (country code 1) keeps the XXX-XXX-XXXX sub-format; everything else is a
  // 2-digit country code followed by groups of three.
  if (digits[0] === '1') {
    const rest = groupNanp(digits.slice(1, 11));
    return rest ? `+1 ${rest}` : '+1';
  }
  const cc = digits.slice(0, 2);
  const rest = digits.slice(2);
  const groups = rest.match(/.{1,3}/g) ?? [];
  return groups.length ? `+${cc} ${groups.join(' ')}` : `+${cc}`;
}

/** E.164 when deducible: "+1XXXXXXXXXX" for RD numbers, "+<digits>" for international, else null. */
export function toE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (!isInternational(raw)) {
    if (digits.length === 10 && RD_AREA.has(digits.slice(0, 3))) return '+1' + digits;
    return null;
  }
  return digits.length >= 8 ? '+' + digits : null;
}
