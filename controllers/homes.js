const Home = require("../models/Home");
const { StatusCodes } = require("http-status-codes");
const {
  BadRequestError,
  UnauthenticatedError,
  NotFoundError,
} = require("../errors");

const getAllHomes = async (req, res) => {
  const Wilayas = [
    "Adrar",
    "Chlef",
    "Laghouat",
    "Oum El Bouaghi",
    "Batna",
    "Béjaïa",
    "Biskra",
    "Béchar",
    "Blida",
    "Bouira",
    "Tamanrasset",
    "Tébessa",
    "Tlemcen",
    "Tiaret",
    "Tizi Ouzou",
    "Algiers",
    "Djelfa",
    "Jijel",
    "Sétif",
    "Saïda",
    "Skikda",
    "Sidi Bel Abbès",
    "Annaba",
    "Guelma",
    "Constantine",
    "Médéa",
    "Mostaganem",
    "M’Sila",
    "Mascara",
    "Ouargla",
    "Oran",
    "El Bayadh",
    "Illizi",
    "Bordj Bou Arréridj",
    "Boumerdès",
    "El Tarf",
    "Tindouf",
    "Tissemsilt",
    "El Oued",
    "Khenchela",
    "Souk Ahras",
    "Tipaza",
    "Mila",
    "Aïn Defla",
    "Naâma",
    "Aïn Témouchent",
    "Ghardaïa",
    "Relizane",
    "Timimoun",
    "Bordj Badji Mokhtar",
    "Ouled Djellal",
    "Béni Abbès",
    "In Salah",
    "In Guezzam",
    "Touggourt",
    "Djanet",
    "El M’Ghair",
    "El Menia",
  ];
  const { wilaya, maxPrice, minPrice, startDate, endDate, guests } = req.query;

  let filter = {};

  if (wilaya && Wilayas.includes(wilaya)) {
    filter["location.wilaya"] = wilaya;
  }

  if (maxPrice) {
    filter["pricePerNight"] = { $lte: maxPrice };
  }
  if (minPrice) {
    filter["pricePerNight"] = { ...filter["pricePerNight"], $gte: minPrice };
  }

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    filter["availableDates"] = {
      $gte: start,
      $lte: end,
    };
  }

  if (guests) {
    filter["guestsAllowed"] = { $gte: guests };
  }

  const homes = await Home.find(filter).sort("createdAt");
  res.status(StatusCodes.OK).json({ homes, count: homes.length });
};
const getHome = async (req, res) => {
  const { id: homeId } = req.params;
  const home = await Home.findById(homeId);
  if (!home) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: `No home found with ID ${homeId}` });
  }

  res.status(StatusCodes.OK).json({ home });
};
const createHome = async (req, res, next) => {
  try {
    const images = req.files.map((file) => `/uploads/${file.filename}`);
    req.body.owner = req.user.id;
    const home = await Home.create({ ...req.body, images });
    res.status(StatusCodes.CREATED).json({ home });
  } catch (error) {
    next(error);
  }
};

const updateHome = async (req, res, next) => {
  try {
    // get the owner and send it with the request
    const Wilayas = [
      "Adrar",
      "Chlef",
      "Laghouat",
      "Oum El Bouaghi",
      "Batna",
      "Béjaïa",
      "Biskra",
      "Béchar",
      "Blida",
      "Bouira",
      "Tamanrasset",
      "Tébessa",
      "Tlemcen",
      "Tiaret",
      "Tizi Ouzou",
      "Algiers",
      "Djelfa",
      "Jijel",
      "Sétif",
      "Saïda",
      "Skikda",
      "Sidi Bel Abbès",
      "Annaba",
      "Guelma",
      "Constantine",
      "Médéa",
      "Mostaganem",
      "M’Sila",
      "Mascara",
      "Ouargla",
      "Oran",
      "El Bayadh",
      "Illizi",
      "Bordj Bou Arréridj",
      "Boumerdès",
      "El Tarf",
      "Tindouf",
      "Tissemsilt",
      "El Oued",
      "Khenchela",
      "Souk Ahras",
      "Tipaza",
      "Mila",
      "Aïn Defla",
      "Naâma",
      "Aïn Témouchent",
      "Ghardaïa",
      "Relizane",
      "Timimoun",
      "Bordj Badji Mokhtar",
      "Ouled Djellal",
      "Béni Abbès",
      "In Salah",
      "In Guezzam",
      "Touggourt",
      "Djanet",
      "El M’Ghair",
      "El Menia",
    ];
    const { id: homeId } = req.params;

    const {
      title,
      location,
      description,
      pricePerNight,
      type,
      availableDates,
      guestsAllowed,
      amenities,
      reviews,
    } = req.body;
    const userId = req.user.id;

    const updateData = {};

    if (title) updateData.title = title;
    if (location) {
      if (location.wilaya && Wilayas.includes(location.wilaya)) {
        updateData.location = location;
      } else {
        return res.status(400).json({ message: "Invalid wilaya" });
      }
    }
    if (description) updateData.description = description;
    if (pricePerNight) updateData.pricePerNight = pricePerNight;
    if (type) updateData.type = type;
    if (availableDates) updateData.availableDates = availableDates;
    if (guestsAllowed !== undefined) updateData.guestsAllowed = guestsAllowed;
    if (amenities) updateData.amenities = amenities;
    if (reviews) updateData.reviews = reviews;
    const images = req.files.map((file) => `/uploads/${file.filename}`);
    const updatedHouse = await Home.findOneAndUpdate(
      { _id: homeId, owner: userId }, // zid id of the owner
      { ...updateData, images },
      { new: true, runValidators: true }
    );

    if (!updatedHouse) {
      return res
        .status(404)
        .json({ message: "House not found or you are not the owner" });
    }

    res.status(200).json(updatedHouse);
  } catch (error) {
    next(error);
  }
};

