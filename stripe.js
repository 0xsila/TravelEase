

const dotenv = require('dotenv');
dotenv.config();
const stripe = process.env.STRIPE_PRIVATE_KEY 
  ? require('stripe')(process.env.STRIPE_PRIVATE_KEY)
  : null;



// Mock data
const rentalType = 'car';
const rental = {
  make: 'Toyota',
  model: 'Corolla',
  year: 2020,
  name: 'Economy Car',
  title: 'Affordable Ride',
  images: ['https://example.com/image.jpg'],
  _id: 'rental123'
};
const start = new Date();
const diffDays = 3;
const totalPriceInCents = 15000;
const booking = { _id: 'booking456' };
const req = { user: { id: 'user789' } };

async function createCheckoutSession() {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: rentalType === 'car'
                ? `${rental.make} ${rental.model} (${rental.year})`
                : rental.name || rental.title,
              description: `${diffDays} day${diffDays > 1 ? 's' : ''} rental starting ${start.toLocaleDateString()}`,
              images: rental.images && rental.images.length > 0 ? [rental.images[0]] : [],
            },
            unit_amount: totalPriceInCents,
          },
          quantity: 1,
        }
      ],
      metadata: {
        bookingId: booking._id.toString(),
        rentalType,
        rentalId: rental._id.toString(),
        userId: req.user.id
      },
      success_url: `${process.env.CLIENT_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/booking/cancel?booking_id=${booking._id}`,
    });

    console.log('Checkout session created:', session.url);
  } catch (error) {
    console.error('Error creating session:', error);
  }
}

createCheckoutSession();
