# AI Prompts Used

This file records the main AI prompt intents used during development work for this assessment.

It focuses on prompt logic, process, developer decisions, and outcomes. It does not reproduce conversational chat phrasing.

## Prompt 1 — Repository and Requirement Analysis

### Goal

Establish a structured pre-implementation review before any code changes:
- read AGENTS.md
- read assessment PDFs
- inspect repository state
- inspect git status
- inspect frontend/backend/Prisma/docker configuration
- summarize what is done and what is missing

### AI Support Logic

- collect source-of-truth requirements first
- inspect the existing implementation before proposing work
- separate current state, missing scope, risks, and next milestone

## Prompt 2 — Git Workflow Planning

### Goal

Define a simple Git workflow that fits the assessment scope and produces reviewable milestone history.

### AI Support Logic

- choose a single-repository strategy
- keep branch naming simple and professional
- separate work into milestone branches instead of mixing unrelated changes

### Developer Decision

- Use a single GitHub repository
- Keep branch names simple and non-tool-branded
- Adopt:
  - `main`
  - `backend-foundation`
  - `reservation-safety`
  - `frontend-reservation-flow`
  - `project-docs`

## Prompt 3 — Concurrency Safety Scope

### Goal

Limit the branch scope to the explicit concurrent booking requirement from the assessment.

### AI Support Logic

- focus only on concurrent reservation correctness
- avoid unrelated frontend or documentation work
- prefer a database-level correctness strategy instead of frontend-only protection

### Developer Decision

- Restrict the branch scope to:
  - database-level concurrent booking protection
  - concurrent integration coverage
- Avoid unrelated frontend or documentation work in that branch

## Prompt 4 — Project Documentation Scope

### Goal

Prioritize submission documents required by the assessment before moving to additional feature work.

### AI Support Logic

- create only the required documentation artifacts
- avoid adding optional documentation beyond current implementation scope
- document actual work completed in the repository

### Developer Decision

- Prioritize required submission documents before frontend
- Add only:
  - `README.md`
  - `docs/ai/prompts.md`
  - `docs/ai/workflow.md`
  - `docs/ai/code-review.md`
