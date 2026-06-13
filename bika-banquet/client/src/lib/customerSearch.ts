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

export type CustomerSuggestionFields = CustomerSearchFields & {
  id: string;
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
    // Check each whitespace-separated token individually so digits from different
    // fields (e.g. name "Kumar1" and phone "23456") don't concatenate into a
    // spurious match for a query like "12".
    for (const token of text.split(/\s+/)) {
      const tokenDigits = token.replace(/\D/g, '');
      if (tokenDigits.includes(queryDigits)) return true;
    }
    // Also allow full-concatenated match for long queries (≥6 digits) so that
    // E164-style input like "919876543210" can still match "+91 9876543210".
    if (queryDigits.length >= 6) {
      const textDigits = text.replace(/\D/g, '');
      if (textDigits.includes(queryDigits)) return true;
    }
  }

  return false;
}

export function compareCustomersByName<T extends CustomerSuggestionFields>(
  a: T,
  b: T
): number {
  const aName = (a.name || '').trim();
  const bName = (b.name || '').trim();
  const nameCompare = aName.localeCompare(bName, undefined, {
    sensitivity: 'base',
    numeric: true,
  });
  if (nameCompare !== 0) return nameCompare;

  const phoneCompare = (a.phone || '').localeCompare(b.phone || '', undefined, {
    sensitivity: 'base',
    numeric: true,
  });
  if (phoneCompare !== 0) return phoneCompare;

  return a.id.localeCompare(b.id);
}

export function uniqueCustomersById<T extends { id: string }>(customers: T[]): T[] {
  const seen = new Set<string>();
  return customers.filter((customer) => {
    if (seen.has(customer.id)) return false;
    seen.add(customer.id);
    return true;
  });
}

function matchesBookingSuggestion(customer: CustomerSuggestionFields, query: string): boolean {
  const name = (customer.name || '').toLowerCase();
  const phone = (customer.phone || '').toLowerCase();
  const queryDigits = query.replace(/\D/g, '');
  if (name.includes(query)) return true;
  if (phone.includes(query)) return true;
  if (queryDigits.length >= 2) {
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.includes(queryDigits)) return true;
  }
  return false;
}

function bookingSuggestionScore(customer: CustomerSuggestionFields, query: string): number {
  const name = (customer.name || '').toLowerCase();
  const phone = (customer.phone || '').toLowerCase();
  if (name.startsWith(query)) return 0;
  if (name.includes(query)) return 1;
  if (phone.startsWith(query)) return 2;
  if (phone.includes(query)) return 3;
  return 4;
}

export function filterCustomerSuggestions<T extends CustomerSuggestionFields>(
  customers: T[],
  rawQuery: string,
  selectedCustomerId = '',
  limit = 80
): T[] {
  const query = rawQuery.trim().toLowerCase();
  let filtered = [...customers];

  if (query) {
    // Booking dropdown labels only show name and primary phone, so suppress
    // matches from hidden fields such as email or alternate phone.
    filtered = filtered.filter((customer) => matchesBookingSuggestion(customer, query));
    filtered.sort((a, b) => {
      const diff = bookingSuggestionScore(a, query) - bookingSuggestionScore(b, query);
      return diff !== 0 ? diff : compareCustomersByName(a, b);
    });
  } else {
    filtered.sort(compareCustomersByName);
  }

  if (
    selectedCustomerId &&
    !filtered.some((customer) => customer.id === selectedCustomerId)
  ) {
    const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId);
    if (selectedCustomer) {
      filtered = [selectedCustomer, ...filtered];
    }
  }

  return filtered.slice(0, limit);
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
