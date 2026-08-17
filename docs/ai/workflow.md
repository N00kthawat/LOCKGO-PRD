# AI-Assisted Development Workflow

เอกสารนี้อธิบายว่าใช้ AI ระหว่าง assessment นี้อย่างไร และจุดไหนที่ developer เป็นคนตัดสินใจเอง

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

## ใช้ AI อย่างไรบ้าง

### 1. Requirement Analysis

AI ถูกใช้เพื่อ:
- อ่าน `AGENTS.md`
- อ่าน assessment PDFs
- inspect โครงสร้าง repository
- สรุปว่าอะไร implement แล้ว และอะไรยังขาด
- ช่วยหา smallest next milestone

การตัดสินใจของ Developer:
- ยืนยันว่าควรเริ่มจาก backend correctness ก่อน ไม่ใช่เริ่มจากความสวยของ frontend

### 2. Backend Foundation

AI ถูกใช้เพื่อ:
- ออกแบบ Prisma schema เริ่มต้น
- implement migration และ seed setup
- เพิ่ม reservation domain rules
- implement locker และ reservation APIs
- เพิ่ม unit tests และ e2e tests

การตัดสินใจของ Developer:
- คง model ให้เล็กที่สุดตาม core entities ที่จำเป็น
- ไม่เพิ่ม abstractions ที่ยังไม่มี use case จริง
- คุม API scope ให้ตรงกับ assessment

### 3. Git Workflow

AI ถูกใช้เพื่อ:
- เสนอ branch strategy
- จัดโครงสร้าง local history ให้เป็น milestone commits
- เตรียมงานสำหรับ push ขึ้น GitHub

การตัดสินใจของ Developer:
- ไม่ใช้ชื่อ branch ที่ติดคำเรียกเครื่องมือ
- ใช้ชื่อ branch แบบง่าย:
  - `main`
  - `backend-foundation`
  - `reservation-safety`
  - `frontend-reservation-flow`
  - `project-docs`

### 4. Concurrency Hardening

AI ถูกใช้เพื่อ:
- จำกัด scope ให้ตรงกับ requirement เรื่อง concurrency
- implement reservation creation แบบ transaction-based
- เพิ่ม row locking ตอนเลือก compartment
- เพิ่ม concurrent reservation integration test

การตัดสินใจของ Developer:
- โฟกัสเฉพาะ concurrent booking correctness
- ไม่ขยาย architecture เกิน requirement

### 5. Documentation

AI ถูกใช้เพื่อ:
- วางโครงสร้าง README
- บันทึกหลักฐาน prompts
- บันทึก workflow evidence
- บันทึก code area ที่เลือกมา review
- บันทึก duplicate-confirm debugging challenge

การตัดสินใจของ Developer:
- จำกัดเอกสารให้อยู่ในสิ่งที่ assessment ขอจริง

### 6. Frontend Flow และ Runtime Debugging

AI ถูกใช้เพื่อ:
- แทนที่ starter page ด้วย 4-screen reservation flow
- เชื่อม frontend เข้ากับ locker และ reservation APIs ที่มีอยู่
- จำกัด UI ให้สะอาดและอยู่ใน scope ของ assessment
- debug runtime issues เช่น CORS และความพร้อมของ test data

การตัดสินใจของ Developer:
- คง UI ให้ minimal แทนการใส่ visual complexity ที่ไม่จำเป็น
- ใช้ seeded demo data และ demo user ID แบบคงที่สำหรับ local verification
- แก้ integration issues โดยไม่ขยายงานไปสู่ authentication

## จุดที่ Developer ควบคุมเอง

Developer เป็นคนตัดสินใจชัดเจนในเรื่อง:
- จะเริ่มหรือหยุด coding เมื่อไร
- จะตั้งชื่อ branch อย่างไร
- จะจำกัด scope ของแต่ละ branch แค่ไหน
- จะเริ่มย้ายงานขึ้น GitHub เมื่อไร
- จะให้ docs มาก่อน frontend หรือไม่

## หลักฐานของการ Review

AI output ไม่ได้ถูกยอมรับอัตโนมัติ

Developer เป็นคน review เรื่อง:
- scope ของ schema
- โครงสร้าง commit
- โครงสร้าง branch
- concurrency strategy
- scope ของเอกสาร

ขั้นตอน verify ที่ใช้ระหว่างการพัฒนา:
- typecheck
- unit tests
- e2e tests
- build

## สถานะการส่งงานปัจจุบัน

เสร็จแล้ว:
- backend foundation
- reservation concurrency hardening
- frontend 4-screen flow
- เอกสารที่ต้องใช้ส่งงาน
- Git branch และ commit structure
- AI workflow evidence

ยังไม่ได้ทำ:
- optional Swagger / OpenAPI
