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
const DEMO_USER_ID = 'demo-user-001';

const lockerSeeds = [
  {
    name: 'LockGo Central Station',
    address: 'Central Station, Bangkok',
    latitude: '13.756331',
    longitude: '100.501762',
    openTime: '06:00',
    closeTime: '23:00',
    compartments: [
      { code: 'S-01', size: LockerSize.SMALL, pricePerHourCents: 3000 },
      { code: 'M-01', size: LockerSize.MEDIUM, pricePerHourCents: 4500 },
      { code: 'L-01', size: LockerSize.LARGE, pricePerHourCents: 6000 },
    ],
  },
  {
    name: 'LockGo Nimman Hub',
    address: 'Nimman District, Chiang Mai',
    latitude: '18.796143',
    longitude: '98.968534',
    openTime: '07:00',
    closeTime: '22:00',
    compartments: [
      { code: 'S-01', size: LockerSize.SMALL, pricePerHourCents: 2800 },
      { code: 'M-01', size: LockerSize.MEDIUM, pricePerHourCents: 4200 },
      { code: 'L-01', size: LockerSize.LARGE, pricePerHourCents: 5800 },
    ],
  },
  {
    name: 'LockGo Old Town Point',
    address: 'Old Town, Phuket',
    latitude: '7.880448',
    longitude: '98.392293',
    openTime: '08:00',
    closeTime: '22:00',
    compartments: [
      { code: 'S-01', size: LockerSize.SMALL, pricePerHourCents: 3200 },
      { code: 'M-01', size: LockerSize.MEDIUM, pricePerHourCents: 4700 },
      { code: 'L-01', size: LockerSize.LARGE, pricePerHourCents: 6200 },
    ],
  },
  {
    name: 'LockGo Beach Transit',
    address: 'Pattaya Beach Road, Chonburi',
    latitude: '12.923556',
    longitude: '100.882455',
    openTime: '07:00',
    closeTime: '23:00',
    compartments: [
      { code: 'S-01', size: LockerSize.SMALL, pricePerHourCents: 2900 },
      { code: 'M-01', size: LockerSize.MEDIUM, pricePerHourCents: 4300 },
      { code: 'L-01', size: LockerSize.LARGE, pricePerHourCents: 5900 },
    ],
  },
  {
    name: 'LockGo City Plaza',
    address: 'Mueang Khon Kaen, Khon Kaen',
    latitude: '16.432193',
    longitude: '102.823621',
    openTime: '08:00',
    closeTime: '21:00',
    compartments: [
      { code: 'S-01', size: LockerSize.SMALL, pricePerHourCents: 2500 },
      { code: 'M-01', size: LockerSize.MEDIUM, pricePerHourCents: 3900 },
      { code: 'L-01', size: LockerSize.LARGE, pricePerHourCents: 5500 },
    ],
  },
  {
    name: 'LockGo Junction Mall',
    address: 'Hat Yai Downtown, Songkhla',
    latitude: '7.008647',
    longitude: '100.474687',
    openTime: '08:00',
    closeTime: '22:00',
    compartments: [
      { code: 'S-01', size: LockerSize.SMALL, pricePerHourCents: 2600 },
      { code: 'M-01', size: LockerSize.MEDIUM, pricePerHourCents: 4000 },
      { code: 'L-01', size: LockerSize.LARGE, pricePerHourCents: 5600 },
    ],
  },
  {
    name: 'LockGo Heritage Stop',
    address: 'Ayutthaya Riverside, Ayutthaya',
    latitude: '14.353212',
    longitude: '100.568959',
    openTime: '08:00',
    closeTime: '21:00',
    compartments: [
      { code: 'S-01', size: LockerSize.SMALL, pricePerHourCents: 2400 },
      { code: 'M-01', size: LockerSize.MEDIUM, pricePerHourCents: 3800 },
      { code: 'L-01', size: LockerSize.LARGE, pricePerHourCents: 5400 },
    ],
  },
  {
    name: 'LockGo Korat Gateway',
    address: 'Terminal District, Nakhon Ratchasima',
    latitude: '14.979900',
    longitude: '102.097769',
    openTime: '07:00',
    closeTime: '22:00',
    compartments: [
      { code: 'S-01', size: LockerSize.SMALL, pricePerHourCents: 2550 },
      { code: 'M-01', size: LockerSize.MEDIUM, pricePerHourCents: 3950 },
      { code: 'L-01', size: LockerSize.LARGE, pricePerHourCents: 5550 },
    ],
  },
  {
    name: 'LockGo Seaside Market',
    address: 'Hua Hin Market Village, Prachuap Khiri Khan',
    latitude: '12.568375',
    longitude: '99.957688',
    openTime: '08:00',
    closeTime: '22:00',
    compartments: [
      { code: 'S-01', size: LockerSize.SMALL, pricePerHourCents: 2750 },
      { code: 'M-01', size: LockerSize.MEDIUM, pricePerHourCents: 4150 },
      { code: 'L-01', size: LockerSize.LARGE, pricePerHourCents: 5750 },
    ],
  },
  {
    name: 'LockGo Airport Link',
    address: 'Central Udon, Udon Thani',
    latitude: '17.413841',
    longitude: '102.787232',
    openTime: '07:00',
    closeTime: '22:00',
    compartments: [
      { code: 'S-01', size: LockerSize.SMALL, pricePerHourCents: 2450 },
      { code: 'M-01', size: LockerSize.MEDIUM, pricePerHourCents: 3850 },
      { code: 'L-01', size: LockerSize.LARGE, pricePerHourCents: 5450 },
    ],
  },
];

async function main() {
  await prisma.reservation.deleteMany();
  await prisma.compartment.deleteMany();
  await prisma.locker.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      id: DEMO_USER_ID,
      email: 'demo.user@lockgo.local',
      fullName: 'Demo User',
    },
  });

  const lockers = await prisma.$transaction(
    lockerSeeds.map((locker) =>
      prisma.locker.create({
        data: {
          name: locker.name,
          address: locker.address,
          latitude: locker.latitude,
          longitude: locker.longitude,
          operatingStatus: LockerOperatingStatus.OPERATIONAL,
          openTime: locker.openTime,
          closeTime: locker.closeTime,
          compartments: {
            create: locker.compartments,
          },
        },
        include: {
          compartments: true,
        },
      }),
    ),
  );

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
