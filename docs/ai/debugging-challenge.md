# Debugging Challenge

เอกสารนี้ตอบโจทย์ assessment กรณีผู้ใช้กด `Confirm Reservation` สองครั้งเร็ว ๆ แล้วระบบสร้าง reservation ซ้ำ

## 1. ปัญหาอาจเกิดจากอะไรได้บ้าง

- frontend ส่งสอง requests ออกไปก่อนที่ปุ่มจะถูก disable
- backend มอง requests ที่ซ้ำกันเป็น create operations คนละรายการ
- flow การจองใช้วิธีอ่าน availability ก่อน แล้ว insert ทีหลัง โดยไม่มี concurrency protection
- ระบบไม่มี idempotency key สำหรับการกด confirm ซ้ำของ user คนเดิม

## 2. จะตรวจอย่างไร

- reproduce ปัญหาจาก reservation form โดยกด confirm ซ้ำ
- inspect browser network requests ว่ามี request ซ้ำถูกส่งจริงหรือไม่
- เทียบ request headers และ body โดยเฉพาะ `x-idempotency-key`
- inspect backend logs และ database rows สำหรับ user และ time window เดียวกัน
- รัน automated tests สำหรับ duplicate confirm และ concurrent booking

## 3. ควรแก้ที่ไหน

ควรช่วยกันทั้งสองฝั่ง แต่ backend ต้องเป็น source of truth

- Frontend:
  - disable การ submit ซ้ำขณะ request กำลังวิ่ง
  - ส่ง idempotency key เมื่อเหมาะสม
- Backend:
  - มอง `(userId, idempotencyKey)` เดิมเป็น reservation request เดิม
  - re-check availability ระหว่างการสร้าง reservation
  - ป้องกัน race condition ของช่องสุดท้ายที่ระดับ database transaction

## 4. repository นี้ป้องกันอย่างไรในปัจจุบัน

- frontend มีช่อง optional สำหรับ idempotency key
- backend รับ idempotency ได้ทั้งจาก request body และ `x-idempotency-key`
- database บังคับ uniqueness ของ `(userId, idempotencyKey)`
- reservation creation รันใน serializable transaction
- lock candidate compartments ด้วย `FOR UPDATE SKIP LOCKED`
- มี automated tests ยืนยันว่า:
  - duplicate confirm ไม่สร้าง reservation ซ้ำ
  - concurrent last-slot race มีเพียง request เดียวที่สำเร็จ

## 5. ทำไมเลือกวิธีนี้

- การป้องกันที่ frontend อย่างเดียวไม่พอ เพราะสอง requests อาจออกไปแล้ว
- idempotency อย่างเดียวไม่แก้ปัญหาคนละ user แข่งกันจองช่องสุดท้าย
- assessment นี้ให้ความสำคัญกับ database-backed correctness มากกว่าความสะดวกของ UI
