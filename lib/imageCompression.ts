/**
 * Client-side image compression
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 2048,
  maxHeight: 2048,
  quality: 0.85,
  maxSizeKB: 500,
};

export async function compressImage(
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (file.size < (opts.maxSizeKB! * 1024)) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      
      if (width > opts.maxWidth! || height > opts.maxHeight!) {
        const ratio = Math.min(
          opts.maxWidth! / width,
          opts.maxHeight! / height
        );
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      let quality = opts.quality!;
      const minQuality = 0.5;

      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            if (blob.size > opts.maxSizeKB! * 1024 && quality > minQuality) {
              quality -= 0.1;
              tryCompress();
              return;
            }

            resolve(blob);
          },
          'image/jpeg',
          quality
        );
      };

      tryCompress();
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

export async function compressDataUrl(
  dataUrl: string,
  options: CompressionOptions = {}
): Promise<Blob> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return compressImage(blob, options);
}

export function getCompressionStats(originalSize: number, compressedSize: number): {
  originalKB: number;
  compressedKB: number;
  savedKB: number;
  percentage: number;
} {
  const originalKB = Math.round(originalSize / 1024);
  const compressedKB = Math.round(compressedSize / 1024);
  const savedKB = originalKB - compressedKB;
  const percentage = Math.round((savedKB / originalKB) * 100);

  return { originalKB, compressedKB, savedKB, percentage };
}
