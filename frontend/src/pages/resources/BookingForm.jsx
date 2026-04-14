import { useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createBooking } from '../../api/bookingApi';
import { getResourceById } from '../../api/resourceApi';
import BackButton from '../../components/BackButton';
import 'react-datepicker/dist/react-datepicker.css';
import './BookingForm.css';

const TIME_INTERVAL_MINUTES = 15;
const MIN_BOOKING_MINUTES = 30;
const DISPLAY_FORMAT = 'MMMM d, yyyy h:mm aa';

const addMinutes = (date, minutes) => {
  const next = new Date(date);
  next.setMinutes(next.getMinutes() + minutes);
  return next;
};

const isSameDay = (left, right) =>
  left instanceof Date &&
  right instanceof Date &&
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const getStartOfDay = (date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const getEndOfDay = (date) => {
  const next = new Date(date);
  next.setHours(23, 45, 0, 0);
  return next;
};

const roundUpToInterval = (date, intervalMinutes) => {
  const next = new Date(date);
  next.setSeconds(0, 0);

  const remainder = next.getMinutes() % intervalMinutes;
  if (remainder !== 0) {
    next.setMinutes(next.getMinutes() + intervalMinutes - remainder);
  }

  return next;
};

const BookingForm = () => {
  const { resourceId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [resource, setResource] = useState(null);
  const [loadingResource, setLoadingResource] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [purpose, setPurpose] = useState('');
  const [expectedAttendees, setExpectedAttendees] = useState('1');
  const [notes, setNotes] = useState('');
  const [submissionHint, setSubmissionHint] = useState('');

  const now = useMemo(() => new Date(), []);
  const roundedNow = useMemo(
    () => roundUpToInterval(now, TIME_INTERVAL_MINUTES),
    [now]
  );
  const minStartDate = useMemo(() => getStartOfDay(new Date()), []);
  const minimumEndDate = startDate
    ? addMinutes(startDate, MIN_BOOKING_MINUTES)
    : null;
  const prefilledStart = useMemo(() => {
    const value = searchParams.get('start');
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }, [searchParams]);
  const prefilledEnd = useMemo(() => {
    const value = searchParams.get('end');
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }, [searchParams]);

  useEffect(() => {
    if (!resourceId) return undefined;

    let cancelled = false;

    (async () => {
      const data = await getResourceById(resourceId);
      if (cancelled) return;

      if (data.success && data.resource) {
        setResource(data.resource);
        if (!data.resource.isActive) {
          toast.error('This resource is not available for booking.');
        }
      } else {
        toast.error(data.message || 'Resource not found');
        setResource(null);
      }

      setLoadingResource(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [resourceId]);

  useEffect(() => {
    if (!startDate) {
      setEndDate(null);
      return;
    }

    setEndDate((current) => {
      if (!current || current < minimumEndDate) {
        return minimumEndDate;
      }

      return current;
    });
  }, [startDate, minimumEndDate]);

  useEffect(() => {
    if (!resource || startDate || prefilledStart === null) return;

    if (prefilledStart <= new Date()) {
      return;
    }

    const nextStart =
      isSameDay(prefilledStart, now) && prefilledStart < roundedNow
        ? roundedNow
        : prefilledStart;
    const suggestedEnd =
      prefilledEnd && prefilledEnd >= addMinutes(nextStart, MIN_BOOKING_MINUTES)
        ? prefilledEnd
        : addMinutes(nextStart, 60);

    setStartDate(nextStart);
    setEndDate(suggestedEnd);
  }, [resource, startDate, prefilledEnd, prefilledStart, now, roundedNow]);

  const startMinTime = useMemo(() => {
    if (!startDate || isSameDay(startDate, now)) {
      return roundedNow;
    }

    return getStartOfDay(startDate);
  }, [startDate, now, roundedNow]);

  const startMaxTime = useMemo(
    () => getEndOfDay(startDate || now),
    [startDate, now]
  );

  const endMinTime = useMemo(() => {
    if (!minimumEndDate) return getStartOfDay(now);

    if (!endDate || isSameDay(endDate, minimumEndDate)) {
      return minimumEndDate;
    }

    return getStartOfDay(endDate);
  }, [endDate, minimumEndDate, now]);

  const endMaxTime = useMemo(
    () => getEndOfDay(endDate || minimumEndDate || now),
    [endDate, minimumEndDate, now]
  );

  const handleStartChange = (value) => {
    if (value && isSameDay(value, now) && value < roundedNow) {
      setStartDate(roundedNow);
      return;
    }

    setStartDate(value);
  };

  const handleEndChange = (value) => {
    setEndDate(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!resource?.isActive) {
      toast.error('This resource cannot be booked.');
      return;
    }

    const attendees = parseInt(expectedAttendees, 10);

    if (!startDate || !endDate) {
      toast.error('Please choose a valid start and end time.');
      return;
    }

    if (startDate <= new Date()) {
      toast.error('Start time must be in the future.');
      return;
    }

    if (endDate < addMinutes(startDate, MIN_BOOKING_MINUTES)) {
      toast.error(`End time must be at least ${MIN_BOOKING_MINUTES} minutes after the start time.`);
      return;
    }

    if (!purpose.trim()) {
      toast.error('Please describe the purpose of the booking.');
      return;
    }

    if (!Number.isInteger(attendees) || attendees < 1) {
      toast.error('Expected attendees must be at least 1.');
      return;
    }

    if (attendees > resource.capacity) {
      toast.error(`Attendees cannot exceed capacity (${resource.capacity}).`);
      return;
    }

    setSubmitting(true);

    const payload = {
      resourceId: resource._id,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      purpose: purpose.trim(),
      expectedAttendees: attendees,
      notes: notes.trim() || undefined,
    };

    const data = await createBooking(payload);
    setSubmitting(false);

    if (data.success) {
      toast.success(data.message || 'Booking request submitted');
      navigate('/my-bookings');
    } else {
      if (data.errorCode === 'RESOURCE_INACTIVE') {
        const hint = 'This resource is currently archived or inactive. Please pick another resource.';
        setSubmissionHint(hint);
        toast.error(data.message || hint);
      } else if (data.errorCode === 'BOOKING_CONFLICT') {
        const hint = data.suggestion || 'Try another time slot.';
        setSubmissionHint(hint);
        toast.error(`${data.message} ${hint}`);
      } else if (Array.isArray(data.errors) && data.errors.length > 0) {
        toast.error(data.errors[0]?.message || data.message || 'Could not create booking');
      } else {
        toast.error(data.message || 'Could not create booking');
      }
    }
  };

  if (loadingResource) {
    return (
      <div className="px-4 py-10 mx-auto max-w-3xl animate-pulse">
        <div className="h-10 w-48 rounded-xl bg-slate-200" />
        <div className="mt-6 h-[620px] rounded-[28px] bg-white border border-slate-200" />
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="px-4 py-16 mx-auto max-w-lg text-center">
        <p className="text-gray-600">Resource not found.</p>
        <div className="flex justify-center mt-4">
          <BackButton label="Browse resources" to="/resources" className="mb-0" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_32%),linear-gradient(180deg,_#f8fbff_0%,_#eef2ff_100%)] py-10">
      <div className="px-4 mx-auto max-w-3xl">
        <BackButton label="Resource details" to={`/resource/${resource._id}`} />

        <div className="animate-fadeIn overflow-hidden bg-white/95 border border-white shadow-[0_24px_60px_-24px_rgba(79,70,229,0.45)] rounded-[28px] backdrop-blur-sm">
          <div className="px-8 py-8 text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
            <p className="text-sm font-semibold tracking-[0.24em] uppercase text-blue-100">
              New Booking Request
            </p>
            <h1 className="mt-3 text-3xl font-bold">Book {resource.name}</h1>
            <p className="mt-3 text-sm text-blue-100 sm:text-base">
              {resource.location} · Up to {resource.capacity} people
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">

            {submissionHint && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <strong>Suggestion:</strong> {submissionHint}
              </div>
            )}

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Start time
                </label>
                <DatePicker
                  selected={startDate}
                  onChange={handleStartChange}
                  showTimeSelect
                  timeIntervals={TIME_INTERVAL_MINUTES}
                  minDate={minStartDate}
                  minTime={startMinTime}
                  maxTime={startMaxTime}
                  dateFormat={DISPLAY_FORMAT}
                  placeholderText="Choose start date and time"
                  disabled={!resource.isActive}
                  className="booking-datepicker-input"
                  wrapperClassName="booking-datepicker-wrapper"
                  calendarClassName="booking-datepicker-calendar"
                  popperClassName="booking-datepicker-popper"
                  timeCaption="Time"
                />
                <p className="text-xs text-gray-500">
                  Starts from today, and today&apos;s times begin after the current time.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  End time
                </label>
                <DatePicker
                  selected={endDate}
                  onChange={handleEndChange}
                  showTimeSelect
                  timeIntervals={TIME_INTERVAL_MINUTES}
                  minDate={minimumEndDate || minStartDate}
                  minTime={endMinTime}
                  maxTime={endMaxTime}
                  dateFormat={DISPLAY_FORMAT}
                  placeholderText="Choose end date and time"
                  disabled={!startDate || !resource.isActive}
                  className="booking-datepicker-input"
                  wrapperClassName="booking-datepicker-wrapper"
                  calendarClassName="booking-datepicker-calendar"
                  popperClassName="booking-datepicker-popper"
                  timeCaption="Time"
                />
                <p className="text-xs text-gray-500">
                  End time must be at least 30 minutes after the start.
                </p>
              </div>
            </div>

            {(startDate || endDate) && (
              <div className="grid gap-4 p-4 border border-blue-100 sm:grid-cols-2 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50">
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] uppercase text-blue-500">
                    Selected Start
                  </p>
                  <p className="mt-1 font-semibold text-gray-800">
                    {startDate ? startDate.toLocaleString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    }) : 'Not selected'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] uppercase text-purple-500">
                    Selected End
                  </p>
                  <p className="mt-1 font-semibold text-gray-800">
                    {endDate ? endDate.toLocaleString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    }) : 'Not selected'}
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">Purpose</label>
              <textarea
                required
                rows={4}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Describe the class, event, practice, or activity for this booking."
                className="w-full px-4 py-3 text-gray-900 transition-all duration-200 border border-slate-200 rounded-2xl shadow-sm resize-none focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-[1fr,1.15fr]">
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Expected attendees (max {resource.capacity})
                </label>
                <input
                  type="number"
                  min={1}
                  max={resource.capacity}
                  required
                  value={expectedAttendees}
                  onChange={(e) => setExpectedAttendees(e.target.value)}
                  className="w-full px-4 py-3 text-gray-900 transition-all duration-200 border border-slate-200 rounded-2xl shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Notes <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any setup details, equipment needs, or booking notes."
                  className="w-full px-4 py-3 text-gray-900 transition-all duration-200 border border-slate-200 rounded-2xl shadow-sm resize-none focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !resource.isActive}
              className="w-full py-3.5 font-semibold text-white transition-all duration-200 rounded-2xl shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500"
            >
              {submitting ? 'Submitting...' : 'Submit booking request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
