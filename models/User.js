const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Modèle User — représente un utilisateur de la plateforme DarImmo.
 *
 * Rôles :
 *  - user  : cherche des biens
 *  - agent : publie et gère des annonces
 *  - admin : administrateur
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom est obligatoire'],
      trim: true,
      minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
      maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères'],
    },
    email: {
      type: String,
      required: [true, "L'email est obligatoire"],
      unique: true,           // pas deux users avec le même email
      lowercase: true,        // toujours en minuscules
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Email invalide',
      ],
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est obligatoire'],
      minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
      select: false,          // ne pas renvoyer le password par défaut
    },
    phone: {
      type: String,
      trim: true,
      
    },
    role: {
      type: String,
      enum: ['user', 'agent', 'admin'],
      default: 'user',
    },
    avatar: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt + updatedAt automatiques
  }
);

// ============================================
// HOOK pre('save') — hash le mot de passe avant insertion
// ============================================
userSchema.pre('save', async function (next) {
  // Si le password n'a pas été modifié, on ne re-hash pas
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ============================================
// MÉTHODE matchPassword — compare mot de passe saisi vs hashé
// ============================================
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);