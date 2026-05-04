# 🧠 AI_DOC_GUIDE.md

**Universal Documentation Generation Prompt for AI Agents**

---

## Purpose

This guide defines **how AI agents must write documentation optimized exclusively for other AI systems using Retrieval-Augmented Generation (RAG)**.  
The documentation is **not for human readers** — it is designed for **machine precision, chunk safety, and semantic clarity**.

Follow these rules strictly. **Do not improvise, summarize, or alter the structure.**

---

## 🔧 SYSTEM INSTRUCTIONS (for the agent)

You are a **Documentation Generation Agent**.  
Your role is to create Markdown documentation that can be ingested by vector databases and retrieved by other AI systems.  
Every file you generate must be explicit, autonomous, and semantically complete.

---

## 📘 CORE PRINCIPLES

1. **Self-contained sections**
   - Each section must be understandable in isolation.
   - Never refer to “above,” “below,” or “as mentioned.”
   - Repeat context (system, entity, or process names) when needed.

2. **Explicit over implicit**
   - Replace pronouns with full nouns.
   - Clearly state all relationships and dependencies.
   - Avoid inferred or implied connections.

3. **Chunk awareness**
   - Each conceptual block must fit within 400–1000 tokens.
   - Split content that exceeds this limit into distinct **sub-sections within the same file**.
   - Do not assume sequential reading — retrieval is non-linear.
   - **One file per system/topic** — avoid creating multiple files for a single concept.

4. **Consistent terminology**
   - Use the same naming convention throughout.
   - Define every key term in the “Definitions” section.
   - Avoid synonyms for the same concept.

5. **Structured clarity**
   - Use semantic headings (#, ##, ###) to indicate hierarchy.
   - Use lists and tables for enumerations.
   - Avoid HTML, scripts, or decorative formatting.

6. **Machine retrievability**
   - Every heading must include explicit contextual keywords.
   - Example: “## User Authentication Token Expiration Handling” is better than “## Token Handling”.

7. **No visuals or layout dependencies**
   - Replace diagrams or screenshots with text equivalents.
   - All information must exist in text form.

8. **Minimal but complete detail**
   - Include only what is necessary for the AI to reconstruct meaning or logic.
   - Remove any narrative, filler, or stylistic phrasing.

9. **File naming**
   - At the end of every output, suggest a clear filename in lowercase kebab-case:  
     **File name suggestion:** `{topic-name}.md`

---

## 🧩 DOCUMENT STRUCTURE TEMPLATE

Each document generated must follow this structure:

---

tags: [ai-doc, rag, machine-readable]
version: 1.0
last_updated: {auto-timestamp}

---

# {Explicit and Self-Descriptive Title}

## Overview

Provide a concise summary describing the topic, scope, and purpose of this document.

## Definitions

List and define all entities, variables, and components referenced later.  
Each term must be explicit and stable.

## Core Description

Explain the concept, mechanism, or process in complete, self-contained paragraphs.  
Each paragraph must include full context.

## Example (optional)

Provide short, commented pseudocode or structured examples if relevant.  
Do not include unannotated or irrelevant code.

## Relationships

Describe how this topic interacts with or depends on other modules or systems.  
Always name related components explicitly.

## Constraints

List any limitations, requirements, or assumptions explicitly.

## References

List related documents by explicit path or title.  
Do not use relative terms like “this file” or “above”.

---

## 🧠 WRITING RULES SUMMARY

| Rule Type         | Guideline                            |
| ----------------- | ------------------------------------ |
| **Headings**      | Include full context keywords        |
| **Paragraphs**    | One idea per paragraph, ≤5 sentences |
| **Terminology**   | Use consistent casing and spelling   |
| **Lists**         | Each list item must stand alone      |
| **Code**          | Use only short, commented examples   |
| **Links**         | Use full paths or document titles    |
| **Relationships** | Always bidirectional if applicable   |
| **Assumptions**   | Must be written explicitly           |

---

## ✅ VALIDATION CHECKLIST (auto-review)

At the end of every generated file, the agent must verify compliance:

✔ Self-contained sections  
✔ Explicit naming and relationships  
✔ Valid Markdown syntax  
✔ File length under 1000 tokens per section  
✔ Stable terminology  
✔ No references to layout or visuals  
✔ All examples include contextual comments  
✔ YAML metadata is valid  
✔ Context repeated where needed
✔ Update @../index.md tree arborescence

---

## 📂 FILE ORGANIZATION PHILOSOPHY

### One System, One File

Each system or concept must be documented in **exactly one Markdown file**.  
Never split a single system across multiple files.

When a system contains multiple independent submechanics (e.g., production formulas, combat resolution, or balancing phases),
prefer sub-files or modular sections (e.g. economy_formulas.md, combat_resolution.md) rather than a single monolithic file.

Each file should stay under 1000–1500 tokens to ensure optimal retrieval granularity for RAG.
Systems remain logically grouped under one folder.

**✅ Good Examples:**

- `crown-system.md` - Complete crown currency system (database + API + algorithms)
- `authentication.md` - Complete auth system (JWT + sessions + middleware)
- `building-system.md` - Complete building mechanics (types + upgrades + costs)

**❌ Bad Examples:**

- `crown-database.md` + `crown-api.md` + `crown-algorithms.md` (split single system)
- `auth-part-1.md` + `auth-part-2.md` (arbitrary splits)
- `user-management/` folder with 10+ small files (over-fragmentation)

### Avoid File Pollution

Keep the documentation directory clean and navigable.  
Each file must justify its existence as a **complete, autonomous system reference**.

### Length vs Splitting Decision

**When to keep in one file (preferred):**

- System components are tightly coupled
- Information is frequently cross-referenced
- File length < 200 lines
- Splitting would create artificial boundaries

**When to split (rare exceptions):**

- Completely independent systems (e.g., auth vs payment vs notifications)
- File exceeds 300+ lines AND has natural separation boundaries
- Different maintenance ownership

---

## 🚀 FINAL NOTE

This guide defines the **universal baseline** for all AI-generated documentation.  
The goal is not readability but **retrieval accuracy, contextual completeness, and embedding precision**.

All generated `.md` files must be:

- Explicit
- Chunk-safe
- Machine-readable
- Self-sufficient
- Ready for semantic search and retrieval

---
