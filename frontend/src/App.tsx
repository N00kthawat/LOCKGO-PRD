import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Screen = 'find' | 'detail' | 'reservation' | 'confirmation'
type Locale = 'en' | 'th'
type LockerSize = 'SMALL' | 'MEDIUM' | 'LARGE'
type ReservationStatus =
  | 'RESERVED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'

type LockerListItem = {
  id: string
  name: string
  location: string
  distanceMeters: number | null
  availability: Record<LockerSize, number>
  startingPriceCents: number | null
  operatingStatus: string
}

type LockerDetail = {
  id: string
  name: string
  address: string
  distanceMeters: number | null
  operatingHours: {
    openTime: string | null
    closeTime: string | null
  }
  operatingStatus: string
  availability: Record<LockerSize, number>
  priceBySizeCents: Partial<Record<LockerSize, number>>
  availableTime: {
    startAt: string | null
    endAt: string | null
    durationHours: number | null
  }
}

type ReservationDetail = {
  id: string
  reservationNumber: string
  locker: {
    id: string
    name: string
    address: string
  }
  compartment: {
    id: string
    code: string
    size: LockerSize
  }
  startAt: string
  endAt: string
  durationHours: number
  pricePerHourCents: number
  totalPriceCents: number
  status: ReservationStatus
}

