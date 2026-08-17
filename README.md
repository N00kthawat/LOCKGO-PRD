# LOCKGO Assessment

## ภาพรวมโปรเจกต์

โปรเจกต์นี้เป็น Technical Assessment สำหรับ feature `Find & Reserve Locker`

ขอบเขตที่ทำเสร็จแล้วใน repository นี้ครอบคลุม flow หลักทั้ง backend และ frontend:
- locker search API
- locker detail API
- reservation creation API
- reservation detail API
- Prisma schema และ migration
- frontend 4 หน้าสำหรับค้นหาและจอง locker
- test ของ business rules ฝั่ง reservation
- การป้องกัน concurrent booking

## สรุปสิ่งที่ส่ง

- Frontend: มี 4 screens ตามโจทย์ในแอป React เดียว
- Backend: มี required APIs ของ locker และ reservation
- Database: มี Prisma schema, migration และ seed data
- Testing: มี unit test และ e2e test สำหรับ reservation rules และ API behavior
- AI evidence: มี prompts, workflow, code review notes และ debugging notes ใน `docs/ai/`

## สถาปัตยกรรม

repository นี้จัดเป็น assessment project แบบ repo เดียว:

```text
lockgo/
├── frontend/
├── backend/
├── docs/
│   ├── assessment/
│   └── ai/
└── docker-compose.yml
```

สถานะปัจจุบันของแต่ละส่วน:
- `frontend/`: flow การจองแบบ 4 หน้า เชื่อมกับ API แล้ว
- `backend/`: implement domain ของ locker และ reservation แล้ว
- `docs/assessment/`: เก็บ PDF ที่เป็น source of truth
- `docs/ai/`: เก็บหลักฐานการใช้ AI

### ภาพรวมสถาปัตยกรรม

```mermaid
flowchart TD
    UI["Frontend (4 screens)"] --> API["NestJS API"]
    API --> RES["Reservation Service"]
    API --> LOCK["Locker Service"]
    RES --> RULES["Reservation Rules"]
    LOCK --> RULES
    RES --> PRISMA["Prisma Client"]
    LOCK --> PRISMA
    PRISMA --> DB["PostgreSQL 17 (Docker)"]
```

## เทคโนโลยี

- Frontend: React, TypeScript, Vite
- Backend: NestJS, TypeScript
- Database: PostgreSQL 17
- ORM: Prisma 7
- Package manager: pnpm
- Test: Jest, Supertest

## การติดตั้ง

### สิ่งที่ต้องมี

- Node.js 22+
- pnpm
- Docker / Docker Compose

### ติดตั้ง dependencies

```bash
cd frontend
pnpm install

cd ../backend
pnpm install
```

## การตั้งค่า

backend ใช้ `.env` ด้วย connection string นี้สำหรับ development:

```env
DATABASE_URL="postgresql://lockgo:lockgo@127.0.0.1:5433/lockgo"
```

ใช้ [backend/.env.example](/Users/nookthawat/KHOOMKHA/lockgo/backend/.env.example) เป็นต้นแบบได้

## การตั้งค่า Database

เริ่ม PostgreSQL:

```bash
docker compose up -d
```

รัน Prisma migration:

```bash
cd backend
pnpm exec prisma migrate dev
```

seed ข้อมูลสำหรับ local:

```bash
pnpm db:seed
```

## การรันระบบ

### Backend

```bash
cd backend
pnpm start:dev
```

port ปกติ:
- `3000`
- Swagger / OpenAPI:
  - `http://localhost:3000/api/docs`
  - OpenAPI JSON: `http://localhost:3000/api/docs-json`

### Frontend

```bash
cd frontend
pnpm dev
```

Vite port ปกติ:
- `5173`

## วิธีลองใช้งาน Demo

ใช้ลำดับนี้สำหรับทดสอบ flow แบบ end-to-end บนเครื่อง:

1. เปิด Docker PostgreSQL ด้วย `docker compose up -d`
2. รัน backend ด้วย `cd backend && pnpm start:dev`
3. รัน frontend ด้วย `cd frontend && pnpm dev`
4. เปิด `http://localhost:5173`
5. ที่หน้า Find Locker:
   - เลือก location จาก dropdown
   - ใช้ `Start Date = 2026-08-18`
   - ใช้ `Start Time = 12:00`
   - ใช้ `Duration = 2`
   - กด `Search`
