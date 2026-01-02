import { useParams } from 'react-router-dom'
import { useState } from 'react'

const ResourcesList = () => {
  const { type } = useParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCapacity, setSelectedCapacity] = useState('all')

  // Mock data - will be replaced with API calls later
  const resourceData = {
    'study-rooms': {
      title: 'Study Rooms',
      icon: '📚',
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
      resources: [
        { id: 1, name: 'Computer Lab 1', capacity: 30, floor: '3rd Floor', available: true, amenities: ['30 PCs', 'Projector', 'WiFi'] },
        { id: 2, name: 'Computer Lab 2', capacity: 25, floor: '3rd Floor', available: false, amenities: ['25 PCs', 'Projector'] },
        { id: 3, name: 'Physics Lab', capacity: 20, floor: '4th Floor', available: true, amenities: ['Lab Equipment', 'Safety Gear'] },
        { id: 4, name: 'Chemistry Lab', capacity: 20, floor: '4th Floor', available: true, amenities: ['Lab Equipment', 'Fume Hood'] },
      ]
    },
    'equipment': {
      title: 'Equipment',
      icon: '💻',
      resources: [
        { id: 1, name: 'Projector Set', capacity: 1, location: 'Equipment Room', available: true, amenities: ['HDMI', 'Remote', 'Cables'] },
        { id: 2, name: 'Laptop - Dell', capacity: 1, location: 'IT Department', available: true, amenities: ['Charger', 'Mouse'] },
        { id: 3, name: 'Camera Kit', capacity: 1, location: 'Media Room', available: false, amenities: ['Tripod', 'SD Card', 'Batteries'] },
        { id: 4, name: 'Microphone Set', capacity: 1, location: 'Media Room', available: true, amenities: ['Stand', 'Cables', 'Pop Filter'] },
      ]
    },
    'meeting-rooms': {
      title: 'Meeting Rooms',
      icon: '🏢',
      resources: [
        { id: 1, name: 'Conference Room A', capacity: 20, floor: '5th Floor', available: true, amenities: ['Projector', 'Whiteboard', 'Video Conf'] },
        { id: 2, name: 'Conference Room B', capacity: 15, floor: '5th Floor', available: true, amenities: ['TV Screen', 'Whiteboard'] },
        { id: 3, name: 'Board Room', capacity: 12, floor: '6th Floor', available: false, amenities: ['Projector', 'Video Conf', 'Coffee'] },
      ]
    },
    'sports': {
      title: 'Sports Facilities',
      icon: '⚽',
      resources: [
        { id: 1, name: 'Basketball Court', capacity: 20, location: 'Sports Complex', available: true, amenities: ['Balls', 'Scoreboard'] },
        { id: 2, name: 'Tennis Court', capacity: 4, location: 'Sports Complex', available: true, amenities: ['Nets', 'Rackets'] },
        { id: 3, name: 'Badminton Court', capacity: 4, location: 'Indoor Arena', available: false, amenities: ['Nets', 'Shuttles'] },
      ]
    },
    'auditoriums': {
      title: 'Auditoriums',
      icon: '🎭',
      resources: [
        { id: 1, name: 'Main Auditorium', capacity: 500, floor: 'Ground Floor', available: true, amenities: ['Stage', 'Sound System', 'Projector', 'AC'] },
        { id: 2, name: 'Mini Auditorium', capacity: 150, floor: '2nd Floor', available: true, amenities: ['Projector', 'Sound System'] },
      ]
    }
  }

  const currentCategory = resourceData[type] || resourceData['study-rooms']
  
  const filteredResources = currentCategory.resources.filter(resource => {
    const matchesSearch = resource.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCapacity = selectedCapacity === 'all' || 
      (selectedCapacity === 'small' && resource.capacity <= 10) ||
      (selectedCapacity === 'medium' && resource.capacity > 10 && resource.capacity <= 30) ||
      (selectedCapacity === 'large' && resource.capacity > 30)
    return matchesSearch && matchesCapacity
  })

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
            <ResourceCard key={resource.id} resource={resource} />
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

const ResourceCard = ({ resource }) => {
  return (
    <div className="overflow-hidden transition-all duration-300 transform bg-white border border-gray-100 shadow-lg rounded-2xl hover:shadow-2xl hover:-translate-y-2">
      <div className={`h-2 ${resource.available ? 'bg-green-500' : 'bg-red-500'}`}></div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">{resource.name}</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            resource.available 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {resource.available ? 'Available' : 'Booked'}
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
            <span>{resource.floor || resource.location}</span>
          </div>
        </div>

        <div className="mb-4">
          <p className="mb-2 text-sm font-semibold text-gray-700">Amenities:</p>
          <div className="flex flex-wrap gap-2">
            {resource.amenities.map((amenity, index) => (
              <span 
                key={index}
                className="px-3 py-1 text-xs font-medium text-blue-700 rounded-lg bg-blue-50"
              >
                {amenity}
              </span>
            ))}
          </div>
        </div>

        <button
          disabled={!resource.available}
          className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
            resource.available
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {resource.available ? 'Book Now' : 'Not Available'}
        </button>
      </div>
    </div>
  )
}

export default ResourcesList