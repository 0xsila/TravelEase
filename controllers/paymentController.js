// File: controllers/paymentController.js
// Fix the Stripe initialization to handle missing API key gracefully
const stripe = process.env.STRIPE_PRIVATE_KEY
  ? require("stripe")(process.env.STRIPE_PRIVATE_KEY)
  : null;

const Booking = require("../models/Booking");
const House = require("../models/Home");
const Hotel = require("../models/Hotel");
const Car = require("../models/car");
const User = require("../models/User");

/**
 * Create a Stripe checkout session for rental booking
 */
exports.createCheckoutSession = async (req, res, next) => {
  try {
    // Verify Stripe API key is available and properly initialized
    if (!process.env.STRIPE_PRIVATE_KEY || !stripe) {
      return res.status(500).json({
        success: false,
        message: "Stripe API key is not configured",
      });
    }

    const {
      rentalType, // 'house', 'hotel', or 'car'
      rentalId,
      startDate,
      endDate,
      guests,
    } = req.body;

    if (!rentalType || !rentalId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required booking information",
      });
    }

    // Validate rental type
    if (!["house", "hotel", "car"].includes(rentalType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid rental type",
      });
    }

    // Find the rental item based on type
    let rental;
    switch (rentalType) {
      case "house":
        rental = await House.findById(rentalId);
        break;
      case "hotel":
        rental = await Hotel.findById(rentalId);
        break;
      case "car":
        rental = await Car.findById(rentalId);
        break;
    }

    // Check if rental exists
    if (!rental) {
      return res.status(404).json({
        success: false,
        message: `${
          rentalType.charAt(0).toUpperCase() + rentalType.slice(1)
        } not found`,
      });
    }

    // Calculate number of days/nights
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 1) {
      return res.status(400).json({
        success: false,
        message: "Booking duration must be at least 1 day",
      });
    }

    // Get price per day/night
    const pricePerDay =
      rentalType === "car" ? rental.pricePerDay : rental.pricePerNight;

    // Calculate total price in cents for Stripe
    const totalPriceInCents = Math.round(pricePerDay * diffDays * 100);

    // Create a new booking record (pending payment)
    const booking = await Booking.create({
      user: req.user.id,
      rentalType,
      rentalId: rental._id,
      startDate: start,
      endDate: end,
      totalPrice: totalPriceInCents / 100, // Store in dollars/currency unit
      status: "pending",
      guests: guests || 1,
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd", // Change as needed
            product_data: {
              name:
                rentalType === "car"
                  ? `${rental.make} ${rental.model} (${rental.year})`
                  : rental.name || rental.title,
              description: `${diffDays} day${
                diffDays > 1 ? "s" : ""
              } rental starting ${start.toLocaleDateString()}`,
              images:
                rental.images && rental.images.length > 0
                  ? [rental.images[0]]
                  : [],
            },
            unit_amount: totalPriceInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId: booking._id.toString(),
        rentalType,
        rentalId: rental._id.toString(),
        userId: req.user.id,
      },
      success_url: `${process.env.CLIENT_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/booking/cancel?booking_id=${booking._id}`,
    });

    // Update booking with session ID
    booking.stripeSessionId = session.id;
    await booking.save();

    // Return checkout session URL
    res.status(200).json({
      success: true,
      url: session.url,
      sessionId: session.id,
      bookingId: booking._id,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    next(error);
  }
};

/**
 * Webhook handler for Stripe events - improved for Stripe CLI testing
 */
