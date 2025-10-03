const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Video = require("../model/video.model");
const User = require("../model/user.model");
const mongoose = require("mongoose");
const router = express.Router();
const ffmpeg = require("fluent-ffmpeg");
const { uploadToS3 } = require("../utils/s3Upload");

function generateThumbnail(videoPath, thumbnailDir, filename) {
  return new Promise((resolve, reject) => {
    const thumbnailPath = path.join(thumbnailDir, filename + ".jpg");

    // Crear directorio si no existe
    if (!fs.existsSync(thumbnailDir)) {
      fs.mkdirSync(thumbnailDir, { recursive: true });
    }

    ffmpeg(videoPath)
      .on("end", () => resolve(thumbnailPath))
      .on("error", (err) => reject(err))
      .screenshots({
        count: 1,
        folder: thumbnailDir,
        filename: filename + ".jpg",
        size: "560x380"
      });
  });
}

// Almacenamiento temporal local antes de subir a S3
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Subir video y foto
router.post(
  "/upload",
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "photo_dish", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { userId, description, tags, dishName, recipe, name } = req.body;

      if (!userId) return res.status(400).json({ message: "No se proporcionó userId" });
      if (!req.files || !req.files.video) return res.status(400).json({ message: "No se envió archivo de video" });
      if (!recipe || !recipe.trim()) return res.status(400).json({ message: "Se requiere la receta (recipe)" });

      const videoName = (name && name.trim()) || (dishName && dishName.trim()) || path.parse(req.files.video[0].originalname).name;

      const videoFile = req.files.video[0];
      const videoPath = videoFile.path;
      
      // Generar thumbnail
      const thumbnailDir = path.join(__dirname, "../temp/thumbnails");
      const filenameWithoutExt = path.parse(videoFile.filename).name;
      const thumbnailPath = await generateThumbnail(videoPath, thumbnailDir, filenameWithoutExt);

      // Subir video a S3
      const videoS3Key = `videos/${videoFile.filename}`;
      const videoUrl = await uploadToS3(videoPath, videoS3Key, 'video/mp4');

      // Subir thumbnail a S3
      const thumbnailS3Key = `thumbnails/${filenameWithoutExt}.jpg`;
      const thumbnailUrl = await uploadToS3(thumbnailPath, thumbnailS3Key, 'image/jpeg');

      // Parsear tags
      let parsedTags = [];
      if (tags) {
        try {
          parsedTags = tags.startsWith("[") ? JSON.parse(tags) : tags.split(",").map(t => t.trim());
        } catch (err) {
          console.error("Error parseando tags:", err);
        }
      }

      // Subir foto del plato si existe
      let photoDishUrl = "";
      if (req.files.photo_dish && req.files.photo_dish[0]) {
        const photoDishFile = req.files.photo_dish[0];
        const photoDishS3Key = `photo_dish/${photoDishFile.filename}`;
        photoDishUrl = await uploadToS3(photoDishFile.path, photoDishS3Key, 'image/jpeg');
      }

      // Guardar en DB con URLs de S3
      const video = new Video({
        name: videoName,
        url: videoUrl, // Ahora guarda la URL completa de S3
        description: description || "",
        user: new mongoose.Types.ObjectId(userId),
        thumbnail: thumbnailUrl, // URL completa del thumbnail
        tags: parsedTags,
        dishName: dishName || "",
        recipe: recipe.trim(),
        photo_dish: photoDishUrl,
      });

      await video.save();
      return res.status(201).json({ message: "Video subido correctamente!", video });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error al subir el video", error: err.message });
    }
  }
);

// Obtener todos los videos de un usuario con datos del usuario (populate)
router.get("/my", async (req, res) => {
  try {
    const { user } = req.query;
    if (!user) {
      return res.status(400).json({ message: "No userId provided" });
    }
    if (!mongoose.Types.ObjectId.isValid(user)) {
      return res.status(400).json({ message: "Invalid userId format" });
    }

    const videos = await Video.find({ user })
      .populate("user", "name email profileImage")
      .sort({ createdAt: -1 });

    res.json(videos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener los videos" });
  }
});

router.post("/:id/like", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "No se proporcionó userId" });

    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video no encontrado" });

    const alreadyLiked = video.likes.some(id => id.toString() === userId);
    if (alreadyLiked) {
      video.likes = video.likes.filter(id => id.toString() !== userId);
    } else {
      video.likes.push(userId);
    }

    await video.save();
    res.json({ likes: video.likes.length, liked: !alreadyLiked });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al dar like", error: err.message });
  }
});

// Agregar comentario
router.post("/:id/comments", async (req, res) => {
  try {
    const { userId, text } = req.body;
    if (!userId || !text) {
      return res.status(400).json({ message: "userId y text son requeridos" });
    }

    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video no encontrado" });

    video.comments.push({
      user: userId,
      text,
      createdAt: new Date()
    });

    await video.save();
    await video.populate("comments.user", "name profileImage");

    res.status(201).json({ status: true, comments: video.comments });
  } catch (err) {
    console.error("Error al agregar comentario:", err);
    res.status(500).json({ status: false, message: "Error al agregar comentario", error: err.message });
  }
});

// Obtener comentarios
router.get("/:id/comments", async (req, res) => {
  try {
    const video = await Video.findById(req.params.id).populate("comments.user", "name profileImage");
    if (!video) return res.status(404).json({ message: "Video no encontrado" });

    res.json({ status: true, comments: video.comments });
  } catch (err) {
    console.error("Error al obtener comentarios:", err);
    res.status(500).json({ status: false, message: "Error al obtener comentarios", error: err.message });
  }
});

// Favoritos
router.post('/favorite/:userId', async (req, res) => {
  const { videoId } = req.body;
  const userId = req.params.userId;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const video = await Video.findById(videoId);
    if (!video) return res.status(404).json({ message: "Video no encontrado" });

    const index = user.favoriteVideos.indexOf(videoId);

    if (index === -1) {
      user.favoriteVideos.push(videoId);
      console.log(`Video ${videoId} agregado a favoritos de usuario ${userId}`);
    } else {
      user.favoriteVideos.splice(index, 1);
      console.log(`Video ${videoId} quitado de favoritos de usuario ${userId}`);
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

// Obtener todos los videos
router.get("/", async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener los videos" });
  }
});

module.exports = router;