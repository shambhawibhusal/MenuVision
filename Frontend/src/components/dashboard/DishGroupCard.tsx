import React, { useState } from 'react';
import { Card, CardTitle } from "@/components/ui/card";
import { DishGroup, Dish, DishRating } from '@/types/dashboard';
import { Heart, MapPin, ChevronDown, ChevronUp, Star, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { normalizePrice } from '@/utils/recommendations';
import { checkAllergens } from '@/services/allergyCheck';

interface DishGroupCardProps {
    group: DishGroup;
    onSelectDish: (dish: Dish) => void;
    onLikeDish: (dish: Dish) => void;
    isLiked: (dishName: string) => boolean;
    dishRatings?: Record<string, DishRating>;
    onLocationClick?: (dish: Dish) => void;
    userAllergens?: string[];
}

const DishGroupCard: React.FC<DishGroupCardProps> = ({
    group,
    onSelectDish,
    onLikeDish,
    isLiked,
    dishRatings = {},
    onLocationClick,
    userAllergens = []
}) => {
    const [expanded, setExpanded] = useState(false);

    const sortedRestaurants = [...group.restaurants].sort((a, b) => {
        const ratingA = a.averageRating || 0;
        const ratingB = b.averageRating || 0;
        return ratingB - ratingA;
    });

    const unsafeDishes = userAllergens.length > 0
        ? sortedRestaurants.filter(d => !checkAllergens(d, userAllergens).isSafe)
        : [];
    const unsafeCount = unsafeDishes.length;

    return (
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden relative rounded-2xl">
            <div className="w-1.5 h-full bg-amber-400 absolute left-0 top-0 rounded-l-2xl" />
            <div className="p-4 pl-6">
                <div 
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => setExpanded(!expanded)}
                >
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl font-bold text-gray-900 leading-tight">
                            {group.name}
                        </CardTitle>
                        
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-amber-600 font-bold text-lg">
                                {group.priceRange}
                            </span>
                            
                            {group.primaryDish.cuisine && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                    {group.primaryDish.cuisine}
                                </span>
                            )}

                            {group.primaryDish.averageRating && group.primaryDish.averageRating > 0 && (
                                <div className="flex items-center gap-1">
                                    <Star size={14} className="text-amber-400 fill-amber-400" />
                                    <span className="text-sm text-gray-600 font-medium">
                                        {group.primaryDish.averageRating.toFixed(1)}
                                    </span>
                                </div>
                            )}

                            {unsafeCount > 0 && (
                                <span className="text-xs font-semibold text-red-600 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <AlertTriangle size={11} /> {unsafeCount} dish{unsafeCount !== 1 ? 'es' : ''} contain{unsafeCount === 1 ? 's' : ''} your allergens
                                </span>
                            )}
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full hover:bg-gray-100 shrink-0 ml-2"
                        onClick={(e) => {
                            e.stopPropagation();
                            setExpanded(!expanded);
                        }}
                    >
                        {expanded ? (
                            <ChevronUp size={20} className="text-gray-500" />
                        ) : (
                            <ChevronDown size={20} className="text-gray-500" />
                        )}
                    </Button>
                </div>

                {expanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                        {sortedRestaurants.map((dish, idx) => {
                            const dishName = dish.name || '';
                            const liked = isLiked(dishName);
                            const isGroupByRestaurant = group.name?.toLowerCase() === dish.place?.toLowerCase();
                            const allergyCheck = userAllergens.length > 0 ? checkAllergens(dish, userAllergens) : null;
                            const hasAllergenWarning = allergyCheck && !allergyCheck.isSafe;

                            return (
                                <div
                                    key={idx}
                                    className={`flex items-center justify-between p-3 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer ${
                                        hasAllergenWarning ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                                    }`}
                                    onClick={() => onSelectDish(dish)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900 truncate">
                                                {isGroupByRestaurant ? dishName : dish.place}
                                            </span>
                                            {hasAllergenWarning && (
                                                <span className="text-xs font-semibold text-red-600 bg-red-100 border border-red-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                                                    <AlertTriangle size={10} />
                                                </span>
                                            )}
                                            {dish.location && (
                                                <span className="text-xs text-gray-500 truncate">
                                                    {dish.location}
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-sm font-bold text-amber-600">
                                                {normalizePrice(dish.price)}
                                            </span>
                                            
                                            {dish.averageRating && dish.averageRating > 0 && (
                                                <div className="flex items-center gap-1">
                                                    <Star size={12} className="text-amber-400 fill-amber-400" />
                                                    <span className="text-xs text-gray-600">
                                                        {dish.averageRating.toFixed(1)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {dish.latitude && dish.longitude && onLocationClick && (
                                            <button
                                                className="text-xs text-amber-600 flex items-center gap-1 mt-1 hover:underline"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onLocationClick(dish);
                                                }}
                                            >
                                                <MapPin size={10} /> View on map
                                            </button>
                                        )}
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 rounded-full hover:bg-gray-200 shrink-0 ml-2"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onLikeDish(dish);
                                        }}
                                    >
                                        <Heart 
                                            size={20} 
                                            className={liked ? "fill-red-500 text-red-500" : "text-gray-400"} 
                                        />
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Card>
    );
};

export default DishGroupCard;