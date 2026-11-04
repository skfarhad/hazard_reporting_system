---
description: Fetch review comments and change requests from a GitHub PR.
---

# /pr-reviews

Input: $ARGUMENTS

## Format A: PR number
```
123
```

## Format B: PR URL
```
https://github.com/owner/repo/pull/123
```

## Format C: Auto-detect (current branch)
```
# Run /pr-reviews with no arguments to find PR for current branch
```

---

## Rules
1. Requires GitHub CLI (`gh`) to be installed and authenticated
2. Fetches all review comments, change requests, and general comments
3. Organizes feedback by reviewer and type (approval, changes requested, comments)
4. Identifies actionable items vs informational comments

---

## Steps

### Step 1: Parse $ARGUMENTS
Extract:
- PR number (from direct input, URL, or current branch)

### Step 2: Determine PR number
1. If number provided directly, use it
2. If URL provided, extract number from URL
3. If no arguments, find PR for current branch:
   ```bash
   gh pr view --json number -q '.number' 2>/dev/null
   ```

### Step 3: Verify PR exists and get basic info
```bash
gh pr view <number> --json number,title,state,baseRefName,headRefName,author,url
```

### Step 4: Fetch all reviews
```bash
gh pr view <number> --json reviews --jq '.reviews[] | {author: .author.login, state: .state, body: .body, submittedAt: .submittedAt}'
```

Review states:
- `APPROVED` - Reviewer approved the PR
- `CHANGES_REQUESTED` - Reviewer requested changes
- `COMMENTED` - Reviewer left comments without approval/rejection
- `PENDING` - Review not yet submitted

### Step 5: Fetch review comments (inline comments on code)
```bash
gh api repos/{owner}/{repo}/pulls/<number>/comments --jq '.[] | {
  author: .user.login,
  path: .path,
  line: .line,
  body: .body,
  created_at: .created_at,
  in_reply_to_id: .in_reply_to_id
}'
```

### Step 6: Fetch general PR comments (conversation)
```bash
gh pr view <number> --json comments --jq '.comments[] | {author: .author.login, body: .body, createdAt: .createdAt}'
```

### Step 7: Organize and categorize feedback

Group by:
1. **Change Requests** - Items that MUST be addressed
2. **Suggestions** - Optional improvements
3. **Questions** - Clarifications needed
4. **Approvals** - Positive feedback

For each comment, categorize:
- Has "LGTM", "looks good", "approved" → Approval
- Has "must", "should", "need to", "please fix" → Change Request
- Has "?", "wondering", "could you explain" → Question
- Has "consider", "might", "optional", "nit" → Suggestion

### Step 8: Map comments to files
Group inline comments by file path for easier navigation:
```
backend/apps/incident_manager/models/incident.py
  - Line 45: "Consider adding index" (@reviewer1)
  - Line 89: "This should use select_related" (@reviewer2)
```

---

## Output

```
## PR Review Summary: #<number>

### PR Info
- Title: <title>
- Author: @<author>
- Status: <state>
- Branch: <head> → <base>
- URL: <url>

---

### Review Status

| Reviewer | Status | Date |
|----------|--------|------|
| @user1 | ✅ Approved | 2026-01-28 |
| @user2 | 🔄 Changes Requested | 2026-01-28 |
| @user3 | 💬 Commented | 2026-01-27 |

---

### 🔴 Change Requests (Must Address)

#### From @reviewer1
1. **apps/models.py:45** - "Add database index for query performance"
2. **apps/views.py:123** - "Missing authentication check"

#### From @reviewer2
1. **General** - "Please add unit tests for the new service"

---

### 🟡 Suggestions (Consider)

1. **apps/utils.py:67** (@reviewer1) - "Consider using f-strings here"
2. **apps/tasks.py:89** (@reviewer2) - "Nit: variable naming"

---

### 🔵 Questions (Need Response)

1. (@reviewer1) - "Why did you choose this approach over X?"
2. **apps/services.py:34** (@reviewer2) - "Is this timeout sufficient for production?"

---

### 💬 General Comments

- @reviewer1: "Overall good structure, just a few minor things"
- @reviewer3: "Tested locally, works well"

---

### Approvals

- ✅ @user1: "LGTM!"

---

### Next Steps
- `/pr-address <number>` - Create plan to address feedback
- Address changes and push updates
- Re-request review when ready
```

---

## Detailed Comment View

If user requests more detail on a specific comment:

```bash
gh api repos/{owner}/{repo}/pulls/<number>/comments/<comment_id>
```

---

## Error Handling

### PR not found
```
Error: PR #<number> not found.
- Check the PR number is correct
- Ensure you have access to this repository
```

### No reviews yet
```
Info: PR #<number> has no reviews yet.
- PR may be newly created
- Consider requesting reviewers via GitHub UI or:
  gh pr edit <number> --add-reviewer <username>
```

### No PR for current branch
```
Error: No PR found for branch '<branch>'.
- Create a PR first: `/pr-create`
- Or specify PR number: `/pr-reviews 123`
```

---

## IMPORTANT
This command is READ-ONLY. It fetches and organizes review feedback but does not:
- Respond to comments
- Make code changes
- Resolve conversations

Use `/pr-address <number>` to create a plan for addressing the feedback.
