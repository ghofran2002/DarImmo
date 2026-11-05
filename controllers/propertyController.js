const Property = require('../models/Property');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Créer une annonce
// @route   POST /api/properties
// @access  Private
const createProperty = asyncHandler(async (req, res) => {
  const propertyData = { ...req.body, owner: req.user._id };
  const property = await Property.create(propertyData);

  res.status(201).json({
    success: true,
    message: 'Annonce créée avec succès',
    data: { property },
  });
});


// @desc    Lister et rechercher les annonces (avec filtres, tri, pagination)
// @route   GET /api/properties
// @access  Public
const getAllProperties = asyncHandler(async (req, res) => {
  // 1. Construction de la requête (Query)
  const queryObj = { ...req.query };

  // Champs à exclure de la recherche directe (ils servent à autre chose)
  const excludedFields = ['page', 'sort', 'limit', 'search', 'minPrice', 'maxPrice'];
  excludedFields.forEach((field) => delete queryObj[field]);

  // Par défaut, on ne montre que les annonces approuvées
  queryObj.status = 'approved'; 

  // 2. Recherche par mot-clé (titre ou description)
  if (req.query.search) {
    queryObj.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  // 3. Filtre par prix (min et max)
  if (req.query.minPrice || req.query.maxPrice) {
    queryObj.price = {};
    if (req.query.minPrice) queryObj.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) queryObj.price.$lte = Number(req.query.maxPrice);
  }

  // 4. Exécution de la requête
  let query = Property.find(queryObj).populate('owner', 'name email');

  // 5. Tri (ex: ?sort=price, ?sort=-price, ?sort=createdAt)
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt'); // Par défaut : les plus récentes d'abord
  }

  // 6. Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  query = query.skip(skip).limit(limit);

  // 7. Exécution finale
  const properties = await query;
  const total = await Property.countDocuments(queryObj);

  res.status(200).json({
    success: true,
    message: 'Annonces récupérées',
    data: {
      count: properties.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      properties,
    },
  });
});

// @desc    Détails d'une annonce
// @route   GET /api/properties/:id
// @access  Public
const getPropertyById = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id).populate('owner', 'name email');

  if (!property) {
    return res.status(404).json({ success: false, message: 'Annonce introuvable', errors: [] });
  }

  res.status(200).json({ success: true, message: 'Annonce récupérée', data: { property } });
});

// @desc    Modifier une annonce (seulement la sienne)
// @route   PUT /api/properties/:id
// @access  Private
const updateProperty = asyncHandler(async (req, res) => {
  let property = await Property.findById(req.params.id);

  if (!property) {
    return res.status(404).json({ success: false, message: 'Annonce introuvable', errors: [] });
  }

  // Vérifier que l'utilisateur est le propriétaire
  if (property.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Non autorisé à modifier cette annonce', errors: [] });
  }

  // Empêcher la modification du propriétaire
  delete req.body.owner;

  property = await Property.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

  res.status(200).json({ success: true, message: 'Annonce mise à jour', data: { property } });
});

// @desc    Supprimer une annonce (seulement la sienne)
// @route   DELETE /api/properties/:id
// @access  Private
const deleteProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    return res.status(404).json({ success: false, message: 'Annonce introuvable', errors: [] });
  }

  if (property.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Non autorisé à supprimer cette annonce', errors: [] });
  }

  await property.deleteOne();

  res.status(200).json({ success: true, message: 'Annonce supprimée', data: {} });
});
// @desc    Trouver les annonces à proximité (recherche géospatiale)
// @route   GET /api/properties/nearby
// @access  Public
const getNearbyProperties = asyncHandler(async (req, res) => {
  const { lng, lat, distance = 5000 } = req.query; // distance en mètres par défaut (5km)

  // Validation des paramètres
  if (!lng || !lat) {
    return res.status(400).json({
      success: false,
      message: 'Les paramètres lng (longitude) et lat (latitude) sont obligatoires',
      errors: [],
    });
  }

  const longitude = parseFloat(lng);
  const latitude = parseFloat(lat);
  const maxDistance = parseFloat(distance);

  if (isNaN(longitude) || isNaN(latitude) || isNaN(maxDistance)) {
    return res.status(400).json({
      success: false,
      message: 'Les paramètres doivent être des nombres valides',
      errors: [],
    });
  }

  // Requête géospatiale MongoDB ($near)
  const properties = await Property.find({
    status: 'approved', // On ne montre que les annonces approuvées
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistance,
      },
    },
  }).populate('owner', 'name email');

  res.status(200).json({
    success: true,
    message: `Annonces trouvées dans un rayon de ${maxDistance} mètres`,
    data: {
      count: properties.length,
      properties,
    },
  });
});

// @desc    Uploader des images pour une annonce existante
// @route   POST /api/properties/:id/images
// @access  Private
const uploadImages = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    return res.status(404).json({ success: false, message: 'Annonce introuvable', errors: [] });
  }

  // Vérifier que l'utilisateur est le propriétaire
  if (property.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Non autorisé à modifier cette annonce', errors: [] });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'Aucune image fournie', errors: [] });
  }

  // Construire le tableau d'images
  const newImages = req.files.map((file) => ({
    url: file.path, // URL Cloudinary
    publicId: file.filename, // public_id Cloudinary
  }));

  property.images.push(...newImages);
  await property.save();

  res.status(200).json({
    success: true,
    message: `${newImages.length} image(s) ajoutée(s) avec succès`,
    data: { property },
  });
});

// @desc    Supprimer une image d'une annonce
// @route   DELETE /api/properties/:id/images/:publicId
// @access  Private
const deleteImage = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    return res.status(404).json({ success: false, message: 'Annonce introuvable', errors: [] });
  }

  if (property.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Non autorisé à modifier cette annonce', errors: [] });
  }

  // Le publicId est passé en paramètre URL, il faut le décoder (car il contient des /)
  const publicId = decodeURIComponent(req.params.publicId);
  const imageIndex = property.images.findIndex((img) => img.publicId === publicId);

  if (imageIndex === -1) {
    return res.status(404).json({ success: false, message: 'Image introuvable', errors: [] });
  }

  // Supprimer de Cloudinary
  const { cloudinary } = require('../config/cloudinary');
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Erreur suppression Cloudinary:', error);
    // On continue même si Cloudinary échoue (pour ne pas bloquer)
  }

  // Supprimer de MongoDB
  property.images.splice(imageIndex, 1);
  await property.save();

  res.status(200).json({
    success: true,
    message: 'Image supprimée avec succès',
    data: { property },
  });
});
module.exports = {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  getNearbyProperties,
  uploadImages,
  deleteImage,
  
};