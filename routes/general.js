const express=require('express')
const router=express.Router()

const {
    review
}=require('../controllers/general')


router.route('/:id/review').post(review)
// router.route('/:id/comment/:commentId').patch(editComment).delete(deleteComment)

module.exports=router