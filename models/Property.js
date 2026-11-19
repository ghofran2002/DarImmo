const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Le titre est obligatoire'],
      trim: true,
      minlength: [5, 'Le titre doit contenir au moins 5 caractères'],
      maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères'],
    },
    description: {
      type: String,
      required: [true, 'La description est obligatoire'],
      trim: true,
      minlength: [20, 'La description doit contenir au moins 20 caractères'],
    },
    price: {
      type: Number,
      required: [true, 'Le prix est obligatoire'],
      min: [0, 'Le prix ne peut pas être négatif'],
    },
    type: {
      type: String,
      required: [true, 'Le type de bien est obligatoire'],
      enum: ['apartment', 'house', 'villa', 'land', 'studio', 'office'],
    },
    transactionType: {
      type: String,
      required: [true, 'Le type de transaction est obligatoire'],
      enum: ['sale', 'rent'],
    },
    city: {
      type: String,
      required: [true, 'La ville est obligatoire'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "L'adresse est obligatoire"],
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Les coordonnées GPS sont obligatoires'],
        validate: {
          validator: function (v) {
            return v.length === 2;
          },
          message: 'Les coordonnées doivent contenir exactement [longitude, latitude]',
        },
      },
    },
    surface: {
      type: Number,
      required: [true, 'La surface est obligatoire'],
      min: [1, 'La surface doit être positive'],
    },
    rooms: { type: Number, default: 0 },
    bedrooms: { type: Number, default: 0 },
    bathrooms: { type: Number, default: 0 },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "L'annonce doit avoir un propriétaire"],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Index pour la recherche
propertySchema.index({ city: 1, type: 1, transactionType: 1 });
propertySchema.index({ price: 1 });
// Index pour la recherche géospatiale
propertySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Property', propertySchema);