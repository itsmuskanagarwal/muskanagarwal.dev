/* /plans/ — data-driven roadmap: renders cards from roadmap.json, computes
   staleness states, and drives the "rewind" time-machine slider.
   No build step on this site, so this is a small inline-fetched script,
   not a compiled asset. Keep it dependency-free. */
(function () {
  "use strict";

  var queueEl = document.getElementById("plans-queue");
  var sliderWrap = document.querySelector(".rewind");
  var sliderInput = sliderWrap ? sliderWrap.querySelector("input[type=range]") : null;
  var sliderBanner = sliderWrap ? sliderWrap.querySelector(".rewind-banner") : null;
  var mainEl = document.querySelector("main.section");
  var prefersReducedMotion = false;
  try {
    prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) { /* matchMedia unsupported — treat as no preference */ }

  var liveData = null; // current roadmap.json contents
  var snapshots = [];  // [{file, label, items}]
  var msPerDay = 1000 * 60 * 60 * 24;

  function daysStalled(lastActivity) {
    var last = new Date(lastActivity).getTime();
    var now = Date.now();
    return Math.max(0, Math.floor((now - last) / msPerDay));
  }

  function staleClass(days, status) {
    if (status === "shipped") return "shipped";
    if (days > 30) return "stale-high";
    if (days >= 14) return "stale-mid";
    return "";
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function cardHTML(item) {
    var days = daysStalled(item.lastActivity);
    var cls = staleClass(days, item.status);
    var extraClass = cls ? " " + cls : "";
    var badge = "";
    var askBtn = "";

    if (cls === "stale-high") {
      badge = '<span class="stale-badge">stalled ' + days + " day" + (days === 1 ? "" : "s") + '</span>';
      var subject = encodeURIComponent("What happened to: " + item.title + "?");
      askBtn =
        '<a class="ask-btn" href="mailto:agarwal.muskan4444@gmail.com?subject=' +
        subject +
        '">Ask me about it &rarr;</a>';
    } else if (cls === "stale-mid") {
      badge = '<span class="stale-badge stale-badge-mid">dust · ' + days + " day" + (days === 1 ? "" : "s") + '</span>';
    }

    // note is already trusted, verbatim from roadmap.json (site copy), so it's allowed one inline <a>
    return (
      '<div class="q-item' +
      extraClass +
      '" data-id="' +
      escapeHtml(item.id) +
      '">' +
      '<div class="ph">' +
      escapeHtml(item.phaseLabel) +
      "</div>" +
      '<div class="card-dark">' +
      '<div class="q-head"><div class="when' +
      (item.status === "shipped" ? " shipped" : "") +
      '">' +
      escapeHtml(item.whenLabel) +
      "</div>" +
      badge +
      "</div>" +
      "<h3>" +
      escapeHtml(item.title) +
      "</h3>" +
      "<p>" +
      item.description +
      "</p>" +
      '<div class="q-foot">' +
      '<span class="freshness">last activity: ' +
      days +
      " day" +
      (days === 1 ? "" : "s") +
      " ago</span>" +
      askBtn +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }

  function render(items) {
    if (!queueEl) return;
    var sorted = items.slice().sort(function (a, b) { return a.order - b.order; });
    queueEl.innerHTML = sorted.map(cardHTML).join("");
  }

  function setViewingBanner(monthLabel, shippedSinceCount) {
    if (!sliderBanner) return;
    if (!monthLabel) {
      sliderBanner.hidden = true;
      sliderBanner.textContent = "";
      if (mainEl) mainEl.classList.remove("rewind-active");
      return;
    }
    sliderBanner.hidden = false;
    sliderBanner.textContent =
      "Viewing " + monthLabel + " — " + shippedSinceCount + " item" +
      (shippedSinceCount === 1 ? "" : "s") + " have shipped since then.";
    if (mainEl) {
      if (prefersReducedMotion) mainEl.classList.add("rewind-active-instant");
      mainEl.classList.add("rewind-active");
    }
  }

  function monthLabelFromFile(file) {
    // "2026-07.json" -> "July 2026"
    var m = file.replace(".json", "").split("-");
    var d = new Date(Date.UTC(Number(m[0]), Number(m[1]) - 1, 1));
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  }

  function shippedSince(oldItems, newItems) {
    var oldShipped = {};
    oldItems.forEach(function (i) { if (i.status === "shipped") oldShipped[i.id] = true; });
    var count = 0;
    newItems.forEach(function (i) { if (i.status === "shipped" && !oldShipped[i.id]) count++; });
    return count;
  }

  function initSlider() {
    if (!sliderWrap || !sliderInput || snapshots.length === 0) {
      if (sliderWrap) sliderWrap.hidden = true;
      return;
    }
    // Slider range: 0..snapshots.length maps to [oldest snapshot ... live]
    sliderInput.min = "0";
    sliderInput.max = String(snapshots.length);
    sliderInput.value = String(snapshots.length); // start at "live" (right edge)
    sliderInput.setAttribute("aria-valuemin", "0");
    sliderInput.setAttribute("aria-valuemax", String(snapshots.length));

    var ticksWrap = sliderWrap.querySelector(".rewind-ticks");
    if (ticksWrap) {
      ticksWrap.innerHTML = snapshots
        .map(function (s) { return '<span>' + escapeHtml(monthLabelFromFile(s.file)) + "</span>"; })
        .join("") + "<span>Live</span>";
    }

    sliderInput.addEventListener("input", function () {
      var idx = Number(sliderInput.value);
      if (idx >= snapshots.length) {
        render(liveData);
        setViewingBanner(null, 0);
        return;
      }
      var snap = snapshots[idx];
      render(snap.items);
      setViewingBanner(monthLabelFromFile(snap.file), shippedSince(snap.items, liveData));
    });
  }

  function fetchJSON(url) {
    return fetch(url, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error(url + " -> " + r.status);
      return r.json();
    });
  }

  fetchJSON("/plans/roadmap.json")
    .then(function (data) {
      liveData = data;
      render(liveData);
      return fetchJSON("/plans/snapshots/index.json").catch(function () { return []; });
    })
    .then(function (files) {
      if (!files || files.length === 0) return;
      return Promise.all(
        files.map(function (f) {
          return fetchJSON("/plans/snapshots/" + f).then(function (items) {
            return { file: f, items: items };
          });
        })
      ).then(function (snaps) {
        snapshots = snaps;
        initSlider();
      });
    })
    .catch(function (err) {
      console.error("plans.js: failed to load roadmap data", err);
      if (queueEl) {
        queueEl.innerHTML = '<p style="color:#C9C4BA">Roadmap data failed to load. <a href="/plans/roadmap.json" style="color:var(--gold)">View raw JSON</a>.</p>';
      }
    });
})();
