# LOCKGO — AI Fullstack Engineer Technical Assessment

## 1. Project Context

โปรเจกต์นี้เป็น Take-home Technical Assessment สำหรับตำแหน่ง **AI Fullstack Engineer**

Feature ที่ต้องพัฒนาคือ:

**Find & Reserve Locker**

LOCKGO เป็น Smart Locker Platform ที่ให้ผู้ใช้งานสามารถค้นหา Locker ตรวจสอบ Availability เลือกขนาดช่อง เลือกช่วงเวลา และจอง Locker ล่วงหน้าได้

เป้าหมายของ Assessment ไม่ใช่แค่สร้าง Feature ให้ทำงานได้ แต่ต้องแสดงให้เห็นถึง:

* Fullstack Development
* Frontend Development
* Backend Development
* API Development
* Database Design
* Business Logic
* Testing
* Debugging
* Git / Collaboration
* AI-assisted Development
* AI Generated Code Review
* Documentation

---

# 2. Source of Truth

ก่อนวิเคราะห์หรือพัฒนา Feature ต้องอ่านเอกสารต่อไปนี้ก่อน:

```text
docs/assessment/technical-assessment.pdf
docs/assessment/lockgo-prd.pdf
```

ลำดับความสำคัญ:

1. `technical-assessment.pdf`
2. `lockgo-prd.pdf`
3. Existing source code
4. AGENTS.md
5. Developer assumptions

Requirement จากเอกสารบริษัทถือเป็น **Source of Truth**

ห้ามเปลี่ยน Business Rule ที่ระบุในเอกสารโดยไม่มีเหตุผล

หาก Requirement ไม่ได้ระบุรายละเอียดบางอย่าง:

* ห้ามเดาแล้วทำเหมือนเป็น Requirement
* ให้ระบุเป็น `ASSUMPTION`
* อธิบายเหตุผลของ assumption
* เลือก implementation ที่เรียบง่ายและสมเหตุสมผลสำหรับ Technical Assessment

หากไม่สามารถอ่าน PDF ได้ ให้รายงานทันที ห้ามสมมติว่าอ่านแล้ว

---

# 3. Current Tech Stack

## Frontend

```text
React
TypeScript
Vite
```

## Backend

```text
NestJS
TypeScript
```

## Database

```text
PostgreSQL 17
```

รันผ่าน Docker

Container:

```text
lockgo-postgres
```

Host port:

```text
5433
```

Container PostgreSQL port:

```text
5432
```

## ORM

```text
Prisma 7
```

## Package Manager

```text
pnpm
```

---

# 4. Current Repository Structure

โครงสร้างหลักปัจจุบัน:

```text
lockgo/
├── frontend/
├── backend/
├── docs/
│   ├── assessment/
│   │   ├── technical-assessment.pdf
│   │   └── lockgo-prd.pdf
│   └── ai/
├── docker-compose.yml
└── AGENTS.md
```

ห้ามเปลี่ยน repository structure ครั้งใหญ่โดยไม่มีเหตุผล

---

# 5. Current Project State

สถานะล่าสุด:

* React + TypeScript + Vite ถูกสร้างแล้ว
* Frontend สามารถรันได้แล้ว
* Frontend dev server ใช้ port `5173`
* NestJS backend ถูกสร้างแล้ว
* Backend สามารถรันได้แล้ว
* Backend ใช้ port `3000`
* PostgreSQL 17 รันผ่าน Docker แล้ว
* PostgreSQL host port คือ `5433`
* Prisma `7.9.1` ถูกติดตั้งแล้ว
* Prisma เชื่อมต่อ PostgreSQL สำเร็จแล้ว
* `prisma db pull` เชื่อมต่อได้และรายงานว่า database ยังว่าง
* ยังไม่มี application domain tables
* ยังไม่มี production domain migration
* ยังไม่ได้ implement LOCKGO API
* ยังไม่ได้ implement LOCKGO frontend screens

ห้ามย้อนกลับไป initialize project ใหม่โดยไม่จำเป็น

ให้ต่อยอดจากสถานะปัจจุบัน

---

# 6. Core User Flow

Feature หลักต้องรองรับ flow:

