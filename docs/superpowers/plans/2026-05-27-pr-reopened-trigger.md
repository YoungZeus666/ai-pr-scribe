# PR Reopened Trigger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make reopening a pull request trigger the same AI description generation flow as opening a PR or pushing new commits.

**Architecture:** Keep the current single-handler design in `index.js` and extend the registered pull request action list to include `reopened`. Add a dedicated webhook fixture and focused regression test so the new behavior is covered without changing prompt generation, model configuration, or comment formatting.

**Tech Stack:** Node.js, Probot, OpenAI SDK, Node test runner, Nock

---

### Task 1: Add Failing Test Coverage For Reopened PRs

**Files:**
- Create: `test/fixtures/pull_request.reopened.json`
- Modify: `test/index.test.js`
- Reference: `test/fixtures/pull_request.opened.json`

- [ ] **Step 1: Create the reopened payload fixture**

Create `test/fixtures/pull_request.reopened.json` with the same repository and installation shape as the existing opened payload, but set the action to `reopened`.

```json
{
  "action": "reopened",
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

- [ ] **Step 2: Extend the test file to load both fixtures**

Update `test/index.test.js` imports so the file reads both payloads explicitly.

```js
import myProbotApp from "../index.js";
import openedPayload from "./fixtures/pull_request.opened.json" with { type: "json" };
import reopenedPayload from "./fixtures/pull_request.reopened.json" with { type: "json" };
```

- [ ] **Step 3: Add a dedicated failing test for reopened PRs**

Append a second test in `test/index.test.js` that mirrors the existing opened-path assertions but calls `probot.receive()` with the reopened payload.

```js
  test("creates an AI-generated comment when a pull request is reopened", async () => {
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
          /AI 自动生成的 PR 描述[\s\S]*变更概述：重新打开的 PR 重新生成描述/,
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
        id: "chatcmpl-test-reopened",
        object: "chat.completion",
        created: 1710000001,
        model: "gpt-4.1-mini",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content:
                "变更概述：重新打开的 PR 重新生成描述\n主要修改点：复用现有 PR 描述流程\n测试建议：执行 reopened webhook 集成测试",
            },
            finish_reason: "stop",
          },
        ],
      });

    await probot.receive({ name: "pull_request", payload: reopenedPayload });

    assert.deepStrictEqual(githubMock.pendingMocks(), []);
    assert.deepStrictEqual(openaiMock.pendingMocks(), []);
  });
```

- [ ] **Step 4: Run the reopened test and confirm it fails before implementation**

Run:

```bash
npm test -- --test-name-pattern="reopened"
```

Expected: FAIL because `index.js` does not yet listen to `pull_request.reopened`, so the GitHub and OpenAI mocks remain pending.

- [ ] **Step 5: Commit the red test scaffolding**

Run:

```bash
git add test/fixtures/pull_request.reopened.json test/index.test.js
git commit -m "test: cover reopened pull request events"
```

### Task 2: Implement Reopened PR Handling

**Files:**
- Modify: `index.js`
- Test: `test/index.test.js`

- [ ] **Step 1: Extend the subscribed PR actions**

Update the event registration in `index.js` so the existing handler listens to `reopened` in addition to `opened` and `synchronize`.

```js
  app.on(
    ["pull_request.opened", "pull_request.synchronize", "pull_request.reopened"],
    async (context) => {
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
    },
  );
```

- [ ] **Step 2: Run the reopened-focused test and verify it passes**

Run:

```bash
npm test -- --test-name-pattern="reopened"
```

Expected: PASS for the reopened test.

- [ ] **Step 3: Run the full test suite to catch regressions**

Run:

```bash
npm test
```

Expected: PASS with both the opened and reopened pull request tests succeeding.

- [ ] **Step 4: Check editor diagnostics on the edited source and test files**

Run diagnostics for:
- `index.js`
- `test/index.test.js`

Expected: no new errors.

- [ ] **Step 5: Commit the runtime change**

Run:

```bash
git add index.js test/index.test.js
git commit -m "feat: handle reopened pull request events"
```

### Task 3: Final Verification And Handoff

**Files:**
- Review: `index.js`
- Review: `test/index.test.js`
- Review: `test/fixtures/pull_request.reopened.json`

- [ ] **Step 1: Inspect the final diff for this feature only**

Run:

```bash
git diff -- index.js test/index.test.js test/fixtures/pull_request.reopened.json
```

Expected: only the reopened event registration and its focused test coverage appear in the diff.

- [ ] **Step 2: Confirm the plan remains separate from unrelated working tree changes**

Run:

```bash
git status --short
```

Expected: this feature's files are clean after commit, while unrelated files such as pre-existing documentation leftovers are left untouched.

- [ ] **Step 3: Manually verify the runtime scenario**

With `npm start` running and the GitHub App installed on the target repository:
- close an existing PR
- click `Reopen pull request`
- confirm the terminal now logs `Generating PR description`
- confirm the PR receives the AI-generated comment

- [ ] **Step 4: Push or update the existing PR if requested**

Run:

```bash
git push
```

Expected: the remote branch updates with the reopened-event support.
