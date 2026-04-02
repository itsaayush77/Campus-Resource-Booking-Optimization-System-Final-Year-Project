export const getRelatedBookingId = (notification) => {
  const relatedBooking = notification?.relatedBooking;

  if (!relatedBooking) return null;
  if (typeof relatedBooking === 'string') return relatedBooking;
  if (typeof relatedBooking === 'object' && relatedBooking._id) return relatedBooking._id;

  return null;
};

export const getNotificationTarget = (notification) => {
  const bookingId = getRelatedBookingId(notification);

  if (!bookingId) {
    return '/notifications';
  }

  if (['booking_approved', 'booking_completed'].includes(notification.type)) {
    return `/qr-checkin/${bookingId}`;
  }

  if (['booking_rejected', 'booking_cancelled', 'no_show_warning'].includes(notification.type)) {
    return '/booking-history';
  }

  return '/my-bookings';
};
