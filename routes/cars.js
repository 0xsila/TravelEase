const express=require('express')
const router=express.Router()

const {
     getAllCars
    ,getCar
    ,createCar,
    updateCar,
     deleteCar,
    
    }=require('../controllers/cars')


router.route('/').get(getAllCars).post(createCar)
router.route('/:id').get(getCar).patch(updateCar).delete(deleteCar)

module.exports=router