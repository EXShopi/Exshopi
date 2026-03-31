export const EMIRATES = [
  'Dubai',
  'Sharjah',
  'Ajman',
  'Abu Dhabi',
  'Ras Al Khaimah',
  'Fujairah',
  'Umm Al Quwain'
] as const;

export type Emirate = typeof EMIRATES[number];

export const DELIVERY_RULES = {
  SAME_DAY: ['Dubai', 'Sharjah', 'Ajman'] as Emirate[],
  NEXT_DAY: ['Abu Dhabi', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'] as Emirate[],
};

export const getDeliveryType = (emirate: string): 'Same Day' | 'Next Day' | 'Standard' => {
  if (DELIVERY_RULES.SAME_DAY.includes(emirate as Emirate)) return 'Same Day';
  if (DELIVERY_RULES.NEXT_DAY.includes(emirate as Emirate)) return 'Next Day';
  return 'Standard';
};
