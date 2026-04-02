import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  LuCirclePlus,
  LuLayers3,
  LuPencil,
  LuRefreshCw,
  LuSearch,
  LuToggleLeft,
  LuToggleRight,
  LuShieldCheck,
  LuTrash2,
  LuX,
  LuShieldX,
} from 'react-icons/lu';
import { createResource, deleteResource, toggleResourceActive, updateResource } from '../api/adminApi';
import { getAllResources } from '../api/resourceApi';

const CATEGORY_OPTIONS = [
  ['classroom', 'Classroom'],
  ['lab', 'Lab'],
  ['seminar_hall', 'Seminar Hall'],
  ['sports_facility', 'Sports Facility'],
  ['equipment', 'Equipment'],
  ['auditorium', 'Auditorium'],
  ['library_room', 'Library Room'],
];

const DAY_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const CATEGORY_DEFAULT_TYPES = {
  classroom: 'Classroom',
  lab: 'Laboratory',
  seminar_hall: 'Seminar Hall',
  sports_facility: 'Sports Facility',
  equipment: 'Equipment',
  auditorium: 'Auditorium',
  library_room: 'Library Room',
};

const createEmptyForm = () => ({
  name: '',
  category: 'classroom',
  location: '',
  capacity: '1',
  description: '',
  amenities: '',
  photos: '',
  daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  hoursStart: '08:00',
  hoursEnd: '17:00',
});

const parseCsv = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const mergeResourceLists = (incoming, existing) => {
  const next = new Map();

  incoming.forEach((resource) => {
    if (resource?._id) {
      next.set(resource._id, resource);
    }
  });

  existing.forEach((resource) => {
    if (resource?._id && !next.has(resource._id)) {
      next.set(resource._id, resource);
    }
  });

  return [...next.values()].sort(
    (left, right) => new Date(right.updatedAt || right.createdAt || 0) - new Date(left.updatedAt || left.createdAt || 0)
  );
};

const toFormState = (resource) => ({
  name: resource.name || '',
  category: resource.category || 'classroom',
  location: resource.location || '',
  capacity: String(resource.capacity || 1),
  description: resource.description || '',
  amenities: Array.isArray(resource.amenities) ? resource.amenities.join(', ') : '',
  photos: Array.isArray(resource.photos) ? resource.photos.join(', ') : '',
  daysAvailable: resource.availability?.daysAvailable?.length
    ? resource.availability.daysAvailable
    : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  hoursStart: resource.availability?.hoursAvailable?.start || '08:00',
  hoursEnd: resource.availability?.hoursAvailable?.end || '17:00',
});

const toPayload = (form) => ({
  name: form.name.trim(),
  type: CATEGORY_DEFAULT_TYPES[form.category] || 'Resource',
  category: form.category,
  location: form.location.trim(),
  capacity: Number(form.capacity),
  description: form.description.trim(),
  amenities: parseCsv(form.amenities),
  photos: parseCsv(form.photos),
  availability: {
    daysAvailable: form.daysAvailable,
    hoursAvailable: {
      start: form.hoursStart,
      end: form.hoursEnd,
    },
  },
});

