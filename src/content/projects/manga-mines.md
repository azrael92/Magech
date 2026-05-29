---
title: MangaMines
slug: manga-mines
sort_order: 4
section: projects
status: published
authored_by: desk-projects-writer
reviewed_by: null
created: 2026-05-27T22:15:00Z
published: 2026-05-27T22:15:00Z
revision: 2
last_updated: 2026-05-29T00:00:00Z
tags: [manga, computer-vision, clustering, embeddings, sqlite, docker, python]
project_name: MangaMines
project_status: active
tagline: "Detect, embed, and cluster character appearances from manga at scale — building identity-resolved training data from the corpus itself"
problem: "Character consistency is the central unsolved problem in generative manga. Training data that resolves character identities across a series doesn't exist in a queryable form—creating it by hand is infeasible at the scale of a long-running series."
approach: "Mine it from existing work. Detect every character appearance in a series using a manga-specialized vision model, embed each crop, cluster embeddings into identity groups, and let a human label the result. The corpus becomes the data layer for downstream generative work."
stack: ["Python", "Docker", "SQLite", "magi", "OpenCV", "scikit-learn", "numpy", "ollama"]
links:
  - label: "GitHub"
    url: "https://github.com/azrael92/manga-mines"
metrics:
  - label: "Pages ingested (One Piece vol 111)"
    value: "234"
  - label: "Character boxes detected"
    value: "2,258"
  - label: "Identity clusters"
    value: "333"
  - label: "End-to-end runtime on target hardware"
    value: "~1 hour per volume"
postmortem_notes: null
---

Character consistency is the hard problem in generative manga. Training data that resolves identity across a long-running series doesn't exist in queryable form—hand-labeling is infeasible at scale. MangaMines mines it from the corpus itself: detect every character appearance using a manga-specialized vision model, embed each crop, cluster into identity groups, let a human label the result.

One Piece volume 111, 234 pages: 982 panels, 3,908 speech bubbles, 2,258 character boxes, 333 identity clusters. Approximately one hour end-to-end on a CPU-only server.

## What the pipeline does

Given a folder of manga pages, the pipeline runs five stages:

**Inventory.** Scan the source layout: volume folders, flat page dumps, CBZ archives, paired translation files. The inventory is written to SQLite before any detection runs, so the rest of the pipeline can resume from a checkpoint if interrupted.

