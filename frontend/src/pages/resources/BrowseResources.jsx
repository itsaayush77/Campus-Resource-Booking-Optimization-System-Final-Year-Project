import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getAllResources } from '../../api/resourceApi';

const CATEGORY_META = {
  classroom: {
    title: 'Classrooms',
    icon: '📚',
    color: 'from-blue-500 to-cyan-500',
  },
  lab: {
    title: 'Labs',
    icon: '🔬',
    color: 'from-purple-500 to-pink-500',
  },
  seminar_hall: {
    title: 'Seminar halls',
    icon: '🏛️',
    color: 'from-orange-500 to-amber-500',
  },
  sports_facility: {
    title: 'Sports facilities',
    icon: '⚽',
    color: 'from-indigo-500 to-purple-500',
  },
  equipment: {
    title: 'Equipment',
    icon: '💻',
    color: 'from-green-500 to-emerald-500',
  },
  auditorium: {
    title: 'Auditoriums',
    icon: '🎭',
    color: 'from-yellow-500 to-orange-500',
  },
  library_room: {
    title: 'Library rooms',
    icon: '📖',
    color: 'from-teal-500 to-cyan-500',
  },
};

const BrowseResources = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCapacity, setSelectedCapacity] = useState('all');
  const [selectedAvailability, setSelectedAvailability] = useState('all');

  const categoryParam = searchParams.get('category');
  const selectedCategory =
    categoryParam && Object.prototype.hasOwnProperty.call(CATEGORY_META, categoryParam)
      ? categoryParam
      : 'all';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await getAllResources();
      if (cancelled) return;
      if (data.success && Array.isArray(data.resources)) {
        setResources(data.resources);
      } else {
        toast.error(data.message || 'Failed to load resources');
        setResources([]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setCategoryFilter = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all') {
      next.delete('category');
    } else {
      next.set('category', value);
    }
    setSearchParams(next, { replace: true });
  };

  const categorySummaries = useMemo(() => {
    return Object.keys(CATEGORY_META).map((key) => ({
      type: key,
      ...CATEGORY_META[key],
      resources: resources.filter((r) => r.category === key),
    }));
  }, [resources]);

  const enriched = useMemo(() => {
    return resources.map((r) => {
      const meta = CATEGORY_META[r.category] || {
        title: r.category,
        icon: '📌',
        color: 'from-gray-400 to-gray-500',
      };
      return {
        ...r,
        categoryTitle: meta.title,
        categoryIcon: meta.icon,
        categoryColor: meta.color,
      };
    });
  }, [resources]);

  const filteredResources = enriched.filter((resource) => {
    const matchesSearch =
      !searchTerm ||
      resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (resource.location &&
        resource.location.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory =
      selectedCategory === 'all' || resource.category === selectedCategory;
    const matchesCapacity =
      selectedCapacity === 'all' ||
      (selectedCapacity === 'small' && resource.capacity <= 10) ||
      (selectedCapacity === 'medium' &&
        resource.capacity > 10 &&
        resource.capacity <= 30) ||
      (selectedCapacity === 'large' && resource.capacity > 30);
    const matchesAvailability =
      selectedAvailability === 'all' ||
      (selectedAvailability === 'available' && resource.isActive) ||
      (selectedAvailability === 'unavailable' && !resource.isActive);

    return (
      matchesSearch &&
      matchesCategory &&
      matchesCapacity &&
      matchesAvailability
    );
  });

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setSelectedCapacity('all');
    setSelectedAvailability('all');
  };

  const hasActiveFilters =
    searchTerm ||
    selectedCategory !== 'all' ||
    selectedCapacity !== 'all' ||
    selectedAvailability !== 'all';

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="inline-block px-4 py-2 mb-4 text-sm font-semibold text-blue-800 bg-blue-100 rounded-full">
            Explore campus resources
          </div>
          <h1 className="mb-4 text-4xl font-extrabold text-gray-900 md:text-5xl">
            Browse resources
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-gray-600">
            Discover and book classrooms, labs, equipment, and more
          </p>
        </div>

        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">Quick access by category</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {categorySummaries.map((category) => (
              <Link
                key={category.type}
                to={`/resources?category=${category.type}`}
                className="relative overflow-hidden transition-all duration-300 transform bg-white border border-gray-100 shadow-lg rounded-2xl hover:shadow-2xl hover:-translate-y-1 group"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                />
                <div className="relative p-4 sm:p-5">
                  <div className="mb-2 text-3xl text-center sm:text-4xl group-hover:scale-110 transition-transform">
                    {category.icon}
                  </div>
                  <h3 className="text-xs font-semibold text-center text-gray-900 sm:text-sm group-hover:text-blue-600">
                    {category.title}
                  </h3>
                  <p className="mt-1 text-xs text-center text-gray-500">
                    {category.resources.length}{' '}
                    {category.resources.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="p-6 mb-8 bg-white shadow-lg rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Filter resources</h2>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center px-4 py-2 space-x-2 text-sm font-semibold text-blue-600 rounded-lg bg-blue-50 hover:bg-blue-100"
              >
                <span>Clear filters</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Search
              </label>
              <input
                type="text"
                placeholder="Name or location…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All categories</option>
                {categorySummaries.map((c) => (
                  <option key={c.type} value={c.type}>
                    {c.icon} {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Capacity
              </label>
              <select
                value={selectedCapacity}
                onChange={(e) => setSelectedCapacity(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All sizes</option>
                <option value="small">Small (1–10)</option>
                <option value="medium">Medium (11–30)</option>
                <option value="large">Large (31+)</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Availability
              </label>
              <select
                value={selectedAvailability}
                onChange={(e) => setSelectedAvailability(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="available">Available only</option>
                <option value="unavailable">Unavailable only</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            Showing{' '}
            <span className="font-bold text-blue-600">{filteredResources.length}</span> of{' '}
            <span className="font-semibold text-gray-900">{enriched.length}</span> resources
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
          </div>
        ) : filteredResources.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((resource) => (
              <ResourceCard key={resource._id} resource={resource} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="mb-4 text-6xl">🔍</div>
            <h3 className="mb-2 text-2xl font-bold text-gray-900">No resources found</h3>
            <p className="mb-6 text-gray-600">Try adjusting search or filters</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="px-6 py-3 font-semibold text-white rounded-lg shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ResourceCard = ({ resource }) => {
  const amenities = Array.isArray(resource.amenities) ? resource.amenities : [];

  return (
    <div className="overflow-hidden transition-all duration-300 transform bg-white border border-gray-100 shadow-lg rounded-2xl hover:shadow-2xl hover:-translate-y-2">
      <div className={`h-2 bg-gradient-to-r ${resource.categoryColor}`} />

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{resource.categoryIcon}</span>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{resource.name}</h3>
              <p className="text-sm text-gray-500">{resource.categoryTitle}</p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
              resource.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {resource.isActive ? 'Available' : 'Unavailable'}
          </span>
        </div>

        <div className="mb-4 space-y-2">
          <div className="flex items-center text-gray-600">
            <span className="font-medium">Capacity: {resource.capacity}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <span>{resource.location}</span>
          </div>
        </div>

        {amenities.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-sm font-semibold text-gray-700">Amenities</p>
            <div className="flex flex-wrap gap-2">
              {amenities.slice(0, 3).map((amenity) => (
                <span
                  key={amenity}
                  className="px-3 py-1 text-xs font-medium text-blue-700 rounded-lg bg-blue-50"
                >
                  {amenity}
                </span>
              ))}
              {amenities.length > 3 && (
                <span className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg">
                  +{amenities.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Link
            to={`/resources/${resource._id}`}
            className="flex flex-1 items-center justify-center py-2.5 text-sm font-semibold text-blue-600 rounded-lg bg-blue-50 hover:bg-blue-100"
          >
            Details
          </Link>
          {resource.isActive ? (
            <Link
              to={`/book/${resource._id}`}
              className="flex flex-1 items-center justify-center py-2.5 text-sm font-semibold text-center text-white rounded-lg shadow-md transition-all bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Book now
            </Link>
          ) : (
            <span className="flex flex-1 items-center justify-center py-2.5 text-sm font-semibold text-center text-gray-400 bg-gray-200 rounded-lg cursor-not-allowed">
              Not available
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowseResources;