exports.handleStripeWebhook = async (req, res) => {
  // For testing with Stripe CLI, log the raw event
  console.log("Received webhook event");

  let event;

  try {
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      // If webhook signing is configured, verify signatures
      const signature = req.headers["stripe-signature"];

      try {
        event = stripe.webhooks.constructEvent(
          req.rawBody || req.body, // Use rawBody if available (added in server.js)
          signature,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err) {
        console.error(
          `⚠️ Webhook signature verification failed: ${err.message}`
        );
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    } else {
      // For local testing with Stripe CLI without signing (development only)
      event = req.body;
      console.log("Webhook signature verification skipped - development mode");
    }

    // Print event details for debugging
    console.log(`Webhook received: ${event.type}`);
    console.log(`Event ID: ${event.id}`);

    // Handle the event based on type
    switch (event.type) {
      case "checkout.session.completed":
        console.log("Processing checkout.session.completed event");
        await handleSuccessfulPayment(event.data.object);
        break;
      case "checkout.session.expired":
        console.log("Processing checkout.session.expired event");
        await handleExpiredCheckout(event.data.object);
        break;
      case "payment_intent.succeeded":
        console.log("Processing payment_intent.succeeded event");
        // You might want to handle this if using payment intents directly
        break;
      case "payment_intent.payment_failed":
        console.log("Processing payment_intent.payment_failed event");
        // Handle failed payments
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.status(200).json({ received: true, type: event.type });
  } catch (err) {
    console.error(`Webhook error: ${err.message}`);
    res.status(500).send(`Webhook Error: ${err.message}`);
  }
};

/**
 * Process successful payment
 * @param {Object} session - Stripe session object
 */
async function handleSuccessfulPayment(session) {
  try {
    const { bookingId } = session.metadata || {};

    if (!bookingId) {
      console.error("No booking ID found in session metadata");
      return;
    }

    console.log(`Processing payment for booking: ${bookingId}`);

    // Update booking status
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      console.error(`Booking not found: ${bookingId}`);
      return;
    }

    // Only update if not already confirmed (to handle potential duplicate events)
    if (booking.status !== "confirmed") {
      booking.status = "confirmed";
      booking.paymentId = session.payment_intent;
      booking.paymentDate = new Date();
      await booking.save();
      console.log(`Booking ${bookingId} status updated to confirmed`);
    } else {
      console.log(`Booking ${bookingId} already confirmed, skipping update`);
    }

    // Update availability for the rental item
    const { rentalType, rentalId } = booking;

    // This is a simplified implementation. For a real application,
    // you would need to handle dates availability more carefully
    switch (rentalType) {
      case "house":
        // Update house availability
        const house = await House.findById(rentalId);
        if (house && house.availableDates) {
          house.availableDates = house.availableDates.filter((date) => {
            const checkDate = new Date(date);
            return checkDate < booking.startDate || checkDate > booking.endDate;
          });
          await house.save();
          console.log(`Updated house ${rentalId} availability`);
        }
        break;
      case "hotel":
        // Update hotel availability
        const hotel = await Hotel.findById(rentalId);
        if (hotel) {
          hotel.roomsAvailable = Math.max(0, hotel.roomsAvailable - 1);
          await hotel.save();
          console.log(`Updated hotel ${rentalId} availability`);
        }
        break;
      case "car":
        // Mark car as booked for these dates
        const car = await Car.findById(rentalId);
        if (car && car.availableDates) {
          car.availableDates = car.availableDates.filter((date) => {
            const checkDate = new Date(date);
            return checkDate < booking.startDate || checkDate > booking.endDate;
          });
          await car.save();
          console.log(`Updated car ${rentalId} availability`);
        }
        break;
    }

    // Send confirmation email (you would implement this)
    // await sendBookingConfirmationEmail(booking);

    console.log(`Payment successful for booking ${bookingId}`);
  } catch (error) {
    console.error("Error processing successful payment:", error);
  }
}

/**
 * Handle expired checkout sessions
 * @param {Object} session - Stripe session object
 */
async function handleExpiredCheckout(session) {
  try {
    const { bookingId } = session.metadata || {};

    if (!bookingId) {
      console.error("No booking ID found in session metadata");
      return;
    }

    // Update booking status to expired
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      console.error(`Booking not found: ${bookingId}`);
      return;
    }

    booking.status = "expired";
    await booking.save();

    console.log(`Checkout expired for booking ${bookingId}`);
  } catch (error) {
    console.error("Error processing expired checkout:", error);
  }
}

/**
 * Verify payment status for a booking
 */