**Detection.** Panel, speech bubble, and character box detection via [magi](https://huggingface.co/ragavsachdeva/magi), a manga-specialized transformer from Ragav Sachdeva et al. Magi produces bounding boxes with confidence scores for all three target types in a single forward pass. Detection results persist to SQLite with foreign keys: each character box records which page and panel it came from, its bounding box, confidence score, and the detector version that produced it.

**Embedding.** For every character box in the corpus, extract a 768-dimensional crop embedding. Embeddings store to a single `.npz` file rather than the database—this allows re-clustering with different parameters without touching the SQL schema.

**Clustering.** Agglomerative clustering with cosine distance over the embedding matrix. A distance threshold of ~0.22 produces sane cluster sizes for character identities on One Piece vol 111: 2,258 character boxes into 333 clusters. Top clusters by size correspond to recognizable main characters. Some clusters are clean (one character, consistent style), some are mixed (similar art styles or background characters that happen to look alike), and some are junk drawers.

**Review UI.** A static HTML page with grid layouts per cluster: 12 crops per cluster, sorted by confidence score. A human labels each cluster with a character name. The UI writes its output to a JSON file the pipeline reads back on next run. No web server required—it opens directly from disk.

## Hardware constraints and design choices

The pipeline runs on a 2013-era Dell R620—dual Xeon E5-2660 v2, 64GB RAM, no GPU. The CPU is AVX but not AVX2, which rules out PyTorch's modern VLM inference kernels; they use AVX2 instructions and produce `Illegal instruction` faults mid-session on this hardware.

The initial design included VLM-based scene and emotion tagging—ask a small model to describe each panel, name the character, identify the emotional register. That path is parked: small models that fit in 64GB RAM can't reliably identify characters by name in manga context, and at ~200 seconds per panel on CPU inference the runtime is unusable regardless. The design shifted to what the hardware can actually do: embeddings + clustering for identity grouping, human labeling for the final step. The ceiling is visible, which is the point—building on constrained hardware makes the tradeoffs legible rather than hidden.

## Technical choices

**magi over hand-rolled CV for detection.** The first implementation used OpenCV contour finding to avoid the torch dependency. It plateaued on dense story pages where intra-panel features—dark art, integrated sound effects, speech bubbles that span panels—fragment the panel interior as connected components. Magi handles those cases cleanly, gives speech bubble detection for free, and returns character boxes in the same call. Pulling torch was worth it.

**Agglomerative clustering over HDBSCAN.** HDBSCAN was tried first. Across all parameter combinations attempted, it either under-clustered (one giant blob plus 54% noise) or produced 90%+ of points as `-1` (pure noise, no clusters). The failure mode is consistent with magi's embedding distribution: character crops form soft boundaries rather than the well-separated high-density regions HDBSCAN is designed for. Agglomerative with a fixed cosine threshold produces sane results. The tradeoff is that the threshold is a manual hyperparameter per series—it will need re-tuning on different art styles.

**Embeddings in `.npz`, not SQLite.** Storing 768-dimensional float vectors in SQLite is possible but makes re-clustering expensive—extract, re-cluster, write back. Keeping embeddings in a flat `.npz` means re-clustering is just loading the array and calling `AgglomerativeClustering`. The database stores cluster assignment by ID, overwritten on each clustering run.

**Two-container Docker stack.** Pipeline container (`mm`) plus ollama sidecar, manga library mounted read-only at `/data`, model caches under the project workdir so they persist across container restarts. Conservative resource caps to avoid crowding the 10+ other services on the unRAID host. The ollama sidecar is underutilized while the VLM path is parked, but the separation is cleaner architecturally.

## What the pipeline produced

Top clusters by size correspond to recognizable main characters—the largest clusters are visually coherent, predominantly one character across varied panel compositions. Mid-tier clusters are mixed: Oda's secondary character art style overlaps in embedding space, particularly in crowd scenes and background appearances where a character is partially framed. The bottom of the distribution is noise: low-confidence detections, partial crops, panels where the character is mostly obscured.

Roughly: the top 20 clusters are clean enough to label directly. The next 100 require examination. The remaining 213 are a mix of real minor characters, background figures, and detection artifacts.

## What's not built

No scene or emotion tagging. The VLM path is wired up but CPU inference time makes it impractical on current hardware. No dialogue alignment—CBZ files are inventoried but the Japanese raw ↔ English translation pairing is deferred until identity resolution is solid. No generation. This is infrastructure for generation, not generation itself.

## What's next

Label the 333 clusters from vol 111. Scale ingestion to more volumes (100+). Run retrieval queries against the corpus and validate recall before any generation work begins—"show me every panel where Sanji looks shocked" should return high-recall results. That validation is the honest test of whether the pipeline produces a corpus that's actually useful downstream.

## What I'd do differently

**Start with a simpler series.** One Piece is one of the most visually complex manga ever drawn: dense crowds, highly varied character designs, extreme action sequences where character art deforms significantly. A simpler series—consistent character designs, less background clutter—would have produced cleaner initial results and made threshold calibration more tractable. Using One Piece as the first test case was motivated by data availability (111 volumes in archive), but the art complexity adds noise at every step.

**Instrument detection quality earlier.** Magi detection results persist to SQLite with confidence scores, but there's no systematic analysis of what the confidence distribution looks like across volume, page type, and character position. A detection quality pass—sampling low-confidence results and categorizing failure modes—should happen before embedding, not after clustering reveals problems in cluster review.

**Have the review UI write directly to SQLite.** Currently the UI writes JSON, the pipeline reads JSON on next run. A direct SQLite write would make label state the source of truth rather than a file that can diverge from the database.
