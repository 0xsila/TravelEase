require('dotenv').config();
require('express-async-errors');

// security : 

const helmet=require('helmet')
const cors =require('cors')
const xss= require('xss-clean')
const rateLimit=require('express-rate-limit')



const express = require('express');
const app = express();

// connectDB

const connectDB=require('./db/connect')
// const authenticateUser=require('./middleware/authentication')
// routers 

// const hotelsRouter=require('./routes/auth')

const hotelsRouter=require('./routes/hotels')
const homesRouter=require('./routes/homes')
const carsRouter=require('./routes/cars')
const generalRouter=require('./routes/general')
const bookingRouter=require('./routes/booking')
const notificationRouter=require('./routes/notifications')







// error handler
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

app.use(express.json());
// extra packages

app.set('trust proxy',1)
app.use(rateLimit({
  windowMs: 15*60*1000,
  max:100
}))


app.use(express.json())
app.use(helmet())
app.use(cors())
app.use(xss())



// routes

// app.use('/api/v1/auth',authRouter);
app.use('/api/v1/homes',homesRouter);
app.use('/api/v1',generalRouter)
app.use('/api/v1/cars',carsRouter)
app.use('/api/v1/hotels',hotelsRouter)
app.use('/api/v1/bookings',bookingRouter)
app.use('/api/v1/notifications',notificationRouter)
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 3000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI)
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
