# Magech Content Schemas

**Purpose:** The contract between OpenClaw agents and the Magech site. Every piece of content an agent produces follows one of these schemas. The site renders them. If an agent's output doesn't validate against the schema, it doesn't ship.

**Storage:** Each piece of content is a markdown file with YAML frontmatter, committed to the Git repo under `src/content/<section>/<slug>.md`. The frontmatter is the schema. The body is the prose.

---

## Universal frontmatter fields

Every content piece, regardless of section, includes these:

```yaml
title: string                  # human-readable title
slug: string                   # url-safe, lowercase, hyphens
section: enum                  # negative-space | research | projects | overview
status: enum                   # draft | review | published | retired
authored_by: string            # which agent. e.g. "negative-space-agent-v1"
reviewed_by: string            # "rishi" once approved in discord
created: ISO 8601 datetime     # when the agent first drafted
published: ISO 8601 datetime   # when it went live (null if draft)
revision: integer              # bump on every meaningful edit
tags: [string]                 # 3-7 tags max
```

**Status flow:** `draft` → agent finishes initial pass. `review` → Rishi seeing it in Discord. `published` → live on site. `retired` → no longer surfaced but kept in repo for history.

---

## Negative Space schema

The editorial section. Monthly essays on what the industry is doing but not discussing. Each issue is numbered.

```yaml
# Universal fields above, plus:
issue_number: integer          # sequential, 01, 02, 03...
deck: string                   # the italic gold subtitle. 1-2 sentences. punchy.
read_minutes: integer          # estimated, computed from word count / 220
hero_question: string          # the title is often a question; this is the canonical form
opens_with: enum               # drop_cap | image | pullquote — how the essay starts
related_research: [string]     # slugs of research entries that informed this
related_projects: [string]     # slugs of project entries this references
```

**Body requirements:**
- 1500-3500 words
- First paragraph supports a drop cap (avoid opening with a number, dialogue, or single-letter sentence-starter)
- Section breaks marked with `---` (renders as the ornamental ✦ rule)
- Pull quotes wrapped in `> ` blockquote syntax
- Inline code/labels use backticks
- No images required, but if used, max 2 per essay (avoid stock illustration)

**Voice anchor:** see `/prompts/style-guide.md`. Negative Space essays are the most editorially loaded content — they should sound like the author has a strong, specific point of view and is willing to be wrong in public.

---

## Research schema

The lab notebook. Trends being tracked, white papers worth reading, open questions Rishi hasn't answered yet. Lighter weight than Negative Space — these are working notes, not finished essays.

```yaml
# Universal fields above, plus:
entry_type: enum               # trend | paper | question | experiment | dataset
thread_id: string              # research entries cluster into threads. e.g. "agent-reliability"
status_summary: string         # one-line "where I am with this right now"
key_findings: [string]         # 3-7 bullets — the takeaways so far
open_questions: [string]       # what's still unresolved
sources: [object]              # cited sources
  - title: string
    url: string
    accessed: ISO 8601 date
    relevance: enum            # primary | supporting | contradicting
last_updated: ISO 8601 datetime # research entries get edited often
```

**Body requirements:**
- 300-1500 words (these are notes, not essays — restraint matters)
- Honest about uncertainty — research entries should say "I don't know yet" when that's true
- Always link primary sources, never paraphrase without attribution
- If summarizing a paper, include both Rishi's read AND a steelman of the paper's position
- Updated regularly — research entries are living documents

**Voice anchor:** Notebook voice. Tentative where appropriate, sharp where warranted. Not editorial.

---

## Projects schema

The build log. Real systems Rishi has built or is building. Each project gets a card on the index and a detail page.

```yaml
# Universal fields above, plus:
project_name: string           # canonical name. e.g. "StreamMesh", "OpenClaw Publishing"
status: enum                   # active | shipped | dormant | postmortem
tagline: string                # one line that explains what it is
problem: string                # 1-2 sentences. what problem does this exist to solve?
approach: string               # 1-2 sentences. how is this solving it?
stack: [string]                # technologies. e.g. ["Python", "MCP", "Claude API"]
links: [object]                # external references
  - label: string              # "GitHub", "Demo", "Blog post"
    url: string
metrics: [object]              # optional, only if real
  - label: string
    value: string               # e.g. "12 agents", "50% dev time reduction"
postmortem_notes: string       # nullable; populated if status is "postmortem"
```

**Body requirements:**
- 800-2500 words for active/shipped projects
- Structure: Problem → Approach → What worked → What didn't → What's next
- Failure stories are valued — postmortems get full treatment, not whitewashing
- Code samples in fenced blocks when relevant
- Avoid screenshots if possible; if necessary, prefer architecture diagrams over UI shots
- Each project closes with "what I'd do differently"

**Voice anchor:** Engineer-to-engineer. Specific and technical without being smug. The reader is assumed to be at least as smart as the author.

---

## Overview schema

The smallest section. Three short pieces of prose — `whoami`, `whyamihere`, `whyarewehere` — that introduce the workshop to a first-time visitor.

```yaml
# Universal fields above, plus:
piece: enum                    # whoami | whyamihere | whyarewehere
order: integer                 # 1, 2, 3 — display order
last_revised: ISO 8601 date    # this section changes when Rishi's perspective shifts
```

**Body requirements:**
- 100-400 words each
- First person, present tense
- No resume restatement. The reader can see the resume elsewhere.
- The voice here is the closest to Rishi unfiltered. The Overview agent's job is to channel Rishi's actual point of view, not synthesize one.

**Voice anchor:** First-person, unguarded, opinionated. This is the only section where the agent should explicitly check itself: "is this what Rishi would actually say, or is this what an AI thinks a smart person would say?"

---

## Validation rules

Before a piece of content can be marked `published`:

1. **Frontmatter validates** against schema (no missing required fields, no invalid enums)
2. **Body word count** falls within section range
3. **No banned phrases** — see `/prompts/style-guide.md` anti-patterns list (rejected automatically)
4. **At least one specific claim** with a source/citation if it's a Negative Space or Research entry
5. **Rishi has reviewed** in Discord — `reviewed_by: "rishi"` field populated
6. **Revision number** matches the number of edits made since `created`

If any rule fails, the agent's draft sits in `draft` or `review` status. Only Rishi's explicit approval moves it to `published`.

---

## File naming convention

```
src/content/negative-space/01-why-doesnt-your-ai-have-a-face.md
src/content/negative-space/02-<slug>.md
src/content/research/agent-reliability-tool-selection-degradation.md
src/content/projects/streammesh.md
src/content/overview/01-whoami.md
src/content/overview/02-whyamihere.md
src/content/overview/03-whyarewehere.md
```

Negative Space files prefix with issue number. Research files use kebab-case slugs. Project files use the project's canonical slug. Overview files prefix with display order.
