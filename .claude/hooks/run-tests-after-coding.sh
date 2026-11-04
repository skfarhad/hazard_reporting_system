#!/bin/bash
# Claude Code Stop hook: run the Django tests for the apps that have uncommitted
# Python changes, and block (exit 2) with the failure output if they fail.

set -o pipefail

cd "$CLAUDE_PROJECT_DIR" || exit 0

INPUT=$(cat)

# Already blocked once in this stop cycle: let Claude stop, to avoid a loop.
if [ "$(echo "$INPUT" | jq -r '.stop_hook_active // false' 2>/dev/null)" = "true" ]; then
    exit 0
fi

# Only run when Django code (apps/, config/) has uncommitted Python changes.
CHANGED=$(git status --porcelain -- apps/ config/ 2>/dev/null | awk '{print $NF}' | grep -E '\.py$')
[ -z "$CHANGED" ] && exit 0

# Skip quietly when the be container isn't running.
if ! docker compose ps --status running -q be 2>/dev/null | grep -q .; then
    exit 0
fi

# Scope to touched apps (the container's /code is the repo root).
# Fall back to all apps when anything outside apps/ (e.g. config/) changed.
CHANGED_APPS=$(echo "$CHANGED" | grep -oE '^apps/[^/]+' | sort -u | sed 's#apps/#apps.#')
if [ -n "$CHANGED_APPS" ] && ! echo "$CHANGED" | grep -qvE '^apps/'; then
    TEST_TARGETS=$CHANGED_APPS
    SCOPE_LABEL=$(echo "$CHANGED_APPS" | tr '\n' ' ')
else
    TEST_TARGETS="apps"
    SCOPE_LABEL="all apps"
fi

TEST_OUTPUT=$(docker compose exec -T be python manage.py test --failfast --keepdb --noinput $TEST_TARGETS 2>&1)
if [ $? -eq 0 ]; then
    exit 0
fi

{
    echo "Tests failed after code changes ($SCOPE_LABEL):"
    echo ""
    echo "$TEST_OUTPUT" | tail -50
    echo ""
    echo "Fix the failing tests above. If the failure is a stale --keepdb test database"
    echo "after a migration, rerun once without --keepdb."
} >&2
exit 2
