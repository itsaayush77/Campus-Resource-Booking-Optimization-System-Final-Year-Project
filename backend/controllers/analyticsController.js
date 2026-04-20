const Booking = require('../models/Bookings');

const BOOKING_STATUSES = ['approved', 'rejected', 'cancelled', 'no_show', 'pending', 'completed'];
const USAGE_ELIGIBLE_STATUSES = ['approved', 'completed', 'no_show'];
const UNDERUTILIZED_RESOURCE_BOOKING_MIN = 2;
const UNDERUTILIZED_RATE_THRESHOLD = 60;
const RECENT_USAGE_WINDOW_DAYS = 7;

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

const roundMetric = (value, digits = 1) => {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(digits));
};

const getRecentWindowStart = (daysAgo) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
};

const buildUsageInsight = ({
  recentCheckedInCount,
  previousCheckedInCount,
  peakActualHour,
  utilizationRate,
}) => {
  if (!recentCheckedInCount && !previousCheckedInCount) {
    return {
      added: false,
      title: 'Recent usage insight',
      body: 'Not enough recent check-in activity yet to identify a short-term trend.'
    };
  }

  const difference = recentCheckedInCount - previousCheckedInCount;
  const changePercent = previousCheckedInCount > 0
    ? roundMetric((difference / previousCheckedInCount) * 100)
    : recentCheckedInCount > 0
      ? 100
      : 0;

  const direction = difference > 0 ? 'up' : difference < 0 ? 'down' : 'flat';
  const peakText = Number.isInteger(peakActualHour)
    ? `${String(peakActualHour).padStart(2, '0')}:00`
    : 'varied hours';

  let body;
  if (direction === 'up') {
    body = `Actual check-ins are up ${Math.abs(changePercent)}% compared with the previous ${RECENT_USAGE_WINDOW_DAYS} days, with the busiest verified usage around ${peakText}.`;
  } else if (direction === 'down') {
    body = `Actual check-ins are down ${Math.abs(changePercent)}% compared with the previous ${RECENT_USAGE_WINDOW_DAYS} days, so this may be a good moment to review promotion or scheduling around ${peakText}.`;
  } else {
    body = `Actual check-ins are steady compared with the previous ${RECENT_USAGE_WINDOW_DAYS} days, and current utilization is holding at ${roundMetric(utilizationRate)}%.`;
  }

  return {
    added: true,
    title: 'Recent usage insight',
    body,
    direction,
    changePercent,
    recentCheckedInCount,
    previousCheckedInCount
  };
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
    const recentWindowStart = getRecentWindowStart(RECENT_USAGE_WINDOW_DAYS);
    const previousWindowStart = getRecentWindowStart(RECENT_USAGE_WINDOW_DAYS * 2);

    const [
      statusCounts,
      topResources,
      peakHours,
      bookingsByDay,
      totalBookings,
      todayBookings,
      weekBookings,
      todayStatusCounts,
      weekStatusCounts,
      usageSummaryRows,
      peakActualUsageHours,
      usageByDay,
      resourceUsageRows,
      recentCheckedInCount,
      previousCheckedInCount
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
      ]),
      Booking.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            checkedInCount: {
              $sum: {
                $cond: [{ $ne: ['$checkInTime', null] }, 1, 0]
              }
            },
            completedUsageCount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
              }
            },
            bookedForUseCount: {
              $sum: {
                $cond: [{ $in: ['$status', USAGE_ELIGIBLE_STATUSES] }, 1, 0]
              }
            },
            scheduledUsageMinutes: {
              $sum: {
                $cond: [
                  { $in: ['$status', USAGE_ELIGIBLE_STATUSES] },
                  {
                    $divide: [
                      { $subtract: ['$endTime', '$startTime'] },
                      1000 * 60
                    ]
                  },
                  0
                ]
              }
            },
            actualUsageMinutes: {
              $sum: { $ifNull: ['$actualUsageDuration', 0] }
            }
          }
        }
      ]),
      Booking.aggregate([
        {
          $match: {
            ...match,
            checkInTime: { $ne: null }
          }
        },
        {
          $group: {
            _id: { $hour: '$checkInTime' },
            count: { $sum: 1 }
          }
        },
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
        {
          $match: {
            ...match,
            status: { $in: USAGE_ELIGIBLE_STATUSES }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$startTime'
              }
            },
            bookedCount: { $sum: 1 },
            usedCount: {
              $sum: {
                $cond: [{ $ne: ['$checkInTime', null] }, 1, 0]
              }
            },
            completedCount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
              }
            }
          }
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            date: '$_id',
            bookedCount: 1,
            usedCount: 1,
            completedCount: 1
          }
        }
      ]),
      Booking.aggregate([
        {
          $match: {
            ...match,
            status: { $in: USAGE_ELIGIBLE_STATUSES }
          }
        },
        {
          $group: {
            _id: '$resourceId',
            bookedCount: { $sum: 1 },
            usedCount: {
              $sum: {
                $cond: [{ $ne: ['$checkInTime', null] }, 1, 0]
              }
            },
            completedCount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
              }
            },
            scheduledMinutes: {
              $sum: {
                $divide: [
                  { $subtract: ['$endTime', '$startTime'] },
                  1000 * 60
                ]
              }
            },
            actualUsageMinutes: {
              $sum: { $ifNull: ['$actualUsageDuration', 0] }
            }
          }
        },
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
            bookedCount: 1,
            usedCount: 1,
            completedCount: 1,
            scheduledMinutes: 1,
            actualUsageMinutes: 1
          }
        }
      ]),
      Booking.countDocuments({
        checkInTime: { $gte: recentWindowStart, $lte: todayEnd }
      }),
      Booking.countDocuments({
        checkInTime: { $gte: previousWindowStart, $lt: recentWindowStart }
      })
    ]);

    const countsByStatus = buildStatusMap(statusCounts);
    const todayCountsByStatus = buildStatusMap(todayStatusCounts);
    const weekCountsByStatus = buildStatusMap(weekStatusCounts);
    const usageSummary = usageSummaryRows[0] || {};
    const bookedForUseCount = usageSummary.bookedForUseCount || 0;
    const checkedInCount = usageSummary.checkedInCount || 0;
    const completedUsageCount = usageSummary.completedUsageCount || 0;
    const scheduledUsageMinutes = Math.max(0, Math.round(usageSummary.scheduledUsageMinutes || 0));
    const actualUsageMinutes = Math.max(0, Math.round(usageSummary.actualUsageMinutes || 0));
    const utilizationRate = bookedForUseCount > 0 ? (checkedInCount / bookedForUseCount) * 100 : 0;
    const durationUtilizationRate = scheduledUsageMinutes > 0
      ? (actualUsageMinutes / scheduledUsageMinutes) * 100
      : 0;

    const usageResources = resourceUsageRows.map((resource) => {
      const resourceBooked = resource.bookedCount || 0;
      const resourceUsed = resource.usedCount || 0;
      const resourceScheduledMinutes = Math.round(resource.scheduledMinutes || 0);
      const resourceActualMinutes = Math.round(resource.actualUsageMinutes || 0);

      return {
        resourceId: resource.resourceId,
        resourceName: resource.resourceName || 'Unknown',
        bookedCount: resourceBooked,
        usedCount: resourceUsed,
        completedCount: resource.completedCount || 0,
        scheduledMinutes: resourceScheduledMinutes,
        actualUsageMinutes: resourceActualMinutes,
        utilizationRate: resourceBooked > 0 ? roundMetric((resourceUsed / resourceBooked) * 100) : 0,
        durationUtilizationRate: resourceScheduledMinutes > 0
          ? roundMetric((resourceActualMinutes / resourceScheduledMinutes) * 100)
          : 0
      };
    });

    const underutilizedResources = usageResources
      .filter((resource) =>
        resource.bookedCount >= UNDERUTILIZED_RESOURCE_BOOKING_MIN &&
        resource.utilizationRate < UNDERUTILIZED_RATE_THRESHOLD
      )
      .sort((left, right) => {
        if (left.utilizationRate !== right.utilizationRate) {
          return left.utilizationRate - right.utilizationRate;
        }
        return right.bookedCount - left.bookedCount;
      })
      .slice(0, 5);

    const peakActualUsagePeriod = peakActualUsageHours.length
      ? peakActualUsageHours.reduce((peak, current) => (current.count > peak.count ? current : peak), peakActualUsageHours[0])
      : null;

    const usageInsight = buildUsageInsight({
      recentCheckedInCount,
      previousCheckedInCount,
      peakActualHour: peakActualUsagePeriod?.hour,
      utilizationRate
    });

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
        bookingsByDay,
        actualUsage: {
          checkedInCount,
          completedUsageCount,
          bookedForUseCount,
          scheduledUsageMinutes,
          actualUsageMinutes,
          utilizationRate: roundMetric(utilizationRate),
          durationUtilizationRate: roundMetric(durationUtilizationRate),
          usageByDay,
          peakActualUsageHours,
          peakActualUsagePeriod: peakActualUsagePeriod
            ? {
                hour: peakActualUsagePeriod.hour,
                count: peakActualUsagePeriod.count
              }
            : null,
          underutilizedResources
        },
        usageInsight
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
