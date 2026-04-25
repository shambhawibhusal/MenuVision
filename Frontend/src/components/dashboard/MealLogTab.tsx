import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScannedItem, MealLogEntry, MealType } from '@/types/dashboard';
import { useMealLog } from '@/hooks/useMealLog';
import { getDishById } from '@/services/menuDataset';
import { Utensils, Coffee, Moon, Apple, Calendar, Flame, Trash2, ChevronDown } from 'lucide-react';
import { formatDateForDisplay, getTodayDateString, getCurrentMealType } from '@/services/mealLog';

interface MealLogTabProps {
    onSelectDish?: (dish: ScannedItem) => void;
    onShowToast?: (message: string, type: 'success' | 'error') => void;
    selectedMealType?: MealType;
    onMealTypeChange?: (type: MealType) => void;
}

const MealTypeConfig: Record<MealType, { label: string; icon: React.ReactNode; emoji: string }> = {
    breakfast: { label: 'Breakfast', icon: <Coffee size={16} />, emoji: '🌅' },
    lunch: { label: 'Lunch', icon: <Utensils size={16} />, emoji: '☀️' },
    dinner: { label: 'Dinner', icon: <Moon size={16} />, emoji: '🌙' },
    snack: { label: 'Snack', icon: <Apple size={16} />, emoji: '🍎' }
};

