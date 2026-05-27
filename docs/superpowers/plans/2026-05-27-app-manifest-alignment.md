# App Manifest Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update `app.yml` so the checked-in GitHub App manifest matches the current pull request automation behavior.

**Architecture:** Keep the change tightly scoped to `app.yml`. Remove the stale `issues` event subscription, enable the `pull_request` event, and uncomment the `pull_requests: read` permission while retaining `issues: write` and `metadata: read`.

**Tech Stack:** Probot, GitHub App manifest YAML

---

## File Structure

- Modify: `app.yml`
  - Align `default_events` and `default_permissions` with the current runtime behavior in `index.js`.

### Task 1: Update The App Manifest

**Files:**
- Modify: `app.yml`
- Test: `app.yml`

- [ ] **Step 1: Replace the subscribed event list**

Update the `default_events` section in `app.yml` from:

```yml
default_events:
  # - check_run
  # - check_suite
  # - commit_comment
  # - create
  # - delete
  # - deployment
  # - deployment_status
  # - fork
  # - gollum
  # - issue_comment
  - issues
# - label
# - milestone
# - member
# - membership
# - org_block
# - organization
# - page_build
# - project
# - project_card
# - project_column
# - public
# - pull_request
# - pull_request_review
# - pull_request_review_comment
# - push
# - release
# - repository
# - repository_import
# - status
# - team
# - team_add
# - watch
```

to:

```yml
default_events:
  # - check_run
  # - check_suite
  # - commit_comment
  # - create
  # - delete
  # - deployment
  # - deployment_status
  # - fork
  # - gollum
  # - issue_comment
# - label
# - milestone
# - member
# - membership
# - org_block
# - organization
# - page_build
# - project
# - project_card
# - project_column
# - public
  - pull_request
# - pull_request_review
# - pull_request_review_comment
# - push
# - release
# - repository
# - repository_import
# - status
# - team
# - team_add
# - watch
```

- [ ] **Step 2: Enable the pull request permission**

Update the permission section in `app.yml` from:

```yml
  # Pull requests and related comments, assignees, labels, milestones, and merges.
  # https://developer.github.com/v3/apps/permissions/#permission-on-pull-requests
  # pull_requests: read
```

to:

```yml
  # Pull requests and related comments, assignees, labels, milestones, and merges.
  # https://developer.github.com/v3/apps/permissions/#permission-on-pull-requests
  pull_requests: read
```

- [ ] **Step 3: Verify the manifest now reflects the intended state**

Run:

```bash
grep -n "issues\\|pull_request" app.yml
```

Expected output includes:

```text
... default_events:
...   - pull_request
...   issues: write
...   pull_requests: read
```

Expected output does not include an active `- issues` event entry.

- [ ] **Step 4: Check diagnostics for the YAML file**

Run diagnostics for:

```text
app.yml
```

Expected: no new diagnostics introduced.

- [ ] **Step 5: Commit the manifest alignment**

Run:

```bash
git add app.yml
git commit -m "chore: align app manifest with PR workflow"
```

Expected: a commit containing only the `app.yml` manifest update.

### Task 2: Final Verification

**Files:**
- Modify: `app.yml` if verification reveals a concrete issue
- Test: `app.yml`

- [ ] **Step 1: Review the final diff**

Run:

```bash
git diff --stat HEAD~1..HEAD
```

Expected output mentions only:
- `app.yml`

- [ ] **Step 2: Create a cleanup commit only if verification required a follow-up fix**

If the previous verification surfaced a concrete issue, run:

```bash
git add app.yml
git commit -m "chore: polish app manifest alignment"
```

Expected: no-op if nothing changed, or a tiny cleanup commit if verification uncovered a concrete issue.
