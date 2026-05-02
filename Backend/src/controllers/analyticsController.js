const Ticket = require('../models/Ticket');
const Booking = require('../models/Booking');

// @desc    Get dashboard analytics
// @route   GET /api/analytics
// @access  Private (Admin only)
const getAnalytics = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // 1. Ticket Analytics
    const totalTickets = await Ticket.countDocuments();
    
    // Aggregate tickets by status
    const ticketsByStatus = await Ticket.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Format the aggregation into a simpler object: { 'OPEN': 5, 'CLOSED': 2 }
    const ticketStatsObj = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0 };
    ticketsByStatus.forEach(stat => {
      ticketStatsObj[stat._id] = stat.count;
    });

    // 2. Booking Analytics
    const totalBookings = await Booking.countDocuments();
    
    // Aggregate bookings by status
    const bookingsByStatus = await Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const bookingStatsObj = { PENDING: 0, APPROVED: 0, REJECTED: 0, CANCELLED: 0 };
    bookingsByStatus.forEach(stat => {
      bookingStatsObj[stat._id] = stat.count;
    });

    res.json({
      tickets: {
        total: totalTickets,
        byStatus: ticketStatsObj,
      },
      bookings: {
        total: totalBookings,
        byStatus: bookingStatsObj,
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalytics,
};
