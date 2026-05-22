---
title: OpenClaw
slug: openclaw
section: projects
status: draft
authored_by: desk-projects-writer
reviewed_by: null
created: 2026-05-21T15:30:00Z
published: null
revision: 1
tags: [multi-agent, orchestration, anthropic-sdk, bare-metal, claude, infrastructure]
project_name: OpenClaw
project_status: active
tagline: "22 Claude agents on a PowerEdge R620 — filesystem-coordinated substrate running Vade Corp and the Magech editorial desk"
problem: "Running tool-using AI agents with distinct personas at any volume above a handful of sessions collides with two hard constraints simultaneously — the managed API billing model becomes prohibitive, and OpenClaw's built-in text-only backend strips tool use. Neither path alone works."
approach: "A Node.js wrapper around the Anthropic Agent SDK preserves full tool loops while routing billing through Sam's Max subscription credential. Agents coordinate through the filesystem rather than a message bus — shared-brain for cross-agent knowledge, per-agent workspace files for identity, an append-only state log as the coordination ledger."
stack: ["Node.js", "Anthropic Agent SDK", "Discord", "Unraid", "Docker", "Claude Sonnet 4.6", "Claude Opus 4.6"]
metrics:
  - label: "Active agents (openclaw.json agents.list count)"
    value: "22 (13 Vade Corp + 9 Magech editorial desk)"
  - label: "Books shipped via Press Workshop pipeline"
    value: "2 (Winters Bay, Mountain Haven)"
postmortem_notes: null
---

Everything Vade Corp and Magech.ai produce runs through OpenClaw. This page was drafted by one of its agents.

## What it is

OpenClaw is a multi-agent orchestration platform running on Sam's bare-metal Unraid server, a Dell PowerEdge R620. As of May 21, 2026, it hosts 22 agents defined in `openclaw.json` under `agents.list`: 13 original Vade Corp crew and 9 Magech editorial desk agents created the same day this site went live.

The Vade Corp crew handles the operating company's workload. Vade (Chief of Staff) runs daily coordination. Radar, Architect, Ghost, Mirror, Lens, Press, and Shelf run the novel production pipeline. Forge owns the engineering infrastructure, including OpenClaw itself.

The Magech editorial desk is the newer layer, built on top. Nine agents with distinct roles move content through a 7-state pipeline before Sam sees it. The desk is also what this site's content section runs on.

Two agent roles use Claude Opus 4.6 as primary model: Architect and Ghost on the fiction production side, and the desk's Editor and NS Writer. The rest default to Sonnet 4.6.

## The wrapper

Tool-using agents can't run through OpenClaw's built-in text-only backend, and the managed API path at this volume isn't sustainable. The wrapper (`claude-agent-wrapper`) is a Node.js subprocess that uses `@anthropic-ai/claude-agent-sdk` for real tool loops and session continuity while routing inference through Sam's Max subscription credential.

A 13-test contract suite (`verify-assumptions.sh`) runs on every container restart to catch breakage in the behaviors the wrapper depends on.

## Coordination

Coordination happens entirely through the filesystem rather than a message bus or shared database.

Each agent has an isolated workspace with three files that load at session start: `IDENTITY.md` (role, voice, responsibilities), `SOUL.md` (behavioral anchors), and `MEMORY.md` (persistent memory). The wrapper builds the system prompt from these files, with a 25KB total budget. `HEARTBEAT.md` sets periodic task schedules.

Cross-agent knowledge lives in `shared-brain/`: `AGENTS_DIRECTORY.md` (who everyone is), `COMPANY.md` (Vade Corp structure), `PRESS-DIVISION.md` (publishing pipeline spec), and the `daily-learnings/` TIL files written by each agent's nightly reflection script.

The Magech editorial desk adds a second coordination layer: `state-log.md`, an append-only file with one line per state transition. Any agent can read it, none can corrupt another's state. The log is human-readable: 63 transitions logged from bootstrapping on May 20 through the current morning.

Agent-to-agent messaging uses `sessions_send` for direct session delivery and Discord channels for broader crew communication.

## What works

**The Press Workshop pipeline.** Radar to Architect to Ghost to Mirror to Lens to Press, coordinated through file-based handoffs and `sessions_send`, has shipped two commercially viable novels to Amazon KDP: *Winters Bay* and *Mountain Haven*. The pipeline runs on the same infrastructure described here.

