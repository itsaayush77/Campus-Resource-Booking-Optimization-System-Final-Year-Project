import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getResourceById } from '../../api/resourceApi';

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
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="px-4 py-16 mx-auto max-w-3xl text-center">
        <p className="text-gray-600">This resource is not available.</p>
        <Link
          to="/resources"
          className="inline-block mt-4 font-medium text-blue-600 hover:text-blue-800"
        >
          ← Back to resources
        </Link>
      </div>
    );
  }

  const { availability } = resource;
  const days = availability?.daysAvailable?.length
    ? availability.daysAvailable.join(', ')
    : 'Not specified';
  const hours =
    availability?.hoursAvailable?.start && availability?.hoursAvailable?.end
      ? `${availability.hoursAvailable.start} – ${availability.hoursAvailable.end}`
      : 'Not specified';

  return (
    <div className="min-h-screen py-10 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="px-4 mx-auto max-w-3xl sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          ← Back
        </button>

        <div className="p-8 bg-white shadow-xl rounded-2xl">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">
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

          <dl className="grid gap-4 sm:grid-cols-2 mb-8">
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
                {resource.amenities.map((a) => (
                  <span
                    key={a}
                    className="px-3 py-1 text-sm font-medium text-blue-800 rounded-lg bg-blue-50"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

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
