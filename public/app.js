/* DESIGN PREVIEW ONLY. All records below are fictional examples.
 * No account authentication, private records, email delivery, or Quickbase writes.
 * Demo edits live in memory only and reset on reload. A live portal must enforce
 * guardian/player and coach/team authorization in its server API on every request;
 * the view picker here is not an authorization mechanism. One identity may have
 * both roles; only the league can approve coach assignments in production.
 */
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const clockIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
const pinIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>';
const leagueDates = [
  { date: "2026-11-21", title: "Player evaluations", start: "09:00", location: "Community gym", note: "A sample league date. Age-group arrival times and evaluation details would appear here." },
  { date: "2026-11-28", title: "Coaches meeting", start: "18:00", location: "Community gym · Meeting room", note: "A sample meeting entry for season information and league updates." },
  { date: "2026-12-05", title: "Season tip-off", start: "09:00", location: "Community gym", note: "A sample season-opening date. Parents would sign in for their own players' game times." },
];
const leagueNews = [
  { title: "A new home for our basketball community.", body: "Welcome to the league bulletin. This is where families will find important dates, season reminders, and announcements from Cleveland Little Dribblers.", pinned: true, category: "LEAGUE NEWS", date: "2026-11-14" },
  { title: "Mark your calendar for player evaluations", body: "Evaluation details and reminders will be shared here. Select an upcoming date to see more information. The dates in this preview are examples only.", pinned: false, category: "SEASON UPDATE", date: "2026-11-13" },
  { title: "Your team's updates, all in one place", body: "Parents will be able to sign in to see their children's practices, games, and messages from their coaches. Explore the sample parent and coach portals using Sign in.", pinned: false, category: "FOR FAMILIES", date: "2026-11-12" },
];
const players = [
  { id: "sample-player-1", name: "A. Parker", initials: "AP", team: "bandits", teamName: "Bandits", division: "Rookies", color: "red" },
  { id: "sample-player-2", name: "J. Parker", initials: "JP", team: "falcons", teamName: "Falcons", division: "Juniors", color: "teal" },
];
const teams = { bandits: "Bandits", falcons: "Falcons" };
let events = [
  { id: "sample-event-1", team: "bandits", kind: "practice", date: "2026-11-23", start: "18:00", end: "19:00", location: "Community gym · Court 1", opponent: "", notes: "Bring your basketball and a water bottle.", cancelled: false },
  { id: "sample-event-2", team: "falcons", kind: "practice", date: "2026-11-24", start: "18:30", end: "19:30", location: "Community gym · Court 2", opponent: "", notes: "Please arrive 10 minutes early.", cancelled: false },
  { id: "sample-event-3", team: "bandits", kind: "practice", date: "2026-11-25", start: "18:00", end: "19:00", location: "Community gym · Court 1", opponent: "", notes: "Skills, passing, and a team scrimmage.", cancelled: false },
  { id: "sample-event-4", team: "bandits", kind: "game", date: "2026-12-05", start: "09:00", end: "10:00", location: "Community gym · Court 1", opponent: "Hawks", notes: "Arrive 20 minutes before tip-off.", cancelled: false },
  { id: "sample-event-5", team: "falcons", kind: "game", date: "2026-12-05", start: "11:00", end: "12:00", location: "Community gym · Court 2", opponent: "Bears", notes: "Wear your team jersey.", cancelled: false },
];
let teamNews = [
  { id: "sample-news-1", team: "bandits", title: "Ready for our first practice?", body: "Bring a basketball, athletic shoes, and a water bottle. We're looking forward to getting the team on the court!", pinned: true, date: "2026-11-14" },
  { id: "sample-news-2", team: "falcons", title: "A quick reminder for game day", body: "Please arrive 20 minutes early so we can warm up together. Check the schedule for our court and game time.", pinned: false, date: "2026-11-13" },
];
let previewActive = false;
const previewAccount = { email: "parker@example.com", roles: ["parent", "coach"] };
let view = "public", selectedPlayer = "all", selectedKind = "all", coachPanel = "schedule", sequence = 10;
const coachTeam = "bandits";
function day(date) { return new Date(`${date}T12:00:00`); }
function formatDate(date, options = { weekday: "short", month: "short", day: "numeric" }) { return new Intl.DateTimeFormat("en-US", options).format(day(date)); }
function formatTime(time) { const [h, m] = time.split(":").map(Number); return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`; }
function dateBlock(date) { return `<div class="date-block" aria-label="${escapeHtml(formatDate(date, { month: "long", day: "numeric", year: "numeric" }))}"><span>${formatDate(date, { month: "short" }).toUpperCase()}</span><b>${day(date).getDate()}</b></div>`; }
function sortedEvents(rows) { return [...rows].sort((a, b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`)); }
function sortedNews(rows) { return [...rows].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.date.localeCompare(a.date)); }
function eventTitle(e) { return e.kind === "game" ? `${teams[e.team]} vs. ${e.opponent}` : `${teams[e.team]} practice`; }
function eventLabel(e) { return `<span class="label ${e.kind === "game" ? "red" : "neutral"}">${e.kind === "game" ? "GAME" : "PRACTICE"}</span>${e.cancelled ? '<span class="cancelled-label">CANCELLED</span>' : ""}`; }
function emptyState(title, message) { return `<div class="empty-state"><strong>${escapeHtml(title)}</strong>${escapeHtml(message)}</div>`; }
function showToast(message) { const el = $("#toast"); el.textContent = message; el.classList.add("show"); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => el.classList.remove("show"), 4600); }

