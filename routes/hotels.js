const express=require('express')
const router=express.Router()

const {
     getAllHotels
     ,getHotel
     ,createHotel,
     updateHotel,
     deleteHotel,
    
    }=require('../controllers/hotels')


router.route('/').get(getAllHotels).post(createHotel)
 router.route('/:id').get(getHotel).patch(updateHotel).delete(deleteHotel)

module.exports=router