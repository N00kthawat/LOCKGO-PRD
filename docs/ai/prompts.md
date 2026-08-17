# AI Prompts Used

This file records important prompts actually used during development work for this assessment.

## Prompt 1 — Repository and Requirement Analysis

### Purpose

Used to force a structured first pass before coding:
- read AGENTS.md
- read assessment PDFs
- inspect repository state
- inspect git status
- inspect frontend/backend/Prisma/docker configuration
- summarize what is done and what is missing

### Prompt

```text
อ่าน AGENTS.md, repository ปัจจุบัน และเอกสารทั้งหมดใน docs/assessment/ ก่อน

ยังไม่อนุญาตให้แก้ไขไฟล์

ตรวจสอบ git status, frontend, backend, Prisma, docker-compose และ database configuration

จากนั้นรายงานเป็นภาษาไทยว่า:
1. โปรเจกต์ปัจจุบันทำถึงไหนแล้ว
2. อะไรทำงานแล้ว
3. อะไรยังไม่ได้ทำ
4. มีปัญหาหรือ configuration ที่น่าสงสัยหรือไม่
5. Requirement หลักจาก Assessment และ PRD มีอะไรบ้าง
6. เสนอ Milestone ถัดไปที่เล็กและเหมาะสมที่สุด

แยก REQUIREMENT, ASSUMPTION และ RECOMMENDATION ออกจากกันให้ชัดเจน

ห้ามแก้ไขไฟล์จนกว่าฉันจะอนุญาต
```

## Prompt 2 — Git Workflow Planning

### Purpose

Used to stop implementation drift and force a clean branch strategy based on assessment scope.

### Prompt

```text
วางแผนมาก่อนว่าจำทำ git ยังไง มีbranch อะไรบ้าง
```

### Outcome

- Use a single GitHub repository
- Keep branch names simple and non-tool-branded
- Adopt:
  - `main`
  - `backend-foundation`
  - `reservation-safety`
  - `frontend-reservation-flow`
  - `project-docs`

## Prompt 3 — Concurrency Safety Scope

### Purpose

Used to constrain work specifically to the assessment concurrency requirement and avoid unrelated feature expansion.

### Prompt

```text
ว่ามา อย่าพาเราไปเรื่อยนะไม่งั้นพังแน่ พยายามดุจากเอกสาร ห้ามเกินขอเขต ห้ามแถม
```

### Outcome

- Restrict the branch scope to:
  - database-level concurrent booking protection
  - concurrent integration coverage
- Avoid unrelated frontend or documentation work in that branch

## Prompt 4 — Project Documentation Scope

### Purpose

Used to shift from implementation to required submission documents only.

### Prompt

```text
ถ้าจะไม่หลุด scope ผมแนะนำให้ไป project-docs ก่อน ไม่ใช่ frontend
```

### Outcome

- Prioritize required submission documents before frontend
- Add only:
  - `README.md`
  - `docs/ai/prompts.md`
  - `docs/ai/workflow.md`
  - `docs/ai/code-review.md`
