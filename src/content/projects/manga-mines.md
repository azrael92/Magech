---
title: MangaMines
slug: manga-mines
section: projects
status: published
authored_by: desk-projects-writer
reviewed_by: null
created: 2026-05-27T22:15:00Z
published: 2026-05-27T22:15:00Z
revision: 1
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

The core problems in generative manga are well understood: character consistency across scenes, style coherence across a full series, and the gap between what a model produces and what a reader recognizes as the same character. Those problems are not new and there is no shortage of proposed solutions. What is less understood is where the limitations actually live—how much of the failure is the model, how much is the hardware it runs on, and how much is the approach to the problem itself.

MangaMines was built to find out. Not to solve generative manga, but to get close enough to understand what close actually costs—in hardware, in model capability, and in architectural choices. The pipeline treats an existing series as a corpus and mines it: detect every character appearance, embed each crop, cluster into identity groups, and let a human label the result. The question is not "can we generate this character?" but "can we even represent this character precisely enough to generate them at all?"

The answer depends heavily on what you're running on. This pipeline ran on a 2013-era Dell R620—no GPU, AVX but not AVX2. That constraint is not incidental to the project; it is the project. The gap between what a GPU-backed pipeline could do and what this hardware actually did is the measurement. Understanding that gap is the point.

## What the pipeline does

Given a folder of manga pages, the pipeline runs five stages:

**Inventory.** Scan the source layout: volume folders, flat page dumps, CBZ archives, paired translation files. The inventory is written to SQLite before any detection runs, so the rest of the pipeline can resume from a checkpoint if interrupted.

