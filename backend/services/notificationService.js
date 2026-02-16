const Notification = require('../models/Notification');

const createNotification = async ({
  userId,
  type,
  title,
  message,
  relatedBooking = null
}) => {
  if (!userId || !type || !title || !message) {
    throw new Error('userId, type, title and message are required to create notification');
  }

  return Notification.create({
    userId,
    type,
    title,
    message,
    relatedBooking
  });
};

module.exports = {
  createNotification
};
