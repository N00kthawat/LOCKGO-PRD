-- CreateEnum
CREATE TYPE "LockerOperatingStatus" AS ENUM ('OPERATIONAL', 'OUT_OF_SERVICE');

-- CreateEnum
CREATE TYPE "LockerSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('RESERVED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Locker" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "operatingStatus" "LockerOperatingStatus" NOT NULL DEFAULT 'OPERATIONAL',
    "openTime" TEXT,
    "closeTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Locker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Compartment" (
    "id" TEXT NOT NULL,
    "lockerId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "size" "LockerSize" NOT NULL,
    "pricePerHourCents" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Compartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "reservationNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "compartmentId" TEXT NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'RESERVED',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "durationHours" INTEGER NOT NULL,
    "totalPriceCents" INTEGER NOT NULL,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Locker_operatingStatus_idx" ON "Locker"("operatingStatus");

-- CreateIndex
CREATE INDEX "Compartment_lockerId_size_isActive_idx" ON "Compartment"("lockerId", "size", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Compartment_lockerId_code_key" ON "Compartment"("lockerId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_reservationNumber_key" ON "Reservation"("reservationNumber");

-- CreateIndex
CREATE INDEX "Reservation_compartmentId_startAt_endAt_idx" ON "Reservation"("compartmentId", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "Reservation_status_startAt_endAt_idx" ON "Reservation"("status", "startAt", "endAt");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_userId_idempotencyKey_key" ON "Reservation"("userId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "Compartment" ADD CONSTRAINT "Compartment_lockerId_fkey" FOREIGN KEY ("lockerId") REFERENCES "Locker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_compartmentId_fkey" FOREIGN KEY ("compartmentId") REFERENCES "Compartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
