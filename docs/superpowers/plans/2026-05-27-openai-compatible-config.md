# OpenAI-Compatible Config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current DeepSeek-specific runtime configuration with `OPENAI_`-prefixed OpenAI-compatible settings while preserving the existing PR description flow.

**Architecture:** Keep the existing `openai` SDK and the current single-file app structure in `index.js`. Only refactor the configuration access layer, update the integration test to use OpenAI-compatible settings, and document the new environment variables in `.env.example`.
Also update `README.md` so setup instructions match the new `OPENAI_` configuration names.

**Tech Stack:** Node.js, Probot, OpenAI SDK, Nock, `node:test`

---

## File Structure

- Modify: `index.js`
  - Replace hardcoded DeepSeek config with `OPENAI_API_KEY`, `OPENAI_BASE_URL`, and `OPENAI_MODEL`, using `gpt-4.1-mini` as the default model.
- Modify: `test/index.test.js`
  - Update the integration test to set `OPENAI_` environment variables and mock the OpenAI-compatible endpoint.
- Modify: `.env.example`
  - Replace the DeepSeek variable with the documented OpenAI-compatible variables.
- Modify: `README.md`
  - Update setup documentation to describe `OPENAI_API_KEY`, optional `OPENAI_BASE_URL`, and optional `OPENAI_MODEL`.

### Task 1: Write The Failing Configuration Test

**Files:**
- Modify: `test/index.test.js`
- Test: `test/index.test.js`

- [ ] **Step 1: Update the test to use `OPENAI_` environment variables and the OpenAI endpoint**

Update `test/index.test.js` to this content:

```javascript
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
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
    process.env.OPENAI_API_KEY = "test-openai-key";
    process.env.OPENAI_BASE_URL = "https://api.openai.com/v1";
    process.env.OPENAI_MODEL = "gpt-4.1-mini";

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
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_BASE_URL;
    delete process.env.OPENAI_MODEL;
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

    const openaiMock = nock("https://api.openai.com")
      .post("/v1/chat/completions", (body) => {
        assert.equal(body.model, "gpt-4.1-mini");
        assert.equal(body.temperature, 0.3);
        assert.match(body.messages[0].content, /src\/index\.js: 24 行变更/);
        return true;
      })
      .reply(200, {
        id: "chatcmpl-test",
        object: "chat.completion",
        created: 1710000000,
        model: "gpt-4.1-mini",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content:
                "变更概述：新增 PR 自动描述能力\n主要修改点：切换到 OpenAI 兼容配置\n测试建议：执行 webhook 集成测试",
            },
            finish_reason: "stop",
          },
        ],
      });

    await probot.receive({ name: "pull_request", payload });

    assert.deepStrictEqual(githubMock.pendingMocks(), []);
    assert.deepStrictEqual(openaiMock.pendingMocks(), []);
  });
});
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run:

```bash
npm test -- --test-name-pattern="creates an AI-generated comment when a pull request is opened"
```

Expected: FAIL because `index.js` still reads `DEEPSEEK_API_KEY`, still uses the DeepSeek base URL, and still sends `deepseek-chat`.

- [ ] **Step 3: Commit the failing test change**

Run:

```bash
git add test/index.test.js
git commit -m "test: cover OpenAI-compatible config"
```

Expected: a commit containing only the updated failing test.

### Task 2: Implement The OpenAI-Compatible Runtime Config

**Files:**
- Modify: `index.js`
- Modify: `.env.example`
- Modify: `README.md`
- Test: `test/index.test.js`

- [ ] **Step 1: Replace the DeepSeek-specific runtime config in `index.js`**

Update `index.js` to this implementation:

```javascript
import OpenAI from "openai";

const COMMENT_HEADER = "🤖 **AI 自动生成的 PR 描述** (仅供参考)";
const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";

function buildDiffSummary(files) {
  return files.map((file) => `- ${file.filename}: ${file.changes} 行变更`).join("\n");
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

function createOpenAIClient() {
  const baseURL = process.env.OPENAI_BASE_URL;

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    ...(baseURL ? { baseURL } : {}),
  });
}

async function generatePrDescription(diffSummary, client = createOpenAIClient()) {
  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
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

    if (!process.env.OPENAI_API_KEY) {
      app.log.error({ prNumber }, "Missing OPENAI_API_KEY");
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
        app.log.warn({ prNumber }, "OpenAI-compatible API returned empty PR description");
        return;
      }

      await postPrComment(context, prNumber, `${COMMENT_HEADER}\n\n${prDescription}`);

      app.log.info({ prNumber }, "Posted generated PR description");
    } catch (error) {
      app.log.error({ err: error, prNumber }, "Failed to generate PR description");
    }
  });
};
```

- [ ] **Step 2: Replace the documented environment variables**

Update `.env.example` to this content:

```dotenv
# The ID of your GitHub App
APP_ID=
WEBHOOK_SECRET=development

# Use `trace` to get verbose logging or `info` to show less
LOG_LEVEL=debug
OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_MODEL=gpt-4.1-mini

# Go to https://smee.io/new set this to the URL that you are redirected to.
WEBHOOK_PROXY_URL=
```

- [ ] **Step 3: Update the README setup instructions**

Update `README.md` so the setup section includes the new environment variables. Replace the current setup section with:

```md
## Setup

1. Install dependencies:

```sh
npm install
```

2. Create a `.env` file with your app and model settings:

```dotenv
APP_ID=
WEBHOOK_SECRET=development
PRIVATE_KEY=
OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_MODEL=gpt-4.1-mini
```

3. Run the bot:

```sh
npm start
```
```

- [ ] **Step 4: Run the targeted test to verify it passes**

Run:

```bash
npm test -- --test-name-pattern="creates an AI-generated comment when a pull request is opened"
```

Expected: PASS with the updated OpenAI-compatible configuration.

- [ ] **Step 5: Run the full test suite**

Run:

```bash
npm test
```

Expected: PASS with the full suite green.

- [ ] **Step 6: Commit the runtime config refactor**

Run:

```bash
git add index.js test/index.test.js .env.example README.md
git commit -m "feat: support OpenAI-compatible config"
```

Expected: a commit containing the config refactor and updated documentation.

### Task 3: Final Verification

**Files:**
- Modify: `index.js` if verification reveals a concrete issue
- Modify: `test/index.test.js` if verification reveals a concrete issue
- Modify: `.env.example` if verification reveals a concrete issue
- Modify: `README.md` if verification reveals a concrete issue
- Test: `index.js`
- Test: `test/index.test.js`

- [ ] **Step 1: Check diagnostics for edited files**

Run diagnostics for:

```text
index.js
test/index.test.js
.env.example
README.md
```

Expected: no new diagnostics introduced.

- [ ] **Step 2: Verify there are no remaining DeepSeek-specific references in the edited surface**

Run:

```bash
grep -R "DEEPSEEK\\|deepseek-chat\\|api.deepseek.com" index.js test/index.test.js .env.example
```

Expected: no output.

- [ ] **Step 3: Review the final diff summary**

Run:

```bash
git diff --stat HEAD~2..HEAD
```

Expected output mentions only:
- `index.js`
- `test/index.test.js`
- `.env.example`
- `README.md`

- [ ] **Step 4: Create a cleanup commit only if verification required follow-up fixes**

If Step 1 or Step 2 required a small fix, run:

```bash
git add index.js test/index.test.js .env.example README.md
git commit -m "chore: polish OpenAI-compatible config"
```

Expected: no-op if nothing changed, or a tiny cleanup commit if verification uncovered a concrete issue.
