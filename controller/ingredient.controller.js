const IngredientService = require('../services/ingredient.services');

exports.addIngredient = async (req, res) => {
  try {
    const { name, quantity, userId , image} = req.body;
    console.log('BODY:', req.body);
    const result = await IngredientService.addIngredient(userId, name, quantity, image);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getIngredients = async (req, res) => {
  try {
    const { userId } = req.query;
    const ingredients = await IngredientService.getIngredientsByUser(userId);
    res.status(200).json(ingredients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateIngredient = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, userId } = req.body;

    const updated = await IngredientService.updateIngredient(id, userId, quantity);
    if (!updated) {
      return res.status(404).json({ error: 'Ingrediente no encontrado o no autorizado' });
    }

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteIngredient = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const deleted = await IngredientService.deleteIngredient(id, userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Ingrediente no encontrado o no autorizado' });
    }

    res.status(200).json({ message: 'Ingrediente eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

