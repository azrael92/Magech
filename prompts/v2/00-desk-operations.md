# Magech Editorial Desk — Operations Manual

**For:** OpenClaw operator (Rishi) and the eight agents that run the Magech editorial desk.

This document is the master spec. Each agent has its own prompt in this directory; this manual explains how they work together.

---

## The desk in one paragraph

Magech is a publication, not a project. Publications have editorial cadences, not delivery deadlines, and the right organization is a small editorial desk. Magech's desk is eight agents: one Editor (the only one who talks to Rishi), three Writers (one per section: Negative Space, Projects, Overview), one Skeptic, one Fact-checker, one Copy Desk, and one Production agent who handles the technical pipeline from Git to Cloudflare. State lives in the Git repo, not in agent memory. The Editor is the contract surface; everything routes through them.

The Projects section absorbs what used to be called Research: every Project ends with a `## Learnings` section that captures what the build taught about the problem. The reasoning is that Rishi is not a scientist; questions about why things don't exist get answered by building them, and the learnings are a first-class part of the project, not a separate genre.

---

## The eight agents

| # | File | Role | Talks to Rishi? |
|---|---|---|---|
| 1 | `01-editor.md` | **Editor** — commissions, triages, runs cadence, owns Discord | YES (only one) |
| 2 | `02-skeptic.md` | **Skeptic** — red-teams every draft | No |
| 3 | `03-fact-checker.md` | **Fact-checker** — verifies sources, metrics, dated claims | No |
| 4 | `04-copy-desk.md` | **Copy Desk** — final pass, schema, formatting | No |
| 5 | `05-production.md` | **Production** — Git, Cloudflare, build verification | No |
| 6 | `06-negative-space-writer.md` | **NS Writer** — monthly editorial essays | No |
| 7 | `08-projects-writer.md` | **Projects Writer** — build log; owns Learnings discipline | No |
| 8 | `09-overview-writer.md` | **Overview Writer** — whoami/whyamihere/whyarewehere (requires interviews via Editor) | Only when Editor opens the channel |

Plus the shared documents:
- `prompts/style-guide.md` — voice rules every agent operates under
- `prompts/brief-template.md` — the form Editor uses to commission Writers
- `docs/content-schemas.md` — contracts for what each piece's frontmatter must contain
- `src/styles/tokens.css` — design system (Amethyst primary, Fraunces SOFT 30, locked)

---

## The state machine

Every piece is in exactly one of these states. Transitions are gated and logged.

```
                       commissioned
                            ↓
                         drafted        ← (kicked back by Skeptic)
                            ↓
                        critiqued       ← (kicked back by Fact-checker)
                            ↓
                      fact-checked      ← (kicked back by Copy Desk)
                            ↓
                      copy-edited
                            ↓
                    staged-for-rishi    ← (Rishi reacts ❌ or 💬)
                            ↓
                        published       ← (Production deploys)
                            ↓
                        retired         (rare, Rishi only)
```

State is tracked in two places:

1. **The frontmatter of each markdown file** — `status: drafted` etc.
2. **`state-log.md`** at the repo root — append-only log of every state transition with timestamp, agent, piece-id, reason

Production reads the log to know what to deploy. The Editor reads it to triage. Writers read it to know if their work has moved forward.

---

## The handoff flow

```
                       ┌─────────────────────┐
                       │ Rishi in #press-     │
                       │ workshop (Discord)   │
                       └───────────┬──────────┘
                                   ↕
                       ┌─────────────────────┐
                       │     EDITOR           │
                       │ (contract surface)   │
                       └───┬──────────────┬───┘
                           │              │
                           ↓              ↑
        ┌──────────────────────┐    ┌─────────────────┐
        │ Writers (3)          │    │ Skeptic         │
        │ NS · Projects ·       │←──→│ Fact-checker    │
        │ Overview              │    │ Copy Desk       │
        └──────────────────────┘    └────────┬────────┘
                                              ↓
                                  ┌─────────────────┐
                                  │  PRODUCTION      │
                                  │  Git + Cloudflare│
                                  └────────┬────────┘
                                           ↓
                                  ┌─────────────────┐
                                  │   magech.ai     │
                                  └─────────────────┘
```

