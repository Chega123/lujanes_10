const s3 = require('../config/s3.config');
const fs = require('fs');

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

/**
 * Sube un archivo a S3
 * @param {string} filePath - Ruta local del archivo
 * @param {string} key - Nombre/ruta del archivo en S3
 * @param {string} contentType - Tipo MIME del archivo
 * @returns {Promise<string>} URL del archivo en S3
 */
const uploadToS3 = async (filePath, key, contentType = 'application/octet-stream') => {
  const fileContent = fs.readFileSync(filePath);

  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileContent,
    ContentType: contentType,
    ACL: 'public-read' // O 'private' si prefieres usar URLs firmadas
  };

  try {
    const data = await s3.upload(params).promise();
    console.log(`✅ Archivo subido a S3: ${data.Location}`);
    
    // Eliminar archivo local después de subir
    fs.unlinkSync(filePath);
    
    return data.Location; // URL pública del archivo
  } catch (err) {
    console.error('Error subiendo a S3:', err);
    throw err;
  }
};

/**
 * Elimina un archivo de S3
 * @param {string} key - Nombre/ruta del archivo en S3
 */
const deleteFromS3 = async (key) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key
  };

  try {
    await s3.deleteObject(params).promise();
    console.log(`✅ Archivo eliminado de S3: ${key}`);
  } catch (err) {
    console.error('Error eliminando de S3:', err);
    throw err;
  }
};

/**
 * Genera una URL firmada temporal (para archivos privados)
 * @param {string} key - Nombre/ruta del archivo en S3
 * @param {number} expiresIn - Tiempo de expiración en segundos (default: 1 hora)
 */
const getSignedUrl = (key, expiresIn = 3600) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Expires: expiresIn
  };

  return s3.getSignedUrl('getObject', params);
};

module.exports = {
  uploadToS3,
  deleteFromS3,
  getSignedUrl
};