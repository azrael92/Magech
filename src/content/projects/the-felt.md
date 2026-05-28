---
title: The Felt
slug: the-felt
section: projects
status: published
authored_by: desk-projects-writer
reviewed_by: null
created: 2026-05-27T22:15:00Z
published: 2026-05-27T22:15:00Z
revision: 1
tags: [poker, probability, python, fastapi, websocket, ai-agents, glicko]
project_name: The Felt
project_status: active
tagline: "Hold'em probability trainer — equity, pot odds, MDF, and EV surfaced turn-by-turn against adaptive archetype opponents"
problem: "Poker training tools typically either drill ranges in isolation or replay hand histories with a pass/fail rating. Neither teaches in-hand probabilistic reasoning against opponents with distinct patterns. A player who can calculate pot odds in a vacuum but can't apply them against a specific opponent's betting range isn't learning the right thing."
approach: "A live Hold'em table with rule-based archetype opponents and a coach that shows equity, pot odds, MDF, and expected value after each decision. Difficulty adapts via Glicko-2: the bots tighten up as your rating climbs."
stack: ["Python", "FastAPI", "WebSocket", "Treys", "Monte Carlo", "Glicko-2", "vanilla JS"]
links:
  - label: "GitHub"
    url: "https://github.com/azrael92/the-felt"
metrics: []
embed_url: null
embed_note: "Work in progress — The Felt does not yet have session tracking or account management. Each session starts fresh. The education framework is still being refined."
postmortem_notes: null
---

Texas Hold'em is a probabilistic game with an adversarial layer. The probabilistic part—equity, pot odds, fold equity, expected value—can be taught in isolation. The adversarial layer can't be. A player learning poker needs both at once, because the numbers only have meaning against a particular opponent making particular bets.

Most training tools don't provide that. Range drills don't have opponents. Hand history replay has opponents but the feedback loop is too slow. The Felt is an attempt at a middle path: a live table where you make decisions in context, and a coach that shows you the math behind the decision you just made, against the opponent you just made it against.

## What's built

**Hand evaluation and equity.** Treys handles hand evaluation. Equity is Monte Carlo: deal the remaining community cards N times, count wins, divide. The result is a percentage—your equity in the current pot—computed per street and available to the coach. Pot odds, MDF (minimum defense frequency), alpha (equity needed to call profitably), and EV for bet/call/fold are derived from equity plus the current pot and stack sizes.

**Archetype opponents.** The bot layer is rule-based, not model-based. Each archetype has a defined preflop range and a set of postflop tendencies: how often it continuation-bets, how it responds to check-raises, at what SPR it commits to the pot. The archetypes run from tight-aggressive to loose-passive and cover enough behavioral variety that the coach explanations stay context-specific—"this opponent fires continuation bets at 85%, so your fold equity is lower than pot odds suggest" is a different sentence than "this opponent only continues with top pair or better."

**The coach.** The coach produces two levels of explanation: a short read (one to two sentences, surfaced inline) and a detailed breakdown available on request. The detailed view shows the full probability calculation—equity at this street, pot odds required to call, whether the call is profitable in expectation—and labels the decision as correct, marginal, or incorrect against the distribution of opponent hands. The labeling is calibrated against the archetype's range, not against a simplified GTO baseline.

**Skill rating and difficulty adaptation.** The system tracks a Glicko-2 rating per decision type and adjusts opponent behavior over time. A player running well against loose-passive opponents will see tighter, more exploitative behavior from the same archetypes on subsequent sessions. The adaptation is gradual—Glicko-2's RD (rating deviation) prevents a single session from collapsing the uncertainty.

**Infrastructure.** FastAPI serves the game state over WebSocket. The frontend is vanilla JavaScript with an SVG table layout. No framework dependency was deliberate: the visual complexity is low enough that a framework adds more scaffolding than it removes.

## What doesn't work yet

**Phase 2 features are placeholders.** The `.env.example` gates Phase 2+ behavior behind `ANTHROPIC_API_KEY`. The current codebase has the connection points for coach commentary that calls Claude for narrative-style explanation (why this hand is an exception to the general rule, recognizing specific trap situations, etc.), but that path is not wired up. What the coach produces right now is computed from the probability model, not generated. This is fine for teaching the math; it's incomplete for teaching the feel.

**No external feedback loop on coach quality.** The coach is as good as the underlying probability model and archetype definitions. There is no mechanism for a user to flag "this explanation was wrong" or "I already knew this, skip it." The accuracy of the coach on edge cases—multi-way pots with side stacks, all-in situations mid-street, unusual blocker effects—has not been stress-tested.

**Not deployed.** The server runs at localhost:8000. There is no staging environment, no authentication, no session persistence beyond an in-memory game state. This is a local POC, not a product.

## What's next

The immediate work is evaluation: play a few hundred hands, identify the coach explanations that are wrong or misleading, and fix the underlying probability calculations before any user-facing work begins. The Phase 2 Claude integration is the more interesting direction—a coach that can recognize "this player is running a min-raise trap line" and flag it by pattern, rather than just running the numbers—but it doesn't make sense to build that until the math-first layer is solid.

Deployment is a separate question. The game state is currently in-process, which means a multi-player or even persistent-session version requires a state layer. That design exists in the plan but isn't started.

## What I'd do differently

**Ship the math layer first, separately.** The probability module—pot odds, MDF, equity from Monte Carlo—is independently useful and testable in isolation. Writing it as a library with a test suite before integrating it into the game loop would have made the coach's output verifiable by property. As built, correctness is tested by playing hands and noticing when the numbers look wrong. That's a slow feedback loop.

**Archetype design needs empirical validation.** The archetypes are based on observed player behavior patterns, not derived from game theory. That's intentional—real opponents don't play GTO—but the specific parameter values (continuation bet frequency, aggression factor by street) are rough estimates. Calibrating them against hand history databases would produce more realistic opponents.

**Don't scope in Phase 2 until Phase 1 is evaluated.** The `.env.example` placeholder for `ANTHROPIC_API_KEY` is fine as a design marker, but the risk is treating the placeholder as a commitment. The math-first coach should be evaluated on its own terms before deciding whether Claude narration adds enough to justify the latency and cost.
