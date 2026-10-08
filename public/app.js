const views = [...document.querySelectorAll("[data-view]")];
const viewLinks = [...document.querySelectorAll("[data-view-link]")];
const dialog = document.querySelector("#parentLoginDialog");
const loginStatus = document.querySelector("#loginStatus");
const themeToggle = document.querySelector("#themeToggle");

function showView(name) {
  const target = views.find((view) => view.dataset.view === name) || views[0];
  views.forEach((view) => {
    const active = view === target;
    view.classList.toggle("active", active);
    view.hidden = !active;
  });
  viewLinks.forEach((link) => {
    const active = link.dataset.viewLink === target.dataset.view;
    link.classList.toggle("active", active);
    if (link.matches(".nav-link")) {
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
  });
  document.querySelector("#mobileNav").hidden = true;
  document.querySelector(".menu-toggle").setAttribute("aria-expanded", "false");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

viewLinks.forEach((link) => {
  link.addEventListener("click", () => {
    if (link.classList.contains("parent-login-trigger")) return;
    showView(link.dataset.viewLink);
  });
});

document.querySelectorAll(".parent-login-trigger").forEach((button) => {
  button.addEventListener("click", openLogin);
});

function openLogin() {
  if (!dialog.open) dialog.showModal();
  setTimeout(() => document.querySelector("#parentKey").focus(), 25);
}

document.querySelector("#loginClose").addEventListener("click", () => dialog.close());
document.querySelector("#browsePublic").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});
document.querySelector("#loginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const key = document.querySelector("#parentKey").value.trim();
  const match = key.match(/^(.+?)(\d{8})$/);
  if (!match) {
    loginStatus.textContent = "Enter the player’s last name followed by the date of birth as MMDDYYYY.";
    loginStatus.classList.add("error");
    return;
  }
  loginStatus.textContent = "Secure parent sign-in is not connected yet. Your information was not submitted. Please continue to public information.";
  loginStatus.classList.remove("error");
});

document.querySelector(".menu-toggle").addEventListener("click", (event) => {
  const nav = document.querySelector("#mobileNav");
  nav.hidden = !nav.hidden;
  event.currentTarget.setAttribute("aria-expanded", String(!nav.hidden));
});

function setTheme(theme) {
  document.body.dataset.theme = theme;
  const light = theme === "light";
  themeToggle.setAttribute("aria-pressed", String(light));
  document.querySelector("#themeLabel").textContent = light ? "Light mode" : "Dark mode";
  document.querySelector(".theme-icon").textContent = light ? "☀" : "☾";
  document.querySelector('meta[name="theme-color"]').content = light ? "#f6f7f8" : "#080a0c";
  try { localStorage.setItem("cld-theme", theme); } catch { /* Storage is optional. */ }
}

let preferredTheme = "dark";
try { preferredTheme = localStorage.getItem("cld-theme") || "dark"; } catch { /* Storage is optional. */ }
setTheme(preferredTheme === "light" ? "light" : "dark");
themeToggle.addEventListener("click", () => setTheme(document.body.dataset.theme === "dark" ? "light" : "dark"));

const exportButton = document.querySelector("#exportButton");
document.querySelectorAll(".schedule-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".schedule-tab").forEach((item) => {
      const active = item === tab;
      item.classList.toggle("active", active);
      item.setAttribute("aria-selected", String(active));
    });
  });
});
exportButton.addEventListener("click", () => showToast("Schedule data will be available after the Quickbase connection is set up."));

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

// The draft intentionally loads no real player or schedule data. Once the Worker
// is configured, replace the empty states with the API's approved public payload.
window.addEventListener("DOMContentLoaded", () => {
  window.setTimeout(openLogin, 300);
});
