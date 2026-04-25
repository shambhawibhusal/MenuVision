import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScannedItem, Tab, Dish, DishRating } from '@/types/dashboard';
import { resolveScannedItems } from '@/services/menuDataset';
import { useDishAverageRatings } from '@/hooks/useDishAverageRatings';
import { checkAllergens } from '@/services/allergyCheck';

interface ResultsTabProps {
    viewMode: 'items' | 'text';
    setViewMode: (v: 'items' | 'text') => void;
    scannedItems: ScannedItem[];
    setSelectedDish: (item: ScannedItem) => void;
    fullText: string;
    setActiveTab: (t: Tab) => void;
    favoriteItems: Dish[];
    onToggleLike: (item: ScannedItem) => void;
    dishRatings?: Record<string, DishRating>;
    onLocationClick?: (dish: Dish) => void;
    userAllergens?: string[];
    onAddToMealLog?: (item: ScannedItem) => void;
    isDishInMealLog?: (dishName: string) => boolean;
}

import MenuCard from './MenuCard';

const ResultsTab: React.FC<ResultsTabProps> = ({
    viewMode,
    setViewMode,
    scannedItems,
    setSelectedDish,
    fullText,
    setActiveTab,
    favoriteItems,
    onToggleLike,
    dishRatings = {},
    onLocationClick,
    userAllergens = [],
    onAddToMealLog,
    isDishInMealLog
}) => {
    const [resolvedItems, setResolvedItems] = useState<ScannedItem[]>([]);

    const dishIds = resolvedItems.map(item => item.datasetId || item.name).filter(Boolean);
    const dishAverageRatings = useDishAverageRatings(dishIds);

    useEffect(() => {
        const loadResolvedItems = async () => {
            const resolved = await resolveScannedItems(scannedItems);
            setResolvedItems(resolved);
        };
        loadResolvedItems();
    }, [scannedItems]);

    return (
        <div className="p-5 flex flex-col h-full animate-fade">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Analysis Results</h2>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100 border border-gray-200 h-12 p-1 rounded-xl">
                    <TabsTrigger value="items" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all font-medium">Menu Items</TabsTrigger>
                    <TabsTrigger value="text" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all font-medium">Full Text</TabsTrigger>
                </TabsList>
<TabsContent value="items" className="mt-6">
                    <div className="flex flex-col gap-4 pb-20">
                        {resolvedItems.length === 0 && <p className="text-gray-500 text-center py-10 w-full">No items found.</p>}
                        {resolvedItems.map((item, index) => {
                            const itemName = item?.name || 'Unknown';
                            const isLiked = favoriteItems.some(fav => fav.name === itemName);
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
                </TabsContent>
                <TabsContent value="text" className="mt-6">
                    <Card className="bg-white border border-gray-200 shadow-sm text-gray-900 rounded-2xl">
                        <CardContent className="p-6 whitespace-pre-wrap max-h-[50vh] overflow-y-auto leading-relaxed text-sm">
                            {fullText || "No text extracted."}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            <Button onClick={() => setActiveTab('home')} className="mt-auto mb-4 bg-amber-400 text-black hover:bg-amber-500 font-bold h-12 rounded-xl">
                Scan Another
            </Button>
        </div>
    );
};

export default ResultsTab;
