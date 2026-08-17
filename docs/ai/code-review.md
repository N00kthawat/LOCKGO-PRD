# AI Code Review Evidence

เอกสารนี้บันทึก 1 code area ที่ AI ช่วยงาน และ developer เข้าไป review ต่อก่อนยอมรับเป็น final code

## ส่วนที่เลือกมา Review

Reservation creation และ concurrent booking protection ใน:

- [backend/src/reservations/reservations.service.ts](/Users/nookthawat/KHOOMKHA/lockgo/backend/src/reservations/reservations.service.ts)
- [backend/test/app.e2e-spec.ts](/Users/nookthawat/KHOOMKHA/lockgo/backend/test/app.e2e-spec.ts)

# AI Code Review

ส่วนที่เลือกมา Review คือ **Reservation Creation Flow** ซึ่ง AI ช่วยสร้าง logic สำหรับตรวจสอบช่องว่าง สร้าง Reservation และป้องกันการจองซ้ำ

## 1. Correctness

จากการ Review พบว่า logic เดิมตรวจ availability ก่อนสร้าง Reservation ได้ถูกต้องในกรณีทั่วไป แต่ยังมีความเสี่ยงเมื่อมีหลาย request จองพร้อมกัน

ตัวอย่างเช่น หากเหลือช่องว่างเพียง 1 ช่อง request สองตัวอาจตรวจพบว่าช่องยังว่างพร้อมกัน และสร้าง Reservation ซ้ำได้

จึงปรับให้การเลือก Compartment และสร้าง Reservation ทำงานภายใน Database Transaction เดียวกัน พร้อมใช้ `FOR UPDATE SKIP LOCKED` เพื่อไม่ให้หลาย request เลือกช่องเดียวกันพร้อมกัน

## 2. Bug Risk

อีกกรณีคือผู้ใช้กด Confirm ซ้ำ หรือ request เดิมถูกส่งเข้ามาหลายครั้ง

จึงเพิ่ม Idempotency ที่ Backend เพื่อให้ request เดิมได้รับ Reservation ที่สร้างไว้แล้วกลับไป แทนการสร้างรายการใหม่

การป้องกันที่ Frontend เช่น disable ปุ่ม Confirm ยังสามารถใช้ได้ แต่ Backend ต้องเป็นตัวรับประกันความถูกต้องหลัก

## 3. Security / Data Integrity

Backend จะตรวจ Availability อีกครั้งตอน Confirm เสมอ ไม่ใช้ข้อมูลจาก Frontend เป็นตัวตัดสินสุดท้าย

วิธีนี้ช่วยป้องกันกรณีที่ข้อมูล Availability เปลี่ยนไปก่อนผู้ใช้กด Confirm และช่วยรักษาความถูกต้องของ Reservation

## 4. Performance

การใช้ Transaction และ Row Locking มี overhead มากกว่าวิธี `read -> insert` แบบปกติ

อย่างไรก็ตาม สำหรับ Reservation ผมเลือกให้ความสำคัญกับความถูกต้องและการป้องกัน Double Booking มากกว่า throughput สูงสุด โดยจำกัดการ Lock ให้อยู่เฉพาะช่วงที่เลือก Compartment และสร้าง Reservation

## 5. Maintainability

Concurrency logic ถูกเก็บอยู่ใน Reservation Creation Flow โดยไม่เปลี่ยน API Contract ภายนอก

นอกจากนี้เพิ่ม Integration Test สำหรับกรณี Concurrent Booking เพื่อยืนยันว่า หากเหลือช่องว่างเพียง 1 ช่อง และมีหลาย request เข้ามาพร้อมกัน จะมีเพียง 1 Reservation ที่สร้างสำเร็จ

## Final Result

หลัง Developer Review ได้ปรับเพิ่ม:

* Database Transaction
* Row-level Locking ด้วย `FOR UPDATE SKIP LOCKED`
* Backend Idempotency
* Concurrent Booking Integration Test

ผลลัพธ์คือระบบสามารถป้องกันทั้ง **Duplicate Reservation** จากการกด Confirm ซ้ำ และ **Double Booking** จากหลาย request ที่เข้ามาพร้อมกันได้
