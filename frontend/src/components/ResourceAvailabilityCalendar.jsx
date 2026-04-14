import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  LuCalendarDays,
  LuChevronLeft,
  LuChevronRight,
  LuClock3,
  LuLock,
  LuRefreshCw,
} from 'react-icons/lu';
import { getResourceBookings } from '../api/resourceApi';
import { subscribeToAppDataChanges } from '../utils/dataSync';

const HOURS_IN_DAY = 24;
const WEEK_LENGTH = 7;
const DISPLAY_END_HOUR = 17;
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAME_BY_NORMALIZED = {
  sunday: 'Sunday',
  sun: 'Sunday',
  monday: 'Monday',
  mon: 'Monday',
  tuesday: 'Tuesday',
  tue: 'Tuesday',
  tues: 'Tuesday',
  wednesday: 'Wednesday',
  wed: 'Wednesday',
  thursday: 'Thursday',
  thu: 'Thursday',
  thur: 'Thursday',
  thurs: 'Thursday',
  friday: 'Friday',
  fri: 'Friday',
  saturday: 'Saturday',
  sat: 'Saturday',
};

const startOfDay = (date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const formatDateParam = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseHour = (timeValue, fallback) => {
  if (typeof timeValue !== 'string') return fallback;
  const [hourString] = timeValue.split(':');
  const hour = Number.parseInt(hourString, 10);
  return Number.isFinite(hour) ? hour : fallback;
};

const normalizeDayName = (value) => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return DAY_NAME_BY_NORMALIZED[normalized] || null;
};

const formatHourLabel = (hour) => {
  const normalized = hour % HOURS_IN_DAY;
  const suffix = normalized >= 12 ? 'PM' : 'AM';
  const display = normalized % 12 === 0 ? 12 : normalized % 12;
  return `${display} ${suffix}`;
};

const formatWeekRange = (weekStart) => {
  const weekEnd = addDays(weekStart, 6);
  return `${weekStart.toLocaleDateString([], {
    month: 'long',
    day: 'numeric',
  })} - ${weekEnd.toLocaleDateString([], {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })}`;
};

