require('dotenv/config');

const { PrismaPg } = require('@prisma/adapter-pg');
const {
  LockerOperatingStatus,
  LockerSize,
  PrismaClient,
  ReservationStatus,
} = require('@prisma/client');
const { Pool } = require('pg');

const adapter = new PrismaPg(
  new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
);

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.reservation.deleteMany();
  await prisma.compartment.deleteMany();
  await prisma.locker.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      email: 'demo.user@lockgo.local',
      fullName: 'Demo User',
    },
  });

  const lockers = await prisma.$transaction([
    prisma.locker.create({
      data: {
        name: 'LockGo Central Station',
        address: 'Central Station, Bangkok',
        latitude: '13.756331',
        longitude: '100.501762',
        operatingStatus: LockerOperatingStatus.OPERATIONAL,
        openTime: '06:00',
        closeTime: '23:00',
        compartments: {
          create: [
            {
              code: 'S-01',
              size: LockerSize.SMALL,
              pricePerHourCents: 3000,
            },
            {
              code: 'M-01',
              size: LockerSize.MEDIUM,
              pricePerHourCents: 4500,
            },
            {
              code: 'L-01',
              size: LockerSize.LARGE,
              pricePerHourCents: 6000,
            },
          ],
        },
      },
      include: {
        compartments: true,
      },
    }),
    prisma.locker.create({
      data: {
        name: 'LockGo Office Hub',
        address: 'Silom Office Hub, Bangkok',
        latitude: '13.728702',
        longitude: '100.534195',
        operatingStatus: LockerOperatingStatus.OPERATIONAL,
        openTime: '07:00',
        closeTime: '22:00',
        compartments: {
          create: [
            {
              code: 'S-01',
              size: LockerSize.SMALL,
              pricePerHourCents: 2500,
            },
            {
              code: 'M-01',
              size: LockerSize.MEDIUM,
              pricePerHourCents: 4000,
            },
          ],
        },
      },
      include: {
        compartments: true,
      },
    }),
  ]);

  const mediumCompartment = lockers[0].compartments.find(
    (compartment) => compartment.size === LockerSize.MEDIUM,
  );

  if (!mediumCompartment) {
    throw new Error('Expected seeded medium compartment to exist.');
  }

  await prisma.reservation.create({
    data: {
      reservationNumber: 'LK-20260817-000001',
      userId: user.id,
      compartmentId: mediumCompartment.id,
      status: ReservationStatus.RESERVED,
      startAt: new Date('2026-08-18T07:00:00.000Z'),
      endAt: new Date('2026-08-18T11:00:00.000Z'),
      durationHours: 4,
      totalPriceCents: 18000,
      idempotencyKey: 'seed-reservation-medium-01',
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
