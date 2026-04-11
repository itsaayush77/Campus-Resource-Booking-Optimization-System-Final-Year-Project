const Booking = require('../models/Bookings');

const BOOKING_STATUSES = ['approved', 'rejected', 'cancelled', 'no_show', 'pending', 'completed'];

const parseSummaryDate = (dateInput, isEndDate = false) => {
  if (!dateInput) {
    return null;
  }

  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (isEndDate) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }

  return date;
};

const getStartOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const getEndOfToday = () => {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
};

const getStartOfWeek = () => {
  const date = new Date();
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const buildStatusMap = (counts) => {
  const countsByStatus = BOOKING_STATUSES.reduce((accumulator, status) => {
    accumulator[status] = 0;
    return accumulator;
  }, {});

  counts.forEach((item) => {
    countsByStatus[item._id] = item.count;
  });

  return countsByStatus;
};

// @desc    Get analytics summary
// @route   GET /api/admin/analytics/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
// @access  Private/Admin
exports.getAnalyticsSummary = async (req, res) => {
  try {
    const { from, to } = req.query;

    const fromDate = parseSummaryDate(from);
    const toDate = parseSummaryDate(to, true);

    if ((from && !fromDate) || (to && !toDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    if (fromDate && toDate && fromDate > toDate) {
      return res.status(400).json({
        success: false,
        message: "'from' date must be less than or equal to 'to' date"
      });
    }

    const match = {};
    if (fromDate || toDate) {
      match.startTime = {};
      if (fromDate) match.startTime.$gte = fromDate;
      if (toDate) match.startTime.$lte = toDate;
    }

    const todayStart = getStartOfToday();
    const todayEnd = getEndOfToday();
    const weekStart = getStartOfWeek();

    const [
      statusCounts,
      topResources,
      peakHours,
      bookingsByDay,
      totalBookings,
      todayBookings,
      weekBookings,
      todayStatusCounts,
      weekStatusCounts
    ] = await Promise.all([
      Booking.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Booking.aggregate([
        { $match: match },
        { $group: { _id: '$resourceId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'resources',
            localField: '_id',
            foreignField: '_id',
            as: 'resource'
          }
        },
        { $unwind: { path: '$resource', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            resourceId: '$_id',
            resourceName: '$resource.name',
            resourceCategory: '$resource.category',
            count: 1
          }
        }
      ]),
      Booking.aggregate([
        { $match: match },
        { $group: { _id: { $hour: '$startTime' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            hour: '$_id',
            count: 1
          }
        }
      ]),
      Booking.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$startTime'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            date: '$_id',
            count: 1
          }
        }
      ]),
      Booking.countDocuments(match),
      Booking.countDocuments({
        startTime: { $gte: todayStart, $lte: todayEnd }
      }),
      Booking.countDocuments({
        startTime: { $gte: weekStart, $lte: todayEnd }
      }),
      Booking.aggregate([
        {
          $match: {
            startTime: { $gte: todayStart, $lte: todayEnd }
          }
        },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Booking.aggregate([
        {
          $match: {
            startTime: { $gte: weekStart, $lte: todayEnd }
          }
        },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    const countsByStatus = buildStatusMap(statusCounts);
    const todayCountsByStatus = buildStatusMap(todayStatusCounts);
    const weekCountsByStatus = buildStatusMap(weekStatusCounts);

    return res.status(200).json({
      success: true,
      filters: {
        from: fromDate ? fromDate.toISOString() : null,
        to: toDate ? toDate.toISOString() : null
      },
      summary: {
        totalBookings,
        todayBookings,
        weekBookings,
        countsByStatus,
        todayCountsByStatus,
        weekCountsByStatus,
        topResources,
        peakHours,
        bookingsByDay
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics summary',
      error: error.message
    });
  }
};
