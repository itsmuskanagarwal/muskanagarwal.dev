/* PRP-01 — Ask My Portfolio Anything. Lazy-inits on first interaction with
 * the launcher button. Talks to same-origin POST /api/ask. Renders answers
 * as textContent only (never innerHTML) — see 00-MASTER-ROADMAP.md §4.
 */
(function () {
  "use strict";

  const SUGGESTIONS = [
    "Has she worked with NgRx at scale?",
    "What has she built with RAG?",
    "What's her current role?",
  ];

  const el = (h) => { const t = document.createElement("template"); t.innerHTML = h.trim(); return t.content.firstChild; };
  const esc = (s) => s.replace(/[&<>"]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));

  function mountLauncher() {
    const launcher = el(`
      <button type="button" class="ask-launcher" data-feature="prp-01" aria-haspopup="dialog" aria-expanded="false" aria-label="Ask my portfolio anything">
        Ask my portfolio <span class="ask-launcher-star">&#10022;</span>
      </button>`);
    document.body.appendChild(launcher);
    let panel = null;
    launcher.addEventListener("click", () => {
      if (!panel) panel = buildPanel(launcher);
      openPanel(panel, launcher);
    });
  }

  function buildPanel(launcher) {
    const panel = el(`
      <div class="ask-panel" data-feature="prp-01" role="dialog" aria-label="Ask about Muskan" aria-hidden="true">
        <div class="ask-panel-head">
          <span>Ask anything about Muskan — answers cite real pages.</span>
          <button type="button" class="ask-close" aria-label="Close">&times;</button>
        </div>
        <div class="ask-chips"></div>
        <div class="ask-log" role="log" aria-live="polite"></div>
        <form class="ask-form">
          <input type="text" class="ask-input" maxlength="500" placeholder="e.g. Has she worked with NgRx at scale?" autocomplete="off">
          <button type="submit" class="ask-send">Ask</button>
        </form>
      </div>`);
    document.body.appendChild(panel);

    const log = panel.querySelector(".ask-log");
    const chips = panel.querySelector(".ask-chips");
    const form = panel.querySelector(".ask-form");
    const input = panel.querySelector(".ask-input");
    const closeBtn = panel.querySelector(".ask-close");

    SUGGESTIONS.forEach(s => {
      const chip = el(`<button type="button" class="ask-chip">${esc(s)}</button>`);
      chip.addEventListener("click", () => ask(s, log));
      chips.appendChild(chip);
    });

    addMessage(log, "bot", "Hi — I'm a retrieval pipeline over Muskan's portfolio. Ask me anything a recruiter or collaborator would want to know. I only answer from the corpus, with citations.");

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = input.value.trim();
      if (!q) return;
      input.value = "";
      ask(q, log);
    });

    closeBtn.addEventListener("click", () => closePanel(panel, launcher));
    panel.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closePanel(panel, launcher);
      if (e.key === "Tab") trapFocus(e, panel);
    });

    return panel;
  }

  function trapFocus(e, panel) {
    const focusables = panel.querySelectorAll('button, input, [href], [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  let lastFocused = null;
  function openPanel(panel, launcher) {
    lastFocused = document.activeElement;
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    launcher.setAttribute("aria-expanded", "true");
    const input = panel.querySelector(".ask-input");
    setTimeout(() => input && input.focus(), 50);
  }
  function closePanel(panel, launcher) {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    launcher.setAttribute("aria-expanded", "false");
    (lastFocused || launcher).focus();
  }

  function addMessage(log, cls, text) {
    const d = el(`<div class="ask-msg ${cls}"></div>`);
    d.textContent = text;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }

  async function ask(question, log) {
    addMessage(log, "user", question);
    const trace = el(`<div class="ask-trace">retrieving &rarr; reading &rarr; writing&hellip;</div>`);
    log.appendChild(trace);
    log.scrollTop = log.scrollHeight;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      trace.remove();

      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        renderDegraded(log, `The agent is resting (rate limit${data.retryAfterSec ? `, back in ~${Math.ceil(data.retryAfterSec / 60)}m` : ""}).`);
        return;
      }
      if (!res.ok) {
        renderDegraded(log, "The agent is unavailable right now.");
        return;
      }
      const data = await res.json();
      const bot = addMessage(log, "bot", data.answer || "");
      if (data.confidence === "low") bot.classList.add("low-confidence");
      if (Array.isArray(data.sources) && data.sources.length) {
        const citesWrap = el(`<div class="ask-cites"></div>`);
        data.sources.forEach(s => {
          const a = el(`<a class="ask-cite"></a>`);
          a.textContent = `§ ${s.title}`;
          a.href = s.url;
          citesWrap.appendChild(a);
        });
        bot.after(citesWrap);
      }
    } catch (err) {
      clearTimeout(timeout);
      trace.remove();
      renderDegraded(log, "The agent is unavailable right now (network or timeout).");
    }
    log.scrollTop = log.scrollHeight;
  }

  function renderDegraded(log, message) {
    const d = el(`<div class="ask-msg bot degraded"></div>`);
    d.textContent = message + " Meanwhile: ";
    const links = el(`<span></span>`);
    [["Portfolio", "/portfolio/"], ["GitHub", "https://github.com/itsmuskanagarwal"], ["Email", "mailto:hello@muskanagarwal.dev"]]
      .forEach(([label, href], i) => {
        if (i > 0) links.appendChild(document.createTextNode(" · "));
        const a = document.createElement("a");
        a.href = href; a.textContent = label;
        links.appendChild(a);
      });
    d.appendChild(links);
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountLauncher);
  } else {
    mountLauncher();
  }
})();
