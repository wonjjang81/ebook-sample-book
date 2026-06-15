import { cn } from '@/lib/utils';
import { Check, Heart, ImageOff } from 'lucide-react';

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
  className?: string;
}

export function SampleCard({
  sample,
  isSelected = false,
  isLiked = false,
  onSelect,
  onLike,
  onClick,
  className,
}: SampleCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative bg-card rounded-2xl overflow-hidden cursor-pointer product-card border border-border/60',
        isSelected && 'ring-2 ring-primary ring-offset-1',
        className
      )}
    >
      {/* Image Container */}
      <div className="relative w-full aspect-square bg-muted overflow-hidden">
        {sample.image ? (
          <img
            src={sample.image}
            alt={sample.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/40 gap-2">
            <ImageOff className="w-8 h-8" />
            <span className="text-xs font-medium">이미지 준비중</span>
          </div>
        )}

        {/* Brand Badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/50 text-white backdrop-blur-sm tracking-wide">
            {sample.brand}
          </span>
        </div>

        {/* Action Buttons - 호버 시 표시 */}
        <div className="absolute bottom-2.5 right-2.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {onSelect && (
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
              className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center transition-all shadow-lg',
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white/90 text-gray-700 hover:bg-primary hover:text-white backdrop-blur-sm'
              )}
              title="선택"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          )}
          {onLike && (
            <button
              onClick={(e) => { e.stopPropagation(); onLike(); }}
              className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center transition-all shadow-lg',
                isLiked
                  ? 'bg-rose-500 text-white'
                  : 'bg-white/90 text-gray-700 hover:bg-rose-500 hover:text-white backdrop-blur-sm'
              )}
              title="찜하기"
            >
              <Heart className={cn('w-3.5 h-3.5', isLiked && 'fill-current')} />
            </button>
          )}
        </div>

        {/* 선택됨 표시 (항상 보임) */}
        {isSelected && (
          <div className="absolute top-2.5 right-2.5">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md">
              <Check className="w-3 h-3 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3.5">
        {/* 품번 */}
        <p className="text-[10px] font-mono text-muted-foreground/70 tracking-widest mb-1 uppercase">
          {sample.productNo}
        </p>
        {/* 제품명 */}
        <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 mb-2">
          {sample.name}
        </h3>
        {/* 스펙 태그 */}
        {sample.specs.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {sample.specs.slice(0, 2).map((spec, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-muted text-muted-foreground"
              >
                {spec}
              </span>
            ))}
            {sample.specs.length > 2 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-muted text-muted-foreground">
                +{sample.specs.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
