// backend/controllers/propertyController.js
const Property = require('../models/Property');
const Favorite = require('../models/Favorite');
const asyncHandler = require('../utils/asyncHandler');
const { serializeProperty, serializeProperties } = require('../utils/serializers');
const { normalizeTypeInput, normalizeTransactionInput } = require('../utils/typeMapping');

const escapeRegex = (v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function getFavIdsIfAuth(req) {
  if (!req.user || !req.user._id) return new Set();
  const favs = await Favorite.find({ user: req.user._id }).select('property').lean();
  return new Set(favs.map((f) => String(f.property)));
}

const createProperty = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (data.type) data.type = normalizeTypeInput(data.type);
  if (data.transactionType) data.transactionType = normalizeTransactionInput(data.transactionType);

  const property = await Property.create({ ...data, owner: req.user._id, status: 'pending' });

  res.status(201).json({
    success: true,
    message: 'Annonce creee avec succes',
    data: { property: serializeProperty(property, { userId: req.user._id }) },
  });
});

const getAllProperties = asyncHandler(async (req, res) => {
  const queryObj = { status: 'approved' };

  ['city', 'address'].forEach((field) => {
    if (typeof req.query[field] === 'string' && req.query[field].trim()) {
      queryObj[field] = req.query[field].trim();
    }
  });

  if (typeof req.query.type === 'string' && req.query.type.trim()) {
    queryObj.type = normalizeTypeInput(req.query.type.trim());
  }

  const txRaw = req.query.transactionType || req.query.mode;
  if (typeof txRaw === 'string' && txRaw.trim()) {
    queryObj.transactionType = normalizeTransactionInput(txRaw.trim());
  }

  if (typeof req.query.search === 'string' && req.query.search.trim()) {
    const search = escapeRegex(req.query.search.trim());
    queryObj.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

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

  const minChRaw = req.query.minCh;
  if (minChRaw !== undefined && minChRaw !== '') {
    const minCh = Number(minChRaw);
    if (!Number.isFinite(minCh) || minCh < 0) {
      return res.status(400).json({ success: false, message: 'minCh invalide', errors: [] });
    }
    if (minCh > 0) queryObj.bedrooms = { $gte: minCh };
  }

  let sortBy = '-createdAt';
  if (typeof req.query.sort === 'string' && req.query.sort.trim()) {
    const s = req.query.sort.trim();
    if (s === 'prix_asc') sortBy = 'price';
    else if (s === 'prix_desc') sortBy = '-price';
    else if (s === 'recent') sortBy = '-createdAt';
    else {
      const allowed = new Set(['price', 'createdAt', 'surface', 'title']);
      const fields = s.split(',').map((x) => x.trim());
      if (fields.some((f) => !allowed.has(f.replace(/^-/, '')))) {
        return res.status(400).json({ success: false, message: 'Parametre de tri invalide', errors: [] });
      }
      sortBy = fields.join(' ');
    }
  }

  const page = Number.parseInt(req.query.page, 10) || 1;
  const limit = Number.parseInt(req.query.limit, 10) || 10;
  if (page < 1 || limit < 1 || limit > 100) {
    return res.status(400).json({ success: false, message: 'Parametres de pagination invalides', errors: [] });
  }
  const skip = (page - 1) * limit;

  const [properties, total, favIds] = await Promise.all([
    Property.find(queryObj).populate('owner', 'name email').sort(sortBy).skip(skip).limit(limit),
    Property.countDocuments(queryObj),
    getFavIdsIfAuth(req),
  ]);

  res.status(200).json({
    success: true,
    message: 'Annonces recuperees',
    data: {
      count: properties.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      properties: serializeProperties(properties, { userId: req.user && req.user._id, favIds }),
    },
  });
});

const getPropertyById = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id).populate('owner', 'name email');
  if (!property) {
    return res.status(404).json({ success: false, message: 'Annonce introuvable', errors: [] });
  }
  const favIds = await getFavIdsIfAuth(req);
  res.status(200).json({
    success: true,
    message: 'Annonce recuperee',
    data: { property: serializeProperty(property, { userId: req.user && req.user._id, favIds }) },
  });
});

