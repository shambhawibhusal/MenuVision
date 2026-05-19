import { useState, useEffect, useCallback } from 'react';
import { auth } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { MealLogEntry, DailyMealLog, MealType } from '@/types/dashboard';
import { MealLogNutritionSummary } from '@/types/nutritionGoals';
import {
    addDishToMealLog,
    removeDishFromMealLog,
    getMealLogForDate,
    getTodayDateString
} from '@/services/mealLog';
import { getDishById } from '@/services/menuDataset';
import { ScannedItem } from '@/types/dashboard';

interface UseMealLogReturn {
    todayLog: DailyMealLog | null;
    loading: boolean;
    addingItem: boolean;
    nutritionSummary: MealLogNutritionSummary | null;
    addToLog: (dish: ScannedItem, mealType: MealType) => Promise<boolean>;
    removeFromLog: (entry: MealLogEntry) => Promise<boolean>;
    isInLog: (dishName: string) => boolean;
    getEntryForDish: (dishName: string) => MealLogEntry | undefined;
    refreshLog: () => Promise<void>;
}

const EMPTY_SUMMARY: MealLogNutritionSummary = {
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    totalFiber: 0,
    totalSodium: 0,
    totalCost: 0,
    mealCount: 0,
};

const computeNutritionSummary = async (entries: MealLogEntry[]): Promise<MealLogNutritionSummary> => {
    const summary = { ...EMPTY_SUMMARY, mealCount: entries.length };

    const enriched = await Promise.all(entries.map(async (entry) => {
        let nutrition = null;
        if (entry.dishDatasetId) {
            const datasetItem = await getDishById(entry.dishDatasetId);
            if (datasetItem?.nutrition) {
                nutrition = datasetItem.nutrition;
            }
        }

        return { entry, nutrition };
    }));

    enriched.forEach(({ entry, nutrition }) => {
        const calStr = String(entry.calories || '');
        const calMatch = calStr.match(/(\d+)/);
        if (calMatch) summary.totalCalories += parseInt(calMatch[1]);

        const priceStr = String(entry.price || '');
        const priceMatch = priceStr.match(/(\d+)/);
        if (priceMatch) summary.totalCost += parseInt(priceMatch[1]);

        if (nutrition) {
            summary.totalProtein += nutrition.protein || 0;
            summary.totalCarbs += nutrition.carbohydrates || 0;
            summary.totalFat += nutrition.fat || 0;
            summary.totalFiber += nutrition.fiber || 0;
            summary.totalSodium += nutrition.sodium || 0;
        }
    });

    return summary;
};

export function useMealLog(): UseMealLogReturn {
    const [todayLog, setTodayLog] = useState<DailyMealLog | null>(null);
    const [loading, setLoading] = useState(true);
    const [addingItem, setAddingItem] = useState(false);
    const [nutritionSummary, setNutritionSummary] = useState<MealLogNutritionSummary | null>(null);

    const fetchTodayLog = useCallback(async () => {
        if (!auth.currentUser) return;

        setLoading(true);
        const today = getTodayDateString();
        const log = await getMealLogForDate(auth.currentUser.uid, today);
        setTodayLog(log);

        if (log?.entries && log.entries.length > 0) {
            const summary = await computeNutritionSummary(log.entries);
            setNutritionSummary(summary);
        } else {
            setNutritionSummary({ ...EMPTY_SUMMARY });
        }

        setLoading(false);
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchTodayLog();
            } else {
                setTodayLog(null);
                setNutritionSummary(null);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [fetchTodayLog]);

    const addToLog = useCallback(async (dish: ScannedItem, mealType: MealType): Promise<boolean> => {
        if (!auth.currentUser) return false;

        const dishName = dish?.name || 'Unknown Dish';
        
        if (isInLog(dishName)) {
            return false;
        }

        setAddingItem(true);
        const today = getTodayDateString();
        const entry: Omit<MealLogEntry, 'addedAt'> = {
            id: `${auth.currentUser.uid}_${Date.now()}`,
            dishId: dish.datasetId || dish.name,
            dishName: dishName,
            dishDatasetId: dish.datasetId,
            price: dish.price || '',
            place: dish.place,
            calories: dish.calories,
            imageUrl: dish.imageUrl || undefined,
            allergens: dish.allergens || [],
            mealType: mealType,
            date: today
        };

        const success = await addDishToMealLog(auth.currentUser.uid, entry);
        if (success) {
            await fetchTodayLog();
        }
        setAddingItem(false);
        return success;
    }, [fetchTodayLog]);

    const removeFromLog = useCallback(async (entry: MealLogEntry): Promise<boolean> => {
        if (!auth.currentUser) return false;

        const success = await removeDishFromMealLog(auth.currentUser.uid, entry);
        if (success) {
            await fetchTodayLog();
        }
        return success;
    }, [fetchTodayLog]);

    const isInLog = useCallback((dishName: string): boolean => {
        const entries = todayLog?.entries || [];
        return entries.some(
            entry => entry.dishName?.toLowerCase() === dishName?.toLowerCase()
        );
    }, [todayLog]);

    const getEntryForDish = useCallback((dishName: string): MealLogEntry | undefined => {
        const entries = todayLog?.entries || [];
        return entries.find(
            entry => entry.dishName?.toLowerCase() === dishName?.toLowerCase()
        );
    }, [todayLog]);

    return {
        todayLog,
        loading,
        addingItem,
        nutritionSummary,
        addToLog,
        removeFromLog,
        isInLog,
        getEntryForDish,
        refreshLog: fetchTodayLog
    };
}
