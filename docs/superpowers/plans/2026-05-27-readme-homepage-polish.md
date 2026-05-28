# README Homepage Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the top section of `README.md` and `README.zh-CN.md` so the project homepage feels more polished while keeping the rest of both documents intact.

**Architecture:** Keep the existing split-document structure and only edit the first 40-60 lines of each README. Tighten the title block, improve the tagline and support sentence, add a compact highlights section, and leave setup, configuration, FAQ, and development sections unchanged unless a line must shift slightly to preserve flow.

**Tech Stack:** Markdown, Git, GitHub README conventions

---

### Task 1: Polish The English Homepage Section

**Files:**
- Modify: `README.md`
- Reference: `docs/superpowers/specs/2026-05-27-readme-homepage-polish-design.md`
- Review: `README.zh-CN.md`

- [ ] **Step 1: Rewrite the title block for a stronger first screen**

Update the top of `README.md` so it follows this structure:

```md
# pr-scribe-ai

![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)
![Probot](https://img.shields.io/badge/Probot-14.3.2-24292F?logo=github&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue.svg)

[中文说明 / Chinese Version](./README.zh-CN.md)

**Generate clear, structured PR descriptions automatically.**

`pr-scribe-ai` is a GitHub App that turns pull request events into polished AI-generated summaries and posts them back as PR comments.
```

- [ ] **Step 2: Add a compact highlights section under the title block**

Insert a short `## Highlights` section immediately after the support sentence.

```md
## Highlights

- Handles `opened`, `synchronize`, and `reopened` pull request events
- Builds concise PR summaries from changed files
- Supports OpenAI and OpenAI-compatible API providers
- Posts results as PR comments without overwriting the PR body
```

- [ ] **Step 3: Tighten the transition into the existing body**

Keep the current `## Why This Project` section, but ensure the transition from `Highlights` into that section feels natural. If needed, trim repetitive wording in the first paragraph so the top area does not restate the same idea three times.

Use this target wording for the first paragraph if a rewrite is needed:

```md
Writing pull request descriptions is repetitive, easy to postpone, and often inconsistent across contributors.
```

- [ ] **Step 4: Verify the rest of the document remains intact**

Read from `## How It Works` downward and confirm no unintended changes were introduced to setup, configuration, FAQ, or contribution guidance.

- [ ] **Step 5: Commit the English homepage polish**

Run:

```bash
git add README.md
git commit -m "docs: polish English README homepage"
```

### Task 2: Polish The Chinese Homepage Section

**Files:**
- Modify: `README.zh-CN.md`
- Reference: `README.md`
- Reference: `docs/superpowers/specs/2026-05-27-readme-homepage-polish-design.md`

- [ ] **Step 1: Rewrite the top section with a more polished Chinese homepage tone**

Update the top of `README.zh-CN.md` so it mirrors the English structure without forcing a literal translation.

Use this target structure:

```md
# pr-scribe-ai

![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)
![Probot](https://img.shields.io/badge/Probot-14.3.2-24292F?logo=github&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue.svg)

[English Version](./README.md)

**自动生成清晰、结构化的 PR 描述。**

`pr-scribe-ai` 是一个 GitHub App，会在 Pull Request 打开、更新或重新打开时，自动生成结构化描述，并以评论形式回写到当前 PR。
```

- [ ] **Step 2: Add a compact Chinese highlights section**

Insert the following section directly under the support sentence:

```md
## 亮点

- 支持 `opened`、`synchronize`、`reopened` 三类 PR 事件
- 根据变更文件自动生成简洁的 PR 摘要
- 支持 OpenAI 和各类 OpenAI-compatible API
- 以 PR 评论形式发布结果，不直接覆盖 PR 正文
```

- [ ] **Step 3: Tighten the opening paragraph in the next section if needed**

Keep the current `## 项目价值` section, but adjust the first sentence if the transition feels repetitive.

Preferred wording:

```md
手写 PR 描述这件事重复、琐碎，而且很容易被拖到最后，最终导致团队里的 PR 质量参差不齐。
```

- [ ] **Step 4: Verify the rest of the Chinese document remains intact**

Read from `## 工作流程` downward and confirm setup, configuration, FAQ, and contribution sections still match the intended content.

- [ ] **Step 5: Commit the Chinese homepage polish**

Run:

```bash
git add README.zh-CN.md
git commit -m "docs: polish Chinese README homepage"
```

### Task 3: Final Verification And Handoff

**Files:**
- Review: `README.md`
- Review: `README.zh-CN.md`

- [ ] **Step 1: Review the final diff for homepage-only scope**

Run:

```bash
git diff -- README.md README.zh-CN.md
```

Expected: the main changes are concentrated in the title block and early homepage sections, with the rest of each file largely unchanged.

- [ ] **Step 2: Check editor diagnostics for both Markdown files**

Run diagnostics for:
- `README.md`
- `README.zh-CN.md`

Expected: no diagnostics.

- [ ] **Step 3: Confirm the homepage reads well in both languages**

Manually review:
- the first screen feels cleaner and more intentional
- the value proposition is understandable within a few seconds
- the English and Chinese top sections feel aligned in structure

- [ ] **Step 4: Confirm working tree status**

Run:

```bash
git status --short
```

Expected: only the intended README changes remain in the working tree before any optional follow-up actions.