const updateProperty = asyncHandler(async (req, res) => {
  let property = await Property.findById(req.params.id);
  if (!property) {
    return res.status(404).json({ success: false, message: 'Annonce introuvable', errors: [] });
  }
  if (property.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Non autorise', errors: [] });
  }
  const body = { ...req.body };
  delete body.owner;
  delete body.status;
  delete body.images;
  if (body.type) body.type = normalizeTypeInput(body.type);
  if (body.transactionType) body.transactionType = normalizeTransactionInput(body.transactionType);

  property = await Property.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
  res.status(200).json({
    success: true,
    message: 'Annonce mise a jour',
    data: { property: serializeProperty(property, { userId: req.user._id }) },
  });
});

const deleteProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) {
    return res.status(404).json({ success: false, message: 'Annonce introuvable', errors: [] });
  }
  if (property.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Non autorise', errors: [] });
  }
  await property.deleteOne();
  res.status(200).json({ success: true, message: 'Annonce supprimee', data: {} });
});

const getNearbyProperties = asyncHandler(async (req, res) => {
  const { lng, lat } = req.query;
  let maxDistance = 5000;
  if (req.query.radius !== undefined && req.query.radius !== '') {
    const r = parseFloat(req.query.radius);
    if (!Number.isFinite(r) || r <= 0) {
      return res.status(400).json({ success: false, message: 'radius invalide', errors: [] });
    }
    maxDistance = r * 1000;
  } else if (req.query.distance !== undefined && req.query.distance !== '') {
    const d = parseFloat(req.query.distance);
    if (!Number.isFinite(d) || d <= 0) {
      return res.status(400).json({ success: false, message: 'distance invalide', errors: [] });
    }
    maxDistance = d;
  }

  if (!lng || !lat) {
    return res.status(400).json({ success: false, message: 'lng et lat obligatoires', errors: [] });
  }
  const longitude = parseFloat(lng);
  const latitude = parseFloat(lat);
  if (
    !Number.isFinite(longitude) || !Number.isFinite(latitude) ||
    longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90
  ) {
    return res.status(400).json({ success: false, message: 'Coordonnees invalides', errors: [] });
  }

  const properties = await Property.find({
    status: 'approved',
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [longitude, latitude] },
        $maxDistance: maxDistance,
      },
    },
  }).populate('owner', 'name email');

  const favIds = await getFavIdsIfAuth(req);

  res.status(200).json({
    success: true,
    message: `Annonces dans un rayon de ${maxDistance} m`,
    data: {
      count: properties.length,
      properties: serializeProperties(properties, { userId: req.user && req.user._id, favIds }),
    },
  });
});

const uploadImages = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) return res.status(404).json({ success: false, message: 'Annonce introuvable', errors: [] });
  if (property.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Non autorise', errors: [] });
  }
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'Aucune image', errors: [] });
  }
  if (property.images.length + req.files.length > 5) {
    return res.status(400).json({ success: false, message: 'Maximum 5 images', errors: [] });
  }
  const newImages = req.files.map((f) => ({ url: f.path, publicId: f.filename }));
  property.images.push(...newImages);
  await property.save();
  res.status(200).json({
    success: true,
    message: `${newImages.length} image(s) ajoutee(s)`,
    data: { property: serializeProperty(property, { userId: req.user._id }) },
  });
});

const deleteImage = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) return res.status(404).json({ success: false, message: 'Annonce introuvable', errors: [] });
  if (property.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Non autorise', errors: [] });
  }
  const publicId = decodeURIComponent(req.params.publicId);
  const idx = property.images.findIndex((img) => img.publicId === publicId);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Image introuvable', errors: [] });
  try {
    const { cloudinary } = require('../config/cloudinary');
    await cloudinary.uploader.destroy(publicId);
  } catch (e) {
    console.error('Cloudinary destroy error:', e);
  }
  property.images.splice(idx, 1);
  await property.save();
  res.status(200).json({
    success: true,
    message: 'Image supprimee',
    data: { property: serializeProperty(property, { userId: req.user._id }) },
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
