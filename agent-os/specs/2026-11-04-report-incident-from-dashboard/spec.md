# Specification: Report an incident from the web app for staff review

**Status:** Draft (awaiting `/plan`)

## Executive Summary

Add a "Report incident" option to the dashboard and the Incidents page. Signed-in users submit a
new incident through a form; it is always created as pending and recorded with its reporter and
web source, so staff review it with the existing validate/reject actions.

---

## Problem Statement

**Current State:**
- Only API-key providers can create incidents (`POST /api/incidents/`).
- No reporter is recorded on incidents.
- Providers can set `validation_status` on create.

**Desired State:**
- Web users can report incidents; every web report waits for staff review.

**Impact:**
- Phone-call and field reports enter the same triage flow as SMS reports.

---

## Goals & Success Criteria

### Primary Goals
1. A signed-in create API that forces pending status and records the reporter and source.
2. A report form reachable from the dashboard and the Incidents page.
3. Web reports reviewed like any other incident.

### Success Criteria
- [ ] Acceptance criteria in `planning/requirements.md` met.
- [ ] Tests written first, watched fail, passing.
- [ ] Browser-checked on desktop and phone.

### Non-Goals
- Anonymous reporting, attachments, reporter follow-up, SMS confirmations.

---

## Architecture Overview

### High-Level System Architecture

```mermaid
graph TB
    subgraph "Browser"
        B1[Dashboard: Report incident] --> F[Report form]
        B2[Incidents page: Report incident] --> F
    end
    F -->|POST JWT| API[/api/incidents/report/ (name TBD)/]
    API --> S[Create: status=pending, reporter, source=web, needs, place, event]
    S --> DB[(Incident)]
    DB --> OPS[Operators review: validate / reject]
```

---

## Technical Design

To be completed in `/plan`.

### Django Backend
- Models: reporter (FK to user) and source on `Incident` (to decide).
- Views/APIs: signed-in create endpoint.
- URLs: new route.
- Celery Tasks: none (SMS task only on validation, unchanged).

---

## Data Model Changes

To decide in `/plan` (reporter, source).

---

## API Specification

### Endpoint Overview
- New: signed-in incident report endpoint (name and shape in `/plan`).

---

## Testing Strategy

To be completed in `/plan` (test-first).

### Unit Tests
- Django: create API (status forced pending, reporter/source, validation, permissions).
- Vitest: form → request body, client validation, error display.

### Integration Tests
- 

### E2E Tests
- Browser check.

---

## Migration Plan

### Phase 1
- Schema migration for reporter/source (if chosen).

---

## Security Considerations

- Authenticated only; pending forced server-side; input validation; rate limiting (to decide).

---

## Performance Considerations

- Single POST; lookups loaded once.

---

## Summary

Lets web users report incidents that staff review before anyone acts on them.
