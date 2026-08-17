# AI Prompts Used

ไฟล์นี้บันทึก intent ของ prompt หลักที่ใช้ระหว่างการพัฒนา assessment นี้

เน้นอธิบาย logic ของ prompt, กระบวนการทำงาน, การตัดสินใจของ developer และผลลัพธ์ที่เกิดขึ้น
ไม่ได้คัดลอกบทสนทนาจริงย้อนหลัง

## Prompt 1 — วิเคราะห์ repository และ requirement

### เป้าหมาย

ตั้งต้นด้วยการ review แบบมีโครงสร้างก่อนแก้โค้ด:
- อ่าน AGENTS.md
- อ่าน assessment PDFs
- inspect สถานะ repository
- inspect git status
- inspect frontend/backend/Prisma/docker configuration
- สรุปว่าอะไรทำเสร็จแล้ว และอะไรยังขาด

### Logic ที่ให้ AI ช่วย

- เก็บ source-of-truth requirements ก่อน
- inspect implementation ที่มีอยู่ก่อนเสนอแผน
- แยก current state, missing scope, risks และ next milestone ออกจากกัน

## Prompt 2 — วางแผน Git Workflow

### เป้าหมาย

กำหนด Git workflow ที่เรียบง่าย เหมาะกับ scope ของ assessment และทำให้ history review ได้

### Logic ที่ให้ AI ช่วย

- เลือก single-repository strategy
- ตั้งชื่อ branch ให้เรียบง่ายและดูเป็นงานจริง
- แยกงานเป็น milestone branches แทนการรวมทุกอย่างไว้ก้อนเดียว

### การตัดสินใจของ Developer

- ใช้ GitHub repository เดียว
- ใช้ชื่อ branch ที่ไม่ติดคำเรียกเครื่องมือ
- ใช้แนวทาง:
  - `main`
  - `backend-foundation`
  - `reservation-safety`
  - `frontend-reservation-flow`
  - `project-docs`

## Prompt 3 — จำกัด scope ของ concurrency safety

### เป้าหมาย

จำกัด scope ของ branch นี้ให้ตรงกับ requirement เรื่อง concurrent booking โดยตรง

### Logic ที่ให้ AI ช่วย

- โฟกัสเฉพาะ reservation correctness ตอนเกิดพร้อมกัน
- ไม่ดึงงาน frontend หรือ documentation ที่ไม่เกี่ยวเข้ามาปน
- เลือกวิธีป้องกันที่ระดับ database แทนการพึ่ง frontend อย่างเดียว

### การตัดสินใจของ Developer

- จำกัด scope ของ branch นี้ไว้ที่:
  - database-level concurrent booking protection
  - concurrent integration coverage
- ไม่เอางาน frontend หรือ docs ที่ไม่เกี่ยวมาปนใน branch นี้

## Prompt 4 — จำกัด scope ของเอกสารโปรเจกต์

### เป้าหมาย

จัดลำดับความสำคัญให้เอกสารที่ assessment บังคับมาก่อนงานเสริมอื่น

### Logic ที่ให้ AI ช่วย

- สร้างเฉพาะเอกสารที่ assessment ขอจริง
- ไม่เพิ่มเอกสาร optional ที่เกิน implementation ปัจจุบัน
- เขียนตามงานที่มีอยู่จริงใน repository

### การตัดสินใจของ Developer

- ให้เอกสารที่ต้องส่งมาก่อน frontend ในช่วงนั้น
- เพิ่มเฉพาะ:
  - `README.md`
  - `docs/ai/prompts.md`
  - `docs/ai/workflow.md`
  - `docs/ai/code-review.md`

## Prompt 5 — runtime debugging และการทำ demo ให้ลองได้จริง

### เป้าหมาย

ทำให้ flow ที่ implement แล้วสามารถถูก reviewer ลองใช้งานได้จริง โดยไม่เพิ่ม feature นอก scope

### Logic ที่ให้ AI ช่วย

- หาให้เจอว่าทำไม frontend requests ถึง fail ใน browser
- verify ว่า backend เปิดให้ Vite dev server เรียกได้
- ปรับ demo usability บน local ด้วย seed data ที่ใช้งานซ้ำได้
- ไม่ขยายงานไปสู่ authentication หรือ scope อื่นที่ไม่จำเป็น

### การตัดสินใจของ Developer

- เปิด backend CORS สำหรับ local frontend development
- seed demo user ID แบบคงที่เพื่อให้ทดสอบบน local ซ้ำได้
- คง `userId` ให้มองเห็นได้ใน form เพราะ authentication อยู่นอก scope
- เปลี่ยน location input เป็น dropdown ตาม sample locations ที่ seed ไว้
