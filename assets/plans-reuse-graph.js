/* "60% reuse graph" — static SVG version (the Three.js version was dropped:
   see assets/plans-graph.bundle.js for why). Plain JS, no dependency,
   ~1.5KB. Highlights a component across all five system columns on
   hover/focus and shows its caption. Fully keyboard accessible
   (SVG rects are tabbable, role=button). */
(function () {
  "use strict";
  var svg = document.querySelector(".reuse-svg");
  if (!svg) return;
  var caption = document.querySelector(".reuse-caption-live");
  var squares = svg.querySelectorAll(".reuse-sq");
  var lines = svg.querySelectorAll(".reuse-line");

  function setActive(ci) {
    squares.forEach(function (sq) {
      sq.classList.toggle("hl", ci !== null && sq.getAttribute("data-ci") === ci);
    });
    lines.forEach(function (l) {
      l.classList.toggle("hl", ci !== null && l.getAttribute("data-ci") === ci);
    });
    if (ci === null || !caption) {
      if (caption) { caption.textContent = ""; caption.hidden = true; }
      return;
    }
    var sample = svg.querySelector('.reuse-sq[data-ci="' + ci + '"]');
    if (!sample) return;
    var name = sample.getAttribute("data-component");
    var reused = sample.getAttribute("data-reused") === "true";
    caption.hidden = false;
    caption.textContent = name + " — " + (reused ? "shared across 5 systems" : "unique to this system");
  }

  squares.forEach(function (sq) {
    var ci = sq.getAttribute("data-ci");
    sq.addEventListener("mouseenter", function () { setActive(ci); });
    sq.addEventListener("focus", function () { setActive(ci); });
    sq.addEventListener("mouseleave", function () { setActive(null); });
    sq.addEventListener("blur", function () { setActive(null); });
  });
})();
