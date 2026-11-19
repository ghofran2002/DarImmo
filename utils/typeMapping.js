// backend/utils/typeMapping.js
const TYPE_TO_BACKEND = {
  appartement: 'apartment',
  villa: 'villa',
  terrain: 'land',
  local: 'office',
};
const TYPE_TO_FRONTEND = Object.fromEntries(
  Object.entries(TYPE_TO_BACKEND).map(([k, v]) => [v, k])
);
TYPE_TO_FRONTEND.house = 'villa';
TYPE_TO_FRONTEND.studio = 'appartement';

const TRANSACTION_TO_BACKEND = { acheter: 'sale', louer: 'rent' };
const TRANSACTION_TO_FRONTEND = { sale: 'acheter', rent: 'louer' };

function normalizeTypeInput(type) {
  if (!type) return type;
  return TYPE_TO_BACKEND[type] || type;
}
function normalizeTransactionInput(tx) {
  if (!tx) return tx;
  return TRANSACTION_TO_BACKEND[tx] || tx;
}
function toFrontendType(type) {
  return TYPE_TO_FRONTEND[type] || type;
}
function toFrontendTransaction(tx) {
  return TRANSACTION_TO_FRONTEND[tx] || tx;
}

module.exports = {
  TYPE_TO_BACKEND,
  TYPE_TO_FRONTEND,
  TRANSACTION_TO_BACKEND,
  TRANSACTION_TO_FRONTEND,
  normalizeTypeInput,
  normalizeTransactionInput,
  toFrontendType,
  toFrontendTransaction,
};
