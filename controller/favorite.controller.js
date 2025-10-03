const User = require('../model/user.model');

// Añadir o eliminar receta favorita (toggle)
exports.toggleFavorite = async (req, res) => {
  const { userId } = req.params;
  const { recipeId, title, image } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const alreadyFavorite = user.favorites.some(fav => fav.recipeId === recipeId);

    if (alreadyFavorite) {
      user.favorites = user.favorites.filter(fav => fav.recipeId !== recipeId);
    } else {
      user.favorites.push({ recipeId, title, image });
    }

    await user.save();
    res.status(200).json({ success: true, favorites: user.favorites });
  } catch (error) {
    console.error('Error al actualizar favoritos', error);
    res.status(500).json({ error: 'Error al actualizar favoritos' });
  }
};

// Obtener recetas favoritas
exports.getFavorites = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.status(200).json({ favorites: user.favorites });
  } catch (error) {
    console.error('Error al obtener favoritos', error);
    res.status(500).json({ error: 'Error al obtener favoritos' });
  }
};