```text
Find Locker
    ↓
Select Location
    ↓
View Locker List
    ↓
Select Locker
    ↓
View Locker Detail
    ↓
Select Compartment Size
    ↓
Select Start Time
    ↓
Select Duration
    ↓
View Reservation Summary
    ↓
Confirm Reservation
    ↓
Reservation Created
    ↓
Booking Confirmation
```

---

# 7. Required Frontend Screens

ต้องมีอย่างน้อย 4 Screens

## Screen 1 — Find Locker

ต้องแสดง:

* Search / Location
* Filter
* Locker List
* Availability
* Price

Locker list ควรแสดงอย่างน้อย:

* Locker Name
* Location
* Distance
* Available Small Locker
* Available Medium Locker
* Available Large Locker
* Price
* Operating Status

Filters:

* Distance
* Locker Size
* Price
* Availability

PRD ยังระบุ Sorting เช่น:

* Nearest
* Lowest Price
* Most Available

---

## Screen 2 — Locker Detail

ต้องแสดงอย่างน้อย:

* Locker Information
* Address / Location
* Distance
* Operating Hours
* Locker Status
* Locker Sizes
* Available Compartments
* Price
* Available Time
* Select Button

---

## Screen 3 — Reservation

ผู้ใช้ต้องสามารถเลือก:

* Locker
* Compartment Size
* Start Date
* Start Time
* Duration

ก่อน Confirm ต้องแสดง:

* Selected Locker
* Location
* Compartment Size
* Start Time
* End Time
* Duration
* Price
* Total Price
* Confirm Button

---

## Screen 4 — Confirmation

ต้องแสดงอย่างน้อย:

* Reservation / Booking Number
* Locker
* Location
* Compartment
* Start Time
* Expiration / End Time
* Price
* Booking Status

---

# 8. Required Backend APIs

อย่างน้อยต้องมี:

```http
GET /api/lockers
```

ใช้สำหรับค้นหา Locker

ควรรองรับ filters เช่น:

```text
location
distance
size
availability
price
```

---

```http
GET /api/lockers/:id
```

ใช้สำหรับดูรายละเอียด Locker

---

```http
POST /api/reservations
```

ใช้สร้าง Reservation

Backend ต้องตรวจ Availability อีกครั้งตอน Confirm

---

```http
GET /api/reservations/:id
```

ใช้ดูรายละเอียด Reservation

---

# 9. Minimum Database Entities

ต้องมีอย่างน้อย:

```text
User
Locker
Compartment
Reservation
```

Relationship เบื้องต้น:

```text
Locker 1 ─────── N Compartment

Compartment 1 ── N Reservation

User 1 ───────── N Reservation
```

สามารถเพิ่ม Entity อื่นได้หากมีเหตุผลที่ชัดเจน

ห้ามเพิ่ม abstraction หรือ entity ที่ไม่จำเป็นเพื่อ impress reviewer

---

# 10. Locker Sizes

ระบบต้องรองรับอย่างน้อย:

```text
SMALL
MEDIUM
LARGE
```

Locker Station แต่ละแห่งสามารถมีจำนวน Compartment แต่ละขนาดไม่เท่ากันได้

---

# 11. Reservation Status

ต้องรองรับอย่างน้อย:

```text
RESERVED
ACTIVE
COMPLETED
CANCELLED
EXPIRED
```

---

# 12. Core Business Rules

Business Rules เหล่านี้สำคัญมากและต้องมี test รองรับ

## BR-01 — Availability

ผู้ใช้สามารถจองได้เฉพาะ Compartment ที่ Available ในช่วงเวลาที่ต้องการใช้งาน

---

## BR-02 — Reservation Conflict

Compartment เดียวกันห้ามมี Active Reservation ที่ช่วงเวลาซ้อนกัน

Time overlap โดยทั่วไปสามารถตรวจด้วยหลัก:

```text
requestedStart < existingEnd
AND
requestedEnd > existingStart
```

Implementation จริงต้องพิจารณา Reservation Status ด้วย

---

## BR-03 — Expired Reservation

Reservation ที่หมดอายุแล้วต้องไม่ถือว่าเป็น Active Reservation และต้องไม่ block Availability

---

## BR-04 — Reservation Number

Reservation ที่สร้างสำเร็จต้องมี Reservation Number ที่ไม่ซ้ำกัน

