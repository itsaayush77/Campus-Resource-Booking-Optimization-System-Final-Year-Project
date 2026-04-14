import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { LuChartColumn as ChartColumn, LuClock3, LuInfo, LuRefreshCw } from 'react-icons/lu';
import staffApi from '../api/staffApi';
import Loading from '../components/Loading';

const recommendationOptions = [
  { value: 'no_recommendation', label: 'No Recommendation' },
  { value: 'recommend_approve', label: 'Recommend Approve' },
  { value: 'recommend_reject', label: 'Recommend Reject' },
];

const recommendationLabel = (value) => {
  if (value === 'recommend_approve') return 'Recommend Approve';
  if (value === 'recommend_reject') return 'Recommend Reject';
  return 'No Recommendation';
};

const recommendationStyle = (value) => {
  if (value === 'recommend_approve') return 'bg-green-100 text-green-900';
  if (value === 'recommend_reject') return 'bg-red-100 text-red-900';
  return 'bg-gray-100 text-gray-800';
};

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
};

const isToday = (value) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

const StaffDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingBookings, setPendingBookings] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [reviewDrafts, setReviewDrafts] = useState({});

  const syncDrafts = (bookings) => {
    setReviewDrafts((previous) => {
      const next = { ...previous };
      bookings.forEach((booking) => {
        if (!next[booking._id]) {
          next[booking._id] = {
            recommendation: booking.staffRecommendation || 'no_recommendation',
            comment: booking.staffComment || '',
          };
        }
      });
      return next;
    });
  };

  const fetchDashboardData = async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [bookingsRes, analyticsRes] = await Promise.all([
        staffApi.getStaffPendingBookings(),
        staffApi.getStaffAnalytics(),
      ]);

      const bookings = bookingsRes.data.bookings || [];
      setPendingBookings(bookings);
      setAnalytics(analyticsRes.data.analytics || {});
      syncDrafts(bookings);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load staff review dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const filteredBookings = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return pendingBookings;

    return pendingBookings.filter((booking) => {
      const resourceName = booking.resourceId?.name || '';
      const userName = booking.userId?.name || '';
      const purpose = booking.purpose || '';
      return `${resourceName} ${userName} ${purpose}`.toLowerCase().includes(query);
    });
  }, [pendingBookings, searchTerm]);

  const summary = useMemo(() => {
    const pendingRequests = pendingBookings.length;
    const reviewedToday = pendingBookings.filter((booking) => isToday(booking.reviewedAt)).length;
    const urgentItems = pendingBookings.filter((booking) => {
      const start = new Date(booking.startTime);
      if (Number.isNaN(start.getTime())) return false;
      const diff = start.getTime() - Date.now();
      return diff >= 0 && diff <= 24 * 60 * 60 * 1000;
    }).length;
    const totalUnderReview = pendingBookings.filter(
      (booking) => booking.staffRecommendation !== 'no_recommendation' || Boolean(booking.staffComment)
    ).length;

    return { pendingRequests, reviewedToday, urgentItems, totalUnderReview };
  }, [pendingBookings]);

  const updateDraft = (bookingId, field, value) => {
    setReviewDrafts((previous) => ({
      ...previous,
      [bookingId]: {
        ...(previous[bookingId] || { recommendation: 'no_recommendation', comment: '' }),
        [field]: value,
      },
    }));
  };

  const submitReview = async (bookingId) => {
    const draft = reviewDrafts[bookingId] || {
      recommendation: 'no_recommendation',
      comment: '',
    };

    setSavingId(bookingId);
    try {
      const response = await staffApi.submitBookingReview(bookingId, {
        recommendation: draft.recommendation,
        comment: draft.comment,
      });

      const updatedBooking = response.data.booking;
      setPendingBookings((previous) =>
        previous.map((booking) => (booking._id === bookingId ? updatedBooking : booking))
      );
      toast.success('Review note saved for admin review');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save review note');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen px-4 py-8 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 mb-8 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.24em] uppercase text-blue-600">
              Staff Workspace
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">
              Booking Review Queue
            </h1>
            <p className="mt-3 text-lg text-gray-600">
              Review pending requests, add recommendation notes, and support admin decisions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fetchDashboardData({ silent: true })}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 text-base font-semibold text-white transition-all duration-200 shadow-lg rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
          >
            <LuRefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="p-4 mb-6 border border-blue-200 rounded-2xl bg-blue-50">
          <div className="flex gap-3">
            <LuInfo className="w-5 h-5 mt-0.5 text-blue-700" />
            <div>
              <p className="font-semibold text-blue-900">Admin has final approval authority.</p>
              <p className="mt-1 text-sm text-blue-800">
                Staff can review pending requests and add recommendation notes, but cannot approve or reject bookings.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 mb-8 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Pending Requests', value: summary.pendingRequests, icon: <LuClock3 className="w-6 h-6" /> },
            { label: 'Reviewed Today', value: summary.reviewedToday, icon: <ChartColumn className="w-6 h-6" /> },
            { label: 'Urgent Items', value: summary.urgentItems, icon: <LuClock3 className="w-6 h-6" /> },
            { label: 'Total Under Review', value: summary.totalUnderReview, icon: <ChartColumn className="w-6 h-6" /> },
          ].map((card) => (
            <div key={card.label} className="p-5 bg-white border border-gray-200 shadow-sm rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-500">{card.label}</p>
                  <p className="mt-3 text-4xl font-black text-gray-900">{card.value}</p>
                </div>
                <div className="flex items-center justify-center w-12 h-12 text-blue-700 rounded-xl bg-blue-50">
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-blue-50/60">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Pending Requests</h2>
                <p className="mt-1 text-sm text-gray-600">Add optional recommendation and comments for admin review.</p>
              </div>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by user, resource, or purpose"
                className="w-full lg:w-80 rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-lg font-medium text-gray-700">No pending requests match this view.</p>
              <p className="mt-2 text-gray-500">Try a different search term or refresh the review queue.</p>
            </div>
          ) : (
            <div className="grid gap-4 p-5">
              {filteredBookings.map((booking) => {
                const draft = reviewDrafts[booking._id] || {
                  recommendation: booking.staffRecommendation || 'no_recommendation',
                  comment: booking.staffComment || '',
                };

                return (
                  <div key={booking._id} className="p-5 border border-gray-200 rounded-xl bg-gray-50/40">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{booking.resourceId?.name || 'Archived Resource'}</h3>
                        <p className="mt-1 text-sm text-gray-600">{booking.resourceId?.location || 'Location unavailable'}</p>
                        <p className="mt-2 text-sm text-gray-700">
                          <span className="font-semibold">Requested by:</span> {booking.userId?.name || 'User'}
                          {booking.userId?.email ? ` (${booking.userId.email})` : ''}
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          <span className="font-semibold">When:</span> {formatDateTime(booking.startTime)} to {formatDateTime(booking.endTime)}
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          <span className="font-semibold">Purpose:</span> {booking.purpose}
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          <span className="font-semibold">Expected attendees:</span> {booking.expectedAttendees}
                        </p>
                        {booking.notes && (
                          <p className="mt-1 text-sm text-gray-600">
                            <span className="font-semibold text-gray-700">Notes:</span> {booking.notes}
                          </p>
                        )}
                        {booking.reviewedBy?.name && booking.reviewedAt && (
                          <p className="mt-1 text-xs text-gray-500">
                            Last note by {booking.reviewedBy.name} on {formatDateTime(booking.reviewedAt)}
                          </p>
                        )}
                      </div>

                      <div className="w-full lg:w-auto">
                        <span className="inline-flex rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] bg-amber-100 text-amber-900">
                          Pending Admin Decision
                        </span>
                        <div className="mt-2">
                          <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${recommendationStyle(booking.staffRecommendation)}`}>
                            {recommendationLabel(booking.staffRecommendation)}
                          </span>
                          {booking.reviewedAt && (
                            <p className="mt-2 text-xs text-gray-500">
                              Last reviewed: {formatDateTime(booking.reviewedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 mt-4 md:grid-cols-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Recommendation</label>
                        <select
                          value={draft.recommendation}
                          onChange={(event) => updateDraft(booking._id, 'recommendation', event.target.value)}
                          className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                        >
                          {recommendationOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Comment for admin (optional)</label>
                        <textarea
                          value={draft.comment}
                          onChange={(event) => updateDraft(booking._id, 'comment', event.target.value.slice(0, 300))}
                          rows={2}
                          placeholder="Add context to support admin decision"
                          className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                        />
                        <p className="mt-1 text-xs text-gray-500">{draft.comment.length}/300</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
                      <p className="text-xs text-gray-500">
                        This note supports review. Final approve/reject action remains admin-only.
                      </p>
                      <button
                        type="button"
                        onClick={() => submitReview(booking._id)}
                        disabled={savingId === booking._id}
                        className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                      >
                        {savingId === booking._id ? 'Saving...' : 'Save Review Note'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {analytics && (
          <div className="p-6 mt-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
            <h3 className="text-lg font-bold text-gray-900">Analytics Snapshot</h3>
            <p className="mt-1 text-sm text-gray-600">Quick system-level indicators available to staff.</p>
            <div className="grid gap-4 mt-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                <p className="text-xs font-semibold tracking-[0.12em] uppercase text-gray-500">Total Bookings</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{analytics.totalBookings || 0}</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                <p className="text-xs font-semibold tracking-[0.12em] uppercase text-gray-500">Approved</p>
                <p className="mt-2 text-2xl font-bold text-green-700">{analytics.approvedBookings || 0}</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                <p className="text-xs font-semibold tracking-[0.12em] uppercase text-gray-500">Rejected</p>
                <p className="mt-2 text-2xl font-bold text-red-700">{analytics.rejectedBookings || 0}</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                <p className="text-xs font-semibold tracking-[0.12em] uppercase text-gray-500">Utilization Rate</p>
                <p className="mt-2 text-2xl font-bold text-blue-700">{analytics.utilizationRate || 0}%</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
