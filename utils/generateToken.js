const jwt = require('jsonwebtoken');

/**
 * Génère un JWT signé pour un utilisateur.
 *
 * Le payload contient l'id et le rôle de l'utilisateur.
 * La signature utilise JWT_SECRET (depuis .env).
 * L'expiration utilise JWT_EXPIRES_IN (ex: 7d).
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },              // payload
    process.env.JWT_SECRET,            // secret
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } // options
  );
};

module.exports = generateToken;