---
description: Merge current branch to target branch. Handles feature, bugfix, and refactor branches. Local only.
---

# /merge-to

Input: $ARGUMENTS

## Format A (Preferred): YAML block
```
target: main
strategy: merge  # merge | squash (default: merge)
notes: |
  Any context for the merge.
```

## Format B: One-liner
```
main --strategy squash --notes "ready for review"
```

---

## Rules
1. Must be on a `feat/<slug>`, `bugfix/<slug>`, or `refactor/<slug>` branch
2. All tests must pass before merge
3. Working directory must be clean (no uncommitted changes)
4. Local only (no push unless explicitly requested)
5. Create merge commit with descriptive message

## Type Detection
Detect from current branch:
- `feat/<slug>` → feature
- `bugfix/<slug>` → bugfix
- `refactor/<slug>` → refactor

---

## Steps

### Step 1: Parse $ARGUMENTS
Extract:
- target (required, target branch name)
- strategy (optional, default: merge)
- notes (optional)

### Step 2: Pre-merge checks
1. Verify current branch is `feat/`, `bugfix/`, or `refactor/`
2. Check working directory is clean:
   ```bash
   git status --porcelain
   ```
3. Verify all changes are committed
4. Detect affected files:
   ```bash
   git diff --name-only <target>...HEAD
   ```

### Step 3: Run tests
```bash
docker compose -f backend/docker-compose.yml exec be python manage.py test
```

### Step 4: Fetch and check target branch
1. Fetch latest from remote (if exists):
   ```bash
   git fetch origin <target> 2>/dev/null || echo "Remote branch not found, using local"
   ```
2. Verify target branch exists locally:
   ```bash
   git rev-parse --verify <target>
   ```

### Step 5: Perform merge
1. Switch to target branch:
   ```bash
   git checkout <target>
   ```
2. Merge based on strategy:
   
   **For merge strategy:**
   ```bash
   git merge <source-branch> -m "$(cat <<'EOF'
   Merge <type>/<slug> into <target>
   
   <summary of changes>
   EOF
   )"
   ```
   
   **For squash strategy:**
   ```bash
   git merge --squash <source-branch>
   git commit -m "$(cat <<'EOF'
   <type>(<slug>): <summary>
   
   <detailed changes>
   EOF
   )"
   ```

### Step 6: Handle conflicts (if any)
If conflicts occur:
1. List conflicted files
2. Ask user how to proceed:
   - Resolve conflicts manually
   - Abort merge and return to source branch
3. After resolution:
   ```bash
   git add <resolved-files>
   git commit
   ```

### Step 7: Post-merge verification
1. Run tests on target branch
2. Verify application runs correctly:
   ```bash
   docker compose -f backend/docker-compose.yml up -d
   docker compose -f backend/docker-compose.yml ps
   ```

### Step 8: Update spec documentation
1. Update `agent-os/specs/<YYYY-MM-DD>-<slug>/spec.md` if needed:
   - Add note about merge completion
2. Update `agent-os/specs/<YYYY-MM-DD>-<slug>/tasks.md`:
   - Add final merge entry

### Step 9: Cleanup prompt
Ask user if they want to:
- Delete the source branch locally
- Keep the source branch for reference

---

## Output

```
## Merge Complete

### Branch Info
- Source: <type>/<slug>
- Target: <target>
- Strategy: <strategy>

### Status
- Merge: ✓ Successful / ✗ Conflicts resolved
- Tests: ✓ All passing

### Next Steps
- Push to remote? (y/n)
- Delete source branch? (y/n)
```

---

## IMPORTANT
**DO NOT automatically push to remote.** Always ask the user:
> "Merge complete. Ready to push `<target>` to remote?"

Wait for explicit user confirmation before pushing.
