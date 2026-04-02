import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getAllResources } from '../../api/resourceApi';

const CATEGORY_MAP = {
  classroom: 'classroom',
  classrooms: 'classroom',
  lab: 'lab',
  labs: 'lab',
  equipment: 'equipment',
  seminar_hall: 'seminar_hall',
  'meeting-rooms': 'seminar_hall',
  sports_facility: 'sports_facility',
  sports: 'sports_facility',
  auditorium: 'auditorium',
  auditoriums: 'auditorium',
  library_room: 'library_room',
  'study-rooms': 'library_room',
};

const CATEGORY_META = {
  classroom: { title: 'Classrooms', icon: 'Class' },
  lab: { title: 'Laboratory Facilities', icon: 'Lab' },
  equipment: { title: 'Equipment', icon: 'Gear' },
  seminar_hall: { title: 'Seminar Halls', icon: 'Hall' },
  sports_facility: { title: 'Sports Facilities', icon: 'Sport' },
  auditorium: { title: 'Auditoriums', icon: 'Stage' },
  library_room: { title: 'Study Rooms', icon: 'Study' },
};

const ResourcesList = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCapacity, setSelectedCapacity] = useState('all');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  const resolvedCategory = CATEGORY_MAP[type] || 'lab';
  const currentCategory = CATEGORY_META[resolvedCategory] || CATEGORY_META.lab;

  useEffect(() => {
    let cancelled = false;

    const fetchResources = async () => {
      setLoading(true);

      const response = await getAllResources({ category: resolvedCategory });

      if (cancelled) return;

      if (response.success) {
        setResources(Array.isArray(response.resources) ? response.resources : []);
      } else {
        toast.error(response.message || 'Failed to load resources');
        setResources([]);
      }

      setLoading(false);
    };

    fetchResources();

    return () => {
      cancelled = true;
    };
  }, [resolvedCategory]);

  const filteredResources = useMemo(
    () =>
      resources.filter((resource) => {
        const matchesSearch =
          resource.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resource.location?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCapacity =
          selectedCapacity === 'all' ||
          (selectedCapacity === 'small' && resource.capacity <= 10) ||
          (selectedCapacity === 'medium' && resource.capacity > 10 && resource.capacity <= 30) ||
          (selectedCapacity === 'large' && resource.capacity > 30);

        return matchesSearch && matchesCapacity;
      }),
    [resources, searchTerm, selectedCapacity]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin" />
          <p className="text-gray-600">Loading resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center px-4 py-2 mb-4 text-sm font-semibold text-blue-700 rounded-full bg-blue-100/80">
            {currentCategory.icon}
          </div>
          <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            {currentCategory.title}
          </h1>
          <p className="text-xl text-gray-600">Browse and book available resources</p>
        </div>

        <div className="p-6 mb-8 bg-white shadow-lg rounded-2xl">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Search Resources
              </label>
              <input
                type="text"
                placeholder="Search by name or location..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full px-4 py-3 transition border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Filter by Capacity
              </label>
              <select
                value={selectedCapacity}
                onChange={(event) => setSelectedCapacity(event.target.value)}
                className="w-full px-4 py-3 transition border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Sizes</option>
                <option value="small">Small (1-10)</option>
                <option value="medium">Medium (11-30)</option>
                <option value="large">Large (31+)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((resource) => (
            <ResourceCard
              key={resource._id}
              resource={resource}
              onViewDetails={() => navigate(`/resource/${resource._id}`)}
            />
          ))}
        </div>

        {filteredResources.length === 0 && (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-4 text-lg font-bold text-blue-700 bg-blue-100 rounded-full">
              Empty
            </div>
            <h3 className="mb-2 text-2xl font-bold text-gray-900">No resources found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ResourceCard = ({ resource, onViewDetails }) => (
  <div className="overflow-hidden transition-all duration-300 transform bg-white border border-gray-100 shadow-lg rounded-2xl hover:shadow-2xl hover:-translate-y-2">
    <div className={`h-2 ${resource.isActive ? 'bg-green-500' : 'bg-red-500'}`} />

    <div className="p-6">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">{resource.name}</h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            resource.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {resource.isActive ? 'Available' : 'Unavailable'}
        </span>
      </div>

      <div className="mb-4 space-y-3">
        <p className="font-medium text-gray-600">Capacity: {resource.capacity}</p>
        <p className="text-gray-600">{resource.location}</p>
        <p className="text-sm text-gray-600">{resource.type}</p>
      </div>

      {resource.amenities?.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-sm font-semibold text-gray-700">Amenities:</p>
          <div className="flex flex-wrap gap-2">
            {resource.amenities.slice(0, 3).map((amenity) => (
              <span
                key={amenity}
                className="px-3 py-1 text-xs font-medium text-blue-700 rounded-lg bg-blue-50"
              >
                {amenity}
              </span>
            ))}
            {resource.amenities.length > 3 && (
              <span className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg">
                +{resource.amenities.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      <button
        onClick={onViewDetails}
        disabled={!resource.isActive}
        className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
          resource.isActive
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg'
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
        }`}
      >
        {resource.isActive ? 'View Details' : 'Not Available'}
      </button>
    </div>
  </div>
);

export default ResourcesList;
