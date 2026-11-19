// backend/utils/serializers.js
const { toFrontendType, toFrontendTransaction } = require('./typeMapping');

const PALETTES = [
  ['#1E3A8A', '#14B8A6'],
  ['#0F766E', '#93C5FD'],
  ['#F59E0B', '#1E3A8A'],
  ['#7C3AED', '#F472B6'],
  ['#DC2626', '#FBBF24'],
  ['#059669', '#60A5FA'],
];

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
function paletteFromId(id) {
  return PALETTES[hashString(String(id)) % PALETTES.length];
}

function formatPrice(price, transactionType) {
  const n = Number(price) || 0;
  const formatted = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return transactionType === 'rent' ? `${formatted} DT / mois` : `${formatted} DT`;
}

const TN_BBOX = { lngMin: 7.5, lngMax: 11.6, latMin: 30.2, latMax: 37.5 };
function toMapPos(coords) {
  if (!Array.isArray(coords) || coords.length !== 2) {
    return { lat: 0.5, lng: 0.5 };
  }
  const [lng, lat] = coords;
  const lngN = (lng - TN_BBOX.lngMin) / (TN_BBOX.lngMax - TN_BBOX.lngMin);
  const latN = (lat - TN_BBOX.latMin) / (TN_BBOX.latMax - TN_BBOX.latMin);
  return {
    lng: Math.min(1, Math.max(0, lngN)),
    lat: Math.min(1, Math.max(0, latN)),
  };
}

function serializeProperty(p, opts = {}) {
  if (!p) return null;
  const raw = typeof p.toObject === 'function' ? p.toObject() : p;
  const id = String(raw._id);
  const fav = opts.favIds instanceof Set ? opts.favIds.has(id) : false;
  const coords = (raw.location && raw.location.coordinates) || [];
  const mapPos = toMapPos(coords);
  return {
    ...raw,
    _id: raw._id,
    id,
    priceNum: raw.price,
    priceLabel: formatPrice(raw.price, raw.transactionType),
    mode: toFrontendTransaction(raw.transactionType),
    type: toFrontendType(raw.type),
    place: raw.city,
    ch: raw.bedrooms || 0,
    sdb: raw.bathrooms || 0,
    m2: raw.surface,
    colors: paletteFromId(id),
    fav,
    lat: coords[1],
    lng: coords[0],
    mapPos,
    image: raw.images && raw.images[0] ? raw.images[0].url : null,
  };
}

function serializeProperties(list, opts = {}) {
  return list.map((p) => serializeProperty(p, opts));
}

function serializeUser(u) {
  if (!u) return null;
  const raw = typeof u.toObject === 'function' ? u.toObject() : u;
  return {
    id: String(raw._id),
    name: raw.name,
    email: raw.email,
    phone: raw.phone || '',
    role: raw.role,
    avatar: raw.avatar || null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

module.exports = {
  serializeProperty,
  serializeProperties,
  serializeUser,
  formatPrice,
  paletteFromId,
  toMapPos,
};
