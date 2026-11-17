// Calendar dates are league-local (America/Chicago); exports use UTC instants.
export const LEAGUE_ZONE = "America/Chicago";
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
function checkedDate(date) {
  if (!datePattern.test(date)) throw new Error("Invalid calendar date.");
  const value = new Date(date + "T12:00:00Z");
  if (!Number.isFinite(+value) || value.toISOString().slice(0, 10) !== date) throw new Error("Invalid calendar date.");
  return value;
}
export function centralToday(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: LEAGUE_ZONE, year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(now).map(p => [p.type, p.value]));
  return parts.year + "-" + parts.month + "-" + parts.day;
}
export function shiftMonth(month, delta) {
  const date = checkedDate(month + "-01");
  date.setUTCMonth(date.getUTCMonth() + delta);
  return date.toISOString().slice(0, 7);
}
export function monthCells(month) {
  const first = checkedDate(month + "-01");
  const last = new Date(first);
  last.setUTCMonth(last.getUTCMonth() + 1, 0);
  const length = Math.ceil((first.getUTCDay() + last.getUTCDate()) / 7) * 7;
  return Array.from({ length }, (_, i) => {
    const date = new Date(first);
    date.setUTCDate(1 - first.getUTCDay() + i);
    const iso = date.toISOString().slice(0, 10);
    return { date: iso, day: date.getUTCDate(), inMonth: iso.startsWith(month) };
  });
}
function localParts(instant) {
  return Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: LEAGUE_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
  }).formatToParts(instant).map(p => [p.type, p.value]));
}
function wallClockMs(parts) {
  return Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
}
export function centralToUtc(date, time) {
  checkedDate(date);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error("Invalid event time.");
  const target = Date.parse(date + "T" + time + ":00Z");
  // Examine both sides of a DST change instead of assuming a fixed UTC offset.
  const offsets = new Set([-86400000, 0, 86400000].map(delta => {
    const probe = target + delta;
    return wallClockMs(localParts(new Date(probe))) - probe;
  }));
  const matches = [...offsets].map(offset => target - offset)
    .filter(value => wallClockMs(localParts(new Date(value))) === target).sort((a, b) => a - b);
  if (!matches.length) throw new Error("This event time does not exist in Central Time because of daylight saving. Ask your coach to correct it.");
  // The first occurrence is used for a repeated local time, as in RFC 5545.
  return new Date(matches[0]);
}
export function selectExportEvents(events, { teamIds, kinds = ["game", "practice"], month = "", date = "", ids = null }) {
  const teams = new Set(teamIds), wantedKinds = new Set(kinds), wantedIds = ids && new Set(ids);
  const unique = new Map();
  for (const e of events) {
    if (!e.cancelled && teams.has(e.team) && wantedKinds.has(e.kind) &&
      (!month || e.date.startsWith(month + "-")) && (!date || e.date === date) &&
      (!wantedIds || wantedIds.has(e.id))) unique.set(e.id, e);
  }
  return [...unique.values()].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
}
function icsText(value) {
  return String(value ?? "").replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
}
function utf8Size(char) { const cp = char.codePointAt(0); return cp < 128 ? 1 : cp < 2048 ? 2 : cp < 65536 ? 3 : 4; }
function foldLine(line) {
  let result = "", count = 0;
  for (const char of line) {
    const size = utf8Size(char);
    if (count + size > 75) { result += "\r\n "; count = 1; }
    result += char; count += size;
  }
  return result;
}
function stamp(date) {
  if (!Number.isFinite(+date)) throw new Error("Invalid calendar timestamp.");
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
export function buildCalendar(events, { now = new Date(), title = "CLD preview schedule" } = {}) {
  const rows = [...new Map(events.filter(e => !e.cancelled).map(e => [e.id, e])).values()];
  if (!rows.length) throw new Error("Choose at least one scheduled game or practice.");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Cleveland Little Dribblers//Schedule Preview//EN",
    "CALSCALE:GREGORIAN", "X-WR-CALNAME:" + icsText(title)];
  for (const e of rows) {
    const start = centralToUtc(e.date, e.start), end = centralToUtc(e.date, e.end);
    if (end <= start) throw new Error("An event's end time must be after its start time.");
    lines.push("BEGIN:VEVENT", "UID:" + encodeURIComponent(e.id) + "@preview.cleveland-little-dribblers.example",
      "DTSTAMP:" + stamp(now), "DTSTART:" + stamp(start), "DTEND:" + stamp(end),
      "SUMMARY:" + icsText(e.title), "LOCATION:" + icsText(e.location),
      "DESCRIPTION:" + icsText(e.description), "STATUS:CONFIRMED", "TRANSP:OPAQUE", "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
