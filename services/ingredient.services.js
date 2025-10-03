const IngredientModel = require('../model/ingredient.model');

class IngredientService {
  static async addIngredient(userId, name, quantity,image) {
    const newIngredient = new IngredientModel({ userId, name, quantity,image });
    return await newIngredient.save();
  }

  static async getIngredientsByUser(userId) {
    return await IngredientModel.find({ userId });
  }

  static async updateIngredient(id, userId, quantity) {
    const ingredient = await IngredientModel.findOneAndUpdate(
      { _id: id, userId },
      { quantity },
      { new: true }
    );
    return ingredient;
  }

  static async deleteIngredient(id, userId) {
    const result = await IngredientModel.findOneAndDelete({ _id: id, userId });
    return result;
  }

}

module.exports = IngredientService;
