# PR Description Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Probot workflow that reacts to pull request open and update events, generates an AI summary through DeepSeek, and posts the result as a PR comment.

**Architecture:** Keep the implementation centered in `index.js` to match the current app size, but split the logic into small helper functions for diff summarization, prompt building, model invocation, and comment posting. Use the ESM-friendly `openai` SDK configured against DeepSeek's compatible API endpoint so the app can call `deepseek-chat` without introducing CommonJS-only patterns.

**Tech Stack:** Node.js, Probot, Octokit REST API, OpenAI SDK configured for DeepSeek compatibility, `node:test`, Nock

---

## File Structure

- Modify: `package.json`
  - Add the `openai` runtime dependency so the app can call the DeepSeek-compatible chat completions API from ESM code.
- Modify: `package-lock.json`
  - Capture the installed dependency graph after adding `openai`.
- Modify: `.env.example`
  - Document the required `DEEPSEEK_API_KEY` environment variable.
- Modify: `index.js`
  - Replace the starter `issues.opened` example with the pull request automation flow and helper functions.
- Modify: `test/index.test.js`
  - Replace the sample issue test with a pull request integration test that mocks GitHub and DeepSeek endpoints.
- Create: `test/fixtures/pull_request.opened.json`
  - Provide a deterministic webhook payload fixture for `pull_request.opened`.

### Task 1: Add The Failing PR Test

**Files:**
- Create: `test/fixtures/pull_request.opened.json`
- Modify: `test/index.test.js`
- Test: `test/index.test.js`

- [ ] **Step 1: Create the pull request webhook fixture**

Create `test/fixtures/pull_request.opened.json` with this payload:

```json
{
  "action": "opened",
  "number": 7,
  "pull_request": {
    "number": 7
  },
  "repository": {
    "name": "testing-things",
    "owner": {
      "login": "hiimbex"
    }
  },
  "installation": {
    "id": 2
  }
}
```

- [ ] **Step 2: Replace the sample issue test with a pull request test**

Update `test/index.test.js` so it imports the new fixture and asserts the PR flow. Use this test file content:

```javascript
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import nock from "nock";
import { Probot, ProbotOctokit } from "probot";

import myProbotApp from "../index.js";
import payload from "./fixtures/pull_request.opened.json" with { type: "json" };

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const privateKey = fs.readFileSync(
  path.join(__dirname, "fixtures/mock-cert.pem"),
  "utf-8",
);

describe("My Probot app", () => {
  let probot;

  beforeEach(() => {
    nock.disableNetConnect();
    process.env.DEEPSEEK_API_KEY = "test-deepseek-key";

    probot = new Probot({
      appId: 123,
      privateKey,
      Octokit: ProbotOctokit.defaults((instanceOptions) => ({
        ...instanceOptions,
        retry: { enabled: false },
        throttle: { enabled: false },
      })),
    });

    probot.load(myProbotApp);
  });

  afterEach(() => {
    delete process.env.DEEPSEEK_API_KEY;
    nock.cleanAll();
    nock.enableNetConnect();
  });

  test("creates an AI-generated comment when a pull request is opened", async () => {
    const githubMock = nock("https://api.github.com")
      .post("/app/installations/2/access_tokens")
      .reply(200, {
        token: "test",
        permissions: {
          pull_requests: "write",
          issues: "write",
        },
      })
      .get("/repos/hiimbex/testing-things/pulls/7/files?per_page=100")
      .reply(200, [
        { filename: "src/index.js", changes: 24 },
        { filename: "package.json", changes: 6 },
      ])
      .post("/repos/hiimbex/testing-things/issues/7/comments", (body) => {
        assert.match(
          body.body,
          /AI 自动生成的 PR 描述[\s\S]*变更概述：新增 PR 自动描述能力/,
        );
        return true;
      })
      .reply(200);

    const deepseekMock = nock("https://api.deepseek.com")
      .post("/chat/completions", (body) => {
        assert.equal(body.model, "deepseek-chat");
        assert.equal(body.temperature, 0.3);
        assert.match(body.messages[0].content, /src\/index\.js: 24 行变更/);
        return true;
      })
      .reply(200, {
        id: "chatcmpl-test",
        object: "chat.completion",
        created: 1710000000,
        model: "deepseek-chat",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content:
                "变更概述：新增 PR 自动描述能力\n主要修改点：接入 DeepSeek 并自动评论\n测试建议：执行 webhook 集成测试",
            },
            finish_reason: "stop",
          },
        ],
      });

    await probot.receive({ name: "pull_request", payload });

    assert.deepStrictEqual(githubMock.pendingMocks(), []);
    assert.deepStrictEqual(deepseekMock.pendingMocks(), []);
  });
});
```

- [ ] **Step 3: Run the targeted test to verify it fails**

Run:

```bash
npm test -- --test-name-pattern="creates an AI-generated comment when a pull request is opened"
```

Expected: FAIL because `index.js` still listens to `issues.opened` and never calls the PR flow.

- [ ] **Step 4: Commit the failing test**

Run:

```bash
git add test/fixtures/pull_request.opened.json test/index.test.js
git commit -m "test: cover PR description generation"
```

Expected: a new commit containing only the fixture and failing test changes.

