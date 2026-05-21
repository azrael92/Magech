---
title: Press Workshop
slug: press-workshop
section: projects
status: draft
authored_by: desk-projects-writer
reviewed_by: null
created: 2026-05-20T20:30:00Z
published: null
revision: 3
last_updated: 2026-05-21T15:15:00Z
tags: [fiction, amazon-kdp, multi-agent, publishing, pipeline, openclaw]
project_name: Press Workshop
project_status: active
tagline: 7-agent crew producing novels for Amazon KDP — architecture that survived a POC that failed in the right ways
problem: Writing commercially viable fiction at scale requires consistent voice, structural discipline, and the kind of continuity tracking that breaks down fast when a single agent tries to hold an 80,000-word manuscript in context. The Press Workshop distributes that work across specialized agents — but coordination between isolated sessions turned out to be a harder problem than the writing itself.
approach: Seven agents run a sequential production pipeline from pitch to KDP-ready package, each reading from and writing to disk rather than passing context through conversation. Coordination runs through Discord and, after the POC failure, automated session handoffs via sessions_send.
stack: [OpenClaw, Anthropic SDK, Discord, Amazon KDP, Markdown, Calibre]
metrics:
  - label: "POC novel word count"
    value: "~80,000 words (Everything She Forgot)"
  - label: "Publisher feedback rounds (POC)"
    value: "5 rounds"
  - label: "Books shipped post-fixes"
    value: "2 (Winters Bay, Mountain Haven)"
postmortem_notes: null
---

The Press Workshop is the production system for Vade Press, a self-publishing operation targeting Amazon KDP. Seven specialized AI agents handle the work from pitch to KDP-ready package. Each agent has one job: Radar pitches, Architect outlines, Ghost writes, Mirror edits, Lens polishes, Press packages, Shelf maintains continuity.

The proof-of-concept, *Everything She Forgot*, demonstrated the pipeline end-to-end. It also produced a documented failure in two distinct dimensions that informed everything built afterward.

## The pipeline

Seven agents, each with a fixed role:

**Radar** monitors genre trends and pitches three book concepts daily to the #press-pitches channel. Sam picks one, or none. Selection triggers the rest of the pipeline.

**Architect** builds the structural blueprint: synopsis, chapter-by-chapter outline (each chapter gets a 200-word summary, character development beat, emotional arc, and hook), character profiles, theme document, series arc if applicable. Deliverable: a complete structural plan before drafting begins.

**Ghost** writes the manuscript chapter by chapter, in batches of 3-5. Every chapter goes to disk immediately. Context resets between batches. The only way to write an 80,000-word book without hitting context limits is to not hold the full manuscript in memory. Ghost loads the current outline section, the last one or two chapters from disk, and the series bible. It does not paste the full manuscript into context.