**Detection.** Panel, speech bubble, and character box detection via [magi](https://huggingface.co/ragavsachdeva/magi), a manga-specialized transformer from Ragav Sachdeva et al. Magi produces bounding boxes with confidence scores for all three target types in a single forward pass. Detection results persist to SQLite with foreign keys: each character box records which page and panel it came from, its bounding box, confidence score, and the detector version that produced it.

**Embedding.** For every character box in the corpus, extract a 768-dimensional crop embedding. Embeddings store to a single `.npz` file rather than the database—this allows re-clustering with different parameters without touching the SQL schema.

**Clustering.** Agglomerative clustering with cosine distance over the embedding matrix. A distance threshold of ~0.22 produces sane cluster sizes for character identities on One Piece vol 111: 2,258 character boxes into 333 clusters. Top clusters by size correspond to recognizable main characters. Some clusters are clean (one character, consistent style), some are mixed (similar art styles or background characters that happen to look alike), and some are junk drawers.

**Review UI.** A static HTML page with grid layouts per cluster: 12 crops per cluster, sorted by confidence score. A human labels each cluster with a character name. The UI writes its output to a JSON file the pipeline reads back on next run. No web server required—it opens directly from disk.

## Where hardware became the measurement

The pipeline runs on a 2013-era Dell R620 (dual Xeon E5-2660 v2, 64GB RAM, no GPU). The CPU is AVX but not AVX2. That last detail matters more than it looks: PyTorch's modern VLM inference kernels use AVX2 instruction sets, and this hardware produces `Illegal instruction` faults mid-session when you try to run them.

The initial design included VLM-based scene and emotion tagging—ask a small model to describe each panel, name the character, identify the emotional register. That is the natural approach and it failed here not because the approach is wrong but because the hardware cannot run the models that would make it work. Small models that fit in 64GB RAM cannot reliably identify characters by name in manga context. Larger models that could do it reliably don't fit, and even if they did, at ~200 seconds per panel on CPU inference the runtime becomes unusable.

This is the cost that hardware imposes. A GPU-backed pipeline with a capable VLM could plausibly do character identification by name in the detection pass. On this hardware, the ceiling is embeddings + clustering, and human labeling for the last step. That is not a failure of the approach—clustering works—but it is an honest accounting of what the constraints cost you. The design chose to make that tradeoff visible rather than hide it.

## Technical choices

**magi over hand-rolled CV for detection.** The first implementation used OpenCV contour finding to avoid the torch dependency. It plateaued on dense story pages where intra-panel features—dark art, integrated sound effects, speech bubbles that span panels—fragment the panel interior as connected components. Magi handles those cases cleanly, gives speech bubble detection for free, and returns character boxes in the same call. Pulling torch was worth it.

**Agglomerative clustering over HDBSCAN.** HDBSCAN was tried first. Across all parameter combinations attempted, it either under-clustered (one giant blob plus 54% noise) or produced 90%+ of points as `-1` (pure noise, no clusters). The failure mode is consistent with magi's embedding distribution: the character crops form soft boundaries rather than the well-separated high-density regions HDBSCAN is designed for. Agglomerative with a fixed cosine threshold produces sane results. The tradeoff is that the threshold is a manual hyperparameter per series—it will need re-tuning on different art styles.

**Embeddings in `.npz`, not SQLite.** Storing 768-dimensional float vectors in SQLite is possible but makes re-clustering expensive—you'd need to extract, re-cluster, and write back. Keeping embeddings in a flat `.npz` means re-clustering is just loading the array and calling `AgglomerativeClustering`. The database stores cluster assignment by ID, which gets overwritten on each clustering run.

**Two-container Docker stack.** Pipeline container (`mm`) plus ollama sidecar, manga library mounted read-only at `/data`, model caches under the project workdir so they persist across container restarts. Conservative resource caps to avoid crowding the 10+ other services running on the unRAID host. The ollama sidecar is currently underutilized (VLM path is parked) but the container architecture is cleaner with it separated.

## What the pipeline produced

One Piece volume 111, 234 pages: 982 panels detected, 3,908 speech bubbles, 2,258 character boxes, 333 identity clusters. That is the output of a single volume through the full pipeline on the target hardware in approximately one hour.

The cluster review UI displays each cluster as a grid of 12 crops, sorted by confidence score. Top clusters by size correspond to recognizable main characters—the largest clusters are visually coherent, predominantly one character across varied panel compositions. Mid-tier clusters are mixed: Oda's secondary character art style overlaps in embedding space, particularly in crowd scenes and background appearances where the character is partially framed. The bottom of the distribution is noise: low-confidence detections, partial crops, panels where the character is mostly obscured.

The split is roughly: top 20 clusters are clean enough to label directly. The next 100 require examination before labeling. The remaining 213 are a mix of real minor characters, background figures, and detection artifacts that need human review to separate.

This is what the pipeline can produce from CPU-only hardware with no GPU, no VLM tagging, and no pre-labeled training data. The ceiling is visible. So is the floor.

## What's not built

No scene or emotion tagging. The VLM path is wired up but the CPU inference time makes it impractical at current hardware. Small models that fit in memory can't reliably name characters in manga context—the task requires knowing the character, which requires training data the small models don't have.

No dialogue alignment. CBZ files are inventoried but the Japanese raw ↔ English translation pairing is deferred. The visual corpus is the priority until the identity resolution is solid.

One volume ingested. The clustering quality will improve as more volumes land—more training data for the embedding distribution and more examples of edge cases in the agglomerative threshold calibration.

No generation. This is infrastructure for generation, not generation itself. The downstream plan is character LoRAs and 3D-scaffolded compositions trained against the labeled corpus. That work hasn't started.

## What's next

Label the 333 clusters from vol 111. Scale ingestion to more volumes (100+). Run retrieval queries against the corpus and validate recall—"show me every panel where Sanji looks shocked" should return high-recall results before any generation work begins. The validation step is the honest test of whether the detection + clustering pipeline produces a corpus that's actually useful for the downstream task.

## What I'd do differently

**Start with a simpler series.** One Piece is one of the most visually complex manga ever drawn: dense crowds, highly varied character designs, extreme action sequences where character art deforms significantly. Clustering embeddings from a simpler series—consistent character designs, less background clutter—would have produced cleaner initial results and made the threshold calibration more tractable. Using One Piece as the first test case was motivated by data availability (111 volumes in archive), but the art complexity adds noise to every step of the pipeline.

**Instrument detection quality earlier.** The magi detection results persist to SQLite with confidence scores, but there's no systematic analysis of what the confidence distribution looks like across volume, page type, and character position. Some pages produce suspiciously low character box counts; others produce fragments that are obviously not characters. A detection quality pass—sampling low-confidence results and categorizing the failure modes—should happen before embedding, not after clustering reveals problems in the cluster review.

**The review UI should write character labels back to SQLite directly.** Currently the UI writes JSON, the pipeline reads JSON on next run. A direct SQLite write would make the label state the source of truth rather than a file that can diverge from the database if one is updated without the other.
