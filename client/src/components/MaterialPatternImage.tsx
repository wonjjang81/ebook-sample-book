import { useState, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { createSeamlessTexture } from '@/lib/seamlessTexture';

/** Repeat the source at native CSS pixel size; never stretch a material swatch. */
export function MaterialPatternImage({ src, alt, className, ...props }: {
  src: string;
  alt: string;
} & HTMLAttributes<HTMLDivElement>) {
  const [loaded, setLoaded] = useState<{ src: string; texture: string } | null>(null);
  return (
    <div {...props} className={cn('relative overflow-hidden', className)} style={{
      ...props.style,
      backgroundImage: loaded?.src === src ? `url(${JSON.stringify(loaded.texture)})` : undefined,
      backgroundRepeat: 'repeat',
      backgroundPosition: 'center',
      backgroundSize: 'auto',
    }}>
      <img src={src} alt={alt} loading="lazy" decoding="async"
        className="absolute inset-0 h-full w-full object-none opacity-0"
        onLoad={(event) => setLoaded({ src, texture: createSeamlessTexture(event.currentTarget) ?? src })}
        onError={() => setLoaded(null)} />
    </div>
  );
}
