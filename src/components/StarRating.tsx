import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  readonly = false,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-8 h-8',
  };

  // 5 stars, each can be half (0.5) or full (1)
  // Click on left half = 0.5, right half = 1.0 for that star position
  const handleClick = (starIndex: number, isRightHalf: boolean) => {
    if (readonly || !onChange) return;
    const newRating = starIndex + (isRightHalf ? 1 : 0.5);
    // If clicking the same value, reset to 0
    if (newRating === value) {
      onChange(0);
    } else {
      onChange(newRating);
    }
  };

  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = i + 1;
        const isFull = value >= starValue;
        const isHalf = !isFull && value >= starValue - 0.5;

        return (
          <div
            key={i}
            className={cn(
              'relative',
              !readonly && 'cursor-pointer hover:scale-110',
              'transition-all duration-150'
            )}
          >
            {/* Left half click area */}
            <div
              className="absolute left-0 top-0 w-1/2 h-full z-10"
              onClick={() => handleClick(i, false)}
            />
            {/* Right half click area */}
            <div
              className="absolute right-0 top-0 w-1/2 h-full z-10"
              onClick={() => handleClick(i, true)}
            />
            
            {/* Star icon with gradient for half fill */}
            <div className="relative">
              {/* Background star (empty) */}
              <Star
                className={cn(
                  sizeClasses[size],
                  'text-muted-foreground/40'
                )}
              />
              {/* Filled star overlay */}
              {(isFull || isHalf) && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: isFull ? '100%' : '50%' }}
                >
                  <Star
                    className={cn(
                      sizeClasses[size],
                      'fill-primary text-primary'
                    )}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};