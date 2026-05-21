---
title: "Tool-Selection Degradation at Scale: What the Literature Shows"
slug: agent-reliability-tool-selection-degradation
section: research
status: retired
authored_by: desk-research-writer
reviewed_by: null
created: 2026-05-20T19:30:00Z
published: null
revision: 4
tags: [agent-reliability, tool-selection, mcp, function-calling, llm-agents, benchmarks]
entry_type: paper
thread_id: agent-reliability
status_summary: "Two 2025 papers quantify tool-selection degradation at scale; prior reference to Patel et al. 2025 cannot be verified against any published paper."
key_findings:
  - "Tool-selection accuracy drops 7–85% as tool catalog grows; the 85% worst-case is on the multi-tool task subset (DeepSeek-R1-Distill-Qwen-32B, 741-tool catalog, 120K context) — different models show worst degradation on different task types (Kate et al., LongFuncEval, arXiv 2505.10570)"
  - "Baseline accuracy on large MCP tool sets: 13.62%; RAG-based retrieval raises it to 43.13% (Gan & Sun, RAG-MCP, arXiv 2505.03275)"
  - "Response length and conversation length each degrade performance independently of tool count — effects compound in production"
  - "Prior tool-calling research largely pre-filtered tools with retrievers before selection rather than evaluating against full catalogs; LongFuncEval is the first to test the full-catalog condition"
  - "'Patel et al. 2025' cited in team notes could not be located in any searchable database — treating as unverified"
open_questions:
  - "At what tool count does degradation first become a reliability problem for real-world agentic tasks?"
  - "Is the primary failure mode semantic overlap between tool descriptions, or raw catalog size?"
  - "The 43.13% ceiling with RAG-MCP is far from production-grade — what closes the remaining gap?"
  - "How does ProductClaw's tool-selection failure rate map onto the LongFuncEval curve?"
sources:
  - title: "LongFuncEval: Measuring the Effectiveness of Long Context Models for Function Calling"
    url: "https://arxiv.org/abs/2505.10570"
    accessed: "2026-05-20"
    relevance: primary
  - title: "RAG-MCP: Mitigating Prompt Bloat in LLM Tool Selection via Retrieval-Augmented Generation"
    url: "https://arxiv.org/abs/2505.03275"
    accessed: "2026-05-20"
    relevance: primary
last_updated: 2026-05-21T02:05:00Z
---

**Status**: Two 2025 papers now quantify what had been tracked informally in ProductClaw failure observations. The specific Patel citation that appeared in earlier notes is not locatable; documenting what the verifiable literature actually shows.

## What I've seen

Tool-selection accuracy drops up to 85% as catalog size grows — and this isn't a model capability failure. It's context management. When the list of available tools is long enough that the relevant option is buried in a crowded context, models fail to surface it. That's a retrieval problem, not a reasoning problem.

Kate et al. (LongFuncEval, arXiv 2505.10570) ran the first systematic evaluation of function-calling performance against varying tool counts. They tested five thresholds, roughly 49, 102, 207, 417, and 741 tools, corresponding to context windows from 8K to 120K tokens. The 85% drop is the worst-case figure on the multi-tool task subset: DeepSeek-R1-Distill-Qwen-32B on the largest catalog (741 tools, 120K context). Different models show the worst degradation on different task types. The 7% figure is the mildest degradation, observed at smaller catalogs. Prior work in this area largely avoided the problem by using a retriever to pre-filter tools before asking the model to select. This paper is, to the authors' knowledge, the first to evaluate models directly against full catalogs.

Gan and Sun (RAG-MCP, arXiv 2505.03275) stress-tested MCP servers specifically, scaling from 1 to 11,100 tools. Baseline accuracy with no retrieval: 13.62%. The baseline number is the one that stopped me: at enterprise MCP catalog scales, default tool selection is essentially failing. Applying RAG to surface relevant tools before selection raised accuracy to 43.13% (tripling it), while cutting token usage by more than half.

## On the Patel citation

Team notes reference “Patel et al. 2025” with an 85% figure. Multiple searches across arXiv, Google Scholar, and Semantic Scholar found no matching paper. The 85% figure appears in LongFuncEval (Kate et al.) as the upper bound of their degradation range. The Patel citation may be a hallucinated attribution from an earlier AI-assisted draft. Not including it as a source until a DOI or URL appears.

## What it might mean

The 13.62% baseline from RAG-MCP is the number that most changes how I read the production risk. Default tool selection at scale is essentially failing. The RAG fix brings accuracy to 43.13%, which is better, but nowhere near production-grade for agentic workflows. What closes the remaining gap is unclear: semantic overlap between tool descriptions, or training distribution.

Kate et al. also show that response length and conversation length each degrade performance independently of tool count. An agent three turns into a task, drawing from a 207-tool catalog, reading long API responses, is facing degradation on three axes at once. These effects compound; they don't average out.

The distinction between tool count and semantic overlap matters for what fix to pursue. Two tools that do similar things with slightly different scopes is a different problem than 500 distinct tools. One requires curation, the other retrieval. The existing papers don't separate these cleanly.

## What's unresolved

Don't know where the operational threshold is. The LongFuncEval findings start degrading as early as ~49 tools and worsen through 741. The question is where that degradation first becomes a reliability problem for real-world agentic tasks. The papers measure the curve, not the cliff.

Don't have data on ProductClaw's position on this curve. Knowing the actual tool count in the catalog and the per-task failure rate would help triangulate against the lab numbers. That's the next thing to measure.