**Key rules:**
- Writers don't talk to each other. Cross-section references are coordinated by the Editor.
- Skeptic, Fact-checker, Copy Desk don't talk to each other. They each report to the Editor.
- Production doesn't talk to anyone except the Editor. It receives instructions and reports results.
- Only the Editor talks to Rishi.

---

## The Discord protocol (`#press-workshop`)

Every Editor message uses a prefix. Rishi triages by scanning prefixes and reacts with emojis where possible.

### Prefixes

| Prefix | Use | Rishi's response shape |
|---|---|---|
| 📝 **Brief** | Proposing a new piece, asking for go/no-go | ✅ approve / ❌ kill / 💬 notes |
| 🔍 **Interview** | Overview Writer needs fresh material | Free-form text |
| 👁️ **Review** | Draft staged for final read | ✅ ship / ❌ kill / 💬 send back |
| 🚩 **Block** | Desk can't decide, needs input | Free-form answer |
| ✅ **Shipped** | Confirmation a piece is live | No response needed |
| 📅 **Cadence** | Calendar reminder | ✅ commission / ❌ skip / 💬 discuss |
| ❓ **Question** | Non-blocking clarification | Free-form, can wait |

### Review request template (the most important Editor message)

```
👁️ Review · <piece-id> · <title>

Section: <Negative Space | Projects | Overview>
Length: <words> · ~<minutes> min
Path: <Writer> → Skeptic → Fact-checker → Copy Desk → you

Brief summary: <2-3 sentences. What it does, not what it's about.>

Claims to verify:
- <claim 1> [source]
- <claim 2> [source]

Voice notes: <Skeptic's one-line read>
Cross-refs: <other Magech pieces this links to>
Risk flags: <anything sensitive>

[link to draft] [link to brief]

React: ✅ ship | ❌ kill | 💬 send back
```

Consistency matters. Rishi should be able to triage on his phone in 5 seconds.

---

## Trigger model

Three things start work:

### 1. Rishi commissions

Rishi pings the Editor in `#press-workshop`: *"I want a Negative Space piece on X."* Editor writes the brief, assigns it, work flows downstream.

### 2. Calendar fires

Editor maintains a publishing calendar (in `cadence.md` at repo root). When something is due:

- **Negative Space**: monthly. Editor pings 10 days before due date.
- **Projects**: when a project has news. No calendar — event-driven. (Learnings are part of every Project; not a separate cadence.)
- **Overview**: when Rishi's perspective shifts. Editor detects from Discord pattern; pings if no Overview update in 90 days.

### 3. Writer surfaces

Projects Writer flags that a project has shipped a milestone, hit a meaningful failure, or accumulated learnings worth documenting. Editor decides whether to commission.

---

## Brief format (Editor → Writer)

Editor writes briefs using `prompts/brief-template.md`. Every brief must fill in all ten fields:

1. Central claim or question (one sentence)
2. Why now (what triggered)
3. Target audience (default: senior PMs at frontier AI labs)
4. Anchor sources (3-7 primary references)
5. Anchor data (specific observations or numbers)
6. Counter-argument (strongest opposing view)
7. Cross-references (other Magech content this connects to)
8. Tone notes
9. Scope constraints (word count, structural requirements, exclusions)
10. Known risks (anything needing Rishi pre-approval)

If a field can't be filled, the brief isn't ready. The Writer can push back on a broken brief.

---

## Report formats

Each review agent produces a structured report. The Editor reads these to route work.

**Skeptic report** → see `prompts/v2/02-skeptic.md` for full format
**Fact-checker report** → see `prompts/v2/03-fact-checker.md`
**Copy Desk report** → see `prompts/v2/04-copy-desk.md`
**Production report** → see `prompts/v2/05-production.md`

Reports are working documents, not memos. Plain, specific, brief.

---

## Repository structure

