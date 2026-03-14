import React from 'react';
import { Search, Camera } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dish, DishRating } from '@/types/dashboard';
import MenuCard from './MenuCard';

interface HomeTabProps {
    searchText: string;
    setSearchText: (val: string) => void;
    setShowScanOptions: (val: boolean) => void;
    filteredDishes: Dish[];
    favoriteItems: Dish[];
    toggleRecommendedLike: (dish: Dish) => void;
    onSelectDish: (dish: Dish) => void;
    dishRatings?: Record<string, DishRating>;
}

const HomeTab: React.FC<HomeTabProps> = ({
    searchText,
    setSearchText,
    setShowScanOptions,
    filteredDishes,
    favoriteItems,
    toggleRecommendedLike,
    onSelectDish,
    dishRatings = {}
}) => {
    return (
        <div className="p-5 pt-8 animate-fade">
            <div className="relative mb-8 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" size={20} />
                <Input
                    placeholder="Search for dishes..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="h-14 pl-12 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-2xl focus-visible:ring-amber-500 focus-visible:ring-offset-0 transition-all text-lg shadow-sm"
                />
            </div>

            <Card
                onClick={() => setShowScanOptions(true)}
                className="bg-green-500 border-none text-white overflow-hidden relative cursor-pointer group mb-10 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all"
            >
                <div className="absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 opacity-10 group-hover:scale-110 transition-transform">
                    <Camera size={120} />
                </div>
                <CardHeader className="relative z-10 p-6">
                    <CardTitle className="text-2xl font-bold">Scan Menu</CardTitle>
                    <CardDescription className="text-green-100 text-base">Click to capture your menu & explore AI analysis</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 p-6 pt-0 flex justify-between items-center text-3xl">
                    <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full text-white">Try now</span>
                    📸
                </CardContent>
            </Card>

            <div className="flex justify-between items-center mb-6">
                <h3 className="text-gray-900 text-xl font-bold px-1">Recommended for You</h3>
                <span className="text-amber-600 text-sm font-medium hover:underline cursor-pointer">View All</span>
            </div>

<div className="flex flex-col gap-4">
                {filteredDishes.map(dish => {
                    const isLiked = favoriteItems.some(fav => fav.id === dish.id);
                    const ratingKey = `dish_${dish.name}`;
                    const userRating = dishRatings[ratingKey]?.rating || 0;
                    return (
                        <MenuCard
                            key={dish.id}
                            item={dish}
                            onClick={() => onSelectDish(dish)}
                            isLiked={isLiked}
                            onLike={() => toggleRecommendedLike(dish)}
                            rating={userRating}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default HomeTab;
