const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload file buffer directly to Cloudinary
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {String} folder - Target folder in Cloudinary
 * @returns {Promise<Object>} Upload result containing secure_url, public_id, etc.
 */
const uploadToCloudinary = (fileBuffer, folder = 'restaurant_products') => {
  return new Promise((resolve, reject) => {
    // If Cloudinary credentials are not configured, fallback warning / reject gracefully
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return reject(new Error('Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are missing in .env file.'));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto'
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

module.exports = {
  cloudinary,
  uploadToCloudinary
};
