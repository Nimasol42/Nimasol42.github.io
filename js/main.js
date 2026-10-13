(() => {
  const doc = document.documentElement;
  const progress = document.getElementById("progress");
  const header = document.querySelector(".site-header");
  const nav = document.getElementById("siteNav");
  const toggle = document.getElementById("navToggle");
  const year = document.getElementById("year");
  const canvas = document.getElementById("field");
  const pills = [...document.querySelectorAll(".theme-pill")];
  const topicNodes = [...document.querySelectorAll("[data-topics]")];
  const sections = [...document.querySelectorAll("main section[id]")];
  const navLinks = [...document.querySelectorAll('.site-nav > a[href^="#"]')];
  const counters = [...document.querySelectorAll("[data-count]")];

  if (year) year.textContent = String(new Date().getFullYear());

  const onScroll = () => {
    const top = window.scrollY;
    const height = doc.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = `${height > 0 ? (top / height) * 100 : 0}%`;
    header?.classList.toggle("is-scrolled", top > 10);

    const marker = top + 130;
    let current = sections[0]?.id;
    for (const section of sections) {
      if (section.offsetTop <= marker) current = section.id;
    }
    navLinks.forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === `#${current}`);
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  toggle?.addEventListener("click", () => {
    const open = nav?.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      nav?.classList.remove("is-open");
      toggle?.setAttribute("aria-expanded", "false");
    });
  });

  const revealNodes = [...document.querySelectorAll("[data-reveal]")];
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -6% 0px" }
    );
    revealNodes.forEach((node, i) => {
      node.style.transitionDelay = `${(i % 5) * 55}ms`;
      io.observe(node);
    });
  } else {
    revealNodes.forEach((node) => node.classList.add("is-visible"));
  }

  // Animated counters when overview enters view
  const animateCount = (el) => {
    const target = Number(el.dataset.count || 0);
    const start = performance.now();
    const duration = 1100;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (counters.length && "IntersectionObserver" in window) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          cio.unobserve(entry.target);
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => cio.observe(el));
  }

  const applyTopic = (topic) => {
    pills.forEach((pill) => {
      const active = pill.dataset.topic === topic;
      pill.classList.toggle("is-active", active);
      pill.setAttribute("aria-selected", active ? "true" : "false");
    });
    topicNodes.forEach((node) => {
      if (topic === "all") {
        node.classList.remove("is-dimmed");
        return;
      }
      const topics = (node.dataset.topics || "").split(/\s+/);
      node.classList.toggle("is-dimmed", !topics.includes(topic));
    });
  };

  pills.forEach((pill) => {
    pill.addEventListener("click", () => applyTopic(pill.dataset.topic || "all"));
  });

  // Soft interactive field
  if (canvas && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const ctx = canvas.getContext("2d");
    const nodes = Array.from({ length: 42 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00025,
      vy: (Math.random() - 0.5) * 0.00025,
      r: 1.1 + Math.random() * 1.8,
    }));
    let pointer = { x: 0.72, y: 0.28 };
    let width = 0;
    let height = 0;
    let raf = 0;

    const resize = () => {
      width = canvas.width = window.innerWidth * devicePixelRatio;
      height = canvas.height = window.innerHeight * devicePixelRatio;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };

    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > 1) node.vx *= -1;
        if (node.y < 0 || node.y > 1) node.vy *= -1;

        const dx = pointer.x - node.x;
        const dy = pointer.y - node.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 0.22) {
          node.x -= dx * 0.002;
          node.y -= dy * 0.002;
        }
      }

      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i];
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > 0.16) continue;
          const alpha = (1 - d / 0.16) * 0.22;
          ctx.strokeStyle = `rgba(12, 107, 111, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(a.x * window.innerWidth, a.y * window.innerHeight);
          ctx.lineTo(b.x * window.innerWidth, b.y * window.innerHeight);
          ctx.stroke();
        }
      }

      for (const node of nodes) {
        ctx.fillStyle = "rgba(11, 18, 32, 0.35)";
        ctx.beginPath();
        ctx.arc(node.x * window.innerWidth, node.y * window.innerHeight, node.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resize);
    window.addEventListener(
      "pointermove",
      (event) => {
        pointer = {
          x: event.clientX / window.innerWidth,
          y: event.clientY / window.innerHeight,
        };
      },
      { passive: true }
    );

    resize();
    draw();

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else draw();
    });
  }
})();