---

## BR-05 — Duplicate Request

หากผู้ใช้กด Confirm มากกว่าหนึ่งครั้ง ระบบต้องไม่สร้าง Reservation ซ้ำโดยไม่ตั้งใจ

Frontend protection เพียงอย่างเดียวไม่เพียงพอ

Backend ต้องเป็น source of truth

ควรพิจารณา:

```text
Idempotency
Database constraint
Transaction
```

---

## BR-06 — Invalid Reservation

ห้ามสร้าง Reservation หาก request:

* ข้อมูลไม่ครบ
* ข้อมูลไม่ถูกต้อง
* Locker ไม่มีอยู่
* Size ไม่มีอยู่
* ไม่มี Availability
* User ไม่มีสิทธิ์

---

# 13. Concurrency Requirement

นี่เป็น Requirement สำคัญระดับสูง

กรณี:

```text
มี Compartment ว่างเพียง 1 ช่อง

User A → Confirm
User B → Confirm
```

และเกิดขึ้นใกล้เคียงกัน

ผลลัพธ์ที่ถูกต้อง:

```text
Reservation สำเร็จได้เพียง 1 รายการ
```

ห้ามเกิด Double Booking

การตรวจ Availability แล้วค่อย Insert โดยไม่มี concurrency protection ถือว่าไม่เพียงพอ

ให้พิจารณา database-level correctness เช่น:

* Transaction
* Locking
* Constraint
* Appropriate isolation / concurrency strategy

อย่าเลือกวิธีแก้เพียงเพราะ implement ง่าย

ต้องสามารถอธิบาย trade-off ของวิธีที่เลือกได้

---

# 14. Duplicate Confirm vs Concurrent Booking

ต้องแยกสองปัญหานี้ออกจากกัน

## Duplicate Confirm

ผู้ใช้คนเดียวส่ง request เดิมซ้ำ

ตัวอย่าง:

```text
User A
Confirm
Confirm
```

ควรพิจารณา:

```text
Idempotency Key
```

---

## Concurrent Booking

ผู้ใช้คนละคนแข่งขันกันจอง Compartment สุดท้าย

ตัวอย่าง:

```text
User A ──┐
         ├── Medium #03
User B ──┘
```

Idempotency Key อย่างเดียวไม่สามารถแก้ปัญหานี้ได้

ต้องมี backend/database concurrency protection

---

# 15. Error Handling

API ต้องส่ง error response ที่ frontend ใช้งานได้

ควรมี error contract ที่ consistent

ตัวอย่าง:

```json
{
  "code": "LOCKER_NOT_FOUND",
  "message": "Locker not found"
}
```

หรือ:

```json
{
  "code": "NO_AVAILABLE_COMPARTMENT",
  "message": "No locker compartment is available for the selected time range"
}
```

หรือ:

```json
{
  "code": "RESERVATION_CONFLICT",
  "message": "The selected compartment is no longer available"
}
```

พิจารณา HTTP status codes ให้เหมาะสม เช่น:

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
500 Internal Server Error
```

ห้าม expose internal technical error ให้ end user โดยไม่จำเป็น

---

# 16. Testing Requirements

Assessment ต้องมี Unit Test และ API / Integration Test

อย่างน้อยควรครอบคลุม:

## Unit Tests

```text
- calculate reservation end time correctly
- calculate total price correctly
- detect overlapping reservation
- expired reservation does not block availability
```

## API / Integration Tests

```text
- create reservation successfully
- cannot reserve when no matching compartment is available
- cannot create overlapping reservation
- duplicate confirmation does not create duplicate reservation
- unknown locker returns appropriate error
```

ควรมี concurrency test:

```text
Two concurrent requests compete for one available compartment
→ exactly one reservation succeeds
```

หลัง implement หรือแก้ business logic ต้อง run tests ที่เกี่ยวข้อง

---

# 17. AI-assisted Development Requirement

Assessment อนุญาตและต้องการให้ใช้ AI จริง

โปรเจกต์ต้องสามารถแสดง:

```text
Requirement
↓
AI Requirement Analysis
↓
Developer Review
↓
Task Breakdown
↓
AI-assisted Implementation
↓
Developer Review
↓
Testing
↓
Bug Fix
↓
Code Review
↓
Final Code
```

ทุกครั้งที่ AI ช่วยงานที่มีสาระสำคัญ ควรเก็บหลักฐานใน:

```text
docs/ai/
```

อย่างน้อยควรมีภายหลัง:

```text
docs/ai/prompts.md
docs/ai/workflow.md
docs/ai/code-review.md
```

---

# 18. AI Prompt Requirement

Assessment ต้องส่ง Prompt สำคัญอย่างน้อย 3 Prompt

ตัวอย่างประเภท Prompt:

* Requirement Analysis
* Architecture Analysis
* API Generation
* UI Generation
* Test Generation
* Debugging
* Code Review
* Refactoring

Prompt ที่ใช้จริงควรถูกบันทึกไว้

ห้ามสร้าง prompt ปลอมย้อนหลังเพื่อให้เอกสารดูครบ

---

# 19. AI Code Review Requirement

ต้องเลือก AI Generated Code อย่างน้อย 1 ส่วน แล้วแสดง:

```text
AI Generated Code
        ↓
