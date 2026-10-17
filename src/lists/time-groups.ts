/**
 * Groups of a list by when its items were made, as the Finder groups files, at a smaller scale for
 * what is recent: just now, the last 15 minutes, the last hour, then earlier today, yesterday, the
 * past week, and older. Knows nothing of the page.
 */

/** A group: its label and the newest age it holds, in minutes (its oldest is the next group's). */
const GROUPS: { label: string; withinMinutes: number }[] = [
  { label: 'Just now', withinMinutes: 5 },
  { label: 'Last 15 minutes', withinMinutes: 15 },
  { label: 'Last hour', withinMinutes: 60 },
];
const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;
const WEEK_DAYS = 7;

/**
 * Returns the label of the group an item made at a time belongs to.
 *
 * @param made - When the item was made, as an ISO time.
 * @param now - The time now, in milliseconds since 1970.
 * @returns "Just now", "Last 15 minutes", "Last hour", "Earlier today", "Yesterday", "Past week"
 *   or "Older".
 */
export function getTimeGroup(made: string, now: number): string {
  const time = Date.parse(made);
  const minutes = (now - time) / MINUTE;
  const recent = GROUPS.find(({ withinMinutes }) => minutes < withinMinutes);
  if (recent) return recent.label;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const startOfToday = today.getTime();
  if (time >= startOfToday) return 'Earlier today';
  if (time >= startOfToday - DAY) return 'Yesterday';
  if (time >= startOfToday - WEEK_DAYS * DAY) return 'Past week';
  return 'Older';
}

/**
 * Splits a list, newest first, into its time groups, in order.
 *
 * @param items - The items, newest first.
 * @param getMade - Gives when an item was made, as an ISO time.
 * @param now - The time now, in milliseconds since 1970.
 * @returns The groups that have items, each with its label and its items in their order.
 */
export function groupByTime<Item>(
  items: Item[],
  getMade: (item: Item) => string,
  now: number,
): { label: string; items: Item[] }[] {
  const groups: { label: string; items: Item[] }[] = [];
  for (const item of items) {
    const label = getTimeGroup(getMade(item), now);
    const last = groups.at(-1);
    if (last?.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }
  return groups;
}