const ResourceManagement = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [editingResourceId, setEditingResourceId] = useState(null);
  const [form, setForm] = useState(createEmptyForm());
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadResources = useCallback(async ({ showLoader = false } = {}) => {
    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    const response = await getAllResources();

    if (response.success && Array.isArray(response.resources)) {
      setResources((current) => mergeResourceLists(response.resources, current));
    } else {
      toast.error(response.message || 'Failed to load resources');
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadResources({ showLoader: true });
  }, [loadResources]);

  const activeCount = useMemo(
    () => resources.filter((resource) => resource.isActive).length,
    [resources]
  );

  const inactiveCount = useMemo(
    () => resources.filter((resource) => !resource.isActive).length,
    [resources]
  );

  const filteredResources = useMemo(
    () =>
      resources.filter((resource) => {
        const matchesSearch =
          !searchTerm ||
          resource.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resource.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          CATEGORY_OPTIONS.find(([value]) => value === resource.category)?.[1]
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase());

        const matchesCategory =
          categoryFilter === 'all' || resource.category === categoryFilter;

        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' && resource.isActive) ||
          (statusFilter === 'inactive' && !resource.isActive);

        return matchesSearch && matchesCategory && matchesStatus;
      }),
    [categoryFilter, resources, searchTerm, statusFilter]
  );

  const updateFormField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleDay = (day) => {
    setForm((current) => {
      const exists = current.daysAvailable.includes(day);
      return {
        ...current,
        daysAvailable: exists
          ? current.daysAvailable.filter((item) => item !== day)
          : [...current.daysAvailable, day],
      };
    });
  };

  const resetForm = () => {
    setEditingResourceId(null);
    setForm(createEmptyForm());
  };

  const startEditing = (resource) => {
    setEditingResourceId(resource._id);
    setForm(toFormState(resource));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.location.trim()) {
      toast.error('Name and location are required.');
      return;
    }

    if (Number(form.capacity) < 1) {
      toast.error('Capacity must be at least 1.');
      return;
    }

    if (!form.hoursStart || !form.hoursEnd || form.hoursStart >= form.hoursEnd) {
      toast.error('Availability end time must be later than the start time.');
      return;
    }

    setSaving(true);

    const payload = toPayload(form);
    const response = editingResourceId
      ? await updateResource(editingResourceId, payload)
      : await createResource(payload);

    setSaving(false);

    if (response.success && response.resource) {
      const saved = response.resource;
      setResources((current) =>
        mergeResourceLists(
          current.map((resource) =>
            resource._id === saved._id ? saved : resource
          ).concat(current.some((resource) => resource._id === saved._id) ? [] : [saved]),
          []
        )
      );
      toast.success(response.message || (editingResourceId ? 'Resource updated' : 'Resource created'));
      resetForm();
    } else {
      toast.error(response.message || 'Could not save resource');
    }
  };

  const handleToggle = async (resourceId) => {
    setTogglingId(resourceId);
    const response = await toggleResourceActive(resourceId);
    setTogglingId(null);

    if (response.success && response.resource) {
      setResources((current) =>
        mergeResourceLists(
          current.map((resource) =>
            resource._id === resourceId ? response.resource : resource
          ),
          []
        )
      );
      toast.success(response.message || 'Resource status updated');
    } else {
      toast.error(response.message || 'Could not update resource status');
    }
  };

  const handleDelete = async (resource) => {
    const name = resource?.name || 'this resource';
    const confirmed = window.confirm(`Delete "${name}" permanently? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setDeletingId(resource._id);
    const response = await deleteResource(resource._id);
    setDeletingId(null);

    if (response.success) {
      setResources((current) => current.filter((item) => item._id !== resource._id));
      if (editingResourceId === resource._id) {
        resetForm();
      }
      toast.success(response.message || 'Resource deleted');
    } else {
      toast.error(response.message || 'Could not delete resource');
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 mb-8 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.24em] uppercase text-blue-600">
              Admin Workspace
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">
              Resource Management
            </h1>
            <p className="mt-3 text-lg text-gray-600">
              Create, edit, and control which campus resources are available for booking.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadResources()}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 text-base font-semibold text-white transition-all duration-200 shadow-lg rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
          >
            <LuRefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="grid gap-4 mb-8 md:grid-cols-3">
          {[
            {
              label: 'Total Resources',
              value: resources.length,
              accent: 'from-blue-600 via-indigo-600 to-purple-600',
              glow: 'shadow-[0_20px_45px_-26px_rgba(79,70,229,0.55)]',
              ring: 'border-blue-200/70',
              iconBg: 'bg-white/18',
              icon: LuLayers3,
            },
            {
              label: 'Active',
              value: activeCount,
              accent: 'from-emerald-500 via-teal-500 to-cyan-500',
              glow: 'shadow-[0_20px_45px_-26px_rgba(16,185,129,0.55)]',
              ring: 'border-emerald-200/70',
              iconBg: 'bg-white/18',
              icon: LuShieldCheck,
            },
            {
              label: 'Inactive',
              value: inactiveCount,
              accent: 'from-slate-500 via-slate-600 to-slate-700',
              glow: 'shadow-[0_20px_45px_-26px_rgba(71,85,105,0.5)]',
              ring: 'border-slate-200/70',
              iconBg: 'bg-white/16',
              icon: LuShieldX,
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`relative overflow-hidden rounded-[26px] border ${card.ring} bg-gradient-to-br ${card.accent} p-6 text-white ${card.glow}`}
            >
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-10 left-0 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold tracking-[0.22em] uppercase text-white/80">{card.label}</p>
                  <p className="mt-4 text-5xl font-black tracking-tight text-white">{card.value}</p>
                </div>
                <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${card.iconBg} backdrop-blur-sm`}>
                  <card.icon className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-8 xl:grid-cols-[420px,1fr]">
          <form onSubmit={handleSubmit} className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingResourceId ? 'Edit resource' : 'Create resource'}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Fill the essential details and availability window below.
                </p>
              </div>
              {editingResourceId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200"
                >
                  <LuX className="w-4 h-4" />
                  Cancel edit
                </button>
              )}
            </div>

            <div className="grid gap-4 mt-6">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-700">Resource name</span>
                <input
                  value={form.name}
                  onChange={(event) => updateFormField('name', event.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  placeholder="Main Auditorium"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-700">Category</span>
                <select
                  value={form.category}
                  onChange={(event) => updateFormField('category', event.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                >
                  {CATEGORY_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-[minmax(0,1.4fr),minmax(160px,0.6fr)]">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-gray-700">Location</span>
                  <input
                    value={form.location}
                    onChange={(event) => updateFormField('location', event.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                    placeholder="Academic Block A"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-gray-700">Capacity</span>
                  <input
                    type="number"
                    min="1"
                    value={form.capacity}
                    onChange={(event) => updateFormField('capacity', event.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  />
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-700">Description</span>
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={(event) => updateFormField('description', event.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl resize-none focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  placeholder="Describe the resource, setup, and use case."
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-700">Amenities</span>
                <input
                  value={form.amenities}
                  onChange={(event) => updateFormField('amenities', event.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  placeholder="Projector, AC, Whiteboard"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-700">Photo URLs</span>
                <input
                  value={form.photos}
                  onChange={(event) => updateFormField('photos', event.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  placeholder="https://..., https://..."
                />
              </label>

              <div className="grid gap-2">
                <span className="text-sm font-semibold text-gray-700">Available days</span>
                <div className="flex flex-wrap gap-2">
                  {DAY_OPTIONS.map((day) => {
                    const checked = form.daysAvailable.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                          checked
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-gray-700">Start hour</span>
                  <input
                    type="time"
                    value={form.hoursStart}
                    onChange={(event) => updateFormField('hoursStart', event.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-gray-700">End hour</span>
                  <input
                    type="time"
                    value={form.hoursEnd}
                    onChange={(event) => updateFormField('hoursEnd', event.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center w-full gap-2 px-5 py-3 mt-6 text-base font-bold text-white transition-all duration-200 shadow-lg rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <LuCirclePlus className="w-5 h-5" />
              {saving
                ? editingResourceId
                  ? 'Saving changes...'
                  : 'Creating resource...'
                : editingResourceId
                  ? 'Save resource changes'
                  : 'Create resource'}
            </button>
          </form>

          <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
            <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Current resources</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Active resources load from the API, and status changes remain visible here while you work.
                </p>
              </div>
            </div>

            <div className="grid gap-4 mb-6 lg:grid-cols-[1.2fr,0.8fr,0.8fr]">
              <label className="relative block">
                <LuSearch className="absolute w-5 h-5 text-gray-400 left-4 top-1/2 -translate-y-1/2" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full py-3 pl-11 pr-4 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  placeholder="Search name, type, or location"
                />
              </label>

              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                <option value="all">All categories</option>
                {CATEGORY_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                <option value="all">All statuses</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only</option>
              </select>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
              </div>
            ) : filteredResources.length === 0 ? (
              <div className="p-10 text-center border border-dashed rounded-2xl bg-slate-50 border-slate-200">
                <p className="text-lg font-medium text-gray-700">No resources match these filters.</p>
                <p className="mt-2 text-gray-500">Try a broader search or create a new resource.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredResources.map((resource) => (
                  <div key={resource._id} className="p-5 border border-gray-200 shadow-sm rounded-2xl bg-gradient-to-br from-white to-slate-50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold tracking-[0.22em] uppercase text-gray-500">
                          {CATEGORY_OPTIONS.find(([value]) => value === resource.category)?.[1] || resource.category}
                        </p>
                        <h3 className="mt-2 text-2xl font-bold text-gray-900">{resource.name}</h3>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                          resource.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {resource.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="grid gap-3 mt-5 sm:grid-cols-2">
                      <div className="h-full p-4 rounded-xl bg-white/90">
                        <p className="text-xs font-semibold tracking-[0.18em] uppercase text-gray-500">Location</p>
                        <p className="mt-2 font-semibold leading-6 text-gray-900">{resource.location}</p>
                      </div>
                      <div className="h-full p-4 rounded-xl bg-white/90">
                        <p className="text-xs font-semibold tracking-[0.18em] uppercase text-gray-500">Capacity</p>
                        <p className="mt-2 text-2xl font-bold leading-6 text-gray-900">{resource.capacity}</p>
                      </div>
                    </div>

                    <div className="mt-4 text-sm text-gray-600">
                      <p>
                        <span className="font-semibold text-gray-700">Availability:</span>{' '}
                        {resource.availability?.hoursAvailable?.start || '--'} - {resource.availability?.hoursAvailable?.end || '--'}
                      </p>
                      <p className="mt-1">
                        <span className="font-semibold text-gray-700">Days:</span>{' '}
                        {resource.availability?.daysAvailable?.length
                          ? resource.availability.daysAvailable.join(', ')
                          : 'Not set'}
                      </p>
                    </div>

                    {resource.amenities?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {resource.amenities.slice(0, 4).map((amenity) => (
                          <span key={amenity} className="px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded-full">
                            {amenity}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 mt-5">
                      <button
                        type="button"
                        onClick={() => startEditing(resource)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-blue-700 bg-blue-50 rounded-xl hover:bg-blue-100"
                      >
                        <LuPencil className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggle(resource._id)}
                        disabled={togglingId === resource._id}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white ${
                          resource.isActive ? 'bg-gray-800 hover:bg-gray-900' : 'bg-green-600 hover:bg-green-700'
                        } disabled:cursor-not-allowed disabled:opacity-70`}
                      >
                        {resource.isActive ? <LuToggleLeft className="w-4 h-4" /> : <LuToggleRight className="w-4 h-4" />}
                        {togglingId === resource._id
                          ? 'Updating...'
                          : resource.isActive
                            ? 'Deactivate'
                            : 'Activate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(resource)}
                        disabled={deletingId === resource._id}
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-red-700 bg-red-50 rounded-xl hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <LuTrash2 className="w-4 h-4" />
                        {deletingId === resource._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceManagement;
