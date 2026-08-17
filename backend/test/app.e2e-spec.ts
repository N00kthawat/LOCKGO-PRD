import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

type TestFixtures = {
  lockerOneId: string;
  lockerTwoId: string;
  reservedMediumCompartmentId: string;
  userOneId: string;
  userTwoId: string;
};

describe('LOCKGO API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let fixtures: TestFixtures;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    fixtures = await resetDatabase(prisma);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /api/lockers returns locker list with availability', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/lockers')
      .query({
        location: 'Bangkok',
        startAt: '2026-08-18T07:00:00.000Z',
        durationHours: '2',
        availability: 'true',
      })
      .expect(200);

    expect(response.body).toHaveLength(2);
    expect(response.body[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        location: expect.any(String),
        availability: expect.objectContaining({
          SMALL: expect.any(Number),
          MEDIUM: expect.any(Number),
          LARGE: expect.any(Number),
        }),
        startingPriceCents: expect.any(Number),
        operatingStatus: 'OPERATIONAL',
      }),
    );
  });

  it('GET /api/lockers/:id returns locker detail', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/lockers/${fixtures.lockerOneId}`)
      .query({
        startAt: '2026-08-18T07:00:00.000Z',
        durationHours: '2',
      })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: fixtures.lockerOneId,
        name: 'LockGo Central Station',
        address: 'Central Station, Bangkok',
        operatingStatus: 'OPERATIONAL',
        availability: expect.objectContaining({
          SMALL: 1,
          MEDIUM: 0,
          LARGE: 1,
        }),
      }),
    );
  });

  it('POST /api/reservations creates reservation successfully', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/reservations')
      .set('x-idempotency-key', 'create-success-1')
      .send({
        userId: fixtures.userOneId,
        lockerId: fixtures.lockerTwoId,
        size: 'SMALL',
        startAt: '2026-08-18T12:00:00.000Z',
        durationHours: 3,
      })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        reservationNumber: expect.stringMatching(/^LK-\d{8}-[A-Z0-9]{6}$/),
        status: 'RESERVED',
        durationHours: 3,
        totalPriceCents: 7500,
        locker: expect.objectContaining({
          id: fixtures.lockerTwoId,
          name: 'LockGo Office Hub',
        }),
        compartment: expect.objectContaining({
          size: 'SMALL',
        }),
      }),
    );

    const persistedReservation = await prisma.reservation.findUnique({
      where: {
        id: response.body.id,
      },
    });

    expect(persistedReservation).not.toBeNull();
  });

  it('POST /api/reservations rejects overlapping reservation when no compartment is available', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/reservations')
      .set('x-idempotency-key', 'conflict-medium-1')
      .send({
        userId: fixtures.userOneId,
        lockerId: fixtures.lockerOneId,
        size: 'MEDIUM',
        startAt: '2026-08-18T08:00:00.000Z',
        durationHours: 2,
      })
      .expect(409);

    expect(response.body).toEqual({
      code: 'NO_AVAILABLE_COMPARTMENT',
      message: 'No locker compartment is available for the selected time range',
    });
  });

  it('POST /api/reservations deduplicates duplicate confirmation requests', async () => {
    const payload = {
      userId: fixtures.userOneId,
      lockerId: fixtures.lockerTwoId,
      size: 'SMALL',
      startAt: '2026-08-18T13:00:00.000Z',
      durationHours: 2,
    };

    const firstResponse = await request(app.getHttpServer())
      .post('/api/reservations')
      .set('x-idempotency-key', 'duplicate-confirm-1')
      .send(payload)
      .expect(201);

    const secondResponse = await request(app.getHttpServer())
      .post('/api/reservations')
      .set('x-idempotency-key', 'duplicate-confirm-1')
      .send(payload)
      .expect(200);

    expect(secondResponse.body.id).toBe(firstResponse.body.id);
    expect(secondResponse.body.reservationNumber).toBe(
      firstResponse.body.reservationNumber,
    );

    const reservationCount = await prisma.reservation.count({
      where: {
        userId: fixtures.userOneId,
        idempotencyKey: 'duplicate-confirm-1',
      },
    });

    expect(reservationCount).toBe(1);
  });

  it('POST /api/reservations allows only one successful reservation during concurrent booking', async () => {
    const startAt = '2026-08-18T15:00:00.000Z';

    const [firstResponse, secondResponse] = await Promise.all([
      request(app.getHttpServer()).post('/api/reservations').send({
        userId: fixtures.userOneId,
        lockerId: fixtures.lockerTwoId,
        size: 'SMALL',
        startAt,
        durationHours: 2,
      }),
      request(app.getHttpServer()).post('/api/reservations').send({
        userId: fixtures.userTwoId,
        lockerId: fixtures.lockerTwoId,
        size: 'SMALL',
        startAt,
        durationHours: 2,
      }),
    ]);

    const statuses = [firstResponse.status, secondResponse.status].sort();

    expect(statuses).toEqual([201, 409]);

    const successResponse =
      firstResponse.status === 201 ? firstResponse : secondResponse;
    const conflictResponse =
      firstResponse.status === 409 ? firstResponse : secondResponse;

    expect(successResponse.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        status: 'RESERVED',
        compartment: expect.objectContaining({
          size: 'SMALL',
        }),
      }),
    );

    expect(conflictResponse.body).toEqual({
      code: 'NO_AVAILABLE_COMPARTMENT',
      message: 'No locker compartment is available for the selected time range',
    });

    const overlappingReservationCount = await prisma.reservation.count({
      where: {
        compartment: {
          lockerId: fixtures.lockerTwoId,
          size: 'SMALL',
        },
        startAt: new Date(startAt),
      },
    });

    expect(overlappingReservationCount).toBe(1);
  });

  it('GET /api/lockers/:id returns locker not found', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/lockers/locker-does-not-exist')
      .expect(404);

    expect(response.body).toEqual({
      code: 'LOCKER_NOT_FOUND',
      message: 'Locker not found',
    });
  });

  it('GET /api/reservations/:id returns reservation detail', async () => {
    const reservation = await prisma.reservation.findFirstOrThrow({
      where: {
        compartmentId: fixtures.reservedMediumCompartmentId,
      },
    });

    const response = await request(app.getHttpServer())
      .get(`/api/reservations/${reservation.id}`)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: reservation.id,
        reservationNumber: 'LK-20260817-TEST01',
        status: 'RESERVED',
        locker: expect.objectContaining({
          id: fixtures.lockerOneId,
          name: 'LockGo Central Station',
        }),
        compartment: expect.objectContaining({
          id: fixtures.reservedMediumCompartmentId,
          size: 'MEDIUM',
        }),
      }),
    );
  });
});

async function resetDatabase(prisma: PrismaService): Promise<TestFixtures> {
  await prisma.reservation.deleteMany();
  await prisma.compartment.deleteMany();
  await prisma.locker.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      email: 'api-test-user@lockgo.local',
      fullName: 'API Test User',
    },
  });

  const secondUser = await prisma.user.create({
    data: {
      email: 'api-test-user-two@lockgo.local',
      fullName: 'API Test User Two',
    },
  });

  const lockerOne = await prisma.locker.create({
    data: {
      name: 'LockGo Central Station',
      address: 'Central Station, Bangkok',
      latitude: '13.756331',
      longitude: '100.501762',
      openTime: '06:00',
      closeTime: '23:00',
      compartments: {
        create: [
          {
            code: 'S-01',
            size: 'SMALL',
            pricePerHourCents: 3000,
          },
          {
            code: 'M-01',
            size: 'MEDIUM',
            pricePerHourCents: 4500,
          },
          {
            code: 'L-01',
            size: 'LARGE',
            pricePerHourCents: 6000,
          },
        ],
      },
    },
    include: {
      compartments: true,
    },
  });

  const lockerTwo = await prisma.locker.create({
    data: {
      name: 'LockGo Office Hub',
      address: 'Silom Office Hub, Bangkok',
      latitude: '13.728702',
      longitude: '100.534195',
      openTime: '07:00',
      closeTime: '22:00',
      compartments: {
        create: [
          {
            code: 'S-01',
            size: 'SMALL',
            pricePerHourCents: 2500,
          },
          {
            code: 'M-01',
            size: 'MEDIUM',
            pricePerHourCents: 4000,
          },
        ],
      },
    },
    include: {
      compartments: true,
    },
  });

  const reservedMediumCompartment = lockerOne.compartments.find(
    (compartment) => compartment.size === 'MEDIUM',
  );

  if (!reservedMediumCompartment) {
    throw new Error('Expected seeded medium compartment to exist.');
  }

  await prisma.reservation.create({
    data: {
      reservationNumber: 'LK-20260817-TEST01',
      userId: user.id,
      compartmentId: reservedMediumCompartment.id,
      status: 'RESERVED',
      startAt: new Date('2026-08-18T07:00:00.000Z'),
      endAt: new Date('2026-08-18T11:00:00.000Z'),
      durationHours: 4,
      totalPriceCents: 18000,
      idempotencyKey: 'seed-medium-reservation',
    },
  });

  return {
    lockerOneId: lockerOne.id,
    lockerTwoId: lockerTwo.id,
    reservedMediumCompartmentId: reservedMediumCompartment.id,
    userOneId: user.id,
    userTwoId: secondUser.id,
  };
}
