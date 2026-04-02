import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getResourceById } from '../../api/resourceApi';
import BackButton from '../../components/BackButton';
import ResourceAvailabilityCalendar from '../../components/ResourceAvailabilityCalendar';

const CATEGORY_LABELS = {
  classroom: 'Classroom',
  lab: 'Lab',
  seminar_hall: 'Seminar hall',
  sports_facility: 'Sports facility',
  equipment: 'Equipment',
  auditorium: 'Auditorium',
  library_room: 'Library room',
};

const ResourceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return undefined;

    let cancelled = false;

    (async () => {
      const data = await getResourceById(id);
      if (cancelled) return;

      if (data.success && data.resource) {
        setResource(data.resource);
      } else {
        toast.error(data.message || 'Resource not found');
        setResource(null);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="px-4 py-10 mx-auto max-w-6xl animate-pulse">
        <div className="h-10 w-44 rounded-xl bg-slate-200" />
        <div className="mt-6 h-[320px] rounded-2xl bg-white border border-slate-200" />
        <div className="mt-6 h-[440px] rounded-2xl bg-white border border-slate-200" />
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="px-4 py-16 mx-auto max-w-3xl text-center">
        <p className="text-gray-600">This resource is not available.</p>
        <div className="flex justify-center mt-4">
          <BackButton label="Back to resources" to="/resources" className="mb-0" />
        </div>
      </div>
    );
  }

  const { availability } = resource;
  const days = availability?.daysAvailable?.length
    ? availability.daysAvailable.join(', ')
    : 'Not specified';
  const hours =
    availability?.hoursAvailable?.start && availability?.hoursAvailable?.end
      ? `${availability.hoursAvailable.start} - ${availability.hoursAvailable.end}`
      : 'Not specified';

  const handleSlotClick = (start, end) => {
    const params = new URLSearchParams({
      start: start.toISOString(),
      end: end.toISOString(),
    });

    navigate(`/book/${resource._id}?${params.toString()}`);
  };

  return (
    <div className="min-h-screen py-10 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="px-4 mx-auto max-w-6xl sm:px-6 lg:px-8">
        <BackButton label="Back to resources" fallback="/resources" />

        <div className="p-8 bg-white shadow-xl rounded-2xl animate-fadeIn">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-sm font-medium tracking-wide text-blue-600 uppercase">
                {CATEGORY_LABELS[resource.category] || resource.category}
              </p>
              <h1 className="mt-1 text-3xl font-bold text-gray-900">{resource.name}</h1>
              <p className="mt-1 text-gray-500">{resource.type}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                resource.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {resource.isActive ? 'Available' : 'Unavailable'}
            </span>
          </div>

          <dl className="grid gap-4 mb-8 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Location</dt>
              <dd className="text-gray-900">{resource.location}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Capacity</dt>
              <dd className="text-gray-900">{resource.capacity} people</dd>
            </div>
          </dl>

          {resource.description && (
            <div className="mb-8">
              <h2 className="mb-2 text-lg font-semibold text-gray-900">Description</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{resource.description}</p>
            </div>
          )}

          <div className="mb-8">
            <h2 className="mb-2 text-lg font-semibold text-gray-900">Availability</h2>
            <p className="text-gray-600">
              <span className="font-medium text-gray-800">Days:</span> {days}
            </p>
            <p className="mt-1 text-gray-600">
              <span className="font-medium text-gray-800">Hours:</span> {hours}
            </p>
          </div>

          {Array.isArray(resource.amenities) && resource.amenities.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-2 text-lg font-semibold text-gray-900">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {resource.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="px-3 py-1 text-sm font-medium text-blue-800 rounded-lg bg-blue-50"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          <ResourceAvailabilityCalendar
            resourceId={resource._id}
            resourceName={resource.name}
            operatingHours={resource.availability?.hoursAvailable}
            operatingDays={resource.availability?.daysAvailable || []}
            onTimeSlotClick={handleSlotClick}
          />

          <div className="flex flex-wrap gap-3">
            <Link
              to="/resources"
              className="px-5 py-2.5 font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Browse all
            </Link>
            <Link
              to={`/book/${resource._id}`}
              className={`px-5 py-2.5 font-semibold text-white rounded-lg shadow-md ${
                resource.isActive
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-400 pointer-events-none cursor-not-allowed'
              }`}
            >
              Book this resource
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceDetails;
