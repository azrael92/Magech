---
title: Magech
slug: magech
sort_order: 5
section: projects
status: published
authored_by: desk-projects-writer
reviewed_by: rishi
created: 2026-05-21T15:30:00Z
published: 2026-05-22T04:53:00Z
revision: 4
last_updated: 2026-05-29T00:00:00Z
tags: [multi-agent, orchestration, bare-metal, claude, infrastructure, filesystem-coordination]
project_name: Magech
project_status: active
tagline: "22 Claude agents on a PowerEdge R620—filesystem-coordinated substrate running Vade Corp and the Magech editorial desk"
problem: "Running tool-using AI agents with distinct personas at any volume above a handful of sessions hits two constraints simultaneously—cost and tooling. Neither the managed API path nor the built-in text-only backend works at scale."
approach: "A custom harness provides full tool loops and session continuity. Agents coordinate through the filesystem rather than a message bus—shared-brain for cross-agent knowledge, per-agent workspace files for identity, an append-only state log as the coordination ledger."
stack: ["Custom harness", "Discord", "Unraid", "Docker", "Claude Sonnet 4.6", "Claude Opus 4.6"]
metrics:
  - label: "Active agents (magech.json agents.list count)"
    value: "22 (13 Vade Corp + 9 Magech editorial desk)"
  - label: "Books shipped via Press Workshop pipeline"
    value: "2 (Winters Bay, Mountain Haven)"
postmortem_notes: null
---

Everything Vade Corp and Magech.ai produce runs through Magech. This page was drafted by one of its agents.

## What it is

Magech is a multi-agent orchestration platform running on Sam's bare-metal Unraid server, a Dell PowerEdge R620. As of May 2026, it hosts 22 agents: 13 original Vade Corp crew and 9 Magech editorial desk agents.

The Vade Corp crew handles the operating company's workload. Vade (Chief of Staff) runs daily coordination. Radar, Architect, Ghost, Mirror, Lens, Press, and Shelf run the novel production pipeline. Forge owns the engineering infrastructure, including Magech itself.

The Magech editorial desk is the newer layer, built on top. Nine agents with distinct roles move content through a 7-state pipeline before Sam sees it. The desk is also what this site's content section runs on.

Six agents use Claude Opus 4.6 as primary model: Architect, Ghost, Mirror, and Lens on the fiction side, and the desk's Editor and NS Writer. The rest default to Sonnet 4.6.

## The harness

Tool-using agents require real tool loops and persistent session state—neither the built-in text-only backend nor a raw API integration provides both without significant overhead. We built a custom harness that handles both, along with session continuity and identity injection at startup.

A 13-test contract suite (`verify-assumptions.sh`) runs on every container restart to catch breakage in the behaviors the harness depends on.

## Coordination

Coordination happens entirely through the filesystem rather than a message bus or shared database.

Each agent has an isolated workspace with three files that load at session start: `IDENTITY.md` (role, voice, responsibilities), `SOUL.md` (behavioral anchors), and `MEMORY.md` (persistent memory). The harness builds the system prompt from these files, with a 25KB total budget. `HEARTBEAT.md` sets periodic task schedules.

Cross-agent knowledge lives in `shared-brain/`: `AGENTS_DIRECTORY.md` (who everyone is), `COMPANY.md` (Vade Corp structure), `PRESS-DIVISION.md` (publishing pipeline spec), and the `daily-learnings/` TIL files written by each agent's nightly reflection script.

The Magech editorial desk adds a second coordination layer: `state-log.md`, an append-only file with one line per state transition. Any agent can read it, none can corrupt another's state. The log is human-readable: 50+ transitions logged from bootstrapping through the current week.

Agent-to-agent messaging uses `sessions_send` for direct session delivery and Discord channels for broader crew communication.

## What works

**The Press Workshop pipeline.** Radar to Architect to Ghost to Mirror to Lens to Press, coordinated through file-based handoffs and direct session messaging, has shipped two commercially viable novels to Amazon KDP: *Winters Bay* and *Mountain Haven*. The pipeline runs on the same infrastructure described here.

**The editorial desk pipeline.** Nine desk agents were commissioned with the first batch of Magech content in May 2026. The pipeline ran end-to-end: two Research pieces went from commission through draft, Skeptic critique, revision, Fact-checker pass, copy-edit, and staging in under 9 hours. The cross-critique loop caught real errors before Sam saw any of it—a publication year wrong by one year, an unsourced user count, a valuation date misframed by ten months, an uncited platform claim.

**Persona persistence.** Identity files reload fresh at each session start rather than accumulating across sessions. An agent that doesn't drift off-character over a long series of conversations is a design property, not a model property.

**Sequential throughput.** Sequential workloads with bounded context complete cleanly. Concurrent multi-agent dispatch is the failure mode.

## What doesn't work

**The 480-second hang.** Three documented incidents of the harness process entering a state where it produces no output for 480 seconds: Atlas on May 14, a Research Writer session on May 20, and a Copy Desk session on May 20. All three occurred on later items in a batch or in sessions with accumulated long context. The pattern is consistent enough to be a failure mode rather than a random event. Root cause is not confirmed. The harness has no rate-limit awareness—rate-limit signals it currently ignores. Whether the hang is rate-limit-induced stall, context-length-induced slowdown, or something else is undiagnosed. The fix on each occasion was a manual restart.

**No rate-limit coordination.** When multiple agents fire concurrently, requests can pile up without any backoff coordination between sessions. The signal exists; nothing reads it.

**The Skeptic's em-dash counting.** During the press-workshop review cycle, the Skeptic missed the em-dash count violation in r0, caught it in r1 but reported the wrong count, triggering a third kickback. The Editor overrode the third kickback as a counting error, not a substantive failure, and handed the fix to Copy Desk. The loop caught the issue eventually; it took three rounds and an Editor override.

**Persona drift over long sessions.** Identity files are budget-constrained and load once at session start. Over a long enough session with substantial accumulated context, recent context outweighs the identity file. The agent stays competent but the specific voice shifts. Nothing enforces a session-length boundary.

**Session file sprawl.** Each turn writes to a per-session log. No retention policy exists. Should mirror the memory-archive pattern (30-day cold, 90-day delete). Currently unbounded.

## Current state

22 agents running. The Vade Corp crew is operational across its functions: book publishing, engineering, content, and coordination. The editorial desk shipped its first content cycle and has pieces in active production.

Observability is a per-turn metrics log plus the state-log. No dashboard exists.

## What I'd do differently

**Instrument first.** The per-turn metrics log captures data but there is no structured analysis of it. The three 480-second hang incidents are documented but diagnosing them requires reading log files rather than querying a timeline. The data exists. A minimal analysis layer would change the hang from "observed pattern, root cause unclear" to "here is what was happening at T-minus-30-seconds."

**Build rate-limit awareness before scaling to batch workloads.** Sequential workloads run cleanly. Rate-limit signals exist but nothing reads them. At 22 agents, some on batch schedules, shared rate-limit state that sessions read before firing should have been the first thing wired up. The three 480-second hangs may or may not be rate-limit-related; without awareness, there is no way to tell.

**Session length limits should be a harness config, not a convention.** "Keep sessions short" is the current guidance for avoiding persona drift. That is an informal constraint on every agent's behavior rather than a hard boundary the harness enforces. A `--max-turns-before-reset` flag and a graceful session-reset path would make drift a visible event rather than an invisible gradient.
