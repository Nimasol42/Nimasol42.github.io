(() => {
  const doc = document.documentElement;
  const progress = document.getElementById("progress");
  const header = document.querySelector(".site-header");
  const nav = document.getElementById("siteNav");
  const toggle = document.getElementById("navToggle");
  const year = document.getElementById("year");
  const hero = document.querySelector(".hero");
  const chips = [...document.querySelectorAll(".chip")];
  const topicNodes = [...document.querySelectorAll("[data-topics]")];
  const sections = [...document.querySelectorAll("main section[id]")];
  const navLinks = [...document.querySelectorAll(".site-nav a[href^='#']")];

  if (year) year.textContent = String(new Date().getFullYear());

  requestAnimationFrame(() => {
    hero?.classList.add("is-ready");
  });

  const updateProgress = () => {
    const scrollTop = window.scrollY;
    const height = doc.scrollHeight - window.innerHeight;
    const value = height > 0 ? (scrollTop / height) * 100 : 0;
    if (progress) progress.style.width = `${value}%`;
    header?.classList.toggle("is-scrolled", scrollTop > 12);
  };

  const setActiveNav = () => {
    const marker = window.scrollY + 120;
    let current = sections[0]?.id;
    for (const section of sections) {
      if (section.offsetTop <= marker) current = section.id;
    }
    navLinks.forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === `#${current}`);
    });
  };

  const onScroll = () => {
    updateProgress();
    setActiveNav();
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
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealNodes.forEach((node, index) => {
      node.style.transitionDelay = `${Math.min(index % 6, 5) * 60}ms`;
      io.observe(node);
    });
  } else {
    revealNodes.forEach((node) => node.classList.add("is-visible"));
  }

  const applyTopicFilter = (topic) => {
    chips.forEach((chip) => {
      chip.classList.toggle("is-active", chip.dataset.topic === topic);
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

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      applyTopicFilter(chip.dataset.topic || "all");
    });
  });

  // Gentle parallax on portrait for pointer devices
  const portrait = document.querySelector(".portrait img");
  if (portrait && window.matchMedia("(pointer: fine)").matches) {
    hero?.addEventListener("pointermove", (event) => {
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      portrait.style.transform = `scale(1.03) translate(${x * 8}px, ${y * 6}px)`;
    });
    hero?.addEventListener("pointerleave", () => {
      portrait.style.transform = "scale(1)";
    });
  }
})();
