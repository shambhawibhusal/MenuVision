import React, { useState, useRef, useEffect } from 'react';
import { Search, Camera, Leaf, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    activeFilters: {
        isVegetarian: boolean;
        isVegan: boolean;
        isGlutenFree: boolean;
        budget: string[];
        prepTime: string[];
        cuisine: string[];
    };
    setActiveFilters: (filters: {
        isVegetarian: boolean;
        isVegan: boolean;
        isGlutenFree: boolean;
        budget: string[];
        prepTime: string[];
        cuisine: string[];
    }) => void;
}

const HomeTab: React.FC<HomeTabProps> = ({
    searchText,
    setSearchText,
    setShowScanOptions,
    filteredDishes,
    favoriteItems,
    toggleRecommendedLike,
    onSelectDish,
    dishRatings = {},
    activeFilters,
    setActiveFilters
}) => {
    const [showFilters, setShowFilters] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setShowFilters(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleFilter = (filter: 'isVegetarian' | 'isVegan' | 'isGlutenFree') => {
        setActiveFilters(prev => ({ ...prev, [filter]: !prev[filter] }));
    };

    const toggleArrayFilter = (filter: 'budget' | 'prepTime' | 'cuisine', value: string) => {
        setActiveFilters(prev => ({
            ...prev,
            [filter]: prev[filter].includes(value)
                ? prev[filter].filter(v => v !== value)
                : [...prev[filter], value]
        }));
    };

    const clearAllFilters = () => {
        setActiveFilters({
            isVegetarian: false,
            isVegan: false,
            isGlutenFree: false,
            budget: [],
            prepTime: [],
            cuisine: []
        });
    };

    const hasActiveFilters = activeFilters.isVegetarian || activeFilters.isVegan || activeFilters.isGlutenFree || 
        activeFilters.budget.length > 0 || activeFilters.prepTime.length > 0 || activeFilters.cuisine.length > 0;
    return (
        <div className="p-5 pt-8 animate-fade">
            <div className="relative mb-8 group flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" size={20} />
                    <Input
                        placeholder="Search for dishes..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="h-14 pl-12 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-2xl focus-visible:ring-amber-500 focus-visible:ring-offset-0 transition-all text-lg shadow-sm"
                    />
                </div>
                <div className="relative" ref={filterRef}>
                    <Button
                        variant={hasActiveFilters ? "default" : "outline"}
                        size="icon"
                        onClick={() => setShowFilters(!showFilters)}
                        className={`h-14 w-14 rounded-2xl transition-all ${hasActiveFilters ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                        <SlidersHorizontal size={22} />
                    </Button>
                    {showFilters && (
                        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 p-3 z-50 max-h-[70vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-semibold text-gray-700">Filters</span>
                                {hasActiveFilters && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearAllFilters}
                                        className="text-xs text-amber-600 hover:text-amber-700 h-6 px-2"
                                    >
                                        Clear all
                                    </Button>
                                )}
                            </div>
                            
                            <div className="space-y-3">
                                <button
                                    onClick={() => toggleFilter('isVegetarian')}
                                    className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${activeFilters.isVegetarian ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeFilters.isVegetarian ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        <Leaf size={16} />
                                    </div>
                                    <span className="font-medium text-gray-700">Vegetarian</span>
                                    {activeFilters.isVegetarian && <X size={16} className="ml-auto text-green-500" />}
                                </button>
                                <button
                                    onClick={() => toggleFilter('isVegan')}
                                    className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${activeFilters.isVegan ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeFilters.isVegan ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        <span className="text-base">🌱</span>
                                    </div>
                                    <span className="font-medium text-gray-700">Vegan</span>
                                    {activeFilters.isVegan && <X size={16} className="ml-auto text-green-500" />}
                                </button>
                                <button
                                    onClick={() => toggleFilter('isGlutenFree')}
                                    className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${activeFilters.isGlutenFree ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeFilters.isGlutenFree ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        <span className="text-base">🌾</span>
                                    </div>
                                    <span className="font-medium text-gray-700">Gluten-Free</span>
                                    {activeFilters.isGlutenFree && <X size={16} className="ml-auto text-amber-500" />}
                                </button>
                            </div>

                            <div className="border-t border-gray-200 my-3"></div>

                            <div className="space-y-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Budget</span>
                                {[
                                    { value: 'budget', label: 'Under Rs 150' },
                                    { value: 'moderate', label: 'Rs 150 – Rs 300' },
                                    { value: 'expensive', label: 'Rs 300 – Rs 500' },
                                    { value: 'premium', label: 'Above Rs 500' }
                                ].map(item => (
                                    <label key={item.value} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={activeFilters.budget.includes(item.value)}
                                            onChange={() => toggleArrayFilter('budget', item.value)}
                                            className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                                        />
                                        <span className="text-sm text-gray-700">{item.label}</span>
                                    </label>
                                ))}
                            </div>

                            <div className="border-t border-gray-200 my-3"></div>

                            <div className="space-y-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Preparation Time</span>
                                {[
                                    { value: 'under15', label: 'Under 15 min' },
                                    { value: 'under30', label: 'Under 30 min' }
                                ].map(item => (
                                    <label key={item.value} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={activeFilters.prepTime.includes(item.value)}
                                            onChange={() => toggleArrayFilter('prepTime', item.value)}
                                            className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                                        />
                                        <span className="text-sm text-gray-700">{item.label}</span>
                                    </label>
                                ))}
                            </div>

                            <div className="border-t border-gray-200 my-3"></div>

                            <div className="space-y-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cuisine</span>
                                {['Nepali', 'Indian', 'Chinese'].map(cuisine => (
                                    <label key={cuisine} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={activeFilters.cuisine.includes(cuisine)}
                                            onChange={() => toggleArrayFilter('cuisine', cuisine)}
                                            className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                                        />
                                        <span className="text-sm text-gray-700">{cuisine}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
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
                    <CardDescription className="text-green-100 text-base">Click to capture your menu & analyze </CardDescription>
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
