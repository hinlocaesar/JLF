/* ============================================================================
   Jesus' Little Friends Learning Center, Inc.  —  site behaviour
   Vanilla JS, no build step. Depends on: AOS + canvas-confetti (CDN).
   ========================================================================== */
(function () {
  "use strict";

  var FB_URL = "https://www.facebook.com/Jesus-Little-Friends-Learning-Center-Inc-100063909131137/";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ------------------------------------------------------------------ AOS -- */
  function initAOS() {
    if (typeof window.AOS === "undefined") {
      // AOS failed to load (blocked CDN, offline). Its stylesheet parks every
      // [data-aos] element at opacity:0 with a translate offset, which would
      // leave the page blank. Strip the attributes so the content is visible.
      $$("[data-aos]").forEach(function (el) {
        el.removeAttribute("data-aos");
        el.removeAttribute("data-aos-delay");
      });
      return;
    }

    window.AOS.init({
      duration: 700,
      easing: "ease-out-cubic",
      once: true,
      offset: 60,
      disable: reduceMotion ? true : false
    });
  }

  /* -------------------------------------------------------- scroll progress */
  function initProgress() {
    var bar = $("#progress");
    if (!bar) return;
    var ticking = false;

    function update() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      var pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
      bar.style.width = Math.min(100, Math.max(0, pct)).toFixed(2) + "%";
      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
  }

  /* ---------------------------------------------------------- sticky navbar */
  function initNavbar() {
    var nav = $("#nav");
    var bar = $("#navbar");
    if (!nav || !bar) return;
    var lastY = 0;

    function update() {
      var y = window.scrollY;
      bar.classList.toggle("nav-solid", y > 24);
      // hide on scroll-down past the fold, reveal on scroll-up
      if (y > 420 && y > lastY && !menuOpen) {
        nav.style.transform = "translateY(-130%)";
      } else {
        nav.style.transform = "translateY(0)";
      }
      nav.style.transition = "transform .35s cubic-bezier(.34,1.56,.64,1)";
      lastY = y;
    }

    window.addEventListener("scroll", function () { window.requestAnimationFrame(update); }, { passive: true });
    update();
  }

  /* ------------------------------------------------------------- mobile menu */
  var menuOpen = false;
  function initMenu() {
    var btn = $("#menuBtn");
    var menu = $("#mobileMenu");
    if (!btn || !menu) return;

    function setOpen(open) {
      menuOpen = open;
      btn.setAttribute("aria-expanded", String(open));
      btn.innerHTML = open ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';

      if (open) {
        menu.classList.remove("hidden");
        // force a frame so the transition actually plays
        window.requestAnimationFrame(function () {
          menu.classList.remove("opacity-0", "scale-95");
        });
      } else {
        menu.classList.add("opacity-0", "scale-95");
        window.setTimeout(function () {
          if (!menuOpen) menu.classList.add("hidden");
        }, 260);
      }
    }

    btn.addEventListener("click", function () { setOpen(!menuOpen); });

    $$("#mobileMenu a").forEach(function (link) {
      link.addEventListener("click", function () { setOpen(false); });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menuOpen) setOpen(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1024 && menuOpen) setOpen(false);
    });
  }

  /* ------------------------------------------------------ active nav section */
  function initScrollSpy() {
    var links = $$('.nav-link');
    if (!links.length || typeof window.IntersectionObserver === "undefined") return;

    var byId = {};
    var sections = [];
    links.forEach(function (link) {
      var id = (link.getAttribute("href") || "").replace("#", "");
      var el = id && document.getElementById(id);
      if (!el) return;
      byId[id] = link;
      sections.push(el);
    });

    var visible = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        visible[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0;
      });
      var bestId = null, best = 0;
      Object.keys(visible).forEach(function (id) {
        if (visible[id] > best) { best = visible[id]; bestId = id; }
      });
      links.forEach(function (l) { l.classList.remove("is-active"); });
      if (bestId && byId[bestId]) byId[bestId].classList.add("is-active");
    }, { threshold: [0.15, 0.35, 0.6], rootMargin: "-25% 0px -45% 0px" });

    sections.forEach(function (s) { io.observe(s); });
  }

  /* ------------------------------------------------------------- back to top */
  function initToTop() {
    var btn = $("#toTop");
    var fab = $("#fbFab");
    if (!btn) return;
    var ticking = false;

    function update() {
      var y = window.scrollY;
      var show = y > 620;
      btn.classList.toggle("opacity-0", !show);
      btn.classList.toggle("translate-y-4", !show);
      btn.style.pointerEvents = show ? "auto" : "none";

      // The Facebook FAB only appears past the hero so it never covers the hero CTAs.
      if (fab) {
        var showFab = y > 520;
        fab.classList.toggle("opacity-0", !showFab);
        fab.classList.toggle("translate-y-4", !showFab);
        fab.style.pointerEvents = showFab ? "auto" : "none";
      }
      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });

    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
    update();
  }

  /* ------------------------------------------------------------- photos --- */
  // Each <img> carries width/height so the grid never shifts, but that reserved
  // box is blank until the file arrives. Reveal each photo on decode, and drop
  // in a neutral panel if a file is ever missing.
  //
  // A photo only counts as "revealed" once it has actually painted. Images
  // inside an AOS-animated tile start off-screen, and some browsers report
  // `complete` / fire `load` before the pixels reach the screen. Painting
  // early would reveal an empty box, so wait for a rendered frame too.
  function initPhotos() {
    var tiles = $$(".photo-tile");
    if (!tiles.length) return;

    tiles.forEach(function (tile) {
      var img = tile.querySelector("img");
      if (!img) return; // the CTA tile has no <img>

      var settled = false;

      function reveal() {
        if (settled) return;
        settled = true;
        img.classList.add("is-loaded");
      }

      function markFailed() {
        reveal();
        if (tile.querySelector(".photo-fallback")) return;
        var fb = document.createElement("span");
        fb.className = "photo-fallback";
        fb.innerHTML = '<i class="fa-regular fa-image"></i>';
        fb.setAttribute("role", "img");
        fb.setAttribute("aria-label", "Photo unavailable");
        tile.insertBefore(fb, tile.firstChild);
      }

      // The <img> is a child of the figure, so listen on the img itself.
      img.addEventListener("load", function () {
        // Two frames: one for decode to be committed, one for the paint.
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(reveal);
        });
      });
      img.addEventListener("error", markFailed);

      if (img.complete) {
        if (img.naturalWidth > 0) {
          window.requestAnimationFrame(function () {
            window.requestAnimationFrame(reveal);
          });
        } else {
          markFailed();
        }
      }
    });
  }

  /* ---------------------------------------------------------------- counters */
  function initCounters() {
    var chips = $$("[data-count]");
    if (!chips.length) return;

    function run(el) {
      var target = parseFloat(el.getAttribute("data-count")) || 0;
      var suffix = el.getAttribute("data-suffix") || "";
      var format = el.getAttribute("data-format");
      var out = $(".counter", el);
      if (!out) return;

      if (reduceMotion) { out.textContent = target + suffix; return; }

      var duration = 1400;
      var start = null;

      function frame(ts) {
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / duration);
        var eased = 1 - Math.pow(1 - p, 3);
        var value = Math.round(target * eased);

        if (format === "k") {
          out.textContent = (value / 1000).toFixed(value >= 1000 ? 0 : 1) + "k" + suffix;
        } else {
          out.textContent = value + suffix;
        }
        if (p < 1) window.requestAnimationFrame(frame);
      }
      window.requestAnimationFrame(frame);
    }

    if (typeof window.IntersectionObserver === "undefined") {
      chips.forEach(run);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { run(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });

    chips.forEach(function (c) { io.observe(c); });
  }

  /* ------------------------------------------------------------- marquee row */
  function initMarquee() {
    var track = $(".animate-marquee");
    var tpl = $("#marqueeItems");
    if (!track || !tpl) return;

    // Two identical runs => translateX(-50%) loops seamlessly.
    for (var i = 0; i < 2; i++) {
      var run = document.createElement("div");
      run.className = "marquee-run";
      run.innerHTML = tpl.innerHTML;
      track.appendChild(run);
    }
  }

  /* ------------------------------------------------------- cursor glow cards */
  function initPointerGlow() {
    if (reduceMotion || window.matchMedia("(hover: none)").matches) return;

    $$(".feature-card").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }

  /* ------------------------------------------------------------- light tilt */
  function initTilt() {
    if (reduceMotion || window.matchMedia("(hover: none)").matches) return;

    $$("[data-tilt]").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = "perspective(900px) rotateX(" + (-py * 5).toFixed(2) + "deg) rotateY(" + (px * 6).toFixed(2) + "deg) translateY(-4px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }

  /* ----------------------------------------------------------- enroll form */
  function initEnrollForm() {
    var form = $("#enrollForm");
    var card = $("#successCard");
    if (!form || !card) return;

    var preview = $("#messagePreview");
    var successName = $("#successName");
    var btn = $("#submitBtn");
    var label = $("#submitLabel");
    var icon = $("#submitIcon");
    var lastMessage = "";

    /* --- validation --- */
    function setError(name, message) {
      var input = form.querySelector('[name="' + name + '"]');
      if (!input) return;
      var field = input.closest(".field");
      var slot = form.querySelector('[data-error-for="' + name + '"]');
      if (field) field.classList.toggle("has-error", Boolean(message));
      if (slot) slot.textContent = message || "";
    }

    function validateField(input) {
      var name = input.name;
      var value = (input.value || "").trim();
      var message = "";

      if (input.required && !value) {
        message = "This field is required.";
      } else if (value && input.type === "tel") {
        var digits = value.replace(/[^0-9]/g, "");
        if (digits.length < 7) message = "Please enter a valid contact number.";
      } else if (value && input.type === "text" && input.minLength > 0 && value.length < input.minLength) {
        message = "Please enter at least " + input.minLength + " characters.";
      }

      setError(name, message);
      return !message;
    }

    function validateAll() {
      var inputs = $$("input, select, textarea", form);
      var firstBad = null;
      inputs.forEach(function (input) {
        if (!validateField(input) && !firstBad) firstBad = input;
      });
      return { ok: !firstBad, firstBad: firstBad };
    }

    // live validation once a field has been touched
    $$("input, select, textarea", form).forEach(function (input) {
      input.addEventListener("blur", function () {
        if (input.value.trim() || form.classList.contains("was-validated")) validateField(input);
      });
      input.addEventListener("input", function () {
        if (input.closest(".field").classList.contains("has-error")) validateField(input);
      });
    });

    /* --- message building --- */
    function buildMessage(data) {
      var lines = [
        "Hello JLFLC! I'd like to inquire about enrollment.",
        "",
        "Parent/Guardian: " + data.guardian,
        "Child's name: " + data.child,
        "Child's age: " + data.age,
        "Level of interest: " + data.level,
        "Preferred campus: " + data.campus
      ];
      if (data.phone) lines.push("Contact number: " + data.phone);
      if (data.message) lines.push("", "Additional details: " + data.message);
      lines.push("", "Sent from the JLFLC website.");
      return lines.join("\n");
    }

    function celebrate() {
      if (reduceMotion || typeof window.confetti !== "function") return;
      var colors = ["#FDCB4E", "#FB7192", "#38BDF8", "#34D399", "#FFFFFF"];
      window.confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 }, colors: colors, scalar: 0.9 });
      window.setTimeout(function () {
        window.confetti({ particleCount: 55, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: colors });
        window.confetti({ particleCount: 55, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: colors });
      }, 180);
    }

    function copyToClipboard(text) {
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
      }
      return new Promise(function (resolve, reject) {
        try {
          var ta = document.createElement("textarea");
          ta.value = text;
          ta.setAttribute("readonly", "");
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          resolve();
        } catch (err) { reject(err); }
      });
    }

    function flashCopied(btnEl) {
      var original = btnEl.innerHTML;
      btnEl.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
      btnEl.disabled = true;
      window.setTimeout(function () {
        btnEl.innerHTML = original;
        btnEl.disabled = false;
      }, 1800);
    }

    /* --- submit --- */
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      form.classList.add("was-validated");

      var result = validateAll();
      if (!result.ok) {
        result.firstBad.focus({ preventScroll: true });
        result.firstBad.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        return;
      }

      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = String(v).trim(); });
      lastMessage = buildMessage(data);

      // loading state
      btn.disabled = true;
      label.textContent = "Preparing…";
      icon.className = "fa-solid fa-spinner fa-spin";

      window.setTimeout(function () {
        preview.textContent = lastMessage;
        successName.textContent = data.guardian.split(" ")[0] || "friend";

        form.classList.add("hidden");
        card.classList.remove("hidden");
        celebrate();

        btn.disabled = false;
        label.textContent = "Prepare my message";
        icon.className = "fa-solid fa-paper-plane";

        card.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        copyToClipboard(lastMessage).catch(function () { /* clipboard blocked - preview still shown */ });
      }, 700);
    });

    $("#backToForm").addEventListener("click", function () {
      card.classList.add("hidden");
      form.classList.remove("hidden");
      form.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    });

    $("#copyAgain").addEventListener("click", function () {
      copyToClipboard(lastMessage)
        .then(function () { flashCopied($("#copyAgain")); })
        .catch(function () { window.prompt("Copy your message:", lastMessage); });
    });
  }

  /* ----------------------------------------------------------------- footer */
  function initYear() {
    var y = $("#year");
    if (y) y.textContent = String(new Date().getFullYear());
  }

  /* ------------------------------------------------------------------- boot */
  function boot() {
    initMarquee();
    initAOS();
    initProgress();
    initNavbar();
    initMenu();
    initScrollSpy();
    initToTop();
    initCounters();
    initPointerGlow();
    initTilt();
    initPhotos();
    initEnrollForm();
    initYear();

    // Keep AOS positions correct once webfonts / CDN CSS settle.
    window.addEventListener("load", function () {
      if (window.AOS) window.AOS.refreshHard();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
