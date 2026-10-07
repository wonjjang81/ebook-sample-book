import { useEffect, useState } from 'react';

/** Small originals are tiled at their native pixel size, never stretched. */
export function PatternImagePreview({ src, alt }: { src: string; alt: string }) {
  const [imageSize, setImageSize] = useState<{ src: string; width: number; height: number } | null>(null);
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const size = imageSize?.src === src ? imageSize : null;
  const width = Math.min(viewport.width * 0.95, viewport.width - 32);
  const height = Math.min(viewport.height * 0.9, viewport.height - 32);
  const tiled = !!size && (size.width < width || size.height < height);

  return (
    <div
      className="flex items-center justify-center overflow-hidden rounded-lg shadow-2xl"
      onClick={(event) => event.stopPropagation()}
      style={tiled ? {
        width, height,
        backgroundImage: `url(${JSON.stringify(src)})`,
        backgroundRepeat: 'repeat',
        backgroundPosition: 'center',
        backgroundSize: `${size.width}px ${size.height}px`,
      } : undefined}
    >
      <img
        src={src}
        alt={alt}
        onLoad={(event) => {
          const image = event.currentTarget;
          setImageSize({ src, width: image.naturalWidth, height: image.naturalHeight });
        }}
        style={tiled ? { width: 1, height: 1, opacity: 0 } : {
          maxWidth: width, maxHeight: height, objectFit: 'contain',
        }}
      />
    </div>
  );
}