```
magech-site/
├── README.md                          # this manual
├── astro.config.mjs                   # Astro framework config
├── package.json
├── .gitignore
├── state-log.md                       # append-only state transitions
├── cadence.md                         # publishing calendar
├── deploy-log.md                      # Production's deploy history
│
├── docs/
│   └── content-schemas.md             # schema contracts (Zod-compatible)
│
├── prompts/
│   ├── style-guide.md                 # voice rules (read by every agent)
│   ├── brief-template.md              # commission form
│   └── v2/
│       ├── 01-editor.md
│       ├── 02-skeptic.md
│       ├── 03-fact-checker.md
│       ├── 04-copy-desk.md
│       ├── 05-production.md
│       ├── 06-negative-space-writer.md
│       ├── 08-projects-writer.md
│       └── 09-overview-writer.md
│
├── briefs/                            # gitignored — Editor's work-in-progress briefs
├── feedback/                          # gitignored — kick-back notes
│
├── src/
│   ├── content/
│   │   ├── negative-space/
│   │   ├── projects/
│   │   └── overview/
│   ├── components/                    # Astro components — Production builds these
│   ├── layouts/
│   ├── pages/
│   ├── styles/
│   │   └── tokens.css                 # design system (locked)
│   └── assets/
│
└── public/
```

`briefs/` and `feedback/` are gitignored because they're agent working state, not site content. They coordinate the desk but don't ship to the public.

---

## Initial setup (Production's first session)

When the desk first runs against an empty repo:

1. **Production** initializes the Astro project (`npm install`, `npm create astro@latest .` if needed).
2. **Production** wires content collections from `docs/content-schemas.md` into `src/content/config.ts` with Zod schemas.
3. **Production** ports `demo.html` to Astro layouts and components, maintaining the locked aesthetic exactly.
4. **Production** sets up the GitHub repo (Editor asks Rishi for repo name and visibility).
5. **Production** connects Cloudflare Pages (Editor coordinates the OAuth/token flow with Rishi).
6. **Production** sets `magech.ai` as the custom domain.
7. **Production** deploys an initial placeholder homepage with the hero and section index. Section indexes are empty (no commissioned content yet).
8. **Production** reports ready-state to the Editor.
9. **Editor** pings Rishi: *"📅 Desk ready. Initial homepage live at magech.ai. Want to commission Issue 01 (Negative Space) or start with Overview interviews?"*

---

## What ships first (the cold-start problem)

Magech can't ship empty. But it also can't ship inflated. The cold-start sequence:

1. **Production sets up the pipeline** with a homepage scaffold (Hero, thesis, section index with empty/coming-soon states).
2. **Overview Writer interviews Rishi** through Editor for `whoami`. Drafts. Ships. (Takes ~1 day if Rishi responds same-day.)
3. **Overview Writer continues with `whyamihere` then `whyarewehere`.** (~3 days total for Overview.)
4. **Negative Space Issue 01** ("Why doesn't your AI have a face?") — Rishi drops raw observations, NS Writer expands, full desk cycle. (~3-5 days.)
5. **Projects Writer drafts skeletons** for OpenClaw, ProductClaw, Magech itself, with explicit "in progress" status and a `## Learnings` section (even if early-stage).

After ~1 week, Magech has a real homepage, three Overview pieces, one Negative Space issue, three Research entries, and three Project skeletons. That's enough to be a credible workshop, not a placeholder site.

---

## Cadence after launch

| Section | Cadence | Calendar reminder |
|---|---|---|
| Negative Space | 1 issue / month | 10 days before due date |
| Projects | Event-driven | None — agents flag when news/learnings exist |
| Overview | When perspective shifts | 90 days since `last_revised` triggers ping |

The Editor enforces cadence. The Editor does NOT commission filler to hit a cadence target. If a month has no Negative Space worth shipping, the month gets skipped, with a ❓ to Rishi proposing the skip.

---

## Voice rules (every agent reads `prompts/style-guide.md`)

Summarized:

- **Lead with the strongest thing.** No throat-clearing.
- **Short sentences are a feature.**
- **Specificity beats abstraction.**
- **The reader is smart. Stop explaining.**
- **Strong opinions, weakly held.**
- **No bow-tied endings.**
- **Acknowledge real uncertainty; never perform it.**

