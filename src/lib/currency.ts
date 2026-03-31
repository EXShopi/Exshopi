export const formatAED = (
  value: number | string | null | undefined,
  options?: {
    maximumFractionDigits?: number;
    minimumFractionDigits?: number;
  }
) => {
  const amount = Number(value ?? 0);
  const safeAmount = Number.isFinite(amount) ? amount : 0;

  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    currencyDisplay: 'code',
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
  }).format(safeAmount);
};

export const formatAEDPlain = (
  value: number | string | null | undefined,
  options?: {
    maximumFractionDigits?: number;
    minimumFractionDigits?: number;
  }
) => {
  const amount = Number(value ?? 0);
  const safeAmount = Number.isFinite(amount) ? amount : 0;

  return `AED ${safeAmount.toLocaleString('en-AE', {
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
  })}`;
};
