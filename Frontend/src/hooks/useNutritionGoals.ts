import { useState, useEffect, useCallback } from 'react';
import { auth } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { NutritionGoals, UserBodyMetrics } from '@/types/nutritionGoals';
import { getNutritionGoals, saveNutritionGoals, getBodyMetrics, saveBodyMetrics } from '@/services/nutritionGoals';

interface UseNutritionGoalsReturn {
    goals: NutritionGoals | null;
    bodyMetrics: UserBodyMetrics | null;
    goalsLoading: boolean;
    saveGoals: (goals: NutritionGoals) => Promise<boolean>;
    saveMetrics: (metrics: UserBodyMetrics) => Promise<boolean>;
    refreshGoals: () => Promise<void>;
    hasGoals: boolean;
}

export function useNutritionGoals(): UseNutritionGoalsReturn {
    const [goals, setGoals] = useState<NutritionGoals | null>(null);
    const [bodyMetrics, setBodyMetrics] = useState<UserBodyMetrics | null>(null);
    const [goalsLoading, setGoalsLoading] = useState(true);

    const fetchGoals = useCallback(async () => {
        if (!auth.currentUser) return;
        setGoalsLoading(true);
        const [fetchedGoals, fetchedMetrics] = await Promise.all([
            getNutritionGoals(auth.currentUser.uid),
            getBodyMetrics(auth.currentUser.uid),
        ]);
        setGoals(fetchedGoals);
        setBodyMetrics(fetchedMetrics);
        setGoalsLoading(false);
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchGoals();
            } else {
                setGoals(null);
                setBodyMetrics(null);
                setGoalsLoading(false);
            }
        });
        return () => unsubscribe();
    }, [fetchGoals]);

    const handleSaveGoals = useCallback(async (newGoals: NutritionGoals): Promise<boolean> => {
        if (!auth.currentUser) return false;
        const success = await saveNutritionGoals(auth.currentUser.uid, newGoals);
        if (success) setGoals(newGoals);
        return success;
    }, []);

    const handleSaveMetrics = useCallback(async (metrics: UserBodyMetrics): Promise<boolean> => {
        if (!auth.currentUser) return false;
        const success = await saveBodyMetrics(auth.currentUser.uid, metrics);
        if (success) setBodyMetrics(metrics);
        return success;
    }, []);

    return {
        goals,
        bodyMetrics,
        goalsLoading,
        saveGoals: handleSaveGoals,
        saveMetrics: handleSaveMetrics,
        refreshGoals: fetchGoals,
        hasGoals: goals !== null,
    };
}
