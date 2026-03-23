import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createBooking } from '../../api/bookingApi';
import { getResourceById } from '../../api/resourceApi';

const BookingForm = () => {
  const { resourceId } = useParams();
  const navigate = useNavigate();
  const [resource, setResource] = useState(null);
  const [loadingResource, setLoadingResource] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [expectedAttendees, setExpectedAttendees] = useState('1');
  const [notes, setNotes] = useState('');

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

  const buildDateTime = (d, t) => {
    if (!d || !t) return null;
    const iso = new Date(`${d}T${t}:00`);
    return Number.isNaN(iso.getTime()) ? null : iso;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resource?.isActive) {
      toast.error('This resource cannot be booked.');
      return;
    }

    const start = buildDateTime(date, startTime);
    const end = buildDateTime(date, endTime);
    const attendees = parseInt(expectedAttendees, 10);

    if (!start || !end) {
      toast.error('Please choose a valid date and times.');
      return;
    }
    if (end <= start) {
      toast.error('End time must be after start time.');
      return;
    }
    if (start <= new Date()) {
      toast.error('Start time must be in the future.');
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
      startTime: start.toISOString(),
      endTime: end.toISOString(),
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
      toast.error(data.message || 'Could not create booking');
    }
  };

  if (loadingResource) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="px-4 py-16 mx-auto max-w-lg text-center">
        <p className="text-gray-600">Resource not found.</p>
        <Link to="/resources" className="inline-block mt-4 font-medium text-blue-600">
          ← Browse resources
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 bg-gray-50">
      <div className="px-4 mx-auto max-w-2xl">
        <Link
          to={`/resources/${resource._id}`}
          className="inline-block mb-6 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          ← Resource details
        </Link>

        <div className="p-8 bg-white shadow-lg rounded-2xl">
          <h1 className="text-2xl font-bold text-gray-900">Book {resource.name}</h1>
          <p className="mt-1 text-gray-600">
            {resource.location} · Up to {resource.capacity} people
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Start time
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">End time</label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Purpose</label>
              <textarea
                required
                rows={3}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="What will you use this space for?"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Expected attendees (max {resource.capacity})
              </label>
              <input
                type="number"
                min={1}
                max={resource.capacity}
                required
                value={expectedAttendees}
                onChange={(e) => setExpectedAttendees(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Notes <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !resource.isActive}
              className="w-full py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting…' : 'Submit booking request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
