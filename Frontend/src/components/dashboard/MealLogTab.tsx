import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { ScannedItem, MealLogEntry, MealType } from '@/types/dashboard';
import {
    MealLogNutritionSummary,
    NutritionGoals,
    UserBodyMetrics,
    MacroGoals,
    NUTRITION_META,
    ACTIVITY_LEVELS,
    DEFAULT_NUTRITION_GOALS,
    DEFAULT_BODY_METRICS,
} from '@/types/nutritionGoals';
import { useMealLog } from '@/hooks/useMealLog';
import { getDishById } from '@/services/menuDataset';
import { Utensils, Coffee, Moon, Apple, Calendar, Flame, Trash2, ChevronDown, AlertTriangle, Target, User, Save, Check, Pencil } from 'lucide-react';
import { formatDateForDisplay, getTodayDateString, getCurrentMealType } from '@/services/mealLog';
import { checkAllergens } from '@/services/allergyCheck';

interface MealLogTabProps {
    onSelectDish?: (dish: ScannedItem) => void;
    onShowToast?: (message: string, type: 'success' | 'error') => void;
    selectedMealType?: MealType;
    onMealTypeChange?: (type: MealType) => void;
    nutritionGoals?: NutritionGoals | null;
    bodyMetrics?: UserBodyMetrics | null;
    saveGoals?: (goals: NutritionGoals) => Promise<boolean>;
    saveMetrics?: (metrics: UserBodyMetrics) => Promise<boolean>;
    goalsLoading?: boolean;
    openGoalsEditor?: boolean;
    onGoalsEditorClosed?: () => void;
}

const MealTypeConfig: Record<MealType, { label: string; icon: React.ReactNode; emoji: string }> = {
    breakfast: { label: 'Breakfast', icon: <Coffee size={16} />, emoji: '🌅' },
    lunch: { label: 'Lunch', icon: <Utensils size={16} />, emoji: '☀️' },
    dinner: { label: 'Dinner', icon: <Moon size={16} />, emoji: '🌙' },
    snack: { label: 'Snack', icon: <Apple size={16} />, emoji: '🍎' }
};

const CalorieProgressRing: React.FC<{ current: number; target: number; size?: number }> = ({
    current,
    target,
    size = 72,
}) => {
    const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
    const radius = 28;
    const strokeWidth = 5;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    const center = size / 2;

    const getColor = () => {
        if (percentage >= 100) return '#ef4444';
        if (percentage >= 75) return '#f59e0b';
        return '#22c55e';
    };

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={getColor()}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-bold text-gray-900">{Math.round(percentage)}%</span>
            </div>
        </div>
    );
};

