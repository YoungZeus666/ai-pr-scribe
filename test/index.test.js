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
    process.env.DEEPSEEK_API_KEY = "test-deepseek-key";

    probot = new Probot({
      appId: 123,
      privateKey,
      // disable request throttling and retries for testing
      Octokit: ProbotOctokit.defaults((instanceOptions) => ({
        ...instanceOptions,
        retry: { enabled: false },
        throttle: { enabled: false },
      })),
    });
    // Load our app into probot
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