const formatBookingTime = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Time unavailable';

  return `${start.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })}, ${start.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })} - ${end.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
};

const getSlotStart = (date, hour) => {
  const next = new Date(date);
  next.setHours(hour, 0, 0, 0);
  return next;
};

const getSlotEnd = (date, hour) => {
  const next = new Date(date);
  next.setHours(hour + 1, 0, 0, 0);
  return next;
};

const statusMeta = {
  available: {
    label: 'Available',
    className: 'border-emerald-200 bg-white text-emerald-800 hover:border-emerald-400 hover:bg-emerald-50',
    badgeClassName: 'bg-emerald-100 text-emerald-700',
  },
  booked: {
    label: 'Booked',
    className: 'border-rose-200 bg-rose-100/90 text-rose-900',
    badgeClassName: 'bg-rose-200 text-rose-800',
  },
  pending: {
    label: 'Pending',
    className: 'border-amber-200 bg-amber-100/90 text-amber-900',
    badgeClassName: 'bg-amber-200 text-amber-800',
  },
  closed: {
    label: 'Closed',
    className: 'border-slate-200 bg-slate-200 text-slate-500',
    badgeClassName: 'bg-slate-300 text-slate-600',
  },
  past: {
    label: 'Past',
    className: 'border-slate-200 bg-slate-100 text-slate-500',
    badgeClassName: 'bg-slate-200 text-slate-600',
  },
};

const getBookingKind = (booking) => {
  if (!booking) return 'available';
  if (booking.status === 'pending') return 'pending';
  return 'booked';
};

const ResourceAvailabilityCalendar = ({
  resourceId,
  resourceName,
  operatingHours,
  operatingDays = [],
  onTimeSlotClick,
}) => {
  const [weekStart, setWeekStart] = useState(() => startOfDay(new Date()));
  const [resourceInfo, setResourceInfo] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAvailability = useCallback(
    async ({ showLoader = false, silent = false } = {}) => {
      if (!resourceId) return;

      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const weekEnd = addDays(weekStart, WEEK_LENGTH - 1);
      const response = await getResourceBookings(
        resourceId,
        formatDateParam(weekStart),
        formatDateParam(weekEnd)
      );

      if (response.success) {
        setResourceInfo(response.resource || null);
        setBookings(Array.isArray(response.bookings) ? response.bookings : []);
      } else {
        setResourceInfo(null);
        setBookings([]);
        if (!silent) {
          toast.error(response.message || 'Failed to load availability');
        }
      }

      setLoading(false);
      setRefreshing(false);
    },
    [resourceId, weekStart]
  );

  useEffect(() => {
    loadAvailability({ showLoader: true });
  }, [loadAvailability]);

  useEffect(() => {
    const refreshSilently = () => {
      loadAvailability({ silent: true });
    };

    const interval = window.setInterval(refreshSilently, 45000);
    const unsubscribe = subscribeToAppDataChanges((event) => {
      const scope = event?.scope || 'all';
      if (scope === 'all' || scope === 'bookings' || scope === 'admin-bookings' || scope === 'resources') {
        refreshSilently();
      }
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshSilently();
      }
    };

    window.addEventListener('focus', refreshSilently);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      unsubscribe();
      window.removeEventListener('focus', refreshSilently);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadAvailability]);

  const effectiveHours = resourceInfo?.availability?.hoursAvailable || operatingHours;
  const effectiveDays = resourceInfo?.availability?.daysAvailable || operatingDays;
  const normalizedEffectiveDays = useMemo(() => {
    const days = Array.isArray(effectiveDays) ? effectiveDays : [];
    const normalized = days
      .map(normalizeDayName)
      .filter(Boolean);

    return Array.from(new Set(normalized));
  }, [effectiveDays]);
  const startHour = parseHour(effectiveHours?.start, 7);
  const endHour = Math.min(parseHour(effectiveHours?.end, DISPLAY_END_HOUR), DISPLAY_END_HOUR);

  const weekDays = useMemo(
    () => Array.from({ length: WEEK_LENGTH }, (_, index) => addDays(weekStart, index)),
    [weekStart]
  );

  const hourRows = useMemo(
    () => Array.from({ length: Math.max(endHour - startHour, 1) }, (_, index) => startHour + index),
    [endHour, startHour]
  );

  const slots = useMemo(() => {
    const now = new Date();

    return hourRows.flatMap((hour) =>
      weekDays.map((day) => {
        const dayName = DAY_NAMES[day.getDay()];
        const isOpenDay =
          normalizedEffectiveDays.length === 0 || normalizedEffectiveDays.includes(dayName);
        const slotStart = getSlotStart(day, hour);
        const slotEnd = getSlotEnd(day, hour);
        const isPastSlot = slotEnd <= now;
        const booking = bookings.find((item) => {
          const bookingStart = new Date(item.startTime);
          const bookingEnd = new Date(item.endTime);

          return bookingStart < slotEnd && bookingEnd > slotStart;
        });

        const state = isPastSlot
          ? 'past'
          : !isOpenDay
            ? 'closed'
            : booking
              ? getBookingKind(booking)
              : 'available';

        return {
          id: `${formatDateParam(day)}-${hour}`,
          state,
          booking,
          slotStart,
          slotEnd,
          isClickable: state === 'available' && slotStart > now,
        };
      })
    );
  }, [bookings, hourRows, normalizedEffectiveDays, weekDays]);

  const legend = [
    { key: 'available', label: 'Available', tone: 'bg-emerald-500' },
    { key: 'booked', label: 'Booked', tone: 'bg-rose-500' },
    { key: 'pending', label: 'Pending Approval', tone: 'bg-amber-500' },
    { key: 'past', label: 'Past Slot', tone: 'bg-slate-400' },
    { key: 'closed', label: 'Not Operating', tone: 'bg-slate-500' },
  ];

  const moveWeek = (direction) => {
    setWeekStart((current) => addDays(current, direction * WEEK_LENGTH));
  };

  const handleSlotClick = (slot) => {
    if (!slot.isClickable) return;
    onTimeSlotClick?.(slot.slotStart, slot.slotEnd);
  };

  return (
    <section className="mb-8 overflow-hidden border border-blue-100 rounded-[30px] bg-gradient-to-br from-white via-blue-50/70 to-indigo-50 shadow-[0_24px_70px_-40px_rgba(59,130,246,0.45)] animate-fadeIn">
      <div className="px-6 pt-6 pb-5 sm:px-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold tracking-[0.22em] text-blue-700 uppercase border border-blue-100 rounded-full bg-white/90 shadow-sm">
              <LuCalendarDays className="w-4 h-4" />
              Live Availability
            </div>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Weekly booking calendar
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
              Check which slots are already booked for {resourceName || 'this resource'} and pick any open time without trial and error.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start xl:self-auto">
            <button
              type="button"
              onClick={() => loadAvailability()}
              disabled={refreshing}
              className="inline-flex items-center justify-center w-11 h-11 transition bg-white border border-blue-100 shadow-sm rounded-2xl text-slate-700 hover:border-blue-200 hover:text-blue-700 disabled:opacity-70"
              title="Refresh availability"
            >
              <LuRefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => moveWeek(-1)}
              className="inline-flex items-center justify-center w-11 h-11 transition bg-white border border-blue-100 shadow-sm rounded-2xl text-slate-700 hover:border-blue-200 hover:text-blue-700"
            >
              <LuChevronLeft className="w-5 h-5" />
            </button>
            <div className="px-4 py-2.5 text-sm font-semibold text-center text-slate-800 bg-white border border-blue-100 shadow-sm rounded-2xl min-w-[220px]">
              {formatWeekRange(weekStart)}
            </div>
            <button
              type="button"
              onClick={() => moveWeek(1)}
              className="inline-flex items-center justify-center w-11 h-11 transition bg-white border border-blue-100 shadow-sm rounded-2xl text-slate-700 hover:border-blue-200 hover:text-blue-700"
            >
              <LuChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 pt-0 sm:p-6 sm:pt-0 lg:p-8 lg:pt-0">
        <div className="flex flex-wrap gap-3 mb-5">
          {legend.map((item) => (
            <div key={item.key} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-full shadow-sm">
              <span className={`h-2.5 w-2.5 rounded-full ${item.tone}`} />
              {item.label}
            </div>
          ))}
        </div>

        <div className="p-4 mb-5 border border-blue-100 bg-white/90 rounded-2xl">
          <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-900">Choose a free slot, then continue to booking</p>
              <p className="mt-1 text-slate-600">The calendar shows live occupancy from {formatHourLabel(startHour)} to {formatHourLabel(endHour)}.</p>
              <p className="mt-1 text-slate-500">
                Operating days:{' '}
                {normalizedEffectiveDays.length > 0 ? normalizedEffectiveDays.join(', ') : 'All days'}.
              </p>
              <p className="mt-1 text-slate-500">Pending and booked slots mirror the same overlap rules used by booking validation.</p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-2 font-medium text-blue-700 rounded-full bg-blue-50">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Green slots can be selected
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-3">
          <div className="min-w-[1040px]">
            <div
              className="grid gap-2.5"
              style={{ gridTemplateColumns: `110px repeat(${WEEK_LENGTH}, minmax(128px, 1fr))` }}
            >
              <div className="sticky left-0 z-10 p-3 text-xs font-semibold tracking-[0.22em] text-gray-500 uppercase bg-white border border-slate-200 rounded-2xl">
                Time
              </div>
              {weekDays.map((day, index) => (
                <div key={day.toISOString()} className="p-3 text-center border border-gray-200 rounded-2xl bg-slate-50/90">
                  <p className="text-xs font-semibold tracking-[0.18em] uppercase text-gray-500">
                    {SHORT_DAY_NAMES[day.getDay()]}
                  </p>
                  <p className="mt-1 text-lg font-bold text-gray-900">
                    {day.toLocaleDateString([], { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              ))}

              {hourRows.map((hour) => (
                <FragmentRow
                  key={hour}
                  hour={hour}
                  slots={slots.filter((slot) => slot.slotStart.getHours() === hour)}
                  handleSlotClick={handleSlotClick}
                />
              ))}
            </div>
          </div>
        </div>

        {loading && (
          <div className="grid gap-2.5 mt-6 animate-pulse">
            <div className="h-6 w-44 rounded-lg bg-slate-200" />
            <div className="h-24 rounded-2xl bg-white border border-slate-200" />
            <div className="h-24 rounded-2xl bg-white border border-slate-200" />
          </div>
        )}
      </div>
    </section>
  );
};

const FragmentRow = ({ hour, slots, handleSlotClick }) => (
  <>
    <div className="sticky left-0 z-10 flex items-center px-3 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm">
      <div>
        <p className="text-sm font-bold text-gray-900">{formatHourLabel(hour)}</p>
        <p className="mt-1 text-xs text-gray-500">{String(hour).padStart(2, '0')}:00</p>
      </div>
    </div>
    {slots.map((slot) => {
      const meta = statusMeta[slot.state];
      const tooltip = slot.booking
        ? `${meta.label}\n${formatBookingTime(slot.booking.startTime, slot.booking.endTime)}\n${slot.booking.userId?.name ? `Booked by: ${slot.booking.userId.name}\n` : ''}${slot.booking.purpose ? `Purpose: ${slot.booking.purpose}` : ''}`
        : `${meta.label}\n${slot.slotStart.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${slot.slotStart.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;

      return (
        <button
          key={slot.id}
          type="button"
          title={tooltip}
          disabled={!slot.isClickable}
          onClick={() => handleSlotClick(slot)}
          className={`group relative min-h-[88px] rounded-2xl border p-3 text-left shadow-sm transition ${meta.className} ${slot.isClickable ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md' : 'cursor-default'} disabled:opacity-100`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${meta.badgeClassName}`}>
                {meta.label}
              </span>
              {slot.booking && (
                <p className="mt-3 text-sm font-semibold leading-5">
                  {slot.booking.status === 'pending' ? 'Pending approval' : 'Occupied'}
                </p>
              )}
              {!slot.booking && slot.state === 'available' && (
                <p className="mt-3 text-sm font-semibold leading-5">
                  {slot.slotStart.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} slot open
                </p>
              )}
              {!slot.booking && slot.state === 'closed' && (
                <p className="mt-3 text-sm font-semibold leading-5">Not operating</p>
              )}
              {!slot.booking && slot.state === 'past' && (
                <p className="mt-3 text-sm font-semibold leading-5">Time passed</p>
              )}
            </div>
            {slot.state === 'closed' || slot.state === 'past' ? (
              <LuLock className="w-4 h-4 shrink-0" />
            ) : (
              <LuClock3 className="w-4 h-4 shrink-0" />
            )}
          </div>

          {slot.booking && (
            <div className="mt-3 text-xs leading-5 opacity-90">
              <p>{formatBookingTime(slot.booking.startTime, slot.booking.endTime)}</p>
              {slot.booking.userId?.name && <p className="mt-1">User: {slot.booking.userId.name}</p>}
            </div>
          )}

          {slot.booking && (
            <div className="absolute z-20 hidden max-w-[260px] rounded-2xl bg-slate-950 px-4 py-3 text-xs leading-5 text-white shadow-2xl group-hover:block left-3 top-[calc(100%+10px)]">
              <p className="font-bold text-white/95">{meta.label}</p>
              <p className="mt-1 text-white/80">{formatBookingTime(slot.booking.startTime, slot.booking.endTime)}</p>
              {slot.booking.userId?.name && <p className="mt-1 text-white/80">User: {slot.booking.userId.name}</p>}
              {slot.booking.purpose && <p className="mt-1 text-white/80">Purpose: {slot.booking.purpose}</p>}
            </div>
          )}
        </button>
      );
    })}
  </>
);

export default ResourceAvailabilityCalendar;
