/* =========================================================
   HPE gallery — renders from window.GALLERY, filters by day
   tabs, "view more" paging, an in-page lightbox (image or
   Drive-embedded video) with keyboard + focus management, and
   a preloader fade-out.

   No dependencies. Coexists with main.js (which owns theme,
   nav, scroll-reveal and the separate #mediaGrid): different
   globals, different DOM — nothing shared, nothing touched.
   ========================================================= */
(function () {
  "use strict";

  /* ---------- tiny helpers ---------- */
  function byId(id) { return document.getElementById(id); }

  function driveThumb(id, size) {
    return "https://drive.google.com/thumbnail?id=" +
      encodeURIComponent(id) + "&sz=" + size;
  }
  function drivePreview(id) {
    return "https://drive.google.com/file/d/" +
      encodeURIComponent(id) + "/preview";
  }

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  var prefersReducedMotion = !!(window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* =========================================================
     PRELOADER
     Fade once the page is ready. Enforce a minimum visible
     time (~600ms) so it never flashes, plus a safety timeout
     (~4s) so a slow asset can never trap the visitor. Reduced
     motion: skip the choreography and clear it promptly.
     ========================================================= */
  function initPreloader() {
    var pre = byId("preloader");
    if (!pre) return;

    var MIN_VISIBLE = 600;   // don't flash the intro
    var FADE_MS     = 700;   // let the CSS fade play out before display:none
    var SAFETY_MS   = 4000;  // never let a slow image trap the user
    var start = Date.now();
    var finished = false;

    function hideNow() { pre.style.display = "none"; }

    function finish() {
      if (finished) return;
      finished = true;
      pre.classList.add("preloader--done");   // CSS fades it out
      window.setTimeout(hideNow, FADE_MS);
    }

    // Reduced motion: no staged reveal — just take it down promptly.
    if (prefersReducedMotion) {
      pre.classList.add("preloader--done");
      hideNow();
      return;
    }

    function fadeAfterMinTime() {
      var waited = Date.now() - start;
      window.setTimeout(finish, Math.max(0, MIN_VISIBLE - waited));
    }

    if (document.readyState === "complete") {
      fadeAfterMinTime();
    } else {
      window.addEventListener("load", fadeAfterMinTime, { once: true });
    }
    window.setTimeout(finish, SAFETY_MS);  // safety net, whatever load does
  }

  /* =========================================================
     GALLERY + LIGHTBOX
     ========================================================= */
  function initGallery() {
    var cfg = window.GALLERY || {};
    var grid = byId("galleryGrid");
    var photos = (cfg && Array.isArray(cfg.photos)) ? cfg.photos : [];
    if (!grid || !photos.length) return;

    var perPage = (typeof cfg.perPage === "number" && cfg.perPage > 0)
      ? cfg.perPage : 8;
    var dayLabels = cfg.dayLabels || {};

    /* ---------- build the grid (one fragment, one reflow) ---------- */
    var items = [];              // { el, day, id, type, full, caption, alt }
    var perDayCount = {};
    var frag = document.createDocumentFragment();

    photos.forEach(function (photo) {
      if (!photo || !photo.id) return;               // skip malformed entries
      var id   = String(photo.id);
      var day  = photo.day ? String(photo.day) : "";
      var type = photo.type === "video" ? "video" : "image";  // default image
      var caption = dayLabels[day] || "";

      perDayCount[day] = (perDayCount[day] || 0) + 1;
      var alt = (caption ? caption + " — " : "") + "photo " + perDayCount[day];

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "gallery__item";
      btn.setAttribute("data-day", day);
      btn.setAttribute("data-id", id);

      var img = document.createElement("img");
      img.loading = "lazy";
      img.decoding = "async";
      img.alt = alt;
      img.src = driveThumb(id, "w1200");
      btn.appendChild(img);

      var index = items.length;                      // stable index for this button
      btn.addEventListener("click", function () { openLightbox(index); });

      items.push({
        el: btn, day: day, id: id, type: type,
        full: driveThumb(id, "w2000"), caption: caption, alt: alt
      });
      frag.appendChild(btn);
    });

    grid.appendChild(frag);

    /* ---------- filter + paging ---------- */
    var tabs = Array.prototype.slice.call(document.querySelectorAll(".gallery-tab"));
    var moreBtn = byId("galleryMore");
    var moreCount = byId("galleryMoreCount");

    var activeTab = document.querySelector(".gallery-tab.is-active");
    var activeFilter = activeTab
      ? (activeTab.getAttribute("data-filter") || "all") : "all";
    var shown = perPage;

    function inFilter(it) {
      return activeFilter === "all" || it.day === activeFilter;
    }

    // Ordered list of items in the active filter.
    function currentFilterItems() {
      var list = [];
      items.forEach(function (it) { if (inFilter(it)) list.push(it); });
      return list;
    }

    // The item at a given position within the active filter (or null).
    function itemAtFilterPos(pos) {
      var p = 0;
      for (var i = 0; i < items.length; i++) {
        if (inFilter(items[i])) {
          if (p === pos) return items[i];
          p++;
        }
      }
      return null;
    }

    // Show the first `shown` of the active filter; hide the remainder and
    // everything outside the filter — all through the .is-hidden class.
    function apply() {
      var pos = 0;
      items.forEach(function (it) {
        if (inFilter(it)) {
          it.el.classList.toggle("is-hidden", pos >= shown);
          pos++;
        } else {
          it.el.classList.add("is-hidden");
        }
      });
      var total = pos;
      var remaining = total - Math.min(shown, total);
      if (moreBtn) {
        moreBtn.hidden = remaining <= 0;
        if (moreCount) {
          moreCount.textContent = remaining > 0 ? "(" + remaining + " more)" : "";
        }
      }
    }

    function setFilter(filter) {
      activeFilter = filter || "all";
      shown = perPage;                       // paging resets on every tab change
      tabs.forEach(function (t) {
        var on = (t.getAttribute("data-filter") || "all") === activeFilter;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      apply();
    }

    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        setFilter(t.getAttribute("data-filter") || "all");
      });
    });

    if (moreBtn) {
      moreBtn.addEventListener("click", function () {
        var firstRevealed = shown;           // filter-position of the next batch's head
        shown += perPage;
        apply();
        // If the button just vanished, don't strand keyboard focus on it.
        if (moreBtn.hidden) {
          var next = itemAtFilterPos(firstRevealed);
          if (next && next.el && next.el.focus) next.el.focus();
        }
      });
    }

    /* ---------- lightbox ---------- */
    var lightbox  = byId("lightbox");
    var lbMedia   = byId("lbMedia");
    var lbCaption = byId("lbCaption");
    var lbCount   = byId("lbCount");
    var lbClose   = byId("lbClose");
    var lbPrev    = byId("lbPrev");
    var lbNext    = byId("lbNext");
    var lbStage   = lightbox ? lightbox.querySelector(".lightbox__stage") : null;

    var lbList = [];        // items of the active filter (ordered), captured on open
    var lbIndex = 0;
    var lbOpen = false;
    var lastFocus = null;

    function indexOfItem(list, it) {
      for (var i = 0; i < list.length; i++) { if (list[i] === it) return i; }
      return -1;
    }

    function clearMedia() {
      if (!lbMedia) return;
      lbMedia.classList.remove("is-zoomed");
      while (lbMedia.firstChild) lbMedia.removeChild(lbMedia.firstChild);
    }

    function renderLightbox() {
      var it = lbList[lbIndex];
      if (!it || !lbMedia) return;
      clearMedia();

      if (it.type === "video") {
        var iframe = document.createElement("iframe");
        iframe.src = drivePreview(it.id);
        iframe.setAttribute("allow", "autoplay; fullscreen");
        iframe.setAttribute("allowfullscreen", "");
        iframe.setAttribute("frameborder", "0");
        iframe.title = it.caption || "Video";
        lbMedia.appendChild(iframe);
      } else {
        var img = document.createElement("img");
        img.src = it.full;                    // full-res sz=w2000
        img.alt = it.alt || it.caption || "Photo";
        img.decoding = "async";
        img.addEventListener("click", function (e) {
          e.stopPropagation();                // don't reach the backdrop-close
          lbMedia.classList.toggle("is-zoomed");
        });
        lbMedia.appendChild(img);
      }

      if (lbCaption) lbCaption.textContent = it.caption || "";
      if (lbCount) lbCount.textContent = (lbIndex + 1) + " / " + lbList.length;
      preloadNeighbours();
    }

    // Prefetch the adjacent images so prev/next feel instant.
    function preloadNeighbours() {
      if (lbList.length < 2) return;
      [lbList[(lbIndex + 1) % lbList.length],
       lbList[(lbIndex - 1 + lbList.length) % lbList.length]]
        .forEach(function (it) {
          if (it && it.type !== "video") { var im = new Image(); im.src = it.full; }
        });
    }

    function openLightbox(globalIndex) {
      if (!lightbox) return;
      var it = items[globalIndex];
      if (!it) return;

      lbList = currentFilterItems();          // navigate the whole active filter
      lbIndex = indexOfItem(lbList, it);
      if (lbIndex < 0) lbIndex = 0;

      if (!lbOpen) lastFocus = document.activeElement;
      lbOpen = true;
      renderLightbox();
      lightbox.setAttribute("aria-hidden", "false");
      lightbox.classList.add("is-open");
      document.body.style.overflow = "hidden";        // lock background scroll
      if (lbClose && lbClose.focus) lbClose.focus();   // move focus into the dialog
      document.addEventListener("keydown", onKeydown);
    }

    function closeLightbox() {
      if (!lightbox || !lbOpen) return;
      lbOpen = false;
      lightbox.setAttribute("aria-hidden", "true");
      lightbox.classList.remove("is-open");
      document.body.style.overflow = "";              // restore scroll
      document.removeEventListener("keydown", onKeydown);
      clearMedia();                                   // also stops any playing video
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function step(delta) {
      if (!lbList.length) return;
      lbIndex = (lbIndex + delta + lbList.length) % lbList.length;  // wrap around
      renderLightbox();
    }

    // Keep Tab within the dialog (aria-modal); prev/next/close are the stops.
    function focusablesInLightbox() {
      var out = [];
      [lbClose, lbPrev, lbNext].forEach(function (el) {
        if (el && !el.hidden) out.push(el);
      });
      return out;
    }

    function trapTab(e) {
      var f = focusablesInLightbox();
      if (!f.length) { e.preventDefault(); return; }
      var first = f[0], last = f[f.length - 1];
      var active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || !lightbox.contains(active)) {
          e.preventDefault(); last.focus();
        }
      } else {
        if (active === last || !lightbox.contains(active)) {
          e.preventDefault(); first.focus();
        }
      }
    }

    function onKeydown(e) {
      if (!lbOpen) return;
      var k = e.key;
      if (k === "Escape" || k === "Esc") { e.preventDefault(); closeLightbox(); }
      else if (k === "ArrowLeft" || k === "Left") { e.preventDefault(); step(-1); }
      else if (k === "ArrowRight" || k === "Right") { e.preventDefault(); step(1); }
      else if (k === "Tab") { trapTab(e); }
    }

    if (lbClose) lbClose.addEventListener("click", closeLightbox);
    if (lbPrev) lbPrev.addEventListener("click", function () { step(-1); });
    if (lbNext) lbNext.addEventListener("click", function () { step(1); });
    if (lightbox) {
      lightbox.addEventListener("click", function (e) {
        // Backdrop only: the overlay itself or the empty stage area — never the
        // media, caption, or controls (those are deeper targets / stopPropagation).
        if (e.target === lightbox || (lbStage && e.target === lbStage)) {
          closeLightbox();
        }
      });
    }

    /* ---------- first paint ---------- */
    apply();
  }

  /* ---------- boot ---------- */
  ready(function () {
    initPreloader();
    initGallery();
  });
})();