Developer Review
        ↓
Final Code
```

Review ต้องพิจารณา:

* Correctness
* Bugs
* Security Risk
* Performance
* Maintainability

Codex ห้ามถือว่า code ที่ AI generate ถูกต้องโดยอัตโนมัติ

---

# 20. Git Workflow

ทำงานแบบ repository จริง

ควรใช้แนวคิด:

```text
Issue / Task
↓
Branch
↓
Development
↓
AI-assisted Coding
↓
Test
↓
Commit
↓
Pull Request / Merge Request
↓
Code Review
↓
Merge
```

Commit message ต้องมีความหมาย

ตัวอย่าง:

```text
feat: add locker search API

feat: implement reservation service

test: add reservation conflict tests

fix: prevent duplicate reservation requests

docs: add AI development workflow
```

หลีกเลี่ยง commit เช่น:

```text
update
fix
final
final2
test
```

---

# 21. Documentation Requirements

Final repository ต้องมี README ที่อธิบายอย่างน้อย:

* Project Overview
* Architecture
* Technology
* Installation
* Configuration
* Database Setup
* Run Application
* Run Test
* API Documentation
* AI Tools

ควรเพิ่ม:

* Architecture Decisions
* Business Rules
* Assumptions
* Concurrency Strategy
* Idempotency Strategy
* Trade-offs
* Known Limitations
* Future Improvements
* AI-assisted Development

---

# 22. Out of Scope

อย่าเสียเวลา implement ของต่อไปนี้ก่อน Core Feature เสร็จ:

* Real Payment Gateway
* Real QR Code Unlock
* Bluetooth Integration
* Locker Hardware Integration
* Real Push Notification
* Real Google Maps API
* Production Deployment

สามารถใช้ Mock Data หรือ Mock Service ได้ตาม Requirement

---

# 23. Bonus Features

ทำหลัง Core Requirements, Tests และ Documentation เสร็จเท่านั้น

Bonus ได้แก่:

* Responsive Web Design
* Mobile Application
* Docker
* CI/CD
* Authentication
* Swagger / OpenAPI
* E2E Test

โปรเจกต์มี Docker สำหรับ PostgreSQL อยู่แล้ว

Priority ที่แนะนำหากมีเวลาเหลือ:

```text
Swagger / OpenAPI
Responsive UI
E2E Test
CI/CD
Authentication
Mobile
```

---

# 24. Coding Rules

ใช้ English สำหรับ:

* File names
* Class names
* Function names
* Variable names
* Database fields
* API paths
* Enum names
* Test descriptions หากเหมาะสม

สามารถอธิบาย:

* Plan
* Reasoning
* Progress
* Review

เป็นภาษาไทยได้

ใช้ TypeScript strict typing

หลีกเลี่ยง:

```text
any
```

หากไม่จำเป็น

อย่าสร้าง abstraction ล่วงหน้าโดยไม่มี use case จริง

ให้เน้น:

```text
Correctness
Readability
Testability
Maintainability
```

มากกว่า clever code

---

# 25. Development Workflow for Codex

ก่อนเริ่ม task ใหม่ทุกครั้ง:

1. อ่าน `AGENTS.md`
2. อ่าน requirement ที่เกี่ยวข้องใน PDF
3. ตรวจ `git status`
4. Inspect source code ที่เกี่ยวข้อง
5. Inspect `package.json`
6. Inspect database schema หากเกี่ยวข้อง
7. ตรวจ existing tests
8. สรุปสถานะปัจจุบัน
9. เสนอ plan แบบสั้น
10. ระบุ assumptions / risks

สำหรับ task ขนาดใหญ่:

**ห้ามแก้ไฟล์ทันที**

ต้องเสนอ implementation plan ก่อน

เมื่อ plan ได้รับการยืนยันแล้วจึง implement

---

# 26. After Making Changes

หลังแก้ไข code:

1. ตรวจ diff
2. Run formatter/linter หากมี
3. Run tests ที่เกี่ยวข้อง
4. Run build
5. รายงาน error หากมี
6. ห้ามซ่อน failing test
7. ห้ามลบ test เพียงเพื่อให้ pipeline ผ่าน
8. ห้ามเปลี่ยน requirement เพื่อให้ implementation ง่ายขึ้น

จากนั้นสรุปเป็นภาษาไทย:

```text
สิ่งที่ทำ
ไฟล์ที่เปลี่ยน
คำสั่งที่รัน
Test/Build Result
Assumptions
Known Issues
งานถัดไป
```

---

# 27. Security / Secrets

ห้าม commit:

```text
.env
password
token
API key
credential
```

ต้องมี:

```text
.env.example
```

หาก `.env` ถูก track อยู่ ให้แจ้งก่อนดำเนินการต่อ

---

# 28. Infrastructure Rules

PostgreSQL ของโปรเจกต์นี้ใช้:

```text
Host: 127.0.0.1
Port: 5433
Database: lockgo
```

อย่าเปลี่ยน port กลับเป็น `5432` โดยอัตโนมัติ

เครื่อง development มี PostgreSQL อีก instance ที่ port `5432`

ดังนั้น LOCKGO Docker PostgreSQL ถูกตั้งไว้ที่:

```text
5433 -> 5432
```

ห้ามเปลี่ยน configuration นี้โดยไม่มีเหตุผล

---

# 29. Engineering Priority

หากต้องเลือกระหว่าง Feature quantity กับ Quality ให้เรียงความสำคัญ:

```text
1. Reservation Correctness
2. Business Rules
3. Concurrency / Double Booking Prevention
4. Backend API
5. Database Design
6. Testing
7. Frontend Core Flow
8. Error Handling
9. AI Workflow / Review Evidence
10. Documentation
11. Bonus Features
```

Assessment ให้ความสำคัญกับคุณภาพของงานและวิธีคิดมากกว่าปริมาณ Feature

---

# 30. Definition of Done

Core assessment ถือว่าเสร็จเมื่อ:

* Frontend 4 screens ใช้งาน flow หลักได้
* Required APIs ทำงานครบ
* Database schema และ migrations มีครบ
* Reservation business rules ทำงานถูกต้อง
* Double booking ถูกป้องกัน
* Duplicate confirm ถูกป้องกัน
* Error handling มีมาตรฐาน
* Unit tests ผ่าน
* Integration tests ผ่าน
* Concurrency scenario มีการทดสอบหรือพิสูจน์ชัดเจน
* README ใช้งานได้
* API documentation มี
* Architecture diagram มี
* AI prompts ถูกเก็บไว้
* AI workflow ถูกอธิบาย
* AI-generated code review ถูกเก็บไว้
* Repository ไม่มี secrets
* Application build ผ่าน
* Fresh setup สามารถทำตาม README ได้

---

# 31. First Action When Starting a New Codex Session

เมื่อเริ่ม session ใหม่ ห้ามเริ่ม implement ทันที

ให้ทำตามนี้ก่อน:

```text
1. อ่าน AGENTS.md
2. อ่าน technical-assessment.pdf
3. อ่าน lockgo-prd.pdf
4. inspect repository
5. git status
6. สรุปว่าปัจจุบันทำถึงไหนแล้ว
7. ระบุ requirement ที่ยังขาด
8. เสนอ milestone ถัดไป
```

จากนั้นรอคำยืนยันก่อนแก้ไข code หาก task มี scope ใหญ่
