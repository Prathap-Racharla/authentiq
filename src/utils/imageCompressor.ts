/**
 * AuthentiQ Client-Side Image Optimizer
 * Downscales oversized mobile camera photos (e.g. 4032x3024) to a sharp,
 * OCR-optimized resolution (max 1800px) and compresses to high-quality JPEG.
 * This reduces upload payload by 90%+ (e.g. 12 MB -> 350 KB), making mobile
 * verification fast and responsive.
 */

export async function compressAndDownscaleImage(
  file: File,
  maxDimension = 1800,
  quality = 0.85
): Promise<File> {
  // Only process images (skip PDFs, SVGs, etc.)
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file;
  }

  // If already under 600 KB, avoid unnecessary re-encoding
  if (file.size < 600 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;

      // If dimensions are already within bounds and file is reasonable, return original
      if (Math.max(width, height) <= maxDimension && file.size < 1.2 * 1024 * 1024) {
        resolve(file);
        return;
      }

      // Calculate target dimensions preserving aspect ratio
      let targetWidth = width;
      let targetHeight = height;

      if (Math.max(width, height) > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        targetWidth = Math.round(width * scale);
        targetHeight = Math.round(height * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(file);
        return;
      }

      // High quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            // If compression didn't help, return original
            resolve(file);
            return;
          }

          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const compressedFile = new File([blob], `${baseName}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // Graceful fallback to original file
    };

    img.src = url;
  });
}

