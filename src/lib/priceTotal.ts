// Prices are stored as text. Only unambiguous, non-negative yen amounts
// participate in the total; descriptions and foreign currencies are excluded.
export function parseYenCents(value: string): number | null {
  const normalized = value.normalize("NFKC").replace(/\s/g, "");
  const match = /^(?:¥)?((?:\d+|\d{1,3}(?:,\d{3})+))(?:\.(\d{1,2}))?(?:円)?$/.exec(normalized);
  if (!match) return null;
  const cents = Number(match[1].replace(/,/g, "")) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}

export function priceTotal(labels: readonly { price: string }[]) {
  let cents = 0, included = 0, excluded = 0;
  for (const label of labels) {
    const amount = parseYenCents(label.price);
    if (amount === null || !Number.isSafeInteger(cents + amount)) excluded++;
    else { cents += amount; included++; }
  }
  return { total: cents / 100, included, excluded };
}
