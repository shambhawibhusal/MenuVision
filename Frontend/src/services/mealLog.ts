import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { MealLogEntry, DailyMealLog, MealType } from '@/types/dashboard';

const generateMealLogId = (userId: string, date: string) => `${userId}_${date}`;

export const addDishToMealLog = async (
    userId: string,
    entry: Omit<MealLogEntry, 'addedAt'>
): Promise<boolean> => {
    try {
        const dateStr = new Date().toISOString().split('T')[0];
        const docId = generateMealLogId(userId, dateStr);
        const docRef = doc(db, 'mealLogs', docId);

        const fullEntry: MealLogEntry = {
            ...entry,
            addedAt: new Date().toISOString()
        };

        await setDoc(docRef, {
            date: dateStr,
            entries: arrayUnion(fullEntry),
            updatedAt: serverTimestamp()
        }, { merge: true });

        return true;
    } catch (error) {
        console.error('Error adding dish to meal log:', error);
        return false;
    }
};

export const removeDishFromMealLog = async (
    userId: string,
    entry: MealLogEntry
): Promise<boolean> => {
    try {
        const docId = generateMealLogId(userId, entry.date);
        const docRef = doc(db, 'mealLogs', docId);

        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            console.log('Meal log document does not exist');
            return false;
        }

        const currentData = docSnap.data();
        const currentEntries = currentData.entries || [];
        
        if (currentEntries.length === 1) {
            await deleteDoc(docRef);
        } else {
            await setDoc(docRef, {
                entries: arrayRemove(entry)
            }, { merge: true });
        }

        return true;
    } catch (error) {
        console.error('Error removing dish from meal log:', error);
        return false;
    }
};

export const getMealLogForDate = async (
    userId: string,
    date: string
): Promise<DailyMealLog | null> => {
    try {
        const docId = generateMealLogId(userId, date);
        const docRef = doc(db, 'mealLogs', docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                date: data.date,
                entries: data.entries || [],
                totalCalories: data.totalCalories,
                totalCost: data.totalCost
            };
        }

        return null;
    } catch (error) {
        console.error('Error getting meal log:', error);
        return null;
    }
};

export const updateMealLogNutrition = async (
    userId: string,
    date: string,
    entries: MealLogEntry[]
): Promise<boolean> => {
    try {
        const docId = generateMealLogId(userId, date);
        const docRef = doc(db, 'mealLogs', docId);

        const totalCalories = entries.reduce((sum, entry) => {
            const calStr = String(entry.calories || '');
            const calMatch = calStr.match(/(\d+)/);
            return sum + (calMatch ? parseInt(calMatch[1]) : 0);
        }, 0);

        const totalCost = entries.reduce((sum, entry) => {
            const priceStr = String(entry.price || '');
            const priceMatch = priceStr.match(/(\d+)/);
            return sum + (priceMatch ? parseInt(priceMatch[1]) : 0);
        }, 0);

        await updateDoc(docRef, {
            totalCalories,
            totalCost
        });

        return true;
    } catch (error) {
        console.error('Error updating meal log nutrition:', error);
        return false;
    }
};

export const getMealLogDateRange = async (
    userId: string,
    startDate: string,
    endDate: string
): Promise<DailyMealLog[]> => {
    const logs: DailyMealLog[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const log = await getMealLogForDate(userId, dateStr);
        if (log) logs.push(log);
    }

    return logs;
};

export const formatDateForDisplay = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { 
        weekday: 'short', 
        day: '2-digit', 
        month: 'short' 
    });
};

export const getTodayDateString = (): string => {
    return new Date().toISOString().split('T')[0];
};

export const getMealTypeLabel = (mealType: MealType): string => {
    const labels: Record<MealType, string> = {
        breakfast: 'Breakfast',
        lunch: 'Lunch',
        dinner: 'Dinner',
        snack: 'Snack'
    };
    return labels[mealType];
};

export const getCurrentMealType = (): MealType => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 15) return 'lunch';
    if (hour >= 15 && hour < 20) return 'dinner';
    return 'snack';
};