Banned phrases (auto-kick-back from Skeptic):
- "leverage," "synergy," "unlock," "transform," "robust," "seamless," "ecosystem"
- "In this essay, I will...", "Let's dive in", "It's worth noting"
- "Some might argue," "Studies suggest" (without naming)
- "On a deeper level," "the real question is"
- More than two em-dashes per piece

The full list is in the style guide. Skeptic enforces.

---

## The "would Rishi say this?" test

Every Writer, every Skeptic check, every Editor review request runs this:

> Read each paragraph as if Rishi were saying it at a dinner party with a senior PM hiring manager from Anthropic, Glean, or Netflix. Does it sound like him?

If no: kick back. Voice drift is the most common failure and the hardest to catch without this anchor.

---

## What never ships

- Content not reviewed by Rishi (`reviewed_by` field must equal `"rishi"`)
- Content with unverified claims
- Content authored as "by Rishi" when an agent drafted it (authorship attribution must be accurate)
- Content critical of Anthropic or current/former employers without explicit per-piece Rishi approval
- Inflated metrics or invented observations
- Code or config from private OpenClaw without Rishi's explicit approval

These are hard rules. The Editor enforces them. Violations escalate to Rishi immediately.

---

## Failure modes the desk specifically watches for

**1. Voice drift.** Skeptic's primary job. Look for vendor marketing, AI-essay tells, mission-statement creep.

**2. Editorial cowardice.** Negative Space essays that read cautiously. Push for the sharper claim.

**3. Sycophantic Projects writeups.** "Pioneering" / "innovative" / "groundbreaking" — all fail the engineer-to-engineer voice test.

**4. Missing or perfunctory Learnings in Projects.** Every Project must close with a `## Learnings` section that names what the build taught about the problem, the architecture, or the operator's own assumptions. Boilerplate ("we learned a lot") fails the voice check; specifics or kick-back.

**5. Generic-ambitious-PM voice in Overview.** Most likely failure. Anchor every revision against Rishi's actual Discord answers.

**6. Cadence creep.** Shipping less because review cycles are slow. Editor monitors. If a section is falling behind, investigate where the slowdown is.

**7. Authorship lies.** Pieces signed as "by Rishi" that an agent drafted. Critical violation.

---

## Operator notes for Rishi

**What you need to do:**

- Respond to Editor messages in `#press-workshop`. Most use emoji reactions.
- Provide raw observations when interviewed for Overview pieces.
- Drop unstructured material for Negative Space pieces (the comment scaffolding in seed files shows where).
- Make the editorial call on sensitive content (Anthropic, employers, named competitors).
- Decide if a month skips Negative Space if nothing's worth shipping.

**What you don't need to do:**

- Babysit the workflow. Editor surfaces what needs you.
- Polish prose. Writers draft; review agents critique; Copy Desk catches mechanical issues.
- Track state. State-log shows what's where.
- Manage cadence. Editor handles.
- Touch Git or Cloudflare. Production handles.

**How to commission a piece:**

> "Editor — I want a Negative Space piece on the empathic-AI script problem. The Hume Octave/EVI angle is the closest thing to a real attempt at fixing it. Want to brief that?"

Editor writes the brief, sends back for your ✅, then it's in motion.

**How to push the desk to ship faster:**

You don't. Speed comes from shorter pieces (more Project updates, fewer Negative Space) or skipping cadence cycles (skip the month). The review cycle is the value; bypassing it ships voice drift.

---

## Done definition for the whole system

The desk is operating correctly when:

- Magech.ai is live with current content
- Every published piece has `reviewed_by: "rishi"` and accurate `authored_by`
- State log is current with every transition tracked
- Discord traffic is manageable (Rishi reads ~5 messages per active day)
- Cadence is held or explicit skips are surfaced
- No voice-drift has shipped (Skeptic + Editor catch in review)
- No unsourced claims have shipped (Fact-checker catches)
- Production deploys succeed within 60 seconds of approval

If any of these fails, the desk investigates and surfaces. The system is auditable through Git history and the state log.
