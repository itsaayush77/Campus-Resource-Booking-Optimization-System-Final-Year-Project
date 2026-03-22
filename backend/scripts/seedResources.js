const mongoose = require('mongoose');
const Resource = require('../models/Resource');
require('dotenv').config();

const resources = [
  {
    name: "Computer Lab 1",
    type: "Computer Laboratory",
    category: "lab",
    location: "IT Block, Ground Floor",
    capacity: 40,
    description: "Main computer lab with 40 workstations",
    photos: ["https://images.unsplash.com/photo-1498050108023-c5249f4df085"],
    amenities: ["Projector", "WiFi", "Air Conditioning", "Whiteboard", "Power Backup"],
    availability: {
      daysAvailable: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      hoursAvailable: { start: "07:00", end: "17:00" }
    },
    isActive: true
  },
  {
    name: "Computer Lab 2",
    type: "Computer Laboratory",
    category: "lab",
    location: "IT Block, First Floor",
    capacity: 35,
    description: "Secondary computer lab",
    photos: ["https://images.unsplash.com/photo-1517694712202-14dd9538aa97"],
    amenities: ["Projector", "WiFi", "Air Conditioning", "Whiteboard"],
    availability: {
      daysAvailable: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      hoursAvailable: { start: "07:00", end: "17:00" }
    },
    isActive: true
  },
  {
    name: "Physics Lab",
    type: "Science Laboratory",
    category: "lab",
    location: "Science Block, Second Floor",
    capacity: 30,
    description: "Well-equipped physics laboratory",
    photos: ["https://images.unsplash.com/photo-1532094349884-543bc11b234d"],
    amenities: ["Lab Equipment", "Safety Gear", "Storage Cabinets"],
    availability: {
      daysAvailable: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      hoursAvailable: { start: "08:00", end: "16:00" }
    },
    isActive: true
  },
  {
    name: "Chemistry Lab",
    type: "Science Laboratory",
    category: "lab",
    location: "Science Block, Third Floor",
    capacity: 25,
    description: "Chemistry laboratory with safety equipment",
    photos: ["https://images.unsplash.com/photo-1582719471384-894fbb16e074"],
    amenities: ["Fume Hoods", "Safety Showers", "Lab Equipment"],
    availability: {
      daysAvailable: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      hoursAvailable: { start: "08:00", end: "16:00" }
    },
    isActive: true
  },
  {
    name: "Classroom 101",
    type: "Lecture Hall",
    category: "classroom",
    location: "Academic Block A, Ground Floor",
    capacity: 60,
    description: "Standard classroom for lectures",
    photos: ["https://images.unsplash.com/photo-1562774053-701939374585"],
    amenities: ["Projector", "Whiteboard", "Sound System", "WiFi"],
    availability: {
      daysAvailable: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      hoursAvailable: { start: "07:00", end: "18:00" }
    },
    isActive: true
  },
  {
    name: "Classroom 201",
    type: "Lecture Hall",
    category: "classroom",
    location: "Academic Block A, Second Floor",
    capacity: 50,
    description: "Multimedia classroom",
    photos: ["https://images.unsplash.com/photo-1497633762265-9d179a990aa6"],
    amenities: ["Projector", "Whiteboard", "WiFi", "Air Conditioning"],
    availability: {
      daysAvailable: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      hoursAvailable: { start: "07:00", end: "18:00" }
    },
    isActive: true
  },
  {
    name: "Seminar Hall A",
    type: "Conference Room",
    category: "seminar_hall",
    location: "Main Building, Second Floor",
    capacity: 100,
    description: "Large seminar hall",
    photos: ["https://images.unsplash.com/photo-1505373877841-8d25f7d46678"],
    amenities: ["Projector", "Sound System", "Air Conditioning", "Stage", "WiFi"],
    availability: {
      daysAvailable: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      hoursAvailable: { start: "08:00", end: "18:00" }
    },
    isActive: true
  },
  {
    name: "Main Auditorium",
    type: "Auditorium",
    category: "auditorium",
    location: "Cultural Block",
    capacity: 300,
    description: "Main auditorium for large events",
    photos: ["https://images.unsplash.com/photo-1519750783826-e2420f4d687f"],
    amenities: ["Stage Lighting", "Sound System", "Projector", "Air Conditioning"],
    availability: {
      daysAvailable: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      hoursAvailable: { start: "08:00", end: "20:00" }
    },
    isActive: true
  },
  {
    name: "Basketball Court",
    type: "Outdoor Court",
    category: "sports_facility",
    location: "Sports Complex",
    capacity: 20,
    description: "Outdoor basketball court",
    photos: ["https://images.unsplash.com/photo-1546519638-68e109498ffc"],
    amenities: ["Basketball Hoops", "Seating Area", "Changing Room"],
    availability: {
      daysAvailable: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      hoursAvailable: { start: "06:00", end: "19:00" }
    },
    isActive: true
  },
  {
    name: "Futsal Ground",
    type: "Sports Ground",
    category: "sports_facility",
    location: "Sports Complex",
    capacity: 14,
    description: "Indoor futsal ground",
    photos: ["https://images.unsplash.com/photo-1551958219-acbc608c6377"],
    amenities: ["Goals", "Changing Room", "Lighting"],
    availability: {
      daysAvailable: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      hoursAvailable: { start: "06:00", end: "20:00" }
    },
    isActive: true
  },
  {
    name: "Reading Room 1",
    type: "Study Area",
    category: "library_room",
    location: "Central Library, Ground Floor",
    capacity: 80,
    description: "Silent reading room",
    photos: ["https://images.unsplash.com/photo-1521587760476-6c12a4b040da"],
    amenities: ["Study Tables", "WiFi", "Power Outlets", "Air Conditioning"],
    availability: {
      daysAvailable: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      hoursAvailable: { start: "07:00", end: "21:00" }
    },
    isActive: true
  },
  {
    name: "Projector Set 1",
    type: "Multimedia Equipment",
    category: "equipment",
    location: "Equipment Store",
    capacity: 1,
    description: "Portable projector with screen",
    photos: ["https://images.unsplash.com/photo-1517245386807-bb43f82c33c4"],
    amenities: ["HDMI Cable", "VGA Cable", "Remote Control"],
    availability: {
      daysAvailable: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      hoursAvailable: { start: "08:00", end: "17:00" }
    },
    isActive: true
  }
];

const seedResources = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📡 Connected to MongoDB');
    
    // Optional: Clear existing
    const count = await Resource.countDocuments();
    if (count > 0) {
      console.log(`⚠️  Found ${count} existing resources. Delete them? (y/n)`);
      // await Resource.deleteMany({});
    }
    
    await Resource.insertMany(resources);
    
    console.log('✅ Resources seeded successfully');
    console.log(`📊 Total resources: ${resources.length}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

seedResources();