export type CustomerSearchFields = {
  name?: string | null;
  phone?: string | null;
  phoneCountryCode?: string | null;
  alterPhone?: string | null;
  alternatePhone?: string | null;
  whatsappNumber?: string | null;
  whatsapp?: string | null;
  email?: string | null;
};

export function customerSearchText(customer: CustomerSearchFields): string {
  return [
    customer.name,
    customer.phoneCountryCode,
    customer.phone,
    customer.alterPhone,
    customer.alternatePhone,
    customer.whatsappNumber,
    customer.whatsapp,
    customer.email,
  ]
    .filter((value) => value != null && String(value).trim() !== '')
    .join(' ');
}

/** Match free-text query against name, phone (incl. digits-only), and related contact fields. */
export function matchesCustomerSearch(
  customer: CustomerSearchFields,
  query: string
): boolean {
  return textMatchesSearch(customerSearchText(customer), query);
}

export function textMatchesSearch(text: string, query: string): boolean {
  const trimmed = query.trim();
  if (!trimmed) return true;

  const lowerText = text.toLowerCase();
  const lowerQuery = trimmed.toLowerCase();
  if (lowerText.includes(lowerQuery)) return true;

  const queryDigits = trimmed.replace(/\D/g, '');
  if (queryDigits.length >= 2) {
    const textDigits = text.replace(/\D/g, '');
    if (textDigits.includes(queryDigits)) return true;
  }

  return false;
}

export function formatCustomerOptionLabel(customer: CustomerSearchFields): string {
  const name = (customer.name || '').trim();
  const code = (customer.phoneCountryCode || '+91').trim();
  const phone = (customer.phone || '').trim();
  const phoneDisplay = phone ? `${code} ${phone}`.trim() : '';
  if (!name && !phoneDisplay) return '';
  if (!phoneDisplay) return name;
  if (!name) return phoneDisplay;
  return `${name} (${phoneDisplay})`;
}
