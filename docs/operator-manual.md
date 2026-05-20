# Magech.ai — Operator's Manual

**For:** Rishi (operator) and the OpenClaw agents that maintain Magech.

This README is the single starting point. Everything else — schemas, prompts, agent definitions — is referenced from here.

---

## What Magech is

Magech is a public workshop. It's a website at magech.ai. It's authored by a hierarchy of OpenClaw agents that Rishi reviews in Discord. Content ships when Rishi approves; nothing ships otherwise.

The site has five surfaces:

| Section | Purpose | Cadence | Authoring agent |
|---|---|---|---|
| Overview | Three short pieces (whoami / whyamihere / whyarewehere) | Updated when Rishi's perspective shifts | Overview Agent |
| Negative Space | Monthly editorial essays on what the industry isn't discussing | One issue per month | Negative Space Agent |
| Research | Working notebook: trends, papers, open questions | Continuous, light cadence | Research Agent |
| Projects | Build log for OpenClaw, ProductClaw, StreamMesh, Magech itself | When a project has news | Projects Agent |
| Learning | Interactive tools (poker probability trainer coming) | Single artifact, not agent-maintained | Rishi |

A fifth agent (Orchestrator) sits above the four specialists. It commissions briefs, reviews drafts before they go to Rishi, manages publishing cadence, and handles cross-references.

---

## Repository layout

```
magech-site/
├── README.md                                # this file
├── astro.config.mjs                         # Astro framework config (to be added)
├── package.json                             # dependencies (to be added)
├── docs/
│   └── content-schemas.md                   # the contract: what each agent's output must look like
├── prompts/
│   ├── style-guide.md                       # voice rules. read by every agent.
│   ├── brief-template.md                    # format for commissioning a piece
│   ├── 00-orchestrator.md                   # master agent — coordinates the others
│   ├── 01-negative-space-agent.md           # monthly essays
│   ├── 02-research-agent.md                 # notebook entries
│   ├── 03-projects-agent.md                 # build log
│   └── 04-overview-agent.md                 # whoami / whyamihere / whyarewehere
├── src/
│   ├── content/
│   │   ├── negative-space/                  # markdown files, one per issue
│   │   ├── research/                        # markdown files, one per entry
│   │   ├── projects/                        # markdown files, one per project
│   │   └── overview/                        # markdown files, one per piece
│   ├── components/                          # Astro/React components for the site
│   ├── layouts/                             # page templates
│   ├── pages/                               # site routes
│   ├── styles/
│   │   └── tokens.css                       # the design system, single source of truth
│   └── assets/                              # images, etc.
├── public/                                  # static files served as-is
└── demo.html                                # standalone aesthetic preview (not for production)
```

---

## How a piece of content gets shipped

1. **Trigger.** Either Rishi pings the Orchestrator in Discord with a topic, or one of the section agents flags a thread that's ready for editorial treatment, or the publishing calendar fires (Negative Space monthly cycle).

2. **Brief.** The Orchestrator writes a brief using the template in `/prompts/brief-template.md`. The brief covers: working title, central claim, sources, audience, counter-argument, cross-references, tone notes, scope, and success criteria.

3. **Specialist drafts.** The relevant agent (Negative Space, Research, Projects, or Overview) drafts against the brief, following its own prompt and the universal style guide. For Overview pieces, the agent first runs a Discord interview with Rishi before drafting.

4. **Orchestrator review.** When the specialist submits a draft, the Orchestrator runs the voice check, verifies sources, checks cross-references, and runs the "would Rishi actually say this?" test. If the draft passes, it stages for Rishi. If not, it goes back to the specialist with specific notes.

5. **Discord review.** Orchestrator pings Rishi in `#magech-review` with the draft link, summary, claims to verify, and voice check status. Rishi reads, comments, approves or rejects.

6. **Publish.** On approval, the draft's frontmatter status flips from `review` to `published`, `reviewed_by` is set to `rishi`, and the file is committed to `main`. Cloudflare Pages auto-deploys on push. Site updates in ~30 seconds.

7. **Cross-link.** The Orchestrator updates any related entries that should reference the new piece.

---

## Discord integration

Magech uses a single Discord channel: `#magech-review` in Rishi's server. All agent-to-Rishi communication happens here.

**Message types the Orchestrator sends:**

- 📜 **Draft ready** — new piece ready for review (format defined in the Orchestrator prompt)
- 🔍 **Interview request** — Overview Agent needs fresh material from Rishi
- 🚩 **Escalation** — something the agent can't decide on its own (sensitive claim, brief mismatch, voice drift)
- 📅 **Calendar reminder** — next Negative Space issue due in N days
- ✅ **Published** — confirmation that a piece is live (with the URL)

**Message types Rishi sends:**

- Topic suggestions for the Orchestrator
- Approval / rejection / change requests on drafts
- Interview answers to the Overview Agent
- Direct prompt updates ("change the voice on Research entries to be slightly more casual")

The agents don't need read access to Rishi's broader Discord or other accounts. The channel is the boundary.

---

## Deployment pipeline

