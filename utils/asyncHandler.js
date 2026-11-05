/**
 * Enveloppe une fonction asynchrone pour capturer les erreurs.
 *
 * Sans ce wrapper, on devrait mettre un try/catch dans CHAQUE controller.
 * Avec, toute erreur async est automatiquement passée au middleware
 * d'erreur d'Express (qui renverra une réponse JSON propre).
 *
 * Usage (à partir de l'Étape 2) :
 *   router.get('/', asyncHandler(async (req, res) => {
 *     const data = await Model.find();
 *     res.json(data);
 *   }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;