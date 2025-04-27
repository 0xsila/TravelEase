const Booking = require('../models/Booking');

const Notification = require('../models/Notifications');


const createBooking = async (req, res) => {
  const booking = new Booking(req.body);
  userId='660f71bde70a3f4f88771a4b'
  await booking.save();
  await Notification.create({
    user: userId,
    message: 'Your booking was created successfully.',
    type: 'booking',
  });
  res.status(201).json(booking);
};

const getAllBookings = async (req, res) => {
  // const userId = req.user.id;
  userId='660f71bde70a3f4f88571a4b' // just an example
  const { itemType, status } = req.query; 
  let query = { user: userId };  
  if (itemType) {
    
    query.itemType = itemType;
  }

  if (status) {
    
    query.status = status;
  }
  const bookings = await Booking.find(query).populate('itemId'); // add populate('user')
  res.json(bookings);
};

const getBookingById = async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('itemId');

  res.json(booking);
};

const updateBookingById = async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    const userId = '660f71bde70a3f4f88571a4b'; // simulate the logged-in user
    const { startDate, endDate, status } = req.body;
  
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }
  
    
    if (booking.user.toString() !== userId) {
      return res.status(403).json({ msg: 'You are not authorized to update this booking' });
    }
  
   
    if (booking.status === 'cancelled') {
      return res.status(400).json({ msg: 'You cannot modify a cancelled booking' });
    }
  
    
    if (status) {
      if (status === 'cancelled') {
        booking.status = 'cancelled';
        await Notification.create({
            user: userId,
            message: 'Your booking was cancelled successfully.',
            type: 'booking',
          });
      } else {
        return res.status(400).json({ msg: 'You can only cancel the booking' });
      }
    }
  

    if (startDate) booking.startDate = startDate;
    if (endDate) booking.endDate = endDate;
  
    const updatedBooking = await booking.save();
    res.json(updatedBooking);
};


const deleteBookingById = async (req, res) => {
    const bookingId = req.params.id;
    userId='660f71bde70a3f4f88571a4b'
    // Simulate role check (in real apps, use req.user.role === 'admin')
    const isAdmin = true; // or req.user.role === 'admin'
  
    if (!isAdmin) {
      return res.status(403).json({ msg: 'Only admins can delete bookings' });
    }
  
    const booking = await Booking.findById(bookingId);
  
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }
  
    await booking.deleteOne();
    await Notification.create({
        user: userId,
        message: 'the  booking was deleted successfully.',
        type: 'booking',
      });
    res.json({ msg: 'Booking deleted successfully' });
  };
  
      


module.exports = {
createBooking,
getAllBookings,
getBookingById,
updateBookingById,
deleteBookingById
};
