# AI Prompts Used

ตัวอย่าง Prompt หลักที่ใช้ระหว่างการพัฒนา LockGo Assessment และสิ่งที่นำไปใช้จากคำตอบของ AI

## Prompt 1 — Requirement & Repository Analysis

> อ่าน `AGENTS.md`, Technical Assessment, PRD และตรวจโครงสร้าง repository ปัจจุบัน  
> สรุป requirement ที่ต้องทำ, สิ่งที่มีอยู่แล้ว, สิ่งที่ยังขาด และความเสี่ยงที่ควรจัดการก่อนเริ่มแก้โค้ด

**ใช้ทำอะไร**

ใช้ AI ช่วยทำความเข้าใจ project ก่อนเริ่ม development เพื่อไม่ให้ implement feature เกินหรือขาดจาก requirement

ผลที่ได้ถูกนำมาใช้แบ่งงานออกเป็น Backend, Reservation Safety, Frontend และ Documentation

---

## Prompt 2 — Reservation Concurrency Safety

> Review reservation creation flow โดยโฟกัสกรณีที่เหลือ compartment เพียง 1 ช่อง แล้วมีหลาย request พยายามจองพร้อมกัน  
> เสนอวิธีป้องกัน double booking ที่ backend/database และเพิ่ม integration test เพื่อพิสูจน์ behavior นี้

**ใช้ทำอะไร**

ใช้ AI ช่วยวิเคราะห์ Race Condition และสร้างแนวทางป้องกัน Concurrent Booking

หลัง review ผมเลือกใช้ Database Transaction และ `FOR UPDATE SKIP LOCKED` พร้อมเพิ่ม Concurrent Integration Test

---

## Prompt 3 — Duplicate Confirm / Idempotency

> ตรวจสอบกรณีผู้ใช้กด Confirm Reservation ซ้ำอย่างรวดเร็ว  
> ออกแบบ backend idempotency เพื่อให้ request เดิมไม่สร้าง Reservation ใหม่ และเพิ่ม test สำหรับกรณี duplicate request

**ใช้ทำอะไร**

ใช้ AI ช่วยวิเคราะห์ปัญหา Duplicate Reservation และเสนอ implementation สำหรับ Idempotency

ผลลัพธ์คือ Backend รองรับ Idempotency Key และ request เดิมสามารถคืน Reservation เดิมได้โดยไม่สร้างข้อมูลซ้ำ

---

## Prompt 4 — Runtime Debugging

> ตรวจสอบว่าทำไม Frontend ที่รันผ่าน Vite จึงเรียก Backend API ไม่สำเร็จ  
> ตรวจ CORS, API configuration และ local seed data โดยแก้เฉพาะสิ่งที่จำเป็นสำหรับ demo และไม่เพิ่ม feature นอก scope

**ใช้ทำอะไร**

ใช้ AI ช่วย Debug การทำงานจริงบน Local Environment

หลังตรวจสอบ ผมเปิด CORS สำหรับ Local Frontend และปรับ Seed Data ให้สามารถทดลอง Reservation Flow ซ้ำได้ง่ายขึ้น

---

## Prompt 5 — Documentation Review

> Review repository ปัจจุบันและสร้างเฉพาะ documentation ที่ Technical Assessment ต้องส่ง  
> เอกสารต้องอธิบายจาก implementation ที่มีอยู่จริง และไม่เขียน feature ที่ยังไม่ได้ implement

**ใช้ทำอะไร**

ใช้ AI ช่วยจัดโครงสร้างและตรวจความครบถ้วนของเอกสาร

เอกสารหลักที่จัดทำคือ:

- `README.md`
- `docs/ai/prompts.md`
- `docs/ai/workflow.md`
- `docs/ai/code-review.md`

เนื้อหาสุดท้ายถูกตรวจและปรับให้ตรงกับ implementation ใน repository ก่อนนำไปใช้