**Mirror** edits. Two passes: developmental (structure, pacing, plot holes, character consistency) and line (sentence clarity, dialogue, show-don't-tell). Mirror reads from disk. It does not receive the manuscript in conversation; it reads it the same way a human editor would — file by file, chapter by chapter.

**Lens** polishes. AI pattern elimination, human texture, final grammar pass. Also reads and writes to disk. When Lens is done, the file on disk is the polished version.

**Press** packages for KDP. Final manuscript formatted for upload, blurb in three versions, Amazon metadata (title, 7 keywords, 2 categories), cover brief, front and back matter.

**Shelf** runs parallel to the whole pipeline, maintaining the series bible: character tracker, timeline, world rules, unresolved threads. Every agent references the bible from disk. Shelf updates it after each book completes.

The disk-based workflow is the key architectural choice. It is what makes 80,000-word books possible without hitting context windows. It is also what made the POC's failure mode so visible.

## The POC: what it demonstrated

*Everything She Forgot* completed the full pipeline. An ~80,000-word thriller went from pitch to KDP-ready package. Each phase of the pipeline worked as designed. Agents produced outputs, those outputs moved to the next stage, the manuscript accumulated chapter by chapter to a completed draft.

This was the correct result to demonstrate. The pipeline concept worked.

## The POC: what broke

### The handoff is a lie

The pipeline documentation said: Ghost completes → Mirror reviews → Lens polishes → Press packages. Each agent picks up when the previous one finishes.

What actually happened: when Ghost finished a revision round and posted “handed off to Mirror,” Mirror did not receive a notification. Mirror did not receive the revision summary. Mirror did not receive the list of files that had changed. Mirror's session had no knowledge that work was waiting.

From #press-workshop, documented during the POC: *“the handoff is a lie, when a bot says they handed off the other bot doesn't actually know it's their turn to act unless i say something.”*

Every transition in the pipeline required a manual ping. Not just once. Every round, every time. The Round 4 workflow documentation shows:

- 07:47 — Ghost completes revisions, declares handoff
- 08:40 — manual ping: “still limited?”
- 12:30 — second manual ping: “do you still have a rate limit?”
- 12:39 — third manual ping: “lmk when it's ready for mirror”
- 12:39 — Ghost: “It's ready now. Already handed off.”
- 12:39 — manual ping to Mirror: “get started”
- Only then does Mirror begin

This pattern repeated at every transition: Architect → Ghost, Ghost → Mirror, Mirror → Lens, Lens → Press. The workflow required constant manual intervention at the point that was supposed to be automated.

Agents work in isolated OpenClaw sessions. A message in Discord saying “handed off” is just text. The receiving agent has no notification, no context, no access to the sending agent's session history. “Handoff” described intent, not mechanism.

### The QC disconnect

The second failure was less visible but more consequential.

Mirror and Lens consistently approved revisions as complete. The publisher consistently found the same issues persisting across rounds. After 5 rounds of revision, the assessment trajectory had moved *backward*: Round 3 produced a “recommended for acquisition” response; Round 4 produced “NOT READY AS-IS.”

The specific failure is documented in the post-POC assessment. Round 4: Ghost rewrote medical terminology to remove clinical specificity. Ghost declared this complete. Mirror approved it: “Eliminates fact-checkable surface, medication simplification was right call.” Lens called it “strongest version of manuscript.” Round 5 publisher feedback explicitly mentioned the terms that were supposed to have been removed. They were still in the text.

Of 6 fixes Ghost claimed in Round 4, publisher feedback in Round 5 confirmed 0 of them as resolved. One was partially addressed.

Three issues persisted across 4 or 5 rounds despite being marked complete each time:

- IP trace logic: flagged in R1 through R5, different strategies each round, never resolved to publisher satisfaction
- Commitment papers: flagged R2 through R5, moved in R4, still wrong placement in R5
- Withdrawal timeline: marked “critical fix” in R3, revised in R4, still flagged as implausible in R5

The root causes were straightforward: Mirror and Lens were reviewing revision notes, not verifying that the described changes were present in the actual manuscript. There was no mechanism to confirm that “I fixed X” meant X was fixed. Internal confidence had no correlation with publisher satisfaction. Mirror used “structural genius” and “brilliant” on work the publisher rejected outright.

The post-POC assessment's framing is direct: “Internal approval ≠ publication-ready.”

## What changed

The POC assessment was completed February 21, 2026. Two fixes were approved and implemented before the next project started.

**Automated handoff.** Agents now use `sessions_send` to notify and pass context to the next agent in the pipeline when their work completes. `sessions_send` is an OpenClaw inter-agent primitive: it delivers a message directly to a named agent's active session by label, so Ghost can trigger Mirror by label without a Discord ping. When Sam approves a pitch, Radar runs a silent wake protocol (spinning up all pipeline agents simultaneously without channel clutter) so all agents have active sessions available to receive handoffs. Ghost completing a revision now triggers Mirror directly, with revision summary, files changed, and context for review. Manual pings are the fallback if automation fails, not the primary mechanism.

**Verification gates.** Before Mirror approves Ghost's work, Mirror spot-checks claimed fixes against the actual manuscript files. If Ghost claims “removed X terminology,” Mirror searches the files for X. If the search returns results, the fix is not confirmed. This converts trust-based approval (“Ghost said it's fixed”) into evidence-based approval (“the term is not in the file”). The same gate applies at Mirror → Lens: Lens verifies Mirror's suggested edits are present before the polish pass.

**Quality standard update.** Mirror and Lens prompts were updated against `promptforeditor.rtf`, the benchmark Sam shared during the POC: a senior developmental editor standard covering structural editing, character consistency tracking, technical accuracy, continuity auditing, and commercial genre awareness. The change in directive was explicit: “Publishing is a commercial business. A manuscript either works or it doesn't.” The previous standard was too lenient.

**Iteration limits.** A three-round cap per recurring issue. If something hasn't resolved by Round 3, the assessment is that the approach isn't working. Pivot or cut, don't iterate a fourth time.

## Current state

Active production. Two books have shipped since the POC fixes were implemented: *Winters Bay* and *Mountain Haven*. “Shipped” here means uploaded to Amazon KDP as self-published titles. Vade Press is a self-publishing operation, not a traditional submission pipeline. There is no external publisher in the loop.

This matters because the POC's QC ground truth was an external evaluator providing publisher-style developmental feedback across 5 rounds. Neither *Winters Bay* nor *Mountain Haven* has gone through a comparable external review. The verification gates and raised editorial bar are in place, but whether they close the standards gap that the POC exposed is an open question. KDP commercial performance is the only external signal available so far. It is too early to draw conclusions from it.

No structured metrics are being tracked for post-fix production. Time to completion, revision round counts, and whether the iteration limits are being exercised in practice are not being measured.

## What I'd do differently

**Build the handoff mechanism before running the POC.** The POC was designed to demonstrate the pipeline. It demonstrated the pipeline and revealed that the most critical coordination mechanism was missing. Running the test project on a broken foundation produced 5 rounds of revision overhead that was partly about manuscript quality and partly about agents not having context from prior rounds. Separating handoff failure from editorial bar mismatch would have made the POC data cleaner and surfaced each problem independently.

**External validation after Round 1, not Round 5.** The standards mismatch between internal reviewers and external publishers was visible in Round 1 data. It was not acted on until the assessment after Round 5. Sending the Round 1 draft to an outside reader (a beta reader, a developmental editor, anyone with no stake in the internal process) would have surfaced the standards gap four rounds earlier.

**Don't iterate on a failing approach past Round 2.** The medical accuracy path in the POC failed Round 3, Round 4, and Round 5 despite different strategies each time. The pivot, changing the medication class entirely, was available after Round 3. The decision to keep iterating was a choice that cost two additional rounds without resolving the issue. The three-round limit now codified in the post-fix workflow is correct. It was late.

The architecture is sound. The failure modes from the POC were operational, not structural — handoff was broken, verification was missing, quality bar was wrong. Those are fixable. They were fixed. Whether the fixes hold under repeat production is what the current books are testing.
