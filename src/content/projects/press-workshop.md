---
title: Press Workshop
slug: press-workshop
sort_order: 2
section: projects
status: published
authored_by: rishi
reviewed_by: rishi
created: 2026-05-20T20:30:00Z
published: 2026-05-22T04:53:00Z
revision: 4
last_updated: 2026-05-29T00:00:00Z
tags: [fiction, amazon-kdp, multi-agent, publishing, pipeline, magech]
project_name: Press Workshop
project_status: active
tagline: "Can a 7-agent crew generate, edit, and publish commercially viable novels? Two books shipped. Here's what we learned."
problem: "Writing commercially viable long-form fiction requires consistent voice, structural discipline, and continuity tracking that breaks down fast in a single LLM context. Can you distribute that work across specialized agents without losing coherence — and does the output meet a commercial publishing bar?"
approach: "Seven agents, each owning one stage of the pipeline, reading and writing to disk rather than passing manuscripts through conversation. The disk-based workflow is what makes 80,000-word outputs possible. Coordination, editorial quality, and the gap between internal approval and commercial readiness were the problems that took the most iteration to close."
stack: [OpenClaw, Anthropic SDK, Amazon KDP, Calibre, Discord, Python, Markdown]
metrics:
  - label: "POC novel"
    value: "~80k words · 5 publisher rounds · archived"
  - label: "Winters Bay"
    value: "85,013 words · literary thriller · packaged"
  - label: "Mountain Haven"
    value: "81,141 words · contemporary romance · 3 rounds"
postmortem_notes: null
---

A single LLM context window breaks at novel length. At 80,000 words, continuity fails and voice drifts — not because the model can't write, but because it can't hold 300 pages in context at once. The question was whether a multi-agent pipeline, with each agent owning one stage and reading from disk rather than conversation, could produce fiction good enough to publish and sell on Amazon KDP.

Two books shipped. Read both below.

<div class="book-shelf">
  <div class="book-card">
    <div class="book-meta">
      <span class="book-genre">Literary Thriller</span>
      <span class="book-words">85,013 words</span>
    </div>
    <h3 class="book-title">Winters Bay</h3>
    <p class="book-blurb">Nora Cole became an FBI profiler to understand the kind of man who kills women like her mother. Fifteen years after fleeing Winters Bay, she returns for her mother's funeral — officially an accident, officially a conclusion too convenient to believe.</p>
    <button class="epub-open-btn" data-file="/epub/winters-bay.epub" data-title="Winters Bay">Read the epub</button>
  </div>
  <div class="book-card">
    <div class="book-meta">
      <span class="book-genre">Contemporary Romance</span>
      <span class="book-words">81,141 words</span>
    </div>
    <h3 class="book-title">Mountain Haven</h3>
    <p class="book-blurb">Miranda Castillo inherited a failing diner in a town she left at eighteen. Jake Mercer is the contractor who keeps showing up with tools and grief metaphors. A small-town romance about the things you build when you stop running from what broke you.</p>
    <button class="epub-open-btn" data-file="/epub/mountain-haven.epub" data-title="Mountain Haven">Read the epub</button>
  </div>
</div>

<div id="epub-modal" aria-hidden="true">
  <div id="epub-modal-backdrop"></div>
  <div id="epub-modal-inner">
    <div id="epub-modal-header">
      <span id="epub-modal-title"></span>
      <button id="epub-modal-close" aria-label="Close reader">✕</button>
    </div>
    <div id="epub-modal-toolbar">
      <button class="epub-nav-btn" id="epub-btn-prev">← Prev</button>
      <span id="epub-progress"></span>
      <button class="epub-nav-btn" id="epub-btn-next">Next →</button>
    </div>
    <div id="epub-viewer-wrap">
      <div id="epub-loading">opening book…</div>
      <div id="epub-error">Could not load the epub. Check the file path.</div>
      <div id="epub-viewer"></div>
    </div>
  </div>
</div>

