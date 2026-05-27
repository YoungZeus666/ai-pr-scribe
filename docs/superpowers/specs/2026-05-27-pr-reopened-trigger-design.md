# PR Reopened Trigger Design

## Goal

Extend the PR description workflow so reopening a pull request also triggers description generation, just like opening a PR or pushing new commits to it.

## Scope

In scope:
- Update the pull request event subscription in `index.js`
- Ensure `pull_request.reopened` follows the same processing path as `opened` and `synchronize`
- Add or update automated test coverage for the reopened action

Out of scope:
- Changing prompt content
- Changing OpenAI-compatible configuration
- Deduplicating repeated comments across events
- Changing GitHub App manifest or installation settings

## Current Context

The current runtime logic only listens to:
- `pull_request.opened`
- `pull_request.synchronize`

When a user clicks "Reopen pull request", GitHub emits the `pull_request.reopened` action instead. The webhook still reaches Probot, but the application handler does not run because that action is not currently registered.

## Recommended Approach

Keep the current handler structure and simply extend the registered action list to include:
- `pull_request.reopened`

This keeps reopened PRs on the same code path as the existing supported actions and avoids introducing a second handler or branching behavior.

## Runtime Behavior

After the change:
- creating a PR triggers description generation
- pushing to an open PR triggers description generation
- reopening a previously closed PR also triggers description generation

The rest of the flow remains unchanged:
- fetch changed files
- build a diff summary
- call the configured OpenAI-compatible model
- post the generated description as a PR comment

## Testing Strategy

The change should add focused regression coverage for the reopened action.

Two acceptable ways to do this:
- add a dedicated `pull_request.reopened` fixture and test
- or parameterize the existing PR test so both `opened` and `reopened` assert the same behavior

The recommended option is a dedicated reopened fixture because it keeps the expected GitHub action explicit.

## Error Handling

No new error-handling behavior is required. Reopened events should reuse the same validation and failure handling that already exists for the current PR actions.

## Success Criteria

The change is complete when:
- `index.js` listens to `pull_request.reopened`
- reopening a PR triggers the same generation flow as opening one
- automated tests cover the reopened action
- existing PR event behavior remains unchanged