const MealTypeDropdown: React.FC<{
    selected: MealType;
    onSelect: (type: MealType) => void;
}> = ({ selected, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const config = MealTypeConfig[selected];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-full transition-all"
            >
                <Utensils size={16} className="text-amber-600" />
                <span className="text-sm font-medium text-amber-800">
                    Adding to {config.label}
                </span>
                <ChevronDown size={14} className={`text-amber-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 min-w-[160px] animate-fade">
                    {(Object.keys(MealTypeConfig) as MealType[]).map(type => {
                        const typeConfig = MealTypeConfig[type];
                        return (
                            <button
                                key={type}
                                onClick={() => {
                                    onSelect(type);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors ${
                                    selected === type ? 'bg-amber-50 text-amber-800' : 'text-gray-700'
                                }`}
                            >
                                <span className="text-lg">{typeConfig.emoji}</span>
                                <span className="font-medium">{typeConfig.label}</span>
                                {selected === type && (
                                    <span className="ml-auto text-amber-600">✓</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const MealLogEntryCard: React.FC<{
    entry: MealLogEntry;
    onRemove: () => void;
    onClick?: () => void;
}> = ({ entry, onRemove, onClick }) => {
    const config = MealTypeConfig[entry.mealType] || MealTypeConfig.snack;
    
    return (
        <Card 
            className="bg-white hover:bg-amber-50/30 border border-gray-100 text-gray-900 transition-all cursor-pointer relative overflow-hidden"
            onClick={onClick}
        >
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                entry.mealType === 'breakfast' ? 'bg-orange-500' :
                entry.mealType === 'lunch' ? 'bg-green-500' :
                entry.mealType === 'dinner' ? 'bg-purple-500' : 'bg-amber-500'
            }`} />
            <CardContent className="p-4 pl-5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{config.emoji}</span>
                        <h4 className="font-semibold truncate">{entry.dishName || 'Unknown Dish'}</h4>
                    </div>
                    {entry.place && (
                        <p className="text-xs text-gray-500 truncate">{entry.place}</p>
                    )}
                    <div className="flex gap-3 mt-1 text-xs text-gray-600">
                        {entry.calories && (
                            <span className="flex items-center gap-1">
                                <Flame size={12} className="text-orange-500" /> {entry.calories}
                            </span>
                        )}
                        <span className="flex items-center gap-1 text-amber-600 font-medium">
                            {entry.price || 'N/A'}
                        </span>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    className="h-8 w-8 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 shrink-0"
                >
                    <Trash2 size={16} />
                </Button>
            </CardContent>
        </Card>
    );
};

const DailySummary: React.FC<{ entries: MealLogEntry[] }> = ({ entries }) => {
    const stats = useMemo(() => {
        let totalCalories = 0;
        let totalCost = 0;

        entries.forEach(entry => {
            const calStr = String(entry.calories || '');
            const calMatch = calStr.match(/(\d+)/);
            if (calMatch) totalCalories += parseInt(calMatch[1]);
            
            const priceStr = String(entry.price || '');
            const priceMatch = priceStr.match(/(\d+)/);
            if (priceMatch) totalCost += parseInt(priceMatch[1]);
        });

        return { totalCalories, totalCost, count: entries.length };
    }, [entries]);

    return (
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 mb-4">
            <CardContent className="p-4">
                <div className="flex justify-between items-center flex-wrap gap-3">
                    <div className="flex items-center gap-2 text-amber-700">
                        <Calendar size={18} />
                        <span className="font-bold">{formatDateForDisplay(getTodayDateString())}</span>
                    </div>
                    <div className="flex gap-3">
                        <div className="text-center px-3 py-1 bg-white/60 rounded-lg min-w-[60px]">
                            <p className="text-lg font-bold text-gray-900">{stats.count || 0}</p>
                            <p className="text-[10px] text-gray-500">meals</p>
                        </div>
                        <div className="text-center px-3 py-1 bg-white/60 rounded-lg min-w-[60px]">
                            <p className="text-lg font-bold text-orange-600">{stats.totalCalories || 0}</p>
                            <p className="text-[10px] text-gray-500">cal</p>
                        </div>
                        <div className="text-center px-3 py-1 bg-white/60 rounded-lg min-w-[60px]">
                            <p className="text-lg font-bold text-green-600">Rs.{stats.totalCost || 0}</p>
                            <p className="text-[10px] text-gray-500">spent</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const EmptyMealLog: React.FC = () => (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <Utensils size={32} className="text-amber-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">No meals logged today</h3>
        <p className="text-gray-500 text-sm max-w-xs">
            Tap the <span className="inline-flex items-center px-2 py-0.5 bg-amber-100 rounded text-amber-600 font-medium">🍽️</span> button on any dish to add it to your log.
        </p>
    </div>
);

const MealLogTab: React.FC<MealLogTabProps> = ({ 
    onSelectDish, 
    onShowToast,
    selectedMealType: externalMealType,
    onMealTypeChange 
}) => {
    const { todayLog, loading, removeFromLog } = useMealLog();
    const [internalMealType, setInternalMealType] = useState<MealType>(getCurrentMealType());
    const selectedMealType = externalMealType || internalMealType;
    const setSelectedMealType = onMealTypeChange || setInternalMealType;

    const handleSelectDish = async (entry: MealLogEntry) => {
        let fullData: ScannedItem = {
            name: entry.dishName,
            price: entry.price,
            place: entry.place,
            calories: entry.calories,
            imageUrl: entry.imageUrl,
            ingredients: [],
            allergens: [],
            isVegan: false,
            isVegetarian: false,
            isGlutenFree: false,
        };

        if (entry.dishDatasetId) {
            const datasetItem = await getDishById(entry.dishDatasetId);
            if (datasetItem) {
                fullData = {
                    ...fullData,
                    datasetId: entry.dishDatasetId,
                    description: datasetItem.description,
                    ingredients: datasetItem.ingredients || [],
                    allergens: datasetItem.allergens || [],
                    calories: datasetItem.calories || entry.calories,
                    prepTime: datasetItem.prepTime,
                    imageUrl: datasetItem.imageUrl || entry.imageUrl,
                    isVegan: datasetItem.isVegan,
                    isVegetarian: datasetItem.isVegetarian,
                    isGlutenFree: datasetItem.isGlutenFree,
                    origin: datasetItem.origin,
                    category: datasetItem.category,
                    latitude: datasetItem.latitude,
                    longitude: datasetItem.longitude,
                    nutrition: datasetItem.nutrition,
                };
            }
        }

        onSelectDish?.(fullData);
    };

    const groupedEntries = useMemo(() => {
        if (!todayLog?.entries) {
            return { breakfast: [], lunch: [], dinner: [], snack: [] };
        }
        const grouped: Record<MealType, MealLogEntry[]> = {
            breakfast: [],
            lunch: [],
            dinner: [],
            snack: []
        };
        todayLog.entries.forEach(entry => {
            const type = entry.mealType || 'snack';
            if (grouped[type]) {
                grouped[type].push(entry);
            } else {
                grouped.snack.push(entry);
            }
        });
        return grouped;
    }, [todayLog]);

    if (loading) {
        return (
            <div className="p-5 flex flex-col items-center justify-center h-full">
                <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-500">Loading your meals...</p>
            </div>
        );
    }

    return (
        <div className="p-5 flex flex-col h-full animate-fade overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Meal Log</h2>
                <MealTypeDropdown selected={selectedMealType} onSelect={setSelectedMealType} />
            </div>

            {todayLog?.entries && todayLog.entries.length > 0 && (
                <DailySummary entries={todayLog.entries} />
            )}

            <Tabs defaultValue="all" className="w-full flex-1">
                <TabsList className="grid w-full grid-cols-5 bg-gray-100 border border-gray-200 h-10 p-1 rounded-xl mb-4">
                    <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-black text-xs font-medium">
                        All
                    </TabsTrigger>
                    <TabsTrigger value="breakfast" className="rounded-lg data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 text-xs">
                        🌅
                    </TabsTrigger>
                    <TabsTrigger value="lunch" className="rounded-lg data-[state=active]:bg-green-100 data-[state=active]:text-green-700 text-xs">
                        ☀️
                    </TabsTrigger>
                    <TabsTrigger value="dinner" className="rounded-lg data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 text-xs">
                        🌙
                    </TabsTrigger>
                    <TabsTrigger value="snack" className="rounded-lg data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700 text-xs">
                        🍎
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-3">
                    {(!todayLog?.entries || todayLog.entries.length === 0) ? (
                        <EmptyMealLog />
                    ) : (
                        todayLog.entries.map(entry => (
                            <MealLogEntryCard
                                key={entry.id}
                                entry={entry}
                                onRemove={() => {
                                    removeFromLog(entry);
                                    onShowToast?.(`Removed ${entry.dishName || 'dish'}`, 'success');
                                }}
                                onClick={() => handleSelectDish(entry)}
                            />
                        ))
                    )}
                </TabsContent>

                {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map(mealType => (
                    <TabsContent key={mealType} value={mealType} className="space-y-3">
                        {groupedEntries[mealType].length === 0 ? (
                            <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                <div className="text-3xl mb-2">
                                    {MealTypeConfig[mealType].emoji}
                                </div>
                                <p>No {MealTypeConfig[mealType].label.toLowerCase()} logged yet</p>
                            </div>
                        ) : (
                            groupedEntries[mealType].map(entry => (
                                <MealLogEntryCard
                                    key={entry.id}
                                    entry={entry}
                                    onRemove={() => {
                                        removeFromLog(entry);
                                        onShowToast?.(`Removed ${entry.dishName || 'dish'}`, 'success');
                                    }}
                                    onClick={() => handleSelectDish(entry)}
                                />
                            ))
                        )}
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
};

export default MealLogTab;