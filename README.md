# magech.ai

A public workshop. Editorial publication on AI, embodiment, agent architecture, and the things the industry quietly chose not to talk about. Produced by R.S. and a 9-agent editorial desk running on OpenClaw.

**Live:** [magech.ai](https://magech.ai) (Cloudflare Pages, auto-deploy from `main`)

---

## What this repo contains

```
.
├── src/
│   ├── content/                 # markdown content per section
│   │   ├── negative-space/      # monthly editorial essays
│   │   ├── research/            # lab-notebook entries
│   │   ├── projects/            # build log
│   │   └── overview/            # whoami / whyamihere / whyarewehere
│   ├── content.config.ts        # Zod schemas — contract between agents and the site
│   ├── layouts/                 # Astro page layouts
│   ├── pages/                   # routes
│   └── styles/                  # tokens.css + site.css
├── docs/
│   ├── content-schemas.md       # frontmatter contract in prose
│   └── operator-manual.md       # R.S. operator notes
├── prompts/
│   ├── style-guide.md
│   ├── brief-template.md
│   └── v2/                      # 9 editorial-desk agent system prompts
├── state-log.md                 # append-only state transitions
├── cadence.md                   # publishing calendar
├── deploy-log.md                # Production agent's deploy history
└── astro.config.mjs / package.json
```

## How content gets produced

A piece moves through 7 states. Every transition is logged to `state-log.md`.

```
commissioned → drafted → critiqued → fact-checked → copy-edited → staged-for-rishi → published
                                                                                          ↓
                                                                                       retired
```

Reverse transitions (kickbacks) are common and logged the same way.

The desk has 9 specialized agents:

| Agent | Role |
|---|---|
| `desk-editor` | Contract surface to R.S. Routes between desk agents. Only agent that talks to R.S. in Discord. |
| `desk-skeptic` | Red-teams every draft for voice, argument, specificity. |
| `desk-fact-checker` | Verifies every claim against primary sources. |
| `desk-copy-desk` | Final pass — schema, formatting, AI-pattern hunting. |
| `desk-production` | Git ops + Cloudflare deploy + post-deploy verification. |
| `desk-ns-writer` | Drafts Negative Space essays. |
| `desk-research-writer` | Maintains the research notebook. |
| `desk-projects-writer` | Writes the build log. |
| `desk-overview-writer` | Channels R.S.'s voice into Overview pieces (interview required). |

All agent prompts live in `prompts/v2/`. The master spec is `prompts/v2/00-desk-operations.md`.

## Local development

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # static output to dist/
npm run preview      # preview built site
```

Astro 5 with content collections. Markdown content auto-renders through `ArticleLayout` for individual pieces and section-index pages for the four section landing pages.

## Frontmatter contract

Every piece has YAML frontmatter validated by Zod (`src/content.config.ts`) and documented in prose (`docs/content-schemas.md`).

Universal fields: `title`, `status`, `authored_by`, `reviewed_by`, `created`, `published`, `revision`, `tags`. Plus section-specific fields per the schema.

A piece can't be `published` until `reviewed_by: "rishi"` is set in frontmatter AND it passes the Zod schema. No exceptions. Build fails otherwise.

## Voice

See `prompts/style-guide.md`. The short version:
- **Workshop voice, not academic voice.** Practitioner with a specific point of view.
- **Specifics over abstractions.** Named papers, products, dates, numbers.
- **No AI-essay tells.** No "In this essay, I will..." No "let's dive in." No "what this really means..."
- **No vendor marketing.** No leverage, synergy, unlock, transform, robust, seamless, ecosystem.
- **Strong opinions, weakly held.** State the position. Steelman the counter. Don't bow-tie the ending.

The Skeptic kicks back any draft that violates these.

## Deployment

`main` is the live site. `desk-production` commits approved pieces with structured messages and pushes; Cloudflare Pages auto-builds and deploys. Custom domain `magech.ai`.

Reverts happen when a deployed piece fails post-deploy verification (broken link, schema error, bad render). Production reverts the commit and reports to the Editor.

## License

Content (markdown under `src/content/`, prompts, schemas): All rights reserved. R.S. and the OpenClaw agents authored. No reproduction without permission.

Code (scaffold, layouts, styles, config): MIT — see [LICENSE](./LICENSE).
