import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Search, Camera, Leaf, X, SlidersHorizontal, MapPin, Loader2, Star, ArrowUpDown, SearchX, History, Trash2, UtensilsCrossed, Flame, ChevronRight, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dish, DishRating, DishGroup, MealLogEntry } from '@/types/dashboard';
import { NutritionGoals } from '@/types/nutritionGoals';
import MenuCard from './MenuCard';
import DishGroupCard from './DishGroupCard';
import { getSuggestions, getRecentSearches, addRecentSearch, clearRecentSearches } from '@/utils/search';
import { normalizePrice } from '@/utils/recommendations';
import { checkAllergens } from '@/services/allergyCheck';

interface DishAverageRating {
    dishId: string;
    averageRating: number;
    totalReviews: number;
}

interface HomeTabProps {
    searchText: string;
    setSearchText: (val: string) => void;
    setShowScanOptions: (val: boolean) => void;
    filteredDishes: Dish[];
    groupedDishes: DishGroup[];
    favoriteItems: Dish[];
    toggleRecommendedLike: (dish: Dish) => void;
    onSelectDish: (dish: Dish) => void;
    onAddToMealLog?: (dish: Dish) => void;
    isDishInMealLog?: (dishName: string) => boolean;
    dishRatings?: Record<string, DishRating>;
    dishAverageRatings?: Record<string, DishAverageRating>;
    dishPopularity?: Record<string, number>;
    userAllergens?: string[];
    activeFilters: {
        isVegetarian: boolean;
        isVegan: boolean;
        isGlutenFree: boolean;
        budget: string[];
        prepTime: string[];
        cuisine: string[];
        location: string;
        rating: string;
    };
    setActiveFilters: React.Dispatch<React.SetStateAction<{
        isVegetarian: boolean;
        isVegan: boolean;
        isGlutenFree: boolean;
        budget: string[];
        prepTime: string[];
        cuisine: string[];
        location: string;
        rating: string;
    }>>;
    locationLoading?: boolean;
    allDishes: Dish[];
    sortBy: string;
    setSortBy: (val: string) => void;
    onLocationClick?: (dish: Dish) => void;
    onNavigateToMealLog?: () => void;
    mealLogEntries?: MealLogEntry[];
    nutritionGoals?: NutritionGoals | null;
    recommendationsLoading?: boolean;
    dishesLoading?: boolean;
}

const SORT_OPTIONS = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'prep-time', label: 'Prep Time' },
];

