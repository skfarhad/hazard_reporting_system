---
description: Create a Pull Request using GitHub CLI.
---

# /pr-create

Input: $ARGUMENTS

## Format A (Preferred): YAML block
```
title: Add notification system
draft: false  # true | false (default: false)
target: main   # main | custom (default: main)
reviewers: []  # optional list of GitHub usernames
notes: |
  Any extra context for the PR body.
```

## Format B: One-liner
```
--title "Add notification system" --draft --target main --reviewers "user1,user2" --notes "..."
```

## Format C: Minimal (auto-generates title from commits)
```
# Just run /pr-create with no arguments
```

---

## Rules
1. Must be on a `feat/<slug>`, `bugfix/<slug>`, or `refactor/<slug>` branch
2. Working directory should be clean (uncommitted changes will prompt commit first)
3. Branch must be pushed to remote before creating PR
4. Default target branch: `main` (all PRs in this repo target `main`, per CONTRIBUTING.md)

---

## Steps

### Step 1: Parse $ARGUMENTS
Extract:
- title (optional, derived from commits/branch if not provided)
- draft (optional, default: false)
- target (optional, default: main)
- reviewers (optional, list of GitHub usernames)
- notes (optional, additional context for PR body)

### Step 2: Pre-flight checks
1. Verify current branch is `feat/`, `bugfix/`, or `refactor/`:
   ```bash
   git branch --show-current
   ```
2. Check for uncommitted changes:
   ```bash
   git status --porcelain
   ```
   If changes exist, ask user if they want to commit first.
3. Verify gh CLI is available:
   ```bash
   gh --version
   ```

### Step 3: Push branch to remote
```bash
git push -u origin HEAD
```

### Step 4: Generate PR title and body
1. If title not provided, generate from:
   - Branch type + slug: `feat(notification-app): implement notification system`
   - Or from recent commit messages
2. Generate PR body

### Step 5: Gather commit information
```bash
# Get commits not in target branch
git log origin/<target>..HEAD --oneline

# Get full diff summary
git diff origin/<target>...HEAD --stat
```

### Step 6: Create the Pull Request
```bash
gh pr create \
  --title "<title>" \
  --body "$(cat <<'EOF'
## Summary
<bullet points from commits or notes>

## Changes
<list of changed files>

## Test Plan
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Spec
- `agent-os/specs/<date>-<slug>/spec.md`
EOF
)" \
  --base <target> \
  --head <current-branch> \
  [--draft] \
  [--reviewer <reviewers>]
```

### Step 7: Verify PR creation
```bash
gh pr view --json number,url,title,state
```

---

## Output

```
## Pull Request Created

### PR Info
- Title: <title>
- Number: #<number>
- URL: <url>
- Status: <Open | Draft>
- Target: <target> ← <current-branch>

### Changes Summary
| Files | Additions | Deletions |
|-------|-----------|-----------|
| X | +Y | -Z |

### Commits Included
- <commit hash> <message>

### Next Steps
- `/pr-reviews <number>` - Fetch review feedback
- View PR: <url>
```

---

## Error Handling

### Branch not pushed
```
Error: Branch not found on remote.
Action: Pushing branch to origin...
```

### PR already exists
```
Warning: PR already exists for this branch.
PR #<number>: <url>
Action: Use `/pr-reviews <number>` to check status.
```

---

## IMPORTANT
**DO NOT automatically merge or approve.** The PR is created for review.
After creation, suggest:
> "PR created. Use `/pr-reviews <number>` to fetch review feedback when ready."
