const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  url: { type: String, required: true }, // ruta al video
  description: { type: String, default: "" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  thumbnail: { type: String, default: "" }, // ruta al thumbnail
  photo_dish: { type: String, default: "" }, // ruta a la foto del plato
  tags: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  name: { type: String, required: true }, // nombre del video/receta
  recipe: { type: String, required: true } // texto de la receta
});

module.exports = mongoose.model("Video", videoSchema);
