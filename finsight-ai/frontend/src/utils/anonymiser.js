export function anonymiseText(text) {
  if (!text) return '';
  let anonymised = text;

  // 1. Email addresses
  anonymised = anonymised.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');

  // 2. Mobile numbers (10 digits, optionally prefixed with +91 or 91)
  anonymised = anonymised.replace(/(?:\+91[-\s]?)?[6789]\d{9}\b/g, '[MOBILE]');

  // 3. PAN numbers (Format: 5 letters, 4 digits, 1 letter)
  anonymised = anonymised.replace(/\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g, '[PAN]');

  // 4. Aadhaar numbers (12 digits, often formatted as 4-4-4)
  anonymised = anonymised.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[AADHAAR]');

  // 5. Bank account numbers (9-18 digits)
  // Negative lookbehinds and lookaheads ensure we don't accidentally match dates, years,
  // or amounts which often contain commas or decimals.
  anonymised = anonymised.replace(/(?<![\d.,])\d{9,18}(?![\d.,])/g, '[ACCOUNT]');

  // 6. Policy numbers
  // Matches "Policy No", "Policy Number", etc. followed by alphanumeric codes
  anonymised = anonymised.replace(/\b(Policy[\s-]*N(?:o\.?|umber)?[^\w\d]*)([A-Za-z0-9-]{5,})\b/gi, '$1[POLICY]');

  return anonymised;
}
