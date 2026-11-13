export const campaignSegments = [
  { id: "all", label: "All Wallet members", description: "Everyone with a registered Apple Wallet card." },
  { id: "birthday_today", label: "Birthdays today", description: "Celebrate today, in your business’s timezone." },
  { id: "birthday_week", label: "Birthdays · next 7 days", description: "Today and the following six days." },
  { id: "inactive_14", label: "Inactive · 14+ days", description: "No recorded visit for at least 14 days." },
  { id: "inactive_30", label: "Inactive · 30+ days", description: "No recorded visit for at least 30 days." },
] as const;
export type CampaignSegment = typeof campaignSegments[number]["id"];
export const MAX_CAMPAIGN_RECIPIENTS = 50;
export type CampaignMember = {
  id: string; name: string; memberNumber: string; devices: number;
  lastVisitAt: string | null; inactiveDays: number; birthdayInDays: number;
  segments: CampaignSegment[];
};
const DAY = 86400000;
function calendar(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(date);
  const part = (type: string) => Number(parts.find(p => p.type === type)!.value);
  return { year: part("year"), month: part("month"), day: part("day") };
}
export function daysUntilBirthday(birthday: Date, now: Date, timezone: string) {
  const today = calendar(now, timezone);
  const todayNumber = Date.UTC(today.year, today.month - 1, today.day);
  const occurrence = (year: number) => {
    const month = birthday.getUTCMonth();
    // Match existing birthday rewards: Feb 29 birthdays use Feb 28 in non-leap years.
    const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return Date.UTC(year, month, Math.min(birthday.getUTCDate(), last));
  };
  let next = occurrence(today.year);
  if (next < todayNumber) next = occurrence(today.year + 1);
  return Math.round((next - todayNumber) / DAY);
}
export function memberSegments(birthday: Date, createdAt: Date, lastVisitAt: Date | null, now: Date, timezone: string) {
  const birthdayInDays = daysUntilBirthday(birthday, now, timezone);
  const inactiveDays = Math.max(0, Math.floor((now.getTime() - (lastVisitAt ?? createdAt).getTime()) / DAY));
  const segments: CampaignSegment[] = ["all"];
  if (birthdayInDays === 0) segments.push("birthday_today");
  if (birthdayInDays < 7) segments.push("birthday_week");
  if (inactiveDays >= 14) segments.push("inactive_14");
  if (inactiveDays >= 30) segments.push("inactive_30");
  return { birthdayInDays, inactiveDays, segments };
}
