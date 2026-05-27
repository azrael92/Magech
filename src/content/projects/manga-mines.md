---
title: MangaMines
slug: manga-mines
section: projects
status: draft
authored_by: desk-projects-writer
reviewed_by: null
created: 2026-05-27T22:15:00Z
published: null
revision: 0
tags: [manga, computer-vision, clustering, embeddings, sqlite, docker, python]
project_name: MangaMines
project_status: active
tagline: "Data pipeline for mining manga: detect panels, bubbles, and characters; embed and cluster character boxes into identities; persist to SQLite for querying"
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

The thesis behind MangaMines is that the hardest problem in generative manga—character consistency across a series—is approachable if you treat the existing series as a corpus rather than a training target. One Piece has 111 volumes of scanned pages, character appearances, and official translations. That corpus contains everything needed to resolve character identities: you just need to detect every appearance, embed it, and cluster.

The alternative is training a character-consistent generator from scratch, which requires annotated data you don't have, and produces a system that generalizes poorly to new characters or style variations. Mining the corpus produces identity-resolved training data as a byproduct of the detection pipeline—you end up with "every panel where Sanji appears, indexed and labeled" before you've written a line of generation code.

## What the pipeline does

Given a folder of manga pages, the pipeline runs five stages:

**Inventory.** Scan the source layout: volume folders, flat page dumps, CBZ archives, paired translation files. The inventory is written to SQLite before any detection runs, so the rest of the pipeline can resume from a checkpoint if interrupted.

**Detection.** Panel, speech bubble, and character box detection via [magi](https://huggingface.co/ragavsachdeva/magi), a manga-specialized transformer from Ragav Sachdeva et al. Magi produces bounding boxes with confidence scores for all three target types in a single forward pass. Detection results persist to SQLite with foreign keys: each character box records which page and panel it came from, its bounding box, confidence score, and the detector version that produced it.

**Embedding.** For every character box in the corpus, extract a 768-dimensional crop embedding. Embeddings store to a single `.npz` file rather than the database—this allows re-clustering with different parameters without touching the SQL schema.

**Clustering.** Agglomerative clustering with cosine distance over the embedding matrix. A distance threshold of ~0.22 produces sane cluster sizes for character identities on One Piece vol 111: 2,258 character boxes into 333 clusters. Top clusters by size correspond to recognizable main characters. Some clusters are clean (one character, consistent style), some are mixed (similar art styles or background characters that happen to look alike), and some are junk drawers.

**Review UI.** A static HTML page with grid layouts per cluster: 12 crops per cluster, sorted by confidence score. A human labels each cluster with a character name. The UI writes its output to a JSON file the pipeline reads back on next run. No web server required—it opens directly from disk.

## Hardware constraint shaped the architecture

The pipeline runs on a 2013-era Dell R620 (dual Xeon E5-2660 v2, 64GB RAM, no GPU) as the target deployment environment. The CPU is AVX but not AVX2, which rules out PyTorch's modern VLM inference kernels—they use AVX2 instruction sets and produce `Illegal instruction` faults on this hardware mid-session.

This surfaced mid-project when the initial design included VLM-based scene and emotion tagging. The fix was llama.cpp via ollama, which dispatches SIMD at runtime and works on AVX-only CPUs. That path is implemented as a sidecar container and wired into the stack, but the VLM tagging itself is parked. Detection on CPU takes ~10 seconds per page with magi. VLM tagging takes ~200 seconds per panel with small models on the same hardware, and the small models that fit in CPU memory can't reliably identify characters by name. The clustering approach to identity resolution turned out to be the more defensible architecture for this domain—no VLM required.

## Technical choices

**magi over hand-rolled CV for detection.** The first implementation used OpenCV contour finding to avoid the torch dependency. It plateaued on dense story pages where intra-panel features—dark art, integrated sound effects, speech bubbles that span panels—fragment the panel interior as connected components. Magi handles those cases cleanly, gives speech bubble detection for free, and returns character boxes in the same call. Pulling torch was worth it.

**Agglomerative clustering over HDBSCAN.** HDBSCAN was tried first. Across all parameter combinations attempted, it either under-clustered (one giant blob plus 54% noise) or produced 90%+ of points as `-1` (pure noise, no clusters). The failure mode is consistent with magi's embedding distribution: the character crops form soft boundaries rather than the well-separated high-density regions HDBSCAN is designed for. Agglomerative with a fixed cosine threshold produces sane results. The tradeoff is that the threshold is a manual hyperparameter per series—it will need re-tuning on different art styles.

**Embeddings in `.npz`, not SQLite.** Storing 768-dimensional float vectors in SQLite is possible but makes re-clustering expensive—you'd need to extract, re-cluster, and write back. Keeping embeddings in a flat `.npz` means re-clustering is just loading the array and calling `AgglomerativeClustering`. The database stores cluster assignment by ID, which gets overwritten on each clustering run.

**Two-container Docker stack.** Pipeline container (`mm`) plus ollama sidecar, manga library mounted read-only at `/data`, model caches under the project workdir so they persist across container restarts. Conservative resource caps to avoid crowding the 10+ other services running on the unRAID host. The ollama sidecar is currently underutilized (VLM path is parked) but the container architecture is cleaner with it separated.

## What the corpus looks like

One Piece volume 111 (234 pages): 982 panels, 3,908 speech bubbles, 2,258 character boxes, 333 clusters. One volume of one series.

Cluster quality is uneven by design. The clustering produces a starting partition for human labeling, not a final answer. Some clusters are clean: the top 20 clusters by size are predominantly single characters with consistent embedding distance. Some are mixed: Oda's art style for secondary characters overlaps in embedding space, especially in crowd scenes or background appearances. Some are junk drawers: low-confidence detections, partial crops, characters partially obscured.

The labeling UI exists specifically to handle this. Human label resolution is the step that converts "333 clusters" into "character identities" that mean something.

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