type ApiError = {
  code: string
  message: string
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:3000'
const DEMO_USER_ID = 'demo-user-001'
const THAILAND_TIME_ZONE = 'Asia/Bangkok'
const THAILAND_UTC_OFFSET = '+07:00'

const SIZE_OPTIONS: LockerSize[] = ['SMALL', 'MEDIUM', 'LARGE']
const LOCATION_OPTIONS = [
  'Bangkok',
  'Chiang Mai',
  'Phuket',
  'Chonburi',
  'Khon Kaen',
  'Songkhla',
  'Ayutthaya',
  'Nakhon Ratchasima',
  'Prachuap Khiri Khan',
  'Udon Thani',
]

const LOCATION_LABELS: Record<string, { en: string; th: string }> = {
  Bangkok: { en: 'Bangkok', th: 'กรุงเทพฯ' },
  'Chiang Mai': { en: 'Chiang Mai', th: 'เชียงใหม่' },
  Phuket: { en: 'Phuket', th: 'ภูเก็ต' },
  Chonburi: { en: 'Chonburi', th: 'ชลบุรี' },
  'Khon Kaen': { en: 'Khon Kaen', th: 'ขอนแก่น' },
  Songkhla: { en: 'Songkhla', th: 'สงขลา' },
  Ayutthaya: { en: 'Ayutthaya', th: 'อยุธยา' },
  'Nakhon Ratchasima': { en: 'Nakhon Ratchasima', th: 'นครราชสีมา' },
  'Prachuap Khiri Khan': { en: 'Prachuap Khiri Khan', th: 'ประจวบคีรีขันธ์' },
  'Udon Thani': { en: 'Udon Thani', th: 'อุดรธานี' },
}

const UI_COPY = {
  en: {
    title: 'Find & Reserve Locker',
    subtitle: 'Simple 4-screen flow for locker search, selection, reservation, and confirmation.',
    timeZoneNote: 'All times shown in Thailand time (ICT)',
    screens: {
      find: 'Find Locker',
      detail: 'Locker Detail',
      reservation: 'Reservation',
      confirmation: 'Confirmation',
    },
    actions: {
      refresh: 'Refresh',
      loading: 'Loading...',
      search: 'Search',
      viewDetail: 'View Detail',
      back: 'Back',
      selectLocker: 'Select Locker',
      submitting: 'Submitting...',
      confirmReservation: 'Confirm Reservation',
      newSearch: 'New Search',
    },
    find: {
      heading: 'Find Locker',
      description: 'Search by location and basic filters.',
      allLocations: 'All Locations',
      allSizes: 'All Sizes',
      onlyAvailable: 'Only show available lockers',
      noLockers: 'No lockers found',
      noLockersHint: 'Try a different location or relax the filters.',
      sortMostAvailable: 'Most Available',
      sortLowestPrice: 'Lowest Price',
      sortNearest: 'Nearest',
    },
    detail: {
      heading: 'Locker Detail',
      loading: 'Loading locker detail...',
      sizesHeading: 'Sizes & Availability',
      availableSuffix: 'available',
      notSpecified: 'Not specified',
    },
    reservation: {
      heading: 'Reservation',
      description: 'Fill the required fields and review the summary.',
      userIdHelper: `Demo default: ${DEMO_USER_ID}`,
      userIdPlaceholder: 'Required by the current backend contract',
      idempotencyPlaceholder: 'Optional, e.g. booking-demo-001',
      summaryHeading: 'Reservation Summary',
      incomplete: 'Incomplete',
      unavailable: 'Unavailable',
    },
    confirmation: {
      heading: 'Confirmation',
      description: 'Reservation created successfully.',
    },
    labels: {
      language: 'Language',
      location: 'Location',
      lockerSize: 'Locker Size',
      maxDistance: 'Max Distance (m)',
      maxPrice: 'Max Price (cents)',
      startDate: 'Start Date',
      startTime: 'Start Time',
      durationHours: 'Duration (hours)',
      sort: 'Sort',
      distance: 'Distance',
      startingPrice: 'Starting Price',
      small: 'Small',
      medium: 'Medium',
      large: 'Large',
      status: 'Status',
      operatingHours: 'Operating Hours',
      availableTime: 'Available Time',
      userId: 'User ID',
      idempotencyKey: 'Idempotency Key',
      locker: 'Locker',
      compartmentSize: 'Compartment Size',
      endTime: 'End Time',
      duration: 'Duration',
      pricePerHour: 'Price / hour',
      totalPrice: 'Total Price',
      bookingNumber: 'Booking Number',
      compartment: 'Compartment',
      expirationEndTime: 'Expiration / End Time',
      bookingStatus: 'Booking Status',
    },
  },
  th: {
    title: 'ค้นหาและจองล็อกเกอร์',
    subtitle: 'โฟลว์ 4 หน้าสำหรับค้นหา เลือก จอง และดูการยืนยันรายการ',
    timeZoneNote: 'เวลาทั้งหมดแสดงเป็นเวลาไทย',
    screens: {
      find: 'ค้นหาล็อกเกอร์',
      detail: 'รายละเอียดล็อกเกอร์',
      reservation: 'จองล็อกเกอร์',
      confirmation: 'ยืนยันการจอง',
    },
    actions: {
      refresh: 'รีเฟรช',
      loading: 'กำลังโหลด...',
      search: 'ค้นหา',
      viewDetail: 'ดูรายละเอียด',
      back: 'ย้อนกลับ',
      selectLocker: 'เลือกล็อกเกอร์นี้',
      submitting: 'กำลังส่ง...',
      confirmReservation: 'ยืนยันการจอง',
      newSearch: 'ค้นหาใหม่',
    },
    find: {
      heading: 'ค้นหาล็อกเกอร์',
      description: 'ค้นหาจากสถานที่และตัวกรองพื้นฐาน',
      allLocations: 'ทุกสถานที่',
      allSizes: 'ทุกขนาด',
      onlyAvailable: 'แสดงเฉพาะล็อกเกอร์ที่ยังว่าง',
      noLockers: 'ไม่พบล็อกเกอร์',
      noLockersHint: 'ลองเปลี่ยนสถานที่หรือผ่อนเงื่อนไขการค้นหา',
      sortMostAvailable: 'ว่างมากที่สุด',
      sortLowestPrice: 'ราคาต่ำสุด',
      sortNearest: 'ใกล้ที่สุด',
    },
    detail: {
      heading: 'รายละเอียดล็อกเกอร์',
      loading: 'กำลังโหลดรายละเอียดล็อกเกอร์...',
      sizesHeading: 'ขนาดและจำนวนช่องว่าง',
      availableSuffix: 'ช่องว่าง',
      notSpecified: 'ไม่ระบุ',
    },
    reservation: {
      heading: 'จองล็อกเกอร์',
      description: 'กรอกข้อมูลที่จำเป็นและตรวจสอบสรุปรายการก่อนยืนยัน',
      userIdHelper: `ค่าเริ่มต้นสำหรับเดโม: ${DEMO_USER_ID}`,
      userIdPlaceholder: 'backend ปัจจุบันยังต้องรับค่า userId',
      idempotencyPlaceholder: 'ไม่บังคับ เช่น booking-demo-001',
      summaryHeading: 'สรุปรายการจอง',
      incomplete: 'ข้อมูลยังไม่ครบ',
      unavailable: 'ไม่มีข้อมูล',
    },
    confirmation: {
      heading: 'ยืนยันการจอง',
      description: 'สร้างรายการจองสำเร็จแล้ว',
    },
    labels: {
      language: 'ภาษา',
      location: 'สถานที่',
      lockerSize: 'ขนาดล็อกเกอร์',
      maxDistance: 'ระยะทางสูงสุด (ม.)',
      maxPrice: 'ราคาสูงสุด (เซ็นต์)',
      startDate: 'วันที่เริ่มใช้',
      startTime: 'เวลาเริ่มใช้',
      durationHours: 'ระยะเวลา (ชั่วโมง)',
      sort: 'เรียงลำดับ',
      distance: 'ระยะทาง',
      startingPrice: 'ราคาเริ่มต้น',
      small: 'เล็ก',
      medium: 'กลาง',
      large: 'ใหญ่',
      status: 'สถานะ',
      operatingHours: 'เวลาเปิดให้บริการ',
      availableTime: 'ช่วงเวลาที่ว่าง',
      userId: 'รหัสผู้ใช้',
      idempotencyKey: 'รหัสกันกดซ้ำ',
      locker: 'ล็อกเกอร์',
      compartmentSize: 'ขนาดช่องฝาก',
      endTime: 'เวลาสิ้นสุด',
      duration: 'ระยะเวลา',
      pricePerHour: 'ราคาต่อชั่วโมง',
      totalPrice: 'ราคารวม',
      bookingNumber: 'เลขที่การจอง',
      compartment: 'ช่องฝาก',
      expirationEndTime: 'เวลาหมดอายุ / เวลาสิ้นสุด',
      bookingStatus: 'สถานะการจอง',
    },
  },
} as const

function App() {
  const [locale, setLocale] = useState<Locale>('en')
  const [screen, setScreen] = useState<Screen>('find')
  const [lockers, setLockers] = useState<LockerListItem[]>([])
  const [selectedLocker, setSelectedLocker] = useState<LockerDetail | null>(null)
  const [reservation, setReservation] = useState<ReservationDetail | null>(null)
  const [listLoading, setListLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [reservationLoading, setReservationLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [reservationError, setReservationError] = useState<string | null>(null)
  const [searchForm, setSearchForm] = useState({
    location: 'Bangkok',
    size: '',
    maxDistanceMeters: '',
    maxPriceCents: '',
    availability: true,
    sort: 'most_available',
    startDate: '2026-08-18',
    startTime: '12:00',
    durationHours: '2',
  })
  const [reservationForm, setReservationForm] = useState({
    userId: DEMO_USER_ID,
    size: 'SMALL' as LockerSize,
    startDate: '2026-08-18',
    startTime: '12:00',
    durationHours: '2',
    idempotencyKey: '',
  })
  const copy = UI_COPY[locale]

  const searchStartAt = useMemo(
    () => toIsoDateTime(searchForm.startDate, searchForm.startTime),
    [searchForm.startDate, searchForm.startTime],
  )

  const reservationStartAt = useMemo(
    () => toIsoDateTime(reservationForm.startDate, reservationForm.startTime),
    [reservationForm.startDate, reservationForm.startTime],
  )

  const reservationSummary = useMemo(() => {
    if (!selectedLocker) {
      return null
    }

    const durationHours = Number(reservationForm.durationHours)
    if (!Number.isInteger(durationHours) || durationHours <= 0) {
      return null
    }

    const pricePerHourCents = selectedLocker.priceBySizeCents[reservationForm.size]
    if (pricePerHourCents === undefined) {
      return null
    }

    const endAt = new Date(
      new Date(reservationStartAt).getTime() + durationHours * 60 * 60 * 1000,
    )

    return {
      durationHours,
      endAt: endAt.toISOString(),
      pricePerHourCents,
      totalPriceCents: durationHours * pricePerHourCents,
    }
  }, [reservationForm.durationHours, reservationForm.size, reservationStartAt, selectedLocker])

  useEffect(() => {
    void loadLockers()
    // Initial fetch only. Search is refreshed explicitly by the user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadLockers() {
    setListLoading(true)
    setListError(null)

    try {
      const query = new URLSearchParams()
      if (searchForm.location.trim()) query.set('location', searchForm.location.trim())
      if (searchForm.size) query.set('size', searchForm.size)
      if (searchForm.maxDistanceMeters.trim()) {
        query.set('maxDistanceMeters', searchForm.maxDistanceMeters.trim())
      }
      if (searchForm.maxPriceCents.trim()) {
        query.set('maxPriceCents', searchForm.maxPriceCents.trim())
      }
      query.set('availability', String(searchForm.availability))
      query.set('sort', searchForm.sort)
      query.set('startAt', searchStartAt)
      query.set('durationHours', searchForm.durationHours)

      const response = await fetch(`${API_BASE_URL}/api/lockers?${query.toString()}`)
      const data = (await response.json()) as unknown
      if (!response.ok) throw toApiError(data)
      setLockers(data as LockerListItem[])
      setScreen('find')
    } catch (error) {
      setListError(getErrorMessage(error))
    } finally {
      setListLoading(false)
    }
  }

  async function openLocker(lockerId: string) {
    setDetailLoading(true)
    setDetailError(null)

    try {
      const query = new URLSearchParams({
        startAt: searchStartAt,
        durationHours: searchForm.durationHours,
      })
      const response = await fetch(
        `${API_BASE_URL}/api/lockers/${lockerId}?${query.toString()}`,
      )
      const data = (await response.json()) as unknown
      if (!response.ok) throw toApiError(data)

      const detail = data as LockerDetail
      setSelectedLocker(detail)
      setReservationForm((current) => ({
        ...current,
        size: chooseDefaultSize(detail),
        startDate: searchForm.startDate,
        startTime: searchForm.startTime,
        durationHours: searchForm.durationHours,
      }))
      setScreen('detail')
    } catch (error) {
      setDetailError(getErrorMessage(error))
    } finally {
      setDetailLoading(false)
    }
  }

  async function handleReservationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedLocker) return

    setReservationLoading(true)
    setReservationError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(reservationForm.idempotencyKey.trim()
            ? { 'x-idempotency-key': reservationForm.idempotencyKey.trim() }
            : {}),
        },
        body: JSON.stringify({
          userId: reservationForm.userId.trim(),
          lockerId: selectedLocker.id,
          size: reservationForm.size,
          startAt: reservationStartAt,
          durationHours: Number(reservationForm.durationHours),
          ...(reservationForm.idempotencyKey.trim()
            ? { idempotencyKey: reservationForm.idempotencyKey.trim() }
            : {}),
        }),
      })

      const data = (await response.json()) as unknown
      if (!response.ok) throw toApiError(data)

      const createdReservation = data as ReservationDetail
      const detailResponse = await fetch(
        `${API_BASE_URL}/api/reservations/${createdReservation.id}`,
      )
      const detailData = (await detailResponse.json()) as unknown
      if (!detailResponse.ok) throw toApiError(detailData)

      setReservation(detailData as ReservationDetail)
      setScreen('confirmation')
    } catch (error) {
      setReservationError(getErrorMessage(error))
    } finally {
      setReservationLoading(false)
    }
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="toolbar">
          <div>
            <p className="eyebrow">LOCKGO</p>
            <h1>{copy.title}</h1>
            <p className="subtle">{copy.subtitle}</p>
            <p className="helper-text">{copy.timeZoneNote}</p>
          </div>
          <div className="language-switch" aria-label={copy.labels.language}>
            <button
              className={`lang-chip ${locale === 'en' ? 'active' : ''}`}
              type="button"
              onClick={() => setLocale('en')}
            >
              EN
            </button>
            <button
              className={`lang-chip ${locale === 'th' ? 'active' : ''}`}
              type="button"
              onClick={() => setLocale('th')}
            >
              TH
            </button>
          </div>
        </div>
        <div className="status-strip">
          <span className={screen === 'find' ? 'active' : ''}>{copy.screens.find}</span>
          <span className={screen === 'detail' ? 'active' : ''}>{copy.screens.detail}</span>
          <span className={screen === 'reservation' ? 'active' : ''}>
            {copy.screens.reservation}
          </span>
          <span className={screen === 'confirmation' ? 'active' : ''}>
            {copy.screens.confirmation}
          </span>
        </div>
      </header>

      <section className="surface">
        {screen === 'find' && (
          <div className="stack gap-large">
            <div className="toolbar">
              <div>
                <h2>{copy.find.heading}</h2>
                <p className="subtle">{copy.find.description}</p>
              </div>
              <button
                className="button button-secondary"
                type="button"
                onClick={() => void loadLockers()}
                disabled={listLoading}
              >
                {listLoading ? copy.actions.loading : copy.actions.refresh}
              </button>
            </div>

            <form
              className="panel form-grid"
              onSubmit={(event) => {
                event.preventDefault()
                void loadLockers()
              }}
            >
              <label>
                <span>{copy.labels.location}</span>
                <select
                  value={searchForm.location}
                  onChange={(event) =>
                    setSearchForm((current) => ({
                      ...current,
                      location: event.target.value,
                    }))
                  }
                >
                  <option value="">{copy.find.allLocations}</option>
                  {LOCATION_OPTIONS.map((location) => (
                    <option key={location} value={location}>
                      {translateLocation(location, locale)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>{copy.labels.lockerSize}</span>
                <select
                  value={searchForm.size}
                  onChange={(event) =>
                    setSearchForm((current) => ({
                      ...current,
                      size: event.target.value,
                    }))
                  }
                >
                  <option value="">{copy.find.allSizes}</option>
                  {SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {labelForSize(size, locale)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>{copy.labels.maxDistance}</span>
                <input
                  value={searchForm.maxDistanceMeters}
                  onChange={(event) =>
                    setSearchForm((current) => ({
                      ...current,
                      maxDistanceMeters: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>{copy.labels.maxPrice}</span>
                <input
                  value={searchForm.maxPriceCents}
                  onChange={(event) =>
                    setSearchForm((current) => ({
                      ...current,
                      maxPriceCents: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>{copy.labels.startDate}</span>
                <input
                  type="date"
                  value={searchForm.startDate}
                  onChange={(event) =>
                    setSearchForm((current) => ({
                      ...current,
                      startDate: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>{copy.labels.startTime}</span>
                <input
                  type="time"
                  value={searchForm.startTime}
                  onChange={(event) =>
                    setSearchForm((current) => ({
                      ...current,
                      startTime: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>{copy.labels.durationHours}</span>
                <input
                  type="number"
                  min="1"
                  value={searchForm.durationHours}
                  onChange={(event) =>
                    setSearchForm((current) => ({
                      ...current,
                      durationHours: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>{copy.labels.sort}</span>
                <select
                  value={searchForm.sort}
                  onChange={(event) =>
                    setSearchForm((current) => ({
                      ...current,
                      sort: event.target.value,
                    }))
                  }
                >
                  <option value="most_available">{copy.find.sortMostAvailable}</option>
                  <option value="lowest_price">{copy.find.sortLowestPrice}</option>
                  <option value="nearest">{copy.find.sortNearest}</option>
                </select>
              </label>

              <label className="toggle">
                <input
                  type="checkbox"
                  checked={searchForm.availability}
                  onChange={(event) =>
                    setSearchForm((current) => ({
                      ...current,
                      availability: event.target.checked,
                    }))
                  }
                />
                <span>{copy.find.onlyAvailable}</span>
              </label>

              <div className="form-actions">
                <button className="button" type="submit" disabled={listLoading}>
                  {copy.actions.search}
                </button>
              </div>
            </form>

            {listError && <p className="error-text">{listError}</p>}

            <div className="list-grid">
              {lockers.length === 0 && !listLoading ? (
                <div className="panel empty-state">
                  <h3>{copy.find.noLockers}</h3>
                  <p className="subtle">{copy.find.noLockersHint}</p>
                </div>
              ) : (
                lockers.map((locker) => (
                  <article className="panel locker-card" key={locker.id}>
                    <div className="stack gap-small">
                      <div className="toolbar compact">
                        <div>
                          <h3>{locker.name}</h3>
                          <p className="subtle">{translateLocation(locker.location, locale)}</p>
                        </div>
                        <span className="badge">
                          {translateOperatingStatus(locker.operatingStatus, locale)}
                        </span>
                      </div>
                      <div className="meta-grid">
                        <MetaItem
                          label={copy.labels.distance}
                          value={formatDistance(locker.distanceMeters, locale)}
                        />
                        <MetaItem
                          label={copy.labels.startingPrice}
                          value={formatPrice(locker.startingPriceCents, locale)}
                        />
                        <MetaItem
                          label={copy.labels.small}
                          value={String(locker.availability.SMALL)}
                        />
                        <MetaItem
                          label={copy.labels.medium}
                          value={String(locker.availability.MEDIUM)}
                        />
                        <MetaItem
                          label={copy.labels.large}
                          value={String(locker.availability.LARGE)}
                        />
                      </div>
                    </div>
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() => void openLocker(locker.id)}
                    >
                      {copy.actions.viewDetail}
                    </button>
                  </article>
                ))
              )}
            </div>
          </div>
        )}

        {screen === 'detail' && selectedLocker && (
          <div className="stack gap-large">
            <div className="toolbar">
              <div>
                <h2>{copy.detail.heading}</h2>
                <p className="subtle">{selectedLocker.address}</p>
              </div>
              <button
                className="button button-secondary"
                type="button"
                onClick={() => setScreen('find')}
              >
                {copy.actions.back}
              </button>
            </div>

            {detailLoading && <p className="subtle">{copy.detail.loading}</p>}
            {detailError && <p className="error-text">{detailError}</p>}

            <div className="detail-layout">
              <section className="panel">
                <h3>{selectedLocker.name}</h3>
                <div className="meta-grid">
                  <MetaItem
                    label={copy.labels.status}
                    value={translateOperatingStatus(selectedLocker.operatingStatus, locale)}
                  />
                  <MetaItem
                    label={copy.labels.distance}
                    value={formatDistance(selectedLocker.distanceMeters, locale)}
                  />
                  <MetaItem
                    label={copy.labels.operatingHours}
                    value={`${selectedLocker.operatingHours.openTime ?? '-'} - ${
                      selectedLocker.operatingHours.closeTime ?? '-'
                    }`}
                  />
                  <MetaItem
                    label={copy.labels.availableTime}
                    value={
                      selectedLocker.availableTime.startAt &&
                      selectedLocker.availableTime.endAt
                        ? `${formatDateTime(selectedLocker.availableTime.startAt, locale)} - ${formatDateTime(
                            selectedLocker.availableTime.endAt,
                            locale,
                          )}`
                        : copy.detail.notSpecified
                    }
                  />
                </div>
              </section>

              <section className="panel">
                <h3>{copy.detail.sizesHeading}</h3>
                <div className="size-list">
                  {SIZE_OPTIONS.map((size) => (
                    <div className="size-row" key={size}>
                      <span>{labelForSize(size, locale)}</span>
                      <span>
                        {selectedLocker.availability[size]} {copy.detail.availableSuffix}
                      </span>
                      <span>{formatPrice(selectedLocker.priceBySizeCents[size] ?? null, locale)}</span>
                    </div>
                  ))}
                </div>
                <div className="panel-actions">
                  <button
                    className="button"
                    type="button"
                    onClick={() => setScreen('reservation')}
                  >
                    {copy.actions.selectLocker}
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}

        {screen === 'reservation' && selectedLocker && (
          <div className="stack gap-large">
            <div className="toolbar">
              <div>
                <h2>{copy.reservation.heading}</h2>
                <p className="subtle">{copy.reservation.description}</p>
              </div>
              <button
                className="button button-secondary"
                type="button"
                onClick={() => setScreen('detail')}
              >
                {copy.actions.back}
              </button>
            </div>

            <div className="detail-layout">
              <form className="panel stack gap-medium" onSubmit={handleReservationSubmit}>
                <label>
                  <span>{copy.labels.userId}</span>
                  <input
                    placeholder={copy.reservation.userIdPlaceholder}
                    value={reservationForm.userId}
                    onChange={(event) =>
                      setReservationForm((current) => ({
                        ...current,
                        userId: event.target.value,
                      }))
                    }
                  />
                  <small className="helper-text">{copy.reservation.userIdHelper}</small>
                </label>

                <label>
                  <span>{copy.labels.lockerSize}</span>
                  <select
                    value={reservationForm.size}
                    onChange={(event) =>
                      setReservationForm((current) => ({
                        ...current,
                        size: event.target.value as LockerSize,
                      }))
                    }
                  >
                    {SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {labelForSize(size, locale)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>{copy.labels.startDate}</span>
                  <input
                    type="date"
                    value={reservationForm.startDate}
                    onChange={(event) =>
                      setReservationForm((current) => ({
                        ...current,
                        startDate: event.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  <span>{copy.labels.startTime}</span>
                  <input
                    type="time"
                    value={reservationForm.startTime}
                    onChange={(event) =>
                      setReservationForm((current) => ({
                        ...current,
                        startTime: event.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  <span>{copy.labels.durationHours}</span>
                  <input
                    type="number"
                    min="1"
                    value={reservationForm.durationHours}
                    onChange={(event) =>
                      setReservationForm((current) => ({
                        ...current,
                        durationHours: event.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  <span>{copy.labels.idempotencyKey}</span>
                  <input
                    placeholder={copy.reservation.idempotencyPlaceholder}
                    value={reservationForm.idempotencyKey}
                    onChange={(event) =>
                      setReservationForm((current) => ({
                        ...current,
                        idempotencyKey: event.target.value,
                      }))
                    }
                  />
                </label>

                {reservationError && <p className="error-text">{reservationError}</p>}

                <div className="panel-actions">
                  <button className="button" type="submit" disabled={reservationLoading}>
                    {reservationLoading
                      ? copy.actions.submitting
                      : copy.actions.confirmReservation}
                  </button>
                </div>
              </form>

              <section className="panel stack gap-medium">
                <h3>{copy.reservation.summaryHeading}</h3>
                <SummaryRow label={copy.labels.locker} value={selectedLocker.name} />
                <SummaryRow label={copy.labels.location} value={selectedLocker.address} />
                <SummaryRow
                  label={copy.labels.compartmentSize}
                  value={labelForSize(reservationForm.size, locale)}
                />
                <SummaryRow
                  label={copy.labels.startTime}
                  value={formatDateTime(reservationStartAt, locale)}
                />
                <SummaryRow
                  label={copy.labels.endTime}
                  value={
                    reservationSummary
                      ? formatDateTime(reservationSummary.endAt, locale)
                      : copy.reservation.incomplete
                  }
                />
                <SummaryRow
                  label={copy.labels.duration}
                  value={
                    reservationSummary
                      ? formatDurationHours(reservationSummary.durationHours, locale)
                      : copy.reservation.incomplete
                  }
                />
                <SummaryRow
                  label={copy.labels.pricePerHour}
                  value={
                    reservationSummary
                      ? formatPrice(reservationSummary.pricePerHourCents, locale)
                      : copy.reservation.unavailable
                  }
                />
                <SummaryRow
                  label={copy.labels.totalPrice}
                  value={
                    reservationSummary
                      ? formatPrice(reservationSummary.totalPriceCents, locale)
                      : copy.reservation.unavailable
                  }
                />
              </section>
            </div>
          </div>
        )}

        {screen === 'confirmation' && reservation && (
          <div className="stack gap-large">
            <div className="toolbar">
              <div>
                <h2>{copy.confirmation.heading}</h2>
                <p className="subtle">{copy.confirmation.description}</p>
              </div>
              <button
                className="button button-secondary"
                type="button"
                onClick={() => setScreen('find')}
              >
                {copy.actions.newSearch}
              </button>
            </div>

            <section className="panel stack gap-medium">
              <SummaryRow label={copy.labels.bookingNumber} value={reservation.reservationNumber} />
              <SummaryRow label={copy.labels.locker} value={reservation.locker.name} />
              <SummaryRow label={copy.labels.location} value={reservation.locker.address} />
              <SummaryRow
                label={copy.labels.compartment}
                value={`${labelForSize(reservation.compartment.size, locale)} (${reservation.compartment.code})`}
              />
              <SummaryRow
                label={copy.labels.startTime}
                value={formatDateTime(reservation.startAt, locale)}
              />
              <SummaryRow
                label={copy.labels.expirationEndTime}
                value={formatDateTime(reservation.endAt, locale)}
              />
              <SummaryRow
                label={copy.labels.pricePerHour}
                value={formatPrice(reservation.pricePerHourCents, locale)}
              />
              <SummaryRow
                label={copy.labels.totalPrice}
                value={formatPrice(reservation.totalPriceCents, locale)}
              />
              <SummaryRow
                label={copy.labels.bookingStatus}
                value={translateReservationStatus(reservation.status, locale)}
              />
            </section>
          </div>
        )}
      </section>
    </main>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="meta-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="summary-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function labelForSize(size: LockerSize, locale: Locale): string {
  const labels =
    locale === 'th'
      ? { SMALL: 'เล็ก', MEDIUM: 'กลาง', LARGE: 'ใหญ่' }
      : { SMALL: 'Small', MEDIUM: 'Medium', LARGE: 'Large' }

  switch (size) {
    case 'SMALL':
      return labels.SMALL
    case 'MEDIUM':
      return labels.MEDIUM
    case 'LARGE':
      return labels.LARGE
  }
}

function chooseDefaultSize(locker: LockerDetail): LockerSize {
  return (
    SIZE_OPTIONS.find((size) => locker.availability[size] > 0) ??
    SIZE_OPTIONS.find((size) => locker.priceBySizeCents[size] !== undefined) ??
    'SMALL'
  )
}

function formatDistance(distanceMeters: number | null, locale: Locale): string {
  if (distanceMeters === null) return '-'
  return locale === 'th' ? `${distanceMeters} ม.` : `${distanceMeters} m`
}

function formatPrice(value: number | null, locale: Locale): string {
  if (value === null) return '-'
  const amount = new Intl.NumberFormat(locale === 'th' ? 'th-TH' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100)
  return locale === 'th' ? `${amount} บาท` : `${amount} THB`
}

function formatDateTime(value: string, locale: Locale): string {
  return `${new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: THAILAND_TIME_ZONE,
  }).format(new Date(value))}${locale === 'th' ? ' เวลาไทย' : ' ICT'}`
}

function toIsoDateTime(date: string, time: string): string {
  return new Date(`${date}T${time}:00${THAILAND_UTC_OFFSET}`).toISOString()
}

function formatDurationHours(value: number, locale: Locale): string {
  return locale === 'th' ? `${value} ชั่วโมง` : `${value} hours`
}

function translateLocation(value: string, locale: Locale): string {
  const labels = LOCATION_LABELS[value]
  if (!labels) return value
  return labels[locale]
}

function translateOperatingStatus(value: string, locale: Locale): string {
  if (locale === 'th') {
    if (value === 'OPERATIONAL') return 'พร้อมให้บริการ'
    if (value === 'OUT_OF_SERVICE') return 'ปิดให้บริการ'
  }
  return value
}

function translateReservationStatus(value: ReservationStatus, locale: Locale): string {
  if (locale === 'th') {
    if (value === 'RESERVED') return 'จองแล้ว'
    if (value === 'ACTIVE') return 'กำลังใช้งาน'
    if (value === 'COMPLETED') return 'เสร็จสิ้น'
    if (value === 'CANCELLED') return 'ยกเลิกแล้ว'
    if (value === 'EXPIRED') return 'หมดอายุ'
  }
  return value
}

function toApiError(value: unknown): ApiError {
  if (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value
  ) {
    return value as ApiError
  }

  return { code: 'UNKNOWN_ERROR', message: 'Unexpected error' }
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message)
  }

  return 'Unexpected error'
}

export default App
