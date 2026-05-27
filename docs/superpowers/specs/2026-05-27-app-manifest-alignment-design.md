# App Manifest Alignment Design

## Goal

Align `app.yml` with the current Probot application behavior so the manifest reflects the events and permissions actually required by the codebase.

## Scope

In scope:
- Update `default_events` in `app.yml`
- Update `default_permissions` in `app.yml`
- Keep the manifest aligned with the current pull request automation behavior

Out of scope:
- Changing GitHub App settings automatically
- Changing runtime code in `index.js`
- Changing OpenAI configuration
- Reintroducing issue event handling

## Current Context

The runtime code in `index.js` only listens to:
- `pull_request.opened`
- `pull_request.synchronize`

The current `app.yml` still reflects the starter example:
- `issues` is enabled in `default_events`
- `pull_request` is commented out
- `pull_requests` permission is commented out

This creates drift between the checked-in manifest and the actual application behavior.

## Recommended Approach

Update `app.yml` so it strictly matches the current implementation:

`default_events`
- remove `issues`
- enable `pull_request`

`default_permissions`
- keep `issues: write`
- keep `metadata: read`
- enable `pull_requests: read`

## Why Keep `issues: write`

Even though the app no longer subscribes to `issues` events, it still posts comments on pull requests through the issues comment API. That means `issues: write` remains necessary for the current implementation.

## Why `pull_requests: read`

The current code only reads pull request metadata and changed files. It does not update the PR body or merge state. Because of that, `pull_requests: read` is sufficient and `write` is unnecessary.

## Important Note

Changing `app.yml` does not update the already-created GitHub App automatically. The file is still worth updating so the repository accurately documents the intended manifest and future environments can start from correct defaults.

## Success Criteria

The change is complete when:
- `app.yml` subscribes to `pull_request`
- `app.yml` no longer subscribes to `issues`
- `app.yml` includes `pull_requests: read`
- `issues: write` and `metadata: read` remain present
- the file accurately represents the current runtime behavior
