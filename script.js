// ==========================================================
// PERSONAL WEBSITE TEMPLATE — MAGAZINE / "ISSUE 01" LAYOUT
// Theme switch · folio indicator · scroll reveals ·
// FLIP filtering · skill cross-links · figure plates · copy
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
  const html = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Masthead load animation (one-time) ---
  if (!reducedMotion) html.classList.add('anim');

  // --- Theme switch (pre-paint theme set inline in <head>) ---
  const themeToggle = document.getElementById('themeToggle');
  themeToggle.setAttribute('aria-checked', String(html.getAttribute('data-theme') === 'ink'));
  themeToggle.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'ink' ? 'paper' : 'ink';
    html.classList.add('theming');
    html.setAttribute('data-theme', next);
    themeToggle.setAttribute('aria-checked', String(next === 'ink'));
    try { localStorage.setItem('aks-theme', next); } catch (e) { /* private mode */ }
    setTimeout(() => html.classList.remove('theming'), 300);
  });

  // --- Running header + scroll progress ---
  const header = document.getElementById('runningHeader');
  const progress = document.getElementById('scrollProgress');
  const masthead = document.querySelector('.masthead');
  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      header.classList.toggle('visible', y > masthead.offsetHeight * 0.72);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // --- Folio indicator ---
  const folio = document.getElementById('folioIndicator');
  const folioSections = document.querySelectorAll('[data-folio]');
  const folioIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) folio.textContent = entry.target.dataset.folio;
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  folioSections.forEach((s) => folioIO.observe(s));

  // --- Scroll reveals ---
  document.querySelectorAll('.reveal').forEach((el) => {
    const inner = document.createElement('span');
    inner.className = 'reveal-inner';
    while (el.firstChild) inner.appendChild(el.firstChild);
    el.appendChild(inner);
  });

  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal, .rise').forEach((el) => revealIO.observe(el));

  // --- Generative figure plates (deterministic per project) ---
  const PLATE_CHARS = ['·', '▘', '▝', '▖', '▗', '▚', '▞', '▌', '█', ' ', ' ', ' '];
  function seeded(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return () => {
      h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
      return ((h >>> 0) % 1000) / 1000;
    };
  }
  document.querySelectorAll('.plate').forEach((plate) => {
    const rand = seeded(plate.dataset.plate || 'plate');
    const rows = 7, cols = 24;
    let out = '';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = rand();
        if (v > 0.94) {
          out += '<b>' + PLATE_CHARS[Math.floor(rand() * 8)] + '</b>';
        } else {
          out += PLATE_CHARS[Math.floor(v * PLATE_CHARS.length)];
        }
      }
      if (r < rows - 1) out += '\n';
    }
    plate.innerHTML = out;
  });

  // --- Project directory: filtering (category + stack) with FLIP ---
  const items = Array.from(document.querySelectorAll('.work-item'));
  const chips = Array.from(document.querySelectorAll('.chip[data-filter]'));
  const stackChip = document.getElementById('stackChip');
  const countEl = document.getElementById('filterCount');
  const total = items.length;

  // live counts on chips
  chips.forEach((chip) => {
    const f = chip.dataset.filter;
    const n = f === 'all' ? total : items.filter((it) => it.dataset.cat === f).length;
    chip.querySelector('.chip-count').textContent = String(n).padStart(2, '0');
  });

  function visibleItems() {
    return items.filter((it) => !it.hasAttribute('hidden'));
  }

  const flipTimers = new WeakMap();

  function applyFilter(pred) {
    // cancel any in-flight FLIP cleanup before measuring, so rapid
    // re-filters measure resting positions, not mid-transition ones
    items.forEach((it) => {
      const t = flipTimers.get(it);
      if (t !== undefined) {
        clearTimeout(t);
        flipTimers.delete(it);
      }
      it.classList.remove('flip-move');
      it.style.transform = '';
      it.style.opacity = '';
    });

    const first = new Map(visibleItems().map((it) => [it, it.getBoundingClientRect().top]));
    items.forEach((it) => {
      if (pred(it)) it.removeAttribute('hidden');
      else it.setAttribute('hidden', '');
    });
    const shown = visibleItems();
    countEl.textContent = `${String(total).padStart(2, '0')} PROJECTS / ${String(shown.length).padStart(2, '0')} SHOWN`;

    if (!reducedMotion) {
      shown.forEach((it) => {
        const before = first.get(it);
        if (before === undefined) {
          it.style.opacity = '0';
          requestAnimationFrame(() => {
            it.classList.add('flip-move');
            it.style.opacity = '1';
            flipTimers.set(it, setTimeout(() => { it.classList.remove('flip-move'); it.style.opacity = ''; flipTimers.delete(it); }, 320));
          });
          return;
        }
        const delta = before - it.getBoundingClientRect().top;
        if (Math.abs(delta) < 2) return;
        it.style.transform = `translateY(${delta}px)`;
        requestAnimationFrame(() => {
          it.classList.add('flip-move');
          it.style.transform = '';
          flipTimers.set(it, setTimeout(() => { it.classList.remove('flip-move'); flipTimers.delete(it); }, 320));
        });
      });
    }
  }

  function setActiveChip(activeChip) {
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c === activeChip)));
  }

  function filterByCategory(cat, updateHash = true) {
    stackChip.hidden = true;
    setActiveChip(chips.find((c) => c.dataset.filter === cat) || chips[0]);
    applyFilter((it) => cat === 'all' || it.dataset.cat === cat);
    if (updateHash) {
      history.replaceState(null, '', cat === 'all' ? '#work' : `#work=${cat}`);
    }
  }

  function filterByStack(token, label, updateHash = true) {
    setActiveChip(null);
    stackChip.hidden = false;
    stackChip.textContent = `STACK: ${label} ✕`;
    stackChip.setAttribute('aria-label', `Clear stack filter: ${label}`);
    applyFilter((it) => (` ${it.dataset.stack} `).includes(` ${token} `));
    if (updateHash) history.replaceState(null, '', `#work=stack:${token}`);
  }

  chips.forEach((chip) => {
    chip.addEventListener('click', () => filterByCategory(chip.dataset.filter));
  });
  stackChip.addEventListener('click', () => {
    filterByCategory('all');
    chips[0].focus(); // the chip that had focus just got hidden
  });

  // --- Skills: live counts + cross-link into the index ---
  document.querySelectorAll('button.skill').forEach((btn) => {
    const token = btn.dataset.skill;
    const label = btn.textContent.trim();
    const n = items.filter((it) => (` ${it.dataset.stack} `).includes(` ${token} `)).length;
    const count = document.createElement('span');
    count.className = 'skill-count';
    count.textContent = n > 0 ? `USED IN ${String(n).padStart(2, '0')}` : '—';
    btn.appendChild(count);
    if (n === 0) {
      btn.disabled = true;
      btn.classList.add('skill-plain');
      return;
    }
    btn.addEventListener('click', () => {
      filterByStack(token, label);
      document.getElementById('work').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    });
  });

  // --- Restore filter / open project from URL hash ---
  (function initFromHash() {
    let h;
    try {
      h = decodeURIComponent(location.hash.slice(1));
    } catch (e) {
      h = ''; // malformed percent-encoding in a shared link
    }
    if (h.startsWith('work=stack:')) {
      const token = h.slice('work=stack:'.length);
      const btn = document.querySelector(`button.skill[data-skill="${CSS.escape(token)}"]`);
      if (btn && !btn.disabled) filterByStack(token, btn.firstChild.textContent.trim(), false);
    } else if (h.startsWith('work=')) {
      const cat = h.slice('work='.length);
      if (chips.some((c) => c.dataset.filter === cat)) filterByCategory(cat, false);
    } else if (h.startsWith('p-')) {
      const row = document.getElementById(h);
      if (row) row.setAttribute('open', '');
    }
  })();

  // --- Copy email ---
  const copyBtn = document.getElementById('copyEmail');
  const copyStatus = document.getElementById('copyStatus');
  let copyTimer;
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(copyBtn.dataset.email);
      clearTimeout(copyTimer);
      copyBtn.textContent = 'COPIED ✓';
      copyBtn.classList.add('copied');
      copyStatus.textContent = 'Email copied to clipboard';
      copyTimer = setTimeout(() => {
        copyBtn.textContent = 'COPY';
        copyBtn.classList.remove('copied');
        copyStatus.textContent = '';
      }, 1600);
    } catch (e) {
      location.href = 'mailto:' + copyBtn.dataset.email;
    }
  });
});
