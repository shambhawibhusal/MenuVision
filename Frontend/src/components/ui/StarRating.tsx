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

    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={readonly}
                    onClick={() => !readonly && onRatingChange?.(star)}
                    onMouseEnter={() => !readonly && setHoverRating(star)}
                    onMouseLeave={() => !readonly && setHoverRating(0)}
                    className={`transition-transform ${!readonly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
                >
                    <Star
                        size={size}
                        className={`transition-colors ${
                            star <= displayRating
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-gray-200 text-gray-200'
                        }`}
                    />
                </button>
            ))}
        </div>
    );
};

export default StarRating;