### Task 2: Add Runtime Configuration

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.env.example`
- Test: `package.json`

- [ ] **Step 1: Add the OpenAI SDK dependency**

Update the dependency block in `package.json` to this shape:

```json
{
  "dependencies": {
    "openai": "^4.104.0",
    "probot": "^14.3.2"
  }
}
```

- [ ] **Step 2: Document the DeepSeek API key**

Add this line to `.env.example` below `LOG_LEVEL=debug`:

```dotenv
DEEPSEEK_API_KEY=
```

- [ ] **Step 3: Install dependencies and refresh the lockfile**

Run:

```bash
npm install
```

Expected: `package-lock.json` updates and `openai` appears in both `package.json` and the lockfile.

- [ ] **Step 4: Verify the dependency is present**

Run:

```bash
npm ls openai
```

Expected output includes:

```text
ai-pr-scribe@1.0.0
└── openai@
```

- [ ] **Step 5: Commit the configuration changes**

Run:

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: add DeepSeek runtime configuration"
```

Expected: a commit that only adds the SDK dependency and environment variable documentation.

### Task 3: Implement The PR Description Workflow

**Files:**
- Modify: `index.js`
- Test: `test/index.test.js`

- [ ] **Step 1: Replace the starter app with the pull request implementation**

Update `index.js` to this implementation:

```javascript
import OpenAI from "openai";

const COMMENT_HEADER = "🤖 **AI 自动生成的 PR 描述** (仅供参考)";

function buildDiffSummary(files) {
  return files
    .map((file) => `- ${file.filename}: ${file.changes} 行变更`)
    .join("\n");
}

function buildPrompt(diffSummary) {
  return [
    "你是一个资深软件工程师，请根据以下代码变更生成一个专业的 PR 描述。",
    "输出必须包含以下 3 个部分：",
    "1. 变更概述",
    "2. 主要修改点",
    "3. 测试建议",
    "",
    "变更摘要：",
    diffSummary,
  ].join("\n");
}

function createDeepSeekClient() {
  return new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com",
  });
}

async function generatePrDescription(diffSummary, client = createDeepSeekClient()) {
  const response = await client.chat.completions.create({
    model: "deepseek-chat",
    messages: [{ role: "user", content: buildPrompt(diffSummary) }],
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
}

async function postPrComment(context, issueNumber, body) {
  return context.octokit.rest.issues.createComment(
    context.issue({
      issue_number: issueNumber,
      body,
    }),
  );
}

/**
 * @param {import('probot').Probot} app
 */
export default (app) => {
  app.log.info("Yay, the app was loaded!");

  app.on(["pull_request.opened", "pull_request.synchronize"], async (context) => {
    const pr = context.payload.pull_request;
    const prNumber = pr.number;

    if (!process.env.DEEPSEEK_API_KEY) {
      app.log.error({ prNumber }, "Missing DEEPSEEK_API_KEY");
      return;
    }

    app.log.info({ prNumber }, "Generating PR description");

    try {
      const { data: files } = await context.octokit.rest.pulls.listFiles({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        pull_number: prNumber,
        per_page: 100,
      });

      const diffSummary = buildDiffSummary(files);

      if (!diffSummary) {
        app.log.warn({ prNumber }, "No changed files found for PR");
        return;
      }

      const prDescription = await generatePrDescription(diffSummary);

      if (!prDescription) {
        app.log.warn({ prNumber }, "DeepSeek returned empty PR description");
        return;
      }

      await postPrComment(
        context,
        prNumber,
        `${COMMENT_HEADER}\n\n${prDescription}`,
      );

      app.log.info({ prNumber }, "Posted generated PR description");
    } catch (error) {
      app.log.error({ err: error, prNumber }, "Failed to generate PR description");
    }
  });
};
```

- [ ] **Step 2: Run the targeted test to verify it passes**

Run:

```bash
npm test -- --test-name-pattern="creates an AI-generated comment when a pull request is opened"
```

Expected: PASS with one matching test.

- [ ] **Step 3: Run the full test suite**

Run:

```bash
npm test
```

Expected: PASS with the PR test green and no remaining issue example test.

- [ ] **Step 4: Commit the feature implementation**

Run:

```bash
git add index.js
git commit -m "feat: generate PR descriptions with DeepSeek"
```

Expected: a commit containing only the application logic change.

### Task 4: Final Verification And Cleanup

**Files:**
- Modify: `test/index.test.js` if verification reveals a mismatch
- Modify: `index.js` if verification reveals a mismatch
- Test: `index.js`
- Test: `test/index.test.js`

- [ ] **Step 1: Run a final verification command set**

Run:

```bash
npm test && npm ls openai
```

Expected:
- test suite passes
- dependency tree shows `openai`

- [ ] **Step 2: Check diagnostics for edited files**

Run diagnostics for:

```text
index.js
test/index.test.js
.env.example
package.json
```

Expected: no new diagnostics introduced by the implementation.

- [ ] **Step 3: Review the final diff before handoff**

Run:

```bash
git diff --stat HEAD~3..HEAD
```

Expected output mentions only:
- `index.js`
- `test/index.test.js`
- `test/fixtures/pull_request.opened.json`
- `package.json`
- `package-lock.json`
- `.env.example`

- [ ] **Step 4: Create the handoff commit if verification required follow-up fixes**

If Step 1 or Step 2 required a small fix, run:

```bash
git add index.js test/index.test.js package.json package-lock.json .env.example test/fixtures/pull_request.opened.json
git commit -m "chore: polish PR description workflow"
```

Expected: no-op if nothing changed, or a tiny cleanup commit if verification uncovered a concrete issue.