exports.verifyPaymentStatus = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required",
      });
    }

    // Get session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Get booking
    const booking = await Booking.findOne({ stripeSessionId: sessionId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check payment status
    const paymentStatus = session.payment_status;
    const status = paymentStatus === "paid" ? "confirmed" : booking.status;

    // Update booking if needed
    if (booking.status !== status && paymentStatus === "paid") {
      booking.status = status;
      booking.paymentId = session.payment_intent;
      booking.paymentDate = new Date();
      await booking.save();
    }

    // Return booking with payment status
    res.status(200).json({
      success: true,
      booking: {
        id: booking._id,
        startDate: booking.startDate,
        endDate: booking.endDate,
        status: booking.status,
        totalPrice: booking.totalPrice,
        rentalType: booking.rentalType,
        paymentStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get bookings for the current user
 */
exports.getUserBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user.id }).sort({
      createdAt: -1,
    });

    // Enhanced bookings with rental details
    const enhancedBookings = await Promise.all(
      bookings.map(async (booking) => {
        let rentalDetails = null;

        // Get rental details based on type
        switch (booking.rentalType) {
          case "house":
            rentalDetails = await House.findById(booking.rentalId).select(
              "title images location pricePerNight"
            );
            break;
          case "hotel":
            rentalDetails = await Hotel.findById(booking.rentalId).select(
              "name images location pricePerNight"
            );
            break;
          case "car":
            rentalDetails = await Car.findById(booking.rentalId).select(
              "make model year images location pricePerDay"
            );
            break;
        }

        return {
          id: booking._id,
          startDate: booking.startDate,
          endDate: booking.endDate,
          totalPrice: booking.totalPrice,
          status: booking.status,
          rentalType: booking.rentalType,
          createdAt: booking.createdAt,
          rental: rentalDetails,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enhancedBookings.length,
      data: enhancedBookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel a booking
 */
exports.cancelBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    // Find booking
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if booking belongs to user
    if (booking.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this booking",
      });
    }

    // Only allow cancellation of confirmed bookings
    if (booking.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel booking with status: ${booking.status}`,
      });
    }

    // Calculate refund amount based on cancellation policy
    // This is a simplified version - you would implement more complex logic
    const today = new Date();
    const startDate = new Date(booking.startDate);
    const daysUntilStart = Math.ceil(
      (startDate - today) / (1000 * 60 * 60 * 24)
    );

    let refundPercentage = 0;
    if (daysUntilStart > 7) {
      refundPercentage = 100; // Full refund if more than 7 days before
    } else if (daysUntilStart > 3) {
      refundPercentage = 50; // 50% refund if 3-7 days before
    } else {
      refundPercentage = 0; // No refund if less than 3 days before
    }

    const refundAmount = Math.round(
      booking.totalPrice * (refundPercentage / 100)
    );

    // Process refund through Stripe if payment was made
    let refundId = null;
    if (booking.paymentId && refundAmount > 0) {
      const refund = await stripe.refunds.create({
        payment_intent: booking.paymentId,
        amount: Math.round(refundAmount * 100), // Convert to cents
      });
      refundId = refund.id;
    }

    // Update booking status
    booking.status = "cancelled";
    booking.refundAmount = refundAmount;
    booking.refundId = refundId;
    booking.cancelledAt = new Date();
    await booking.save();

    // Handle availability updates
    const { rentalType, rentalId } = booking;
    switch (rentalType) {
      case "house":
        // Update house availability to make dates available again
        const house = await House.findById(rentalId);
        if (house && house.availableDates) {
          // Add back the dates from the booking
          const dates = [];
          const currentDate = new Date(booking.startDate);
          while (currentDate <= booking.endDate) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
          }
          house.availableDates = [...house.availableDates, ...dates];
          await house.save();
        }
        break;
      case "hotel":
        // Update hotel room availability
        const hotel = await Hotel.findById(rentalId);
        if (hotel) {
          hotel.roomsAvailable += 1;
          await hotel.save();
        }
        break;
      case "car":
        // Make car available for these dates again
        const car = await Car.findById(rentalId);
        if (car && car.availableDates) {
          // Add back the dates from the booking
          const dates = [];
          const currentDate = new Date(booking.startDate);
          while (currentDate <= booking.endDate) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
          }
          car.availableDates = [...car.availableDates, ...dates];
          await car.save();
        }
        break;
    }

    res.status(200).json({
      success: true,
      message: `Booking cancelled successfully. Refund: ${refundPercentage}%`,
      data: {
        bookingId: booking._id,
        refundAmount,
        refundPercentage,
      },
    });
  } catch (error) {
    next(error);
  }
};
