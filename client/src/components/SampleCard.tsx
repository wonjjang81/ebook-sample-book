import { Card, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Check, Heart, Pencil } from 'lucide-react';
import { getProductThumb, useProductImages } from '@/hooks/useProductImage';
import { useState } from 'react';

interface SampleCardProps {
  sample: {
    id: string;
    productNo: string;
    name: string;
    brand: string;
    line: string;
    specs: string[];
    image: string;
  };
  isSelected?: boolean;
  isLiked?: boolean;
  onSelect?: () => void;
  onLike?: () => void;
  onClick?: () => void;
  onEdit?: () => void;
  className?: string;
}

export function SampleCard({
  sample,
  isSelected = false,
  isLiked = false,
  onSelect,
  onLike,
  onClick,
  onEdit,
  className,
}: SampleCardProps) {
  useProductImages();
  const imageSrc = getProductThumb(sample.id, sample.image);
  const [loadedImage, setLoadedImage] = useState<string | null>(null);

  return (
    <Card
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'link' : undefined}
      aria-label={onClick ? `${sample.name} 상세 보기` : undefined}
      onKeyDown={(event) => { if (event.target === event.currentTarget && event.key === 'Enter') onClick?.(); }}
      className={cn(
        'gap-0 py-0 overflow-hidden cursor-pointer transition-shadow duration-200 hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring',
        className
      )}
    >
      {/* Image Container */}
      <div className="relative w-full aspect-square bg-muted overflow-hidden">
        {imageSrc ? (
          <div className="w-full h-full" style={loadedImage === imageSrc ? {
            backgroundImage: `url(${JSON.stringify(imageSrc)})`,
            backgroundRepeat: 'repeat',
            backgroundPosition: 'center',
            backgroundSize: 'auto',
          } : undefined}>
          <img
            src={imageSrc}
            alt={sample.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoadedImage(imageSrc)}
            className="w-full h-full object-none opacity-0"
          />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <span className="text-sm">이미지 없음</span>
          </div>
        )}

        {/* Selection/Like Buttons */}
        <div className="absolute bottom-2 right-2 flex gap-1">
          {onEdit && (
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="w-11 h-11 rounded-lg bg-slate-900/80 text-white flex items-center justify-center hover:bg-slate-900" title="샘플 편집" aria-label={`${sample.name} 편집`}><Pencil className="w-4 h-4" /></button>
          )}
          {onSelect && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className={cn(
                'w-11 h-11 rounded-lg flex items-center justify-center transition-colors',
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white text-gray-700 hover:bg-blue-50'
              )}
              title="선택"
              aria-label={`${sample.name} 선택${isSelected ? ' 해제' : ''}`}
              aria-pressed={isSelected}
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          {onLike && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike();
              }}
              className={cn(
                'w-11 h-11 rounded-lg flex items-center justify-center transition-colors',
                isLiked
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-red-50'
              )}
              title="찜하기"
              aria-label={`${sample.name} 찜${isLiked ? ' 해제' : ''}`}
              aria-pressed={isLiked}
            >
              <Heart className={cn('w-4 h-4', isLiked && 'fill-current')} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <CardHeader className="p-4">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground truncate">{sample.brand} · {sample.line}</p>
          <div className="font-mono text-xs text-muted-foreground tracking-wider">
            {sample.productNo}
          </div>
          <h3 className="font-semibold text-foreground truncate text-sm" title={sample.name}>
            {sample.name}
          </h3>
        </div>
      </CardHeader>

      {/* Specs */}
    </Card>
  );
}
