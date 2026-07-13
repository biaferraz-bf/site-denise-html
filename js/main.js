/* Denise Damiani Consulting — interações v3 (sistema vectr × DD)
   Um único listener de scroll alimenta todos os efeitos (jobs),
   com rAF para nunca calcular mais de uma vez por frame. */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- orquestrador de scroll ---------- */
  var scrollJobs = [];
  var ticking = false;
  var runJobs = function () {
    for (var i = 0; i < scrollJobs.length; i++) scrollJobs[i]();
    ticking = false;
  };
  var onScroll = function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(runJobs);
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });

  /* ---------- abertura: loader → hero entra com flip 3D. O globo é UM
       ÚNICO elemento fixo (#site-globe) que nasce grande sobre o loader,
       é medido contra os slots (FLIP) e encolhe/viaja até pousar em cima
       do título; ao chegar, vira estático e passa a rolar com o texto —
       nunca mais se move sozinho (decisão Bia 13/07). ---------- */
  var loader = document.getElementById("loader");
  var siteGlobe = document.getElementById("site-globe");
  var loaderGlobeSlot = document.getElementById("loader-globe-slot");
  var heroGlobeSlot = document.getElementById("hero-globe-slot");

  var placeGlobeAt = function (slot, instant) {
    if (!siteGlobe || !slot) return;
    var r = slot.getBoundingClientRect();
    if (instant) siteGlobe.style.transition = "none";
    siteGlobe.style.width = r.width + "px";
    siteGlobe.style.left = (r.left + r.width / 2) + "px";
    siteGlobe.style.top = (r.top + r.height / 2) + "px";
    if (instant) {
      siteGlobe.offsetHeight; /* força reflow antes de religar a transição */
      siteGlobe.style.transition = "";
    }
  };
  var parkGlobe = function () {
    if (!siteGlobe || !heroGlobeSlot) return;
    siteGlobe.classList.add("is-parked");
    siteGlobe.style.left = ""; siteGlobe.style.top = ""; siteGlobe.style.width = "";
    heroGlobeSlot.replaceWith(siteGlobe);
  };

  if (siteGlobe && loaderGlobeSlot) {
    placeGlobeAt(loaderGlobeSlot, true);
    window.addEventListener("resize", function () {
      if (!document.body.classList.contains("show")) placeGlobeAt(loaderGlobeSlot, true);
    }, { passive: true });
  }

  window.addEventListener("load", function () {
    var done = function () {
      if (loader) loader.classList.add("is-done");
      if (reduced) {
        parkGlobe();
      } else if (siteGlobe && heroGlobeSlot) {
        placeGlobeAt(heroGlobeSlot, false);
        siteGlobe.addEventListener("transitionend", parkGlobe, { once: true });
      }
      requestAnimationFrame(function () {
        document.body.classList.add("show");
      });
    };
    if (reduced) { done(); return; }
    setTimeout(done, 900); /* segura um instante para o globo dar presença */
  });

  /* ---------- cena do mapa — mecânica Vectr: UM progresso de câmera
       atravessa hero + flow (0 = topo, 1 = fim do flow); o mapa fixo inclina.
       O globo NÃO viaja mais — fica parado, pequeno, em cima do título
       (decisão Bia 13/07: nada de globo circulando a tela). ---------- */
  var heroSec = document.getElementById("hero");
  var heroMap = document.getElementById("hero-map");
  var heroContent = document.getElementById("hero-content");
  var heroScene = heroMap ? heroMap.closest(".hero__scene") : null;
  if (heroSec && heroMap) {
    if (reduced) {
      heroSec.classList.add("hero--static");
    } else {
      /* câmera: de cima para a vista inclinada de referência; a inclinação
         completa até ~40% do progresso, depois só aproxima devagar.
         tx desloca o mapa p/ a direita para manter o trajeto em quadro. */
      var CAM = { rx: 50, ry: 8, scale: 0.34, tx: 8, ty: -4, drift: 0.10 };

      var flowEl = document.querySelector(".flow");
      var flowWrapEl = flowEl ? flowEl.querySelector(".flow__wrapper") : null;

      var heroJob = function () {
        /* fim da cena = fim do runway do flow (como o cameraProgress da Vectr) */
        var end = document.body.scrollHeight - window.innerHeight;
        if (flowEl && flowWrapEl) {
          end = flowEl.getBoundingClientRect().top + window.scrollY +
                Math.max(flowEl.offsetHeight - flowWrapEl.offsetHeight, 1);
        }
        var P = Math.max(0, Math.min(1, window.scrollY / Math.max(end, 1)));

        /* inclinação completa até 40%; depois deriva suave de aproximação */
        var e = Math.min(P / 0.4, 1);
        e = e * e * (3 - 2 * e);
        var drift = Math.max(0, (P - 0.4) / 0.6);
        var rx = CAM.rx * e;
        var ry = CAM.ry * e;
        heroMap.style.transform =
          "translate(" + (-50 + CAM.tx * e) + "%," + (-50 + CAM.ty * e) + "%)" +
          " scale(" + (1 + CAM.scale * e + CAM.drift * drift).toFixed(3) + ")" +
          " rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg)";

        /* a cena some suavemente depois que o flow termina */
        if (heroScene) {
          var fadeOut = Math.max(0, Math.min(1, (window.scrollY - end) / (window.innerHeight * 0.5)));
          heroScene.style.opacity = (1 - fadeOut).toFixed(3);
          heroScene.style.visibility = fadeOut >= 1 ? "hidden" : "";
        }

        /* o texto do hero sai de cena no primeiro trecho */
        if (heroContent) {
          var fade = Math.max(0, 1 - (window.scrollY / (window.innerHeight * 0.55)));
          heroContent.style.opacity = fade;
          heroContent.style.transform = "translateY(" + (-(1 - fade) * 80).toFixed(1) + "px)";
          heroContent.style.pointerEvents = fade < 0.4 ? "none" : "";
        }
      };
      scrollJobs.push(heroJob);
    }
  }

  /* ---------- header esconde ao rolar para baixo, volta ao subir ---------- */
  var header = document.getElementById("header");
  if (header) {
    var lastY = window.scrollY;
    scrollJobs.push(function () {
      var y = window.scrollY;
      header.classList.toggle("is-hidden", y > lastY && y > 160);
      lastY = y;
    });
  }

  /* ---------- menu mobile ---------- */
  var toggle = document.getElementById("nav-toggle");
  var mobileNav = document.getElementById("mobile-nav");
  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      var open = mobileNav.classList.toggle("is-open");
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        mobileNav.classList.remove("is-open");
        toggle.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- reveals no scroll ---------- */
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal").forEach(function (el) {
    if (reduced) { el.classList.add("is-visible"); return; }
    revealObserver.observe(el);
  });

  /* ---------- flow (01–03) — dirigido pelo scroll, mecânica Vectr ---------- */
  var flowSection = document.querySelector(".flow");
  if (flowSection) {
    var flowWrapper = flowSection.querySelector(".flow__wrapper");
    var flowSteps = Array.prototype.slice.call(flowSection.querySelectorAll(".flow__step"));
    var nSteps = flowSteps.length;

    if (reduced || !flowWrapper || nSteps === 0) {
      flowSection.classList.add("flow--static");
      flowSteps.forEach(function (s) { s.classList.add("flow__step--active"); });
    } else {
      var flowMetrics = function () {
        var top = flowSection.getBoundingClientRect().top + window.scrollY;
        var runway = Math.max(flowSection.offsetHeight - flowWrapper.offsetHeight, 1);
        return { top: top, runway: runway };
      };

      scrollJobs.push(function () {
        var m = flowMetrics();
        var p = Math.max(0, Math.min(1, (window.scrollY - m.top) / m.runway));
        var active = Math.min(nSteps - 1, Math.floor(p * nSteps));
        flowSteps.forEach(function (step, idx) {
          step.classList.toggle("flow__step--active", idx === active);
          var fill = step.querySelector(".flow__track-fill");
          if (!fill) return;
          var start = idx / nSteps;
          var end = (idx + 1) / nSteps;
          var q = p >= end ? 1 : (p <= start ? 0 : (p - start) / (end - start));
          fill.style.transform = "scaleY(" + q + ")";
        });
      });

      /* clicar num passo rola até a faixa de scroll dele */
      flowSteps.forEach(function (step, idx) {
        var head = step.querySelector(".flow__header");
        if (!head) return;
        head.addEventListener("click", function () {
          var m = flowMetrics();
          window.scrollTo({ top: m.top + ((idx + 0.5) / nSteps) * m.runway, behavior: "smooth" });
        });
      });
    }
  }

  runJobs(); /* estado inicial correto de todos os efeitos */

  /* ---------- números contando ao entrar na tela ---------- */
  var stats = document.getElementById("stats");
  if (stats) {
    var counted = false;
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || counted) return;
        counted = true;
        stats.querySelectorAll(".num").forEach(function (el) {
          var target = parseInt(el.getAttribute("data-count"), 10);
          var suffix = el.getAttribute("data-suffix") || "";
          if (reduced) { el.textContent = target + suffix; return; }
          var start = null;
          var dur = 1400;
          function tick(ts) {
            if (!start) start = ts;
            var p = Math.min((ts - start) / dur, 1);
            var eased = 1 - Math.pow(1 - p, 4);
            el.textContent = Math.round(eased * target) + (p === 1 ? suffix : "");
            if (p < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        });
        countObserver.disconnect();
      });
    }, { threshold: 0.4 });
    countObserver.observe(stats);
  }

  /* ---------- fundo de conexões — nós que derivam ligados por CURVAS rosas;
       o ponteiro do mouse também vira um nó ---------- */
  var net = document.getElementById("net-bg");
  if (net && !reduced) {
    var nctx = net.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var NW = 0, NH = 0;
    var nodes = [];
    var mouse = { x: -9999, y: -9999 };
    var LINK = 160;

    var netSize = function () {
      NW = window.innerWidth;
      NH = window.innerHeight;
      net.width = NW * dpr;
      net.height = NH * dpr;
      nctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    netSize();

    var count = Math.round(Math.min(90, Math.max(40, (NW * NH) / 22000)));
    for (var i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * NW,
        y: Math.random() * NH,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.5 + 1,
        bend: Math.random() * 2 - 1   /* curvatura própria de cada nó */
      });
    }

    /* liga dois pontos com uma curva suave (nada de retas — vira mapa astral).
       O desvio é perpendicular à linha e estável por par, então a curva
       acompanha os nós sem tremer. Rosa da paleta DD. */
    var curveTo = function (x1, y1, x2, y2, bend, alpha) {
      var dx = x2 - x1, dy = y2 - y1;
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      var k = bend * Math.min(d * 0.28, 42);
      nctx.strokeStyle = "rgba(233, 67, 99, " + alpha + ")";
      nctx.lineWidth = 1;
      nctx.beginPath();
      nctx.moveTo(x1, y1);
      nctx.quadraticCurveTo((x1 + x2) / 2 + (-dy / d) * k, (y1 + y2) / 2 + (dx / d) * k, x2, y2);
      nctx.stroke();
    };

    window.addEventListener("resize", netSize, { passive: true });
    window.addEventListener("mousemove", function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }, { passive: true });
    window.addEventListener("mouseout", function () {
      mouse.x = -9999; mouse.y = -9999;
    });

    var netDraw = function () {
      nctx.clearRect(0, 0, NW, NH);
      var i, j, a, b, dx, dy, d, alpha;

      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < -20) a.x = NW + 20; else if (a.x > NW + 20) a.x = -20;
        if (a.y < -20) a.y = NH + 20; else if (a.y > NH + 20) a.y = -20;
      }

      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j];
          dx = a.x - b.x; dy = a.y - b.y;
          d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK) {
            alpha = (1 - d / LINK) * 0.14;
            curveTo(a.x, a.y, b.x, b.y, (a.bend + b.bend) / 2, alpha);
          }
        }
        dx = a.x - mouse.x; dy = a.y - mouse.y;
        d = Math.sqrt(dx * dx + dy * dy);
        if (d < LINK * 1.2) {
          alpha = (1 - d / (LINK * 1.2)) * 0.22;
          curveTo(a.x, a.y, mouse.x, mouse.y, a.bend, alpha);
        }
      }

      /* nós — pontos rosa da paleta DD */
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        nctx.fillStyle = "rgba(233, 67, 99, 0.5)";
        nctx.beginPath();
        nctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        nctx.fill();
      }

      requestAnimationFrame(netDraw);
    };
    requestAnimationFrame(netDraw);
  }

  /* ---------- FAQ accordion — um aberto por vez ---------- */
  document.querySelectorAll("#faq .faq-item__header").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".faq-item");
      var wasOpen = item.classList.contains("faq-item--open");
      document.querySelectorAll("#faq .faq-item--open").forEach(function (open) {
        var content = open.querySelector(".faq-item__content");
        content.style.maxHeight = content.scrollHeight + "px";
        void content.offsetHeight;
        content.style.maxHeight = "0px";
        open.classList.remove("faq-item--open");
        open.querySelector(".faq-item__header").setAttribute("aria-expanded", "false");
      });
      if (!wasOpen) {
        var content = item.querySelector(".faq-item__content");
        item.classList.add("faq-item--open");
        btn.setAttribute("aria-expanded", "true");
        content.style.maxHeight = "0px";
        void content.offsetHeight;
        content.style.maxHeight = content.scrollHeight + "px";
      }
    });
  });
  document.querySelectorAll("#faq .faq-item--open .faq-item__content").forEach(function (c) {
    c.style.maxHeight = c.scrollHeight + "px";
  });

  /* ---------- Acervo — accordion de vídeos e links (cada item abre/fecha independente) ---------- */
  document.querySelectorAll("#archive-list .archive-item__header").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".archive-item");
      var content = item.querySelector(".archive-item__content");
      var opening = !item.classList.contains("archive-item--open");
      if (opening) {
        item.classList.add("archive-item--open");
        btn.setAttribute("aria-expanded", "true");
        content.style.maxHeight = content.scrollHeight + "px";
      } else {
        content.style.maxHeight = content.scrollHeight + "px";
        void content.offsetHeight;
        content.style.maxHeight = "0px";
        item.classList.remove("archive-item--open");
        btn.setAttribute("aria-expanded", "false");
      }
    });
  });
})();