function renderPublic() {
  $("#leagueDates").innerHTML = leagueDates.map(d => `<details class="date-item"><summary>${dateBlock(d.date)}<div class="date-copy"><strong>${escapeHtml(d.title)}</strong><small>${formatDate(d.date, { weekday: "long" })} · ${formatTime(d.start)}</small></div><span class="date-chevron" aria-hidden="true">›</span></summary><div class="date-details"><strong>${escapeHtml(d.location)}</strong>${escapeHtml(d.note)}</div></details>`).join("");
  $("#announcementCount").textContent = `${leagueNews.length} updates`;
  $("#leagueAnnouncements").innerHTML = leagueNews.map(n => `<article class="announcement-card ${n.pinned ? "pinned" : ""}"><div class="announcement-meta"><span class="label ${n.pinned ? "red" : "neutral"}">${n.pinned ? "PINNED" : n.category}</span><time datetime="${n.date}">${formatDate(n.date, { month: "short", day: "numeric" })}</time></div><h3>${escapeHtml(n.title)}</h3><p>${escapeHtml(n.body)}</p><div class="announcement-author"><span class="mini-badge">CLD</span>League announcement · Sample</div></article>`).join("");
}
function selectedPlayers() { return players.filter(p => selectedPlayer === "all" || p.id === selectedPlayer); }
function renderParent() {
  $("#playerCards").innerHTML = players.map(p => `<button type="button" class="player-card" data-player="${p.id}" aria-pressed="${selectedPlayer === p.id}" aria-label="Show ${escapeHtml(p.name)} schedule"><span class="avatar ${p.color}" aria-hidden="true">${p.initials}</span><span class="player-info"><strong>${escapeHtml(p.name)}</strong><small>${p.teamName} · ${p.division}</small></span><span aria-hidden="true">${selectedPlayer === p.id ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg>'}</span></button>`).join("");
  $("#allPlayers").textContent = selectedPlayer === "all" ? "Showing all players" : "Show all players";
  $("#allPlayers").setAttribute("aria-pressed", String(selectedPlayer === "all"));
  const linked = selectedPlayers();
  const rows = sortedEvents(events.filter(e => linked.some(p => p.team === e.team) && (selectedKind === "all" || e.kind === selectedKind)));
  $("#familySchedule").innerHTML = rows.map(e => {
    const related = linked.filter(p => p.team === e.team), color = related[0].color;
    return `<article class="event-card ${color} ${e.cancelled ? "cancelled" : ""}"><div class="event-top"><div>${eventLabel(e)}</div><span class="event-player">${related.map(p => escapeHtml(p.name)).join(", ")}</span></div><h3>${escapeHtml(eventTitle(e))}</h3><div class="event-detail">${clockIcon}<span>${formatDate(e.date)} · ${formatTime(e.start)} – ${formatTime(e.end)}</span></div><div class="event-detail">${pinIcon}<span>${escapeHtml(e.location)}</span></div>${e.notes ? `<p class="event-note">${escapeHtml(e.notes)}</p>` : ""}</article>`;
  }).join("") || emptyState("Nothing on the calendar yet", "Try another event filter or select all players.");
  const news = sortedNews(teamNews.filter(n => linked.some(p => p.team === n.team)));
  $("#parentAnnouncements").innerHTML = news.map(n => newsCard(n)).join("") || emptyState("You're all caught up", "Your team's announcements will appear here.");
}
function newsCard(n, editable = false) {
  const color = n.team === "falcons" ? "teal" : "red";
  return `<article class="announcement-card ${n.pinned ? "pinned" : ""}"><div class="announcement-meta"><span class="label ${color}">${escapeHtml(teams[n.team])}${n.pinned ? " · PINNED" : ""}</span><time datetime="${n.date}">${formatDate(n.date, { month: "short", day: "numeric" })}</time></div><h3>${escapeHtml(n.title)}</h3><p class="announcement-body">${escapeHtml(n.body)}</p><div class="announcement-author">From your coach · Team only</div>${editable ? `<div class="row-actions"><button class="small-button" data-edit-news="${n.id}" type="button" aria-label="Edit announcement: ${escapeHtml(n.title)}">Edit announcement</button><button class="small-button muted" data-remove-news="${n.id}" type="button" aria-label="Remove announcement: ${escapeHtml(n.title)}">Remove</button></div>` : ""}</article>`;
}
function renderCoach() {
  const rows = sortedEvents(events.filter(e => e.team === coachTeam));
  $("#scheduleCount").textContent = rows.length;
  $("#newsCount").textContent = teamNews.filter(n => n.team === coachTeam).length;
  $("#coachSchedule").innerHTML = rows.map(e => `<article class="coach-row ${e.cancelled ? "cancelled" : ""}">${dateBlock(e.date)}<div><div>${eventLabel(e)}</div><h3>${escapeHtml(eventTitle(e))}</h3><p>${formatDate(e.date, { weekday: "long" })} · ${formatTime(e.start)} – ${formatTime(e.end)}</p></div><div class="row-location"><p>${escapeHtml(e.location)}</p></div><div class="row-actions"><button class="small-button" type="button" data-edit-event="${e.id}" aria-label="Edit ${escapeHtml(eventTitle(e))} on ${e.date}">Edit</button><button class="small-button muted" type="button" data-toggle-event="${e.id}" aria-label="${e.cancelled ? "Restore" : "Cancel"} ${escapeHtml(eventTitle(e))} on ${e.date}">${e.cancelled ? "Restore" : "Cancel event"}</button></div></article>`).join("") || emptyState("Your schedule starts here", "Add your team's first practice or game.");
  $("#coachAnnouncements").innerHTML = sortedNews(teamNews.filter(n => n.team === coachTeam)).map(n => newsCard(n, true)).join("") || emptyState("A fresh start", "Write an announcement to keep your team's families in the loop.");
}
function showView(next) {
  if (next !== "public" && (!previewActive || !previewAccount.roles.includes(next))) return;
  view = next;
  for (const name of ["public", "parent", "coach"]) $(`#${name}View`).hidden = name !== next;
  $("#publicNav").hidden = next !== "public";
  $("#signIn").hidden = previewActive;
  $("#signOut").hidden = !previewActive;
  $("#accountToolbar").hidden = !previewActive;
  $$("[data-view]").forEach(button => {
    button.hidden = !previewAccount.roles.includes(button.dataset.view);
    button.setAttribute("aria-pressed", String(button.dataset.view === next));
  });
  if (next === "parent") renderParent();
  if (next === "coach") renderCoach();
  history.replaceState(null, "", location.pathname + location.search);
  window.scrollTo({ top: 0, behavior: "instant" });
  (next === "public" ? $("#main") : $(`#${next}Title`)).focus({ preventScroll: true });
}
function selectCoachPanel(panel) {
  coachPanel = panel;
  for (const name of ["schedule", "news"]) { const active = panel === name; const tab = $(`#${name}Tab`); tab.setAttribute("aria-selected", String(active)); tab.tabIndex = active ? 0 : -1; }
  $("#coachSchedulePanel").hidden = panel !== "schedule";
  $("#coachNewsPanel").hidden = panel !== "news";
}
$("#signIn").addEventListener("click", () => {
  $("#previewEmail").value = previewAccount.email;
  $("#loginDialog").showModal();
  $("#loginTitle").focus({ preventScroll: true });
});
$("#enterPreview").addEventListener("click", () => {
  $("#loginDialog").close();
  previewActive = true;
  selectedPlayer = "all";
  selectedKind = "all";
  $$("[data-kind]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.kind === "all")));
  selectCoachPanel("schedule");
  showView(previewAccount.roles.includes("parent") ? "parent" : "coach");
});
$$("[data-view]").forEach(button => button.addEventListener("click", () => showView(button.dataset.view)));
$("#signOut").addEventListener("click", () => { previewActive = false; showView("public"); $("#signIn").focus(); });
$$(".back-to-league").forEach(b => b.addEventListener("click", () => showView("public")));
$("#brandHome").addEventListener("click", e => { e.preventDefault(); showView("public"); });
$$("[data-close]").forEach(b => b.addEventListener("click", () => document.getElementById(b.dataset.close).close()));
$$("dialog").forEach(dialog => dialog.addEventListener("click", e => { const r = dialog.getBoundingClientRect(); if (e.target === dialog && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) dialog.close(); }));
$("#playerCards").addEventListener("click", e => { const b = e.target.closest("[data-player]"); if (!b) return; selectedPlayer = b.dataset.player; renderParent(); $(`[data-player="${selectedPlayer}"]`).focus({ preventScroll: true }); });
$("#allPlayers").addEventListener("click", () => { selectedPlayer = "all"; renderParent(); });
$$("[data-kind]").forEach(b => b.addEventListener("click", () => { selectedKind = b.dataset.kind; $$("[data-kind]").forEach(x => x.setAttribute("aria-pressed", String(x === b))); renderParent(); }));
for (const name of ["schedule", "news"]) $(`#${name}Tab`).addEventListener("click", () => selectCoachPanel(name));
$(".coach-tabs").addEventListener("keydown", e => { if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return; e.preventDefault(); const name = e.key === "Home" ? "schedule" : e.key === "End" ? "news" : coachPanel === "schedule" ? "news" : "schedule"; selectCoachPanel(name); $(`#${name}Tab`).focus(); });

const eventForm = $("#eventForm"), announcementForm = $("#announcementForm");
function syncOpponent() { const game = eventForm.elements.kind.value === "game"; $("#opponentField").hidden = !game; eventForm.elements.opponent.required = game; }
eventForm.elements.kind.addEventListener("change", syncOpponent);
function openEvent(id = "") {
  if (view !== "coach") return;
  eventForm.reset(); $("#eventError").textContent = "";
  const e = events.find(row => row.id === id && row.team === coachTeam);
  if (id && !e) return;
  const fields = e || { id: "", kind: "practice", date: "2026-11-26", start: "18:00", end: "19:00", location: "", opponent: "", notes: "" };
  for (const key of ["id", "kind", "date", "start", "end", "location", "opponent", "notes"]) eventForm.elements[key].value = fields[key];
  $("#eventDialogTitle").textContent = e ? "Edit team event" : "Add an event";
  syncOpponent(); $("#eventDialog").showModal();
}
$("#addEvent").addEventListener("click", () => openEvent());
$("#coachSchedule").addEventListener("click", e => {
  const edit = e.target.closest("[data-edit-event]"), toggle = e.target.closest("[data-toggle-event]");
  if (view !== "coach") return;
  if (edit) openEvent(edit.dataset.editEvent);
  if (toggle) { const row = events.find(x => x.id === toggle.dataset.toggleEvent && x.team === coachTeam); if (!row) return; row.cancelled = !row.cancelled; renderCoach(); $(`[data-toggle-event="${row.id}"]`).focus({ preventScroll: true }); showToast(row.cancelled ? "Sample event cancelled. Parents can see the cancellation in this preview." : "Sample event restored in this preview."); }
});
eventForm.addEventListener("submit", e => {
  e.preventDefault(); if (view !== "coach" || !eventForm.reportValidity()) return;
  const values = Object.fromEntries(new FormData(eventForm));
  const current = values.id ? events.find(row => row.id === values.id && row.team === coachTeam) : null;
  if (values.id && !current) return;
  if (values.end <= values.start) { $("#eventError").textContent = "End time must be after start time on the same day."; eventForm.elements.end.focus(); return; }
  if (!values.location.trim() || (values.kind === "game" && !values.opponent.trim())) { $("#eventError").textContent = "Add a location and, for games, an opponent."; return; }
  const row = { id: current?.id || `sample-event-${++sequence}`, team: coachTeam, kind: values.kind, date: values.date, start: values.start, end: values.end, location: values.location.trim(), opponent: values.kind === "game" ? values.opponent.trim() : "", notes: values.notes.trim(), cancelled: current?.cancelled || false };
  if (current) events = events.map(x => x.id === current.id ? row : x); else events.push(row);
  $("#eventDialog").close(); selectCoachPanel("schedule"); renderCoach(); showToast("Sample event saved. Select My players to see it; no families were notified.");
});
function openAnnouncement(id = "") {
  if (view !== "coach") return;
  announcementForm.reset(); $("#announcementError").textContent = "";
  const n = teamNews.find(row => row.id === id && row.team === coachTeam);
  if (id && !n) return;
  announcementForm.elements.id.value = n?.id || "";
  announcementForm.elements.title.value = n?.title || "";
  announcementForm.elements.body.value = n?.body || "";
  announcementForm.elements.pinned.checked = n?.pinned || false;
  $("#announcementDialogTitle").textContent = n ? "Edit your team announcement." : "A note for your team.";
  $("#announcementDialog").showModal();
}
$("#addAnnouncement").addEventListener("click", () => openAnnouncement());
$("#coachAnnouncements").addEventListener("click", e => {
  if (view !== "coach") return;
  const edit = e.target.closest("[data-edit-news]"), remove = e.target.closest("[data-remove-news]");
  if (edit) openAnnouncement(edit.dataset.editNews);
  if (remove) { teamNews = teamNews.filter(x => !(x.id === remove.dataset.removeNews && x.team === coachTeam)); renderCoach(); $("#addAnnouncement").focus({ preventScroll: true }); showToast("Sample announcement removed from this preview."); }
});
announcementForm.addEventListener("submit", e => {
  e.preventDefault(); if (view !== "coach" || !announcementForm.reportValidity()) return;
  const values = Object.fromEntries(new FormData(announcementForm));
  const current = values.id ? teamNews.find(n => n.id === values.id && n.team === coachTeam) : null;
  if (values.id && !current) return;
  if (!values.title.trim() || !values.body.trim()) { $("#announcementError").textContent = "Enter a title and message before saving."; return; }
  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const row = { id: current?.id || `sample-news-${++sequence}`, team: coachTeam, title: values.title.trim(), body: values.body.trim(), pinned: announcementForm.elements.pinned.checked, date: today };
  if (current) teamNews = teamNews.map(n => n.id === current.id ? row : n); else teamNews.unshift(row);
  $("#announcementDialog").close(); renderCoach(); showToast("Sample announcement saved for Bandits families in this preview. No message was sent.");
});
function setTheme(theme) {
  document.body.dataset.theme = theme;
  const label = `Switch to ${theme === "dark" ? "light" : "dark"} mode`;
  $("#themeToggle").setAttribute("aria-label", label); $("#themeToggle").title = label;
  $('meta[name="theme-color"]').content = theme === "dark" ? "#0c0d10" : "#f4f4f5";
  try { localStorage.setItem("cld-theme", theme); } catch { /* Theme preference is optional; no account data is stored. */ }
}
let theme = "dark";
try { if (localStorage.getItem("cld-theme") === "light") theme = "light"; } catch { /* Use default. */ }
setTheme(theme);
$("#themeToggle").addEventListener("click", () => setTheme(document.body.dataset.theme === "dark" ? "light" : "dark"));
renderPublic();
