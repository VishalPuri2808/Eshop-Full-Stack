export function generateTrackingNumber(country: string) {
  const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('');
  const cc = (country || 'US').slice(0, 2).toUpperCase().padEnd(2, 'X');
  return `Unq${digits}${cc}`;
}
