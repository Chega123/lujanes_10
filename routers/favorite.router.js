const express = require('express');
const router = express.Router();
const favoriteController = require('../controller/favorite.controller');

// Toggle favorito
router.post('/favorites/:userId', favoriteController.toggleFavorite);

// Obtener favoritos
router.get('/favorites/:userId', favoriteController.getFavorites);

module.exports = router;
