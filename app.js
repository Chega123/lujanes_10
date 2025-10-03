const express = require('express');
const body_parser = require('body-parser');
const userRouter = require('./routers/user.router');
const ingredientRouter = require('./routers/ingredient.router');
const favoriteRouter = require('./routers/favorite.router'); 
const path = require('path');
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const cors = require('cors');

ffmpeg.setFfmpegPath(ffmpegPath);

const videoRouter = require("./routers/video.router");

const app = express();

// CORS - importante para que tu frontend pueda conectarse
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ya no necesitas servir archivos estáticos porque están en S3
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/videos", videoRouter);
app.use("/users", userRouter);
app.use(body_parser.json());
app.use('/', userRouter);
app.use('/', ingredientRouter);
app.use('/', favoriteRouter);

module.exports = app;