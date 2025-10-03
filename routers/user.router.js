const express = require('express');
const mongoose = require('mongoose');
const UserController = require('../controller/user.controller');
const UserService = require('../services/user.services');
const User = require('../model/user.model');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { uploadToS3 } = require('../utils/s3Upload');

const router = express.Router();

// Almacenamiento temporal
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const tempDir = './temp/';
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage }).single('profileImage');

// Middleware para manejar S3
const uploadProfileImageMiddleware = async (req, res, next) => {
    if (req.file) {
        try {
            const s3Key = `profile_images/${req.file.filename}`;
            const s3Url = await uploadToS3(req.file.path, s3Key, req.file.mimetype);
            req.s3Url = s3Url; // Guardar URL para usar en el controlador
            next();
        } catch (err) {
            console.error('Error subiendo imagen a S3:', err);
            return res.status(500).json({ status: false, message: 'Error subiendo imagen', error: err.message });
        }
    } else {
        next();
    }
};

router.post('/registration', upload, uploadProfileImageMiddleware, UserController.register);
router.post('/login', UserController.login);
router.put('/update/:id', upload, uploadProfileImageMiddleware, UserController.updateUser);

// Get user by ID
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid userId format" });
        }

        const user = await UserService.getUserById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        console.log(`✅ Usuario encontrado: ${user.name}, favoritos: ${user.favoriteVideos ? user.favoriteVideos.length : 0}`);
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching user data", error: err.message });
    }
});

// Favoritos
router.post('/:userId/favorite-videos', async (req, res) => {
    const { videoId } = req.body;
    const { userId } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid userId format" });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

        const index = user.favoriteVideos.indexOf(videoId);

        if (index === -1) {
            user.favoriteVideos.push(videoId);
            console.log(`✅ Video ${videoId} agregado a favoritos de usuario ${userId}`);
        } else {
            user.favoriteVideos.splice(index, 1);
            console.log(`❌ Video ${videoId} quitado de favoritos de usuario ${userId}`);
        }

        await user.save();
        
        res.json({ 
            message: "Favoritos actualizados", 
            favoriteVideos: user.favoriteVideos,
            isFavorite: index === -1
        });
    } catch (error) {
        console.error("Error actualizando favoritos:", error);
        res.status(500).json({ message: "Error actualizando favoritos", error: error.message });
    }
});

module.exports = router;