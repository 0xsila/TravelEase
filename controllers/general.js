const Home = require('../models/Home');
const Hotel = require('../models/Hotel');
const car = require('../models/car');
const {StatusCodes}= require('http-status-codes')
const {BadRequestError,UnauthenticatedError, NotFoundError}=require('../errors')

const Models = {
    Home,
    Hotel,
    car
  };

const review=async (req,res)=>{

    const { id } = req.params; // item ID
    const { comment, rating, itemType } = req.body;
    const userId = '660f71bde70a3f4f88771a4b'; // replace with auth later
  
    // 2. Check if item type is valid
    const Model = Models[itemType];
    if (!Model) {
      return res.status(400).json({ error: 'Invalid item type.' });
    }
  
    // 3. Find the item
    const item = await Model.findById(id);
    if (!item) {
      return res.status(404).json({ error: `${itemType} not found.` });
    }
  
    // 4. Check if user has already reviewed
    const alreadyReviewed = item.reviews.find(
      r => r.userId.toString() === userId
    );
    if (alreadyReviewed) {
      return res.status(400).json({ error: 'You have already reviewed this item.' });
    }
  
    // 5. Check if user has completed a booking for this item


    // wait for najib



    // const today = new Date();
    // const booking = await Booking.findOne({
    //   user: userId,
    //   item: id,
    //   itemType,
    //   endDate: { $lt: today },
    //   status: 'confirmed' // or 'completed'
    // });
  
    // if (!booking) {
    //   return res.status(403).json({ error: 'You can only review after using the item.' });
    // }
  
    // 6. Add review
    item.reviews.push({
      userId,
      rating,
      comment
    });
  
    // 7. Recalculate average rating

    const total = item.reviews.reduce((sum, r) => sum + r.rating, 0);
    item.totalRatings = item.reviews.length;
    item.rating = parseFloat((total / item.totalRatings).toFixed(1));
  
    await item.save();
  
    res.status(201).json({
      message: 'Review submitted successfully.',
      averageRating: item.rating,
      totalReviews: item.totalRatings
    });
}

const editComment=async (req,res)=>{
  const { id, commentId } = req.params;
  const { text } = req.body;
  const userId = '660f71bde70a3f4f88771a4b'; // Replace with actual user ID from auth

  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Comment text is required.' });
  }

  const home = await Home.findById(id);
  

  const userReview = home.reviews.find(
    r => r.userId?.toString() === userId
  );

  
  if (!userReview) return res.status(404).json({ error: 'Review not found.' });

  const comment = userReview.comments.find(
    c => c._id?.toString() === commentId
  );
  if (!comment) return res.status(404).json({ error: 'Comment not found.' });

  comment.text = text;
  await home.save();

  res.status(200).json({ message: 'Comment updated successfully.', updatedComment: comment });
}

const deleteComment=async (req,res)=>{
  const { id, commentId } = req.params;
  const userId = '660f71bde70a3f4f88771a4b';

  const home=await Home.findByIdAndRemove({
        _id:homeId
    })
  
    if(!home){
        throw new NotFoundError(`no home with this id ${homeId}`)
    }
    res.status(StatusCodes.OK).send()
}


module.exports={review}