import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Screen = 'find' | 'detail' | 'reservation' | 'confirmation'
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

const SIZE_OPTIONS: LockerSize[] = ['SMALL', 'MEDIUM', 'LARGE']

function App() {
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
    userId: '',
    size: 'SMALL' as LockerSize,
    startDate: '2026-08-18',
    startTime: '12:00',
    durationHours: '2',
    idempotencyKey: '',
  })

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
        <div>
          <p className="eyebrow">LOCKGO</p>
          <h1>Find &amp; Reserve Locker</h1>
          <p className="subtle">
            Simple 4-screen flow for locker search, selection, reservation, and
            confirmation.
          </p>
        </div>
        <div className="status-strip">
          <span className={screen === 'find' ? 'active' : ''}>Find Locker</span>
          <span className={screen === 'detail' ? 'active' : ''}>Locker Detail</span>
          <span className={screen === 'reservation' ? 'active' : ''}>Reservation</span>
          <span className={screen === 'confirmation' ? 'active' : ''}>
            Confirmation
          </span>
        </div>
      </header>

      <section className="surface">
        {screen === 'find' && (
          <div className="stack gap-large">
            <div className="toolbar">
              <div>
                <h2>Find Locker</h2>
                <p className="subtle">Search by location and basic filters.</p>
              </div>
              <button
                className="button button-secondary"
                type="button"
                onClick={() => void loadLockers()}
                disabled={listLoading}
              >
                {listLoading ? 'Loading...' : 'Refresh'}
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
                <span>Location</span>
                <input
                  value={searchForm.location}
                  onChange={(event) =>
                    setSearchForm((current) => ({
                      ...current,
                      location: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>Locker Size</span>
                <select
                  value={searchForm.size}
                  onChange={(event) =>
                    setSearchForm((current) => ({
                      ...current,
                      size: event.target.value,
                    }))
                  }
                >
                  <option value="">All Sizes</option>
                  {SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {labelForSize(size)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Max Distance (m)</span>
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
                <span>Max Price (cents)</span>
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
                <span>Start Date</span>
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
                <span>Start Time</span>
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
                <span>Duration (hours)</span>
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
                <span>Sort</span>
                <select
                  value={searchForm.sort}
                  onChange={(event) =>
                    setSearchForm((current) => ({
                      ...current,
                      sort: event.target.value,
                    }))
                  }
                >
                  <option value="most_available">Most Available</option>
                  <option value="lowest_price">Lowest Price</option>
                  <option value="nearest">Nearest</option>
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
                <span>Only show available lockers</span>
              </label>

              <div className="form-actions">
                <button className="button" type="submit" disabled={listLoading}>
                  Search
                </button>
              </div>
            </form>

            {listError && <p className="error-text">{listError}</p>}

            <div className="list-grid">
              {lockers.length === 0 && !listLoading ? (
                <div className="panel empty-state">
                  <h3>No lockers found</h3>
                  <p className="subtle">Try a different location or relax the filters.</p>
                </div>
              ) : (
                lockers.map((locker) => (
                  <article className="panel locker-card" key={locker.id}>
                    <div className="stack gap-small">
                      <div className="toolbar compact">
                        <div>
                          <h3>{locker.name}</h3>
                          <p className="subtle">{locker.location}</p>
                        </div>
                        <span className="badge">{locker.operatingStatus}</span>
                      </div>
                      <div className="meta-grid">
                        <MetaItem
                          label="Distance"
                          value={formatDistance(locker.distanceMeters)}
                        />
                        <MetaItem
                          label="Starting Price"
                          value={formatPrice(locker.startingPriceCents)}
                        />
                        <MetaItem
                          label="Small"
                          value={String(locker.availability.SMALL)}
                        />
                        <MetaItem
                          label="Medium"
                          value={String(locker.availability.MEDIUM)}
                        />
                        <MetaItem
                          label="Large"
                          value={String(locker.availability.LARGE)}
                        />
                      </div>
                    </div>
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() => void openLocker(locker.id)}
                    >
                      View Detail
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
                <h2>Locker Detail</h2>
                <p className="subtle">{selectedLocker.address}</p>
              </div>
              <button
                className="button button-secondary"
                type="button"
                onClick={() => setScreen('find')}
              >
                Back
              </button>
            </div>

            {detailLoading && <p className="subtle">Loading locker detail...</p>}
            {detailError && <p className="error-text">{detailError}</p>}

            <div className="detail-layout">
              <section className="panel">
                <h3>{selectedLocker.name}</h3>
                <div className="meta-grid">
                  <MetaItem label="Status" value={selectedLocker.operatingStatus} />
                  <MetaItem
                    label="Distance"
                    value={formatDistance(selectedLocker.distanceMeters)}
                  />
                  <MetaItem
                    label="Operating Hours"
                    value={`${selectedLocker.operatingHours.openTime ?? '-'} - ${
                      selectedLocker.operatingHours.closeTime ?? '-'
                    }`}
                  />
                  <MetaItem
                    label="Available Time"
                    value={
                      selectedLocker.availableTime.startAt &&
                      selectedLocker.availableTime.endAt
                        ? `${formatDateTime(selectedLocker.availableTime.startAt)} - ${formatDateTime(
                            selectedLocker.availableTime.endAt,
                          )}`
                        : 'Not specified'
                    }
                  />
                </div>
              </section>

              <section className="panel">
                <h3>Sizes &amp; Availability</h3>
                <div className="size-list">
                  {SIZE_OPTIONS.map((size) => (
                    <div className="size-row" key={size}>
                      <span>{labelForSize(size)}</span>
                      <span>{selectedLocker.availability[size]} available</span>
                      <span>{formatPrice(selectedLocker.priceBySizeCents[size] ?? null)}</span>
                    </div>
                  ))}
                </div>
                <div className="panel-actions">
                  <button
                    className="button"
                    type="button"
                    onClick={() => setScreen('reservation')}
                  >
                    Select Locker
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
                <h2>Reservation</h2>
                <p className="subtle">Fill the required fields and review the summary.</p>
              </div>
              <button
                className="button button-secondary"
                type="button"
                onClick={() => setScreen('detail')}
              >
                Back
              </button>
            </div>

            <div className="detail-layout">
              <form className="panel stack gap-medium" onSubmit={handleReservationSubmit}>
                <label>
                  <span>User ID</span>
                  <input
                    placeholder="Required by the current backend contract"
                    value={reservationForm.userId}
                    onChange={(event) =>
                      setReservationForm((current) => ({
                        ...current,
                        userId: event.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  <span>Locker Size</span>
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
                        {labelForSize(size)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Start Date</span>
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
                  <span>Start Time</span>
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
                  <span>Duration (hours)</span>
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
                  <span>Idempotency Key</span>
                  <input
                    placeholder="Optional"
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
                    {reservationLoading ? 'Submitting...' : 'Confirm Reservation'}
                  </button>
                </div>
              </form>

              <section className="panel stack gap-medium">
                <h3>Reservation Summary</h3>
                <SummaryRow label="Locker" value={selectedLocker.name} />
                <SummaryRow label="Location" value={selectedLocker.address} />
                <SummaryRow
                  label="Compartment Size"
                  value={labelForSize(reservationForm.size)}
                />
                <SummaryRow
                  label="Start Time"
                  value={formatDateTime(reservationStartAt)}
                />
                <SummaryRow
                  label="End Time"
                  value={
                    reservationSummary
                      ? formatDateTime(reservationSummary.endAt)
                      : 'Incomplete'
                  }
                />
                <SummaryRow
                  label="Duration"
                  value={
                    reservationSummary
                      ? `${reservationSummary.durationHours} hours`
                      : 'Incomplete'
                  }
                />
                <SummaryRow
                  label="Price / hour"
                  value={
                    reservationSummary
                      ? formatPrice(reservationSummary.pricePerHourCents)
                      : 'Unavailable'
                  }
                />
                <SummaryRow
                  label="Total Price"
                  value={
                    reservationSummary
                      ? formatPrice(reservationSummary.totalPriceCents)
                      : 'Unavailable'
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
                <h2>Confirmation</h2>
                <p className="subtle">Reservation created successfully.</p>
              </div>
              <button
                className="button button-secondary"
                type="button"
                onClick={() => setScreen('find')}
              >
                New Search
              </button>
            </div>

            <section className="panel stack gap-medium">
              <SummaryRow label="Booking Number" value={reservation.reservationNumber} />
              <SummaryRow label="Locker" value={reservation.locker.name} />
              <SummaryRow label="Location" value={reservation.locker.address} />
              <SummaryRow
                label="Compartment"
                value={`${labelForSize(reservation.compartment.size)} (${reservation.compartment.code})`}
              />
              <SummaryRow label="Start Time" value={formatDateTime(reservation.startAt)} />
              <SummaryRow
                label="Expiration / End Time"
                value={formatDateTime(reservation.endAt)}
              />
              <SummaryRow
                label="Price / hour"
                value={formatPrice(reservation.pricePerHourCents)}
              />
              <SummaryRow
                label="Total Price"
                value={formatPrice(reservation.totalPriceCents)}
              />
              <SummaryRow label="Booking Status" value={reservation.status} />
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

function labelForSize(size: LockerSize): string {
  switch (size) {
    case 'SMALL':
      return 'Small'
    case 'MEDIUM':
      return 'Medium'
    case 'LARGE':
      return 'Large'
  }
}

function chooseDefaultSize(locker: LockerDetail): LockerSize {
  return (
    SIZE_OPTIONS.find((size) => locker.availability[size] > 0) ??
    SIZE_OPTIONS.find((size) => locker.priceBySizeCents[size] !== undefined) ??
    'SMALL'
  )
}

function formatDistance(distanceMeters: number | null): string {
  if (distanceMeters === null) return '-'
  return `${distanceMeters} m`
}

function formatPrice(value: number | null): string {
  if (value === null) return '-'
  return `${(value / 100).toFixed(2)}`
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function toIsoDateTime(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString()
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
