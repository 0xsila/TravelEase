const Hotel = require('../models/Hotel')
const {StatusCodes}= require('http-status-codes')
const {BadRequestError,UnauthenticatedError, NotFoundError}=require('../errors')

const Wilayat = [
    "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa",
    "Biskra", "Béchar", "Blida", "Bouira", "Tamanrasset", "Tébessa",
    "Tlemcen", "Tiaret", "Tizi Ouzou", "Algiers", "Djelfa", "Jijel",
    "Sétif", "Saïda", "Skikda", "Sidi Bel Abbès", "Annaba", "Guelma",
    "Constantine", "Médéa", "Mostaganem", "M’Sila", "Mascara", "Ouargla",
    "Oran", "El Bayadh", "Illizi", "Bordj Bou Arréridj", "Boumerdès",
    "El Tarf", "Tindouf", "Tissemsilt", "El Oued", "Khenchela", "Souk Ahras",
    "Tipaza", "Mila", "Aïn Defla", "Naâma", "Aïn Témouchent", "Ghardaïa",
    "Relizane", "Timimoun", "Bordj Badji Mokhtar", "Ouled Djellal",
    "Béni Abbès", "In Salah", "In Guezzam", "Touggourt", "Djanet",
    "El M’Ghair", "El Menia", "Tamanrasset", "Bordj Badji Mokhtar"
  ];

const getAllHotels=async (req,res)=>{
    const {
        wilaya,
        maxPrice,
        minPrice,
        guests,
        minRating
      } = req.query;
    
      let filter = {};
    
      
      if (wilaya && Wilayat.includes(wilaya)) {
        filter['location.wilaya'] = wilaya;
      }
    
      
      if (maxPrice) {
        filter.pricePerNight = { $lte: Number(maxPrice) };
      }
      if (minPrice) {
        filter.pricePerNight = {
          ...filter.pricePerNight,
          $gte: Number(minPrice)
        };
      }
    
      
      if (guests) {
        filter.roomsAvailable = { $gte: Number(guests) };
      }
    
      
      if (minRating) {
        filter.rating = { $gte: Number(minRating) };
      }
    
      
      const hotels = await Hotel.find(filter).sort('createdAt');
    
      res.status(StatusCodes.OK).json({ hotels, count: hotels.length });
}


const createHotel=async (req,res)=>{
    // get the owner and send it with the request 
    // req.body.owner='660f71bde70a3f4f88771a4b'
    const hotel=await Hotel.create(req.body)
    res.status(StatusCodes.CREATED).json({hotel})
}

const updateHotel=async (req,res)=>{
        
    const { id: hotelId } = req.params;
        
    const updateData = req.body;

  // Validate wilaya if present
  if (updateData.location?.wilaya && !Wilayat.includes(updateData.location.wilaya)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "Invalid wilaya. Please provide a valid Wilaya."
    });
  }

  const hotel = await Hotel.findByIdAndUpdate(hotelId, updateData, {
    new: true,
    runValidators: true
  });


  res.status(StatusCodes.OK).json({ hotel });
 };



const getHotel=async (req,res)=>{
    const { id: hotelId } = req.params;
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: `No hotel found with ID ${hotelId}` });
    }

    res.status(StatusCodes.OK).json({ hotel });
}

const deleteHotel=async (req,res)=>{
    const { id: hotelId } = req.params;
    const hotel=await Hotel.findByIdAndRemove({
        _id:hotelId
    })
    if(!hotel){
        throw new NotFoundError(`no hotel with this id ${hotelId}`)
    }
    res.status(StatusCodes.OK).send()
}





module.exports={
    getAllHotels,
     getHotel,
     createHotel,
    updateHotel,
    deleteHotel
    
 }