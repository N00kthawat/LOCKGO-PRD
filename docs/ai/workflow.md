# กระบวนการพัฒนาแบบใช้ AI ช่วย

โปรเจกต์นี้ใช้ AI เป็นผู้ช่วยในการพัฒนา เพื่อช่วยวิเคราะห์ความต้องการของโจทย์ ช่วยลงมือเขียนโค้ด ช่วยตรวจหาปัญหา และช่วยทบทวนโค้ด แต่ผู้ที่ตัดสินใจสุดท้ายยังคงเป็นผู้พัฒนา ไม่ว่าจะเป็นเรื่องขอบเขตงาน โครงสร้างระบบ หรือการยอมรับโค้ดก่อนนำไปใช้งานจริง

## ลำดับการทำงาน

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

* อ่านเอกสารโจทย์ Technical Assessment, PRD และ `AGENTS.md`
* ตรวจโครงสร้าง repository
* สรุปความต้องการหลักของระบบ และชี้ว่างานส่วนใดยังขาด
* ช่วยแบ่งงานออกเป็นช่วงย่อยหรือ milestone

**Developer ตัดสินใจ**

* เริ่มจากฝั่ง Backend และความถูกต้องของการจองก่อนทำ Frontend
* จำกัดขอบเขตงานให้ตรงกับ assessment และไม่เพิ่มฟีเจอร์ที่ยังไม่จำเป็น

## 2. Backend Implementation

**AI ช่วย**

* ออกแบบ Prisma Schema
* สร้าง Migration และ Seed Data
* พัฒนา Locker API และ Reservation API
* เพิ่ม Unit Test และ Integration Test

**Developer ตัดสินใจ**

* ใช้ model เท่าที่จำเป็นต่อความต้องการหลักของโจทย์
* ไม่เพิ่มชั้น abstraction ที่ยังไม่มีเหตุผลรองรับในงานจริง
* ตรวจพฤติกรรมของ API และกฎธุรกิจก่อนยอมรับ implementation

## 3. Reservation Safety

**AI ช่วย**

* ช่วยวิเคราะห์ปัญหาการกดยืนยันซ้ำ และปัญหาการแย่งจองพร้อมกัน
* ช่วยพัฒนากระบวนการสร้าง reservation แบบใช้ transaction
* เพิ่มการ lock แถวข้อมูลด้วย `FOR UPDATE SKIP LOCKED`
* เพิ่ม Integration Test สำหรับกรณีมีหลาย request แข่งกันจอง

**Developer ตัดสินใจ**

* ให้ Backend และ Database เป็นตัวรับประกันความถูกต้องของการจอง
* ใช้ Idempotency เพื่อป้องกันการส่งคำขอเดิมซ้ำ
* ใช้ Transaction และ Locking สำหรับกรณีผู้ใช้หลายคนแย่งช่องเดียวกัน

## 4. Frontend & Runtime Debugging

**AI ช่วย**

* สร้างหน้าจอการจอง 4 หน้า
* เชื่อม Frontend เข้ากับ Backend APIs
* ช่วยไล่ปัญหา CORS และข้อมูลทดสอบบนเครื่อง

**Developer ตัดสินใจ**

* คง UI ให้เรียบง่ายและอยู่ใน scope
* ใช้ Seed Data สำหรับสาธิตการทำงาน
* ไม่เพิ่มระบบ Authentication จริง เพราะอยู่นอกขอบเขตของ assessment

## 5. Git & Documentation

**AI ช่วย**

* เสนอแนวทางการใช้ Git และการแยก branch
* ช่วยจัดโครงสร้าง README และเอกสาร AI
* ช่วยบันทึก AI Prompts, การทบทวนโค้ด และโจทย์ debugging challenge


**Developer ตัดสินใจ**

* ใช้ branch ตาม milestone เช่น

  * `backend-foundation`
  * `reservation-safety`
  * `frontend-reservation-flow`
  * `project-docs`
* ตรวจให้เอกสารอธิบายเฉพาะสิ่งที่มีอยู่จริงใน repository เท่านั้น

## Verification

โค้ดที่ AI ช่วยสร้างไม่ได้ถูกนำมาใช้โดยอัตโนมัติ ทุกส่วนต้องผ่านการตรวจทานโดยผู้พัฒนา และต้องตรวจสอบซ้ำด้วยวิธีต่อไปนี้

* Typecheck
* Unit Test
* Integration / E2E Test
* Build
* การลองใช้งาน Reservation Flow ด้วยมือ

หากพบปัญหา จะนำผลจากการทดสอบหรือข้อผิดพลาดระหว่างรันกลับมาใช้ในการแก้ไข ก่อนสรุปเป็นโค้ดฉบับสุดท้าย

## Final Responsibility

AI ถูกใช้เพื่อช่วยให้การวิเคราะห์และพัฒนาเร็วขึ้น แต่การตัดสินใจเรื่องขอบเขตงาน โครงสร้างระบบ กฎธุรกิจ และการยอมรับโค้ดฉบับสุดท้าย ยังคงเป็นความรับผิดชอบของผู้พัฒนา