6. เปิด locker จากรายการผลลัพธ์
7. ที่หน้า Reservation:
   - demo user เริ่มต้นคือ `demo-user-001`
   - ถ้าจะลอง idempotency key ใช้ตัวอย่าง `booking-demo-001`
   - กด `Confirm Reservation`

### ข้อมูล demo ที่ seed ไว้

- Demo user ID: `demo-user-001`
- Sample locations:
  - Bangkok
  - Chiang Mai
  - Phuket
  - Chonburi
  - Khon Kaen
  - Songkhla
  - Ayutthaya
  - Nakhon Ratchasima
  - Prachuap Khiri Khan
  - Udon Thani

## การรัน Test

### Backend unit tests

```bash
cd backend
pnpm test
```

### Backend e2e tests

```bash
cd backend
pnpm test:e2e
```

### Backend build

```bash
cd backend
pnpm build
```

## API Documentation

### `GET /api/lockers`

ใช้ค้นหา lockers โดยรองรับ filters ต่อไปนี้:
- `location`
- `latitude`
- `longitude`
- `maxDistanceMeters`
- `size`
- `minPriceCents`
- `maxPriceCents`
- `availability`
- `startAt`
- `durationHours`
- `sort`

### `GET /api/lockers/:id`

ใช้ดูรายละเอียด locker และ availability แยกตามขนาด

### `POST /api/reservations`

ใช้สร้าง reservation

Request body:

```json
{
  "userId": "string",
  "lockerId": "string",
  "size": "SMALL",
  "startAt": "2026-08-18T12:00:00.000Z",
  "durationHours": 2,
  "idempotencyKey": "optional-string"
}
```

รองรับเพิ่มเติม:
- `x-idempotency-key` header

### `GET /api/reservations/:id`

ใช้ดึงรายละเอียด reservation สำหรับหน้า confirmation

### Error Contract

```json
{
  "code": "LOCKER_NOT_FOUND",
  "message": "Locker not found"
}
```

### Swagger / OpenAPI

backend เปิดเอกสาร API แบบ interactive ผ่าน Swagger UI ที่:

- `http://localhost:3000/api/docs`

และ JSON document ที่:

- `http://localhost:3000/api/docs-json`

## Frontend Screens

- Screen 1: Find Locker
  - location search
  - filters
  - locker list
  - availability
  - price
- Screen 2: Locker Detail
  - locker information
  - location
  - available compartments
  - price
  - select button
- Screen 3: Reservation
  - selected locker
  - compartment size
  - start date และ time
  - duration
  - reservation summary
  - confirm button
- Screen 4: Confirmation
  - booking number
  - locker
  - location
  - compartment
  - start time
  - expiration time
  - booking status

## AI Tools

AI tools ที่ใช้ใน assessment นี้:
- Codex

หลักฐานที่เกี่ยวข้อง:
- [docs/ai/prompts.md](/Users/nookthawat/KHOOMKHA/lockgo/docs/ai/prompts.md)
- [docs/ai/workflow.md](/Users/nookthawat/KHOOMKHA/lockgo/docs/ai/workflow.md)
- [docs/ai/code-review.md](/Users/nookthawat/KHOOMKHA/lockgo/docs/ai/code-review.md)
- [docs/ai/debugging-challenge.md](/Users/nookthawat/KHOOMKHA/lockgo/docs/ai/debugging-challenge.md)

## การตัดสินใจด้านสถาปัตยกรรม

- ใช้ repository เดียวสำหรับ assessment นี้ แทนการแยก frontend/backend เป็นคนละ repo
- วาง correctness ของ reservation ไว้ที่ระดับ `Compartment` เพราะ conflict ของการจองเกิดที่ช่อง locker
- ใช้ Prisma กับ PostgreSQL และ Docker database เพื่อให้ setup บน local คงที่
- เพิ่ม concurrency protection ระดับ database ในขั้นตอนสร้าง reservation ด้วย transaction isolation และ row locking

## Business Rules

