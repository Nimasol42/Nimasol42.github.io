(() => {
  const doc = document.documentElement;
  const progress = document.getElementById("progress");
  const header = document.querySelector(".site-header");
  const nav = document.getElementById("siteNav");
  const toggle = document.getElementById("navToggle");
  const year = document.getElementById("year");
  const canvas = document.getElementById("field");
  const pills = [...document.querySelectorAll(".theme-pill")];
  const themeRows = [...document.querySelectorAll("[data-key]")];
  const topicNodes = [...document.querySelectorAll("[data-topics]")];
  const filterStatus = document.getElementById("filterStatus");
  const sections = [...document.querySelectorAll("main section[id]")];
  const navLinks = [...document.querySelectorAll('.site-nav > a[href^="#"]')];
  const counters = [...document.querySelectorAll("[data-count]")];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (year) year.textContent = String(new Date().getFullYear());

  /* Scroll progress, header state, active section */
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const top = window.scrollY;
    const height = doc.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = `scaleX(${height > 0 ? Math.min(1, top / height) : 0})`;
    header?.classList.toggle("is-scrolled", top > 10);

    const marker = top + window.innerHeight * 0.35;
    let current = "";
    for (const section of sections) {
      if (section.offsetTop <= marker) current = section.id;
    }
    if (window.innerHeight + top >= doc.scrollHeight - 4) current = "contact";
    let activeLink = null;
    navLinks.forEach((link) => {
      const active = link.getAttribute("href") === `#${current}`;
      link.classList.toggle("is-active", active);
      if (active) {
        link.setAttribute("aria-current", "true");
        activeLink = link;
      } else {
        link.removeAttribute("aria-current");
      }
    });
    moveIndicator(activeLink);
  };

  const indicator = document.querySelector(".nav-indicator");
  let indicatorTarget;
  function moveIndicator(link) {
    if (!indicator || link === indicatorTarget) return;
    indicatorTarget = link;
    if (!link || !link.offsetWidth) {
      indicator.classList.remove("is-ready");
      return;
    }
    const y = link.offsetTop + link.offsetHeight - 1;
    indicator.style.transform = `translate(${link.offsetLeft}px, ${y}px) scaleX(${link.offsetWidth})`;
    requestAnimationFrame(() => indicator.classList.add("is-ready"));
  }

  window.addEventListener("resize", () => {
    indicatorTarget = undefined;
    onScroll();
  });
  document.fonts?.ready.then(() => {
    indicatorTarget = undefined;
    onScroll();
  });

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true }
  );
  onScroll();

  /* Mobile navigation */
  const setNav = (open) => {
    nav?.classList.toggle("is-open", open);
    toggle?.setAttribute("aria-expanded", open ? "true" : "false");
  };

  toggle?.addEventListener("click", () => setNav(!nav?.classList.contains("is-open")));
  nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setNav(false)));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav?.classList.contains("is-open")) {
      setNav(false);
      toggle?.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (nav?.classList.contains("is-open") && !header?.contains(event.target)) setNav(false);
  });

  /* Reveal on scroll */
  document.querySelectorAll(".section__intro").forEach((intro) => {
    intro.classList.add("reveal");
    intro.setAttribute("data-reveal", "");
  });
  const revealNodes = [...document.querySelectorAll("[data-reveal]")];
  if ("IntersectionObserver" in window && !reducedMotion.matches) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealNodes.forEach((node, i) => {
      node.style.transitionDelay = `${(i % 4) * 60}ms`;
      node.addEventListener("transitionend", () => node.style.removeProperty("transition-delay"), { once: true });
      io.observe(node);
    });
  } else {
    revealNodes.forEach((node) => node.classList.add("is-visible"));
  }

  /* Counters */
  const animateCount = (el) => {
    const target = Number(el.dataset.count || 0);
    const start = performance.now();
    const duration = 1200;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (counters.length && "IntersectionObserver" in window && !reducedMotion.matches) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          cio.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => cio.observe(el));
  }

  /* Theme filter */
  const labels = { markets: "Markets", structure: "Structure", physics: "Physics", brain: "Brain signals", chain: "Protocols" };
  let activeTopic = "all";

  const applyTopic = (topic) => {
    activeTopic = topic;
    pills.forEach((pill) => {
      pill.setAttribute("aria-pressed", pill.dataset.topic === topic ? "true" : "false");
    });
    themeRows.forEach((row) => row.classList.toggle("is-selected", row.dataset.key === topic));

    let papers = 0;
    let roles = 0;
    topicNodes.forEach((node) => {
      const match = topic === "all" || (node.dataset.topics || "").split(/\s+/).includes(topic);
      node.classList.toggle("is-dimmed", !match);
      if (match && node.classList.contains("writing")) papers += 1;
      if (match && node.classList.contains("appointment")) roles += 1;
    });

    if (filterStatus) {
      filterStatus.textContent =
        topic === "all"
          ? ""
          : `${labels[topic]}: ${papers} ${papers === 1 ? "paper" : "papers"}, ${roles} ${roles === 1 ? "appointment" : "appointments"} in focus`;
    }
  };

  pills.forEach((pill) => {
    pill.addEventListener("click", () => applyTopic(pill.dataset.topic || "all"));
  });

  themeRows.forEach((row) => {
    row.addEventListener("click", (event) => {
      if (event.target.closest("a")) return;
      applyTopic(activeTopic === row.dataset.key ? "all" : row.dataset.key);
    });
  });

  /* Copy contact details */
  const copyStatus = document.getElementById("copyStatus");
  const copyButtons = [...document.querySelectorAll("[data-copy]")];
  const selectValue = (button) => {
    const value = button.parentElement?.querySelector(".channel__value");
    if (!value) return;
    const range = document.createRange();
    range.selectNodeContents(value);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  };

  const flash = (button, label, done) => {
    clearTimeout(button._t);
    button.textContent = label;
    button.classList.toggle("is-done", done);
    button._t = setTimeout(() => {
      button.textContent = "Copy";
      button.classList.remove("is-done");
    }, 1800);
  };

  copyButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const text = button.dataset.copy || "";
      try {
        if (!navigator.clipboard || !window.isSecureContext) throw new Error("no clipboard");
        await navigator.clipboard.writeText(text);
        flash(button, "Copied", true);
        if (copyStatus) copyStatus.textContent = `Copied ${text}`;
      } catch {
        selectValue(button);
        flash(button, "Selected", false);
        if (copyStatus) copyStatus.textContent = `${text} selected; press Ctrl+C to copy`;
      }
    });
  });

  /* Local time in Tehran */
  const clock = document.getElementById("localTime");
  if (clock && window.Intl) {
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit" });
    const update = () => {
      clock.textContent = fmt.format(new Date());
    };
    update();
    setInterval(update, 30000);
  }

  /* Background field: a slow graph that drifts away from the pointer */
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext("2d");
    let nodes = [];
    let pointer = { x: -1, y: -1 };
    let w = 0;
    let h = 0;
    let raf = 0;
    let running = false;

    const seed = () => {
      const count = Math.round(Math.min(46, Math.max(18, (w * h) / 30000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.00022,
        vy: (Math.random() - 0.5) * 0.00022,
        r: 1 + Math.random() * 1.6,
      }));
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!nodes.length) seed();
    };

    const render = (move) => {
      ctx.clearRect(0, 0, w, h);
      const linkDist = Math.min(180, Math.max(110, w * 0.12));

      for (const node of nodes) {
        if (move) {
          node.x += node.vx;
          node.y += node.vy;
          if (node.x < 0 || node.x > 1) node.vx *= -1;
          if (node.y < 0 || node.y > 1) node.vy *= -1;
          const dx = (node.x - pointer.x) * w;
          const dy = (node.y - pointer.y) * h;
          const d = Math.hypot(dx, dy);
          if (pointer.x >= 0 && d < 160 && d > 0.01) {
            const push = (1 - d / 160) * 0.6;
            node.x += (dx / d) * push / w;
            node.y += (dy / d) * push / h;
          }
        }
      }

      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i += 1) {
        const a = nodes[i];
        const ax = a.x * w;
        const ay = a.y * h;
        for (let j = i + 1; j < nodes.length; j += 1) {
          const b = nodes[j];
          const d = Math.hypot(ax - b.x * w, ay - b.y * h);
          if (d > linkDist) continue;
          ctx.strokeStyle = `rgba(12, 107, 111, ${(1 - d / linkDist) * 0.2})`;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(b.x * w, b.y * h);
          ctx.stroke();
        }
      }

      ctx.fillStyle = "rgba(11, 18, 32, 0.32)";
      for (const node of nodes) {
        ctx.beginPath();
        ctx.arc(node.x * w, node.y * h, node.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const frame = () => {
      render(true);
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || document.hidden || reducedMotion.matches) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    resize();
    render(false);
    start();

    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        if (!running) render(false);
      }, 120);
    });

    window.addEventListener(
      "pointermove",
      (event) => {
        if (event.pointerType !== "mouse") return;
        pointer = { x: event.clientX / w, y: event.clientY / h };
      },
      { passive: true }
    );
    document.addEventListener("pointerleave", () => {
      pointer = { x: -1, y: -1 };
    });

    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    reducedMotion.addEventListener?.("change", () => {
      if (reducedMotion.matches) {
        stop();
        render(false);
      } else {
        start();
      }
    });
  }
})();
