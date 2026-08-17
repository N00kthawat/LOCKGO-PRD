# AI-Assisted Development Workflow

This document describes how AI was used during the assessment and where developer decisions were applied.

## Workflow

```text
Requirement
↓
AI-assisted repository and requirement analysis
↓
Developer review of source-of-truth documents
↓
Milestone planning
↓
AI-assisted implementation
↓
Developer review of code structure and scope
↓
Testing
↓
Bug fixing
↓
AI-assisted code review notes
↓
Final code
```

## How AI Was Used

### 1. Requirement Analysis

AI was used to:
- read `AGENTS.md`
- read the assessment PDFs
- inspect repository structure
- summarize implemented vs missing scope
- identify the smallest next milestone

Developer decision:
- confirm that work should start from backend correctness and not frontend visuals

### 2. Backend Foundation

AI was used to:
- design the initial Prisma schema
- implement migration and seed setup
- add reservation domain rules
- implement locker and reservation APIs
- add unit and e2e tests

Developer decision:
- keep the model minimal with only required core entities
- avoid adding unnecessary abstractions
- keep API scope aligned with the assessment

### 3. Git Workflow

AI was used to:
- suggest branch strategy
- restructure local history into milestone commits
- prepare work for GitHub push

Developer decision:
- reject tool-branded branch naming
- choose simple branch names:
  - `main`
  - `backend-foundation`
  - `reservation-safety`
  - `frontend-reservation-flow`
  - `project-docs`

### 4. Concurrency Hardening

AI was used to:
- narrow the branch scope to the concurrency requirement
- implement transaction-based reservation creation
- add row locking for compartment selection
- add a concurrent reservation integration test

Developer decision:
- focus only on concurrent booking correctness
- avoid broad architectural changes outside the requirement

### 5. Documentation

AI was used to:
- structure README content
- capture prompt evidence
- record workflow evidence
- record one reviewed AI-assisted code area

Developer decision:
- keep documentation limited to what the assessment explicitly requires

## Developer Control Points

The developer explicitly controlled:
- whether coding should start or pause
- branch naming strategy
- scope boundaries for each branch
- whether work should move to GitHub
- whether to prioritize docs before frontend

## Evidence of Review

AI output was not accepted automatically.

The developer reviewed:
- schema scope
- commit structure
- branch structure
- concurrency strategy
- documentation scope

Verification steps used during implementation included:
- typecheck
- unit tests
- e2e tests
- build

## Current Delivery Stages

Completed:
- backend foundation
- reservation concurrency hardening
- Git branch and commit structure
- AI workflow evidence

Not yet completed:
- frontend flow
- final README refinement after frontend completion
- optional Swagger / OpenAPI
