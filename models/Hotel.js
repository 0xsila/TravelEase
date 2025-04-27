const mongoose = require('mongoose');

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

const hotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    wilaya: { type: String, required: true, enum: Wilayat },
    address: { type: String, required: true }
  },
  description: String,
  amenities: [String],
  pricePerNight: { type: Number, required: true },
  roomsAvailable: { type: Number, default: 1 },
  images: [String],
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalRatings: { type: Number, default: 0 },
  reviews: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comment: String,
    rating: { type: Number, required: true, min: 1, max: 5 },
    cleanliness: { type: Number, min: 1, max: 5 },
    checkIn: { type: Number, min: 1, max: 5 },
    food: { type: Number, min: 1, max: 5 },
    location: { type: Number, min: 1, max: 5 },
    value: { type: Number, min: 1, max: 5 }
  }]
}, { timestamps: true });

// Automatically calculate average rating
hotelSchema.pre('save', function (next) {
  if (this.isModified('reviews')) {
    const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.totalRatings = this.reviews.length;
    this.rating = parseFloat((total / this.totalRatings).toFixed(1));
  }
  next();
});

module.exports = mongoose.model('Hotel', hotelSchema);
