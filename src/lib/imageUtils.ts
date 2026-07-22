/**
 * Client-safe image optimization helpers.
 * Transforms Cloudinary URLs to request lightweight, auto-formatted WebP thumbnails.
 */
export const getOptimizedImageUrl = (url: string, width = 600): string => {
  if (!url) return '';
  if (url.includes('cloudinary.com') && url.includes('/upload/')) {
    if (url.includes('/upload/w_')) return url;
    return url.replace('/upload/', `/upload/w_${width},c_limit,q_auto,f_auto/`);
  }
  return url;
};
