const mongoose = require('mongoose');
const Resource = require('../models/Resource');
require('dotenv').config();

const resources = [
  
  {
    name: 'Classroom 101',
    type: 'Lecture Room',
    category: 'classroom',
    description: 'Ground floor classroom with whiteboard and projector, suitable for lectures and presentations.',
    location: 'Academic Block, Ground Floor',
    capacity: 40,
    amenities: ['Whiteboard', 'Projector', 'Air Conditioning', 'Wi-Fi'],
    availability: {
      daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      hoursAvailable: { start: '07:00', end: '17:00' }
    },
    photos: ['https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800'],
    isActive: true
  },
  {
    name: 'Classroom 201',
    type: 'Lecture Room',
    category: 'classroom',
    description: 'First floor classroom with modern facilities, ideal for interactive sessions.',
    location: 'Academic Block, First Floor',
    capacity: 45,
    amenities: ['Smart Board', 'Projector', 'Air Conditioning', 'Wi-Fi', 'Sound System'],
    availability: {
      daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      hoursAvailable: { start: '07:00', end: '17:00' }
    },
    photos: ['https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800'],
    isActive: true
  },
  {
    name: 'Classroom 301',
    type: 'Lecture Room',
    category: 'classroom',
    description: 'Top floor classroom with excellent natural lighting and ventilation.',
    location: 'Academic Block, Second Floor',
    capacity: 50,
    amenities: ['Whiteboard', 'Projector', 'Air Conditioning', 'Wi-Fi'],
    availability: {
      daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      hoursAvailable: { start: '07:00', end: '17:00' }
    },
    photos: ['https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800'],
    isActive: true
  },
  {
    name: 'Classroom 102',
    type: 'Lecture Room',
    category: 'classroom',
    description: 'Ground floor classroom near entrance, convenient for all students.',
    location: 'Academic Block, Ground Floor',
    capacity: 35,
    amenities: ['Whiteboard', 'Projector', 'Wi-Fi'],
    availability: {
      daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      hoursAvailable: { start: '07:00', end: '17:00' }
    },
    photos: ['https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800'],
    isActive: true
  },
  {
    name: 'Lecture Hall A',
    type: 'Large Lecture Hall',
    category: 'classroom',
    description: 'Spacious lecture hall with tiered seating, perfect for large classes.',
    location: 'Academic Block, Ground Floor',
    capacity: 100,
    amenities: ['Smart Board', 'Projector', 'Microphone', 'Air Conditioning', 'Wi-Fi', 'Sound System'],
    availability: {
      daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      hoursAvailable: { start: '07:00', end: '17:00' }
    },
    photos: ['https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800'],
    isActive: true
  },
  {
    name: 'Lecture Hall B',
    type: 'Large Lecture Hall',
    category: 'classroom',
    description: 'Modern lecture hall with advanced AV equipment.',
    location: 'Academic Block, First Floor',
    capacity: 80,
    amenities: ['Smart Board', 'Projector', 'Microphone', 'Air Conditioning', 'Wi-Fi', 'Sound System'],
    availability: {
      daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      hoursAvailable: { start: '07:00', end: '17:00' }
    },
    photos: ['https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800'],
    isActive: true
  },

  // ========== LABS (7) ==========
  {
    name: 'Computer Lab 1',
    type: 'Computer Laboratory',
    category: 'lab',
    description: 'Main computer lab with 40 workstations, equipped with latest software for programming and design.',
    location: 'IT Block, Ground Floor',
    capacity: 40,
    amenities: ['40 Desktop PCs', 'Projector', 'Air Conditioning', 'Wi-Fi', 'Whiteboard', 'Printer'],
    availability: {
      daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      hoursAvailable: { start: '07:00', end: '17:00' }
    },
    photos: ['https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800'],
    isActive: true
  },
  {
    name: 'Computer Lab 2',
    type: 'Computer Laboratory',
    category: 'lab',
    description: 'Secondary computer lab with specialized software for data science and machine learning.',
    location: 'IT Block, First Floor',
    capacity: 35,
    amenities: ['35 Desktop PCs', 'Projector', 'Air Conditioning', 'Wi-Fi', 'Whiteboard'],
    availability: {
      daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      hoursAvailable: { start: '07:00', end: '17:00' }
    },
    photos: ['https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800'],
    isActive: true
  },
  {
    name: 'Computer Lab 3',
    type: 'Computer Laboratory',
    category: 'lab',
    description: 'Advanced computer lab for senior year projects and research work.',
    location: 'IT Block, Second Floor',
    capacity: 30,
    amenities: ['30 High-spec PCs', 'Projector', 'Air Conditioning', 'Wi-Fi', 'Smart Board'],
    availability: {
      daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      hoursAvailable: { start: '07:00', end: '17:00' }
    },
    photos: ['https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800'],
    isActive: true
  },
  {
    name: 'Physics Lab',
    type: 'Science Laboratory',
    category: 'lab',
    description: 'Well-equipped physics laboratory for experiments and practical sessions.',
    location: 'Science Block, Ground Floor',
    capacity: 30,
    amenities: ['Lab Equipment', 'Workbenches', 'Safety Equipment', 'Ventilation', 'Storage'],
    availability: {
      daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      hoursAvailable: { start: '08:00', end: '16:00' }
    },
    photos: ['https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800'],
    isActive: true
  },
  {
    name: 'Chemistry Lab',
    type: 'Science Laboratory',
    category: 'lab',
    description: 'Modern chemistry lab with fume hoods and safety equipment.',
    location: 'Science Block, First Floor',
    capacity: 30,
    amenities: ['Lab Equipment', 'Fume Hoods', 'Safety Equipment', 'Ventilation', 'Emergency Shower'],
    availability: {
      daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      hoursAvailable: { start: '08:00', end: '16:00' }
    },
    photos: ['https://images.unsplash.com/photo-1532187643603-ba119ca4109e?w=800'],
    isActive: true
  },
  {
    name: 'Biology Lab',
    type: 'Science Laboratory',
    category: 'lab',
    description: 'Biology laboratory with microscopes and specimen storage.',
    location: 'Science Block, First Floor',
    capacity: 30,
    amenities: ['Microscopes', 'Lab Equipment', 'Specimen Storage', 'Ventilation', 'Safety Equipment'],
    availability: {
      daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      hoursAvailable: { start: '08:00', end: '16:00' }
    },
    photos: ['https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800'],
    isActive: true
  },
  {
    name: 'Engineering Lab',
    type: 'Technical Laboratory',
    category: 'lab',
    description: 'Multipurpose engineering lab with CAD workstations and testing equipment.',
    location: 'Engineering Block, Ground Floor',
    capacity: 25,
    amenities: ['CAD Workstations', 'Testing Equipment', 'Tools', 'Safety Equipment', 'Storage'],
    availability: {
      daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      hoursAvailable: { start: '08:00', end: '16:00' }
    },
    photos: ['https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=800'],
    isActive: true
  },

  // ========== SEMINAR HALLS (3) ==========
  {
    name: 'Seminar Hall A',
    type: 'Seminar Room',
    category: 'seminar_hall',
    description: 'Main seminar hall for workshops, guest lectures and seminars with modern facilities.',
    location: 'Main Building, First Floor',
    capacity: 60,
    amenities: ['Projector', 'Sound System', 'Air Conditioning', 'Wi-Fi', 'Podium', 'Microphone'],
    availability: {
      daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      hoursAvailable: { start: '07:00', end: '18:00' }
    },
    photos: ['https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800'],
    isActive: true
  },
  {
    name: 'Seminar Hall B',
    type: 'Seminar Room',
    category: 'seminar_hall',
    description: 'Secondary seminar hall for smaller workshops and group discussions.',
    location: 'Main Building, Second Floor',
    capacity: 40,
    amenities: ['Projector', 'Sound System', 'Air Conditioning', 'Wi-Fi', 'Whiteboard'],
    availability: {
      daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      hoursAvailable: { start: '07:00', end: '18:00' }
    },
    photos: ['https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800'],
    isActive: true
  },
  {
    name: 'Seminar Hall C',
    type: 'Seminar Room',
    category: 'seminar_hall',
    description: 'Compact seminar room ideal for department meetings and small events.',
    location: 'Academic Block, Second Floor',
    capacity: 30,
    amenities: ['Projector', 'Air Conditioning', 'Wi-Fi', 'Whiteboard'],
    availability: {
      daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      hoursAvailable: { start: '07:00', end: '17:00' }
    },
    photos: ['https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800'],
    isActive: true
  },

  // ========== AUDITORIUMS (2) ==========
  {
    name: 'Main Auditorium',
    type: 'Large Auditorium',
    category: 'auditorium',
    description: 'Large auditorium for major events, cultural programs, and convocations with professional stage.',
    location: 'Main Building, Ground Floor',
    capacity: 300,
    amenities: ['Stage', 'Sound System', 'Lighting', 'Projector', 'Air Conditioning', 'Green Room', 'Microphones'],
    availability: {
      daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      hoursAvailable: { start: '08:00', end: '20:00' }
    },
    photos: ['https://images.unsplash.com/photo-1519214605650-76a613ee3245?w=800'],
    isActive: true
  },
  {
    name: 'Mini Auditorium',
    type: 'Small Auditorium',
    category: 'auditorium',
    description: 'Smaller auditorium for departmental events and presentations.',
    location: 'Academic Block, First Floor',
    capacity: 150,
    amenities: ['Stage', 'Sound System', 'Projector', 'Air Conditioning', 'Microphones'],
    availability: {
      daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      hoursAvailable: { start: '08:00', end: '18:00' }
    },
    photos: ['https://images.unsplash.com/photo-1519214605650-76a613ee3245?w=800'],
    isActive: true
  },

  // ========== SPORTS FACILITIES (4) ==========
  {
    name: 'Basketball Court',
    type: 'Sports Court',
    category: 'sports_facility',
    description: 'Indoor basketball court with proper flooring and hoops.',
    location: 'Sports Complex, Ground Floor',
    capacity: 20,
    amenities: ['Basketball Hoops', 'Scoreboard', 'Changing Room', 'Seating Area'],
    availability: {
      daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      hoursAvailable: { start: '06:00', end: '20:00' }
    },
    photos: ['https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800'],
    isActive: true
  },
  {
    name: 'Futsal Ground',
    type: 'Sports Ground',
    category: 'sports_facility',
    description: 'Outdoor futsal ground with artificial turf and floodlights.',
    location: 'Sports Complex, Outdoor Area',
    capacity: 14,
    amenities: ['Artificial Turf', 'Goals', 'Floodlights', 'Changing Room', 'Seating'],
    availability: {
      daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      hoursAvailable: { start: '06:00', end: '21:00' }
    },
    photos: ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800'],
    isActive: true
  },
  {
    name: 'Badminton Court',
    type: 'Sports Court',
    category: 'sports_facility',
    description: 'Indoor badminton court with professional markings and nets.',
    location: 'Sports Complex, Ground Floor',
    capacity: 10,
    amenities: ['Badminton Nets', 'Proper Flooring', 'Changing Room', 'Equipment Storage'],
    availability: {
      daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      hoursAvailable: { start: '06:00', end: '20:00' }
    },
    photos: ['https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800'],
    isActive: true
  },
  {
    name: 'Table Tennis Room',
    type: 'Indoor Sports',
    category: 'sports_facility',
    description: 'Dedicated room with table tennis tables and equipment.',
    location: 'Sports Complex, First Floor',
    capacity: 12,
    amenities: ['TT Tables', 'Equipment', 'Changing Room', 'Seating'],
    availability: {
      daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      hoursAvailable: { start: '06:00', end: '20:00' }
    },
    photos: ['https://images.unsplash.com/photo-1534158914592-062992fbe900?w=800'],
    isActive: true
  },

  // ========== LIBRARY ROOMS (2) ==========
  {
    name: 'Reading Room 1',
    type: 'Study Area',
    category: 'library_room',
    description: 'Silent reading room with individual study desks and good lighting.',
    location: 'Central Library, Ground Floor',
    capacity: 80,
    amenities: ['Study Tables', 'Wi-Fi', 'Power Outlets', 'Air Conditioning'],
    availability: {
      daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      hoursAvailable: { start: '07:00', end: '21:00' }
    },
    photos: ['https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800'],
    isActive: true
  },
  {
    name: 'Reading Room 2',
    type: 'Study Area',
    category: 'library_room',
    description: 'Group study area for collaborative learning.',
    location: 'Central Library, First Floor',
    capacity: 50,
    amenities: ['Study Tables', 'Whiteboards', 'Wi-Fi', 'Power Outlets', 'Air Conditioning'],
    availability: {
      daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      hoursAvailable: { start: '07:00', end: '21:00' }
    },
    photos: ['https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800'],
    isActive: true
  },

  // ========== MEETING ROOMS (2) ==========
  {
    name: 'Conference Room A',
    type: 'Meeting Room',
    category: 'seminar_hall',
    description: 'Executive conference room for official meetings and discussions.',
    location: 'Administration Block, Second Floor',
    capacity: 20,
    amenities: ['Conference Table', 'Projector', 'Video Conferencing', 'Wi-Fi', 'Air Conditioning', 'Whiteboard'],
    availability: {
      daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      hoursAvailable: { start: '09:00', end: '17:00' }
    },
    photos: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=800'],
    isActive: true
  },
  {
    name: 'Conference Room B',
    type: 'Meeting Room',
    category: 'seminar_hall',
    description: 'Smaller meeting room for department meetings and interviews.',
    location: 'Administration Block, First Floor',
    capacity: 12,
    amenities: ['Meeting Table', 'Projector', 'Wi-Fi', 'Air Conditioning', 'Whiteboard'],
    availability: {
      daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      hoursAvailable: { start: '09:00', end: '17:00' }
    },
    photos: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=800'],
    isActive: true
  },

  // ========== EQUIPMENT (3) ==========
  {
    name: 'Projector Set 1',
    type: 'Portable Equipment',
    category: 'equipment',
    description: 'High-quality portable projector with screen and sound system for events.',
    location: 'Equipment Room, Main Building',
    capacity: 1,
    amenities: ['HD Projector', 'Portable Screen', 'Cables', 'Remote', 'Carry Case'],
    availability: {
      daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      hoursAvailable: { start: '08:00', end: '17:00' }
    },
    photos: ['https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=800'],
    isActive: true
  },
  {
    name: 'Projector Set 2',
    type: 'Portable Equipment',
    category: 'equipment',
    description: 'Secondary projector set for simultaneous events.',
    location: 'Equipment Room, Main Building',
    capacity: 1,
    amenities: ['HD Projector', 'Portable Screen', 'Cables', 'Remote', 'Carry Case'],
    availability: {
      daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      hoursAvailable: { start: '08:00', end: '17:00' }
    },
    photos: ['https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=800'],
    isActive: true
  },
  {
    name: 'Sound System',
    type: 'Portable Equipment',
    category: 'equipment',
    description: 'Professional sound system with microphones and speakers for outdoor events.',
    location: 'Equipment Room, Main Building',
    capacity: 1,
    amenities: ['Speakers', 'Microphones', 'Mixer', 'Cables', 'Stand'],
    availability: {
      daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      hoursAvailable: { start: '08:00', end: '17:00' }
    },
    photos: ['https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800'],
    isActive: true
  }
];

const seedResources = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📦 Connected to MongoDB');

    // Clear existing resources (optional - remove if you want to keep old data)
    await Resource.deleteMany({});
    console.log('🗑️  Cleared existing resources');

    // Insert new resources
    const created = await Resource.insertMany(resources);
    console.log(`✅ Successfully seeded ${created.length} resources`);

    // Display summary
    const summary = {};
    resources.forEach(r => {
      summary[r.category] = (summary[r.category] || 0) + 1;
    });

    console.log('\n📊 Resources by category:');
    Object.entries(summary).forEach(([category, count]) => {
      console.log(`   ${category}: ${count}`);
    });

    console.log(`\n Total: ${created.length} resources created!\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding resources:', error);
    process.exit(1);
  }
};

seedResources();