- ผู้ใช้จองได้เฉพาะ compartment ที่ว่างในช่วงเวลาที่ต้องการ
- compartment เดียวกันห้ามมี reservation ที่เวลาซ้อนกัน
- reservation ที่หมดอายุแล้วต้องไม่ block availability
- reservation number ต้องไม่ซ้ำกัน
- การกด confirm ซ้ำต้องไม่สร้าง reservation ซ้ำ
- การแย่งจองช่องสุดท้ายพร้อมกันต้องสำเร็จได้เพียงรายการเดียว

## Assumptions

- authentication อยู่นอก scope ปัจจุบัน จึงส่ง `userId` ตรงใน request body
- duration ของ reservation จัดการเป็นจำนวนชั่วโมงเต็มที่เป็นบวก
- API documentation ตอนนี้เขียนแบบ manual ใน README แทน Swagger

## Concurrency Strategy

- การสร้าง reservation รันใน serializable transaction
- เลือก candidate compartments ด้วย row locking แบบ `FOR UPDATE SKIP LOCKED`
- re-check availability ภายใน transaction ก่อน insert
- ถ้าแข่งกันจองช่องสุดท้าย จะมีเพียง request เดียวที่สำเร็จ และอีกฝั่งจะได้ `409 Conflict`

## Idempotency Strategy

- การสร้าง reservation รองรับ idempotency key
- ระบบเก็บ `idempotencyKey` ควบกับ `userId`
- ถ้ายิง request เดิมซ้ำด้วย key เดิม ระบบจะคืน reservation เดิมแทนการสร้าง row ใหม่

## Debugging Challenge

โจทย์จาก assessment:
- ผู้ใช้กด `Confirm Reservation` สองครั้งติดกัน
- ระบบสร้าง reservation สองรายการ

การวิเคราะห์:
- การ disable ปุ่มที่ frontend อย่างเดียวไม่พอ เพราะอาจมีสอง request หลุดออกไปแล้ว
- ถ้า backend ใช้วิธี read-then-insert แบบไม่มีตัวป้องกัน ก็ยังเสี่ยงสร้างซ้ำได้
- duplicate confirm กับ concurrent booking เป็นปัญหาที่เกี่ยวกัน แต่ไม่ใช่เรื่องเดียวกัน

วิธีที่โปรเจกต์นี้ใช้ตรวจ:
- inspect พฤติกรรม request จาก frontend
- inspect ว่าใช้ idempotency key เดิมหรือไม่
- inspect backend logs และ API responses
- verify row ใน database ว่ามีการสร้างซ้ำใน user/time window เดียวกันหรือไม่
- รัน automated tests สำหรับ duplicate confirm และ concurrent booking

วิธีแก้ที่ implement:
- frontend รองรับ `idempotencyKey` แบบ optional
- backend รับ idempotency key ได้ทั้งจาก body และ `x-idempotency-key`
- backend เก็บ unique `(userId, idempotencyKey)`
- backend re-check availability ใน serializable transaction
- backend lock candidate compartments ด้วย `FOR UPDATE SKIP LOCKED`

การป้องกันไม่ให้เกิดซ้ำ:
- การกดซ้ำของ user คนเดิมจัดการด้วย idempotency
- การแย่งจองช่องสุดท้ายพร้อมกันจัดการด้วย transaction + locking ที่ database
- มี automated tests รองรับทั้งสองกรณี

## Trade-offs

- API ปัจจุบันใช้ `userId` จาก request body แทน auth จริง เพื่อคุม scope ของ assessment
- การเขียน API documentation แบบ manual ง่ายกว่าใน scope ปัจจุบัน แต่ถ้ามีเวลาเพิ่ม Swagger จะเหมาะกว่า
- concurrency protection ปัจจุบันเน้น reservation correctness มากกว่าการ optimize throughput ของระบบจองโดยรวม

## Known Limitations

- ยังไม่มี production deployment setup
- ยังไม่มี reservation history endpoint

## Future Improvements

- เพิ่ม reservation history API
- เพิ่ม authentication ถ้ามีเวลาหลัง core assessment เสร็จ

## CI

มี GitHub Actions workflow สำหรับ verify งานหลักใน repository:
- frontend build
- backend build
- backend unit tests
- backend e2e tests
