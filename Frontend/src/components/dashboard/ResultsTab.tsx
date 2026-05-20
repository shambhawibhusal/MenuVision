import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { ScannedItem, Tab, Dish, DishRating } from '@/types/dashboard';
import { resolveScannedItems } from '@/services/menuDataset';
import { useDishAverageRatings } from '@/hooks/useDishAverageRatings';
import { checkAllergens } from '@/services/allergyCheck';
import { AlertTriangle, Star, Loader2, ShoppingCart, X } from 'lucide-react';
import { extractPriceValue } from '@/utils/recommendations';

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
    const [orderItems, setOrderItems] = useState<Set<string>>(() => {
        try {
            const stored = sessionStorage.getItem('orderItems');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) return new Set(parsed);
            }
        } catch {}
        return new Set();
    });

    useEffect(() => {
        sessionStorage.setItem('orderItems', JSON.stringify([...orderItems]));
    }, [orderItems]);

    useEffect(() => {
        if (scannedItems.length === 0) {
            setOrderItems(new Set());
        }
    }, [scannedItems]);

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

    const toggleOrder = (itemName: string) => {
        setOrderItems(prev => {
            const next = new Set(prev);
            if (next.has(itemName)) {
                next.delete(itemName);
            } else {
                next.add(itemName);
            }
            return next;
        });
    };

    const orderTotal = React.useMemo(() => {
        let total = 0;
        resolvedItems.forEach(item => {
            const itemName = item?.name || '';
            if (orderItems.has(itemName)) {
                total += extractPriceValue(item.price || '0');
            }
        });
        return total;
    }, [resolvedItems, orderItems]);

    const orderItemsCount = orderItems.size;

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
                    const inOrder = orderItems.has(itemName);
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
                            onAddToOrder={() => toggleOrder(itemName)}
                            isInOrder={inOrder}
                            allergyInfo={allergyInfo}
                            rating={userRating}
                            averageRating={avgRating?.averageRating}
                            totalReviews={avgRating?.totalReviews}
                        />
                    );
                })}
            </div>
            {orderItemsCount > 0 && (
                <div className="mb-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl shadow-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                                <ShoppingCart className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">Order Items</p>
                                <p className="text-xs text-gray-500">{orderItemsCount} item{orderItemsCount !== 1 ? 's' : ''} in order</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Total Price</p>
                            <p className="text-2xl font-bold text-amber-600">Rs. {orderTotal}</p>
                        </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {resolvedItems.filter(item => orderItems.has(item?.name || '')).map((item, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 text-xs bg-white border border-amber-200 text-amber-700 px-2.5 py-1 rounded-full shadow-sm">
                                {item.name}
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleOrder(item.name); }}
                                    className="hover:text-red-500 transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            )}
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
