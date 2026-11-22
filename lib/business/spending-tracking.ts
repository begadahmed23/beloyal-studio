/** Businesses currently approved for optional purchase amount tracking. 
 * Keep this opt-in: other business stamps must never request purchase amounts. */
export function isSpendingTrackingEnabled(business: { slug: string; name?: string | null }): boolean {
  const slug = business.slug.toLowerCase();
  return slug === "mb-vape" || slug === "loretto" ||
    (slug !== "mb-vape" && /loretto/i.test(business.name ?? ""));
}
