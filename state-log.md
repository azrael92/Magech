# State Log — Magech Editorial Desk

Append-only. Source of truth for every state transition. Most recent at the bottom.

**Format (one line per transition):**

```
<ISO 8601 timestamp> | <piece-id> | <from-state> → <to-state> | <agent> | <one-line reason>
```

**Valid states:** `commissioned` · `drafted` · `critiqued` · `fact-checked` · `copy-edited` · `staged-for-rishi` · `published` · `retired`

**Valid agents:** `desk-editor` · `desk-skeptic` · `desk-fact-checker` · `desk-copy-desk` · `desk-production` · `desk-ns-writer` · `desk-research-writer` · `desk-projects-writer` · `desk-overview-writer` · `sam`

**Notes:**
- Reverse transitions are common (kickbacks). Same format.
- `piece-id` is the file's `slug` field. Example: `01-why-doesnt-your-ai-have-a-face`.
- One transition per line. No multi-line entries.
- File lock: only one agent writes at a time. The state-machine engine handles serialization.

---

<!-- transitions begin below -->
2026-05-20T17:00:00Z | _system | _bootstrap → _ready | desk-production | state-log initialized