<style>
.book-shelf {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin: 2rem 0 2.5rem;
  max-width: 600px;
}
.book-card {
  background: rgba(26, 23, 20, 0.7);
  backdrop-filter: blur(20px) saturate(1.4);
  border: 1px solid rgba(250, 243, 224, 0.08);
  box-shadow: inset 0 1px 0 rgba(250, 243, 224, 0.06);
  border-radius: 10px;
  padding: 1.4rem 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.book-meta {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}
.book-genre {
  font-family: 'JetBrains Mono', 'Menlo', monospace;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: #9d8fd0;
}
.book-words {
  font-family: 'JetBrains Mono', 'Menlo', monospace;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #7a7060;
}
.book-title {
  font-size: 1.35rem;
  color: #faf3e0;
  margin: 0;
  line-height: 1.2;
}
.book-blurb {
  font-size: 0.88rem;
  color: #8c8270;
  line-height: 1.6;
  flex: 1;
  margin: 0;
  max-width: none;
}
.epub-open-btn {
  display: inline-block;
  margin-top: 0.75rem;
  padding: 0.5rem 1rem;
  background: rgba(74, 58, 111, 0.3);
  border: 1px solid rgba(122, 108, 176, 0.25);
  box-shadow: inset 0 1px 0 rgba(157, 143, 208, 0.08);
  border-radius: 5px;
  color: #9d8fd0;
  font-size: 0.8rem;
  font-family: 'JetBrains Mono', 'Menlo', monospace;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  align-self: flex-start;
}
.epub-open-btn:hover {
  background: rgba(74, 58, 111, 0.5);
  color: #c4b8e8;
}

/* Modal */
#epub-modal {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 9999;
  align-items: center;
  justify-content: center;
}
#epub-modal[aria-hidden="false"] {
  display: flex;
}
#epub-modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(10, 9, 8, 0.88);
  backdrop-filter: blur(8px);
}
#epub-modal-inner {
  position: relative;
  z-index: 1;
  width: min(900px, 94vw);
  height: min(88vh, 820px);
  background: #0f0d0b;
  border: 1px solid rgba(250, 243, 224, 0.10);
  box-shadow: inset 0 1px 0 rgba(250, 243, 224, 0.07),
              0 32px 80px rgba(0, 0, 0, 0.7);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: modal-in 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes modal-in {
  from { opacity: 0; transform: translateY(14px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
#epub-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 1rem;
  border-bottom: 1px solid rgba(45, 38, 32, 0.8);
  flex-shrink: 0;
  background: rgba(18, 16, 14, 0.95);
}
#epub-modal-title {
  font-family: 'JetBrains Mono', 'Menlo', monospace;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: #4a4439;
}
#epub-modal-close {
  background: none;
  border: none;
  color: #4a4439;
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0.25rem 0.4rem;
  border-radius: 3px;
  line-height: 1;
  transition: color 0.15s;
}
#epub-modal-close:hover { color: #faf3e0; }
#epub-modal-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid rgba(45, 38, 32, 0.6);
  flex-shrink: 0;
  background: rgba(15, 13, 11, 0.95);
  gap: 1rem;
}
.epub-nav-btn {
  background: rgba(74, 58, 111, 0.25);
  border: 1px solid rgba(122, 108, 176, 0.2);
  color: #9d8fd0;
  padding: 0.3rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  font-family: 'JetBrains Mono', 'Menlo', monospace;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
}
.epub-nav-btn:hover { background: rgba(74, 58, 111, 0.45); color: #c4b8e8; }
.epub-nav-btn:disabled { opacity: 0.3; cursor: default; }
#epub-progress {
  font-size: 0.72rem;
  color: #4a4439;
  font-family: 'JetBrains Mono', 'Menlo', monospace;
  flex: 1;
  text-align: center;
}
#epub-viewer-wrap {
  flex: 1;
  position: relative;
  overflow: hidden;
}
#epub-viewer {
  width: 100%;
  height: 100%;
}
#epub-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0908;
  color: #4a4439;
  font-size: 0.85rem;
  font-family: 'JetBrains Mono', 'Menlo', monospace;
  letter-spacing: 0.12em;
  z-index: 2;
}
#epub-loading.hidden { display: none; }
#epub-error {
  position: absolute;
  inset: 0;
  display: none;
  align-items: center;
  justify-content: center;
  background: #0a0908;
  color: #9d8fd0;
  font-size: 0.9rem;
  text-align: center;
  padding: 2rem;
  z-index: 2;
}
</style>

<script type="module">
// Load epubjs and jszip from CDN, then wire up the modal.
// Using type="module" so Astro treats this as a module script and
// defers execution until after the DOM is ready.
async function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

await loadScript('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js');
await loadScript('https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js');

const modal    = document.getElementById('epub-modal');
const titleEl  = document.getElementById('epub-modal-title');
const closeBtn = document.getElementById('epub-modal-close');
const backdrop = document.getElementById('epub-modal-backdrop');
const loading  = document.getElementById('epub-loading');
const errorEl  = document.getElementById('epub-error');
const viewerEl = document.getElementById('epub-viewer');
const progressEl = document.getElementById('epub-progress');
const btnPrev  = document.getElementById('epub-btn-prev');
const btnNext  = document.getElementById('epub-btn-next');

// Portal modal to body so it escapes any ancestor stacking context
// (e.g. .essay with position + z-index) and sits above the sticky nav.
document.body.appendChild(modal);

let currentBook = null;
let currentRendition = null;

