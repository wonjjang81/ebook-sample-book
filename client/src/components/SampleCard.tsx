import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Check, Heart } from 'lucide-react';

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
    <Card
      onClick={onClick}
      className={cn(
        'overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105',
        className
      )}
    >
      {/* Image Container */}
      <div className="relative w-full aspect-square bg-muted overflow-hidden">
        {sample.image ? (
          <img
            src={sample.image}
            alt={sample.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <span className="text-sm">이미지 없음</span>
          </div>
        )}
        <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
          {sample.brand}
        </Badge>

        {/* Selection/Like Buttons */}
        <div className="absolute bottom-3 right-3 flex gap-1">
          {onSelect && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className={cn(
                'w-8 h-8 rounded flex items-center justify-center transition-all',
                isSelected
                  ? 'bg-blue-600 text-white'
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
                'w-8 h-8 rounded flex items-center justify-center transition-all',
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
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <div className="font-mono text-xs text-muted-foreground tracking-wider">
            {sample.productNo}
          </div>
          <h3 className="font-semibold text-foreground line-clamp-2 text-sm">
            {sample.name}
          </h3>
        </div>
      </CardHeader>

      {/* Specs */}
      {sample.specs.length > 0 && (
        <CardContent>
          <div className="space-y-1">
            {sample.specs.slice(0, 2).map((spec, idx) => (
              <p key={idx} className="text-xs text-muted-foreground line-clamp-1">
                • {spec}
              </p>
            ))}
            {sample.specs.length > 2 && (
              <p className="text-xs text-muted-foreground">
                +{sample.specs.length - 2}개 더보기
              </p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
