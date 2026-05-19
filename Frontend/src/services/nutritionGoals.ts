import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { NutritionGoals, UserBodyMetrics } from '@/types/nutritionGoals';

export const getNutritionGoals = async (userId: string): Promise<NutritionGoals | null> => {
    try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data().nutritionGoals || null;
        }
        return null;
    } catch (error) {
        console.error('Error getting nutrition goals:', error);
        return null;
    }
};

export const saveNutritionGoals = async (userId: string, goals: NutritionGoals): Promise<boolean> => {
    try {
        const docRef = doc(db, 'users', userId);
        await setDoc(docRef, { nutritionGoals: goals }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error saving nutrition goals:', error);
        return false;
    }
};

export const getBodyMetrics = async (userId: string): Promise<UserBodyMetrics | null> => {
    try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data().bodyMetrics || null;
        }
        return null;
    } catch (error) {
        console.error('Error getting body metrics:', error);
        return null;
    }
};

export const saveBodyMetrics = async (userId: string, metrics: UserBodyMetrics): Promise<boolean> => {
    try {
        const docRef = doc(db, 'users', userId);
        await setDoc(docRef, { bodyMetrics: metrics }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error saving body metrics:', error);
        return false;
    }
};
