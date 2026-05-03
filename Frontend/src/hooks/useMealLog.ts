import { useState, useEffect, useCallback } from 'react';
import { auth } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { MealLogEntry, DailyMealLog, MealType } from '@/types/dashboard';
import {
    addDishToMealLog,
    removeDishFromMealLog,
    getMealLogForDate,
    getTodayDateString
} from '@/services/mealLog';
import { ScannedItem } from '@/types/dashboard';

interface UseMealLogReturn {
    todayLog: DailyMealLog | null;
    loading: boolean;
    addingItem: boolean;
    addToLog: (dish: ScannedItem, mealType: MealType) => Promise<boolean>;
    removeFromLog: (entry: MealLogEntry) => Promise<boolean>;
    isInLog: (dishName: string) => boolean;
    getEntryForDish: (dishName: string) => MealLogEntry | undefined;
    refreshLog: () => Promise<void>;
}

export function useMealLog(): UseMealLogReturn {
    const [todayLog, setTodayLog] = useState<DailyMealLog | null>(null);
    const [loading, setLoading] = useState(true);
    const [addingItem, setAddingItem] = useState(false);

    const fetchTodayLog = useCallback(async () => {
        if (!auth.currentUser) return;

        setLoading(true);
        const today = getTodayDateString();
        const log = await getMealLogForDate(auth.currentUser.uid, today);
        setTodayLog(log);
        setLoading(false);
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchTodayLog();
            } else {
                setTodayLog(null);
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
        addToLog,
        removeFromLog,
        isInLog,
        getEntryForDish,
        refreshLog: fetchTodayLog
    };
}