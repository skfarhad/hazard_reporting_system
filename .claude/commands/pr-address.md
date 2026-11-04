---
description: Create a plan to address PR review feedback - either code changes or reply comments.
---

# /pr-address

Input: $ARGUMENTS

## Format A: PR number
```
123
```

## Format B: PR number with options
```
123 --mode plan  # plan | execute (default: plan)
```

---

## Rules
1. First fetches all review feedback (like `/pr-reviews`)
2. Analyzes each piece of feedback to determine appropriate response
3. Creates actionable plan with two categories:
   - **Code Changes** - Items requiring actual code modifications
   - **Replies** - Items that need explanation/clarification only
4. In `plan` mode: shows the plan for user approval
5. In `execute` mode: implements changes and drafts replies (after plan approval)

---

## Steps

### Step 1: Parse $ARGUMENTS
Extract:
- PR number (required)
- mode (optional, default: plan)

### Step 2: Fetch PR and review data
Run the same data gathering as `/pr-reviews`:
```bash
# PR info
gh pr view <number> --json number,title,state,baseRefName,headRefName,author,url,body

# Reviews
gh pr view <number> --json reviews

# Inline comments
gh api repos/{owner}/{repo}/pulls/<number>/comments

# General comments  
gh pr view <number> --json comments
```

### Step 3: Analyze each feedback item
For each comment/review, determine:

**Requires Code Change if:**
- Points to specific code issue (bug, missing validation, etc.)
- Requests new functionality or tests
- Identifies security or performance problem
- Uses imperative language: "fix", "add", "remove", "change"
- References specific line numbers with issues

**Requires Reply Only if:**
- Asks a question about design decision
- Requests clarification on approach
- Is a "nit" or style preference that's subjective
- Already addressed in another commit
- Based on misunderstanding of requirements
- Is praise or acknowledgment ("LGTM", "nice!")

### Step 4: Cross-reference with codebase
For code change requests:
1. Read the referenced file(s)
2. Understand the current implementation
3. Determine if change is valid and necessary
4. Estimate complexity (simple/medium/complex)

### Step 5: Generate the plan

```markdown
## PR Feedback Response Plan: #<number>

### Summary
- Total feedback items: X
- Code changes needed: Y
- Replies needed: Z

---

## 🔧 Code Changes Required

### Change 1: <brief description>
**Source:** @reviewer - "original comment"
**File:** `apps/models.py:45`
**Action:** Add database index for `user_id` field
**Complexity:** Simple
**Implementation:**
```python
indexes = [
    models.Index(fields=['user_id']),
]
```

### Change 2: <brief description>
**Source:** @reviewer - "original comment"
**File:** `apps/views.py:123`
**Action:** Add authentication check before processing
**Complexity:** Medium
**Implementation:**
- Add `IsAuthenticated` permission class
- Update view to check user ownership

---

## 💬 Replies to Draft

### Reply 1: Design decision explanation
**To:** @reviewer
**Original:** "Why did you choose X over Y?"
**Suggested Reply:**
> Good question! I chose X because [reason]. The spec in `agent-os/specs/.../spec.md` discusses this in the Architecture section. Y would have required [tradeoff] which didn't fit our requirements for [goal].

### Reply 2: Clarification
**To:** @reviewer  
**Original:** "Is this timeout sufficient?"
**Suggested Reply:**
> Yes, the 30s timeout is based on our p99 latency measurements. We have retry logic in `apps/tasks.py` that handles longer operations. Happy to increase if you've seen issues in testing.

### Reply 3: Acknowledge nit
**To:** @reviewer
**Original:** "Nit: consider f-strings"
**Suggested Reply:**
> Good catch! Fixed in the upcoming commit.

### Reply 4: Already addressed
**To:** @reviewer
**Original:** "Add error handling here"
**Suggested Reply:**
> This is handled by the `@handle_errors` decorator on line 45. The decorator catches and logs all exceptions, returning a standardized error response.

---

## ✅ No Action Needed

### Item 1
**From:** @reviewer - "LGTM, nice clean implementation!"
**Reason:** Approval/praise, no response needed

---

## Execution Order

1. [ ] Implement Change 1 (index)
2. [ ] Implement Change 2 (auth check)
3. [ ] Run tests to verify changes
4. [ ] Commit with message: `fix(pr-feedback): address review comments`
5. [ ] Post replies to PR
6. [ ] Push changes
7. [ ] Re-request review

---

## Ready to Execute?
Run `/pr-address <number> --mode execute` to implement this plan.
```

