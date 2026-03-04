import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, auth } from '@/firebase';
import { Dish } from '@/types/dashboard';

export function useGloballyLikedDishes() {
    const [globallyLikedDishes, setGloballyLikedDishes] = useState<Dish[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const usersCollection = collection(db, 'users');
        const q = query(usersCollection);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            try {
                const dishMap = new Map<number, Dish>();
                const currentUserId = auth.currentUser?.uid;

                snapshot.docs.forEach(userDoc => {
                    const userData = userDoc.data();
                    const favorites: Dish[] = userData.favorites || [];

                    // Skip current user's own likes - they are handled separately
                    if (userDoc.id === currentUserId) return;

                    favorites.forEach((dish: Dish) => {
                        if (dish.id && !dishMap.has(dish.id)) {
                            dishMap.set(dish.id, dish);
                        }
                    });
                });

                setGloballyLikedDishes(Array.from(dishMap.values()));
                setError(null);
            } catch (err: any) {
                console.error('Error fetching globally liked dishes:', err);
                setError(err.message || 'Failed to fetch globally liked dishes');
            } finally {
                setLoading(false);
            }
        }, (err) => {
            console.error('Error in globally liked dishes listener:', err);
            setError(err.message || 'Failed to listen to globally liked dishes');
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { globallyLikedDishes, loading, error };
}
