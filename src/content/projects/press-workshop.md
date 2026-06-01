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
    <a class="epub-open-btn" href="/reader/?file=%2Fepub%2Fwinters-bay.epub" target="_blank" rel="noopener">Read the epub ↗</a>
  </div>
  <div class="book-card">
    <div class="book-meta">
      <span class="book-genre">Contemporary Romance</span>
      <span class="book-words">81,141 words</span>
    </div>
    <h3 class="book-title">Mountain Haven</h3>
    <p class="book-blurb">Miranda Castillo inherited a failing diner in a town she left at eighteen. Jake Mercer is the contractor who keeps showing up with tools and grief metaphors. A small-town romance about the things you build when you stop running from what broke you.</p>
    <a class="epub-open-btn" href="/reader/?file=%2Fepub%2Fmountain-haven.epub" target="_blank" rel="noopener">Read the epub ↗</a>
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
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  align-self: flex-start;
}
.epub-open-btn:hover {
  background: rgba(74, 58, 111, 0.5);
  color: #c4b8e8;
}
</style>

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
