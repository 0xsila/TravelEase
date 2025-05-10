const Booking = require("../models/Booking");

const Notification = require("../models/Notifications");

const createBooking = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const bookingDto = {
      user: userId,
      ...req.body,
    };
    const booking = new Booking(bookingDto);
    await booking.save();
    await Notification.create({
      user: userId,
      message: "Your booking was created successfully.",
      type: "booking",
    });
    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
};

const getAllBookings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemType, status } = req.query;
    let query = { user: userId };
    if (itemType) {
      query.itemType = itemType;
    }

    if (status) {
      query.status = status;
    }
    const bookings = await Booking.find(query).populate("itemId"); // add populate('user')
    res.json(bookings);
  } catch (error) {
    next(error);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("itemId");
    if (!booking) return res.status(404).json({ msg: "Booking not found" });
    res.json(booking);
  } catch (error) {
    next(error);
  }
};

const updateBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    const userId = req.user.id;
    const { startDate, endDate, status } = req.body;

    if (!booking) {
      return res.status(404).json({ msg: "Booking not found" });
    }

    if (booking.user.toString() !== userId) {
      return res
        .status(403)
        .json({ msg: "You are not authorized to update this booking" });
    }

    if (booking.status === "cancelled") {
      return res
        .status(400)
        .json({ msg: "You cannot modify a cancelled booking" });
    }

    if (status) {
      if (status === "cancelled") {
        booking.status = "cancelled";
        await Notification.create({
          user: userId,
          message: "Your booking was cancelled successfully.",
          type: "booking",
        });
      } else {
        return res.status(400).json({ msg: "You can only cancel the booking" });
      }
    }

    if (startDate) booking.startDate = startDate;
    if (endDate) booking.endDate = endDate;

    const updatedBooking = await booking.save();
    res.json(updatedBooking);
  } catch (error) {
    next(error);
  }
};

const deleteBookingById = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ msg: "Booking not found" });
    }

    await booking.deleteOne();
    await Notification.create({
      user: userId,
      message: "the  booking was deleted successfully.",
      type: "booking",
    });
    res.json({ msg: "Booking deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBookingById,
  deleteBookingById,
};
