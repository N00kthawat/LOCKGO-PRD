# Debugging Challenge

กรณีผู้ใช้กด `Confirm Reservation` สองครั้งเร็ว ๆ แล้วระบบสร้าง Reservation ซ้ำ

## 1. ปัญหาเกิดจากอะไรได้บ้าง

ปัญหาอาจเกิดจากหลายจุด เช่น

- Frontend ส่ง request ซ้ำก่อนที่ปุ่ม Confirm จะถูก disable
- Backend มองแต่ละ request เป็นการสร้าง Reservation ใหม่
- ระบบตรวจ availability ก่อนแล้วค่อย insert โดยไม่มี transaction หรือ locking
- ไม่มี idempotency สำหรับแยกว่า request ไหนเป็นการ Confirm เดิม

## 2. จะตรวจสอบอย่างไร

เริ่มจาก reproduce โดยกด Confirm ซ้ำ แล้วตรวจ Browser Network ว่ามี request ถูกส่งออกไปกี่ครั้ง

จากนั้นตรวจ Backend logs และข้อมูลใน Database ว่าทั้งสอง request เข้าไปสร้าง Reservation จริงหรือไม่ รวมถึงตรวจ `x-idempotency-key` ว่าถูกส่งและจัดการถูกต้องหรือไม่

สุดท้ายรัน automated test สำหรับทั้ง Duplicate Confirm และ Concurrent Booking เพื่อยืนยันปัญหา

## 3. ควรแก้ที่ Frontend หรือ Backend

ควรแก้ทั้งสองฝั่ง แต่ Backend ต้องเป็นตัวรับประกันความถูกต้องหลัก

**Frontend**
- Disable ปุ่ม Confirm ระหว่างที่ request กำลังทำงาน
- ใช้ Idempotency Key สำหรับการ Confirm

**Backend**
- Request ที่มี `(userId, idempotencyKey)` เดิมต้องไม่สร้าง Reservation ใหม่
- Re-check availability ก่อนสร้าง Reservation
- ใช้ Database Transaction และ Row Locking เพื่อป้องกัน Race Condition

## 4. วิธีป้องกันที่ใช้ในระบบ

ระบบป้องกันปัญหานี้ด้วย

- รองรับ `x-idempotency-key`
- บังคับ Unique `(userId, idempotencyKey)` ที่ Database
- สร้าง Reservation ภายใน Serializable Transaction
- Lock Compartment ด้วย `FOR UPDATE SKIP LOCKED`
- มี Automated Test สำหรับ Duplicate Confirm และ Concurrent Last-slot Booking

ผลคือการกด Confirm ซ้ำจะไม่สร้าง Reservation ใหม่ และถ้าเหลือช่องเพียง 1 ช่องแล้วมีหลาย request จองพร้อมกัน จะมีเพียง request เดียวที่สำเร็จ

## 5. ทำไมเลือกวิธีนี้

การ Disable ปุ่มที่ Frontend อย่างเดียวไม่เพียงพอ เพราะ request อาจถูกส่งออกไปแล้วหรือเกิด retry จาก network ได้

ส่วน Idempotency ช่วยป้องกัน request ซ้ำจากผู้ใช้คนเดิม แต่ไม่สามารถป้องกันผู้ใช้หลายคนที่กำลังแย่งจองช่องสุดท้ายได้

จึงใช้ทั้ง Idempotency และ Database Transaction/Locking เพื่อให้ Backend เป็นตัวรับประกันว่า Reservation จะไม่ซ้ำและไม่เกิด Double Booking