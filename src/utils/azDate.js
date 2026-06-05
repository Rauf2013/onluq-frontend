// Azərbaycan ay adları — cihaz locale-indən asılı olmadan düzgün ad.
const AZ_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun',
  'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr',
];

function toDate(value) {
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

// "İyun 2026"
export function azMonthYear(value) {
  const d = toDate(value);
  if (!d) return '';
  return `${AZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// "5 İyun 2026"
export function azFullDate(value) {
  const d = toDate(value);
  if (!d) return '';
  return `${d.getDate()} ${AZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// "5 İyun 2026, 23:02"
export function azDateTime(value) {
  const d = toDate(value);
  if (!d) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${AZ_MONTHS[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`;
}

export { AZ_MONTHS };
