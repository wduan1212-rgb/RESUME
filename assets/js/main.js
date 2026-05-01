(function () {
  "use strict";

  const site = window.siteConfig || {};
  const works = (window.portfolioWorks || []).slice().sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  const categories = window.portfolioCategories || [];
  const workflowSteps = window.workflowSteps || [];
  const vibeWorkflowSteps = window.vibeWorkflowSteps || [];
  const dragonSeries = window.dragonCovenantSeries || {};

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const escapeHTML = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const findWork = (id) => works.find((work) => work.id === id);
  const byId = (id) => findWork(id) || works[0];

  function iconKey(category) {
    return categories.find((item) => item.key === category)?.icon || "all";
  }

  function countCategory(category) {
    return category === "All" ? works.length : works.filter((work) => work.category === category).length;
  }

  function setText(selector, text) {
    const node = $(selector);
    if (node) node.textContent = text;
  }

  function initSiteConfig() {
    $$(".brand-mark").forEach((mark) => {
      mark.innerHTML = `<img src="assets/logo/wd-logo.png" alt="WD" width="44" height="44">`;
      mark.classList.add("brand-mark-image");
    });

    setText("[data-site-email]", site.email || "");
    setText("[data-site-location]", site.location || "");
    setText("[data-site-wechat]", site.wechat || "");

    $$("[data-feishu-link]").forEach((link) => {
      link.setAttribute("href", site.feishuUrl || "#");
      if (site.feishuUrl && site.feishuUrl !== "#") {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener");
        link.removeAttribute("aria-disabled");
      } else {
        link.setAttribute("aria-disabled", "true");
      }
      link.addEventListener("click", (event) => {
        if (!site.feishuUrl || site.feishuUrl === "#") event.preventDefault();
      });
    });

    const socials = $("[data-socials]");
    if (socials) {
      socials.innerHTML = (site.socials || [])
        .map(
          (social) => `
            <a class="social-link social-icon-link" href="${escapeHTML(social.url || "#")}" aria-label="${escapeHTML(social.name)}"${!social.url || social.url === "#" ? ' aria-disabled="true"' : ""}>
              <img src="${escapeHTML(social.icon)}" alt="" width="18" height="18">
              <span>${escapeHTML(social.name)}</span>
            </a>
          `
        )
        .join("");
      $$("a[aria-disabled='true']", socials).forEach((link) => {
        link.addEventListener("click", (event) => event.preventDefault());
      });
    }
  }

  function coverImageMarkup(work, className = "cover-image") {
    if (work.coverVideoUrl) {
      return `<video class="${escapeHTML(className)} cover-video" src="${escapeHTML(work.coverVideoUrl)}"${work.coverUrl ? ` poster="${escapeHTML(work.coverUrl)}"` : ""} autoplay muted loop playsinline preload="metadata" aria-label="${escapeHTML(`${work.title} / ${work.titleCn}`)}"></video>`;
    }
    if (!work.coverUrl) return "";
    return `<img class="${escapeHTML(className)}" src="${escapeHTML(work.coverUrl)}" alt="${escapeHTML(`${work.title} / ${work.titleCn}`)}" loading="lazy" decoding="async">`;
  }

  function orientationOf(work) {
    if (work.orientation) return work.orientation;
    if (work.type === "pdf-archive" || work.type === "exhibition-board") return "vertical";
    if (work.format && work.format.includes("9:16")) return "vertical";
    return "horizontal";
  }

  function visualMarkup(work, compact = false) {
    if (work.type === "website-recording") {
      return `
        <div class="browser-shell cover-shell" aria-hidden="true">
          <div class="browser-bar"><span></span><span></span><span></span></div>
          <div class="browser-screen visual-placeholder has-cover">${coverImageMarkup(work)}</div>
        </div>
      `;
    }

    if (orientationOf(work) === "vertical" && work.type !== "exhibition-board" && work.type !== "pdf-archive") {
      return `
        <div class="phone-shell cover-phone" aria-hidden="true">
          <div class="phone-screen visual-placeholder has-cover">${coverImageMarkup(work)}</div>
        </div>
      `;
    }

    if (work.type === "exhibition-board") {
      return `
        <div class="board-frame visual-placeholder has-cover" aria-hidden="true">
          ${coverImageMarkup(work)}
        </div>
      `;
    }

    if (work.type === "pdf-archive") {
      return `
        <div class="pdf-cover has-cover" aria-hidden="true">
          ${coverImageMarkup(work)}
        </div>
      `;
    }

    return `
      <div class="wide-frame visual-placeholder has-cover" aria-hidden="true">
        ${coverImageMarkup(work)}
      </div>
    `;
  }

  function tagMarkup(tags) {
    return (tags || [])
      .slice(0, 3)
      .map((tag) => `<span class="pill">${escapeHTML(tag)}</span>`)
      .join("");
  }

  function mediaHref(work) {
    if (!work) return "";
    if (work.externalUrl) return work.externalUrl;
    if (work.videoUrl && /^https?:\/\//i.test(work.videoUrl)) return work.videoUrl;
    if (work.pdfUrl) return work.pdfUrl;
    return "";
  }

  function visualActionMarkup(work, options = {}) {
    const visual = visualMarkup(work, options.compact);
    if (work.enableLightbox) {
      return `<button class="visual-button" type="button" data-open-video="${escapeHTML(work.id)}" aria-label="View ${escapeHTML(work.title)}">${visual}</button>`;
    }
    const href = mediaHref(work);
    if (!href) return visual;
    return `<a class="visual-link" href="${escapeHTML(href)}" aria-label="Open ${escapeHTML(work.title)}">${visual}</a>`;
  }

  function workCard(work, options = {}) {
    const showSummary = options.summary !== false;
    return `
      <article class="work-card ${escapeHTML(work.type)} orientation-${escapeHTML(orientationOf(work))} layout-${escapeHTML(work.layout || "wide")} reveal" data-work-card data-category="${escapeHTML(work.category)}" data-year="${escapeHTML(work.year)}" data-accent="${escapeHTML(work.accent || "cyan")}">
        <div class="card-visual">${visualActionMarkup(work, options)}</div>
        <div class="card-body">
          <div class="card-overline">
            <span>${escapeHTML(work.weight || "")}</span>
            <span>${escapeHTML(work.category)} / ${escapeHTML(work.categoryCn)}</span>
          </div>
          <h3>${escapeHTML(work.title)}<br><span>${escapeHTML(work.titleCn)}</span></h3>
          ${showSummary ? `<p>${escapeHTML(work.summaryCn)}</p>` : ""}
        </div>
      </article>
    `;
  }

  function renderHighlights() {
    const root = $("[data-highlights]");
    if (!root) return;
    const keys = ["Commercial Ads", "App Promo", "Vibe Coding", "Game Visuals", "AI Short Films"];
    root.innerHTML = categories
      .filter((category) => keys.includes(category.key))
      .map((category) => {
        const firstWork = works.find((work) => work.category === category.key);
        return `
          <a class="metric-card reveal" href="works.html?category=${encodeURIComponent(category.key)}" data-accent="${escapeHTML(firstWork?.accent || "cyan")}">
            <div>
              <div class="metric-top">
                <span class="metric-icon" data-icon="${escapeHTML(category.icon)}" aria-hidden="true"></span>
                <span class="count">${String(countCategory(category.key)).padStart(2, "0")} Series</span>
              </div>
              <h3>${escapeHTML(category.key)}<br><span>${escapeHTML(category.cn)}</span></h3>
              <p>${escapeHTML(category.summary)}</p>
            </div>
            <span class="text-link">View Works</span>
          </a>
        `;
      })
      .join("");
  }

  function renderHomeFeatured() {
    const gridRoot = $("[data-featured-grid]");
    const reelRoot = $("[data-featured-reel]");
    const featured = works.filter((work) => work.featured).slice(0, 6);

    if (gridRoot) {
      gridRoot.innerHTML = featured.map((work) => workCard(work)).join("");
    }

    if (reelRoot) {
      reelRoot.innerHTML = featured
        .slice(0, 4)
        .map(
          (work) => `
            <button class="reel-thumb" type="button" data-open-video="${escapeHTML(work.id)}">
              ${coverImageMarkup(work, "reel-thumb-image")}
              <span>${String(work.order).padStart(2, "0")}</span>
              <strong>${escapeHTML(work.title)}</strong>
              <em>${escapeHTML(work.duration)}</em>
            </button>
          `
        )
        .join("");
    }
  }

  function archiveItem(work, pdf = false) {
    if (pdf) {
      const pdfHref = work.pdfUrl || `case-study.html?id=${encodeURIComponent(work.id)}`;
      const pdfButtonLabel = /\.pdf(\?.*)?$/i.test(pdfHref) ? "Preview PDF<br>预览 PDF" : "Open Portfolio<br>打开作品集";
      return `
        <article class="archive-card pdf-card reveal">
          ${visualMarkup(work)}
          <div>
            <div class="meta-row">${tagMarkup(work.tags)}</div>
            <h3>${escapeHTML(work.title)}<br><span>${escapeHTML(work.titleCn)}</span></h3>
            <p>${escapeHTML(work.summaryCn)}</p>
          </div>
          <a class="button" href="${escapeHTML(pdfHref)}"${work.pdfUrl ? ' target="_blank" rel="noopener"' : ""}>${pdfButtonLabel}</a>
        </article>
      `;
    }

    return `
      <article class="archive-card reveal" data-accent="${escapeHTML(work.accent || "cyan")}">
        <div>
          <div class="preview-shell">${visualActionMarkup(work)}</div>
          <h3>${escapeHTML(work.title)}<br><span>${escapeHTML(work.titleCn)}</span></h3>
          <p>${escapeHTML(work.summaryCn)}</p>
        </div>
      </article>
    `;
  }

  function dragonOriginIndexCard() {
    const gameUrl = dragonSeries.gameUrl || "https://wduan1212-rgb.github.io/Dragon/";
    return `
      <a class="dragon-origin-index reveal" href="${escapeHTML(gameUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Open Dragon Covenant interactive game">
        <div class="dragon-origin-media">
          <video src="${escapeHTML(dragonSeries.indexMotionUrl || "")}" poster="${escapeHTML(dragonSeries.indexPosterUrl || "")}" autoplay muted loop playsinline preload="metadata" aria-label="Dragon Covenant origin index"></video>
        </div>
        <div class="dragon-origin-copy">
          <p class="section-kicker">2025 Narrative Origin</p>
          <h3>龙之契起源</h3>
          <p>龙之契系列起源于 2025 年的 AI 叙事探索，这张索引卡直接进入 2026 互动网页游戏。</p>
          <span class="button dragon-primary">Play Dragon Game<br><span>进入互动游戏</span></span>
        </div>
      </a>
    `;
  }

  function yearBlock(year, title, subtitle, content) {
    return `
      <section class="year-block reveal" data-year-block>
        <div class="year-sticky">
          <h3 class="year">${year}</h3>
          <p class="year-caption">${escapeHTML(title)}<span>${escapeHTML(subtitle)}</span></p>
        </div>
        <div class="year-content">${content}</div>
      </section>
    `;
  }

  function renderTimeline() {
    const root = $("[data-timeline]");
    if (!root) return;

    const content2026 = works.filter((work) => work.year === 2026 && work.timeline);
    const content2025 = works.filter((work) => work.year === 2025 && work.timeline);
    const content2024 = works.filter((work) => work.year === 2024 && work.timeline);
    const dragonWorks2025 = content2025.filter((work) => ["dragon-covenant-undersea", "dragon-covenant-dragon"].includes(work.id));
    const boards2025 = content2025.filter((work) => work.displayGroup === "timeline-2025-board");

    root.innerHTML = `
      ${yearBlock("2026", "Main Creation Year", "Commercial Video / Vibe Coding / AI Film", `
        <div class="year-note reveal">
          <strong>2026 核心创作年：</strong>聚焦商业 AI 视频、App 宣传、Vibe Coding、游戏视觉与影像实验。
        </div>
        <div class="horizontal-gallery-shell reveal">
          <div class="gallery-head">
            <span>2026 Project Sequence / 2026 项目序列</span>
            <em>${content2026.length} project series</em>
          </div>
          <button class="gallery-arrow gallery-arrow-left" type="button" data-gallery-scroll="-1" aria-label="Scroll projects left">‹</button>
          <div class="horizontal-gallery" data-wheel-horizontal>
            <div class="horizontal-track">
              ${content2026.map((work) => workCard(work, { summary: false, compact: true })).join("")}
            </div>
          </div>
          <button class="gallery-arrow gallery-arrow-right" type="button" data-gallery-scroll="1" aria-label="Scroll projects right">›</button>
          <div class="gallery-dots" data-gallery-dots aria-hidden="true">
            ${Array.from({ length: Math.ceil(content2026.length / 2) }, (_, index) => `<span class="${index === 0 ? "is-active" : ""}"></span>`).join("")}
          </div>
        </div>
      `)}
      ${yearBlock("2025", "Visual Exploration", "Dragon Covenant / Competition Boards", `
        <div class="year-note reveal">AIGC fantasy film studies and competition boards presented as a focused visual exploration archive. / AIGC 奇幻短片与竞赛展板构成独立视觉探索归档。</div>
        ${dragonOriginIndexCard()}
        <div class="boards-grid">
          ${dragonWorks2025.map((work) => archiveItem(work)).join("")}
          ${boards2025.map((work) => archiveItem(work)).join("")}
        </div>
      `)}
      ${yearBlock("2024", "Portfolio Foundation", "PDF Archive", `
        <div class="archive-grid">
          ${content2024.map((work) => archiveItem(work, true)).join("")}
        </div>
      `)}
    `;
  }

  function renderCategories() {
    const root = $("[data-categories]");
    if (!root) return;
    root.innerHTML = categories
      .filter((category) => category.key !== "All")
      .map((category) => {
        const firstWork = works.find((work) => work.category === category.key);
        return `
          <a class="category-card reveal" href="works.html?category=${encodeURIComponent(category.key)}" data-accent="${escapeHTML(firstWork?.accent || "cyan")}">
            <span class="category-icon" data-icon="${escapeHTML(category.icon)}" aria-hidden="true"></span>
            <h3>${escapeHTML(category.key)}<br><span>${escapeHTML(category.cn)}</span></h3>
            <p>${escapeHTML(category.summary)}</p>
          </a>
        `;
      })
      .join("");
  }

  function renderWorkflow(rootSelector, steps, six = false) {
    const root = $(rootSelector);
    if (!root) return;
    root.classList.toggle("six", six);
    root.innerHTML = steps
      .map(
        ([number, en, cn]) => `
          <div class="workflow-step">
            <div class="step-dot">${escapeHTML(number)}</div>
            <strong>${escapeHTML(en)}</strong>
            <span>${escapeHTML(cn)}</span>
          </div>
        `
      )
      .join("");
  }

  function renderWorksPage() {
    const grid = $("[data-works-grid]");
    const filters = $("[data-filters]");
    const count = $("[data-works-count]");
    if (!grid || !filters) return;

    filters.innerHTML = categories
      .map(
        (category) => `
          <button class="filter-button" type="button" data-filter="${escapeHTML(category.key)}">
            ${escapeHTML(category.key)} / ${escapeHTML(category.cn)}
          </button>
        `
      )
      .join("");

    const params = new URLSearchParams(window.location.search);
    const initial = params.get("category") || "All";

    const renderWorksSections = (items) => {
      const horizontal = items.filter((work) => orientationOf(work) !== "vertical" && work.type !== "pdf-archive" && work.type !== "exhibition-board");
      const vertical = items.filter((work) => orientationOf(work) === "vertical" && work.type !== "pdf-archive" && work.type !== "exhibition-board");
      const boards = items.filter((work) => work.type === "exhibition-board");
      const archives = items.filter((work) => work.type === "pdf-archive");
      return `
        ${horizontal.length ? `
          <section class="works-layout-section">
            <div class="works-section-head">
              <h3>Horizontal Works / 横屏项目</h3>
              <span>${horizontal.length} items</span>
            </div>
            <div class="works-horizontal-track">
              ${horizontal.map((work) => workCard(work)).join("")}
            </div>
          </section>
        ` : ""}
        ${vertical.length ? `
          <section class="works-layout-section">
            <div class="works-section-head">
              <h3>Vertical Poster Wall / 竖屏作品瀑布</h3>
              <span>${vertical.length} items</span>
            </div>
            <div class="works-masonry-scroll" data-wheel-horizontal>
              <div class="works-masonry-grid">
                ${vertical.map((work) => workCard(work)).join("")}
              </div>
            </div>
          </section>
        ` : ""}
        ${boards.length ? `
          <section class="works-layout-section">
            <div class="works-section-head">
              <h3>Competition Boards / 比赛展板</h3>
              <span>${boards.length} items</span>
            </div>
            <div class="boards-grid works-boards-grid">
              ${boards.map((work) => workCard(work)).join("")}
            </div>
          </section>
        ` : ""}
        ${archives.length ? `
          <section class="works-layout-section">
            <div class="works-section-head">
              <h3>Portfolio Archive / 作品集归档</h3>
              <span>${archives.length} item</span>
            </div>
            <div class="archive-grid">
              ${archives.map((work) => archiveItem(work, true)).join("")}
            </div>
          </section>
        ` : ""}
      `;
    };

    const applyFilter = (category) => {
      const selected = categories.some((item) => item.key === category) ? category : "All";
      $$(".filter-button", filters).forEach((button) => {
        button.classList.toggle("is-active", button.dataset.filter === selected);
      });
      const visible = selected === "All" ? works : works.filter((work) => work.category === selected);
      grid.innerHTML = renderWorksSections(visible);
      if (count) count.textContent = `${visible.length} projects`;
      setupWheelHorizontal(grid);
      revealNow(grid);
    };

    filters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;
      applyFilter(button.dataset.filter);
      const url = new URL(window.location.href);
      if (button.dataset.filter === "All") url.searchParams.delete("category");
      else url.searchParams.set("category", button.dataset.filter);
      window.history.replaceState({}, "", url);
    });

    filters.addEventListener("keydown", (event) => {
      const button = event.target.closest("[data-filter]");
      if (!button || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      button.click();
    });

    applyFilter(initial);
  }

  function renderCaseStudyPage() {
    const root = $("[data-case-page]");
    if (!root) return;
    const params = new URLSearchParams(window.location.search);
    const work = byId(params.get("id"));
    if (!work) return;

    document.title = `${work.title} | Wang Duan Motion Archive`;
    setText("[data-case-category]", `${work.category} / ${work.categoryCn}`);
    const title = $("[data-case-title]");
    if (title) title.innerHTML = `${escapeHTML(work.title)}<br><span>${escapeHTML(work.titleCn)}</span>`;
    setText("[data-case-summary]", work.summaryCn);
    const tags = $("[data-case-tags]");
    if (tags) tags.innerHTML = tagMarkup(work.tags);
    const visual = $("[data-case-visual]");
    if (visual) visual.innerHTML = visualMarkup(work);

    const meta = [
      ["Weight", work.weight],
      ["Project Type", `${work.category} / ${work.categoryCn}`],
      ["Year", work.year],
      ["Format", work.format],
      ["Platform", work.platform],
      ["Recommended", work.recommendedVideoCount],
      ["Tools", work.tools],
      ["Role", work.role]
    ];
    const metaRoot = $("[data-case-meta]");
    if (metaRoot) {
      metaRoot.innerHTML = meta
        .map(
          ([label, value]) => `
            <div class="meta-item">
              <span>${escapeHTML(label)}</span>
              <strong>${escapeHTML(value)}</strong>
            </div>
          `
        )
        .join("");
    }

    setText("[data-creative-goal]", work.goal);
    setText("[data-visual-strategy]", work.strategy);
    setText("[data-case-value]", work.value);
    setText("[data-reflection]", "This case records the creative objective, visual strategy, production role and final media entry for portfolio review. / 本案例保留创作目标、视觉策略、制作角色与最终媒体入口，便于完整查看项目脉络。");
    $$("[data-case-preview-button]").forEach((button) => {
      button.dataset.openVideo = work.id;
    });
  }

  function setupHeroVideo() {
    const video = $("[data-hero-video]");
    const soundButton = $("[data-sound-toggle]");
    const label = $("[data-sound-label]");
    if (!video || !soundButton) return;

    let userVolume = 1;
    let soundWanted = false;
    const videoPath = site.heroVideo || "";
    video.poster = site.heroPoster || "";
    video.muted = true;
    video.volume = 0;
    video.preload = "auto";
    if (videoPath) {
      video.src = videoPath;
      video.load();
    }

    const updateLabel = (state) => {
      if (!label) return;
      if (!videoPath) label.textContent = "Media";
      else if (state === "on") label.textContent = "Sound On";
      else label.textContent = "Sound Off";
    };

    const fadeByScroll = () => {
      if (!video.duration && !video.src) return;
      const heroHeight = Math.max(window.innerHeight, 1);
      const progress = Math.min(1, Math.max(0, window.scrollY / heroHeight));
      video.volume = soundWanted ? Math.max(0, userVolume * (1 - progress)) : 0;
    };

    const playHero = async () => {
      try {
        video.muted = !soundWanted;
        video.volume = soundWanted ? userVolume : 0;
        await video.play();
        updateLabel(soundWanted ? "on" : "off");
      } catch (error) {
        try {
          video.muted = true;
          video.volume = 0;
          await video.play();
        } catch (mutedError) {
          // Keep the static poster if the browser refuses autoplay entirely.
        }
        soundWanted = false;
        updateLabel("off");
      }
    };

    if (video.src) playHero();
    updateLabel("off");

    soundButton.addEventListener("click", async () => {
      soundWanted = !soundWanted;
      try {
        if (video.src) {
          video.muted = !soundWanted;
          video.volume = soundWanted ? userVolume : 0;
          await video.play();
        }
        updateLabel(soundWanted ? "on" : "off");
      } catch (error) {
        soundWanted = false;
        video.muted = true;
        video.volume = 0;
        updateLabel("off");
      }
    });

    window.addEventListener("scroll", fadeByScroll, { passive: true });
  }

  function setupWheelHorizontal(root = document) {
    $$("[data-wheel-horizontal]", root).forEach((gallery) => {
      if (gallery.dataset.wheelBound === "true") return;
      gallery.dataset.wheelBound = "true";
      gallery.addEventListener(
        "wheel",
        (event) => {
          const canScrollLeft = gallery.scrollLeft > 0;
          const canScrollRight = gallery.scrollLeft + gallery.clientWidth < gallery.scrollWidth - 1;
          const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
          const scrollingNext = delta > 0;
          const scrollingPrev = delta < 0;
          if ((scrollingNext && canScrollRight) || (scrollingPrev && canScrollLeft)) {
            event.preventDefault();
            gallery.scrollLeft += delta;
          }
        },
        { passive: false }
      );

      let isDragging = false;
      let startX = 0;
      let startScroll = 0;
      gallery.addEventListener("pointerdown", (event) => {
        if (event.target.closest("a, button")) return;
        isDragging = true;
        startX = event.clientX;
        startScroll = gallery.scrollLeft;
        gallery.setPointerCapture(event.pointerId);
        gallery.classList.add("is-dragging");
      });
      gallery.addEventListener("pointermove", (event) => {
        if (!isDragging) return;
        gallery.scrollLeft = startScroll - (event.clientX - startX);
      });
      gallery.addEventListener("pointerup", () => {
        isDragging = false;
        gallery.classList.remove("is-dragging");
      });
      gallery.addEventListener("pointercancel", () => {
        isDragging = false;
        gallery.classList.remove("is-dragging");
      });
    });
  }

  function setupGalleryControls() {
    $$(".horizontal-gallery-shell").forEach((shell) => {
      const gallery = $("[data-wheel-horizontal]", shell);
      if (!gallery) return;
      const dots = $$("[data-gallery-dots] span", shell);
      const updateDots = () => {
        if (!dots.length) return;
        const maxScroll = Math.max(gallery.scrollWidth - gallery.clientWidth, 1);
        const active = Math.min(dots.length - 1, Math.round((gallery.scrollLeft / maxScroll) * (dots.length - 1)));
        dots.forEach((dot, index) => dot.classList.toggle("is-active", index === active));
      };

      $$("[data-gallery-scroll]", shell).forEach((button) => {
        button.addEventListener("click", () => {
          const direction = Number(button.dataset.galleryScroll || 1);
          gallery.scrollBy({ left: direction * gallery.clientWidth * 0.82, behavior: "smooth" });
        });
      });

      gallery.addEventListener("scroll", updateDots, { passive: true });
      updateDots();
    });
  }

  function setupReveal() {
    const items = $$(".reveal");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
    );
    items.forEach((item) => observer.observe(item));
  }

  function revealNow(root) {
    $$(".reveal", root).forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index * 0.035, 0.2)}s`;
      requestAnimationFrame(() => item.classList.add("is-visible"));
    });
  }

  function setupWorkflowAnimation() {
    const workflows = $$(".workflow");
    if (!workflows.length) return;
    const light = (workflow) => {
      workflow.style.setProperty("--workflow-progress", "1");
      $$(".workflow-step", workflow).forEach((step, index) => {
        window.setTimeout(() => step.classList.add("is-lit"), index * 130);
      });
    };
    if (!("IntersectionObserver" in window)) {
      workflows.forEach(light);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          light(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.42 }
    );
    workflows.forEach((workflow) => observer.observe(workflow));
  }

  function setupModal() {
    const modal = $("[data-video-modal]");
    if (!modal) return;
    const title = $("[data-modal-title]", modal);
    const body = $("[data-modal-body]", modal);
    const isPlayableFile = (url = "") => /\.(mp4|webm|ogg)(\?.*)?$/i.test(url) || !/^https?:\/\//i.test(url);

    const close = () => {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      body.innerHTML = "";
      document.body.style.overflow = "";
    };

    const open = (id) => {
      const work = id === "hero" || id === "intro" ? null : byId(id);
      const modalTitle = work
        ? `${work.title} / ${work.titleCn}`
        : id === "intro"
          ? "Works Overview Reel / 作品速览混剪"
          : "Dragon Covenant Finale / 龙之契终章";
      title.textContent = modalTitle;
      if (work && work.type === "exhibition-board" && work.coverUrl) {
        body.innerHTML = `
          <div class="lightbox-slot">
            <img src="${escapeHTML(work.coverUrl)}" alt="${escapeHTML(modalTitle)}">
          </div>
        `;
      } else if (work && work.embedUrl) {
        body.innerHTML = `<iframe class="embed-slot" src="${escapeHTML(work.embedUrl)}" title="${escapeHTML(modalTitle)}" allowfullscreen></iframe>`;
      } else if (work && work.videoUrl && isPlayableFile(work.videoUrl)) {
        body.innerHTML = `<video class="embed-slot" src="${escapeHTML(work.videoUrl)}" poster="${escapeHTML(work.coverUrl || "")}" controls autoplay playsinline preload="auto"></video>`;
      } else if (work && (work.externalUrl || work.videoUrl)) {
        const url = work.externalUrl || work.videoUrl;
        body.innerHTML = `
          <div class="embed-slot external-slot">
            <div>
              <strong>Open Project Video / 打开项目视频</strong>
              <span>${escapeHTML(work.videoType === "feishu" ? "This series is collected in the Feishu video archive." : "This video opens in an external player.")}</span>
              <a class="button primary" href="${escapeHTML(url)}" target="_blank" rel="noopener">Open Link / 打开链接</a>
            </div>
          </div>
        `;
      } else if (id === "hero" && site.heroVideo) {
        const finaleVideo = findWork("dragon-covenant-finale")?.videoUrl || site.heroVideo;
        body.innerHTML = `<video class="embed-slot" src="${escapeHTML(finaleVideo)}" poster="${escapeHTML(site.heroPoster || "")}" controls autoplay playsinline preload="auto"></video>`;
      } else if (id === "intro" && site.introVideo) {
        body.innerHTML = `<video class="embed-slot" src="${escapeHTML(site.introVideo)}" poster="assets/covers/horizontal/quick-preview-cover.png" controls autoplay playsinline preload="auto"></video>`;
      } else {
        body.innerHTML = `
          <div class="embed-slot">
            <div>
              <strong>Media Preview / 媒体预览</strong>
              <span>${work ? "This project is presented through its cover and case details." : "Intro media is available on request."}</span>
            </div>
          </div>
        `;
      }
      const modalVideo = $("video.embed-slot", body);
      if (modalVideo) {
        modalVideo.volume = 1;
        modalVideo.play().catch(() => {
          // The controls remain visible if the browser asks for one more explicit play tap.
        });
      }
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    };

    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-open-video]");
      if (trigger) {
        event.preventDefault();
        open(trigger.dataset.openVideo);
        return;
      }
      if (event.target.matches("[data-modal-close], .modal-backdrop")) close();
    });

    document.addEventListener("keydown", (event) => {
      const trigger = event.target.closest("[data-open-video]");
      if (trigger && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        open(trigger.dataset.openVideo);
        return;
      }
      if (event.key === "Escape" && modal.classList.contains("is-open")) close();
    });
  }

  function setupNav() {
    const toggle = $("[data-nav-toggle]");
    const links = $("[data-nav-links]");
    if (toggle && links) {
      toggle.addEventListener("click", () => {
        const isOpen = links.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(isOpen));
      });
      links.addEventListener("click", (event) => {
        if (event.target.closest("a")) {
          links.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    }

    const file = window.location.pathname.split("/").pop() || "index.html";
    const hash = window.location.hash;
    let activeSet = false;
    $$(".nav-links a").forEach((link) => {
      const href = link.getAttribute("href") || "";
      const targetFile = href.split("#")[0].split("?")[0] || "index.html";
      const targetHash = href.includes("#") ? `#${href.split("#")[1]}` : "";
      let isActive = false;
      if (file === "index.html" && targetFile === "index.html") {
        isActive = hash ? targetHash === hash : !targetHash;
      } else {
        isActive = !hash && targetFile === file && !targetHash;
      }
      if (isActive && !activeSet) {
        link.classList.add("is-active");
        activeSet = true;
      } else {
        link.classList.remove("is-active");
      }
    });
  }

  function init() {
    initSiteConfig();
    renderHighlights();
    renderHomeFeatured();
    renderTimeline();
    renderCategories();
    renderWorkflow("[data-workflow]", workflowSteps);
    renderWorkflow("[data-vibe-workflow]", vibeWorkflowSteps, true);
    renderWorksPage();
    renderCaseStudyPage();
    setupNav();
    setupModal();
    setupHeroVideo();
    setupWheelHorizontal();
    setupGalleryControls();
    setupWorkflowAnimation();
    setupReveal();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
