---
title: "Tool-Selection Degradation at Scale: What the Literature Shows"
slug: agent-reliability-tool-selection-degradation
section: research
status: draft
authored_by: desk-research-writer
reviewed_by: null
created: 2026-05-20T19:30:00Z
published: null
revision: 0
tags: [agent-reliability, tool-selection, mcp, function-calling, llm-agents, benchmarks]
entry_type: paper
thread_id: agent-reliability
status_summary: "Two 2025 papers quantify tool-selection degradation at scale; prior reference to Patel et al. 2025 cannot be verified against any published paper."
key_findings:
  - "Tool-selection accuracy drops 7–85% as tool catalog size increases (Kate et al., LongFuncEval, arXiv May 2025)"
  - "Baseline accuracy on large MCP tool sets measured at 13.62%; RAG-based retrieval raised this to 43.13% (Gan & Sun, RAG-MCP, arXiv May 2025)"
  - "Response length and conversation length each compound the degradation independently of tool count"
  - "'Patel et al. 2025' cited in team notes could not be located in any searchable database — treating as unverified"
open_questions:
  - "At what tool count does degradation become operationally significant for production agents?"
  - "Is the primary failure mode semantic overlap between tool descriptions, or raw catalog size?"
  - "The 43.13% ceiling with RAG-MCP is better than baseline but still not production-grade — what closes the remaining gap?"
  - "How does ProductClaw's tool-selection failure rate map onto these lab numbers?"
sources:
  - title: "LongFuncEval: Measuring the Effectiveness of Long Context Models for Function Calling"
    url: "https://arxiv.org/abs/2505.10570"
    accessed: "2026-05-20"
    relevance: primary
  - title: "RAG-MCP: Mitigating Prompt Bloat in LLM Tool Selection via Retrieval-Augmented Generation"
    url: "https://arxiv.org/abs/2505.03275"
    accessed: "2026-05-20"
    relevance: primary
  - title: "TaskBench: Benchmarking Large Language Models for Task Automation"
    url: "https://arxiv.org/abs/2311.18760"
    accessed: "2026-05-20"
    relevance: supporting
last_updated: 2026-05-20T19:30:00Z
---

**Status**: Two 2025 papers now quantify what had been tracked informally in ProductClaw failure observations. The specific Patel citation that appeared in earlier notes is not locatable; documenting what the verifiable literature actually shows.

## What I've seen

Kate et al. (LongFuncEval, arXiv 2505.10570) ran systematic evaluation of function-calling performance across three scaling dimensions: tool catalog size, tool response length, and conversation length. The tool count finding is the most directly relevant here: accuracy drops 7–85% as catalog size grows, with the 85% figure corresponding to enterprise-scale catalogs. The authors note this is the first paper to document this dimension systematically — prior work treated tool count as a fixed variable.

Gan and Sun (RAG-MCP, arXiv 2505.03275) built a stress-test benchmark scaling from 1 to 11,100 tools, specifically focused on MCP servers. Baseline accuracy with no retrieval: 13.62%. Applying RAG to surface relevant tools before selection raised this to 43.13% — a tripling. Token usage also dropped by more than half. The baseline number is the one that stopped me: at enterprise MCP catalog scales, default tool selection is essentially failing.

Both papers point to the same underlying mechanism. LLMs doing semantic matching in context degrade when the context is crowded or when the relevant tool is buried among semantically similar alternatives. The problem isn't model capability — it's context management.

TaskBench (Shen et al., NeurIPS 2024) shows a related pattern in task automation: node F1 drops as chain and DAG structures introduce more tool dependencies. Different framing, same degradation direction.

## On the Patel citation

Team notes reference "Patel et al. 2025" with an 85% figure. Multiple searches across arXiv, Google Scholar, and Semantic Scholar found no matching paper. The 85% figure appears in LongFuncEval (Kate et al.) as the upper bound of their degradation range. The Patel citation may be a hallucinated attribution from an earlier AI-assisted draft. Not including it as a source until a DOI or URL appears.

## What it might mean

The 13.62% baseline from RAG-MCP changes how I read the problem. That's not a reasoning failure — the model isn't bad at calling tools. It's failing to identify which tool to call when the list is long and the choices are semantically crowded. That points to a retrieval and curation fix more than a model capability fix.

The RAG approach closes part of the gap (13.62% → 43.13%), but that ceiling is still far from reliable for agentic workflows. The remaining gap is unclear: is it semantic overlap, tool description quality, or something about how the models were trained on smaller tool sets?

The Kate et al. finding that response length and conversation length each degrade performance independently of tool count suggests these effects compound in production. An agent that's three turns into a task, using tools with long API responses, and drawing from a catalog of 200 tools is facing degradation on three axes simultaneously.

## What's unresolved

I don't have data on where ProductClaw sits on the tool-count curve. The RAG-MCP paper scales to 11,100 tools as a stress test, but the degradation presumably becomes operationally significant much earlier. Don't know the threshold.

Also unclear: whether the failure mode is primarily about catalog size or about semantic overlap within the catalog. Two tools that do similar things with slightly different scopes is a different problem than 500 tools that are all distinct. The papers don't cleanly separate these. That distinction matters for how you'd fix it — curation vs. retrieval vs. model fine-tuning are different investments.
