import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { ScannedItem, Tab, Dish, DishRating } from '@/types/dashboard';
import { resolveScannedItems } from '@/services/menuDataset';
import { useDishAverageRatings } from '@/hooks/useDishAverageRatings';
import { checkAllergens } from '@/services/allergyCheck';
import { AlertTriangle, Star, Loader2 } from 'lucide-react';

interface ResultsTabProps {
    scannedItems: ScannedItem[];
    setSelectedDish: (item: ScannedItem) => void;
    setActiveTab: (t: Tab) => void;
    scannedItemLikes: Set<string>;
    onToggleLike: (item: ScannedItem) => void;
    dishRatings?: Record<string, DishRating>;
    onLocationClick?: (dish: Dish) => void;
    userAllergens?: string[];
    onAddToMealLog?: (item: ScannedItem) => void;
    isDishInMealLog?: (dishName: string) => boolean;
    restaurantPlace?: string;
    restaurantLocation?: string;
    onRateRestaurant?: (place: string, location: string) => void;
}

import MenuCard from './MenuCard';

const ResultsTab: React.FC<ResultsTabProps> = ({
    scannedItems,
    setSelectedDish,
    setActiveTab,
    scannedItemLikes,
    onToggleLike,
    dishRatings = {},
    onLocationClick,
    userAllergens = [],
    onAddToMealLog,
    isDishInMealLog,
    restaurantPlace,
    restaurantLocation,
    onRateRestaurant
}) => {
    const [resolvedItems, setResolvedItems] = useState<ScannedItem[]>([]);
    const [isResolving, setIsResolving] = useState(false);

    const dishIds = resolvedItems.map(item => item.datasetId || item.name).filter(Boolean);
    const dishAverageRatings = useDishAverageRatings(dishIds);

    useEffect(() => {
        let cancelled = false;
        const loadResolvedItems = async () => {
            if (scannedItems.length === 0) {
                setResolvedItems([]);
                return;
            }
            setIsResolving(true);
            try {
                const resolved = await resolveScannedItems(scannedItems);
                if (!cancelled) {
                    setResolvedItems(resolved);
                }
            } finally {
                if (!cancelled) {
                    setIsResolving(false);
                }
            }
        };
        loadResolvedItems();
        return () => { cancelled = true; };
    }, [scannedItems]);

    const unsafeCount = userAllergens.length > 0
        ? resolvedItems.filter(item => !checkAllergens(item, userAllergens).isSafe).length
        : 0;

    return (
        <div className="p-5 flex flex-col h-full animate-fade">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Analysis Results</h2>
            {unsafeCount > 0 && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm font-medium text-red-700">
                    <AlertTriangle size={16} />
                    {unsafeCount} of {resolvedItems.length} dish{resolvedItems.length !== 1 ? 'es' : ''} contain{unsafeCount === 1 ? 's' : ''} your allergens
                </div>
            )}
            <div className="flex flex-col gap-4 pb-20">
                {isResolving && (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                    </div>
                )}
                {!isResolving && resolvedItems.length === 0 && <p className="text-gray-500 text-center py-10 w-full">No items found.</p>}
                {resolvedItems.map((item, index) => {
                    const itemName = item?.name || 'Unknown';
                    const isLiked = scannedItemLikes.has(itemName);
                    const ratingKey = `dish_${itemName.toLowerCase().trim()}`;
                    const userRating = dishRatings[ratingKey]?.rating || 0;
                    const avgRating = dishAverageRatings[item?.datasetId || itemName];
                    const inMealLog = isDishInMealLog ? isDishInMealLog(itemName) : false;
                    const allergyInfo = checkAllergens(item, userAllergens);
                    return (
                        <MenuCard
                            key={index}
                            item={item}
                            onClick={() => setSelectedDish(item)}
                            isLiked={isLiked}
                            onLike={() => onToggleLike(item)}
                            onLocationClick={onLocationClick ? () => onLocationClick(item as Dish) : undefined}
                            onAddToMealLog={onAddToMealLog ? () => onAddToMealLog(item) : undefined}
                            isInMealLog={inMealLog}
                            allergyInfo={allergyInfo}
                            rating={userRating}
                            averageRating={avgRating?.averageRating}
                            totalReviews={avgRating?.totalReviews}
                        />
                    );
                })}
            </div>
            {restaurantPlace && onRateRestaurant && (
                <Button 
                    onClick={() => onRateRestaurant(restaurantPlace, restaurantLocation || '')}
                    className="mt-auto mb-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold h-12 rounded-xl"
                >
                    <Star className="w-5 h-5 mr-2" />
                    Rate This Restaurant
                </Button>
            )}
            <Button onClick={() => setActiveTab('home')} className="mb-4 bg-amber-400 text-black hover:bg-amber-500 font-bold h-12 rounded-xl">
                Scan Another
            </Button>
        </div>
    );
};

export default ResultsTab;
