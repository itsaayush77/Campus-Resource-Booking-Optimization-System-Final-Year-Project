const crypto = require('crypto');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const dotenv = require('dotenv');

const User = require('../models/User');
const Resource = require('../models/Resource');
const Booking = require('../models/Bookings');
const Notification = require('../models/Notification');

dotenv.config();

const hasForceFlag = process.argv.includes('--force');

const makeDate = (dayOffset, hours, minutes = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const buildQr = async (bookingId) => {
  const token = crypto.randomBytes(12).toString('hex');
  const qrCode = `${bookingId.toString()}|${token}`;
  const qrCodeImage = await QRCode.toDataURL(qrCode, { margin: 1, width: 240 });
  return { qrCode, qrCodeImage };
};

const seedUsers = async () => {
  const users = [
    {
      name: 'Admin User',
      email: 'admin@campusbook.local',
      password: 'Admin@123',
      role: 'admin',
      department: 'Administration',
      isActive: true,
    },
    {
      name: 'Staff Coordinator',
      email: 'staff.coordinator@campusbook.local',
      password: 'Staff@123',
      role: 'staff',
      department: 'Student Affairs',
      isActive: true,
    },
    {
      name: 'Staff Labs',
      email: 'staff.labs@campusbook.local',
      password: 'Staff@123',
      role: 'staff',
      department: 'Engineering',
      isActive: true,
    },
    {
      name: 'Student One',
      email: 'student.one@campusbook.local',
      password: 'Student@123',
      role: 'student',
      department: 'Computer Science',
      isActive: true,
    },
    {
      name: 'Student Two',
      email: 'student.two@campusbook.local',
      password: 'Student@123',
      role: 'student',
      department: 'Electronics',
      isActive: true,
    },
    {
      name: 'Student Three',
      email: 'student.three@campusbook.local',
      password: 'Student@123',
      role: 'student',
      department: 'Civil',
      isActive: true,
      noShowCount: 1,
    },
  ];

  const created = [];
  for (const payload of users) {
    const user = new User(payload);
    await user.save();
    created.push(user);
  }

  return {
    created,
    admin: created.find((user) => user.role === 'admin'),
    staff: created.filter((user) => user.role === 'staff'),
    students: created.filter((user) => user.role === 'student'),
  };
};

const seedResources = async (adminId) => {
  const resources = [
    {
      name: 'Classroom A-101',
      type: 'Lecture Room',
      category: 'classroom',
      location: 'Academic Block A',
      capacity: 45,
      description: 'Smart classroom for lectures and tutorials.',
      amenities: ['Projector', 'Whiteboard', 'Wi-Fi'],
      availability: {
        daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        hoursAvailable: { start: '08:00', end: '17:00' },
      },
      createdBy: adminId,
      isActive: true,
    },
    {
      name: 'Computer Lab CL-2',
      type: 'Computer Laboratory',
      category: 'lab',
      location: 'IT Block',
      capacity: 35,
      description: 'Lab with 35 high-spec systems.',
      amenities: ['Desktop PCs', 'Projector', 'Air Conditioning'],
      availability: {
        daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        hoursAvailable: { start: '08:00', end: '18:00' },
      },
      createdBy: adminId,
      isActive: true,
    },
    {
      name: 'Seminar Hall S-1',
      type: 'Seminar Hall',
      category: 'seminar_hall',
      location: 'Main Building',
      capacity: 80,
      description: 'Seminar hall for workshops and guest lectures.',
      amenities: ['PA System', 'Projector', 'Podium'],
      availability: {
        daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        hoursAvailable: { start: '09:00', end: '18:00' },
      },
      createdBy: adminId,
      isActive: true,
    },
    {
      name: 'Indoor Sports Arena',
      type: 'Sports Facility',
      category: 'sports_facility',
      location: 'Sports Complex',
      capacity: 60,
      description: 'Indoor multi-sports facility.',
      amenities: ['Changing Room', 'Scoreboard'],
      availability: {
        daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        hoursAvailable: { start: '06:00', end: '21:00' },
      },
      createdBy: adminId,
      isActive: true,
    },
    {
      name: 'Main Auditorium',
      type: 'Auditorium',
      category: 'auditorium',
      location: 'Central Hall',
      capacity: 300,
      description: 'Main event auditorium.',
      amenities: ['Stage', 'Lighting', 'Sound System'],
      availability: {
        daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        hoursAvailable: { start: '09:00', end: '20:00' },
      },
      createdBy: adminId,
      isActive: true,
    },
    {
      name: 'Library Discussion Room',
      type: 'Library Room',
      category: 'library_room',
      location: 'Central Library',
      capacity: 20,
      description: 'Quiet room for small group study.',
      amenities: ['Whiteboard', 'Power Outlets'],
      availability: {
        daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        hoursAvailable: { start: '08:00', end: '20:00' },
      },
      createdBy: adminId,
      isActive: true,
    },
    {
      name: 'Portable Projector Kit',
      type: 'Equipment',
      category: 'equipment',
      location: 'Equipment Desk',
      capacity: 1,
      description: 'Projector + screen + HDMI cable.',
      amenities: ['Projector', 'Portable Screen'],
      availability: {
        daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        hoursAvailable: { start: '09:00', end: '17:00' },
      },
      createdBy: adminId,
      isActive: true,
    },
    {
      name: 'Chemistry Lab C-1',
      type: 'Science Laboratory',
      category: 'lab',
      location: 'Science Block',
      capacity: 25,
      description: 'Chemistry practical sessions lab.',
      amenities: ['Fume Hood', 'Safety Kit'],
      availability: {
        daysAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        hoursAvailable: { start: '08:00', end: '16:00' },
      },
      createdBy: adminId,
      isActive: false,
    },
  ];

  return Resource.insertMany(resources);
};

const seedBookings = async ({ admin, staff, students, resources }) => {
  const [studentOne, studentTwo, studentThree] = students;
  const [staffCoordinator] = staff;

  const findResource = (name) => resources.find((resource) => resource.name === name);

  const pendingBooking = await Booking.create({
    userId: studentOne._id,
    resourceId: findResource('Classroom A-101')._id,
    startTime: makeDate(2, 10, 0),
    endTime: makeDate(2, 11, 30),
    purpose: 'Data Structures tutorial',
    expectedAttendees: 32,
    status: 'pending',
    notes: 'Need projector and whiteboard.',
  });

  const approvedBooking = await Booking.create({
    userId: studentTwo._id,
    resourceId: findResource('Computer Lab CL-2')._id,
    startTime: makeDate(1, 14, 0),
    endTime: makeDate(1, 16, 0),
    purpose: 'Machine Learning lab practice',
    expectedAttendees: 28,
    status: 'approved',
    approvedBy: admin._id,
    approvedAt: makeDate(0, 18, 30),
    notes: 'Python and Jupyter setup required.',
  });

  const rejectedBooking = await Booking.create({
    userId: studentOne._id,
    resourceId: findResource('Seminar Hall S-1')._id,
    startTime: makeDate(3, 9, 0),
    endTime: makeDate(3, 11, 0),
    purpose: 'Department orientation rehearsal',
    expectedAttendees: 70,
    status: 'rejected',
    approvedBy: admin._id,
    approvedAt: makeDate(0, 17, 45),
    rejectionReason: 'Hall already reserved for convocation prep.',
  });

  const cancelledBooking = await Booking.create({
    userId: staffCoordinator._id,
    resourceId: findResource('Portable Projector Kit')._id,
    startTime: makeDate(4, 13, 0),
    endTime: makeDate(4, 15, 0),
    purpose: 'Student club workshop',
    expectedAttendees: 1,
    status: 'cancelled',
    cancelledAt: makeDate(1, 9, 30),
    cancellationReason: 'Event postponed by department.',
  });

  const completedBooking = await Booking.create({
    userId: studentTwo._id,
    resourceId: findResource('Library Discussion Room')._id,
    startTime: makeDate(-2, 11, 0),
    endTime: makeDate(-2, 12, 30),
    purpose: 'Project planning session',
    expectedAttendees: 6,
    status: 'completed',
    approvedBy: admin._id,
    approvedAt: makeDate(-3, 16, 0),
    checkInTime: makeDate(-2, 10, 55),
    checkOutTime: makeDate(-2, 12, 20),
    actualUsageDuration: 85,
  });

  const noShowBooking = await Booking.create({
    userId: studentThree._id,
    resourceId: findResource('Indoor Sports Arena')._id,
    startTime: makeDate(-1, 8, 0),
    endTime: makeDate(-1, 9, 0),
    purpose: 'Morning fitness session',
    expectedAttendees: 12,
    status: 'no_show',
    approvedBy: admin._id,
    approvedAt: makeDate(-2, 15, 20),
  });

  const { qrCode, qrCodeImage } = await buildQr(approvedBooking._id);
  approvedBooking.qrCode = qrCode;
  approvedBooking.qrCodeImage = qrCodeImage;
  await approvedBooking.save();

  const { qrCode: completedQrCode, qrCodeImage: completedQrImage } = await buildQr(completedBooking._id);
  completedBooking.qrCode = completedQrCode;
  completedBooking.qrCodeImage = completedQrImage;
  await completedBooking.save();

  return [
    pendingBooking,
    approvedBooking,
    rejectedBooking,
    cancelledBooking,
    completedBooking,
    noShowBooking,
  ];
};

const seedNotifications = async ({ users, bookings }) => {
  const byEmail = Object.fromEntries(users.map((user) => [user.email, user]));
  const byStatus = Object.fromEntries(bookings.map((booking) => [booking.status, booking]));

  await Notification.insertMany([
    {
      userId: byEmail['student.one@campusbook.local']._id,
      type: 'booking_created',
      title: 'Booking Request Submitted',
      message: 'Your request for Classroom A-101 is pending approval.',
      relatedBooking: byStatus.pending._id,
    },
    {
      userId: byEmail['student.two@campusbook.local']._id,
      type: 'booking_approved',
      title: 'Booking Approved',
      message: 'Your Computer Lab CL-2 booking was approved.',
      relatedBooking: byStatus.approved._id,
    },
    {
      userId: byEmail['student.one@campusbook.local']._id,
      type: 'booking_rejected',
      title: 'Booking Rejected',
      message: 'Your seminar booking was rejected due to a schedule conflict.',
      relatedBooking: byStatus.rejected._id,
    },
    {
      userId: byEmail['student.three@campusbook.local']._id,
      type: 'no_show_warning',
      title: 'Booking Marked No-Show',
      message: 'You missed your approved booking. Please avoid repeated no-shows.',
      relatedBooking: byStatus.no_show._id,
    },
  ]);
};

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required. Add it to backend/.env before seeding.');
  }

  if (!hasForceFlag) {
    throw new Error(
      'Refusing to run destructive demo seed without --force. Use: npm run seed:demo:force'
    );
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await Notification.deleteMany({});
  await Booking.deleteMany({});
  await Resource.deleteMany({});
  await User.deleteMany({});

  const seededUsers = await seedUsers();
  const seededResources = await seedResources(seededUsers.admin._id);

  const seededBookings = await seedBookings({
    admin: seededUsers.admin,
    staff: seededUsers.staff,
    students: seededUsers.students,
    resources: seededResources,
  });
  await seedNotifications({ users: seededUsers.created, bookings: seededBookings });

  const bookingSummary = seededBookings.reduce((acc, booking) => {
    acc[booking.status] = (acc[booking.status] || 0) + 1;
    return acc;
  }, {});

  console.log('\nSeed complete');
  console.log(`Users: ${seededUsers.created.length}`);
  console.log(`Resources: ${seededResources.length}`);
  console.log(`Bookings: ${seededBookings.length}`);
  console.log('Booking status summary:', bookingSummary);
  console.log('\nDemo Accounts');
  console.log('Admin         -> admin@campusbook.local / Admin@123');
  console.log('Staff (Events)-> staff.coordinator@campusbook.local / Staff@123');
  console.log('Staff (Labs)  -> staff.labs@campusbook.local / Staff@123');
  console.log('Student       -> student.one@campusbook.local / Student@123');
  console.log('\nStaff Assignments:');
  console.log('staff.coordinator@campusbook.local manages: Seminar Hall, Library, Projector Kit');
  console.log('staff.labs@campusbook.local manages: Computer Lab, Chemistry Lab');
};

run()
  .then(async () => {
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Seed failed:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  });
