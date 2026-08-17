import { LockerOperatingStatus, LockerSize } from '@prisma/client';

export type LockerSortOption = 'nearest' | 'lowest_price' | 'most_available';

export type SearchLockersQuery = {
  availability?: boolean;
  durationHours?: number;
  latitude?: number;
  location?: string;
  longitude?: number;
  maxDistanceMeters?: number;
  maxPriceCents?: number;
  minPriceCents?: number;
  size?: LockerSize;
  sort?: LockerSortOption;
  startAt?: Date;
};

export type LockerListItemResponse = {
  id: string;
  name: string;
  location: string;
  distanceMeters: number | null;
  availability: Record<LockerSize, number>;
  startingPriceCents: number | null;
  operatingStatus: LockerOperatingStatus;
};

export type LockerDetailResponse = {
  id: string;
  name: string;
  address: string;
  distanceMeters: number | null;
  operatingHours: {
    openTime: string | null;
    closeTime: string | null;
  };
  operatingStatus: LockerOperatingStatus;
  availability: Record<LockerSize, number>;
  priceBySizeCents: Partial<Record<LockerSize, number>>;
  availableTime: {
    startAt: string | null;
    endAt: string | null;
    durationHours: number | null;
  };
};