**Stack:**
- Framework: **Astro** (static-first, with React/MDX support for interactive components later)
- Styling: vanilla CSS using design tokens (see `/src/styles/tokens.css`). No Tailwind — the aesthetic is too specific for utility-first.
- Content: Markdown with YAML frontmatter, using Astro's Content Collections for type-safe schemas
- Hosting: **Cloudflare Pages**, auto-deploying from the `main` branch of the GitHub repo
- Domain: **magech.ai** (registered via Porkbun or similar — Cloudflare doesn't sell .ai)

**Flow:**
1. Agent writes a markdown file under `src/content/<section>/`
2. Agent commits and pushes to a feature branch
3. Orchestrator reviews, then merges to `main` once Rishi approves
4. Cloudflare Pages detects the push, runs `npm run build` (Astro static build), and deploys
5. Site is live at magech.ai within ~30 seconds

**Local development:**
```bash
cd magech-site
npm install
npm run dev
# Open http://localhost:4321
```

---

## Agent runtime architecture

Magech's agents run on OpenClaw — Rishi's existing multi-agent system. Each Magech agent is a long-running OpenClaw agent with:

- **Memory:** Discord conversation history with Rishi, plus its own draft history
- **Tools:** Read/write access to its section's content directory, web search for research, git CLI for commits
- **Triggers:** Scheduled (calendar-based commissions) and event-driven (Discord pings, draft submissions)

The Orchestrator is the only agent with cross-section read access. Specialists can only read their own section's content directory and the shared docs/prompts.

**The orchestration handshake:**
1. Orchestrator commissions → writes brief file to a shared `briefs/` directory (gitignored)
2. Specialist reads brief, drafts to its content directory, sets status to `draft`
3. Orchestrator monitors content directories, picks up new `draft` files
4. Orchestrator reviews, either flips to `review` (stage for Rishi) or writes feedback to a `feedback/` directory (gitignored)
5. Specialist watches the feedback directory, picks up new feedback, revises

This means the agents coordinate through the filesystem and Git, not through direct API calls. That's deliberate — it makes the whole system auditable (every state change is a git commit).

---

## What's already built (as of session start)

- ✅ Design tokens (`/src/styles/tokens.css`)
- ✅ Aesthetic demo HTML (`demo.html`) — the standalone preview Rishi has reviewed
- ✅ Content schemas (`/docs/content-schemas.md`)
- ✅ Style guide (`/prompts/style-guide.md`)
- ✅ Master prompt: Orchestrator (`/prompts/00-orchestrator.md`)
- ✅ Section prompts: Negative Space, Research, Projects, Overview (`/prompts/01-04-*.md`)
- ✅ Brief template (`/prompts/brief-template.md`)
- ✅ This README

## What's left to build

**Tonight (in order of priority):**

1. **Astro project initialization.** `npm create astro` with TypeScript, content collections matching the schemas, and the design tokens wired in.

2. **Base layout and navigation.** The shell every page lives in. Already designed in `demo.html`; needs to be ported to Astro components.

3. **Section index pages.** `/negative-space`, `/research`, `/projects`, `/overview` — list pages that render the content collection.

4. **Article template.** The single-piece page for Negative Space essays, Research entries, and Project write-ups. Drop caps, ornamental rules, monospace metadata.

5. **Seed content.**
   - Overview placeholders that the Overview Agent will replace after Rishi's first Discord interview
   - Negative Space Issue 01 skeleton (frontmatter + section markers) ready for Rishi to drop his raw observations into
   - One Research stub per anchor topic from the Research Agent prompt
   - Project stubs for OpenClaw, ProductClaw, StreamMesh, Magech-itself

6. **GitHub repo setup.** Initialize, push, connect to Cloudflare Pages.

7. **Cloudflare Pages setup.** Configure build, point at the magech.ai domain.

**Out of scope tonight:**

- The poker probability trainer (Learning section). Significant interactive build. Save for next week.
- The actual agent integration with OpenClaw. Rishi handles his own agent infrastructure.
- The Discord bot. Rishi's existing OpenClaw Discord interface is the substrate; no new bot needed.

---

## Critical reminders for whoever picks this up

1. **No content ships without `reviewed_by: "rishi"` in the frontmatter.** No exceptions, including this README.

2. **The style guide is the law.** When in doubt, re-read `/prompts/style-guide.md`. Violations are the most common reason drafts fail review.

3. **The Overview section requires a fresh Rishi interview.** Don't draft from synthesis. Ask in Discord first.

4. **Anthropic-related content requires per-piece Rishi approval.** Rishi has applied there. Don't take swings, don't make assumptions.

5. **Real metrics only.** No invented stats, no rounded-up impact claims. If a number isn't sourced, it doesn't appear.

6. **Voice over volume.** Better to ship one great Negative Space issue per month than three mediocre ones.

7. **The site is a workshop, not a portfolio.** Don't let the agents drift toward portfolio-brand voice. The reader is a peer, not an audience.

---

## Questions / escalations

When in doubt, the agent escalates to Rishi in `#magech-review`. The Orchestrator handles routine coordination; Rishi handles editorial calls and ambiguity.

When in doubt about the prompt system itself (changes to voice, new section, schema updates), Rishi updates the relevant prompt file and commits. The agents pick up the new instructions on their next invocation.