function resetViewer() {
  if (currentRendition) {
    try { currentRendition.destroy(); } catch(e) {}
    currentRendition = null;
  }
  if (currentBook) {
    try { currentBook.destroy(); } catch(e) {}
    currentBook = null;
  }
  viewerEl.innerHTML = '';
  loading.classList.remove('hidden');
  errorEl.style.display = 'none';
  progressEl.textContent = '';
}

function openEpub(file, title) {
  resetViewer();
  titleEl.textContent = title;
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  const book = window.ePub(file);
  currentBook = book;

  const rendition = book.renderTo('epub-viewer', {
    width:   '100%',
    height:  '100%',
    spread:  'none',
    flow:    'paginated',
    manager: 'default',
  });
  currentRendition = rendition;

  rendition.themes.register('dark', {
    'html': { 'background': '#0a0908 !important', 'color': '#faf3e0 !important' },
    'body': {
      'background': '#0a0908 !important',
      'color': '#faf3e0 !important',
      'font-family': 'Georgia, serif !important',
      'line-height': '1.72 !important',
      'padding': '2rem 2.5rem !important',
      'max-width': '680px',
      'margin': '0 auto !important',
    },
    'p':          { 'color': '#e8dfc8 !important', 'margin-bottom': '1.1em !important' },
    'h1, h2, h3': { 'color': '#faf3e0 !important', 'margin-top': '1.8em !important' },
    'a':          { 'color': '#9d8fd0 !important' },
  });
  rendition.themes.select('dark');

  rendition.display().then(() => {
    loading.classList.add('hidden');
  }).catch(() => {
    loading.classList.add('hidden');
    errorEl.style.display = 'flex';
  });

  book.ready.then(() => book.locations.generate(1000)).then(updateProgress);
  rendition.on('relocated', updateProgress);

  function updateProgress() {
    const loc = rendition.currentLocation();
    if (!loc || !loc.start) return;
    const pct = book.locations.percentageFromCfi(loc.start.cfi);
    if (pct !== undefined) progressEl.textContent = Math.round(pct * 100) + '%';
  }
}

function closeModal() {
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  resetViewer();
}

document.querySelectorAll('.epub-open-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    openEpub(btn.dataset.file, btn.dataset.title);
  });
});

closeBtn.addEventListener('click', closeModal);
backdrop.addEventListener('click', closeModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

btnPrev.addEventListener('click', () => currentRendition && currentRendition.prev());
btnNext.addEventListener('click', () => currentRendition && currentRendition.next());
</script>

## How it works

Seven agents, one stage each. Disk-based handoffs — no agent ever holds the full manuscript in context.

**Radar** surfaces genre trends, pitches concepts. **Architect** builds the complete structural blueprint before Ghost writes a word: chapter-by-chapter outline, character profiles, series bible. **Ghost** writes the manuscript in batches of 3–5 chapters, resetting context between batches — the disk-read-from-outline pattern is what makes 80,000 words possible. **Mirror** runs developmental and line edits file by file. **Lens** polishes: AI pattern elimination, final grammar. **Press** packages for KDP — metadata, blurb variants, front/back matter. **Shelf** maintains continuity state throughout: character tracker, timeline, unresolved threads.

## What broke in the POC

*Everything She Forgot* (~80k words) completed the full pipeline, then went through five publisher rounds. Verdict: "conditional yes — 2–3 passes from ready." Two failures surfaced.

**Handoff failure.** Ghost announcing "handed off to Mirror" was text describing intent. Mirror's session had no access to it. Every pipeline transition required a manual ping — not once, every round, every transition. Fix: `sessions_send` now delivers handoffs directly to the receiving agent with revision summary and changed files. Manual ping is the fallback, not the mechanism.

**Verification gap.** Round 4: Mirror and Lens assessed the manuscript as "succeeds brilliantly." Publisher response: "NOT READY AS-IS." Of 6 fixes Ghost claimed, the publisher confirmed 0 resolved. Mirror was approving revision *notes*, not verifying the manuscript. Fix: verification gates now require Mirror to grep the manuscript files for any term Ghost claimed to remove. Claimed fix ≠ confirmed fix. The editorial bar was also recalibrated against senior developmental editor standards — the previous bar was too lenient for commercial publishing.

## Results

With those fixes in place:

**Mountain Haven** — 3 rounds, 6 editorial issues flagged in Round 2, all 6 confirmed resolved via manuscript verification in Round 3. Zero new issues introduced. Pipeline closed its own loop.

**Winters Bay** — 85,013 words, dual-POV literary thriller, 35 chapters. Mirror Grade A, clean Lens scan. No continuity failures across the full manuscript.

The pipeline works. Whether readers buy the output is the open question, and it's the only one the market can answer.
