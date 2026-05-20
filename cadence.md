# Cadence — Magech publishing calendar

The Editor reads this file daily to decide whether to ping Sam with a 📅 Cadence reminder.

---

## Negative Space — monthly issues

Target: one Issue per calendar month. Editor pings Sam 10 days before the target ship date with a 📅 reminder.

| Issue | Target ship | Status | Notes |
|---|---|---|---|
| 01 | 2026-05-31 | drafted (skeleton in repo) | "Why doesn't your AI have a face?" — needs Rishi's substantive content drop |
| 02 | 2026-06-30 | tbd | Topic from anchor list — Editor commissions in early June |
| 03 | 2026-07-31 | tbd | Editor commissions in early July |

Anchor topic queue (Editor picks from these, or new ones from Sam):
- Empathic AI doesn't have empathy. It has a script.
- The agent ecosystem is built on an unsafe protocol surface (MCP indirect prompt injection)
- We measure agent task completion. We don't measure agency.
- Coding assistants increase output but require more rewriting
- AI for everyone as a Trojan horse for real frontier tech
- The disenchantment problem (acclimation as biology)

---

## Research — continuous, weekly idle check

Target: at least 2 entries per week, OR active update to existing entries on tracked threads.

Editor pings Sam with 📅 if no Research activity for 14 consecutive days.

Active threads:
- `agent-reliability-tool-selection-degradation` (Patel et al. 2025; ProductClaw failure modes)
- `embodiment-and-ai-personality` (historical comparison, animation cost)
- `ai-for-everyone-trojan-horse` (cost-amortization hypothesis)
- `openclaw-operational-data` (private — needs per-piece Rishi approval)
- `publishing-and-ai-copywriting` (ePub experience, Udemy tutorial failures)
- `cognitive-correlates-ai-use` (Gerlich 2025, Kosmyna 2025)
- `agency-benchmarks` (GAIA, WebArena, OSWorld, METR HCAST)

---

## Projects — event-driven (when news lands)

No regular cadence. Editor commissions a Projects update when:
- A project's status changes (active → shipped, active → postmortem, etc.)
- A meaningful milestone (wrapper rate-limit fix lands, Macinabox Sonoma boots, paper-trade #20 completes, etc.)
- Postmortem triggered (something dies)

Anchor projects:
- OpenClaw (active — substrate)
- ProductClaw (active — personal use only, NOT Amazon-owned)
- StreamMesh (concept — needs Discord interview before drafting)
- Magech Publishing (active — ePub via Press Division agents)
- Magech.ai itself (active — this site)
- Wheel Engine (active — paper-mode proof phase, Atlas + Quill)

---

## Overview — 90-day stale check

Each of the 3 Overview pieces has a `last_revised` field. If 90 days pass without a revision, Editor pings Sam with 📅 suggesting a fresh interview.

| Piece | Last revised | Next stale-check |
|---|---|---|
| whoami | — (not yet drafted) | After first interview |
| whyamihere | — (not yet drafted) | After first interview |
| whyarewehere | — (not yet drafted) | After first interview |

First-run priority: Editor opens Discord interviews for all three Overview pieces in Week 1 of the desk being operational, before any other commission.

---

## Update protocol

The Editor is the only agent that edits this file. On any cadence change:
1. Editor updates the relevant row
2. Editor appends a note to `state-log.md`: `<timestamp> | _cadence | _update → _update | desk-editor | <one-line summary>`
3. Commit if the change is durable (not just a TBD placeholder)
