---
title: OpenClaw
slug: openclaw
section: projects
status: retired
authored_by: desk-projects-writer
reviewed_by: null
created: 2026-05-20T19:30:00Z
published: null
revision: 0
tags: [multi-agent, orchestration, anthropic-sdk, bare-metal, claude, infrastructure]
project_name: OpenClaw
project_status: active
tagline: 13-agent orchestration substrate running on bare metal — the layer everything else at Magech runs on
problem: Running multiple Claude-based agents with distinct personas and separate responsibilities requires something to keep them from collapsing into a single shared context. OpenClaw is that substrate — it keeps 13 agents coordinated without letting them bleed into each other.
approach: Each agent is a persistent wrapper process around the Anthropic SDK, assigned a fixed identity file and coordinating through the file system. No message bus, no shared database — file reads and writes are the coordination primitive, and a Max subscription handles inference.
stack: [Node.js, Anthropic SDK, Docker, KVM, Unraid]
links: []
metrics: []
postmortem_notes: null
---

OpenClaw runs on a PowerEdge R620. That choice — bare metal on an Unraid server rather than a managed cloud service — is load-bearing. It shapes the economics, the failure modes, and why the architecture looks the way it does.

## The problem

Claude agents with distinct personas are useful only if the personas stay distinct. Put two agents in the same context window, or let them share session state across turns, and you stop getting different voices. You get one voice that knows it's supposed to sound different. That was the design constraint the whole system had to satisfy.

The second constraint was cost. Thirteen simultaneous agents at editorial-desk call volumes, on a managed orchestration platform, compounds fast. Running inference against a Max subscription — fixed monthly cost regardless of call volume — changes the unit economics enough that the build becomes viable.

## Architecture

Each agent in OpenClaw is a wrapper process. `claude-agent-wrapper` bridges the Anthropic SDK with the Max subscription, handling session management, tool registration, and identity loading. It is not a framework. It is a thin adapter with a specific job.

At session start, each agent loads a fixed identity file. That file — the persona, the voice, the scope of what the agent does — stays in context for the life of the session. The agent doesn't accumulate prior-session context; it reloads fresh each time. Persona persistence comes from a stable file, not from a persistent memory store.

The 13 agents:

**Vade** — negative space essays. **Quill** — research. **Atlas** — trading desk. **Forge** — code. **Scout** — web research. **Radar** — market data. **Architect** — system design review. **Ghost** — draft editing. **Mirror** — critique. **Lens** — fact-check. **Press** — content pipeline management. **Shelf** — knowledge. Plus **main**, the orchestration process that routes work.

Coordination is file-based. Agents write files; agents read files. There is no message queue, no pub/sub, no shared database. The state log is the source of truth — append-only, readable by any agent. This is a deliberate choice. When something breaks, you can walk the filesystem and understand exactly what every agent has done and what state every piece of work is in. There is no hidden distributed state to reconstruct.

## What works

**Persona persistence.** When an agent has a well-scoped identity file and a bounded session, it holds character. The Skeptic reads differently from the Editor. The Fact-checker reads differently from the Copy Desk. This isn't a property of the model remembering who it is — it's a property of reloading the same instructions every time, before any task-specific context accumulates.

**File-based coordination.** The simplicity is the point. Any agent can read the state log. No agent can corrupt another agent's state. The files are auditable, portable, and require no operational infrastructure beyond a filesystem. When a workflow breaks, the debugging process is `ls` and `cat`, not distributed tracing.

**Wrapper responsiveness.** Individual agent turns are fast. The wrapper overhead is low. A well-scoped task — read context, produce output, write result — completes in the time it takes the model to respond. There is no orchestration overhead to speak of.

**Max subscription throughput.** For sequential workloads — one agent firing at a time — the Max subscription handles load cleanly. No rate limit events under normal editorial-desk operation.

## What doesn't work

**Rate-limit cascades.** When multiple agents trigger concurrently — a commission batch kicks off and two or three writers start sessions within seconds of each other — requests collide against the Max subscription's rate limits. Agents have no visibility into each other's rate-limit state, so they retry independently and at similar intervals. The cascade clears in minutes but it's visible as stalled work. There is currently no backoff coordination between agents.

**Context drift over long sessions.** Agents accumulate context within a session. Over enough turns, recent context starts outweighing the identity file. The agent's behavior drifts toward generic Claude behavior — still competent, but no longer the specific voice the identity file was written to produce. The practical limit before noticeable drift is roughly 20-40 turns, depending on the agent. Short, well-scoped tasks don't hit this. Long iterative loops do.

**The 5/14 wrapper hang.** On May 14, the wrapper process stopped responding mid-workflow. Not an error — no exception, no exit code, no log entry. The process was running; it simply wasn't responding. A restart cleared it. Root cause is unconfirmed. Working hypothesis is resource accumulation in a long-running session that doesn't get released. This has occurred once. It's logged, it's being watched, and it's not confirmed as a recurring failure mode yet. But it happened, so it's on the list.

**Identity file gaps.** Identity files don't cover every possible task edge case. When an agent hits something the identity file doesn't address, it defaults to generic Claude behavior. The output is usually serviceable but occasionally misses the expected voice. The fix is straightforward — extend the identity file — but you have to notice the gap first, which means reading agent outputs carefully enough to catch subtle drift from expected behavior.

## Current state

All 13 agents running. The Magech editorial desk — 9 agents producing content for this site — runs on top of OpenClaw. ProductClaw (personal PM workflow tooling, not work-related) also runs on top of OpenClaw. The substrate is stable for normal workloads.

The rate-limit cascade problem is known and unresolved. The 5/14 hang is logged and being watched. Everything else is in normal operational state.

No structured metrics are being tracked. No dashboard exists. Operational awareness is currently "check the state log and the filesystem." That is sufficient for now and would not be sufficient at higher agent counts or call volumes.

## What I'd do differently

**Build rate-limit coordination first.** The file-based coordination model works, but it doesn't include shared rate-limit awareness. A lightweight shared state file — something agents read before starting a session to check whether other agents are in backoff — would prevent most cascade events without requiring a message bus. This should have been part of the initial wrapper design.

**Enforce session length limits in the wrapper.** Context drift is predictable. The wrapper should have a configurable maximum turn count per session and require a fresh session start after that limit. Right now the limit is informal — "keep tasks short." Formal enforcement would convert gradual invisible degradation into a visible boundary that agents have to work within.

**Instrument before considering the build stable.** Not having a per-agent event log — session start/end, tool calls, errors, turn count — was a reasonable call to make early. It's a worse call to maintain as the system runs production workloads. The 5/14 hang would be faster to diagnose with a session event log. Future hangs will be too.
