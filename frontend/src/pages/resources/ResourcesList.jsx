import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getAllResources } from '../api/resourceApi'
import toast from 'react-hot-toast'

const ResourcesList = () => {
  const { type } = useParams()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCapacity, setSelectedCapacity] = useState('all')
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)

  // Category mapping
  const categoryMap = {
    'study-rooms': 'library_room',
    'labs': 'lab',
    'equipment': 'equipment',
    'meeting-rooms': 'seminar_hall',
    'sports': 'sports_facility',
    'auditoriums': 'auditorium',
    'classrooms': 'classroom'
  }

  const categoryTitles = {
    'study-rooms': { title: 'Study Rooms', icon: '📚' },
    'labs': { title: 'Laboratory Facilities', icon: '🔬' },
    'equipment': { title: 'Equipment', icon: '💻' },
    'meeting-rooms': { title: 'Meeting Rooms', icon: '🏢' },
    'sports': { title: 'Sports Facilities', icon: '⚽' },
    'auditoriums': { title: 'Auditoriums', icon: '🎭' },
    'classrooms': { title: 'Classrooms', icon: '📖' }
  }

  const currentCategory = categoryTitles[type] || categoryTitles['labs']

  useEffect(() => {
    fetchResources()
  }, [type])

  const fetchResources = async () => {
    try {
      setLoading(true)
      const category = categoryMap[type]
      const filters = category ? { category } : {}
      
      const response = await getAllResources(filters)
      
      if (response.success) {
        setResources(response.resources || response.data || [])
      } else {
        toast.error('Failed to load resources')
      }
    } catch (error) {
      console.error('Error fetching resources:', error)
      toast.error('Error loading resources')
    } finally {
      setLoading(false)
    }
  }

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCapacity = selectedCapacity === 'all' || 
      (selectedCapacity === 'small' && resource.capacity <= 10) ||
      (selectedCapacity === 'medium' && resource.capacity > 10 && resource.capacity <= 30) ||
      (selectedCapacity === 'large' && resource.capacity > 30)
    return matchesSearch && matchesCapacity
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading resources...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 text-6xl">{currentCategory.icon}</div>
          <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            {currentCategory.title}
          </h1>
          <p className="text-xl text-gray-600">
            Browse and book available resources
          </p>
        </div>

        {/* Filters */}
        <div className="p-6 mb-8 bg-white shadow-lg rounded-2xl">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Search Resources
              </label>
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 transition border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Filter by Capacity
              </label>
              <select
                value={selectedCapacity}
                onChange={(e) => setSelectedCapacity(e.target.value)}
                className="w-full px-4 py-3 transition border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Sizes</option>
                <option value="small">Small (1-10)</option>
                <option value="medium">Medium (11-30)</option>
                <option value="large">Large (30+)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((resource) => (
            <ResourceCard 
              key={resource._id} 
              resource={resource}
              onBook={() => navigate(`/resources/${resource._id}`)}
            />
          ))}
        </div>

        {filteredResources.length === 0 && (
          <div className="py-12 text-center">
            <div className="mb-4 text-6xl">🔍</div>
            <h3 className="mb-2 text-2xl font-bold text-gray-900">No resources found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  )
}

const ResourceCard = ({ resource, onBook }) => {
  return (
    <div className="overflow-hidden transition-all duration-300 transform bg-white border border-gray-100 shadow-lg rounded-2xl hover:shadow-2xl hover:-translate-y-2">
      <div className={`h-2 ${resource.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">{resource.name}</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            resource.isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {resource.isActive ? 'Available' : 'Unavailable'}
          </span>
        </div>

        <div className="mb-4 space-y-3">
          <div className="flex items-center text-gray-600">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="font-medium">Capacity: {resource.capacity}</span>
          </div>
          
          <div className="flex items-center text-gray-600">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{resource.location}</span>
          </div>

          <div className="flex items-center text-gray-600">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="text-sm">{resource.type}</span>
          </div>
        </div>

        {resource.amenities && resource.amenities.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-sm font-semibold text-gray-700">Amenities:</p>
            <div className="flex flex-wrap gap-2">
              {resource.amenities.slice(0, 3).map((amenity, index) => (
                <span 
                  key={index}
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
          onClick={onBook}
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
  )
}

export default ResourcesList