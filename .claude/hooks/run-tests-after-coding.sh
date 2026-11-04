#!/bin/bash
# Claude Code Stop hook: run the Django tests for the backend apps that have
# uncommitted changes, and block (exit 2) with the failure output if they fail.

set -o pipefail

cd "$CLAUDE_PROJECT_DIR" || exit 0

INPUT=$(cat)

# Already blocked once in this stop cycle: let Claude stop, to avoid a loop.
if [ "$(echo "$INPUT" | jq -r '.stop_hook_active // false' 2>/dev/null)" = "true" ]; then
    exit 0
fi

# Only run when backend Python code has uncommitted changes.
CHANGED=$(git status --porcelain -- backend/ 2>/dev/null | awk '{print $NF}' | grep -E '\.py$')
[ -z "$CHANGED" ] && exit 0

COMPOSE="docker compose -f backend/docker-compose.yml"

# Skip quietly when the backend container isn't running.
if ! $COMPOSE ps --status running -q be 2>/dev/null | grep -q .; then
    exit 0
fi

# Scope to touched apps (labels are relative to backend/, the container's /code).
# Fall back to the full suite when changes are outside backend/apps/ (e.g. config/).
CHANGED_APPS=$(echo "$CHANGED" | grep -oE '^backend/apps/[^/]+' | sort -u | sed 's#backend/apps/#apps.#')
if [ -n "$CHANGED_APPS" ] && ! echo "$CHANGED" | grep -qvE '^backend/apps/'; then
    TEST_TARGETS=$CHANGED_APPS
    SCOPE_LABEL=$(echo "$CHANGED_APPS" | tr '\n' ' ')
else
    TEST_TARGETS=""
    SCOPE_LABEL="full suite"
fi

TEST_OUTPUT=$($COMPOSE exec -T be python manage.py test --failfast --keepdb --noinput $TEST_TARGETS 2>&1)
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
