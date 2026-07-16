import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a base64 encoded image string to Cloudinary.
 * If the string is already a URL or is empty, it returns the string as is.
 * Gracefully falls back to base64 string storage if Cloudinary config is missing.
 */
export const uploadToCloudinary = async (base64Str: string): Promise<string> => {
  if (!base64Str || !base64Str.startsWith('data:image/')) {
    return base64Str; // Already a URL or empty
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.warn('Cloudinary credentials missing in env. Falling back to local MongoDB base64 storage.');
    return base64Str;
  }

  try {
    const uploadResponse = await cloudinary.uploader.upload(base64Str, {
      folder: 'kmb-tailor',
    });
    return uploadResponse.secure_url;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    return base64Str; // Fallback to base64 on failure
  }
};