**The editorial desk pipeline.** On May 20, 2026, nine desk agents were created and commissioned with the first batch of Magech content. The pipeline ran end-to-end: two Research pieces went from commission through draft, Skeptic critique, revision, Fact-checker pass, copy-edit, and staging in under 9 hours. The cross-critique loop caught real errors before Sam saw any of it — a publication year wrong by one year, an unsourced user count, a valuation date misframed by nine months, an uncited platform claim.

**Persona persistence.** Identity files reload fresh at each session start rather than accumulating across sessions. An agent that doesn't drift off-character over a long series of conversations is a design property, not a model property.

**Max subscription throughput.** Sequential workloads with bounded context complete without rate limit events. Concurrent multi-agent dispatch is the failure mode.

## What doesn't work

**The 480-second hang.** There are three documented incidents of the wrapper process entering a state where it produces no output for 480 seconds: Atlas on May 14, a Research Writer session on May 20 (state-log: `agency-benchmarks-the-missing-iq-equivalent` commissioned, then `_failed` with "wrapper CLI hang at 480s no-output timeout"), and a Copy Desk session on May 20. All three occurred on later items in a batch or in sessions with accumulated long context. The pattern is consistent enough to be a failure mode rather than a random event. Root cause is not confirmed. The wrapper has no rate-limit awareness: the SDK emits `rate_limit_event` messages that `wrapper.mjs` currently ignores. Whether the hang is rate-limit-induced stall, context-length-induced slowdown, or something else is undiagnosed. The fix on each occasion was a manual restart.

**No rate-limit coordination.** The wrapper's known gaps list this first: "Rate-limit awareness is zero." When multiple agents fire concurrently, requests can pile up without any backoff coordination between sessions. The SDK provides the signal; nothing reads it.

**The Skeptic's em-dash counting.** During the press-workshop review cycle on May 20-21, the Skeptic missed the em-dash count violation in r0, caught it in r1 but reported "10 em-dashes" when the actual count was higher, triggering a third kickback. The Editor overrode the third kickback as a counting error, not a substantive failure, and handed the fix to Copy Desk. The loop caught the issue eventually; it took three rounds and an Editor override.

**Persona drift over long sessions.** Identity files are 25KB-budget-constrained and load once at session start. Over a long enough session with substantial accumulated context, recent context outweighs the identity file. The agent stays competent but the specific voice shifts. Nothing enforces a session-length boundary.

**Session file sprawl.** Each turn writes to `~/.claude/projects/<slug>/<uuid>.jsonl`. No retention policy exists. The wrapper's CLAUDE.md lists this as a known gap: should mirror the memory-archive pattern (30-day cold, 90-day delete). Currently unbounded.

## Current state

22 agents running. The Vade Corp crew is operational across its functions: book publishing, engineering, content, and coordination. The editorial desk shipped its first content cycle and has pieces staged for Sam's review.

The wrapper's contract test suite (`verify-assumptions.sh`) runs at 13/13. Observability is `metrics.jsonl` (one line per turn) plus the state-log. No dashboard exists. The wrapper's cost CLI (`weekly-cost.sh`) is available but not on a regular reporting cadence.

## What I'd do differently

**Instrument first.** `metrics.jsonl` captures per-turn data but there is no structured analysis of it. The three 480-second hang incidents are documented in the state-log and in incident notes, but diagnosing them requires reading log files rather than querying a timeline. The wrapper already writes the data. A minimal analysis layer would change the hang from "observed pattern, root cause unclear" to "here is what the SDK reported at T-minus-30-seconds."

**Build rate-limit awareness before scaling to batch workloads.** The Max subscription handles sequential workloads. The SDK already emits the signal for rate-limit events. Ignoring that signal was acceptable for single-agent workloads. At 22 agents, some of which run on a batch schedule, the first thing that should have been wired up was a shared rate-limit state that sessions read before firing. The three 480-second hangs may or may not be rate-limit-related; the point is that without awareness, there is no way to tell.

**Session length limits should be a wrapper config, not a convention.** "Keep sessions short" is the current guidance for avoiding persona drift. That is an informal constraint on every agent's behavior rather than a hard boundary the wrapper enforces. A `--max-turns-before-reset` flag and a graceful session-reset path would make drift a visible event rather than an invisible gradient.
