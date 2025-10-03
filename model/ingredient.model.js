const mongoose = require('mongoose');
const db = require('../config/db');

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  image: { type: String },//////////
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
}, { timestamps: true });

const IngredientModel = db.model('ingredient', ingredientSchema);
module.exports = IngredientModel;