const deleteHome = async (req, res, next) => {
  try {
    const { id: homeId } = req.params;
    const home = await Home.findByIdAndDelete({
      _id: homeId,
    });
    if (!home) {
      throw new NotFoundError(`no home with this id ${homeId}`);
    }
    res.status(StatusCodes.OK).send();
  } catch (error) {
    next(error);
  }
};

// const reviewHome = async (req, res) => {
//   const { comment, rating } = req.body;
//   const homeId = req.params.id;
//   const userId = '660f71bde70a3f4f88771a4b'; // placeholder

//   const home = await Home.findById(homeId);

//   // Check if user already has a review entry
//   let userReview = home.reviews.find(
//     r => r.userId && r.userId.toString() === userId
//   );

//   if (!userReview) {
//     // First time: add rating + first comment (if exists)
//     const newReview = {
//       userId,
//       rating: rating >= 1 && rating <= 5 ? rating : undefined,
//       comments: comment ? [{ text: comment, createdAt: new Date() }] : []
//     };

//     home.reviews.push(newReview);
//   } else {
//     // Rating already exists → block rating update
//     if (rating !== undefined) {
//       return res.status(400).json({ error: 'You have already rated this home. Rating cannot be changed.' });
//     }

//     // Allow adding a new comment
//     if (comment) {
//       userReview.comments.push({ text: comment, createdAt: new Date() });
//     } else {
//       return res.status(400).json({ error: 'No comment provided.' });
//     }
//   }

//   await home.save(); // triggers average rating update

//   res.status(200).json({
//     message: 'Comment added successfully.',
//     averageRating: home.rating,
//     totalReviews: home.totalRatings
//   });
// };

// for admin only :

// const editComment=async (req,res)=>{
//   const { id, commentId } = req.params;
//   const { text } = req.body;
//   const userId = '660f71bde70a3f4f88771a4b'; // Replace with actual user ID from auth

//   if (!text || text.trim() === '') {
//     return res.status(400).json({ error: 'Comment text is required.' });
//   }

//   const home = await Home.findById(id);

//   const userReview = home.reviews.find(
//     r => r.userId?.toString() === userId
//   );

//   if (!userReview) return res.status(404).json({ error: 'Review not found.' });

//   const comment = userReview.comments.find(
//     c => c._id?.toString() === commentId
//   );
//   if (!comment) return res.status(404).json({ error: 'Comment not found.' });

//   comment.text = text;
//   await home.save();

//   res.status(200).json({ message: 'Comment updated successfully.', updatedComment: comment });
// }

// const deleteComment=async (req,res)=>{
//   const { id, commentId } = req.params;
//   const userId = '660f71bde70a3f4f88771a4b';

//   const home=await Home.findByIdAndRemove({
//         _id:homeId
//     })

//     if(!home){
//         throw new NotFoundError(`no home with this id ${homeId}`)
//     }
//     res.status(StatusCodes.OK).send()
// }

module.exports = {
  getAllHomes,
  getHome,
  createHome,
  updateHome,
  deleteHome,
};
