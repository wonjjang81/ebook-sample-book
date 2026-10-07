import { useEffect, useState } from 'react';
import { getLightingPixel, getLightingReference } from '@/lib/showroomLighting';

interface Props {
  photoUrl: string;
  maskUrl: string;
  textureUrl: string;
  label: string;
  opacity: number;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

export function ShowroomFilmLayer({ photoUrl, maskUrl, textureUrl, label, opacity }: Props) {
  const [lighting, setLighting] = useState<{ shadow: string; highlight: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    setLighting(null);
    Promise.all([loadImage(photoUrl), loadImage(maskUrl)]).then(([photo, mask]) => {
      const scale = Math.min(1, 1600 / Math.max(photo.naturalWidth, photo.naturalHeight));
      const width = Math.max(1, Math.round(photo.naturalWidth * scale));
      const height = Math.max(1, Math.round(photo.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) return;
      context.drawImage(mask, 0, 0, width, height);
      const alpha = context.getImageData(0, 0, width, height).data;
      context.clearRect(0, 0, width, height);
      // Remove fine source texture while retaining broad light and shadow gradients.
      context.filter = 'blur(2px)';
      context.drawImage(photo, 0, 0, width, height);
      context.filter = 'none';
      const pixels = context.getImageData(0, 0, width, height).data;
      const luminances: number[] = [];
      for (let i = 0; i < pixels.length; i += 16) {
        if (alpha[i + 3] > 240) luminances.push(pixels[i] * 0.2126 + pixels[i + 1] * 0.7152 + pixels[i + 2] * 0.0722);
      }
      const reference = getLightingReference(luminances);
      const shadow = context.createImageData(width, height);
      const highlight = context.createImageData(width, height);
      for (let i = 0; i < pixels.length; i += 4) {
        const light = getLightingPixel(pixels[i] * 0.2126 + pixels[i + 1] * 0.7152 + pixels[i + 2] * 0.0722, reference);
        shadow.data[i] = shadow.data[i + 1] = shadow.data[i + 2] = light.shadow;
        highlight.data[i] = highlight.data[i + 1] = highlight.data[i + 2] = light.highlight;
        shadow.data[i + 3] = highlight.data[i + 3] = 255;
      }
      context.putImageData(shadow, 0, 0);
      const shadowUrl = canvas.toDataURL();
      context.putImageData(highlight, 0, 0);
      if (!cancelled) setLighting({ shadow: shadowUrl, highlight: canvas.toDataURL() });
    }).catch(() => { /* CORS or decoding failure: retain original multiply fallback. */ });
    return () => { cancelled = true; };
  }, [photoUrl, maskUrl]);

  return <div aria-label={`${label} 필름 적용`} className="pointer-events-none absolute inset-0" style={{
    maskImage: `url("${maskUrl}")`, WebkitMaskImage: `url("${maskUrl}")`,
    maskSize: '100% 100%', WebkitMaskSize: '100% 100%', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
    maskMode: 'alpha', opacity: opacity / 100, isolation: 'isolate',
    mixBlendMode: lighting ? 'normal' : 'multiply',
  }}>
    <div className="absolute inset-0" style={{ backgroundImage: `url("${textureUrl}")`, backgroundRepeat: 'repeat', backgroundSize: 'auto' }} />
    {lighting && <>
      <img src={lighting.shadow} alt="" className="absolute inset-0 h-full w-full" style={{ mixBlendMode: 'multiply' }} />
      <img src={lighting.highlight} alt="" className="absolute inset-0 h-full w-full" style={{ mixBlendMode: 'screen' }} />
    </>}
  </div>;
}
