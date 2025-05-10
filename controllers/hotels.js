const Hotel = require("../models/Hotel");
const { StatusCodes } = require("http-status-codes");
const {
  BadRequestError,
  UnauthenticatedError,
  NotFoundError,
} = require("../errors");

const Wilayat = [
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
  "Tamanrasset",
  "Bordj Badji Mokhtar",
];

const getAllHotels = async (req, res) => {
  const { wilaya, maxPrice, minPrice, guests, minRating } = req.query;

  let filter = {};

  if (wilaya && Wilayat.includes(wilaya)) {
    filter["location.wilaya"] = wilaya;
  }

  if (maxPrice) {
    filter.pricePerNight = { $lte: Number(maxPrice) };
  }
  if (minPrice) {
    filter.pricePerNight = {
      ...filter.pricePerNight,
      $gte: Number(minPrice),
    };
  }

  if (guests) {
    filter.roomsAvailable = { $gte: Number(guests) };
  }

  if (minRating) {
    filter.rating = { $gte: Number(minRating) };
  }

  const hotels = await Hotel.find(filter).sort("createdAt");

  res.status(StatusCodes.OK).json({ hotels, count: hotels.length });
};

const createHotel = async (req, res, next) => {
  try {
    // get the owner and send it with the request

    req.body.owner = req.user.id;
    const images = req.files.map((file) => `/uploads/${file.filename}`);
    const hotel = await Hotel.create({ ...req.body, images });
    res.status(StatusCodes.CREATED).json({ hotel });
  } catch (error) {
    next(error);
  }
};

const updateHotel = async (req, res, next) => {
  try {
    const { id: hotelId } = req.params;

    const updateData = req.body;

    // Validate wilaya if present
    if (
      updateData.location?.wilaya &&
      !Wilayat.includes(updateData.location.wilaya)
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "Invalid wilaya. Please provide a valid Wilaya.",
      });
    }
    const images = req.files.map((file) => `/uploads/${file.filename}`);
    const hotel = await Hotel.findByIdAndUpdate(
      hotelId,
      { ...updateData, images },
      {
        new: true,
        runValidators: true,
      }
    );
    if (!hotel) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: `No hotel found with ID ${hotelId}` });
    }

    res.status(StatusCodes.OK).json({ hotel });
  } catch (error) {
    next(error);
  }
};

const getHotel = async (req, res, next) => {
  try {
    const { id: hotelId } = req.params;
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: `No hotel found with ID ${hotelId}` });
    }

    res.status(StatusCodes.OK).json({ hotel });
  } catch (error) {
    next(error);
  }
};

const deleteHotel = async (req, res, next) => {
  try {
    const { id: hotelId } = req.params;
    const hotel = await Hotel.findByIdAndDelete({
      _id: hotelId,
    });
    if (!hotel) {
      throw new NotFoundError(`no hotel with this id ${hotelId}`);
    }
    res.status(StatusCodes.OK).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllHotels,
  getHotel,
  createHotel,
  updateHotel,
  deleteHotel,
};