const MacroProgressBar: React.FC<{
    label: string;
    color: string;
    unit: string;
    current: number;
    target: number;
}> = ({ label, color, unit, current, target }) => {
    const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
    const getBarColor = () => {
        if (percentage >= 100) return 'bg-red-500';
        if (percentage >= 75) return 'bg-amber-500';
        return color;
    };

    return (
        <div className="space-y-1">
            <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 font-medium">{label}</span>
                <span className="text-xs text-gray-500">
                    {Math.round(current)} / {target} {unit}
                </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${getBarColor()}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

const MealLogEntryCard: React.FC<{
    entry: MealLogEntry;
    onRemove: () => void;
    onClick?: () => void;
    userAllergens?: string[];
}> = ({ entry, onRemove, onClick, userAllergens = [] }) => {
    const config = MealTypeConfig[entry.mealType] || MealTypeConfig.snack;
    const allergyCheck = userAllergens.length > 0 && entry.allergens && entry.allergens.length > 0
        ? checkAllergens({ name: entry.dishName, price: '', allergens: entry.allergens }, userAllergens)
        : null;
    const hasAllergenWarning = allergyCheck && !allergyCheck.isSafe;
    
    return (
        <Card 
            className={`bg-white hover:bg-amber-50/30 border text-gray-900 transition-all cursor-pointer relative overflow-hidden ${
                hasAllergenWarning ? 'border-red-300 bg-red-50/20' : 'border-gray-100'
            }`}
            onClick={onClick}
        >
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                hasAllergenWarning ? 'bg-red-500' :
                entry.mealType === 'breakfast' ? 'bg-orange-500' :
                entry.mealType === 'lunch' ? 'bg-green-500' :
                entry.mealType === 'dinner' ? 'bg-purple-500' : 'bg-amber-500'
            }`} />
            <CardContent className="p-4 pl-5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{config.emoji}</span>
                        <h4 className="font-semibold truncate">{entry.dishName || 'Unknown Dish'}</h4>
                        {hasAllergenWarning && (
                            <span className="text-xs font-semibold text-red-600 bg-red-100 border border-red-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                                <AlertTriangle size={10} /> {allergyCheck?.matchingAllergens.join(', ')}
                            </span>
                        )}
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

const DailySummary: React.FC<{
    summary: MealLogNutritionSummary | null;
    goals: NutritionGoals | null;
    onSetGoals?: () => void;
}> = ({ summary, goals, onSetGoals }) => {
    if (!summary) return null;

    const hasGoals = goals !== null;
    const caloriePct = hasGoals && goals!.dailyCalories > 0
        ? Math.min((summary.totalCalories / goals!.dailyCalories) * 100, 100)
        : 0;

    return (
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 mb-4">
            <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center flex-wrap gap-3">
                    <div className="flex items-center gap-2 text-amber-700">
                        <Calendar size={18} />
                        <span className="font-bold">{formatDateForDisplay(getTodayDateString())}</span>
                    </div>
                    <div className="flex gap-2">
                        <div className="text-center px-3 py-1 bg-white/60 rounded-lg min-w-[54px]">
                            <p className="text-lg font-bold text-gray-900">{summary.mealCount || 0}</p>
                            <p className="text-[10px] text-gray-500">meals</p>
                        </div>
                        <div className="text-center px-3 py-1 bg-white/60 rounded-lg min-w-[54px]">
                            <p className="text-lg font-bold text-orange-600">{summary.totalCalories || 0}</p>
                            <p className="text-[10px] text-gray-500">cal</p>
                        </div>
                        <div className="text-center px-3 py-1 bg-white/60 rounded-lg min-w-[54px]">
                            <p className="text-lg font-bold text-green-600">Rs.{summary.totalCost || 0}</p>
                            <p className="text-[10px] text-gray-500">spent</p>
                        </div>
                    </div>
                </div>

                {hasGoals ? (
                    <div className="border-t border-amber-200 pt-3 space-y-3">
                        <div className="flex items-center gap-3">
                            <CalorieProgressRing
                                current={summary.totalCalories}
                                target={goals!.dailyCalories}
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800">
                                    {summary.totalCalories} / {goals!.dailyCalories} kcal
                                </p>
                                <p className="text-xs text-gray-500">
                                    {caloriePct >= 100 ? 'Goal reached!' : `${Math.round(caloriePct)}% of daily goal`}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {NUTRITION_META.map(({ key, label, unit, color }) => {
                                const summaryKey = key === 'proteinGrams' ? 'totalProtein' :
                                    key === 'carbsGrams' ? 'totalCarbs' :
                                    key === 'fatGrams' ? 'totalFat' :
                                    key === 'fiberGrams' ? 'totalFiber' :
                                    'totalSodium';
                                const current = summary[summaryKey as keyof MealLogNutritionSummary] as number || 0;
                                const target = goals!.macros[key];
                                return (
                                    <MacroProgressBar
                                        key={key}
                                        label={label}
                                        color={color}
                                        unit={unit}
                                        current={current}
                                        target={target}
                                    />
                                );
                            })}
                        </div>

                        <button
                            onClick={onSetGoals}
                            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/80 hover:bg-white border border-amber-200 text-amber-600 text-xs font-medium transition-colors"
                        >
                            <Pencil size={13} />
                            Edit Goals
                        </button>
                    </div>
                ) : (
                    <div className="border-t border-amber-200 pt-3">
                        <button
                            onClick={onSetGoals}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/80 hover:bg-white border border-dashed border-amber-300 text-amber-700 text-sm font-medium transition-colors"
                        >
                            <Target size={16} />
                            Set your daily nutrition goals
                        </button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

const NutritionGoalsDialog: React.FC<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialGoals: NutritionGoals | null;
    initialBodyMetrics: UserBodyMetrics | null;
    onSaveGoals: (goals: NutritionGoals) => Promise<boolean>;
    onSaveMetrics: (metrics: UserBodyMetrics) => Promise<boolean>;
    saving?: boolean;
}> = ({ open, onOpenChange, initialGoals, initialBodyMetrics, onSaveGoals, onSaveMetrics, saving = false }) => {
    const [bodyMetrics, setBodyMetrics] = useState<UserBodyMetrics>(
        initialBodyMetrics || { ...DEFAULT_BODY_METRICS }
    );
    const [goals, setGoals] = useState<NutritionGoals>(
        initialGoals || { ...DEFAULT_NUTRITION_GOALS }
    );
    const [isSaving, setIsSaving] = useState(saving);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (initialGoals) setGoals(initialGoals);
        if (initialBodyMetrics) setBodyMetrics(initialBodyMetrics);
    }, [initialGoals, initialBodyMetrics]);

    const updateMacro = (key: keyof MacroGoals, value: string) => {
        const num = parseInt(value) || 0;
        setGoals(prev => ({
            ...prev,
            macros: { ...prev.macros, [key]: Math.max(0, num) },
        }));
    };

    const updateBodyMetric = (key: keyof UserBodyMetrics, value: string) => {
        const num = key === 'gender' || key === 'activityLevel' ? value : (parseInt(value) || undefined);
        setBodyMetrics(prev => ({ ...prev, [key]: num }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        const [goalsOk, metricsOk] = await Promise.all([
            onSaveGoals(goals),
            onSaveMetrics(bodyMetrics),
        ]);
        if (goalsOk && metricsOk) {
            setSaved(true);
            setTimeout(() => {
                setSaved(false);
                onOpenChange(false);
            }, 800);
        }
        setIsSaving(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-3xl p-6 border-none max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Target size={20} className="text-amber-500" />
                        Nutrition Goals
                    </DialogTitle>
                    <DialogDescription>
                        Set your daily nutrition targets to track progress
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="border border-gray-100 rounded-2xl p-4 space-y-3">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                            <User size={16} className="text-gray-500" />
                            Body Metrics <span className="text-xs font-normal text-gray-400">(optional)</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs text-gray-500 mb-1 block">Age</Label>
                                <Input
                                    type="number"
                                    placeholder="e.g., 25"
                                    value={bodyMetrics.age || ''}
                                    onChange={(e) => updateBodyMetric('age', e.target.value)}
                                    className="rounded-xl h-9"
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-gray-500 mb-1 block">Weight (kg)</Label>
                                <Input
                                    type="number"
                                    placeholder="e.g., 70"
                                    value={bodyMetrics.weightKg || ''}
                                    onChange={(e) => updateBodyMetric('weightKg', e.target.value)}
                                    className="rounded-xl h-9"
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-gray-500 mb-1 block">Height (cm)</Label>
                                <Input
                                    type="number"
                                    placeholder="e.g., 170"
                                    value={bodyMetrics.heightCm || ''}
                                    onChange={(e) => updateBodyMetric('heightCm', e.target.value)}
                                    className="rounded-xl h-9"
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-gray-500 mb-1 block">Gender</Label>
                                <select
                                    value={bodyMetrics.gender || ''}
                                    onChange={(e) => updateBodyMetric('gender', e.target.value)}
                                    className="w-full h-9 rounded-xl border border-gray-200 px-3 text-sm bg-white"
                                >
                                    <option value="">Not set</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs text-gray-500 mb-1 block">Activity Level</Label>
                            <select
                                value={bodyMetrics.activityLevel || ''}
                                onChange={(e) => updateBodyMetric('activityLevel', e.target.value)}
                                className="w-full h-9 rounded-xl border border-gray-200 px-3 text-sm bg-white"
                            >
                                <option value="">Not set</option>
                                {ACTIVITY_LEVELS.map((level) => (
                                    <option key={level.value} value={level.value}>
                                        {level.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="border border-gray-100 rounded-2xl p-4 space-y-3">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                            <Target size={16} className="text-amber-500" />
                            Daily Targets
                        </h3>
                        <div>
                            <Label className="text-xs text-gray-500 mb-1 block">Daily Calories (kcal)</Label>
                            <Input
                                type="number"
                                placeholder="e.g., 2000"
                                value={goals.dailyCalories || ''}
                                onChange={(e) => setGoals(prev => ({
                                    ...prev,
                                    dailyCalories: Math.max(0, parseInt(e.target.value) || 0),
                                }))}
                                className="rounded-xl h-9 text-lg font-bold"
                            />
                        </div>

                        <div className="border-t border-gray-100 pt-3">
                            <Label className="text-xs text-gray-500 mb-3 block uppercase tracking-wide font-semibold">
                                Macronutrient Targets
                            </Label>
                            <div className="space-y-3">
                                {NUTRITION_META.map(({ key, label, color, unit }) => (
                                    <div key={key} className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full shrink-0 ${color}`} />
                                        <span className="text-sm text-gray-700 w-14 shrink-0">{label}</span>
                                        <Input
                                            type="number"
                                            value={goals.macros[key] || ''}
                                            onChange={(e) => updateMacro(key, e.target.value)}
                                            className="rounded-lg h-9 w-20 text-center text-sm"
                                        />
                                        <span className="text-xs text-gray-400">{unit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full h-12 rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-bold text-base"
                >
                    {isSaving ? (
                        'Saving...'
                    ) : saved ? (
                        <span className="flex items-center gap-2">
                            <Check size={18} /> Goals Saved
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <Save size={18} /> Save Goals
                        </span>
                    )}
                </Button>
            </DialogContent>
        </Dialog>
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

const MealLogTab: React.FC<MealLogTabProps & { userAllergens?: string[] }> = ({ 
    onSelectDish, 
    onShowToast,
    selectedMealType: externalMealType,
    onMealTypeChange,
    userAllergens = [],
    nutritionGoals,
    bodyMetrics,
    saveGoals,
    saveMetrics,
    goalsLoading = false,
    openGoalsEditor = false,
    onGoalsEditorClosed,
}) => {
    const { todayLog, loading, removeFromLog, nutritionSummary } = useMealLog();
    const [internalMealType, setInternalMealType] = useState<MealType>(getCurrentMealType());
    const selectedMealType = externalMealType || internalMealType;
    const setSelectedMealType = onMealTypeChange || setInternalMealType;
    const [showGoalsModal, setShowGoalsModal] = useState(false);

    useEffect(() => {
        if (openGoalsEditor) {
            setShowGoalsModal(true);
            onGoalsEditorClosed?.();
        }
    }, [openGoalsEditor]);

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

            <DailySummary
                summary={nutritionSummary}
                goals={nutritionGoals ?? null}
                onSetGoals={() => setShowGoalsModal(true)}
            />

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
                                userAllergens={userAllergens}
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
                                    userAllergens={userAllergens}
                                />
                            ))
                        )}
                    </TabsContent>
                ))}
            </Tabs>

            <NutritionGoalsDialog
                open={showGoalsModal}
                onOpenChange={setShowGoalsModal}
                initialGoals={nutritionGoals ?? null}
                initialBodyMetrics={bodyMetrics ?? null}
                onSaveGoals={saveGoals ?? (async () => false)}
                onSaveMetrics={saveMetrics ?? (async () => false)}
                saving={goalsLoading}
            />
        </div>
    );
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

export default MealLogTab;