### Step 6: Execute mode (if requested)

#### 6a: Implement code changes
For each code change:
1. Read the target file
2. Make the required modification
3. Verify no linter errors
4. Stage the change

#### 6b: Run tests
```bash
docker compose -f backend/docker-compose.yml exec be python manage.py test <affected_app>
```

#### 6c: Commit changes
```bash
git add .
git commit -m "$(cat <<'EOF'
fix(pr-feedback): address review comments

Changes:
- <change 1 description>
- <change 2 description>

Addresses feedback from: @reviewer1, @reviewer2
EOF
)"
```

#### 6d: Post replies
For each reply:
```bash
# Reply to inline comment
gh api repos/{owner}/{repo}/pulls/<number>/comments/<comment_id>/replies \
  -f body="<reply text>"

# Reply to general comment
gh pr comment <number> --body "<reply text>"
```

#### 6e: Push and notify
```bash
git push
```

---

## Output (Plan Mode)

```
## PR Feedback Analysis Complete

### #<number>: <title>

| Category | Count |
|----------|-------|
| Code Changes | X |
| Replies | Y |
| No Action | Z |

### Plan Generated
<full plan as shown in Step 5>

### Next Steps
- Review the plan above
- Run `/pr-address <number> --mode execute` to implement
- Or make manual adjustments first
```

## Output (Execute Mode)

```
## PR Feedback Addressed

### #<number>: <title>

### Code Changes Made
- ✅ Added index to `apps/models.py`
- ✅ Added auth check to `apps/views.py`

### Replies Posted
- ✅ Replied to @reviewer1 about design decision
- ✅ Replied to @reviewer2 about timeout
- ✅ Acknowledged nit from @reviewer1

### Commit
- Hash: <commit_hash>
- Message: "fix(pr-feedback): address review comments"

### Tests
- Status: ✅ All passing

### Push Status
- Pushed to: origin/<branch>

### Next Steps
- PR updated: <url>
- Re-request review from reviewers
- Monitor for additional feedback
```

---

## Reply Templates

### Design Decision
> Thanks for the question! I chose this approach because [reason]. The alternative [X] would have [tradeoff]. See the spec at `agent-os/specs/.../spec.md` for more context on this decision.

### Fixed
> Good catch! Fixed in commit <hash>.

### Already Handled
> This is actually handled by [mechanism] in [location]. [Brief explanation of how].

### Intentional
> This is intentional - [explanation]. The reason is [justification]. Happy to discuss if you see issues with this approach.

### Will Address Later
> Agreed this would be an improvement. I've noted it for a follow-up PR since it's out of scope for this change. Created issue #<number> to track.

### Disagree (Respectfully)
> I see your point, but I think [current approach] is better here because [reason]. [Evidence/reference if available]. Open to discussing further if you have concerns.

---

## Error Handling

### No actionable feedback
```
Info: All feedback has been addressed or requires no action.
- X approvals received
- No pending change requests

PR is ready for merge!
```

### Conflicting feedback
```
Warning: Conflicting feedback from reviewers:
- @user1 says: "Use approach A"
- @user2 says: "Use approach B"

Recommendation: Discuss in PR comments to reach consensus.
```

---

## IMPORTANT
In `execute` mode:
- Always show the plan first and ask for confirmation
- Never force-push or rewrite history
- Post replies one at a time to avoid rate limiting
- If tests fail after changes, stop and report

> "Plan ready. Review above and confirm to proceed with execution."
