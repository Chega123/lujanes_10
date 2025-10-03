const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/google', async (req, res) => {
  const { name, email, photoUrl, googleId } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({ name, email, photoUrl, googleId });
      await user.save();
    }

    res.status(200).json({ message: 'Usuario autenticado', user });
  } catch (err) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

module.exports = router;
