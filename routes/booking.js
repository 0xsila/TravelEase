const express=require('express')
const router=express.Router()

const {
    getAllBookings,
    createBooking,
    getBookingById,
    updateBookingById,
    deleteBookingById
}=require('../controllers/booking')

router.route('/').get(getAllBookings).post(createBooking)
router.route('/:id').get(getBookingById).patch(updateBookingById).delete(deleteBookingById)

module.exports=router