import { useState } from 'react'
import { Link } from 'react-router-dom'

const BrowseResources = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedCapacity, setSelectedCapacity] = useState('all')
  const [selectedAvailability, setSelectedAvailability] = useState('all')

  // Mock data - will be replaced with API calls later
  const resourceData = {
    'study-rooms': {
      title: 'Study Rooms',
      icon: '📚',
      type: 'study-rooms',
      color: 'from-blue-500 to-cyan-500',
      resources: [
        { id: 1, name: 'Study Room A1', capacity: 4, floor: '1st Floor', available: true, amenities: ['Whiteboard', 'WiFi', 'Power Outlets'] },
        { id: 2, name: 'Study Room A2', capacity: 6, floor: '1st Floor', available: true, amenities: ['Whiteboard', 'WiFi', 'Projector'] },
        { id: 3, name: 'Study Room B1', capacity: 8, floor: '2nd Floor', available: false, amenities: ['Whiteboard', 'WiFi', 'TV Screen'] },
        { id: 4, name: 'Study Room B2', capacity: 4, floor: '2nd Floor', available: true, amenities: ['Whiteboard', 'WiFi'] },
      ]
    },
    'labs': {
      title: 'Laboratory Facilities',
      icon: '🔬',
      type: 'labs',
      color: 'from-purple-500 to-pink-500',
      resources: [
        { id: 5, name: 'Computer Lab 1', capacity: 30, floor: '3rd Floor', available: true, amenities: ['30 PCs', 'Projector', 'WiFi'] },
        { id: 6, name: 'Computer Lab 2', capacity: 25, floor: '3rd Floor', available: false, amenities: ['25 PCs', 'Projector'] },
        { id: 7, name: 'Physics Lab', capacity: 20, floor: '4th Floor', available: true, amenities: ['Lab Equipment', 'Safety Gear'] },
        { id: 8, name: 'Chemistry Lab', capacity: 20, floor: '4th Floor', available: true, amenities: ['Lab Equipment', 'Fume Hood'] },
      ]
    },
    'equipment': {
      title: 'Equipment',
      icon: '💻',
      type: 'equipment',
      color: 'from-green-500 to-emerald-500',
      resources: [
        { id: 9, name: 'Projector Set', capacity: 1, location: 'Equipment Room', available: true, amenities: ['HDMI', 'Remote', 'Cables'] },
        { id: 10, name: 'Laptop - Dell', capacity: 1, location: 'IT Department', available: true, amenities: ['Charger', 'Mouse'] },
        { id: 11, name: 'Camera Kit', capacity: 1, location: 'Media Room', available: false, amenities: ['Tripod', 'SD Card', 'Batteries'] },
        { id: 12, name: 'Microphone Set', capacity: 1, location: 'Media Room', available: true, amenities: ['Stand', 'Cables', 'Pop Filter'] },
      ]
    },
    'meeting-rooms': {
      title: 'Meeting Rooms',
      icon: '🏢',
      type: 'meeting-rooms',
      color: 'from-orange-500 to-red-500',
      resources: [
        { id: 13, name: 'Conference Room A', capacity: 20, floor: '5th Floor', available: true, amenities: ['Projector', 'Whiteboard', 'Video Conf'] },
        { id: 14, name: 'Conference Room B', capacity: 15, floor: '5th Floor', available: true, amenities: ['TV Screen', 'Whiteboard'] },
        { id: 15, name: 'Board Room', capacity: 12, floor: '6th Floor', available: false, amenities: ['Projector', 'Video Conf', 'Coffee'] },
      ]
    },
    'sports': {
      title: 'Sports Facilities',
      icon: '⚽',
      type: 'sports',
      color: 'from-indigo-500 to-purple-500',
      resources: [
        { id: 16, name: 'Basketball Court', capacity: 20, location: 'Sports Complex', available: true, amenities: ['Balls', 'Scoreboard'] },
        { id: 17, name: 'Tennis Court', capacity: 4, location: 'Sports Complex', available: true, amenities: ['Nets', 'Rackets'] },
        { id: 18, name: 'Badminton Court', capacity: 4, location: 'Indoor Arena', available: false, amenities: ['Nets', 'Shuttles'] },
      ]
    },
    'auditoriums': {
      title: 'Auditoriums',
      icon: '🎭',
      type: 'auditoriums',
      color: 'from-yellow-500 to-orange-500',
      resources: [
        { id: 19, name: 'Main Auditorium', capacity: 500, floor: 'Ground Floor', available: true, amenities: ['Stage', 'Sound System', 'Projector', 'AC'] },
        { id: 20, name: 'Mini Auditorium', capacity: 150, floor: '2nd Floor', available: true, amenities: ['Projector', 'Sound System'] },
      ]
    }
  }

  // Flatten all resources with their category info
  const allResources = Object.values(resourceData).flatMap(category => 
    category.resources.map(resource => ({
      ...resource,
      category: category.type,
      categoryTitle: category.title,
      categoryIcon: category.icon,
      categoryColor: category.color
    }))
  )

  // Filter resources
  const filteredResources = allResources.filter(resource => {
    const matchesSearch = resource.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory
    const matchesCapacity = selectedCapacity === 'all' || 
      (selectedCapacity === 'small' && resource.capacity <= 10) ||
      (selectedCapacity === 'medium' && resource.capacity > 10 && resource.capacity <= 30) ||
      (selectedCapacity === 'large' && resource.capacity > 30)
    const matchesAvailability = selectedAvailability === 'all' || 
      (selectedAvailability === 'available' && resource.available) ||
      (selectedAvailability === 'unavailable' && !resource.available)
    
    return matchesSearch && matchesCategory && matchesCapacity && matchesAvailability
  })

  const categories = Object.values(resourceData)

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('all')
    setSelectedCapacity('all')
    setSelectedAvailability('all')
  }

  const hasActiveFilters = searchTerm || selectedCategory !== 'all' || selectedCapacity !== 'all' || selectedAvailability !== 'all'

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-block px-4 py-2 mb-4 text-sm font-semibold text-blue-800 bg-blue-100 rounded-full">
            🔍 Explore All Resources
          </div>
          <h1 className="mb-4 text-4xl font-extrabold text-gray-900 md:text-5xl">
            Browse All Resources
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-gray-600">
            Discover and book from our wide range of campus facilities and equipment
          </p>
        </div>

        {/* Category Cards */}
        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">Quick Access by Category</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <Link
                key={category.type}
                to={`/resources/${category.type}`}
                className="relative overflow-hidden transition-all duration-300 transform bg-white border border-gray-100 shadow-lg rounded-2xl hover:shadow-2xl hover:-translate-y-1 group"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                <div className="relative p-4 sm:p-6">
                  <div className="mb-2 text-4xl text-center transition-transform duration-200 sm:mb-3 sm:text-5xl group-hover:scale-110">
                    {category.icon}
                  </div>
                  <h3 className="text-xs font-semibold text-center text-gray-900 transition-colors duration-200 sm:text-sm group-hover:text-blue-600">
                    {category.title}
                  </h3>
                  <p className="mt-1 text-xs text-center text-gray-500 sm:mt-2">
                    {category.resources.length} {category.resources.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 mb-8 bg-white shadow-lg rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Filter Resources</h2>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center px-4 py-2 space-x-2 text-sm font-semibold text-blue-600 transition-colors duration-200 rounded-lg bg-blue-50 hover:bg-blue-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Clear Filters</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Search Resources
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 transition border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute text-gray-400 transition-colors duration-200 transform -translate-y-1/2 right-3 top-1/2 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 transition border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.type} value={category.type}>
                    {category.icon} {category.title}
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
                className="w-full px-4 py-3 transition border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Sizes</option>
                <option value="small">Small (1-10)</option>
                <option value="medium">Medium (11-30)</option>
                <option value="large">Large (30+)</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Availability
              </label>
              <select
                value={selectedAvailability}
                onChange={(e) => setSelectedAvailability(e.target.value)}
                className="w-full px-4 py-3 transition border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="available">✅ Available Only</option>
                <option value="unavailable">❌ Unavailable Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count & Sort */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-gray-600">
              Showing <span className="font-bold text-blue-600">{filteredResources.length}</span> of{' '}
              <span className="font-semibold text-gray-900">{allResources.length}</span> resources
            </p>
          </div>
        </div>

        {/* Resources Grid */}
        {filteredResources.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="mb-4 text-6xl">🔍</div>
            <h3 className="mb-2 text-2xl font-bold text-gray-900">No resources found</h3>
            <p className="mb-6 text-gray-600">Try adjusting your search or filters</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-6 py-3 font-semibold text-white transition-all duration-200 transform rounded-lg shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:-translate-y-1"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const ResourceCard = ({ resource }) => {
  return (
    <div className="overflow-hidden transition-all duration-300 transform bg-white border border-gray-100 shadow-lg rounded-2xl hover:shadow-2xl hover:-translate-y-2">
      <div className={`h-2 bg-gradient-to-r ${resource.categoryColor}`}></div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl transition-transform duration-200 hover:scale-110">
              {resource.categoryIcon}
            </span>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{resource.name}</h3>
              <p className="text-sm text-gray-500">{resource.categoryTitle}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
            resource.available 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {resource.available ? '✓ Available' : '✕ Booked'}
          </span>
        </div>

        <div className="mb-4 space-y-2">
          <div className="flex items-center text-gray-600">
            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="font-medium">Capacity: {resource.capacity} {resource.capacity === 1 ? 'person' : 'people'}</span>
          </div>
          
          <div className="flex items-center text-gray-600">
            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{resource.floor || resource.location}</span>
          </div>
        </div>

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
              <span className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg">
                +{resource.amenities.length - 3} more
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            to={`/resources/${resource.category}`}
            className="flex items-center justify-center flex-1 py-2.5 space-x-1 text-sm font-semibold text-blue-600 transition-all duration-200 bg-blue-50 rounded-lg hover:bg-blue-100"
          >
            <span>View Category</span>
          </Link>
          <button
            disabled={!resource.available}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              resource.available
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {resource.available ? 'Book Now' : 'Not Available'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default BrowseResources