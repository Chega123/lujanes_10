const router = require('express').Router();
const IngredientController = require('../controller/ingredient.controller');

router.post('/ingredient', IngredientController.addIngredient);
router.get('/ingredient', IngredientController.getIngredients);
router.put('/ingredient/:id', IngredientController.updateIngredient); // actualizar cantidad
router.delete('/ingredient/:id', IngredientController.deleteIngredient); // eliminar


module.exports = router;
