const express=require('express')
const router=express.Router()

const {
     getAllHomes
    ,getHome
    ,createHome,
    updateHome,
    deleteHome,
    
    }=require('../controllers/homes')


router.route('/').post(createHome).get(getAllHomes)
router.route('/:id').get(getHome).patch(updateHome).delete(deleteHome)

module.exports=router