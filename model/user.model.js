const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Importar bcrypt

const { Schema } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: {
    type: String,
    lowercase: true,
    required: true,
    match: [/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/, "Email inválido"],
    unique: true
  },
  password: { type: String, required: true },
  profileImage: { type: String, default: '' },

  // Solo guardar el ID de los videos favoritos
  favoriteVideos: [
    {
      type: mongoose.Schema.Types.ObjectId
    }
  ]

}, { timestamps: true });

// Middleware para encriptar contraseña
userSchema.pre('save', async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Método para comparar contraseña
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
