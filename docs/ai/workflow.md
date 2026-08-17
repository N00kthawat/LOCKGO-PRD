# AI-Assisted Development Workflow

โปรเจกต์นี้ใช้ AI เป็น Coding Partner ในการวิเคราะห์ requirement, ช่วย implement, debug และ review code โดย Developer เป็นผู้ตัดสินใจเรื่อง scope, architecture และตรวจสอบผลลัพธ์ก่อนนำไปใช้

## Workflow

```text
Requirement
↓
AI-assisted Analysis
↓
Developer Review & Planning
↓
AI-assisted Implementation
↓
Developer Code Review
↓
Testing & Debugging
↓
Final Code
```

## 1. Requirement Analysis

**AI ช่วย**

* อ่าน Technical Assessment, PRD และ `AGENTS.md`
* ตรวจโครงสร้าง repository
* สรุป requirement และงานที่ยังขาด
* ช่วยแบ่งงานเป็น milestone

**Developer ตัดสินใจ**

* เริ่มจาก Backend และ Reservation Correctness ก่อน Frontend
* จำกัด scope ให้ตรงกับ assessment และไม่เพิ่ม feature ที่ยังไม่จำเป็น

## 2. Backend Implementation

**AI ช่วย**

* ออกแบบ Prisma Schema
* สร้าง Migration และ Seed Data
* Implement Locker และ Reservation APIs
* เพิ่ม Unit Test และ Integration Test

**Developer ตัดสินใจ**

* ใช้ model เท่าที่จำเป็นกับ core requirement
* ไม่เพิ่ม abstraction ที่ยังไม่มี use case
* Review API behavior และ business rules ก่อนเก็บ implementation

## 3. Reservation Safety

**AI ช่วย**

* วิเคราะห์ Duplicate Confirm และ Race Condition
* Implement Transaction-based Reservation Creation
* เพิ่ม Row Locking ด้วย `FOR UPDATE SKIP LOCKED`
* เพิ่ม Concurrent Booking Integration Test

**Developer ตัดสินใจ**

* ให้ Backend/Database เป็นตัวรับประกัน Reservation Correctness
* ใช้ Idempotency สำหรับ duplicate request
* ใช้ Transaction และ Locking สำหรับกรณีหลาย user แย่งช่องเดียวกัน

## 4. Frontend & Runtime Debugging

**AI ช่วย**

* สร้าง 4-screen Reservation Flow
* เชื่อม Frontend กับ Backend APIs
* Debug ปัญหา CORS และ Local Test Data

**Developer ตัดสินใจ**

* คง UI ให้เรียบง่ายและอยู่ใน scope
* ใช้ Seed Data สำหรับ Demo
* ไม่เพิ่ม Authentication เพราะอยู่นอก scope ของ assessment

## 5. Git & Documentation

**AI ช่วย**

* เสนอ Git Workflow และ Branch Strategy
* ช่วยจัดโครงสร้าง README และเอกสาร AI
* ช่วยบันทึก AI Prompts, Code Review และ Debugging Challenge

**Developer ตัดสินใจ**

* ใช้ branch ตาม milestone เช่น

  * `backend-foundation`
  * `reservation-safety`
  * `frontend-reservation-flow`
  * `project-docs`
* ตรวจให้เอกสารอธิบายเฉพาะสิ่งที่มีอยู่จริงใน repository

## Verification

AI Generated Code ไม่ได้ถูกนำมาใช้โดยอัตโนมัติ ทุกส่วนต้องผ่าน Developer Review และตรวจสอบด้วย

* Typecheck
* Unit Test
* Integration / E2E Test
* Build
* Manual Reservation Flow

หากพบปัญหา จะนำผลจาก Test หรือ Runtime Error กลับไปใช้ในการ Debug และแก้ไขก่อนเป็น Final Code

## Final Responsibility

AI ถูกใช้เพื่อเพิ่มความเร็วในการวิเคราะห์และพัฒนา แต่การตัดสินใจด้าน Scope, Architecture, Business Logic และการยอมรับ Final Code เป็นความรับผิดชอบของ Developer
