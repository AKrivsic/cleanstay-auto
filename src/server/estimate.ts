export type EstimateInput = {
  service: 'basic' | 'general' | 'post_reno' | 'airbnb' | 'office' | 'svj';
  sqm?: number;
  rooms?: number;
  windowsSqm?: number;
  appliances?: number;
  laundryKg?: number;
  express?: boolean;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, max === Infinity ? n : Math.min(n, max));

export function estimatePrice(i: EstimateInput) {
  const sqm = i.sqm ?? (i.rooms ? i.rooms * 20 : 45);
  let base = 0;

  if (i.service === 'basic') {
    base = sqm <= 45 ? 890 : sqm <= 75 ? 1390 : 1990;
  } else if (i.service === 'general') {
    base = (sqm <= 45 ? 1200 : sqm <= 75 ? 1790 : 2490) * 1.45;
  } else if (i.service === 'post_reno') {
    base = (sqm <= 45 ? 1400 : sqm <= 75 ? 1990 : 2790) * 1.75;
  } else if (i.service === 'office' || i.service === 'svj') {
    base = Math.max(1500, sqm * 25);
  } else if (i.service === 'airbnb') {
    base = sqm <= 45 ? 890 : sqm <= 75 ? 1390 : 1990;
    const hasLaundry = (i.laundryKg ?? 0) > 0;
    if (!hasLaundry) {
      base = clamp(Math.round(base * 0.7), 600, Infinity);
    }
  }

  if (i.windowsSqm) base += i.windowsSqm * 45;
  if (i.appliances) base += i.appliances * 350;
  if (i.laundryKg) base += i.laundryKg * 60;
  if (i.express) base *= 1.3;

  const from = Math.round(base * 0.85);
  const to = Math.round(base * 1.15);

  return {
    from,
    to,
    currency: 'CZK',
    note: 'Orientační odhad, vše dle dohody.',
  };
}


