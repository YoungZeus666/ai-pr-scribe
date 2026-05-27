# PR Description Generator Design

## Goal

Add a Probot workflow that listens to pull request open and update events, summarizes changed files, sends the summary to DeepSeek, and posts the generated PR description as a comment on the pull request.

## Scope

In scope:
- Replace the sample `issues.opened` behavior in `index.js`
- Listen to `pull_request.opened` and `pull_request.synchronize`
- Fetch pull request file changes through Octokit
- Build a compact prompt from file-level change summaries
- Call DeepSeek with `DEEPSEEK_API_KEY`
- Post the generated content as a PR comment
- Add a focused automated test for the PR flow

Out of scope:
- Updating the PR body directly
- Handling pagination beyond the first 100 files
- Rich diff parsing at hunk or patch level
- Deduplicating repeated comments across multiple synchronize events

## Current Context

The project is a small Probot app using Node.js with ESM enabled through `"type": "module"`. The current entrypoint is `index.js`, which exports a default function and contains only the starter `issues.opened` example. The current dependencies include `probot` but do not yet include a DeepSeek client library.

This means the provided sample implementation must be adapted from CommonJS to ESM. The final implementation should keep the existing `export default` pattern and use ESM imports instead of `module.exports` and `require()`.

## Recommended Approach

Keep the implementation in `index.js` for now, but split the behavior into a few focused helper functions inside the same file:
- `buildDiffSummary(files)`
- `buildPrompt(diffSummary)`
- `generatePrDescription(diffSummary)`
- `postPrComment(context, prNumber, body)`

This keeps the code small and easy to follow while still making the logic testable and easier to evolve later.

## Event Flow

1. Probot receives `pull_request.opened` or `pull_request.synchronize`
2. The handler reads PR metadata from `context.payload.pull_request`
3. The app fetches changed files with `context.octokit.rest.pulls.listFiles()`
4. The file list is converted into a compact summary such as `path + changed lines`
5. The app builds a prompt asking DeepSeek for:
   - change overview
   - main modifications
   - suggested tests
6. The app calls DeepSeek using the API key from `process.env.DEEPSEEK_API_KEY`
7. If the model returns content, the app posts a PR comment through `context.octokit.rest.issues.createComment()`

## Data Design

The prompt input is intentionally small and file-based. Each changed file is represented with a single line similar to:

`- src/index.js: 24 lines changed`

The initial version uses only `filename` and `changes` from the GitHub API response. This reduces token usage and avoids pushing raw patch content into the model.

The generated comment format is:

```md
🤖 **AI 自动生成的 PR 描述** (仅供参考)

<model output>
```

## Error Handling

The webhook should not crash the app when external services fail. The implementation should log and exit early in these cases:

- `DEEPSEEK_API_KEY` is missing
- listing PR files fails
- DeepSeek returns an error
- DeepSeek returns empty content
- posting the PR comment fails

For each failure, logs should include enough context to identify the PR number and failing step.

## Dependency Changes

Add a DeepSeek SDK dependency that can be imported in ESM form and instantiated from `DEEPSEEK_API_KEY`.

If the chosen package exposes an OpenAI-compatible client instead of a DeepSeek-specific constructor, the implementation can still proceed as long as:
- the API base URL targets DeepSeek
- the model is configured as `deepseek-chat`
- the usage remains compatible with this app's ESM setup

## Testing Plan

Add one focused automated test in `test/index.test.js` covering the happy path:

- simulate `pull_request.opened`
- mock the GitHub API call for listing files
- mock the DeepSeek response with fixed generated text
- assert that the app posts a PR comment containing the generated description

This test should validate the integration behavior without over-specifying prompt wording.

## Risks And Limitations

- Large PRs over 100 files will be truncated
- File-level summaries may be too coarse for some PRs
- Synchronize events may create multiple comments over time
- External API latency may slow webhook handling

These are acceptable for the first version because the goal is a minimal working automation.

## Success Criteria

The feature is considered complete when:
- opening or updating a PR triggers the handler
- the app fetches file summaries from GitHub
- the app generates a description through DeepSeek
- the app posts a comment back to the PR
- the new automated test passes