const HomeTab: React.FC<HomeTabProps> = ({
    searchText,
    setSearchText,
    setShowScanOptions,
    filteredDishes,
    groupedDishes,
    favoriteItems,
    toggleRecommendedLike,
    onSelectDish,
    onAddToMealLog,
    isDishInMealLog,
    dishRatings = {},
    dishAverageRatings = {},
    dishPopularity = {},
    userAllergens = [],
    activeFilters,
    setActiveFilters,
    locationLoading = false,
    allDishes,
    sortBy,
    setSortBy,
    onLocationClick,
    onNavigateToMealLog,
    mealLogEntries = [],
    nutritionGoals = null,
    recommendationsLoading = false,
    dishesLoading = false,
}) => {
    const [showFilters, setShowFilters] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [showSort, setShowSort] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const sortRef = useRef<HTMLDivElement>(null);

    const mealLogStats = useMemo(() => {
        let totalCalories = 0;
        let totalCost = 0;
        mealLogEntries.forEach(entry => {
            const calStr = String(entry.calories || '');
            const calMatch = calStr.match(/(\d+)/);
            if (calMatch) totalCalories += parseInt(calMatch[1]);
            const priceStr = String(entry.price || '');
            const priceMatch = priceStr.match(/(\d+)/);
            if (priceMatch) totalCost += parseInt(priceMatch[1]);
        });
        return {
            count: mealLogEntries.length,
            totalCalories,
            totalCost
        };
    }, [mealLogEntries]);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setRecentSearches(getRecentSearches());
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setShowFilters(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
            if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
                setShowSort(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const suggestions = useMemo(() => {
        if (!searchText.trim()) return [];
        return getSuggestions(allDishes, searchText, 5);
    }, [allDishes, searchText]);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value);
        setShowSuggestions(true);
    }, [setSearchText]);

    const handleSearchSubmit = useCallback((query: string) => {
        if (query.trim()) {
            addRecentSearch(query.trim());
            setRecentSearches(getRecentSearches());
        }
        setShowSuggestions(false);
        inputRef.current?.blur();
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearchSubmit(searchText);
        }
    }, [searchText, handleSearchSubmit]);

    const handleSuggestionClick = useCallback((dish: Dish) => {
        setSearchText(dish.name);
        handleSearchSubmit(dish.name);
        onSelectDish(dish);
    }, [setSearchText, handleSearchSubmit, onSelectDish]);

    const handleRecentClick = useCallback((query: string) => {
        setSearchText(query);
        setShowSuggestions(false);
    }, [setSearchText]);

    const handleClearRecent = useCallback(() => {
        clearRecentSearches();
        setRecentSearches([]);
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
            cuisine: [],
            location: '',
            rating: ''
        });
    };

    const hasActiveFilters = activeFilters.isVegetarian || activeFilters.isVegan || activeFilters.isGlutenFree ||
        activeFilters.budget.length > 0 || activeFilters.prepTime.length > 0 || activeFilters.cuisine.length > 0 || activeFilters.location !== '' || activeFilters.rating !== '';

    const showSuggestionsDropdown = showSuggestions && (suggestions.length > 0 || (recentSearches.length > 0 && !searchText.trim()));

    const unsafeFilteredCount = useMemo(() => {
        if (userAllergens.length === 0) return 0;
        return filteredDishes.filter(d => !checkAllergens(d, userAllergens).isSafe).length;
    }, [filteredDishes, userAllergens]);

    const unsafeGroupedCount = useMemo(() => {
        if (userAllergens.length === 0) return 0;
        let count = 0;
        for (const group of groupedDishes) {
            count += group.restaurants.filter(d => !checkAllergens(d, userAllergens).isSafe).length;
        }
        return count;
    }, [groupedDishes, userAllergens]);

    return (
        <div className="p-5 pt-8 animate-fade">
            <div className="relative mb-8 group flex items-center gap-2">
                <div className="relative flex-1" ref={searchRef}>
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" size={20} />
                    <Input
                        ref={inputRef}
                        placeholder="Search for dishes, restaurants, ingredients..."
                        value={searchText}
                        onChange={handleSearchChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setShowSuggestions(true)}
                        className="h-14 pl-12 pr-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-2xl focus-visible:ring-amber-500 focus-visible:ring-offset-0 transition-all text-lg shadow-sm"
                    />
                    {searchText && (
                        <button
                            onClick={() => { setSearchText(''); setShowSuggestions(false); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    )}
                    {showSuggestionsDropdown && (
                        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                            {searchText.trim() && suggestions.length > 0 && (
                                <div className="p-2">
                                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Suggestions</div>
                                    {suggestions.map(dish => (
                                        <button
                                            key={dish.id}
                                            onClick={() => handleSuggestionClick(dish)}
                                            className="w-full px-3 py-2.5 rounded-lg hover:bg-amber-50 flex items-center gap-3 text-left transition-colors"
                                        >
                                            <Search size={14} className="text-gray-400 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900 truncate">{dish.name}</div>
                                                <div className="text-xs text-gray-500 truncate">{dish.place}{dish.cuisine ? ` · ${dish.cuisine}` : ''}</div>
                                            </div>
                                            {dish.price && <span className="text-xs text-green-600 font-medium shrink-0">{normalizePrice(dish.price)}</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {!searchText.trim() && recentSearches.length > 0 && (
                                <div className="p-2">
                                    <div className="flex items-center justify-between px-3 py-1.5">
                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Recent Searches</span>
                                        <button onClick={handleClearRecent} className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1">
                                            <Trash2 size={12} /> Clear
                                        </button>
                                    </div>
                                    {recentSearches.map((query, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleRecentClick(query)}
                                            className="w-full px-3 py-2.5 rounded-lg hover:bg-gray-50 flex items-center gap-3 text-left transition-colors"
                                        >
                                            <History size={14} className="text-gray-400 shrink-0" />
                                            <span className="text-gray-700 truncate">{query}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="relative" ref={sortRef}>
                    <Button
                        variant={sortBy !== 'relevance' ? "default" : "outline"}
                        size="icon"
                        onClick={() => setShowSort(!showSort)}
                        className={`h-14 w-14 rounded-2xl transition-all ${sortBy !== 'relevance' ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                        <ArrowUpDown size={22} />
                    </Button>
                    {showSort && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 p-2 z-50">
                            <div className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Sort By</div>
                            {SORT_OPTIONS.map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => { setSortBy(option.value); setShowSort(false); }}
                                    className={`w-full px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${sortBy === option.value ? 'bg-amber-50 text-amber-700 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
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
                                {['Nepali', 'Indian', 'Chinese', 'Other'].map(cuisine => (
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

                            <div className="border-t border-gray-200 my-3"></div>

                            <div className="space-y-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</span>
                                {[
                                    { value: 'nearby', label: 'Near me', icon: <MapPin size={14} /> },
                                    { value: 'kathmandu', label: 'Kathmandu', icon: <MapPin size={14} /> },
                                    { value: 'within2km', label: 'Within 2 km', icon: <MapPin size={14} /> }
                                ].map(item => (
                                    <label key={item.value} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="location"
                                            checked={activeFilters.location === item.value}
                                            onChange={() => setActiveFilters(prev => ({
                                                ...prev,
                                                location: prev.location === item.value ? '' : item.value
                                            }))}
                                            className="w-4 h-4 border-gray-300 text-amber-500 focus:ring-amber-500"
                                        />
                                        <span className="text-sm text-gray-700 flex items-center gap-1.5">
                                            {item.icon} {item.label}
                                        </span>
                                        {activeFilters.location === item.value && locationLoading && (
                                            <Loader2 size={14} className="animate-spin text-amber-500 ml-auto" />
                                        )}
                                    </label>
                                ))}
                            </div>

                            <div className="border-t border-gray-200 my-3"></div>

                            <div className="space-y-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rating</span>
                                {[
                                    { value: 'rated', label: 'Rated only' },
                                    { value: '3', label: '3+ stars' },
                                    { value: '4', label: '4+ stars' },
                                    { value: '4.5', label: '4.5+ stars' }
                                ].map(item => (
                                    <label key={item.value} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="rating"
                                            checked={activeFilters.rating === item.value}
                                            onChange={() => setActiveFilters(prev => ({
                                                ...prev,
                                                rating: prev.rating === item.value ? '' : item.value
                                            }))}
                                            className="w-4 h-4 border-gray-300 text-amber-500 focus:ring-amber-500"
                                        />
                                        <span className="text-sm text-gray-700 flex items-center gap-1.5">
                                            <Star size={14} className="text-amber-400" /> {item.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {searchText && (
                <div className="mb-4 px-1 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                        {searchText.trim() && groupedDishes.length > 0
                            ? `${groupedDishes.length} dish${groupedDishes.length !== 1 ? 'es' : ''} found`
                            : `${filteredDishes.length} result${filteredDishes.length !== 1 ? 's' : ''} found`
                        }
                    </span>
                    {sortBy !== 'relevance' && (
                        <span className="text-xs text-amber-600 font-medium">
                            Sorted by {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                        </span>
                    )}
                </div>
            )}

            <Card
                onClick={() => setShowScanOptions(true)}
                className="bg-green-500 border-none text-white relative cursor-pointer group mb-6 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all"
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

            {mealLogEntries.length > 0 && (
                <Card
                    onClick={onNavigateToMealLog}
                    className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all mb-10"
                >
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center shrink-0">
                            <UtensilsCrossed size={24} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h4 className="font-bold text-gray-900">My Meal Log</h4>
                                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                    {mealLogStats.count}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                                <span className="flex items-center gap-1">
                                    <Flame size={12} className="text-orange-500" /> {mealLogStats.totalCalories}{nutritionGoals ? ` / ${nutritionGoals.dailyCalories}` : ''} cal
                                </span>
                                <span>•</span>
                                <span>Rs. {mealLogStats.totalCost}</span>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-amber-500 shrink-0" />
                    </CardContent>
                </Card>
            )}

            <div className="flex justify-between items-center mb-6">
                <h3 className="text-gray-900 text-xl font-bold px-1">
                    {searchText.trim() ? 'Search Results' : 'Recommended for You'}
                </h3>
            </div>

            {!searchText.trim() && (dishesLoading || recommendationsLoading) ? (
                <div className="flex flex-col gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm animate-pulse">
                            <div className="flex gap-4">
                                <div className="w-20 h-20 bg-gray-200 rounded-xl shrink-0" />
                                <div className="flex-1 space-y-2.5">
                                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                                    <div className="flex gap-2">
                                        <div className="h-5 w-14 bg-gray-100 rounded-full" />
                                        <div className="h-5 w-12 bg-gray-100 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : searchText.trim() && groupedDishes.length > 0 ? (
                <div className="flex flex-col gap-4">
                    {unsafeGroupedCount > 0 && (
                        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm font-medium text-red-700">
                            <AlertTriangle size={16} />
                            {unsafeGroupedCount} dish{unsafeGroupedCount !== 1 ? 'es' : ''} across results contain{unsafeGroupedCount === 1 ? 's' : ''} your allergens
                        </div>
                    )}
                    {groupedDishes.map((group) => (
                        <DishGroupCard
                            key={group.name}
                            group={group}
                            onSelectDish={onSelectDish}
                            onLikeDish={toggleRecommendedLike}
                            isLiked={(dishName) => favoriteItems.some(fav => fav.name === dishName)}
                            dishRatings={dishRatings}
                            onLocationClick={onLocationClick}
                            userAllergens={userAllergens}
                        />
                    ))}
                </div>
            ) : filteredDishes.length > 0 ? (
                <div className="flex flex-col gap-4">
                    {unsafeFilteredCount > 0 && (
                        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm font-medium text-red-700">
                            <AlertTriangle size={16} />
                            {unsafeFilteredCount} of {filteredDishes.length} dish{filteredDishes.length !== 1 ? 'es' : ''} contain{unsafeFilteredCount === 1 ? 's' : ''} your allergens
                        </div>
                    )}
                    {filteredDishes.map((dish, index) => {
                        const dishName = dish?.name || 'Unknown';
                        const isLiked = favoriteItems.some(fav => fav.id === dish.id);
                        const ratingKey = `dish_${dishName.toLowerCase().trim()}`;
                        const userRating = dishRatings[ratingKey]?.rating || 0;
                        const avgRating = dishAverageRatings[dish?.datasetId || String(dish?.id || index)];
                        const inMealLog = isDishInMealLog ? isDishInMealLog(dishName) : false;
                        const restId = `${dish.place}_${dish.location || ''}`;
                        const viewKey = `${restId}|${dish.datasetId || String(dish.id)}`;
                        const popularity = dishPopularity[viewKey];
                        return (
                            <MenuCard
                                key={dish?.id || index}
                                item={dish}
                                onClick={() => onSelectDish(dish)}
                                isLiked={isLiked}
                                onLike={() => toggleRecommendedLike(dish)}
                                onLocationClick={() => onLocationClick?.(dish)}
                                onAddToMealLog={onAddToMealLog ? () => onAddToMealLog(dish) : undefined}
                                isInMealLog={inMealLog}
                                viewCount={popularity || 0}
                                rating={userRating}
                                averageRating={avgRating?.averageRating}
                                totalReviews={avgRating?.totalReviews}
                                userAllergens={userAllergens}
                                showHealthierBadge={true}
                            />
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <SearchX size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No dishes found</h3>
                    <p className="text-gray-500 text-sm max-w-xs">
                        {searchText
                            ? `No results for "${searchText}". Try a different search or adjust your filters.`
                            : 'Try adjusting your filters to discover more dishes.'
                        }
                    </p>
                    {hasActiveFilters && (
                        <Button
                            variant="outline"
                            onClick={clearAllFilters}
                            className="mt-4 rounded-xl border-amber-200 text-amber-600 hover:bg-amber-50"
                        >
                            Clear all filters
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};

export default HomeTab;
