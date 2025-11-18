export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function parseNumber(value: string): number {
  const cleanValue = value.replace(/[^\d.-]/g, '');
  return Number(cleanValue) || 0;
}
