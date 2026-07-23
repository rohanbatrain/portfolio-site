/* =========================================================
   Behaviour: theme, mobile nav, scroll-reveal, media rendering
   No external dependencies. Progressive & accessible.
   ========================================================= */
(function () {
  "use strict";

  /* ---- Year ---- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---- Theme toggle (persisted, respects system default) ---- */
  var root = document.documentElement;
  var toggle = document.getElementById("themeToggle");
  var stored = null;
  try { stored = localStorage.getItem("theme"); } catch (e) {}
  if (stored) {
    root.setAttribute("data-theme", stored);
  } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
    root.setAttribute("data-theme", "light");
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }

  /* ---- Mobile nav ---- */
  var burger = document.getElementById("burger");
  var links = document.querySelector(".nav__links");
  if (burger && links) {
    burger.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", String(open));
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---- Scroll reveal ---- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---- Media rendering (from window.MEDIA_ITEMS) ---- */
  var grid = document.getElementById("mediaGrid");
  var items = window.MEDIA_ITEMS || [];
  if (grid) {
    if (!items.length) {
      grid.innerHTML = "";
      return;
    }
    var frag = document.createDocumentFragment();

    items.forEach(function (item) {
      var card = document.createElement("article");
      card.className = "media-card reveal is-visible";

      var frame = document.createElement("div");
      frame.className = "media-card__frame";

      if (item.driveId) {
        if (item.type === "image") {
          var img = document.createElement("img");
          img.loading = "lazy";
          img.alt = item.title || "Photo";
          img.src = "https://drive.google.com/thumbnail?id=" + encodeURIComponent(item.driveId) + "&sz=w1200";
          frame.appendChild(img);
        } else {
          var iframe = document.createElement("iframe");
          iframe.loading = "lazy";
          iframe.allow = "autoplay; fullscreen";
          iframe.allowFullscreen = true;
          iframe.title = item.title || "Video";
          iframe.src = "https://drive.google.com/file/d/" + encodeURIComponent(item.driveId) + "/preview";
          frame.appendChild(iframe);
        }
      } else {
        // Placeholder — keeps the layout complete before media is added.
        var ph = document.createElement("div");
        ph.className = "media-card__ph";
        var play = document.createElement("div");
        play.className = "play";
        play.textContent = item.type === "image" ? "🖼" : "▶";
        var soon = document.createElement("span");
        soon.className = "soon";
        soon.textContent = "Coming soon";
        ph.appendChild(play);
        ph.appendChild(soon);
        frame.appendChild(ph);
      }

      var body = document.createElement("div");
      body.className = "media-card__body";
      if (item.label) {
        var t = document.createElement("span");
        t.className = "media-card__type";
        t.textContent = item.label;
        body.appendChild(t);
      }
      var h = document.createElement("h3");
      h.textContent = item.title || "";
      var p = document.createElement("p");
      p.textContent = item.caption || "";
      body.appendChild(h);
      body.appendChild(p);

      card.appendChild(frame);
      card.appendChild(body);
      frag.appendChild(card);
    });

    grid.appendChild(frag);
  }
})();
