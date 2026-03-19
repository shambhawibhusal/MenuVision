import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
    rating: number;
    onRatingChange?: (rating: number) => void;
    readonly?: boolean;
    size?: number;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, onRatingChange, readonly = false, size = 24 }) => {
    const [hoverRating, setHoverRating] = React.useState(0);

    const displayRating = hoverRating || rating;

    const handleClick = (star: number, e: React.MouseEvent<HTMLButtonElement>) => {
        if (readonly) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const halfWidth = rect.width / 2;
        const newRating = clickX < halfWidth ? star - 0.5 : star;
        onRatingChange?.(Math.max(0.5, newRating));
    };

    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
                const fillPercentage = Math.max(0, Math.min(1, displayRating - (star - 1))) * 100;
                return (
                    <button
                        key={star}
                        type="button"
                        disabled={readonly}
                        onClick={(e) => handleClick(star, e)}
                        onMouseEnter={() => !readonly && setHoverRating(star)}
                        onMouseLeave={() => !readonly && setHoverRating(0)}
                        className={`transition-transform relative ${!readonly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
                        style={{ width: size, height: size }}
                    >
                        <Star
                            size={size}
                            className="absolute top-0 left-0 text-gray-200"
                            fill="currentColor"
                        />
                        <div
                            className="absolute top-0 left-0 overflow-hidden"
                            style={{ width: `${fillPercentage}%`, height: size }}
                        >
                            <Star
                                size={size}
                                className="text-amber-400"
                                fill="currentColor"
                            />
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

export default StarRating;
