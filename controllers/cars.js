const car = require("../models/car");
const { StatusCodes } = require("http-status-codes");
const {
  BadRequestError,
  UnauthenticatedError,
  NotFoundError,
} = require("../errors");
const req = require("express/lib/request");

const getAllCars = async (req, res) => {
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
  const { wilaya, maxPrice, minPrice, startDate, endDate } = req.query;

  let filter = {};

  if (wilaya && Wilayas.includes(wilaya)) {
    filter["location.wilaya"] = wilaya;
  }

  if (maxPrice) {
    filter["pricePerDay"] = { $lte: maxPrice };
  }
  if (minPrice) {
    filter["pricePerDay"] = { ...filter["pricePerDay"], $gte: minPrice };
  }

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    filter["availableDates"] = {
      $gte: start,
      $lte: end,
    };
  }

  const cars = await car.find(filter).sort("createdAt");
  res.status(StatusCodes.OK).json({ cars, count: cars.length });
};

const getCar = async (req, res) => {
  try {
    const { id: carId } = req.params;
    const Car = await car.findById(carId);
    if (!Car) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: `No Car found with ID ${carId}` });
    }

    res.status(StatusCodes.OK).json({ Car });
  } catch (error) {
    next(error);
  }
};
const createCar = async (req, res, next) => {
  try {
    const files = req.files.map((file) => `/uploads/${file.filename}`);
    const userId = req.user.id;
    req.body.owner = userId;
    const Car = await car.create({ ...req.body, images: files });
    res.status(StatusCodes.CREATED).json({ Car });
  } catch (error) {
    next(error);
  }
};

const updateCar = async (req, res, next) => {
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

    const { id: carId } = req.params;
    const { make, model, year, pricePerDay, location, amenities, reviews } =
      req.body;

    // const ownerId = req.user._id; // Uncomment if you want to filter by owner

    const updateData = {};

    if (make) updateData.make = make;
    if (model) updateData.model = model;
    if (year) updateData.year = year;
    if (pricePerDay) updateData.pricePerDay = pricePerDay;

    if (location) {
      if (location.wilaya && Wilayas.includes(location.wilaya)) {
        updateData.location = location;
      } else {
        return res.status(400).json({ message: "Invalid wilaya" });
      }
    }

    if (amenities) updateData.amenities = amenities;
    if (reviews) updateData.reviews = reviews;

    const images = req.files.map((file) => `/uploads/${file.filename}`);

    const updatedCar = await car.findOneAndUpdate(
      { _id: carId /*, owner: ownerId */ }, // Optional: check for ownership
      { ...updateData, images },
      { new: true, runValidators: true }
    );

    if (!updatedCar) {
      return res.status(404).json({ message: "Car not found" });
    }

    res.status(200).json(updatedCar);
  } catch (error) {
    next(error);
  }
};

const deleteCar = async (req, res, next) => {
  try {
    const { id: carId } = req.params;
    const Car = await car.findOneAndDelete({
      _id: carId,
    });
    if (!Car) {
      throw new NotFoundError(`no car with this id ${carId}`);
    }
    res.status(StatusCodes.OK).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCars,
  getCar,
  createCar,
  updateCar,
  deleteCar,
};
