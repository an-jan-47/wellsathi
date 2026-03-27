/**
 * Client-side image processor for resizing and converting to WebP before upload.
 */
export const processDoctorImage = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    if (file.size > 2 * 1024 * 1024) {
      return reject(new Error('File size exceeds 2MB limit.'));
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return reject(new Error('Invalid file format. Only JPG, PNG, and WebP are allowed.'));
    }

    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      const MAX_WIDTH = 1024;
      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return reject(new Error('Failed to create canvas context.'));
      }

      // Draw the image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to WebP with 0.8 quality (approx 30-40% compression ratio usually)
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create image blob.'));
        },
        'image/webp',
        0.8
      );
    };

    img.onerror = () => reject(new Error('Failed to load image for processing.'));
  });
};
