const Property = require('../models/Property');
const asyncHandler = require('../utils/asyncHandler');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Créer une annonce
// @route   POST /api/properties
// @access  Private
const createProperty = asyncHandler(async (req, res) => {
  const propertyData = { ...req.body, owner: req.user._id, status: 'pending' };
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
  const queryObj = { status: 'approved' };
  const allowedFilters = ['city', 'type', 'transactionType'];
  allowedFilters.forEach((field) => {
    if (typeof req.query[field] === 'string' && req.query[field].trim()) {
      queryObj[field] = req.query[field].trim();
    }
  });

  // 2. Recherche par mot-clé (titre ou description)
  if (typeof req.query.search === 'string' && req.query.search.trim()) {
    const search = escapeRegex(req.query.search.trim());
    queryObj.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  // 3. Filtre par prix (min et max)
  const minPrice = req.query.minPrice === undefined ? undefined : Number(req.query.minPrice);
  const maxPrice = req.query.maxPrice === undefined ? undefined : Number(req.query.maxPrice);
  if (
    (minPrice !== undefined && (!Number.isFinite(minPrice) || minPrice < 0)) ||
    (maxPrice !== undefined && (!Number.isFinite(maxPrice) || maxPrice < 0)) ||
    (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice)
  ) {
    return res.status(400).json({ success: false, message: 'Filtres de prix invalides', errors: [] });
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    queryObj.price = {};
    if (minPrice !== undefined) queryObj.price.$gte = minPrice;
    if (maxPrice !== undefined) queryObj.price.$lte = maxPrice;
  }

  // 4. Exécution de la requête
  let query = Property.find(queryObj).populate('owner', 'name email');

  // 5. Tri (ex: ?sort=price, ?sort=-price, ?sort=createdAt)
  if (typeof req.query.sort === 'string' && req.query.sort.trim()) {
    const sortFields = req.query.sort.split(',').map((field) => field.trim());
    const allowedSortFields = new Set(['price', 'createdAt', 'surface', 'title']);
    if (sortFields.some((field) => !allowedSortFields.has(field.replace(/^-/, '')))) {
      return res.status(400).json({ success: false, message: 'Paramètre de tri invalide', errors: [] });
    }
    const sortBy = sortFields.join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt'); // Par défaut : les plus récentes d'abord
  }

  // 6. Pagination
  const page = Number.parseInt(req.query.page, 10) || 1;
  const limit = Number.parseInt(req.query.limit, 10) || 10;
  if (page < 1 || limit < 1 || limit > 100) {
    return res.status(400).json({ success: false, message: 'Paramètres de pagination invalides', errors: [] });
  }
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
  delete req.body.status;
  delete req.body.images;

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

  if (
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(maxDistance) ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90 ||
    maxDistance <= 0
  ) {
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

  if (property.images.length + req.files.length > 5) {
    return res.status(400).json({
      success: false,
      message: 'Une annonce ne peut pas contenir plus de 5 images',
      errors: [],
    });
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