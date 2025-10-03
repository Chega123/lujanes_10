const mongoose = require('mongoose');

// Usar variable de entorno para la conexión a MongoDB Atlas
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/likitas';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB Conectado a Atlas"))
.catch((err) => console.error("❌ Error en MongoDB:", err));

module.exports = mongoose;